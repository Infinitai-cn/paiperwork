package helpers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	domainApp "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/app"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow"
)

var (
	autoConnectWelcomeSent   = make(map[string]bool)
	autoConnectWelcomeSentMu sync.Mutex
	autoConnectAfterBootMu   sync.Mutex
	autoConnectAfterBootCtx  context.Context
	autoConnectAfterBootStop context.CancelFunc
)

func resetAutoConnectAfterBootContext() context.Context {
	autoConnectAfterBootMu.Lock()
	defer autoConnectAfterBootMu.Unlock()

	if autoConnectAfterBootStop != nil {
		autoConnectAfterBootStop()
	}

	autoConnectAfterBootCtx, autoConnectAfterBootStop = context.WithCancel(context.Background())
	return autoConnectAfterBootCtx
}

func StopAutoConnectAfterBooting() {
	autoConnectAfterBootMu.Lock()
	defer autoConnectAfterBootMu.Unlock()

	if autoConnectAfterBootStop != nil {
		autoConnectAfterBootStop()
		autoConnectAfterBootStop = nil
	}
	autoConnectAfterBootCtx = nil
}

func IsAutoConnectAfterBootingActive() bool {
	autoConnectAfterBootMu.Lock()
	defer autoConnectAfterBootMu.Unlock()
	return autoConnectAfterBootCtx != nil && autoConnectAfterBootCtx.Err() == nil
}

func sleepWithContext(ctx context.Context, wait time.Duration) bool {
	if wait <= 0 {
		return ctx == nil || ctx.Err() == nil
	}
	timer := time.NewTimer(wait)
	defer timer.Stop()

	if ctx == nil {
		<-timer.C
		return true
	}

	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func looksLikePersistentSessionDeviceID(deviceID string) bool {
	// JID-like identifiers represent persisted WhatsApp sessions; UUID-like
	// identifiers are often transient placeholders used only for fresh pairing.
	return strings.Contains(strings.TrimSpace(deviceID), "@")
}

func normalizeDeviceSelectionIdentity(deviceID string) string {
	trimmed := strings.ToLower(strings.TrimSpace(deviceID))
	if trimmed == "" {
		return ""
	}
	withoutDomain := strings.Split(trimmed, "@")[0]
	return strings.Split(withoutDomain, ":")[0]
}

func autoConnectDeviceID() string {
	deviceID := strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_DEVICE_ID"))
	if deviceID == "" {
		deviceID = strings.TrimSpace(os.Getenv("WHATSAPP_DEVICE_ID"))
	}
	return deviceID
}

func activeWhatsappUserScope() string {
	return strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_ACTIVE_USER"))
}

func newScopedWhatsappRequest(method, rawURL string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequest(method, rawURL, body)
	if err != nil {
		return nil, err
	}
	if userKey := activeWhatsappUserScope(); userKey != "" {
		req.Header.Set("X-Paiperwork-User", userKey)
	}
	return req, nil
}

func SetAutoConnectAfterBooting(service domainApp.IAppUsecase) {
	ctx := resetAutoConnectAfterBootContext()
	defer StopAutoConnectAfterBooting()
	logrus.Info("auto-connect: begin auto connect after booting")
	if whatsapp.IsFreshPairStartupRequested() {
		logrus.Info("auto-connect skipped: fresh-pair startup requested")
		return
	}
	selectedDeviceID := autoConnectDeviceID()
	if strings.EqualFold(strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_EXPECT_SESSION_RESTORE")), "true") && strings.TrimSpace(selectedDeviceID) != "" {
		maskedDeviceID := logmask.MaskPhoneNumber(selectedDeviceID)
		logrus.Infof("auto-connect: no-disk mode waiting for browser session restore for selected device %s", maskedDeviceID)
		restoreWaitDeadline := time.Now().Add(45 * time.Second)
		for strings.EqualFold(strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_EXPECT_SESSION_RESTORE")), "true") {
			if ctx.Err() != nil {
				logrus.Info("auto-connect: cancelled while waiting for browser session restore")
				return
			}
			if time.Now().After(restoreWaitDeadline) {
				logrus.Warnf("auto-connect: session restore wait timed out for selected device %s; continuing with reconnect/login recovery", maskedDeviceID)
				break
			}
			if !sleepWithContext(ctx, 2*time.Second) {
				logrus.Info("auto-connect: cancelled while waiting for browser session restore")
				return
			}
		}
	}
	if service == nil {
		logrus.Warn("auto-connect skipped: appUsecase is nil")
		return
	}

	if !sleepWithContext(ctx, 2*time.Second) {
		logrus.Info("auto-connect: cancelled before device fetch")
		return
	}
	devices, err := service.FetchDevices(ctx)
	selectedDeviceKey := normalizeDeviceSelectionIdentity(selectedDeviceID)
	if err != nil {
		if ctx.Err() != nil {
			logrus.Info("auto-connect: cancelled while fetching devices")
			return
		}
		logrus.Warnf("auto-connect failed to fetch devices: %v", err)
		return
	}
	if len(devices) == 0 {
		logrus.Warn("auto-connect skipped: no devices available")
		return
	}

	type autoconnectCandidate struct {
		device    domainApp.DevicesResponse
		connected bool
		loggedIn  bool
		statusErr error
	}

	candidates := make([]autoconnectCandidate, 0, len(devices))
	hasFullyLoggedInDevice := false
	for _, device := range devices {
		maskedDeviceID := logmask.MaskPhoneNumber(device.Device)
		if ctx.Err() != nil {
			logrus.Info("auto-connect: cancelled before preflight status checks completed")
			return
		}
		isConnected, isLoggedIn, statusErr := service.Status(ctx, device.Device)
		if statusErr != nil {
			logrus.Warnf("auto-connect preflight status check failed for device %s: %v", maskedDeviceID, statusErr)
		}
		if isConnected && isLoggedIn {
			hasFullyLoggedInDevice = true
		}
		candidates = append(candidates, autoconnectCandidate{
			device:    device,
			connected: isConnected,
			loggedIn:  isLoggedIn,
			statusErr: statusErr,
		})
	}

	for _, candidate := range candidates {
		if ctx.Err() != nil {
			logrus.Info("auto-connect: cancelled before reconnect loop completed")
			return
		}
		device := candidate.device
		maskedDeviceID := logmask.MaskPhoneNumber(device.Device)

		if !looksLikePersistentSessionDeviceID(device.Device) {
			logrus.Infof("auto-connect: skipping transient placeholder device %s until it is promoted to a paired JID", maskedDeviceID)
			continue
		}

		if hasFullyLoggedInDevice && !candidate.loggedIn && !looksLikePersistentSessionDeviceID(device.Device) {
			logrus.Infof("auto-connect: skipping placeholder candidate %s because another device is already fully logged in", maskedDeviceID)
			continue
		}

		if selectedDeviceKey != "" && normalizeDeviceSelectionIdentity(device.Device) != selectedDeviceKey {
			logrus.Infof("auto-connect: skipping non-selected device %s while selected device %s remains active", maskedDeviceID, logmask.MaskPhoneNumber(selectedDeviceID))
			continue
		}

		func() {
			defer func() {
				if recovered := recover(); recovered != nil {
					logrus.Errorf("auto-connect: recovered panic while processing device %s: %v", maskedDeviceID, recovered)
				}
			}()

			logrus.Infof("auto-connect: attempting to reconnect device %s", maskedDeviceID)
			err := service.Reconnect(ctx, device.Device)
			if err != nil {
				if ctx.Err() != nil {
					logrus.Info("auto-connect: cancelled during reconnect")
					return
				}
				logrus.Warnf("auto-connect failed for device %s: %v", maskedDeviceID, err)
				if selectedDeviceKey != "" && normalizeDeviceSelectionIdentity(device.Device) == selectedDeviceKey {
					logrus.Infof("auto-connect: selected device %s remains selected after reconnect failure; not falling through to other saved devices", maskedDeviceID)
					return
				}
				return
			}

			isConnected, isLoggedIn, statusErr := service.Status(ctx, device.Device)
			if statusErr != nil {
				logrus.Warnf("auto-connect status check failed for device %s: %v", maskedDeviceID, statusErr)
			} else {
				logrus.Debugf("auto-connect status for %s: connected=%v loggedIn=%v", maskedDeviceID, isConnected, isLoggedIn)
			}

			if isConnected && !isLoggedIn {
				// Keep calling Login until fully connected and logged-in, or until max retries.
				const maxLoginRetry = 6
				selectedDeviceOnly := selectedDeviceKey != "" && normalizeDeviceSelectionIdentity(device.Device) == selectedDeviceKey
				for attempt := 1; attempt <= maxLoginRetry; attempt++ {
					if ctx.Err() != nil {
						logrus.Info("auto-connect: cancelled during login retry loop")
						return
					}
					logrus.Debugf("auto-connect: login attempt %d/%d for device %s", attempt, maxLoginRetry, maskedDeviceID)
					loginResp, loginErr := service.Login(ctx, device.Device)
					if loginErr != nil {
						if ctx.Err() != nil {
							logrus.Info("auto-connect: cancelled during login attempt")
							return
						}
						if loginErr.Error() == "you are already logged in." {
							logrus.Infof("auto-connect login attempt %d for device %s reports already logged in", attempt, maskedDeviceID)
						} else if loginErr.Error() == "your session have been saved, please wait to connect 2 second and refresh again" || loginErr.Error() == "SESSION_SAVED_ERROR" {
							logrus.Debugf("auto-connect login attempt %d for device %s: session warming up, pause 5s", attempt, maskedDeviceID)
							if !sleepWithContext(ctx, 5*time.Second) {
								logrus.Info("auto-connect: cancelled during session warmup wait")
								return
							}
							continue
						} else {
							logrus.Warnf("auto-connect login attempt %d failed for device %s: %v", attempt, maskedDeviceID, loginErr)
						}
					} else {
						logrus.Debugf("auto-connect login attempt %d for device %s succeeded (qr_duration=%d)", attempt, maskedDeviceID, int64(loginResp.Duration/time.Second))
					}

					isConnected, isLoggedIn, statusErr = service.Status(ctx, device.Device)
					if statusErr != nil {
						logrus.Warnf("auto-connect status check failed after login for device %s: %v", maskedDeviceID, statusErr)
					} else {
						logrus.Debugf("auto-connect status for %s after login attempt %d: connected=%v loggedIn=%v", maskedDeviceID, attempt, isConnected, isLoggedIn)
					}

					if selectedDeviceOnly && attempt == maxLoginRetry && !(isConnected && isLoggedIn) {
						logrus.Infof("auto-connect: selected device %s did not reach logged-in state after login retries; not falling through to other devices", maskedDeviceID)
						return
					}

					if isConnected && isLoggedIn {
						logrus.Infof("auto-connect: device %s is now fully connected and logged in", maskedDeviceID)
						hasFullyLoggedInDevice = true
						break
					}

					if attempt < maxLoginRetry && !sleepWithContext(ctx, 2*time.Second) {
						logrus.Info("auto-connect: cancelled during retry delay")
						return
					}
				}
			}

			if isConnected && isLoggedIn {
				hasFullyLoggedInDevice = true
				SendWhatsappWelcomeText(device.Device)
			}

			logrus.Infof("auto-connected device %s", maskedDeviceID)
		}()
	}
	logrus.Info("auto-connect: completed auto connect after booting")
}

func SendWhatsappWelcomeText(deviceID string) {
	autoConnectWelcomeSentMu.Lock()
	if autoConnectWelcomeSent[deviceID] {
		autoConnectWelcomeSentMu.Unlock()
		return
	}
	autoConnectWelcomeSent[deviceID] = true
	autoConnectWelcomeSentMu.Unlock()

	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Get("http://127.0.0.1:3000/devices")
	if err != nil {
		logrus.Warnf("SendWhatsappWelcomeText: failed to query devices: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		logrus.Warnf("SendWhatsappWelcomeText: devices endpoint status=%d", resp.StatusCode)
		return
	}

	var devicesResp struct {
		Results []struct {
			PhoneNumber string `json:"phone_number"`
			JID         string `json:"jid"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&devicesResp); err != nil {
		logrus.Warnf("SendWhatsappWelcomeText: failed to decode devices response: %v", err)
		return
	}

	if len(devicesResp.Results) == 0 {
		logrus.Warn("SendWhatsappWelcomeText: no device found in /devices response")
		return
	}

	target := strings.TrimSpace(devicesResp.Results[0].PhoneNumber)
	if target == "" {
		if devicesResp.Results[0].JID != "" {
			parts := strings.Split(devicesResp.Results[0].JID, "@")
			if len(parts) > 0 {
				target = strings.TrimSpace(parts[0])
			}
		}
	}

	if target == "" {
		logrus.Warn("SendWhatsappWelcomeText: no target phone could be inferred")
		return
	}

	bodyBytes, err := json.Marshal(map[string]any{
		"phone":   target,
		"message": "👋 Paiperwork is now connected and ready to chat.",
	})
	if err != nil {
		logrus.Warnf("SendWhatsappWelcomeText: failed to marshal payload: %v", err)
		return
	}

	request, err := newScopedWhatsappRequest(http.MethodPost, "http://127.0.0.1:8182/api/whatsapp/send", bytes.NewReader(bodyBytes))
	if err != nil {
		logrus.Warnf("SendWhatsappWelcomeText: failed to build welcome API request: %v", err)
		return
	}
	request.Header.Set("Content-Type", "application/json")

	resp, err = client.Do(request)
	if err != nil {
		logrus.Warnf("SendWhatsappWelcomeText: failed to send welcome via API: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.Warnf("SendWhatsappWelcomeText: send API status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
		return
	}

	masked := target
	if len(masked) > 6 {
		masked = "*****" + masked[len(masked)-6:]
	}
	logrus.Infof("SendWhatsappWelcomeText: welcome message sent to %s", masked)
}

func SetAutoReconnectChecking(cli *whatsmeow.Client) {
	if cli == nil {
		logrus.Warn("SetAutoReconnectChecking was called with a nil WhatsApp client; skipping auto-reconnect loop")
		return
	}
	whatsapp.StartAutoReconnectChecker(cli)
}
func MultipartFormFileHeaderToBytes(fileHeader *multipart.FileHeader) []byte {
	file, _ := fileHeader.Open()
	defer file.Close()

	fileBytes := make([]byte, fileHeader.Size)
	_, _ = file.Read(fileBytes)

	return fileBytes
}

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

func SetAutoConnectAfterBooting(service domainApp.IAppUsecase) {
	ctx := resetAutoConnectAfterBootContext()
	defer StopAutoConnectAfterBooting()
	logrus.Info("auto-connect: begin auto connect after booting")
	if service == nil {
		logrus.Warn("auto-connect skipped: appUsecase is nil")
		return
	}

	if !sleepWithContext(ctx, 2*time.Second) {
		logrus.Info("auto-connect: cancelled before device fetch")
		return
	}
	devices, err := service.FetchDevices(ctx)
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

		// Fallback: use preferred WhatsApp device from server persisted state.
		// Wait briefly for the saved preferred-device state to become available
		// (especially after a restart where in-memory map may be empty).
		for attempt := 0; attempt < 6 && len(devices) == 0; attempt++ {
			if ctx.Err() != nil {
				logrus.Info("auto-connect: cancelled during preferred-device fallback")
				return
			}
			prefResp, err := http.Get("http://127.0.0.1:3000/api/whatsapp/preferred-device")
			if err != nil {
				logrus.Warnf("auto-connect fallback preferred-device request failed: %v", err)
			} else if prefResp.StatusCode == http.StatusOK {
				var prefs map[string]map[string]string
				if err := json.NewDecoder(prefResp.Body).Decode(&prefs); err == nil {
					for _, record := range prefs {
						if record != nil && strings.TrimSpace(record["device_id"]) != "" {
							devices = append(devices, domainApp.DevicesResponse{Device: strings.TrimSpace(record["device_id"]), Name: record["meta"]})
							break
						}
					}
				}
				prefResp.Body.Close()
			}

			if len(devices) == 0 {
				// Also check local fallback (likely set through whatsappQrProxy env mapping)
				fallbackID := strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID"))
				if fallbackID == "" {
					fallbackID = strings.TrimSpace(os.Getenv("WHATSAPP_PREFERRED_DEVICE_ID"))
				}
				if fallbackID != "" {
					devices = append(devices, domainApp.DevicesResponse{Device: fallbackID, Name: "preferred"})
				}
			}

			if len(devices) == 0 && !sleepWithContext(ctx, 300*time.Millisecond) {
				logrus.Info("auto-connect: cancelled during preferred-device retry wait")
				return
			}
		}

		if len(devices) == 0 {
			return
		}
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
		if ctx.Err() != nil {
			logrus.Info("auto-connect: cancelled before preflight status checks completed")
			return
		}
		isConnected, isLoggedIn, statusErr := service.Status(ctx, device.Device)
		if statusErr != nil {
			logrus.Warnf("auto-connect preflight status check failed for device %s: %v", device.Device, statusErr)
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

		if hasFullyLoggedInDevice && !candidate.loggedIn && !looksLikePersistentSessionDeviceID(device.Device) {
			logrus.Infof("auto-connect: skipping placeholder candidate %s because another device is already fully logged in", device.Device)
			continue
		}

		func() {
			defer func() {
				if recovered := recover(); recovered != nil {
					logrus.Errorf("auto-connect: recovered panic while processing device %s: %v", device.Device, recovered)
				}
			}()

			logrus.Infof("auto-connect: attempting to reconnect device %s", device.Device)
			err := service.Reconnect(ctx, device.Device)
			if err != nil {
				if ctx.Err() != nil {
					logrus.Info("auto-connect: cancelled during reconnect")
					return
				}
				logrus.Warnf("auto-connect failed for device %s: %v", device.Device, err)
				return
			}

			isConnected, isLoggedIn, statusErr := service.Status(ctx, device.Device)
			if statusErr != nil {
				logrus.Warnf("auto-connect status check failed for device %s: %v", device.Device, statusErr)
			} else {
				logrus.Debugf("auto-connect status for %s: connected=%v loggedIn=%v", device.Device, isConnected, isLoggedIn)
			}

			if isConnected && !isLoggedIn {
				// Keep calling Login until fully connected and logged-in, or until max retries.
				const maxLoginRetry = 6
				for attempt := 1; attempt <= maxLoginRetry; attempt++ {
					if ctx.Err() != nil {
						logrus.Info("auto-connect: cancelled during login retry loop")
						return
					}
					logrus.Debugf("auto-connect: login attempt %d/%d for device %s", attempt, maxLoginRetry, device.Device)
					loginResp, loginErr := service.Login(ctx, device.Device)
					if loginErr != nil {
						if ctx.Err() != nil {
							logrus.Info("auto-connect: cancelled during login attempt")
							return
						}
						if loginErr.Error() == "your session have been saved, please wait to connect 2 second and refresh again" || loginErr.Error() == "SESSION_SAVED_ERROR" {
							logrus.Debugf("auto-connect login attempt %d for device %s: session warming up, pause 5s", attempt, device.Device)
							if !sleepWithContext(ctx, 5*time.Second) {
								logrus.Info("auto-connect: cancelled during session warmup wait")
								return
							}
							continue
						}
						logrus.Warnf("auto-connect login attempt %d failed for device %s: %v", attempt, device.Device, loginErr)
					} else {
						logrus.Debugf("auto-connect login attempt %d for device %s succeeded (qr_duration=%d)", attempt, device.Device, int64(loginResp.Duration/time.Second))
					}

					isConnected, isLoggedIn, statusErr = service.Status(ctx, device.Device)
					if statusErr != nil {
						logrus.Warnf("auto-connect status check failed after login for device %s: %v", device.Device, statusErr)
					} else {
						logrus.Debugf("auto-connect status for %s after login attempt %d: connected=%v loggedIn=%v", device.Device, attempt, isConnected, isLoggedIn)
					}

					if isConnected && isLoggedIn {
						logrus.Infof("auto-connect: device %s is now fully connected and logged in", device.Device)
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
			}

			logrus.Infof("auto-connected device %s", device.Device)
		}()
	}
	logrus.Info("auto-connect: completed auto connect after booting")
}

func sendWhatsappWelcomeText(deviceID string) {
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
		logrus.Warnf("sendWhatsappWelcomeText: failed to query devices: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		logrus.Warnf("sendWhatsappWelcomeText: devices endpoint status=%d", resp.StatusCode)
		return
	}

	var devicesResp struct {
		Results []struct {
			PhoneNumber string `json:"phone_number"`
			JID         string `json:"jid"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&devicesResp); err != nil {
		logrus.Warnf("sendWhatsappWelcomeText: failed to decode devices response: %v", err)
		return
	}

	if len(devicesResp.Results) == 0 {
		logrus.Warn("sendWhatsappWelcomeText: no device found in /devices response")
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
		logrus.Warn("sendWhatsappWelcomeText: no target phone could be inferred")
		return
	}

	bodyBytes, err := json.Marshal(map[string]any{
		"phone":   target,
		"message": "👋 Paiperwork is now connected and ready to chat.",
	})
	if err != nil {
		logrus.Warnf("sendWhatsappWelcomeText: failed to marshal payload: %v", err)
		return
	}

	resp, err = client.Post("http://127.0.0.1:8182/api/whatsapp/send", "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		logrus.Warnf("sendWhatsappWelcomeText: failed to send welcome via API: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logrus.Warnf("sendWhatsappWelcomeText: send API status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
		return
	}

	masked := target
	if len(masked) > 6 {
		masked = "*****" + masked[len(masked)-6:]
	}
	logrus.Infof("sendWhatsappWelcomeText: welcome message sent to %s", masked)
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

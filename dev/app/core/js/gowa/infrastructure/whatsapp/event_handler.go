package whatsapp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	domainDevice "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/device"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/appstate"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
)

// handler is the main event handler for WhatsApp events, scoped to a device instance.
func handler(ctx context.Context, instance *DeviceInstance, rawEvt any) {
	if instance == nil {
		return
	}

	// Ensure downstream handlers see the device context (used for device-scoped storage).
	ctx = ContextWithDevice(ctx, instance)

	chatStorageRepo := instance.GetChatStorage()
	client := instance.GetClient()

	switch evt := rawEvt.(type) {
	case *events.DeleteForMe:
		handleDeleteForMe(ctx, evt, chatStorageRepo, instance.JID(), client)
	case *events.AppStateSyncComplete:
		// AppState sync completion is only meaningful when WhatsApp app-state sync is enabled.
		// We do not plan to sync user WhatsApp state in this deployment, so ignore these events.
		if config.WhatsappAppStateSyncEnabled {
			handleAppStateSyncComplete(ctx, client, evt)
		}
	case *events.PairSuccess:
		handlePairSuccess(ctx, evt)
	case *events.LoggedOut:
		handleLoggedOut(ctx, instance, chatStorageRepo)
	case *events.Connected, *events.PushNameSetting:
		handleConnectionEvents(ctx, client, instance)
	case *events.StreamReplaced:
		handleStreamReplaced(ctx)
	case *events.Message:
		handleMessage(ctx, evt, chatStorageRepo, client)
	case *events.Receipt:
		handleReceipt(ctx, evt, instance.JID(), client)
	case *events.Archive:
		handleArchive(ctx, evt, chatStorageRepo, client)
	case *events.Presence:
		handlePresence(ctx, evt)
	case *events.ChatPresence:
		handleChatPresence(ctx, evt, instance.JID(), client)
	case *events.HistorySync:
		if config.HistorySyncEnabled {
			handleHistorySync(ctx, evt, chatStorageRepo, client)
		} else {
			log.Infof("Skipping HistorySync event because history sync is disabled")
		}
	case *events.AppState:
		// AppState events belong to WhatsApp's internal state sync machinery.
		// We do not use WhatsApp app-state sync for user sync in Paiperwork,
		// so ignore these events to avoid noisy sync-related processing.
		if config.WhatsappAppStateSyncEnabled {
			handleAppState(ctx, evt)
		}
	case *events.GroupInfo:
		handleGroupInfo(ctx, evt, instance.JID(), client)
	case *events.JoinedGroup:
		handleJoinedGroup(ctx, evt, instance.JID(), client)
	case *events.NewsletterJoin:
		handleNewsletterJoin(ctx, evt, instance.JID(), client)
	case *events.NewsletterLeave:
		handleNewsletterLeave(ctx, evt, instance.JID(), client)
	case *events.NewsletterLiveUpdate:
		handleNewsletterLiveUpdate(ctx, evt, instance.JID(), client)
	case *events.NewsletterMuteChange:
		handleNewsletterMuteChange(ctx, evt, instance.JID(), client)
	case *events.CallOffer:
		handleCallOffer(ctx, evt, chatStorageRepo, instance.JID(), client)
	}

	instance.UpdateStateFromClient()
}

func handleDeleteForMe(ctx context.Context, evt *events.DeleteForMe, chatStorageRepo domainChatStorage.IChatStorageRepository, deviceID string, client *whatsmeow.Client) {
	_ = ctx
	log.Infof("Deleted message %s for %s", evt.MessageID, evt.SenderJID.String())

	// Find the message to get its chat JID
	message, err := chatStorageRepo.GetMessageByID(evt.MessageID)
	if err != nil {
		log.Errorf("Failed to find message %s for deletion: %v", evt.MessageID, err)
		return
	}

	if message == nil {
		log.Warnf("Message %s not found in database, skipping deletion", evt.MessageID)
		return
	}

	// Delete the message from database
	if err := chatStorageRepo.DeleteMessage(evt.MessageID, message.ChatJID); err != nil {
		log.Errorf("Failed to delete message %s from database: %v", evt.MessageID, err)
	} else {
		log.Infof("Successfully deleted message %s from database", evt.MessageID)
	}

	// Send webhook notification for delete event
	if len(config.WhatsappWebhook) > 0 {
		go func(c *whatsmeow.Client) {
			webhookCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := forwardDeleteToWebhook(webhookCtx, evt, message, deviceID, c); err != nil {
				log.Errorf("Failed to forward delete event to webhook: %v", err)
			}
		}(client)
	}
}

func resolvePresenceOnConnect() (types.Presence, bool) {
	switch config.WhatsappPresenceOnConnect {
	case "available":
		return types.PresenceAvailable, false
	case "none":
		return "", true
	default:
		return types.PresenceUnavailable, false
	}
}

func sendConfiguredPresence(ctx context.Context, client *whatsmeow.Client) {
	presence, skip := resolvePresenceOnConnect()
	if skip {
		log.Infof("Skipping presence on connect (configured: none)")
		return
	}
	if err := client.SendPresence(ctx, presence); err != nil {
		log.Warnf("Failed to send %s presence: %v", presence, err)
	} else {
		log.Infof("Marked self as %s", presence)
	}
}

func handleAppStateSyncComplete(_ context.Context, client *whatsmeow.Client, evt *events.AppStateSyncComplete) {
	if client == nil {
		return
	}
	if len(client.Store.PushName) > 0 && evt.Name == appstate.WAPatchCriticalBlock {
		sendConfiguredPresence(context.Background(), client)
	}
}

func handlePairSuccess(ctx context.Context, evt *events.PairSuccess) {
	result := map[string]any{
		"jid": evt.ID.String(),
	}
	if inst, ok := DeviceFromContext(ctx); ok && inst != nil {
		if deviceID := strings.TrimSpace(inst.ID()); deviceID != "" {
			result["device_id"] = deviceID
		}
	}
	websocket.Broadcast <- websocket.BroadcastMessage{
		Code:    "LOGIN_SUCCESS",
		Message: fmt.Sprintf("Successfully pair with %s", evt.ID.String()),
		Result:  result,
	}
	primaryDB, secondaryDB := getStoreContainers()
	syncKeysDevice(ctx, primaryDB, secondaryDB)
}

func sendWelcomeAfterPairSuccess(ctx context.Context, evt *events.PairSuccess) {
	if evt == nil {
		return
	}
	client := ClientFromContext(ctx)

	jid := strings.TrimSpace(evt.ID.String())
	if jid == "" {
		return
	}

	// Extract phone from PairSuccess JID like "8618...:35@s.whatsapp.net".
	phone := jid
	if at := strings.Index(phone, "@"); at > 0 {
		phone = phone[:at]
	}
	if colon := strings.Index(phone, ":"); colon > 0 {
		phone = phone[:colon]
	}
	phone = strings.TrimSpace(phone)
	if phone == "" {
		logrus.Warnf("[WELCOME] PairSuccess phone extraction failed for jid=%q", jid)
		return
	}

	// PairSuccess can fire slightly before the client is fully send-ready.
	// Wait for the local client state to settle so we don't trip the
	// "you are not logged in" middleware path on the first welcome send.
	for attempt := 1; attempt <= 8; attempt++ {
		if client != nil && client.Store != nil && client.Store.ID != nil && client.IsConnected() && client.IsLoggedIn() {
			break
		}
		if attempt == 8 {
			logrus.Warnf("[WELCOME] skipping PairSuccess welcome for phone=%s because client is not fully logged in yet", phone)
			return
		}
		time.Sleep(1 * time.Second)
	}

	payload := map[string]string{
		"phone":   phone,
		"message": "👋 Paiperwork is now connected and ready to chat.",
	}
	body, err := json.Marshal(payload)
	if err != nil {
		logrus.Warnf("[WELCOME] marshal failed after PairSuccess: %v", err)
		return
	}

	req, err := http.NewRequest(http.MethodPost, "http://127.0.0.1:3000/send/message", bytes.NewReader(body))
	if err != nil {
		logrus.Warnf("[WELCOME] request create failed after PairSuccess: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		logrus.Warnf("[WELCOME] send failed after PairSuccess phone=%s: %v", phone, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		logrus.Warnf("[WELCOME] send returned status=%d after PairSuccess phone=%s body=%s", resp.StatusCode, phone, strings.TrimSpace(string(bodyBytes)))
		return
	}

	masked := phone
	if len(masked) > 4 {
		masked = strings.Repeat("*", len(masked)-4) + masked[len(masked)-4:]
	}
	logrus.Infof("[WELCOME] welcome message sent after PairSuccess to %s", masked)
}

func handleLoggedOut(ctx context.Context, instance *DeviceInstance, chatStorageRepo domainChatStorage.IChatStorageRepository) {
	_ = ctx
	logrus.Warnf("[REMOTE_LOGOUT] Received LoggedOut event for device %s - user logged out from phone", instance.ID())

	if client := instance.GetClient(); client != nil {
		client.Disconnect()
	}
	instance.SetState(domainDevice.DeviceStateDisconnected)

	if chatStorageRepo != nil {
		if err := chatStorageRepo.TruncateAllDataWithLogging("REMOTE_LOGOUT"); err != nil {
			logrus.Errorf("[REMOTE_LOGOUT] Failed to truncate chat storage: %v", err)
		}
	}

	deviceID := instance.ID()

	instance.TriggerLoggedOut()

	websocket.Broadcast <- websocket.BroadcastMessage{
		Code:    "REMOTE_LOGOUT",
		Message: "Remote logout cleanup completed - device removed from server",
		Result: map[string]string{
			"device_id": deviceID,
			"reason":    "remote_logout",
		},
	}
}

func handleConnectionEvents(_ context.Context, client *whatsmeow.Client, instance *DeviceInstance) {
	if client == nil {
		return
	}
	if instance != nil {
		instance.UpdateStateFromClient()

		// Persist updated JID/DisplayName to database after successful connection
		// Skip if instance.ID looks like a JID (auto-created device) to avoid recreating deleted duplicates
		if repo := instance.GetChatStorage(); repo != nil && !strings.Contains(instance.ID(), "@") {
			jid := instance.JID()
			displayName := instance.DisplayName()
			if jid != "" {
				if err := repo.SaveDeviceRecord(&domainChatStorage.DeviceRecord{
					DeviceID:    instance.ID(),
					DisplayName: displayName,
					JID:         jid,
					CreatedAt:   instance.CreatedAt(),
				}); err != nil {
					log.Warnf("Failed to persist device record for %s: %v", instance.ID(), err)
				}
			}
		}

		if dm := GetDeviceManager(); dm != nil {
			dm.pruneStaleRecordsForLoggedInInstance(instance)
		}
	}
	if len(client.Store.PushName) == 0 {
		return
	}

	if client.IsConnected() && client.IsLoggedIn() {
		deviceID := ""
		if instance != nil {
			deviceID = instance.ID()
		}
		websocket.Broadcast <- websocket.BroadcastMessage{
			Code:    "LOGGED_IN",
			Message: fmt.Sprintf("WhatsApp connected for device %s", deviceID),
			Result:  map[string]any{"device_id": deviceID},
		}
	}

	// Send configured presence when connecting and when the pushname is changed.
	// This makes sure that outgoing messages always have the right pushname.
	sendConfiguredPresence(context.Background(), client)
}

func handleStreamReplaced(_ context.Context) {
	os.Exit(0)
}

func handleReceipt(ctx context.Context, evt *events.Receipt, deviceID string, client *whatsmeow.Client) {
	_ = ctx
	sendReceipt := false
	switch evt.Type {
	case types.ReceiptTypeRead, types.ReceiptTypeReadSelf:
		sendReceipt = true
		log.Infof("%v was read by %s at %s: %+v", evt.MessageIDs, evt.SourceString(), evt.Timestamp, evt)
	case types.ReceiptTypeDelivered:
		sendReceipt = true
		log.Infof("%s was delivered to %s at %s: %+v", evt.MessageIDs[0], evt.SourceString(), evt.Timestamp, evt)
	}

	// Forward receipt (ack) event to webhook if configured
	// Note: Receipt events are not rate limited as they are critical for message delivery status
	if len(config.WhatsappWebhook) > 0 && sendReceipt {
		go func(e *events.Receipt, c *whatsmeow.Client) {
			webhookCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := forwardReceiptToWebhook(webhookCtx, e, deviceID, c); err != nil {
				logrus.Errorf("Failed to forward ack event to webhook: %v", err)
			}
		}(evt, client)
	}
}

func handlePresence(_ context.Context, evt *events.Presence) {
	if evt.Unavailable {
		if evt.LastSeen.IsZero() {
			log.Infof("%s is now offline", evt.From)
		} else {
			log.Infof("%s is now offline (last seen: %s)", evt.From, evt.LastSeen)
		}
	} else {
		log.Infof("%s is now online", evt.From)
	}
}

func handleAppState(_ context.Context, evt *events.AppState) {
	log.Debugf("App state event: %+v / %+v", evt.Index, evt.SyncActionValue)
}

func handleGroupInfo(ctx context.Context, evt *events.GroupInfo, deviceID string, client *whatsmeow.Client) {
	_ = ctx
	// Only process events that have actual changes
	hasChanges := len(evt.Join) > 0 || len(evt.Leave) > 0 || len(evt.Promote) > 0 || len(evt.Demote) > 0 ||
		evt.Name != nil || evt.Topic != nil || evt.Locked != nil || evt.Announce != nil

	if !hasChanges {
		return
	}

	// Log group events for debugging
	if len(evt.Join) > 0 {
		log.Infof("Group %s: %d users joined at %s", evt.JID, len(evt.Join), evt.Timestamp)
	}
	if len(evt.Leave) > 0 {
		log.Infof("Group %s: %d users left at %s", evt.JID, len(evt.Leave), evt.Timestamp)
	}
	if len(evt.Promote) > 0 {
		log.Infof("Group %s: %d users promoted at %s", evt.JID, len(evt.Promote), evt.Timestamp)
	}
	if len(evt.Demote) > 0 {
		log.Infof("Group %s: %d users demoted at %s", evt.JID, len(evt.Demote), evt.Timestamp)
	}

	// Forward group info event to webhook if configured
	if len(config.WhatsappWebhook) > 0 {
		go func(e *events.GroupInfo, c *whatsmeow.Client) {
			webhookCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := forwardGroupInfoToWebhook(webhookCtx, e, deviceID, c); err != nil {
				logrus.Errorf("Failed to forward group info event to webhook: %v", err)
			}
		}(evt, client)
	}
}

package app

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/lich0821/wcfLink/internal/config"
	"github.com/lich0821/wcfLink/internal/httpapi"
	"github.com/lich0821/wcfLink/internal/ilink"
	"github.com/lich0821/wcfLink/internal/model"
	"github.com/lich0821/wcfLink/internal/store"
	"github.com/lich0821/wcfLink/internal/worker"
)

type App struct {
	cfg     config.Config
	logger  *slog.Logger
	store   *store.Store
	client  *ilink.Client
	pollers *worker.PollerManager
	server  *http.Server
	runtime *runtimeState
	svc     *service
}

func New(ctx context.Context, cfg config.Config, logger *slog.Logger) (*App, error) {
	st, err := store.New(ctx, cfg.StateDir)
	if err != nil {
		return nil, err
	}
	client := ilink.NewClient(cfg.ChannelVersion, cfg.PollTimeout+10*time.Second)
	runtime := newRuntimeState(st, cfg)
	svc := &service{
		cfg:     cfg,
		logger:  logger,
		store:   st,
		client:  client,
		runtime: runtime,
	}
	pollers := worker.NewPollerManager(st, client, logger, svc.HandleInboundMessage)
	svc.pollers = pollers
	api := httpapi.NewServer(&service{
		cfg:     cfg,
		logger:  logger,
		store:   st,
		client:  client,
		pollers: pollers,
		runtime: runtime,
	}, logger)

	return &App{
		cfg:     cfg,
		logger:  logger,
		store:   st,
		client:  client,
		pollers: pollers,
		runtime: runtime,
		svc:     svc,
		server: &http.Server{
			Addr:              cfg.ListenAddr,
			Handler:           api.Handler(),
			ReadHeaderTimeout: 10 * time.Second,
		},
	}, nil
}

func (a *App) Run(ctx context.Context) error {
	if err := a.StartBackground(ctx); err != nil {
		return err
	}

	<-ctx.Done()
	a.logger.Info("shutdown requested")
	return a.Shutdown()
}
func (a *App) StartBackground(ctx context.Context) error {
	a.logger.Info("wcfLink startup: beginning background startup")
	if err := a.store.Ping(ctx); err != nil {
		a.logger.Error("wcfLink startup: database ping failed", "err", err)
		return err
	}
	a.logger.Info("wcfLink startup: database backend healthy")
	if err := a.pollers.StartEnabledAccounts(ctx); err != nil {
		a.logger.Error("wcfLink startup: failed to start enabled account pollers", "err", err)
		return err
	}
	a.logger.Info("wcfLink startup: background services started")

	go func() {
		a.logger.Info("http server listening", "addr", a.cfg.ListenAddr)
		if err := a.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			a.logger.Error("http server stopped with error", "err", err)
		}
	}()
	return nil
}

func (a *App) Shutdown() error {
	a.pollers.StopAll()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = a.server.Shutdown(shutdownCtx)
	return a.store.Close()
}

func (a *App) StartLogin(ctx context.Context, baseURL string) (model.LoginSession, error) {
	return a.svc.StartLogin(ctx, baseURL)
}

func (a *App) GetLoginStatus(ctx context.Context, sessionID string) (model.LoginSession, error) {
	return a.svc.GetLoginStatus(ctx, sessionID)
}

func (a *App) GetLoginSession(ctx context.Context, sessionID string) (model.LoginSession, error) {
	return a.svc.GetLoginSession(ctx, sessionID)
}

func (a *App) RestoreAccounts(ctx context.Context, accounts []model.Account) error {
	return a.svc.RestoreAccounts(ctx, accounts)
}

func (a *App) ListAccounts(ctx context.Context) ([]model.Account, error) {
	return a.svc.ListAccounts(ctx)
}

func (a *App) ListEvents(ctx context.Context, afterID int64, limit int) ([]model.Event, error) {
	return a.svc.ListEvents(ctx, afterID, limit)
}

func (a *App) ListLogs(ctx context.Context, afterID int64, limit int) ([]model.LogEntry, error) {
	return a.svc.ListLogs(ctx, afterID, limit)
}

func (a *App) ListLoginSessions(ctx context.Context, limit int) ([]model.LoginSession, error) {
	return a.svc.ListLoginSessions(ctx, limit)
}

func (a *App) ListPeerContexts(ctx context.Context, limit int) ([]model.PeerContext, error) {
	return a.svc.ListPeerContexts(ctx, limit)
}

func (a *App) GetSettings(ctx context.Context) (model.Settings, error) {
	return a.svc.GetSettings(ctx)
}

func (a *App) UpdateSettings(ctx context.Context, settings model.Settings) (model.Settings, error) {
	return a.svc.UpdateSettings(ctx, settings)
}

func (a *App) SendText(ctx context.Context, accountID, toUserID, text, contextToken string) error {
	return a.svc.SendText(ctx, accountID, toUserID, text, contextToken)
}

func (a *App) SendMedia(ctx context.Context, accountID, toUserID, mediaType, filePath, text, contextToken string) error {
	return a.svc.SendMedia(ctx, accountID, toUserID, mediaType, filePath, text, contextToken)
}

func (a *App) LogoutAccount(ctx context.Context, accountID string) error {
	return a.svc.LogoutAccount(ctx, accountID)
}

type service struct {
	cfg     config.Config
	logger  *slog.Logger
	store   *store.Store
	client  *ilink.Client
	pollers *worker.PollerManager
	runtime *runtimeState
}

func (s *service) StartLogin(ctx context.Context, baseURL string) (model.LoginSession, error) {
	if baseURL == "" {
		baseURL = s.cfg.DefaultBaseURL
	}
	qr, err := s.client.FetchQRCode(ctx, baseURL)
	if err != nil {
		return model.LoginSession{}, err
	}
	now := time.Now().UTC()
	session := model.LoginSession{
		SessionID: fmt.Sprintf("login_%d", now.UnixNano()),
		BaseURL:   baseURL,
		QRCode:    qr.QRCode,
		QRCodeURL: qr.QRCodeURL,
		Status:    "wait",
		StartedAt: now,
		UpdatedAt: now,
	}
	if err := s.store.CreateLoginSession(ctx, session); err != nil {
		return model.LoginSession{}, err
	}
	s.logger.Info("Paiperworkdb: created WeChat login session", "session_id", session.SessionID)
	return session, nil
}

func (s *service) GetLoginStatus(ctx context.Context, sessionID string) (model.LoginSession, error) {
	session, err := s.store.GetLoginSession(ctx, sessionID)
	if err != nil {
		return model.LoginSession{}, err
	}
	if session.Status == "confirmed" {
		return session, nil
	}
	status, err := s.client.FetchQRCodeStatus(ctx, session.BaseURL, session.QRCode)
	if err != nil {
		_ = s.store.UpdateLoginSessionStatus(context.Background(), sessionID, session.Status, err.Error())
		return model.LoginSession{}, err
	}
	if status.Status == "" {
		return session, nil
	}
	if status.Status == "confirmed" {
		if err := s.store.CompleteLoginSession(ctx, sessionID, status); err != nil {
			return model.LoginSession{}, err
		}
		s.logger.Info("Paiperworkdb: completed WeChat login session", "session_id", sessionID, "account_id", status.AccountID)
		account, err := s.store.GetAccount(ctx, status.AccountID)
		if err == nil {
			s.pollers.StartAccount(context.Background(), account)
		}
		return s.store.GetLoginSession(ctx, sessionID)
	}
	if err := s.store.UpdateLoginSessionStatus(ctx, sessionID, status.Status, ""); err != nil {
		return model.LoginSession{}, err
	}
	return s.store.GetLoginSession(ctx, sessionID)
}

func (s *service) GetLoginSession(ctx context.Context, sessionID string) (model.LoginSession, error) {
	return s.store.GetLoginSession(ctx, sessionID)
}

func (s *service) ListAccounts(ctx context.Context) ([]model.Account, error) {
	return s.store.ListAccounts(ctx)
}

func (s *service) RestoreAccounts(ctx context.Context, accounts []model.Account) error {
	for _, account := range accounts {
		if account.LoginStatus == "" {
			account.LoginStatus = "connected"
		}
		if err := s.store.UpsertAccount(ctx, account); err != nil {
			return err
		}
		if account.Enabled && account.Token != "" {
			s.pollers.StartAccount(context.Background(), account)
		}
	}
	return nil
}

func (s *service) ListLogs(ctx context.Context, afterID int64, limit int) ([]model.LogEntry, error) {
	return s.store.ListLogs(ctx, afterID, limit)
}

func (s *service) ListLoginSessions(ctx context.Context, limit int) ([]model.LoginSession, error) {
	return s.store.ListLoginSessions(ctx, limit)
}

func (s *service) ListPeerContexts(ctx context.Context, limit int) ([]model.PeerContext, error) {
	return s.store.ListPeerContexts(ctx, limit)
}

func (s *service) ListEvents(ctx context.Context, afterID int64, limit int) ([]model.Event, error) {
	events, err := s.store.ListEvents(ctx, afterID, limit)
	if err != nil {
		s.logger.Error("wcfLink.ListEvents failed", "after_id", afterID, "limit", limit, "err", err)
		return nil, err
	}
	if events == nil {
		events = []model.Event{}
	}
	return events, nil
}

func (s *service) GetSettings(ctx context.Context) (model.Settings, error) {
	_ = ctx
	return s.runtime.Settings(), nil
}

func (s *service) UpdateSettings(ctx context.Context, settings model.Settings) (model.Settings, error) {
	// Persist settings in runtime only. Application-level settings storage
	// is handled by PaiperworkDB, so no local settings.json file is created.
	if err := s.runtime.UpdateSettings(ctx, settings); err != nil {
		return model.Settings{}, err
	}
	return s.runtime.Settings(), nil
}

func (s *service) LogoutAccount(ctx context.Context, accountID string) error {
	s.pollers.StopAccount(accountID)
	if err := s.store.DeleteAccount(ctx, accountID); err != nil {
		return err
	}
	_ = s.store.AddLog(context.Background(), "INFO", "account disconnected locally", "account", fmt.Sprintf(`{"account_id":%q}`, accountID))
	return nil
}

func (s *service) SendText(ctx context.Context, accountID, toUserID, text, contextToken string) error {
	account, err := s.store.GetAccount(ctx, accountID)
	if err != nil {
		return err
	}
	contextToken, err = s.resolveContextToken(ctx, accountID, toUserID, contextToken)
	if err != nil {
		return err
	}
	if strings.TrimSpace(contextToken) == "" {
		return errors.New("context token not found for this user; current text sending only supports replying to users who have already sent a message")
	}
	if err := s.client.SendTextMessage(ctx, account.BaseURL, account.Token, toUserID, text, contextToken); err != nil {
		_ = s.store.AddLog(context.Background(), "ERROR", "outbound send failed", "message", fmt.Sprintf(`{"account_id":%q,"to_user_id":%q,"err":%q}`, accountID, toUserID, err.Error()))
		return err
	}
	raw := fmt.Sprintf(`{"to_user_id":%q,"text":%q,"context_token":%q}`, toUserID, text, contextToken)
	if err := s.store.CreateOutboundEvent(ctx, accountID, "text", toUserID, contextToken, text, "", "", "", raw); err != nil {
		return err
	}
	_ = s.store.AddLog(context.Background(), "INFO", "outbound text sent", "message", raw)
	return nil
}

func (s *service) SendMedia(ctx context.Context, accountID, toUserID, mediaType, filePath, text, contextToken string) error {
	account, err := s.store.GetAccount(ctx, accountID)
	if err != nil {
		return err
	}
	contextToken, err = s.resolveContextToken(ctx, accountID, toUserID, contextToken)
	if err != nil {
		return err
	}
	if strings.TrimSpace(contextToken) == "" {
		return errors.New("context token not found for this user; media sending only supports replying to users who have already sent a message")
	}

	normalizedType, uploadType, err := normalizeMediaSendType(mediaType, filePath)
	if err != nil {
		return err
	}
	uploaded, err := s.client.UploadLocalMedia(ctx, s.cfg.CDNBaseURL, account.BaseURL, account.Token, toUserID, filePath, uploadType)
	if err != nil {
		_ = s.store.AddLog(context.Background(), "ERROR", "media upload failed", "message", fmt.Sprintf(`{"account_id":%q,"to_user_id":%q,"file_path":%q,"err":%q}`, accountID, toUserID, filePath, err.Error()))
		return err
	}

	fileName := filepath.Base(filePath)
	switch normalizedType {
	case "image":
		err = s.client.SendImageMessage(ctx, account.BaseURL, account.Token, toUserID, contextToken, text, uploaded)
	case "video":
		err = s.client.SendVideoMessage(ctx, account.BaseURL, account.Token, toUserID, contextToken, text, uploaded)
	case "file":
		err = s.client.SendFileMessage(ctx, account.BaseURL, account.Token, toUserID, contextToken, text, fileName, uploaded)
	case "voice":
		err = s.client.SendVoiceMessage(ctx, account.BaseURL, account.Token, toUserID, contextToken, text, detectVoiceEncodeType(filePath), uploaded)
	default:
		err = fmt.Errorf("unsupported media type %q", normalizedType)
	}
	if err != nil {
		_ = s.store.AddLog(context.Background(), "ERROR", "outbound media send failed", "message", fmt.Sprintf(`{"account_id":%q,"to_user_id":%q,"file_path":%q,"media_type":%q,"err":%q}`, accountID, toUserID, filePath, normalizedType, err.Error()))
		if isAudioFilePath(filePath) {
			return fmt.Errorf("%s发送失败：\n%s", strings.TrimPrefix(strings.ToLower(filepath.Ext(filePath)), "."), err.Error())
		}
		return err
	}

	mimeType := detectOutboundMIME(normalizedType, filePath)
	raw := fmt.Sprintf(`{"to_user_id":%q,"file_path":%q,"media_type":%q,"text":%q,"context_token":%q}`, toUserID, filePath, normalizedType, text, contextToken)
	if err := s.store.CreateOutboundEvent(ctx, accountID, normalizedType, toUserID, contextToken, text, filePath, fileName, mimeType, raw); err != nil {
		return err
	}
	_ = s.store.AddLog(context.Background(), "INFO", "outbound media sent", "message", raw)
	return nil
}

func (s *service) HandleInboundMessage(ctx context.Context, account model.Account, msg ilink.WeixinMessage) error {
	mediaPath, mediaFileName, mediaMimeType := "", "", ""
	if _, ok := firstInboundMediaItem(msg); ok {
		// File attachments are currently ignored. Do not download or persist media to disk.
		_ = s.store.AddLog(context.Background(), "INFO", "ignoring inbound media attachment", "media", fmt.Sprintf(`{"account_id":%q,"message_id":%d}`, account.AccountID, msg.MessageID))
	}

	if err := s.store.SaveInboundMessage(ctx, account.AccountID, msg, mediaPath, mediaFileName, mediaMimeType); err != nil {
		s.logger.Error("wcfLink inbound save failed", "account_id", account.AccountID, "message_id", msg.MessageID, "err", err)
		return err
	}

	payload, err := json.Marshal(map[string]any{
		"account_id":      account.AccountID,
		"base_url":        account.BaseURL,
		"event_type":      detectEventType(msg),
		"body_text":       extractBodyText(msg),
		"from_user_id":    msg.FromUserID,
		"to_user_id":      msg.ToUserID,
		"message_id":      msg.MessageID,
		"context_token":   msg.ContextToken,
		"media_path":      mediaPath,
		"media_file_name": mediaFileName,
		"media_mime_type": mediaMimeType,
		"raw_message":     msg,
		"received_at":     time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	settings := s.runtime.Settings()
	if settings.WebhookURL == "" {
		text := "[non-text]"
		for _, item := range msg.ItemList {
			if item.Type == 1 && item.TextItem != nil && item.TextItem.Text != "" {
				text = item.TextItem.Text
				break
			}
			if item.Type == 3 && item.VoiceItem != nil && item.VoiceItem.Text != "" {
				text = item.VoiceItem.Text
				break
			}
		}
		return s.store.AddLog(ctx, "INFO", fmt.Sprintf("inbound message from %s: %s", msg.FromUserID, text), "inbound", string(payload))
	}

	go s.deliverWebhook(settings.WebhookURL, payload)
	return s.store.AddLog(ctx, "INFO", "inbound message queued for webhook", "webhook", string(payload))
}

func (s *service) resolveContextToken(ctx context.Context, accountID, toUserID, contextToken string) (string, error) {
	if strings.TrimSpace(contextToken) != "" {
		return contextToken, nil
	}
	peerCtx, err := s.store.GetPeerContext(ctx, accountID, toUserID)
	if err == nil {
		return peerCtx.ContextToken, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	return "", err
}

func (s *service) saveInboundMedia(accountID string, messageID int64, fromUserID, fileName, mimeType string, data []byte) (string, string, string, error) {
	// File attachments are currently ignored, so do not persist inbound media to disk.
	return "", "", "", nil
}

func normalizeMediaSendType(mediaType, filePath string) (string, int, error) {
	value := strings.ToLower(strings.TrimSpace(mediaType))
	if value == "" {
		switch strings.ToLower(filepath.Ext(filePath)) {
		case ".jpg", ".jpeg", ".png", ".gif", ".webp":
			value = "image"
		case ".mp4", ".mov", ".m4v":
			value = "video"
		default:
			value = "file"
		}
	}
	switch value {
	case "image":
		return value, ilink.UploadMediaTypeImage, nil
	case "video":
		return value, ilink.UploadMediaTypeVideo, nil
	case "file":
		return value, ilink.UploadMediaTypeFile, nil
	case "voice":
		return value, ilink.UploadMediaTypeVoice, nil
	default:
		return "", 0, fmt.Errorf("unsupported media type %q", mediaType)
	}
}

func firstInboundMediaItem(msg ilink.WeixinMessage) (ilink.MessageItem, bool) {
	for _, item := range msg.ItemList {
		switch item.Type {
		case 2, 3, 4, 5:
			return item, true
		}
	}
	return ilink.MessageItem{}, false
}

func detectOutboundMIME(mediaType, filePath string) string {
	switch mediaType {
	case "image":
		switch strings.ToLower(filepath.Ext(filePath)) {
		case ".png":
			return "image/png"
		case ".gif":
			return "image/gif"
		default:
			return "image/jpeg"
		}
	case "video":
		return "video/mp4"
	case "voice":
		switch strings.ToLower(filepath.Ext(filePath)) {
		case ".amr":
			return "audio/amr"
		case ".mp3":
			return "audio/mpeg"
		case ".ogg":
			return "audio/ogg"
		default:
			return "audio/silk"
		}
	default:
		return "application/octet-stream"
	}
}

func sanitizePathSegment(value string) string {
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
		"@", "_",
	)
	out := strings.TrimSpace(replacer.Replace(value))
	if out == "" {
		return "unknown"
	}
	return out
}

func sanitizeFileName(value string) string {
	value = filepath.Base(strings.TrimSpace(value))
	if value == "." || value == "/" || value == "" {
		return ""
	}
	return sanitizePathSegment(value)
}

func extensionForMIME(mimeType string) string {
	switch mimeType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "video/mp4":
		return ".mp4"
	case "audio/silk":
		return ".silk"
	case "audio/amr":
		return ".amr"
	case "audio/mpeg":
		return ".mp3"
	case "audio/ogg":
		return ".ogg"
	case "application/pdf":
		return ".pdf"
	default:
		return ""
	}
}

func detectVoiceEncodeType(filePath string) int {
	switch strings.ToLower(filepath.Ext(filePath)) {
	case ".amr":
		return 5
	case ".mp3":
		return 7
	case ".ogg":
		return 8
	default:
		return 6
	}
}

func isAudioFilePath(filePath string) bool {
	switch strings.ToLower(filepath.Ext(filePath)) {
	case ".silk", ".amr", ".mp3", ".ogg", ".wav", ".m4a":
		return true
	default:
		return false
	}
}

func extractBodyText(msg ilink.WeixinMessage) string {
	for _, item := range msg.ItemList {
		switch item.Type {
		case 1:
			if item.TextItem != nil {
				return item.TextItem.Text
			}
		case 3:
			if item.VoiceItem != nil && item.VoiceItem.Text != "" {
				return item.VoiceItem.Text
			}
		case 2:
			return "[image]"
		case 4:
			if item.FileItem != nil && item.FileItem.FileName != "" {
				return "[file] " + item.FileItem.FileName
			}
			return "[file]"
		case 5:
			return "[video]"
		}
	}
	return ""
}

func detectEventType(msg ilink.WeixinMessage) string {
	for _, item := range msg.ItemList {
		switch item.Type {
		case 1:
			return "text"
		case 2:
			return "image"
		case 3:
			return "voice"
		case 4:
			return "file"
		case 5:
			return "video"
		}
	}
	return "unknown"
}

func (s *service) deliverWebhook(webhookURL string, payload []byte) {
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, webhookURL, bytes.NewReader(payload))
	if err != nil {
		_ = s.store.AddLog(context.Background(), "ERROR", "build webhook request failed", "webhook", err.Error())
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		_ = s.store.AddLog(context.Background(), "ERROR", "webhook delivery failed", "webhook", err.Error())
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		_ = s.store.AddLog(context.Background(), "ERROR", fmt.Sprintf("webhook delivery failed with status %d", resp.StatusCode), "webhook", "")
		return
	}
	_ = s.store.AddLog(context.Background(), "INFO", "webhook delivered", "webhook", "")
}

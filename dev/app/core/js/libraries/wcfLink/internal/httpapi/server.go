package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/lich0821/wcfLink/internal/model"
	coreversion "github.com/lich0821/wcfLink/version"
)

type Service interface {
	StartLogin(ctx context.Context, baseURL string) (model.LoginSession, error)
	GetLoginSession(ctx context.Context, sessionID string) (model.LoginSession, error)
	GetLoginStatus(ctx context.Context, sessionID string) (model.LoginSession, error)
	ListAccounts(ctx context.Context) ([]model.Account, error)
	ListEvents(ctx context.Context, afterID int64, limit int) ([]model.Event, error)
	ListLogs(ctx context.Context, afterID int64, limit int) ([]model.LogEntry, error)
	GetSettings(ctx context.Context) (model.Settings, error)
	UpdateSettings(ctx context.Context, settings model.Settings) (model.Settings, error)
	SendText(ctx context.Context, accountID, toUserID, text, contextToken string) error
	SendMedia(ctx context.Context, accountID, toUserID, mediaType, filePath, text, contextToken string) error
}

type Server struct {
	logger  *slog.Logger
	service Service
}

func NewServer(service Service, logger *slog.Logger) *Server {
	return &Server{logger: logger, service: service}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", s.handleLive)
	mux.HandleFunc("GET /health/ready", s.handleReady)
	mux.HandleFunc("GET /api/version", s.handleVersion)
	mux.HandleFunc("POST /api/accounts/login/start", s.handleLoginStart)
	mux.HandleFunc("GET /api/accounts/login/status", s.handleLoginStatus)
	mux.HandleFunc("GET /api/accounts/login/qr", s.handleLoginQR)
	mux.HandleFunc("GET /api/accounts", s.handleAccounts)
	mux.HandleFunc("GET /api/events", s.handleEvents)
	mux.HandleFunc("GET /api/logs", s.handleLogs)
	mux.HandleFunc("GET /api/settings", s.handleGetSettings)
	mux.HandleFunc("POST /api/settings", s.handleUpdateSettings)
	mux.HandleFunc("POST /api/messages/send-text", s.handleSendText)
	mux.HandleFunc("POST /api/messages/send-media", s.handleSendMedia)
	return withJSONContentType(mux)
}

func (s *Server) handleLive(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":        true,
		"timestamp": time.Now().UTC(),
		"version":   coreversion.Current(),
	})
}

func (s *Server) handleReady(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":        true,
		"timestamp": time.Now().UTC(),
		"version":   coreversion.Current(),
	})
}

func (s *Server) handleVersion(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, coreversion.Current())
}

func (s *Server) handleLoginStart(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BaseURL string `json:"base_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, http.ErrBodyNotAllowed) && err.Error() != "EOF" {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	session, err := s.service.StartLogin(r.Context(), strings.TrimSpace(req.BaseURL))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, session)
}

func (s *Server) handleLoginStatus(w http.ResponseWriter, r *http.Request) {
	sessionID := strings.TrimSpace(r.URL.Query().Get("session_id"))
	if sessionID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "session_id is required"})
		return
	}
	session, err := s.service.GetLoginStatus(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "login session not found"})
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, session)
}

func (s *Server) handleLoginQR(w http.ResponseWriter, r *http.Request) {
	sessionID := strings.TrimSpace(r.URL.Query().Get("session_id"))
	if sessionID == "" {
		http.Error(w, "session_id is required", http.StatusBadRequest)
		return
	}
	session, err := s.service.GetLoginSession(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "login session not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if session.QRCodeURL == "" {
		http.Error(w, "qr code url is empty", http.StatusBadRequest)
		return
	}
	png, err := GenerateQRCodePNG(session.QRCodeURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(png)
}

func (s *Server) handleAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := s.service.ListAccounts(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": accounts})
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	afterID, _ := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get("after_id")), 10, 64)
	limit, _ := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get("limit")))
	s.logger.Info("httpapi.handleEvents request", "after_id", afterID, "limit", limit)
	events, err := s.service.ListEvents(r.Context(), afterID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	s.logger.Info("httpapi.handleEvents returned", "after_id", afterID, "limit", limit, "count", len(events))
	writeJSON(w, http.StatusOK, map[string]any{"items": events})
}

func (s *Server) handleLogs(w http.ResponseWriter, r *http.Request) {
	afterID, _ := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get("after_id")), 10, 64)
	limit, _ := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get("limit")))
	items, err := s.service.ListLogs(r.Context(), afterID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (s *Server) handleGetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := s.service.GetSettings(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (s *Server) handleUpdateSettings(w http.ResponseWriter, r *http.Request) {
	var settings model.Settings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
		return
	}
	if strings.TrimSpace(settings.ListenAddr) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "listen_addr is required"})
		return
	}
	out, err := s.service.UpdateSettings(r.Context(), settings)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"settings":       out,
		"restart_needed": true,
	})
}

func (s *Server) handleSendText(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountID    string `json:"account_id"`
		ToUserID     string `json:"to_user_id"`
		Text         string `json:"text"`
		ContextToken string `json:"context_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
		return
	}
	if strings.TrimSpace(req.AccountID) == "" || strings.TrimSpace(req.ToUserID) == "" || strings.TrimSpace(req.Text) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "account_id, to_user_id and text are required"})
		return
	}
	s.logger.Info("httpapi.handleSendText request", "account_id", req.AccountID, "to_user_id", req.ToUserID, "context_token_set", strings.TrimSpace(req.ContextToken) != "")
	if err := s.service.SendText(r.Context(), req.AccountID, req.ToUserID, req.Text, req.ContextToken); err != nil {
		s.logger.Error("httpapi.handleSendText send failed", "account_id", req.AccountID, "to_user_id", req.ToUserID, "err", err)
		if isContextTokenMissingError(err) {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleSendMedia(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountID    string `json:"account_id"`
		ToUserID     string `json:"to_user_id"`
		Type         string `json:"type"`
		FilePath     string `json:"file_path"`
		Text         string `json:"text"`
		ContextToken string `json:"context_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
		return
	}
	if strings.TrimSpace(req.AccountID) == "" || strings.TrimSpace(req.ToUserID) == "" || strings.TrimSpace(req.FilePath) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "account_id, to_user_id and file_path are required"})
		return
	}
	if err := s.service.SendMedia(r.Context(), req.AccountID, req.ToUserID, req.Type, req.FilePath, req.Text, req.ContextToken); err != nil {
		if isContextTokenMissingError(err) {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func isContextTokenMissingError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "context token not found")
}

func withJSONContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(payload)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]any{"error": err.Error()})
}

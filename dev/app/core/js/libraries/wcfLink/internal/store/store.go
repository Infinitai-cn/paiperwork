package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"github.com/lich0821/wcfLink/internal/ilink"
	"github.com/lich0821/wcfLink/internal/model"
)

type StoreBackend interface {
	PingContext(ctx context.Context) error
	Close() error
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
	BeginTx(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error)
}

type sqlBackend struct {
	db *sql.DB
}

func (s *sqlBackend) PingContext(ctx context.Context) error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.PingContext(ctx)
}

func (s *sqlBackend) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

func (s *sqlBackend) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.db.ExecContext(ctx, query, args...)
}

func (s *sqlBackend) QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.db.QueryContext(ctx, query, args...)
}

func (s *sqlBackend) QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row {
	return s.db.QueryRowContext(ctx, query, args...)
}

func (s *sqlBackend) BeginTx(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.db.BeginTx(ctx, opts)
}

type Store struct {
	backend StoreBackend
}

func (s *Store) pingWechatDB(ctx context.Context) error {
	if s == nil || s.backend == nil {
		return nil
	}
	return s.backend.PingContext(ctx)
}

func (s *Store) closeWechatDB() error {
	if s == nil || s.backend == nil {
		return nil
	}
	return s.backend.Close()
}

func (s *Store) execWechatDB(ctx context.Context, query string, args ...any) (sql.Result, error) {
	if s == nil || s.backend == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.backend.ExecContext(ctx, query, args...)
}

func (s *Store) queryRowWechatDB(ctx context.Context, query string, args ...any) *sql.Row {
	if s == nil || s.backend == nil {
		return nil
	}
	return s.backend.QueryRowContext(ctx, query, args...)
}

func (s *Store) queryWechatDB(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	if s == nil || s.backend == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.backend.QueryContext(ctx, query, args...)
}

func (s *Store) beginWechatTx(ctx context.Context) (*sql.Tx, error) {
	if s == nil || s.backend == nil {
		return nil, errors.New("wechat DB backend not initialized")
	}
	return s.backend.BeginTx(ctx, nil)
}

func New(ctx context.Context, storagePath string) (*Store, error) {
	if storagePath == "" {
		return nil, errors.New("wechat DB storage path is required")
	}
	// Runtime state is now kept in-memory for the embedded wcfLink engine.
	// Persistent account restore is handled by PaiperworkDB's `wechat` role.
	// This avoids creating `wcfLink.db`, `wcfLink.db-shm`, and `wcfLink.db-wal`.
	log.Printf("Paiperworkdb: using in-memory WeChat DB backend for runtime state")
	db, err := sql.Open("sqlite", "file:wcfLink?mode=memory&cache=shared&_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	backend := &sqlBackend{db: db}
	s := &Store{backend: backend}
	if err := s.migrate(ctx); err != nil {
		_ = backend.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.closeWechatDB()
}

func (s *Store) Ping(ctx context.Context) error {
	return s.pingWechatDB(ctx)
}

func (s *Store) CreateLoginSession(ctx context.Context, session model.LoginSession) error {
	_, err := s.execWechatDB(ctx, `
INSERT INTO login_sessions (
  session_id, base_url, qr_code, qr_code_url, status, error, started_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		session.SessionID, session.BaseURL, session.QRCode, session.QRCodeURL, session.Status,
		session.Error, session.StartedAt.UTC(), session.UpdatedAt.UTC(),
	)
	return err
}

func (s *Store) GetLoginSession(ctx context.Context, sessionID string) (model.LoginSession, error) {
	row := s.queryRowWechatDB(ctx, `
SELECT session_id, base_url, qr_code, qr_code_url, status, account_id, ilink_user_id, bot_token,
       error, started_at, updated_at, completed_at
FROM login_sessions
WHERE session_id = ?`, sessionID)
	var session model.LoginSession
	var completedAt sql.NullTime
	err := row.Scan(
		&session.SessionID, &session.BaseURL, &session.QRCode, &session.QRCodeURL, &session.Status,
		&session.AccountID, &session.ILinkUserID, &session.BotToken, &session.Error,
		&session.StartedAt, &session.UpdatedAt, &completedAt,
	)
	if err != nil {
		return model.LoginSession{}, err
	}
	if completedAt.Valid {
		session.CompletedAt = &completedAt.Time
	}
	return session, nil
}

func (s *Store) ListLoginSessions(ctx context.Context, limit int) ([]model.LoginSession, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.queryWechatDB(ctx, `
SELECT session_id, base_url, qr_code, qr_code_url, status, account_id, ilink_user_id, bot_token,
       error, started_at, updated_at, completed_at
FROM login_sessions
ORDER BY started_at ASC
LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.LoginSession
	for rows.Next() {
		var session model.LoginSession
		var completedAt sql.NullTime
		if err := rows.Scan(
			&session.SessionID, &session.BaseURL, &session.QRCode, &session.QRCodeURL, &session.Status,
			&session.AccountID, &session.ILinkUserID, &session.BotToken, &session.Error,
			&session.StartedAt, &session.UpdatedAt, &completedAt,
		); err != nil {
			return nil, err
		}
		if completedAt.Valid {
			session.CompletedAt = &completedAt.Time
		}
		items = append(items, session)
	}
	return items, rows.Err()
}

func (s *Store) ListPeerContexts(ctx context.Context, limit int) ([]model.PeerContext, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.queryWechatDB(ctx, `
SELECT account_id, peer_user_id, context_token, updated_at
FROM peer_contexts
ORDER BY account_id ASC, peer_user_id ASC
LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.PeerContext
	for rows.Next() {
		var item model.PeerContext
		if err := rows.Scan(&item.AccountID, &item.PeerUserID, &item.ContextToken, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) UpdateLoginSessionStatus(ctx context.Context, sessionID, status, errorText string) error {
	_, err := s.execWechatDB(ctx, `
UPDATE login_sessions
SET status = ?, error = ?, updated_at = ?
WHERE session_id = ?`, status, errorText, time.Now().UTC(), sessionID)
	return err
}

func (s *Store) CompleteLoginSession(ctx context.Context, sessionID string, status ilink.QRStatusResponse) error {
	now := time.Now().UTC()
	tx, err := s.beginWechatTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
UPDATE login_sessions
SET status = ?, account_id = ?, ilink_user_id = ?, bot_token = ?, base_url = ?, updated_at = ?, completed_at = ?
WHERE session_id = ?`,
		status.Status, status.AccountID, status.ILinkUserID, status.BotToken, status.BaseURL, now, now, sessionID,
	)
	if err != nil {
		return err
	}

	baseURL := status.BaseURL
	if baseURL == "" {
		var fallback string
		if err := tx.QueryRowContext(ctx, `SELECT base_url FROM login_sessions WHERE session_id = ?`, sessionID).Scan(&fallback); err == nil {
			baseURL = fallback
		}
	}

	_, err = tx.ExecContext(ctx, `
INSERT INTO accounts (
  account_id, base_url, token, ilink_user_id, enabled, login_status, created_at, updated_at
) VALUES (?, ?, ?, ?, 1, 'connected', ?, ?)
ON CONFLICT(account_id) DO UPDATE SET
  base_url = excluded.base_url,
  token = excluded.token,
  ilink_user_id = excluded.ilink_user_id,
  enabled = 1,
  login_status = 'connected',
  last_error = '',
  updated_at = excluded.updated_at`,
		status.AccountID, baseURL, status.BotToken, status.ILinkUserID, now, now,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *Store) UpsertAccount(ctx context.Context, account model.Account) error {
	now := time.Now().UTC()
	if account.CreatedAt.IsZero() {
		account.CreatedAt = now
	}
	if account.UpdatedAt.IsZero() {
		account.UpdatedAt = now
	}
	enabled := 0
	if account.Enabled {
		enabled = 1
	}

	lastPollAt := sql.NullTime{Valid: false}
	if account.LastPollAt != nil {
		lastPollAt = sql.NullTime{Time: *account.LastPollAt, Valid: true}
	}
	lastInboundAt := sql.NullTime{Valid: false}
	if account.LastInboundAt != nil {
		lastInboundAt = sql.NullTime{Time: *account.LastInboundAt, Valid: true}
	}

	_, err := s.execWechatDB(ctx, `
INSERT INTO accounts (
  account_id, base_url, token, ilink_user_id, enabled, login_status, last_error,
  get_updates_buf, last_poll_at, last_inbound_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(account_id) DO UPDATE SET
  base_url = excluded.base_url,
  token = excluded.token,
  ilink_user_id = excluded.ilink_user_id,
  enabled = excluded.enabled,
  login_status = excluded.login_status,
  last_error = excluded.last_error,
  get_updates_buf = excluded.get_updates_buf,
  last_poll_at = excluded.last_poll_at,
  last_inbound_at = excluded.last_inbound_at,
  updated_at = excluded.updated_at`,
		account.AccountID,
		account.BaseURL,
		account.Token,
		account.ILinkUserID,
		enabled,
		account.LoginStatus,
		account.LastError,
		account.GetUpdatesBuf,
		lastPollAt,
		lastInboundAt,
		account.CreatedAt.UTC(),
		account.UpdatedAt.UTC(),
	)
	return err
}

func (s *Store) ListAccounts(ctx context.Context) ([]model.Account, error) {
	rows, err := s.queryWechatDB(ctx, `
SELECT account_id, base_url, token, ilink_user_id, enabled, login_status, last_error,
       get_updates_buf, last_poll_at, last_inbound_at, created_at, updated_at
FROM accounts
ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Account
	for rows.Next() {
		var item model.Account
		var enabled int
		var lastPollAt sql.NullTime
		var lastInboundAt sql.NullTime
		if err := rows.Scan(
			&item.AccountID, &item.BaseURL, &item.Token, &item.ILinkUserID, &enabled, &item.LoginStatus,
			&item.LastError, &item.GetUpdatesBuf, &lastPollAt, &lastInboundAt, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		item.Enabled = enabled == 1
		if lastPollAt.Valid {
			item.LastPollAt = &lastPollAt.Time
		}
		if lastInboundAt.Valid {
			item.LastInboundAt = &lastInboundAt.Time
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetAccount(ctx context.Context, accountID string) (model.Account, error) {
	row := s.queryRowWechatDB(ctx, `
SELECT account_id, base_url, token, ilink_user_id, enabled, login_status, last_error,
       get_updates_buf, last_poll_at, last_inbound_at, created_at, updated_at
FROM accounts
WHERE account_id = ?`, accountID)
	var item model.Account
	var enabled int
	var lastPollAt sql.NullTime
	var lastInboundAt sql.NullTime
	err := row.Scan(
		&item.AccountID, &item.BaseURL, &item.Token, &item.ILinkUserID, &enabled, &item.LoginStatus,
		&item.LastError, &item.GetUpdatesBuf, &lastPollAt, &lastInboundAt, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return model.Account{}, err
	}
	item.Enabled = enabled == 1
	if lastPollAt.Valid {
		item.LastPollAt = &lastPollAt.Time
	}
	if lastInboundAt.Valid {
		item.LastInboundAt = &lastInboundAt.Time
	}
	return item, nil
}

func (s *Store) DeleteAccount(ctx context.Context, accountID string) error {
	tx, err := s.beginWechatTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	statements := []string{
		`DELETE FROM accounts WHERE account_id = ?`,
		`DELETE FROM peer_contexts WHERE account_id = ?`,
		`DELETE FROM login_sessions WHERE account_id = ?`,
	}
	for _, stmt := range statements {
		if _, err := tx.ExecContext(ctx, stmt, accountID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) UpdateAccountPollState(ctx context.Context, accountID, getUpdatesBuf, loginStatus, lastError string) error {
	_, err := s.execWechatDB(ctx, `
UPDATE accounts
SET get_updates_buf = ?, login_status = ?, last_error = ?, last_poll_at = ?, updated_at = ?
WHERE account_id = ?`, getUpdatesBuf, loginStatus, lastError, time.Now().UTC(), time.Now().UTC(), accountID)
	return err
}

func (s *Store) TouchAccountInbound(ctx context.Context, accountID string) error {
	now := time.Now().UTC()
	_, err := s.execWechatDB(ctx, `
UPDATE accounts
SET last_inbound_at = ?, updated_at = ?
WHERE account_id = ?`, now, now, accountID)
	return err
}

func (s *Store) SaveInboundMessage(ctx context.Context, accountID string, msg ilink.WeixinMessage, mediaPath, mediaFileName, mediaMimeType string) error {
	raw, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	bodyText := extractBodyText(msg)
	now := time.Now().UTC()

	tx, err := s.beginWechatTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
INSERT OR IGNORE INTO events (
  account_id, direction, event_type, from_user_id, to_user_id, message_id, context_token, body_text, media_path, media_file_name, media_mime_type, raw_json, created_at
) VALUES (?, 'inbound', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		accountID, detectEventType(msg), msg.FromUserID, msg.ToUserID, msg.MessageID, msg.ContextToken, bodyText, mediaPath, mediaFileName, mediaMimeType, string(raw), now,
	)
	if err != nil {
		return err
	}

	if stringsNotEmpty(msg.FromUserID, msg.ContextToken) {
		_, err = tx.ExecContext(ctx, `
INSERT INTO peer_contexts (account_id, peer_user_id, context_token, updated_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(account_id, peer_user_id) DO UPDATE SET
  context_token = excluded.context_token,
  updated_at = excluded.updated_at`, accountID, msg.FromUserID, msg.ContextToken, now)
		if err != nil {
			return err
		}
	}

	_, err = tx.ExecContext(ctx, `
UPDATE accounts
SET last_inbound_at = ?, updated_at = ?, last_error = '', login_status = 'connected'
WHERE account_id = ?`, now, now, accountID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (s *Store) GetPeerContext(ctx context.Context, accountID, peerUserID string) (model.PeerContext, error) {
	row := s.queryRowWechatDB(ctx, `
SELECT account_id, peer_user_id, context_token, updated_at
FROM peer_contexts
WHERE account_id = ? AND peer_user_id = ?`, accountID, peerUserID)
	var item model.PeerContext
	if err := row.Scan(&item.AccountID, &item.PeerUserID, &item.ContextToken, &item.UpdatedAt); err != nil {
		return model.PeerContext{}, err
	}
	return item, nil
}

func (s *Store) CreateOutboundEvent(ctx context.Context, accountID, eventType, toUserID, contextToken, bodyText, mediaPath, mediaFileName, mediaMimeType, rawJSON string) error {
	_, err := s.execWechatDB(ctx, `
INSERT INTO events (
  account_id, direction, event_type, to_user_id, context_token, body_text, media_path, media_file_name, media_mime_type, raw_json, created_at
) VALUES (?, 'outbound', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		accountID, eventType, toUserID, contextToken, bodyText, mediaPath, mediaFileName, mediaMimeType, rawJSON, time.Now().UTC(),
	)
	return err
}

func (s *Store) AddLog(ctx context.Context, level, message, source, metaJSON string) error {
	_, err := s.execWechatDB(ctx, `
INSERT INTO logs (level, message, source, meta_json, created_at)
VALUES (?, ?, ?, ?, ?)`, level, message, source, metaJSON, time.Now().UTC())
	return err
}

func (s *Store) ListLogs(ctx context.Context, afterID int64, limit int) ([]model.LogEntry, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.queryWechatDB(ctx, `
SELECT id, level, message, source, meta_json, created_at
FROM logs
WHERE id > ?
ORDER BY id ASC
LIMIT ?`, afterID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.LogEntry
	for rows.Next() {
		var item model.LogEntry
		if err := rows.Scan(&item.ID, &item.Level, &item.Message, &item.Source, &item.MetaJSON, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListEvents(ctx context.Context, afterID int64, limit int) ([]model.Event, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := s.queryWechatDB(ctx, `
SELECT id, account_id, direction, event_type, from_user_id, to_user_id, message_id, context_token, body_text, media_path, media_file_name, media_mime_type, raw_json, created_at
FROM events
WHERE id > ?
ORDER BY id ASC
LIMIT ?`, afterID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.Event
	for rows.Next() {
		var item model.Event
		if err := rows.Scan(
			&item.ID, &item.AccountID, &item.Direction, &item.EventType, &item.FromUserID, &item.ToUserID,
			&item.MessageID, &item.ContextToken, &item.BodyText, &item.MediaPath, &item.MediaFileName, &item.MediaMimeType, &item.RawJSON, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) migrate(ctx context.Context) error {
	stmts := []string{
		`PRAGMA journal_mode=WAL;`,
		`CREATE TABLE IF NOT EXISTS login_sessions (
			session_id TEXT PRIMARY KEY,
			base_url TEXT NOT NULL,
			qr_code TEXT NOT NULL,
			qr_code_url TEXT NOT NULL,
			status TEXT NOT NULL,
			account_id TEXT NOT NULL DEFAULT '',
			ilink_user_id TEXT NOT NULL DEFAULT '',
			bot_token TEXT NOT NULL DEFAULT '',
			error TEXT NOT NULL DEFAULT '',
			started_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			completed_at TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS accounts (
			account_id TEXT PRIMARY KEY,
			base_url TEXT NOT NULL,
			token TEXT NOT NULL,
			ilink_user_id TEXT NOT NULL DEFAULT '',
			enabled INTEGER NOT NULL DEFAULT 1,
			login_status TEXT NOT NULL DEFAULT 'pending',
			last_error TEXT NOT NULL DEFAULT '',
			get_updates_buf TEXT NOT NULL DEFAULT '',
			last_poll_at TIMESTAMP,
			last_inbound_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS peer_contexts (
			account_id TEXT NOT NULL,
			peer_user_id TEXT NOT NULL,
			context_token TEXT NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			PRIMARY KEY (account_id, peer_user_id)
		);`,
		`CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			account_id TEXT NOT NULL,
			direction TEXT NOT NULL,
			event_type TEXT NOT NULL,
			from_user_id TEXT NOT NULL DEFAULT '',
			to_user_id TEXT NOT NULL DEFAULT '',
			message_id INTEGER NOT NULL DEFAULT 0,
			context_token TEXT NOT NULL DEFAULT '',
			body_text TEXT NOT NULL DEFAULT '',
			media_path TEXT NOT NULL DEFAULT '',
			media_file_name TEXT NOT NULL DEFAULT '',
			media_mime_type TEXT NOT NULL DEFAULT '',
			raw_json TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL
		);`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_account_message_inbound
		 ON events(account_id, direction, message_id)
			 WHERE direction = 'inbound' AND message_id != 0;`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_account_inbound_body
			 ON events(account_id, direction, event_type, from_user_id, to_user_id, body_text)
			 WHERE direction = 'inbound' AND message_id = 0;`,
		`CREATE TABLE IF NOT EXISTS logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			level TEXT NOT NULL,
			message TEXT NOT NULL,
			source TEXT NOT NULL,
			meta_json TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMP NOT NULL
		);`,
	}

	for _, stmt := range stmts {
		if _, err := s.execWechatDB(ctx, stmt); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}
	for _, stmt := range []string{
		`ALTER TABLE events ADD COLUMN media_path TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE events ADD COLUMN media_file_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE events ADD COLUMN media_mime_type TEXT NOT NULL DEFAULT ''`,
	} {
		if err := s.execMigrationCompat(ctx, stmt); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) execMigrationCompat(ctx context.Context, stmt string) error {
	if _, err := s.execWechatDB(ctx, stmt); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate column name") {
			return nil
		}
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
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

func stringsNotEmpty(values ...string) bool {
	for _, value := range values {
		if value == "" {
			return false
		}
	}
	return true
}

var ErrNotFound = errors.New("not found")

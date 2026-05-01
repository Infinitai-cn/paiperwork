package worker

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/lich0821/wcfLink/internal/ilink"
	"github.com/lich0821/wcfLink/internal/model"
	"github.com/lich0821/wcfLink/internal/store"
)

type PollerManager struct {
	store  *store.Store
	client *ilink.Client
	logger *slog.Logger
	onMsg  func(context.Context, model.Account, ilink.WeixinMessage) error

	mu      sync.Mutex
	running map[string]context.CancelFunc
}

func NewPollerManager(
	st *store.Store,
	client *ilink.Client,
	logger *slog.Logger,
	onMsg func(context.Context, model.Account, ilink.WeixinMessage) error,
) *PollerManager {
	return &PollerManager{
		store:   st,
		client:  client,
		logger:  logger,
		onMsg:   onMsg,
		running: make(map[string]context.CancelFunc),
	}
}

func (m *PollerManager) StartEnabledAccounts(ctx context.Context) error {
	accounts, err := m.store.ListAccounts(ctx)
	if err != nil {
		return err
	}
	m.logger.Info("wcfLink startup: scanning stored accounts", "count", len(accounts))
	started := 0
	for _, account := range accounts {
		if account.Enabled && account.Token != "" {
			started++
			m.StartAccount(ctx, account)
		} else {
			m.logger.Info("wcfLink startup: skipping stored account", "account_id", account.AccountID, "enabled", account.Enabled, "login_status", account.LoginStatus)
		}
	}
	m.logger.Info("wcfLink startup: enabled account pollers initialized", "started", started)
	if started == 0 {
		m.logger.Info("wcfLink startup: no enabled connected accounts found; login/QR flow will be required")
	}
	return nil
}

func (m *PollerManager) StartAccount(parent context.Context, account model.Account) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, exists := m.running[account.AccountID]; exists {
		return
	}
	ctx, cancel := context.WithCancel(parent)
	m.running[account.AccountID] = cancel
	go m.run(ctx, account)
}

func (m *PollerManager) StopAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for accountID, cancel := range m.running {
		cancel()
		delete(m.running, accountID)
	}
}

func (m *PollerManager) StopAccount(accountID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	cancel, exists := m.running[accountID]
	if !exists {
		return
	}
	cancel()
	delete(m.running, accountID)
}

func (m *PollerManager) run(ctx context.Context, account model.Account) {
	log := m.logger.With("account_id", account.AccountID)
	log.Info("poller started")
	defer func() {
		m.mu.Lock()
		delete(m.running, account.AccountID)
		m.mu.Unlock()
		log.Info("poller stopped")
	}()

	current := account
	backoff := 2 * time.Second
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		resp, err := m.client.GetUpdates(ctx, current.BaseURL, current.Token, current.GetUpdatesBuf)
		if err != nil {
			if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				log.Info("getupdates canceled due to shutdown")
				return
			}
			log.Error("getupdates failed", "err", err)
			_ = m.store.UpdateAccountPollState(context.Background(), current.AccountID, current.GetUpdatesBuf, "error", err.Error())
			if !sleepWithContext(ctx, backoff) {
				return
			}
			if backoff < 30*time.Second {
				backoff *= 2
			}
			continue
		}
		backoff = 2 * time.Second

		if resp.GetUpdatesBuf != "" {
			current.GetUpdatesBuf = resp.GetUpdatesBuf
		}
		status := "connected"
		errText := ""
		if resp.ErrCode != 0 || resp.Ret != 0 {
			status = "warning"
			errText = resp.ErrMsg
			if errText == "" {
				errText = "getupdates returned non-zero status"
			}
		}
		_ = m.store.UpdateAccountPollState(context.Background(), current.AccountID, current.GetUpdatesBuf, status, errText)

		for _, msg := range resp.Messages {
			if msg.MessageType != 1 {
				continue
			}
			if m.onMsg == nil {
				if err := m.store.SaveInboundMessage(context.Background(), current.AccountID, msg, "", "", ""); err != nil {
					log.Error("save inbound event failed", "err", err, "message_id", msg.MessageID)
				}
				continue
			}
			if err := m.onMsg(context.Background(), current, msg); err != nil {
				log.Error("save inbound event failed", "err", err, "message_id", msg.MessageID)
			}
		}

		if refreshed, err := m.store.GetAccount(context.Background(), current.AccountID); err == nil {
			current = refreshed
		}

		delay := time.Second
		if resp.LongPollingTimeout > 0 {
			delay = 0
		}
		if delay > 0 && !sleepWithContext(ctx, delay) {
			return
		}
	}
}

func (m *PollerManager) LookupContextToken(ctx context.Context, accountID, peerUserID string) (string, error) {
	item, err := m.store.GetPeerContext(ctx, accountID, peerUserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return item.ContextToken, nil
}

func sleepWithContext(ctx context.Context, delay time.Duration) bool {
	if delay <= 0 {
		return true
	}
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

package app

import (
	"context"
	"sync"

	"github.com/lich0821/wcfLink/internal/config"
	"github.com/lich0821/wcfLink/internal/model"
	"github.com/lich0821/wcfLink/internal/store"
)

type runtimeState struct {
	mu       sync.RWMutex
	settings model.Settings
	store    *store.Store
}

func newRuntimeState(st *store.Store, cfg config.Config) *runtimeState {
	return &runtimeState{
		settings: model.Settings{
			ListenAddr: cfg.ListenAddr,
			WebhookURL: cfg.WebhookURL,
		},
		store: st,
	}
}

func (r *runtimeState) Settings() model.Settings {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.settings
}

func (r *runtimeState) UpdateSettings(ctx context.Context, settings model.Settings) error {
	r.mu.Lock()
	r.settings = settings
	r.mu.Unlock()
	return r.store.AddLog(ctx, "INFO", "settings updated", "settings", "")
}

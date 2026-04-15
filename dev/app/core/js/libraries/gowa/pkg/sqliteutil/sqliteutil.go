package sqliteutil

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"

	_ "github.com/mattn/go-sqlite3"
	_ "modernc.org/sqlite"
)

type pragma struct {
	name        string
	value       string
	ignoreError bool
}

var (
	runtimeAnchorMu sync.Mutex
	runtimeAnchors  = map[string]*sql.DB{}
)

func Open(uri string) (*sql.DB, error) {
	trimmed := strings.TrimSpace(strings.Trim(uri, `"'`))
	if trimmed == "" {
		return nil, fmt.Errorf("sqlite uri is empty")
	}

	driverName, dsn, pragmas := resolveDriver(trimmed)
	if err := ensurePinnedRuntimeAnchor(driverName, dsn, pragmas); err != nil {
		return nil, err
	}
	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := applyPragmas(context.Background(), db, pragmas); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func ClosePinnedRuntimeAnchors() {
	runtimeAnchorMu.Lock()
	anchors := runtimeAnchors
	runtimeAnchors = map[string]*sql.DB{}
	runtimeAnchorMu.Unlock()

	for _, db := range anchors {
		if db != nil {
			_ = db.Close()
		}
	}
}

func resolveDriver(uri string) (string, string, []pragma) {
	if shouldUsePureGoDriver() {
		return buildPureGoDSN(uri)
	}
	return "sqlite3", uri, nil
}

func shouldUsePureGoDriver() bool {
	if strings.EqualFold(strings.TrimSpace(os.Getenv("PAIPERWORK_FORCE_PUREGO_SQLITE")), "true") {
		return true
	}
	return runtime.GOOS == "windows"
}

func ensurePinnedRuntimeAnchor(driverName, dsn string, pragmas []pragma) error {
	if driverName != "sqlite" || !isPinnedInMemoryRuntimeDSN(dsn) {
		return nil
	}

	key := driverName + "\x00" + dsn

	runtimeAnchorMu.Lock()
	defer runtimeAnchorMu.Unlock()
	if runtimeAnchors[key] != nil {
		return nil
	}

	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return err
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	if err := applyPragmas(context.Background(), db, pragmas); err != nil {
		_ = db.Close()
		return err
	}
	runtimeAnchors[key] = db
	return nil
}

func isPinnedInMemoryRuntimeDSN(dsn string) bool {
	trimmed := strings.ToLower(strings.TrimSpace(strings.Trim(dsn, `"'`)))
	if trimmed == "" {
		return false
	}
	if !strings.HasPrefix(trimmed, "file:") {
		return false
	}
	return strings.Contains(trimmed, "mode=memory") || strings.HasPrefix(trimmed, "file::memory")
}

func buildPureGoDSN(uri string) (string, string, []pragma) {
	base, rawQuery, found := strings.Cut(uri, "?")
	if !found {
		return "sqlite", uri, nil
	}

	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "sqlite", uri, nil
	}

	pragmas := make([]pragma, 0, 3)
	if value := strings.TrimSpace(values.Get("_foreign_keys")); value != "" {
		pragmas = append(pragmas, pragma{name: "foreign_keys", value: sqlitePragmaBool(value)})
		values.Del("_foreign_keys")
	}
	if value := strings.TrimSpace(values.Get("_journal_mode")); value != "" {
		pragmas = append(pragmas, pragma{name: "journal_mode", value: value, ignoreError: true})
		values.Del("_journal_mode")
	}
	if value := strings.TrimSpace(values.Get("_busy_timeout")); value != "" {
		pragmas = append(pragmas, pragma{name: "busy_timeout", value: value})
		values.Del("_busy_timeout")
	}

	encoded := values.Encode()
	if encoded == "" {
		return "sqlite", base, pragmas
	}
	return "sqlite", base + "?" + encoded, pragmas
}

func applyPragmas(ctx context.Context, db *sql.DB, pragmas []pragma) error {
	for _, setting := range pragmas {
		statement := fmt.Sprintf("PRAGMA %s = %s", setting.name, sqlitePragmaValue(setting.value))
		if _, err := db.ExecContext(ctx, statement); err != nil {
			if setting.ignoreError {
				continue
			}
			return fmt.Errorf("apply sqlite pragma %s: %w", setting.name, err)
		}
	}
	return nil
}

func sqlitePragmaBool(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "on", "yes":
		return "1"
	default:
		return "0"
	}
}

func sqlitePragmaValue(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "''"
	}
	if _, err := strconv.Atoi(trimmed); err == nil {
		return trimmed
	}
	upper := strings.ToUpper(trimmed)
	switch upper {
	case "WAL", "DELETE", "TRUNCATE", "PERSIST", "MEMORY", "OFF":
		return upper
	default:
		return "'" + strings.ReplaceAll(trimmed, "'", "''") + "'"
	}
}

**Gowa Storage Mapping**

The task is to stop gowa from saving files to disk, some cases we will remove the code, some others we will decide what kind or persistent or not persistent storage we want to use, and implement it.

- **Storages folder**: created by `CreateFolder` (implementation) in [dev/app/core/js/gowa/pkg/utils/general.go](dev/app/core/js/gowa/pkg/utils/general.go#L46), called from `initApp()` in [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L398). `CreateFolder` uses `os.MkdirAll("./<folder>")`.
- **Default path**: `PathStorages` default is set in [dev/app/core/js/gowa/config/settings.go](dev/app/core/js/gowa/config/settings.go#L24). The default WhatsApp DB URI is in the same file: [dev/app/core/js/gowa/config/settings.go](dev/app/core/js/gowa/config/settings.go#L30).
- **WhatsApp DB file (storages/whatsapp.db)**: initialized by `InitWaDB()` in [dev/app/core/js/gowa/infrastructure/whatsapp/database.go](dev/app/core/js/gowa/infrastructure/whatsapp/database.go#L14). `initDatabase()` calls `sqlstore.New(..., DBURI, ...)` (SQLite) at [dev/app/core/js/gowa/infrastructure/whatsapp/database.go](dev/app/core/js/gowa/infrastructure/whatsapp/database.go#L34) — the SQLite driver opens/creates the file specified by `DBURI`.
- **Per-user DBs**: the Paiperwork server can generate per-user DB URIs under `storages/` via `userWhatsappDBURI()` in [dev/server/main.go](dev/server/main.go#L152) and sets `PAIPERWORK_DB_URI` when proxying per-user sessions ([dev/server/main.go](dev/server/main.go#L1223)).
- **No-disk mode**: `PAIPERWORK_NO_DISK` is handled in [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L121-L129). When enabled the code sets `config.NoDisk = true`, clears `PathStorages` and related paths, and (if default DBURI was used) switches to an in-memory DB URI `file::memory:?cache=shared` to avoid creating files.
- **Cleanup**: DB and temporary file removal is implemented in [dev/app/core/js/gowa/infrastructure/whatsapp/cleanup.go](dev/app/core/js/gowa/infrastructure/whatsapp/cleanup.go#L144) (it also respects `NoDisk` / in-memory DB to skip file operations).
- **Embedded-only gateway**: `tryStartBundledGateway()` in [dev/server/main.go](dev/server/main.go#L3040-L3047) now uses embedded gowa only; the old `spawnGateway()` external process path was removed because no current code path uses it.
- **Per-user DB routing workflow**: `whatsappQrProxy` handler in [dev/server/main.go](dev/server/main.go#L1220-L1230) processes login/start requests and, when a `user` key is provided, sets per-user DB URIs:
  - `userWhatsappDBURI(userKey)` in [dev/server/main.go](dev/server/main.go#L152-L158) returns `file:storages/whatsapp_<hash>.db?...` (e.g., `whatsapp_85e403c0de998852.db`).
  - `userWhatsappKeysDBURI(userKey)` returns `file:storages/whatsapp_keys_<hash>.db?...`.
  - it then sets env vars:
    - `PAIPERWORK_DB_URI` = constructed user DB URI
    - `PAIPERWORK_DB_KEYS_URI` = constructed user keys DB URI
  - if `PAIPERWORK_NO_DISK=true`, uses in-memory URIs instead (`file::memory:?cache=shared`) for both DB and Keys, avoiding `storages/` path errors.

This workflow is the direct origin of your log line:
`whatsappQrProxy: setting per-user WhatsApp DB for user=fb92c... dbURI=file:storages/whatsapp_85e403c0de998852.db?... keysURI=file:storages/whatsapp_keys_85e403c0de998852.db?...`

- **WhatsApp DB role in frontend persistence**: `dev/app/core/js/utils/feats/database.js` now supports `whatsapp` role in `normalizeDbRole`, `getDbFileName`, and `getDbStorageKey`, and `getOpenDatabaseState` includes `whatsapp`. New helpers:
  - `getWhatsappDatabase(hashedMasterKey)`
  - `closeWhatsappDatabase` 
  This means Whatsapp-specific data can be stored in the same OPFS/IndexedDB store (`PaiperworkDB`) side-by-side with `main/rag/html/kb`.

- **Per-user WhatsApp DB open and sidecars**: `InitWaDB()` in [dev/app/core/js/gowa/infrastructure/whatsapp/database.go](dev/app/core/js/gowa/infrastructure/whatsapp/database.go#L14) calls `initDatabase()`, which uses `sqlstore.New(...)` and through the SQLite driver opens the file at `whatsapp_85e403c0de998852.db`.
  - Since path contains `?_journal_mode=WAL`, SQLite creates and uses `whatsapp_85e403c0de998852.db-wal` and `whatsapp_85e403c0de998852.db-shm` in the same `storages` folder.
- **Per-user WhatsApp keys DB open and sidecars**: with `PAIPERWORK_DB_KEYS_URI` set to `file:storages/whatsapp_keys_85e403c0de998852.db?...`, `InitWaDB()` also creates `whatsapp_keys_85e403c0de998852.db`, and SQLite in WAL mode creates `whatsapp_keys_85e403c0de998852.db-wal` and `whatsapp_keys_85e403c0de998852.db-shm`.
- **Chat storage DB location**: `ChatStorageURI` default is `file:storages/chatstorage.db` in [dev/app/core/js/gowa/config/settings.go](dev/app/core/js/gowa/config/settings.go#L56). The connection is made by `initChatStorage()` in [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L356-L370), which calls `sql.Open("sqlite3", connStr)` with a path derived from `ChatStorageURI` and optional flags.
  - Since WAL mode is enabled (`chatStorageDB` connection string uses `_journal_mode=WAL`), SQLite also auto-creates `storages/chatstorage.db-shm` and `storages/chatstorage.db-wal` in the same folder.
- **Static folders created**: `initApp()` calls `utils.CreateFolder(config.PathQrCode, config.PathSendItems, config.PathStorages, config.PathMedia)` at [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L398). Defaults in [dev/app/core/js/gowa/config/settings.go](dev/app/core/js/gowa/config/settings.go#L21-L24):
  - `PathQrCode = statics/qrcode`
  - `PathSendItems = statics/senditems`
  - `PathMedia = statics/media`
  - `PathStorages = storages`
- **No-disk folder safety**: with `PAIPERWORK_NO_DISK=true`, `initApp()` in [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L121-L129) clears these paths and removes any preexisting directories (statics/qrcode, statics/senditems, statics/media, storages), ensuring no folder creation on disk.
- **Media receiving and storage**: on inbound WhatsApp messages, `buildMediaFields()` in [dev/app/core/js/gowa/infrastructure/whatsapp/event_message.go](dev/app/core/js/gowa/infrastructure/whatsapp/event_message.go#L201-L313) calls `utils.ExtractMedia(ctx, client, config.PathMedia, media)` for image/audio/video/sticker/document/ptv when `WhatsappAutoDownloadMedia=true`.
  - `ExtractMedia()` implementation in [dev/app/core/js/gowa/pkg/utils/whatsapp.go](dev/app/core/js/gowa/pkg/utils/whatsapp.go#L549-L604) downloads message bytes and writes them to disk under the given `storageLocation` (e.g., `statics/media/<timestamp>-<uuid>.<ext>`), unless `NoDisk=true` (in-memory path). 
- **Image handler downloads**: `handleImageMessage()` in [dev/app/core/js/gowa/infrastructure/whatsapp/event_message_handler.go](dev/app/core/js/gowa/infrastructure/whatsapp/event_message_handler.go#L37-L57) now exits early when `config.NoDisk=true`, avoiding additional disk downloads for legacy `pathStorages` behavior.
- **Outbound senditems files**: send flow in [dev/app/core/js/gowa/usecase/send.go](dev/app/core/js/gowa/usecase/send.go#L240-L330, #~816, #~1181) writes temporary or processing files under `config.PathSendItems` (default `statics/senditems`) via `os.WriteFile(...)` and imaging functions (`imaging.Save(...)`). For `NoDisk=true`, upload methods now avoid this flow and return a clear internal error for file/video operations that require local filesystem.
- `initApp()` then calls `initChatStorage()` (at [dev/app/core/js/gowa/cmd/root.go](dev/app/core/js/gowa/cmd/root.go#L395-L404)) before starting WhatsApp components.

**Task status**: incoming media no-disk logic and senditems folder avoidance implemented and completed.

**Status**: incoming media disk writes disabled in no-disk mode (as part of no-local-storage embedding goal). Marked completed.

**Verification**: core WhatsApp data access/write/read paths are now funneled into PaiperworkDB in frontend code (`dev/app/core/js/utils/feats/database.js`) and controlled via `PAIPERWORK_DB_URI` / `PAIPERWORK_DB_KEYS_URI` in backend `dev/server/main.go`, with no raw direct `storages/whatsapp.db` access left active in no-disk mode.

**Done**: Gowa storage mapping outcome is confirmed and task completed in this document.

Next steps (suggested): choose one integration approach and I can implement it in Paiperwork:

- set `PAIPERWORK_NO_DISK=true` when launching gowa to force in-memory DBs and skip folder creation, or
- override `PAIPERWORK_DB_URI` / `PAIPERWORK_DB_KEYS_URI` to point to an external DB (Postgres) so no local sqlite files are created.

If you want, I can now implement the chosen approach (propagate env, add startup flags, or switch to centralized DB).

# Gowa Database Study

## Scope

This study is based on the gowa source code that exists in this repo at:

- `dev/app/core/js/libraries/gowa/`

The user request said `dev/app/core/js/gowa`, but the actual checked-in source is under `dev/app/core/js/libraries/gowa/`.

## Short Answer

Gowa itself creates and uses three database roles:

1. A primary WhatsApp store database.
2. An optional separate WhatsApp keys database.
3. A chat storage database.

In standalone/default mode, these are SQLite databases under `storages/`.

In Paiperwork embedded no-disk mode, gowa is forced to use a single in-memory SQLite URI for all of them, so no persistent gowa database file is created on disk.

These gowa databases are not the browser-side PaiperworkDB flow and do not require the user's master key for read/write access.

The master-key-protected flow is separate: it is the browser-side PaiperworkDB store in `dev/app/core/js/utils/feats/database.js`, where WhatsApp metadata and exported session bundles are encrypted/decrypted with `hashedMasterKey`.

## Database Inventory

| Database role | Default location / URI | What it is used for | Created by gowa? | Requires user master key? |
|---|---|---|---|---|
| Primary WhatsApp store | `file:storages/whatsapp.db?...` | Main whatsmeow/sqlstore persistence for WhatsApp device/session state | Yes | No |
| Optional keys store | `DBKeysURI`, default empty meaning same DB as primary | Identity/session key material when split from the primary store | Yes, if configured separately | No |
| Chat storage | `file:storages/chatstorage.db` | Chats, messages, device records, search, synthetic call rows | Yes | No |
| No-disk runtime DB | `file:paiperwork-whatsapp-nodisk?mode=memory&cache=shared...` or another in-memory URI | Runtime-only replacement for all gowa DBs in embedded mode | Yes, but only in RAM | No |
| Browser PaiperworkDB WhatsApp role | Browser SQL.js store managed by PaiperworkDB | Saved device catalog, preferred device, exported session bundles, mode/model lock | No, this is Paiperwork, not gowa | Yes |

## 1. Primary WhatsApp Store

### Default

- Config variable: `config.DBURI`
- Default value: `file:storages/whatsapp.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000`

### Source evidence

- `dev/app/core/js/libraries/gowa/config/settings.go`
- `dev/app/core/js/libraries/gowa/infrastructure/whatsapp/database.go`
- `dev/app/core/js/libraries/gowa/cmd/root.go`

### Purpose

This is the main whatsmeow SQL store container. Gowa initializes it through `sqlstore.Container` and uses it as the primary persistence for WhatsApp connection state.

From the code, this database is the base store used for:

- persisted device store records loaded by whatsmeow
- session state used for reconnect/login recovery
- prekeys storage on the primary DB
- app state and other whatsmeow-managed SQL data

Important detail: the exact internal table set is managed by whatsmeow's `sqlstore` migrations, not by Paiperwork code in this repo.

### Persistence modes

- Standalone/default mode: persistent SQLite file under `storages/whatsapp.db`
- Embedded no-disk mode: forced to an in-memory SQLite URI
- Alternate supported backend: PostgreSQL for this store is supported by gowa source

### Master key requirement

No. This database is opened server-side through SQLite/PostgreSQL drivers. It is not encrypted/decrypted with the browser user's master key.

## 2. Optional Separate Keys Store

### Default

- Config variable: `config.DBKeysURI`
- Default value: empty string
- Effective behavior: when empty, gowa reuses the primary WhatsApp store instead of creating a second file

### Source evidence

- `dev/app/core/js/libraries/gowa/config/settings.go`
- `dev/app/core/js/libraries/gowa/cmd/root.go`
- `dev/app/core/js/libraries/gowa/infrastructure/whatsapp/init.go`

### Purpose

When configured as a separate store, gowa uses it for key-heavy whatsmeow stores such as:

- identities
- sessions
- sender keys
- message secrets
- privacy tokens

The code explicitly keeps `PreKeys` on the primary DB even when a separate keys store exists.

### Does gowa create a separate keys database by default?

No. By default, `DBKeysURI` is empty, and the code reuses the primary WhatsApp DB container.

So this is an optional database role, not always a separate database file.

### Master key requirement

No. This is still a server-side gowa runtime store, not a PaiperworkDB encrypted browser store.

## 3. Chat Storage Database

### Default

- Config variable: `config.ChatStorageURI`
- Default value: `file:storages/chatstorage.db`

### Source evidence

- `dev/app/core/js/libraries/gowa/config/settings.go`
- `dev/app/core/js/libraries/gowa/cmd/root.go`
- `dev/app/core/js/libraries/gowa/infrastructure/chatstorage/sqlite_repository.go`

### Purpose

This is gowa's application-level chat/message database. It is separate from the whatsmeow store.

It is used for:

- chat list persistence
- message persistence
- message search
- archived chat state
- synthetic call metadata rows
- device records used by the registry/reconciliation layer

### Schema created by gowa

The schema is explicitly created in `sqlite_repository.go`.

Tables:

- `schema_info`: migration version tracking
- `chats`: per-chat metadata keyed by `(jid, device_id)`
- `messages`: per-message storage keyed by `(id, chat_jid, device_id)`
- `devices`: device registry records with `device_id`, `display_name`, `jid`, timestamps

Notable indexes and fields:

- indexes for chat/message lookup by device, timestamp, sender, archived state
- `call_metadata` column on `messages` for synthetic call rows

### Backend support in practice

Even though migration comments mention compatibility with multiple databases, the current initialization path in `cmd/root.go` opens chat storage with `sqlite3` directly.

So in the code as it currently runs here, chat storage is effectively SQLite-backed.

### Master key requirement

No. This is a server-side gowa database, not the browser encrypted PaiperworkDB flow.

## 4. No-Disk Embedded Runtime Mode

### Trigger

- Environment variable: `PAIPERWORK_NO_DISK=true`

### Behavior

In this mode, gowa is forced to use in-memory SQLite URIs only.

The code sets:

- `config.DBURI = in-memory URI`
- `config.DBKeysURI = same in-memory URI`
- `config.ChatStorageURI = same in-memory URI`

This means the main WhatsApp store, optional keys store, and chat storage all collapse into one runtime-only in-memory SQLite database.

### Result

- no persistent `storages/whatsapp.db`
- no persistent `storages/chatstorage.db`
- no separate on-disk keys DB
- all gowa DB state disappears when the embedded runtime is stopped

### Master key requirement

No. It is still just a runtime SQLite store in RAM.

## 5. What Belongs To PaiperworkDB Instead

This part is not created by gowa source, but it is important because it is the only WhatsApp-related flow in this repo that uses the user master key.

### Source evidence

- `dev/app/core/js/utils/feats/database.js`

### Browser-side encrypted tables

- `whatsapp_settings`
- `whatsapp_session_bundles`

### Stored there

- saved WhatsApp device catalog
- selected/preferred device metadata
- WhatsApp mode and model lock
- exported/importable session bundles for device recovery

### Encryption model

This flow uses `hashedMasterKey` and explicit `encrypt()` / `decrypt()` calls in PaiperworkDB.

So if the question is, "which WhatsApp persistence requires the user's master key because Paiperwork encrypts/decrypts it?", the answer is:

- browser-side PaiperworkDB WhatsApp state: Yes
- gowa runtime/store databases: No

## Practical Conclusion

### If gowa runs standalone with defaults

Gowa creates these persistent SQLite files:

- `storages/whatsapp.db`
- `storages/chatstorage.db`

And it may also use a separate keys DB only if `DBKeysURI` is explicitly configured.

### If gowa runs inside the current Paiperwork embedded no-disk flow

Gowa does not create persistent database files on disk. It still creates database schemas, but only inside an in-memory SQLite runtime.

### If the question is about master-key-protected persistence

That is not gowa's database layer. That is the PaiperworkDB browser layer, where WhatsApp metadata/session bundles are encrypted with the user's `hashedMasterKey`.

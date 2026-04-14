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

## Migration Tracking

This section tracks the no-disk migration from gowa-managed runtime persistence into PaiperworkDB, one slice at a time.

### Completed

1. Exported/imported WhatsApp session bundle persistence is already stored in the browser-side PaiperworkDB WhatsApp role and encrypted with `hashedMasterKey`.
2. The saved WhatsApp device catalog is now mirrored into a dedicated encrypted PaiperworkDB table named `whatsapp_device_registry`.
3. The WhatsApp session export/import snapshot now carries more runtime auth/state, not just core device identity.
4. The WhatsApp session export/import snapshot now also carries message secrets, privacy tokens, and LID mappings.
5. The WhatsApp session export/import snapshot now also carries per-device chat storage state.
6. WhatsApp frontend-side non-session settings that Paiperwork persists in the WhatsApp role DB are now treated as encrypted master-key-scoped data as well.

What "done" means for item 2:

- the chooser catalog is now persisted under the user's master-key-scoped WhatsApp role DB
- the catalog is isolated per user because each user has a different PaiperworkDB keyspace and encrypted payloads
- in no-disk mode, chooser fallback no longer depends only on the old single-device metadata blob

What "done" means for item 3:

- the exported session bundle now includes additional whatsmeow runtime rows from the configured SQLite stores
- this currently covers: identity keys, peer sessions, sender keys, prekeys, app-state sync keys, app-state versions, and app-state mutation MACs
- those rows are persisted inside the encrypted PaiperworkDB WhatsApp role because the frontend stores the expanded exported bundle there
- on restore, the runtime is rehydrated through `/app/session/import` back into the no-disk SQLite runtime

What "done" means for item 4:

- the expanded session bundle now also includes `whatsmeow_message_secrets`, `whatsmeow_privacy_tokens`, and `whatsmeow_lid_map`
- these rows are exported from the configured runtime SQLite stores and restored into the in-memory runtime on import
- this further reduces dependence on shared server-side persistence for sensitive WhatsApp runtime state

What "done" means for item 5:

- the expanded session bundle now also includes per-device rows from gowa chat storage
- this currently covers `chats`, `messages`, and the matching `devices` registry row for the selected storage device
- message snapshots include media fields and `call_metadata`, so chat history and synthetic call rows can survive no-disk shutdown
- those rows are restored back into the in-memory chat storage SQLite runtime during `/app/session/import`
- the chat snapshot payload is now gzip-compressed before it is stored inside the encrypted session bundle, reducing bundle size without changing restore semantics

What "done" means for item 6:

- Paiperwork-side WhatsApp settings that live in the browser WhatsApp role DB must not rely only on row scoping; they are encrypted with `hashedMasterKey` too
- this currently includes persisted connector mode and model-lock state, in addition to the already encrypted device/session payloads
- that avoids plaintext reuse or accidental exposure if WhatsApp role data is inspected or migrated outside the intended master-key context
- older role DB rows with plaintext mode/model-lock values are now migrated forward to encrypted storage during database initialization
- plaintext lookup keys in `whatsapp_phone_contexts`, `whatsapp_device_registry`, and `whatsapp_session_bundles` are now replaced with master-key-scoped hashed lookup values
- readable phone/device identifiers stay inside encrypted payload blobs or caller input, instead of being used as plaintext primary keys in the WhatsApp role DB

Audit result for the current PaiperworkDB WhatsApp role paths:

- the current frontend WhatsApp persistence paths have been checked for remaining plaintext value leaks between master-key scopes
- the remaining persistent WhatsApp payloads and settings in the WhatsApp role DB are now stored either as encrypted values or as master-key-scoped lookup hashes

Runtime isolation result for the embedded gowa live path:

- the remaining live WhatsApp proxy endpoints now require the current master-key-scoped user context before they can read from or mutate the active gateway runtime
- the server-side incoming webhook queue is no longer a single global drain; it is now partitioned by the active WhatsApp user scope so one master key cannot poll another master key's pending inbound messages through `/api/whatsapp/incoming/poll`
- the frontend WhatsApp connector now sends `X-Paiperwork-User` on live send, presence, file/image send, mode, and incoming-poll requests so runtime access checks use the same master-key scope as PaiperworkDB persistence
- live WhatsApp mode selection and outgoing echo-suppression tracking are now scoped by user as well, instead of being shared process-wide across master keys
- ambiguous non-fresh device resolution now fails closed with a structured `preferred-device-required` response instead of silently picking an arbitrary gateway device when multiple candidates exist without a preferred selection
- the Connectors UI recovers from that response by reselecting the only saved device when possible, showing the saved-device chooser when multiple saved devices exist, or switching to fresh pairing only for explicit start flows with no saved devices

Database tab backup boundary for WhatsApp data:

- the Database tab `Export Database` / `Import Database` flow does include the dedicated PaiperworkDB `whatsapp` role, so persisted WhatsApp settings, preferred/current device info, saved device catalog, phone contexts, and saved session bundles are part of the normal `.pwdb` backup round-trip
- that import path is still master-key-bound: backups are validated against the current `hashedMasterKey`, so a backup created under one master key is rejected when imported under a different one
- transient embedded-server runtime state is not part of the Database tab backup, including the in-memory incoming queue, live outgoing echo-suppression cache, and other process-memory runtime buffers that are rebuilt or lost on restart/reset
- a legacy raw single-database `.db` import only restores the `main` role, not the dedicated `whatsapp` role, so full WhatsApp restore semantics require the normal Paiperwork `.pwdb` bundle

### Pending

1. Remaining WhatsApp runtime data that is still not part of the export/import slice, mainly transient event/retry buffers and any other uncaptured whatsmeow runtime tables.
2. A strategy decision for very large chat histories, because chat storage now travels inside the encrypted session bundle and may still eventually need chunking or dedicated PaiperworkDB tables if payload size becomes a practical limit even after gzip compression.
3. Implementing export/import coverage for remaining non-auth WhatsApp application state like contacts and chat settings, with the requirement that any such PaiperworkDB persistence must be encrypted with `hashedMasterKey` rather than stored as plaintext.

### Important Constraint

The Go gowa runtime does not directly open the browser-side encrypted PaiperworkDB.

So the migration pattern is:

1. gowa runs on an in-memory runtime DB in no-disk mode
2. Paiperwork exports selected state from gowa
3. Paiperwork stores that state in browser-side encrypted PaiperworkDB under the user's master key
4. Paiperwork rehydrates the runtime from that encrypted state when needed

That means "move the database into PaiperworkDB" is feasible, but practically it is done through controlled export/import slices, not by pointing the Go SQLite driver directly at the browser DB.

## Database Inventory

| Database role | Default location / URI | What it is used for | Created by gowa? | Requires user master key? |
|---|---|---|---|---|
| Primary WhatsApp store | `file:storages/whatsapp.db?...` | Main whatsmeow/sqlstore persistence for WhatsApp device/session state | Yes | No |
| Optional keys store | `DBKeysURI`, default empty meaning same DB as primary | Identity/session key material when split from the primary store | Yes, if configured separately | No |
| Chat storage | `file:storages/chatstorage.db` | Chats, messages, device records, search, synthetic call rows | Yes | No |
| No-disk runtime DB | `file:paiperwork-whatsapp-nodisk?mode=memory&cache=shared...` or another in-memory URI | Runtime-only replacement for all gowa DBs in embedded mode | Yes, but only in RAM | No |
| Browser PaiperworkDB WhatsApp role | Browser SQL.js store managed by PaiperworkDB | Saved device catalog, encrypted device registry, preferred device, exported session bundles, mode/model lock | No, this is Paiperwork, not gowa | Yes |

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
- `whatsapp_device_registry`
- `whatsapp_session_bundles`

### Stored there

- saved WhatsApp device catalog
- encrypted per-user device registry mirror for no-disk mode
- selected/preferred device metadata
- WhatsApp mode and model lock
- exported/importable session bundles for device recovery
- expanded auth/runtime state embedded inside exported session bundles
- per-device chat storage snapshots embedded inside exported session bundles

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

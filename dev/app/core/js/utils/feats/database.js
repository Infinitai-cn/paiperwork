class PaiperworkDB {

    static DB_BUNDLE_FORMAT = 'paiperwork-db-bundle-v2';
    static LEGACY_DB_BUNDLE_FORMAT = 'paiperwork-db-bundle-v1';
    static WHATSAPP_LOOKUP_PREFIX = 'lookup_v1:';

    static dbInitialized = false;
    static initializationPromise = null;
    static SQL = null;
    static opfsSupported = false;
    static useIndexedDBOnly = false;
    static openDbInstances = [];
    static ollamaApiKeyCache = new Map();

    static normalizeDbRole(role = 'main') {
        if (role === 'rag') return 'rag';
        if (role === 'slideforge' || role === 'presentation' || role === 'presentations') return 'presentations';
        if (role === 'artifact' || role === 'artifacts') return 'artifacts';
        if (role === 'campaign' || role === 'campaigns' || role === 'campaings') return 'campaings';
        if (role === 'kb') return 'kb';
        if (role === 'images' || role === 'attachments' || role === 'media') return 'images';
        if (role === 'whatsapp') return 'whatsapp';
        if (role === 'wechat') return 'wechat';
        return 'main';
    }

    static getTrackedOpenDatabase(hashedMasterKey, role = 'main') {
        const normalizedRole = this.normalizeDbRole(role);

        for (let i = this.openDbInstances.length - 1; i >= 0; i--) {
            const entry = this.openDbInstances[i];
            if (!entry || entry.role !== normalizedRole || entry.hashedMasterKey !== hashedMasterKey) {
                continue;
            }

            try {
                // Validate handle is still usable before returning it.
                entry.db?.exec?.('SELECT 1');
                return entry.db;
            } catch (_error) {
                this.openDbInstances.splice(i, 1);
            }
        }

        return null;
    }

    static getOpenDatabaseState(hashedMasterKey) {
        return {
            main: !!this.getTrackedOpenDatabase(hashedMasterKey, 'main'),
            rag: !!this.getTrackedOpenDatabase(hashedMasterKey, 'rag'),
            html: false,
            presentations: !!this.getTrackedOpenDatabase(hashedMasterKey, 'presentations'),
            slideforge: !!this.getTrackedOpenDatabase(hashedMasterKey, 'presentations'),
            artifacts: !!this.getTrackedOpenDatabase(hashedMasterKey, 'artifacts'),
            campaigns: !!this.getTrackedOpenDatabase(hashedMasterKey, 'campaings'),
            campaings: !!this.getTrackedOpenDatabase(hashedMasterKey, 'campaings'),
            kb: !!this.getTrackedOpenDatabase(hashedMasterKey, 'kb'),
            images: !!this.getTrackedOpenDatabase(hashedMasterKey, 'images'),
            whatsapp: !!this.getTrackedOpenDatabase(hashedMasterKey, 'whatsapp'),
            wechat: !!this.getTrackedOpenDatabase(hashedMasterKey, 'wechat')
        };
    }

    static getDbFileName(hashedMasterKey, role = 'main') {
        const normalizedRole = this.normalizeDbRole(role);
        if (normalizedRole === 'rag') {
            return `${hashedMasterKey}.rag.db`;
        }
        if (normalizedRole === 'presentations') {
            return `${hashedMasterKey}.presentations.db`;
        }
        if (normalizedRole === 'artifacts') {
            return `${hashedMasterKey}.artifacts.db`;
        }
        if (normalizedRole === 'campaings') {
            return `${hashedMasterKey}.campaings.db`;
        }
        if (normalizedRole === 'kb') {
            return `${hashedMasterKey}.kb.db`;
        }
        if (normalizedRole === 'images') {
            return `${hashedMasterKey}.images.db`;
        }
        if (normalizedRole === 'whatsapp') {
            return `${hashedMasterKey}.whatsapp.db`;
        }
        if (normalizedRole === 'wechat') {
            return `${hashedMasterKey}.wechat.db`;
        }
        return `${hashedMasterKey}.db`;
    }

    static getDbStorageKey(hashedMasterKey, role = 'main') {
        const normalizedRole = this.normalizeDbRole(role);
        if (normalizedRole === 'rag') {
            return `${hashedMasterKey}::rag`;
        }
        if (normalizedRole === 'presentations') {
            return `${hashedMasterKey}::presentations`;
        }
        if (normalizedRole === 'artifacts') {
            return `${hashedMasterKey}::artifacts`;
        }
        if (normalizedRole === 'campaings') {
            return `${hashedMasterKey}::campaings`;
        }
        if (normalizedRole === 'kb') {
            return `${hashedMasterKey}::kb`;
        }
        if (normalizedRole === 'images') {
            return `${hashedMasterKey}::images`;
        }
        if (normalizedRole === 'whatsapp') {
            return `${hashedMasterKey}::whatsapp`;
        }
        if (normalizedRole === 'wechat') {
            return `${hashedMasterKey}::wechat`;
        }
        return hashedMasterKey;
    }

    static getLegacyHtmlDbFileName(hashedMasterKey) {
        return `${hashedMasterKey}.html.db`;
    }

    static getLegacyHtmlDbStorageKey(hashedMasterKey) {
        return `${hashedMasterKey}::html`;
    }

    static async getLegacyHtmlRoleDatabaseBytes(hashedMasterKey) {
        if (!hashedMasterKey) {
            return null;
        }

        if (this.opfsSupported && !this.useIndexedDBOnly) {
            try {
                const root = await navigator.storage.getDirectory();
                const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: true });
                const fileHandle = await dbDir.getFileHandle(this.getLegacyHtmlDbFileName(hashedMasterKey), { create: false });
                const file = await fileHandle.getFile();
                const buffer = await file.arrayBuffer();
                return new Uint8Array(buffer);
            } catch (error) {
                if (error?.name !== 'NotFoundError') {
                    console.warn('Error reading legacy html database from OPFS:', error);
                }
            }
        }

        return new Promise((resolve) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('databases')) {
                    db.createObjectStore('databases');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('databases')) {
                    db.close();
                    resolve(null);
                    return;
                }

                const transaction = db.transaction(['databases'], 'readonly');
                const store = transaction.objectStore('databases');
                const getRequest = store.get(this.getLegacyHtmlDbStorageKey(hashedMasterKey));

                getRequest.onsuccess = () => {
                    db.close();
                    resolve(getRequest.result || null);
                };

                getRequest.onerror = () => {
                    console.warn('Error reading legacy html database from IndexedDB:', getRequest.error);
                    db.close();
                    resolve(null);
                };
            };

            request.onerror = () => {
                console.warn('Error opening IndexedDB while reading legacy html database:', request.error);
                resolve(null);
            };
        });
    }

    static async deleteLegacyHtmlDatabase(hashedMasterKey) {
        if (!hashedMasterKey) {
            return true;
        }

        let opfsDeleted = true;
        if (this.opfsSupported) {
            try {
                const root = await navigator.storage.getDirectory();
                const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });
                await dbDir.removeEntry(this.getLegacyHtmlDbFileName(hashedMasterKey));
            } catch (error) {
                if (error?.name !== 'NotFoundError') {
                    console.warn('Error deleting legacy html database from OPFS:', error);
                    opfsDeleted = false;
                }
            }
        }

        const indexedDbDeleted = await new Promise((resolve) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['databases'], 'readwrite');
                const store = transaction.objectStore('databases');
                const deleteRequest = store.delete(this.getLegacyHtmlDbStorageKey(hashedMasterKey));

                deleteRequest.onsuccess = () => {
                    db.close();
                    resolve(true);
                };

                deleteRequest.onerror = () => {
                    console.error('Error deleting legacy html database from IndexedDB:', deleteRequest.error);
                    db.close();
                    resolve(false);
                };
            };

            request.onerror = () => {
                console.error('Error opening IndexedDB while deleting legacy html database:', request.error);
                resolve(false);
            };
        });

        return opfsDeleted && indexedDbDeleted;
    }

    // Detects if the browser is Safari.
    static isSafari() {
        // Detect Safari browser cause can't write to OPFS, only read
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    // Checks if the browser supports the Origin Private File System (OPFS).
    static async checkOPFSSupport() {
        // Don't even try OPFS on Safari
        if (this.isSafari()) {
           //console.log('Running on Safari - using IndexedDB only');
            return false;
        }

       //console.log('Checking for OPFS support...');
        try {
            // Check if the FileSystem API and OPFS accessor are available
            if (!navigator.storage || !navigator.storage.getDirectory) {
               //console.log('OPFS not supported: API not available');
                return false;
            }

            // Try to actually access OPFS to confirm we have permissions
            const root = await navigator.storage.getDirectory();

            // Test if we can write to OPFS by creating a test file
            const testFileHandle = await root.getFileHandle('opfs_test.txt', { create: true });
            const writable = await testFileHandle.createWritable();
            await writable.write('test');
            await writable.close();

           //console.log('OPFS fully supported (read/write)');
            return true;
        } catch (error) {
           //console.log('OPFS support check failed:', error);
            return false;
        }
    }
    // Retrieves the SQL.js database instance for a given master key hash.
    static async getDatabase(hashedMasterKey, role = 'main', createIfMissing = false) {
        const normalizedRole = this.normalizeDbRole(role);

        const trackedDb = this.getTrackedOpenDatabase(hashedMasterKey, normalizedRole);
        if (trackedDb) {
            return trackedDb;
        }

        // Initialize SQL.js
        if (!this.SQL) {
            this.SQL = await initSqlJs({
                locateFile: file => `/core/js/libraries/SQLjs/${file}`
            });
        }

        // Use our getExistingDatabase method which already handles OPFS/IndexedDB properly
        const dbData = await this.getExistingDatabase(hashedMasterKey, normalizedRole);

        // If we found data, create a new SQL.Database instance from it
        if (dbData) {
            const db = new this.SQL.Database(dbData);
            this.openDbInstances.push({ db, role: normalizedRole, hashedMasterKey });
            return db;
        } else {
            if (!createIfMissing) {
                return null;
            }

            const db = new this.SQL.Database();
            this.openDbInstances.push({ db, role: normalizedRole, hashedMasterKey });
            return db;
        }
    }
    // Retrieves the database file from OPFS for a given master key hash.
    static async getOPFSDatabase(hashedMasterKey, role = 'main') {
        try {
            const root = await navigator.storage.getDirectory();
            const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: true });
            const fileName = this.getDbFileName(hashedMasterKey, role);

            try {
                // Try to get the database file
                const fileHandle = await dbDir.getFileHandle(fileName, { create: false });
                const file = await fileHandle.getFile();
                const buffer = await file.arrayBuffer();

               //console.log(`Retrieved database from OPFS: ${hashedMasterKey} (${buffer.byteLength} bytes)`);
                return new Uint8Array(buffer);
            } catch (error) {
                // File doesn't exist yet, which is normal for new users
               //console.log(`No existing database in OPFS for ${hashedMasterKey}`);
                return null;
            }
        } catch (error) {
            console.error('Error accessing OPFS:', error);
            return null;
        }
    }
    // Retrieves the existing database from OPFS or IndexedDB for a given master key hash.
    static async getExistingDatabase(hashedMasterKey, role = 'main') {
        const normalizedRole = this.normalizeDbRole(role);
        const storageKey = this.getDbStorageKey(hashedMasterKey, normalizedRole);
       //console.log(`🔍 Getting existing database for masterkey: ${hashedMasterKey}`);
       //console.log(`📍 Storage strategy: ${this.opfsSupported && !this.useIndexedDBOnly ? 'OPFS' : 'IndexedDB'}`);

        // Try OPFS first if it's our primary storage
        if (this.opfsSupported && !this.useIndexedDBOnly) {
           //console.log('🔍 Checking OPFS for database...');
            const opfsData = await this.getOPFSDatabase(hashedMasterKey, normalizedRole);
            if (opfsData) {
               //console.log('✅ Database found in OPFS');
                return opfsData;
            }
           //console.log('❌ Database not found in OPFS');

            // If we expected OPFS but didn't find data, check IndexedDB for migration
           //console.log('🔄 Checking IndexedDB for potential migration data...');
        }

        // Use IndexedDB (either as primary or fallback)
       //console.log('🔍 Checking IndexedDB for database...');
        return new Promise((resolve) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('databases')) {
                    db.createObjectStore('databases');
                   //console.log('🆕 Created missing databases object store');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('databases')) {
                   //console.log('❌ Object store "databases" not found');
                    db.close();
                    resolve(null);
                    return;
                }

                try {
                    const transaction = db.transaction(['databases'], 'readonly');
                    const store = transaction.objectStore('databases');
                    const getRequest = store.get(storageKey);

                    getRequest.onsuccess = () => {
                        if (getRequest.result) {
                           //console.log(`✅ Database found in IndexedDB for ${hashedMasterKey}`);

                            // If we found data in IndexedDB but we're supposed to use OPFS,
                            // migrate it to OPFS
                            if (this.opfsSupported && !this.useIndexedDBOnly) {
                               //console.log('🔄 Migrating from IndexedDB to OPFS...');
                                this.saveToOPFS(getRequest.result, hashedMasterKey, normalizedRole).then(() => {
                                   //console.log('✅ Migration to OPFS completed');
                                }).catch(error => {
                                    console.error('❌ Migration to OPFS failed:', error);
                                });
                            }
                        } else {
                           //console.log('❌ No database found in IndexedDB');
                        }
                        db.close();
                        resolve(getRequest.result);
                    };

                    getRequest.onerror = (error) => {
                        console.warn('❌ Error getting database from IndexedDB:', error);
                        db.close();
                        resolve(null);
                    };
                } catch (error) {
                    console.warn('❌ Transaction error:', error);
                    db.close();
                    resolve(null);
                }
            };

            request.onerror = (error) => {
                console.warn('❌ Error opening IndexedDB:', error);
                resolve(null);
            };
        });
    }
    static async saveToIndexedDB(dbExport, storageKey) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onupgradeneeded = (event) => {
               //console.log('🔧 Creating/upgrading IndexedDB store');
                const db = event.target.result;
                if (!db.objectStoreNames.contains('databases')) {
                    db.createObjectStore('databases');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['databases'], 'readwrite');
                const store = transaction.objectStore('databases');

                const putRequest = store.put(dbExport, storageKey);

                putRequest.onsuccess = () => {
                   //console.log('✅ Database saved successfully to IndexedDB');
                    db.close();
                    resolve(true);
                };

                putRequest.onerror = (error) => {
                    console.error('❌ IndexedDB save error:', error);
                    db.close();
                    reject(error);
                };
            };

            request.onerror = (error) => {
                console.error('❌ IndexedDB save error:', error);
                reject(error);
            };
        });
    }

    // Saves the exported database to OPFS or IndexedDB, depending on support.
    static async saveToStorage(dbExport, hashedMasterKey, role = 'main') {
        const normalizedRole = this.normalizeDbRole(role);
        const storageKey = this.getDbStorageKey(hashedMasterKey, normalizedRole);
       //console.log(`💾 Saving database for masterkey: ${hashedMasterKey}`);
       //console.log(`📍 Storage strategy: ${this.opfsSupported ? 'OPFS' : 'IndexedDB'}`);

        // Use OPFS if supported and enabled
        if (this.opfsSupported && !this.useIndexedDBOnly) {
           //console.log('💾 Saving to OPFS...');
            const success = await this.saveToOPFS(dbExport, hashedMasterKey, normalizedRole);
            if (success) {
               //console.log('✅ Database saved successfully to OPFS');
                // Keep IndexedDB in sync as fallback so stale legacy bytes cannot resurrect records.
                try {
                    await this.saveToIndexedDB(dbExport, storageKey);
                } catch (mirrorError) {
                    console.warn('IndexedDB mirror save failed after OPFS success:', mirrorError);
                }
                return true;
            }

            console.error('❌ OPFS save failed, falling back to IndexedDB');
            // If OPFS fails, mark it as unsupported and fall back to IndexedDB
            this.opfsSupported = false;
            this.useIndexedDBOnly = true;
        }

        // Use IndexedDB (either as primary choice or fallback)
       //console.log('💾 Saving to IndexedDB...');
        return this.saveToIndexedDB(dbExport, storageKey);
    }
    // Saves the exported database to OPFS for a given master key hash.
    static async saveToOPFS(dbExport, hashedMasterKey, role = 'main') {
        try {
            const root = await navigator.storage.getDirectory();
            const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: true });
            const fileName = this.getDbFileName(hashedMasterKey, role);
            const fileHandle = await dbDir.getFileHandle(fileName, { create: true });

            // Create a writable stream and write the database export
            const writable = await fileHandle.createWritable();
            await writable.write(dbExport);
            await writable.close();

           //console.log(`Database successfully saved to OPFS: ${hashedMasterKey}`);
            return true;
        } catch (error) {
            console.error('Error saving to OPFS:', error);
            return false;
        }
    }

    static async getRagDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'rag', true);
    }

    static async getPresentationsDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'presentations', true);
    }

    static async getArtifactsDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'artifacts', true);
    }

    static async getCampaignsDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'campaings', true);
    }

    static async getKnowledgeDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'kb', true);
    }

    static async getImagesDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'images', true);
    }

    static async getWhatsappDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'whatsapp', true);
    }

    static async getWechatDatabase(hashedMasterKey) {
        return this.getDatabase(hashedMasterKey, 'wechat', true);
    }

    static async getWhatsappRoleSqlDatabase(hashedMasterKey, createIfMissing = true) {
        if (!this.SQL) {
            this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
        }

        const trackedDb = this.getTrackedOpenDatabase(hashedMasterKey, 'whatsapp');
        if (trackedDb) {
            return trackedDb;
        }

        const existingDb = await this.getExistingDatabase(hashedMasterKey, 'whatsapp');
        if (existingDb) {
            return new this.SQL.Database(existingDb);
        }

        if (!createIfMissing) {
            return null;
        }

        return new this.SQL.Database();
    }

    static async getWechatRoleSqlDatabase(hashedMasterKey, createIfMissing = true) {
        if (!this.SQL) {
            this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
        }

        const trackedDb = this.getTrackedOpenDatabase(hashedMasterKey, 'wechat');
        if (trackedDb) {
            return trackedDb;
        }

        const existingDb = await this.getExistingDatabase(hashedMasterKey, 'wechat');
        if (existingDb) {
            const sqlDb = new this.SQL.Database(existingDb);
            this._ensureWechatRoleSqlDatabaseSchema(sqlDb);
            return sqlDb;
        }

        if (!createIfMissing) {
            return null;
        }

        const sqlDb = new this.SQL.Database();
        this._ensureWechatRoleSqlDatabaseSchema(sqlDb);
        return sqlDb;
    }

    static async saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey) {
        if (!sqlDb || !hashedMasterKey) return false;
        await this.saveToStorage(sqlDb.export(), hashedMasterKey, 'whatsapp');
        return true;
    }

    static async saveWechatRoleSqlDatabase(sqlDb, hashedMasterKey) {
        if (!sqlDb || !hashedMasterKey) return false;
        await this.saveToStorage(sqlDb.export(), hashedMasterKey, 'wechat');
        return true;
    }

    static _ensureWechatRoleSqlDatabaseSchema(sqlDb) {
        if (!sqlDb || typeof sqlDb.run !== 'function') return;

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS login_sessions (
                session_id TEXT PRIMARY KEY,
                base_url TEXT NOT NULL,
                qr_code TEXT NOT NULL,
                qr_code_url TEXT NOT NULL,
                status TEXT NOT NULL,
                account_id TEXT NOT NULL DEFAULT '',
                ilink_user_id TEXT NOT NULL DEFAULT '',
                bot_token TEXT NOT NULL DEFAULT '',
                error TEXT NOT NULL DEFAULT '',
                started_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT
            )
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS accounts (
                account_id TEXT PRIMARY KEY,
                base_url TEXT NOT NULL,
                token TEXT NOT NULL,
                ilink_user_id TEXT NOT NULL DEFAULT '',
                enabled INTEGER NOT NULL DEFAULT 1,
                login_status TEXT NOT NULL DEFAULT 'pending',
                last_error TEXT NOT NULL DEFAULT '',
                get_updates_buf TEXT NOT NULL DEFAULT '',
                last_poll_at TEXT,
                last_inbound_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS peer_contexts (
                account_id TEXT NOT NULL,
                peer_user_id TEXT NOT NULL,
                context_token TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (account_id, peer_user_id)
            )
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS events (
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
                created_at TEXT NOT NULL
            )
        `);

        sqlDb.run(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_events_account_message_inbound
            ON events(account_id, direction, message_id)
            WHERE direction = 'inbound' AND message_id != 0;
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                source TEXT NOT NULL,
                meta_json TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS wechat_account_contexts (
                account TEXT PRIMARY KEY,
                context TEXT
            )
        `);

        sqlDb.run(`
            CREATE TABLE IF NOT EXISTS wechat_settings (
                masterkey_hash TEXT PRIMARY KEY,
                wechat_model_locked TEXT DEFAULT 'false'
            )
        `);
    }

    static async savewechatModelLock(hashedMasterKey, locked) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const normalizedLocked = String(locked).toLowerCase() === 'true' ? 'true' : 'false';
            const encryptedLocked = await this.encrypt(hashedMasterKey, normalizedLocked);
            const sqlDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
            if (!sqlDb) return false;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS wechat_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    wechat_model_locked TEXT DEFAULT 'false'
                )
            `);

            const columnCheck = sqlDb.exec(`PRAGMA table_info(wechat_settings)`);
            const settingsColumns = columnCheck[0]?.values || [];
            const hasModelLock = settingsColumns.some(col => col[1] === 'wechat_model_locked');
            if (!hasModelLock) {
                sqlDb.run(`ALTER TABLE wechat_settings ADD COLUMN wechat_model_locked TEXT DEFAULT 'false'`);
            }

            sqlDb.run(`INSERT OR IGNORE INTO wechat_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);
            sqlDb.run(`
                UPDATE wechat_settings
                SET wechat_model_locked = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedLocked), hashedMasterKey]);

            await this.saveWechatRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving WeChat model lock:', error);
            return false;
        }
    }

    static async getwechatModelLock(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'wechat');
            if (!existingDb) return false;

            const sqlDb = new this.SQL.Database(existingDb);
            this._ensureWechatRoleSqlDatabaseSchema(sqlDb);

            const columnCheck = sqlDb.exec(`PRAGMA table_info(wechat_settings)`);
            const settingsColumns = columnCheck[0]?.values || [];
            const hasModelLock = settingsColumns.some(col => col[1] === 'wechat_model_locked');
            if (!hasModelLock) {
                sqlDb.run(`ALTER TABLE wechat_settings ADD COLUMN wechat_model_locked TEXT DEFAULT 'false'`);
                await this.saveWechatRoleSqlDatabase(sqlDb, hashedMasterKey);
                return false;
            }

            const row = sqlDb.exec(`SELECT wechat_model_locked FROM wechat_settings WHERE masterkey_hash = ? LIMIT 1`, [hashedMasterKey]);
            if (!row || !row[0] || !row[0].values || !row[0].values.length) {
                return false;
            }

            const storedLocked = String(row[0].values[0][0] || '').trim();
            if (!storedLocked) {
                return false;
            }

            try {
                const decryptedLocked = await this.decrypt(hashedMasterKey, storedLocked);
                return String(decryptedLocked || '').trim().toLowerCase() === 'true';
            } catch (_e) {
                const normalizedPlaintext = storedLocked.toLowerCase() === 'true';
                await this.savewechatModelLock(hashedMasterKey, normalizedPlaintext);
                return normalizedPlaintext;
            }
        } catch (error) {
            console.error('Error getting WeChat model lock:', error);
            return false;
        }
    }

    static async saveWechatAccountContext(hashedMasterKey, account, context) {
        try {
            if (!hashedMasterKey || !account) return false;

            await this.initializeDatabase(hashedMasterKey);
            const normalizedAccount = String(account || '').replace(/@.*$/g, '').trim();
            const sqlDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
            if (!sqlDb) return false;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS wechat_account_contexts (
                    account TEXT PRIMARY KEY,
                    context TEXT
                )
            `);

            const serialized = context && typeof context === 'object' ? JSON.stringify(context) : String(context || '');
            const encrypted = serialized ? await this.encrypt(hashedMasterKey, serialized) : '';
            const encryptedJson = encrypted ? JSON.stringify(encrypted) : '';

            sqlDb.run(`
                INSERT OR REPLACE INTO wechat_account_contexts (account, context)
                VALUES (?, ?)
            `, [normalizedAccount, encryptedJson]);

            await this.saveWechatRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving WeChat account context:', error);
            return false;
        }
    }

    static async getWechatAccountContext(hashedMasterKey, account) {
        try {
            if (!hashedMasterKey || !account) return null;

            await this.initializeDatabase(hashedMasterKey);
            const normalizedAccount = String(account || '').replace(/@.*$/g, '').trim();
            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'wechat');
            if (!existingDb) return null;

            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS wechat_account_contexts (
                    account TEXT PRIMARY KEY,
                    context TEXT
                )
            `);

            const rows = sqlDb.exec(`SELECT context FROM wechat_account_contexts WHERE account = ? LIMIT 1`, [normalizedAccount]);
            if (!rows || !rows[0] || !rows[0].values || !rows[0].values.length) {
                return null;
            }

            let encrypted = rows[0].values[0][0] || '';
            if (!encrypted) return null;

            if (typeof encrypted === 'string') {
                try {
                    const maybeObj = JSON.parse(encrypted);
                    if (maybeObj && typeof maybeObj === 'object') {
                        encrypted = maybeObj;
                    }
                } catch (_err) {
                    // keep as raw string
                }
            }

            const decrypted = await this.decrypt(hashedMasterKey, encrypted);
            if (!decrypted) return null;

            try {
                return JSON.parse(decrypted);
            } catch (e) {
                return null;
            }
        } catch (error) {
            console.error('Error getting WeChat account context:', error);
            return null;
        }
    }

    static async scrubConnectorWorkflowSessionsFromEncryptedContextBlob(hashedMasterKey, encryptedBlob) {
        if (!hashedMasterKey || !encryptedBlob) {
            return { changed: false, encryptedJson: typeof encryptedBlob === 'string' ? encryptedBlob : '' };
        }

        let encryptedPayload = encryptedBlob;
        if (typeof encryptedPayload === 'string') {
            try {
                const maybeObj = JSON.parse(encryptedPayload);
                if (maybeObj && typeof maybeObj === 'object') {
                    encryptedPayload = maybeObj;
                }
            } catch (_err) {
                // Keep raw string payloads as-is.
            }
        }

        const decrypted = await this.decrypt(hashedMasterKey, encryptedPayload);
        if (!decrypted) {
            return { changed: false, encryptedJson: typeof encryptedBlob === 'string' ? encryptedBlob : '' };
        }

        let parsedContext;
        try {
            parsedContext = JSON.parse(decrypted);
        } catch (_err) {
            return { changed: false, encryptedJson: typeof encryptedBlob === 'string' ? encryptedBlob : '' };
        }

        if (!parsedContext || typeof parsedContext !== 'object') {
            return { changed: false, encryptedJson: typeof encryptedBlob === 'string' ? encryptedBlob : '' };
        }

        const hasArtifactSession = Object.prototype.hasOwnProperty.call(parsedContext, 'artifactSession');
        const hasFollowUpSession = Object.prototype.hasOwnProperty.call(parsedContext, 'followUpSession');
        if (!hasArtifactSession && !hasFollowUpSession) {
            return { changed: false, encryptedJson: typeof encryptedBlob === 'string' ? encryptedBlob : '' };
        }

        delete parsedContext.artifactSession;
        delete parsedContext.followUpSession;

        const reencrypted = await this.encrypt(hashedMasterKey, JSON.stringify(parsedContext));
        return {
            changed: true,
            encryptedJson: reencrypted ? JSON.stringify(reencrypted) : ''
        };
    }

    static async listPersistedWechatAccounts(hashedMasterKey) {
        if (!hashedMasterKey) {
            return [];
        }

        try {
            const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, false);
            if (!wechatDb) {
                return [];
            }

            const rows = wechatDb.exec(`SELECT account_id, base_url, token, ilink_user_id, enabled, login_status, last_error, get_updates_buf, last_poll_at, last_inbound_at, created_at, updated_at FROM accounts`);
            if (!Array.isArray(rows) || rows.length === 0) {
                return [];
            }

            const result = [];
            const columns = rows[0].columns;
            for (const row of rows[0].values) {
                const item = {};
                for (let i = 0; i < columns.length; i += 1) {
                    item[columns[i]] = row[i];
                }
                result.push({
                    account_id: String(item.account_id || ''),
                    base_url: String(item.base_url || ''),
                    token: String(item.token || ''),
                    ilink_user_id: String(item.ilink_user_id || ''),
                    enabled: Number(item.enabled || 0) === 1,
                    login_status: String(item.login_status || ''),
                    last_error: String(item.last_error || ''),
                    get_updates_buf: String(item.get_updates_buf || ''),
                    created_at: item.created_at ? String(item.created_at) : '',
                    updated_at: item.updated_at ? String(item.updated_at) : '',
                });
            }
            return result;
        } catch (error) {
            console.warn('PaiperworkDB: failed to read persisted WeChat accounts', error);
            return [];
        }
    }

    static async savePersistedWechatAccount(hashedMasterKey, account) {
        const baseUrl = String(account?.base_url || account?.baseUrl || account?.baseurl || account?.baseURL || '').trim();
        const token = String(account?.token || account?.bot_token || '').trim();
        const accountId = String(account?.account_id || account?.accountId || '').trim();
        /* console.info('PaiperworkDB: savePersistedWechatAccount called with normalized values', {
            hashedMasterKeyPresent: !!hashedMasterKey,
            accountId,
            baseUrl,
            tokenPresent: !!token,
            payload: account
        }); */
        if (!hashedMasterKey || !account || !accountId || !baseUrl || !token) {
            console.warn('PaiperworkDB: savePersistedWechatAccount rejected invalid account payload', {
                hashedMasterKeyPresent: !!hashedMasterKey,
                accountId,
                baseUrl,
                tokenPresent: !!token,
                payload: account
            });
            return false;
        }

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        this._ensureWechatRoleSqlDatabaseSchema(wechatDb);
        const now = new Date().toISOString();
        const createdAt = account.created_at || account.createdAt || now;
        const updatedAt = account.updated_at || account.updatedAt || now;
        const enabled = account.enabled ? 1 : 0;
        const loginStatus = String(account.login_status || account.loginStatus || 'connected');

        wechatDb.run(`INSERT OR REPLACE INTO accounts (
            account_id, base_url, token, ilink_user_id, enabled, login_status, last_error,
            get_updates_buf, last_poll_at, last_inbound_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            accountId,
            baseUrl,
            token,
            String(account.ilink_user_id || account.ilinkUserId || ''),
            enabled,
            loginStatus,
            String(account.last_error || account.lastError || ''),
            String(account.get_updates_buf || account.getUpdatesBuf || ''),
            account.last_poll_at || account.lastPollAt || null,
            account.last_inbound_at || account.lastInboundAt || null,
            createdAt,
            updatedAt
        ]);

        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async listPersistedWechatLoginSessions(hashedMasterKey) {
        if (!hashedMasterKey) {
            return [];
        }

        try {
            const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, false);
            if (!wechatDb) {
                return [];
            }

            const rows = wechatDb.exec(`SELECT session_id, base_url, qr_code, qr_code_url, status, account_id, ilink_user_id, bot_token, error, started_at, updated_at, completed_at FROM login_sessions`);
            if (!Array.isArray(rows) || rows.length === 0) {
                return [];
            }

            const result = [];
            const columns = rows[0].columns;
            for (const row of rows[0].values) {
                const item = {};
                for (let i = 0; i < columns.length; i += 1) {
                    item[columns[i]] = row[i];
                }
                result.push({
                    session_id: String(item.session_id || ''),
                    base_url: String(item.base_url || ''),
                    qr_code: String(item.qr_code || ''),
                    qr_code_url: String(item.qr_code_url || ''),
                    status: String(item.status || ''),
                    account_id: String(item.account_id || ''),
                    ilink_user_id: String(item.ilink_user_id || ''),
                    bot_token: String(item.bot_token || ''),
                    error: String(item.error || ''),
                    started_at: item.started_at ? String(item.started_at) : '',
                    updated_at: item.updated_at ? String(item.updated_at) : '',
                    completed_at: item.completed_at ? String(item.completed_at) : ''
                });
            }
            return result;
        } catch (error) {
            console.warn('PaiperworkDB: failed to read persisted WeChat login sessions', error);
            return [];
        }
    }

    static async savePersistedWechatLoginSession(hashedMasterKey, session) {
        const sessionId = String(session?.session_id || session?.sessionId || '').trim();
        const baseUrl = String(session?.base_url || session?.baseUrl || '').trim();
        const qrCode = String(session?.qr_code || session?.qrCode || '').trim();
        const qrCodeUrl = String(session?.qr_code_url || session?.qrCodeUrl || '').trim();
        const status = String(session?.status || '').trim();
        if (!hashedMasterKey || !sessionId || !baseUrl || !qrCodeUrl || (!qrCode && status !== 'confirmed')) {
            return false;
        }

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        const now = new Date().toISOString();
        const startedAt = session.started_at || session.startedAt || now;
        const updatedAt = session.updated_at || session.updatedAt || now;
        const completedAt = session.completed_at || session.completedAt || null;

        wechatDb.run(`INSERT OR REPLACE INTO login_sessions (
            session_id, base_url, qr_code, qr_code_url, status, account_id, ilink_user_id, bot_token,
            error, started_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            sessionId,
            baseUrl,
            qrCode,
            qrCodeUrl,
            String(session.status || ''),
            String(session.account_id || session.accountId || ''),
            String(session.ilink_user_id || session.ilinkUserId || ''),
            String(session.bot_token || session.botToken || ''),
            String(session.error || ''),
            startedAt,
            updatedAt,
            completedAt
        );

        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async listPersistedWechatLogs(hashedMasterKey) {
        if (!hashedMasterKey) {
            return [];
        }

        try {
            const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, false);
            if (!wechatDb) {
                return [];
            }

            const rows = wechatDb.exec(`SELECT id, level, message, source, meta_json, created_at FROM logs ORDER BY id ASC`);
            if (!Array.isArray(rows) || rows.length === 0) {
                return [];
            }

            const result = [];
            const columns = rows[0].columns;
            for (const row of rows[0].values) {
                const item = {};
                for (let i = 0; i < columns.length; i += 1) {
                    item[columns[i]] = row[i];
                }
                result.push({
                    id: Number(item.id || 0),
                    level: String(item.level || ''),
                    message: String(item.message || ''),
                    source: String(item.source || ''),
                    meta_json: String(item.meta_json || ''),
                    created_at: item.created_at ? String(item.created_at) : ''
                });
            }
            return result;
        } catch (error) {
            console.warn('PaiperworkDB: failed to read persisted WeChat logs', error);
            return [];
        }
    }

    static async savePersistedWechatLog(hashedMasterKey, logEntry) {
        const level = String(logEntry?.level || '').trim();
        const message = String(logEntry?.message || '').trim();
        const source = String(logEntry?.source || '').trim();
        if (!hashedMasterKey || !level || !message || !source) {
            return false;
        }

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        const createdAt = logEntry?.created_at || logEntry?.createdAt || new Date().toISOString();
        wechatDb.run(`INSERT INTO logs (level, message, source, meta_json, created_at) VALUES (?, ?, ?, ?, ?)`,
            level,
            message,
            source,
            String(logEntry.meta_json || logEntry.metaJson || ''),
            createdAt
        );
        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async savePersistedWechatEvent(hashedMasterKey, event) {
        if (!hashedMasterKey || !event || !event.account_id) {
            return false;
        }

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        const createdAt = event?.created_at || event?.createdAt || new Date().toISOString();
        wechatDb.run(`INSERT INTO events (
            account_id, direction, event_type, from_user_id, to_user_id, message_id, context_token,
            body_text, media_path, media_file_name, media_mime_type, raw_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            String(event.account_id || event.accountId || ''),
            String(event.direction || ''),
            String(event.event_type || event.eventType || ''),
            String(event.from_user_id || event.fromUserId || ''),
            String(event.to_user_id || event.toUserId || ''),
            Number(event.message_id || event.messageId || 0),
            String(event.context_token || event.contextToken || ''),
            String(event.body_text || event.bodyText || ''),
            String(event.media_path || event.mediaPath || ''),
            String(event.media_file_name || event.mediaFileName || ''),
            String(event.media_mime_type || event.mediaMimeType || ''),
            String(event.raw_json || event.rawJson || ''),
            createdAt
        );
        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async savePersistedWechatPeerContext(hashedMasterKey, peerContext) {
        const accountId = String(peerContext?.account_id || peerContext?.accountId || '').trim();
        const peerUserId = String(peerContext?.peer_user_id || peerContext?.peerUserId || '').trim();
        const contextToken = String(peerContext?.context_token || peerContext?.contextToken || '').trim();
        if (!hashedMasterKey || !accountId || !peerUserId || !contextToken) {
            return false;
        }

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        const updatedAt = peerContext?.updated_at || peerContext?.updatedAt || new Date().toISOString();
        wechatDb.run(`INSERT INTO peer_contexts (account_id, peer_user_id, context_token, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(account_id, peer_user_id) DO UPDATE SET
              context_token = excluded.context_token,
              updated_at = excluded.updated_at`,
            accountId,
            peerUserId,
            contextToken,
            updatedAt
        );
        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async closeWhatsappDatabase(hashedMasterKey = null) {
        return this.closeRoleDatabases('whatsapp', hashedMasterKey);
    }

    static async closeWechatDatabase(hashedMasterKey = null) {
        return this.closeRoleDatabases('wechat', hashedMasterKey);
    }

    static async deleteWechatDatabase(hashedMasterKey) {
        return this.clearWechatDatabase(hashedMasterKey);
    }

    static async clearWechatDatabase(hashedMasterKey) {
        if (!hashedMasterKey) return false;

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        if (!wechatDb) return false;

        const tablesToClear = [
            'accounts',
            'login_sessions',
            'peer_contexts',
            'events',
            'logs',
            'wechat_account_contexts'
        ];

        for (const table of tablesToClear) {
            try {
                wechatDb.run(`DELETE FROM ${table}`);
            } catch (error) {
                console.warn(`PaiperworkDB: failed to clear WeChat table ${table}`, error);
            }
        }

        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async clearWechatContexts(hashedMasterKey) {
        if (!hashedMasterKey) return false;

        const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
        if (!wechatDb) return false;

        const tablesToClear = [
            'logs',
            'peer_contexts',
            'wechat_account_contexts'
        ];

        for (const table of tablesToClear) {
            try {
                wechatDb.run(`DELETE FROM ${table}`);
            } catch (error) {
                console.warn(`PaiperworkDB: failed to clear WeChat context table ${table}`, error);
            }
        }

        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
        return true;
    }

    static async closeRoleDatabases(role, hashedMasterKey = null) {
        const normalizedRole = this.normalizeDbRole(role);
        const remaining = [];

        for (const entry of this.openDbInstances) {
            const shouldClose = entry
                && entry.role === normalizedRole
                && (hashedMasterKey ? entry.hashedMasterKey === hashedMasterKey : true);

            if (!shouldClose) {
                remaining.push(entry);
                continue;
            }

            try {
                entry.db?.close?.();
            } catch (error) {
                console.warn('Error closing tracked SQL.js database instance:', error);
            }
        }

        this.openDbInstances = remaining;
    }

    static async deleteRoleDatabase(role, hashedMasterKey) {
        return this.deleteStoredDatabaseRole(hashedMasterKey, role);
    }

    static async closeRagDatabases(hashedMasterKey = null) {
        return this.closeRoleDatabases('rag', hashedMasterKey);
    }

    static async closePresentationsDatabases(hashedMasterKey = null) {
        return this.closeRoleDatabases('presentations', hashedMasterKey);
    }

    static async closeArtifactDatabases(hashedMasterKey = null) {
        return this.closeRoleDatabases('artifacts', hashedMasterKey);
    }

    static async closeKnowledgeDatabases(hashedMasterKey = null) {
        return this.closeRoleDatabases('kb', hashedMasterKey);
    }

    static async closeImagesDatabases(hashedMasterKey = null) {
        return this.closeRoleDatabases('images', hashedMasterKey);
    }

    static async closeAllDatabases(hashedMasterKey = null) {
        const remaining = [];

        for (const entry of this.openDbInstances) {
            const shouldClose = entry && (hashedMasterKey ? entry.hashedMasterKey === hashedMasterKey : true);

            if (!shouldClose) {
                remaining.push(entry);
                continue;
            }

            try {
                entry.db?.close?.();
            } catch (error) {
                console.warn('Error closing tracked SQL.js database instance:', error);
            }
        }

        this.openDbInstances = remaining;
    }

    static async exportDatabase(hashedMasterKey, role = 'main') {
        try {
            if (role === 'html') {
                const legacyDb = await this.getLegacyHtmlRoleDatabaseBytes(hashedMasterKey);
                return legacyDb && legacyDb.byteLength > 0 ? new Uint8Array(legacyDb) : new Uint8Array(0);
            }

            const normalizedRole = this.normalizeDbRole(role);
            // Export from persisted bytes first so we don't depend on potentially stale tracked SQL.js handles.
            const persistedDb = await this.getExistingDatabase(hashedMasterKey, normalizedRole);
            if (persistedDb && persistedDb.byteLength > 0) {
                return new Uint8Array(persistedDb);
            }

            // Fallback for first-run scenarios where a role DB has not been created yet.
            const db = await this.getDatabase(hashedMasterKey, normalizedRole, true);
            if (!db) {
                if (normalizedRole === 'main') {
                    throw new Error(Lang.get('databaseNotAvailable') || 'Database not available');
                }
                return new Uint8Array(0);
            }

            const exportedDb = db.export();
            // Return a copy so callers cannot mutate SQL.js internal buffers.
            return new Uint8Array(exportedDb);
        } catch (error) {
            console.error('Error exporting database:', error);
            throw error;
        }
    }

    static validateSQLiteBytes(dbBytes) {
        if (!(dbBytes instanceof Uint8Array) || dbBytes.length < 16) {
            return false;
        }

        const sqliteHeader = [83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0];
        for (let i = 0; i < sqliteHeader.length; i++) {
            if (dbBytes[i] !== sqliteHeader[i]) {
                return false;
            }
        }

        return true;
    }

    static encodeUint8ArrayToBase64(bytes) {
        if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
            return '';
        }

        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const slice = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...slice);
        }

        return btoa(binary);
    }

    static decodeBase64ToUint8Array(base64Value) {
        if (!base64Value || typeof base64Value !== 'string') {
            return new Uint8Array(0);
        }

        const binary = atob(base64Value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
    }

    static async inspectImportedMainDatabase(dbBytes) {
        if (!this.validateSQLiteBytes(dbBytes)) {
            return { detectedHashes: [], userSettingHashes: [], tableHashes: [] };
        }

        if (!this.SQL) {
            this.SQL = await initSqlJs({
                locateFile: file => `/core/js/libraries/SQLjs/${file}`
            });
        }

        let sqlDb = null;
        try {
            sqlDb = new this.SQL.Database(dbBytes);

            const userSettingHashes = [];
            try {
                const userSettingsTable = sqlDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'`);
                if (userSettingsTable?.[0]?.values?.length) {
                    const rows = sqlDb.exec(`SELECT masterkey_hash FROM user_settings WHERE masterkey_hash IS NOT NULL AND masterkey_hash != ''`);
                    for (const row of rows?.[0]?.values || []) {
                        const hash = String(row[0] || '').trim();
                        if (/^[a-f0-9]{64}$/i.test(hash)) {
                            userSettingHashes.push(hash);
                        }
                    }
                }
            } catch (error) {
                console.warn('PaiperworkDB: Could not inspect imported user_settings hashes:', error);
            }

            const tableHashes = [];
            try {
                const rows = sqlDb.exec(`SELECT name FROM sqlite_master WHERE type='table'`);
                for (const row of rows?.[0]?.values || []) {
                    const tableName = String(row[0] || '');
                    const match = tableName.match(/_([a-f0-9]{64})$/i);
                    if (match) {
                        tableHashes.push(match[1]);
                    }
                }
            } catch (error) {
                console.warn('PaiperworkDB: Could not inspect imported table hashes:', error);
            }

            const detectedHashes = [...new Set([...userSettingHashes, ...tableHashes])];
            return { detectedHashes, userSettingHashes, tableHashes };
        } finally {
            try {
                sqlDb?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    static async validateImportedBackupForMasterKey(hashedMasterKey, mainDbBytes) {
        const inspection = await this.inspectImportedMainDatabase(mainDbBytes);
        const detectedHashes = inspection.detectedHashes || [];

        /* console.info('PaiperworkDB: Import backup hash inspection', {
            currentHashPrefix: String(hashedMasterKey || '').slice(0, 8),
            detectedHashPrefixes: detectedHashes.map(hash => String(hash).slice(0, 8))
        }); */

        if (detectedHashes.length > 0 && !detectedHashes.includes(hashedMasterKey)) {
            throw new Error('Backup belongs to a different master key. Log in with the original master key before importing.');
        }

        return inspection;
    }

    static async persistTrackedDatabases(hashedMasterKey = null) {
        const trackedEntries = this.openDbInstances.filter((entry) => {
            if (!entry || !entry.db || !entry.role || !entry.hashedMasterKey) {
                return false;
            }

            return hashedMasterKey ? entry.hashedMasterKey === hashedMasterKey : true;
        });

        for (const entry of trackedEntries) {
            try {
                await this.saveToStorage(entry.db.export(), entry.hashedMasterKey, entry.role);
            } catch (error) {
                console.warn(`Error persisting tracked ${entry.role} database before export:`, error);
            }
        }
    }

    static async exportDatabaseBundle(hashedMasterKey) {
        try {
            await this.persistTrackedDatabases(hashedMasterKey);

            const mainDb = await this.exportDatabase(hashedMasterKey, 'main');
            const ragDb = await this.exportDatabase(hashedMasterKey, 'rag');
            const presentationsDb = await this.exportDatabase(hashedMasterKey, 'presentations');
            const artifactsDb = await this.exportDatabase(hashedMasterKey, 'artifacts');
            const campaingsDb = await this.exportDatabase(hashedMasterKey, 'campaings');
            const kbDb = await this.exportDatabase(hashedMasterKey, 'kb');
            const imagesDb = await this.exportDatabase(hashedMasterKey, 'images');
            const whatsappDb = await this.exportDatabase(hashedMasterKey, 'whatsapp');

            const roleSizes = {
                main: mainDb?.length || 0,
                rag: ragDb?.length || 0,
                presentations: presentationsDb?.length || 0,
                artifacts: artifactsDb?.length || 0,
                campaings: campaingsDb?.length || 0,
                kb: kbDb?.length || 0,
                images: imagesDb?.length || 0,
                whatsapp: whatsappDb?.length || 0
            };
            //console.info('PaiperworkDB: Export bundle role sizes (bytes):', roleSizes);

            const payload = {
                format: this.DB_BUNDLE_FORMAT,
                createdAt: new Date().toISOString(),
                dbs: {
                    main: this.encodeUint8ArrayToBase64(mainDb),
                    rag: this.encodeUint8ArrayToBase64(ragDb),
                    presentations: this.encodeUint8ArrayToBase64(presentationsDb),
                    artifacts: this.encodeUint8ArrayToBase64(artifactsDb),
                    campaings: this.encodeUint8ArrayToBase64(campaingsDb),
                    kb: this.encodeUint8ArrayToBase64(kbDb),
                    images: this.encodeUint8ArrayToBase64(imagesDb),
                    whatsapp: this.encodeUint8ArrayToBase64(whatsappDb)
                }
            };

            return JSON.stringify(payload);
        } catch (error) {
            console.error('Error exporting database bundle:', error);
            throw error;
        }
    }

    static async importDatabaseBundle(hashedMasterKey, bundleInput) {
        try {
            let rawBytes = null;
            let bundleText = '';
            const persistedRoles = ['main', 'rag', 'presentations', 'artifacts', 'campaings', 'kb', 'images', 'whatsapp'];

            const existingRolesBeforeImport = [];
            for (const role of persistedRoles) {
                const existingBytes = await this.getExistingDatabase(hashedMasterKey, role);
                if (existingBytes && existingBytes.byteLength > 0) {
                    existingRolesBeforeImport.push(role);
                }
            }
            

            if (bundleInput instanceof Uint8Array) {
                rawBytes = bundleInput;
            } else if (typeof bundleInput === 'string') {
                bundleText = bundleInput;
            } else {
                throw new Error('Unsupported backup format');
            }

            // Backward compatibility: single .db file imports only the main DB.
            if (rawBytes && this.validateSQLiteBytes(rawBytes)) {
                await this.closeAllDatabases(hashedMasterKey);
                await this.importDatabase(hashedMasterKey, rawBytes, 'main');
                return {
                    success: true,
                    legacyMainOnly: true,
                    importedRoles: ['main'],
                    preservedRoles: existingRolesBeforeImport.filter(role => role !== 'main')
                };
            }

            if (!bundleText && rawBytes) {
                bundleText = new TextDecoder().decode(rawBytes);
            }

            const parsed = JSON.parse(bundleText);
            if (!parsed || !parsed.dbs || ![this.DB_BUNDLE_FORMAT, this.LEGACY_DB_BUNDLE_FORMAT].includes(parsed.format)) {
                throw new Error('Invalid Paiperwork backup bundle');
            }

            /* console.info('PaiperworkDB: Starting bundle import', {
                format: parsed.format,
                currentHashPrefix: String(hashedMasterKey || '').slice(0, 8),
                availableRoles: Object.keys(parsed.dbs || {})
            }); */

            const isLegacyBundle = parsed.format === this.LEGACY_DB_BUNDLE_FORMAT;
            const allRoles = isLegacyBundle
                ? ['main', 'rag', 'html', 'kb', 'images', 'whatsapp']
                : ['main', 'rag', 'presentations', 'artifacts', 'campaings', 'kb', 'images', 'whatsapp'];
            if (typeof parsed.dbs.main !== 'string' || !parsed.dbs.main) {
                throw new Error('Backup is missing main database data');
            }

            const decoded = {};
            for (const role of allRoles) {
                const encodedPayload = parsed.dbs[role];
                if (typeof encodedPayload !== 'string' || !encodedPayload) {
                    continue;
                }

                const bytes = this.decodeBase64ToUint8Array(encodedPayload);
                if (!this.validateSQLiteBytes(bytes)) {
                    throw new Error(`Invalid SQLite payload for ${role} database`);
                }

                decoded[role] = bytes;
            }

            if (!decoded.main) {
                throw new Error('Backup is missing main database data');
            }

            await this.validateImportedBackupForMasterKey(hashedMasterKey, decoded.main);

            await this.closeAllDatabases(hashedMasterKey);

            for (const role of persistedRoles) {
                if (decoded[role]) {
                    const saved = await this.saveToStorage(decoded[role], hashedMasterKey, role);
                    if (!saved) {
                        throw new Error(`Could not import ${role} database`);
                    }
                }
            }

            const importedRoles = persistedRoles.filter(role => !!decoded[role]);

            if (isLegacyBundle) {
                await this.deleteLegacyHtmlDatabase(hashedMasterKey);

                if (decoded.html) {
                    const migrationResult = await this.migrateLegacyHtmlRoleDbToDedicatedRoles(hashedMasterKey, {
                        legacyHtmlBytes: decoded.html,
                        cleanupLegacyStorage: false
                    });

                    if (migrationResult.migratedPresentationRows > 0) {
                        importedRoles.push('presentations');
                    }
                    if (migrationResult.migratedArtifactRows > 0) {
                        importedRoles.push('artifacts');
                    }
                }
            } else {
                await this.deleteLegacyHtmlDatabase(hashedMasterKey);
            }

            await this.migrateImportedDatabaseSchema(hashedMasterKey);

            // Verify imported databases can be opened.
            const uniqueImportedRoles = [...new Set(importedRoles)];
            for (const role of uniqueImportedRoles) {
                const verifyDb = await this.getDatabase(hashedMasterKey, role, true);
                verifyDb?.exec?.('SELECT 1');
            }

            return {
                success: true,
                legacyMainOnly: false,
                importedRoles: uniqueImportedRoles,
                preservedRoles: existingRolesBeforeImport.filter(role => !uniqueImportedRoles.includes(role))
            };
        } catch (error) {
            console.error('Error importing database bundle:', error);
            throw error;
        }
    }

    static async deleteStoredDatabaseRole(hashedMasterKey, role = 'main') {
        if (role === 'html') {
            return this.deleteLegacyHtmlDatabase(hashedMasterKey);
        }

        const normalizedRole = this.normalizeDbRole(role);

        await this.closeRoleDatabases(normalizedRole, hashedMasterKey);

        let opfsDeleted = true;
        if (this.opfsSupported) {
            try {
                const root = await navigator.storage.getDirectory();
                const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });
                await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, normalizedRole));
            } catch (error) {
                if (error?.name !== 'NotFoundError') {
                    console.warn(`Error deleting ${normalizedRole} database from OPFS:`, error);
                    opfsDeleted = false;
                }
            }
        }

        const indexedDbDeleted = await new Promise((resolve) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['databases'], 'readwrite');
                const store = transaction.objectStore('databases');
                const storageKey = this.getDbStorageKey(hashedMasterKey, normalizedRole);
                const deleteRequest = store.delete(storageKey);
                deleteRequest.onsuccess = () => resolve(true);
                deleteRequest.onerror = () => {
                    console.error(`Error deleting ${normalizedRole} database from IndexedDB:`, deleteRequest.error);
                    resolve(false);
                };
            };

            request.onerror = () => {
                console.error('Error opening database:', request.error);
                resolve(false);
            };
        });

        return opfsDeleted && indexedDbDeleted;
    }

    static async importDatabase(hashedMasterKey, dbBytes, role = 'main') {
        try {
            if (!this.validateSQLiteBytes(dbBytes)) {
                throw new Error('Invalid database file');
            }

            const normalizedRole = this.normalizeDbRole(role);

            if (normalizedRole === 'main') {
                await this.validateImportedBackupForMasterKey(hashedMasterKey, dbBytes);
            }

            // Close tracked instances for this role/key before replacing persisted bytes.
            await this.closeRoleDatabases(normalizedRole, hashedMasterKey);

            const saved = await this.saveToStorage(dbBytes, hashedMasterKey, normalizedRole);
            if (!saved) {
                throw new Error('Could not save imported database');
            }

            // Ensure the imported file can be opened.
            const verifyDb = await this.getDatabase(hashedMasterKey, normalizedRole, true);
            verifyDb?.exec?.('SELECT 1');

            if (normalizedRole === 'main') {
                await this.migrateImportedDatabaseSchema(hashedMasterKey);
            }

            return true;
        } catch (error) {
            console.error('Error importing database:', error);
            throw error;
        }
    }

    static async migrateImportedDatabaseSchema(hashedMasterKey) {
        let importedMainDb = null;

        try {
            if (!hashedMasterKey) {
                return false;
            }

            await this.ensureDatabaseExists();
            await this.closeAllDatabases(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            const existingMainDb = await this.getExistingDatabase(hashedMasterKey, 'main');
            if (!existingMainDb) {
                return false;
            }

            importedMainDb = new this.SQL.Database(existingMainDb);
            importedMainDb.run(`
                CREATE TABLE IF NOT EXISTS db_version (
                    version INTEGER PRIMARY KEY
                )
            `);

            await this.migrateDatabase(importedMainDb, hashedMasterKey);
            await this.saveToStorage(importedMainDb.export(), hashedMasterKey, 'main');
            return true;
        } catch (error) {
            console.error('Error migrating imported database schema:', error);
            return false;
        } finally {
            try {
                importedMainDb?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    // Migrates a plaintext localStorage key to encrypted storage using secureLocalStorageSet.
    // If the key is already encrypted (JSON with encrypted/iv), this does nothing.
    static async migratePlaintextLocalStorageKeyToEncrypted(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;

            // If already JSON with encrypted and iv, assume it's encrypted
            try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.encrypted && parsed.iv) {
                    return false; // already encrypted
                }
            } catch (e) {
                // Not JSON -> plaintext
            }

            // Encrypt and overwrite using secure helper
            try {
                await PaiperworkDB.secureLocalStorageSet(key, raw);
                return true;
            } catch (err) {
                console.error('Error migrating localStorage key to encrypted form:', key, err);
                return false;
            }
        } catch (error) {
            console.error('migratePlaintextLocalStorageKeyToEncrypted error:', error);
            return false;
        }
    }

    static isEncryptedPayloadObject(value) {
        return !!value &&
            typeof value === 'object' &&
            (Array.isArray(value.encrypted) || typeof value.encrypted === 'string') &&
            (Array.isArray(value.iv) || typeof value.iv === 'string');
    }

    static parseEncryptedPayloadString(value) {
        if (typeof value !== 'string') {
            return this.isEncryptedPayloadObject(value) ? value : null;
        }

        const trimmed = value.trim();
        if (!trimmed || trimmed[0] !== '{') {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            return this.isEncryptedPayloadObject(parsed) ? parsed : null;
        } catch (_error) {
            return null;
        }
    }

    static async normalizeStoredStringValue(rawValue, hashedMasterKey = '') {
        let current = String(rawValue || '').trim();
        if (!current) return '';

        // Unwrap up to two nested encrypted payload layers.
        for (let depth = 0; depth < 2; depth++) {
            const payload = this.parseEncryptedPayloadString(current);
            if (!payload) {
                return current;
            }

            if (!hashedMasterKey) {
                return '';
            }

            const decrypted = String(await this.decrypt(hashedMasterKey, payload) || '').trim();
            if (!decrypted) {
                return '';
            }

            current = decrypted;
        }

        return this.parseEncryptedPayloadString(current) ? '' : current;
    }

    static bytesToBase64(bytes) {
        let binary = '';
        const chunkSize = 0x8000;

        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunk = bytes.subarray(offset, offset + chunkSize);
            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    }

    static base64ToUint8Array(base64Value) {
        const binary = atob(base64Value);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index);
        }

        return bytes;
    }

    static normalizeConversationImageData(imageData) {
        if (!Array.isArray(imageData) || imageData.length === 0) {
            return [];
        }

        return imageData
            .map((img) => {
                if (typeof img === 'string' && img.trim()) {
                    return { src: img };
                }

                if (!img || typeof img !== 'object') {
                    return null;
                }

                const src = typeof img.src === 'string' ? img.src.trim() : '';
                const thumbnail = typeof img.thumbnail === 'string' ? img.thumbnail.trim() : '';

                if (!src && !thumbnail) {
                    return null;
                }

                const normalizedImage = {};

                if (src) {
                    normalizedImage.src = src;
                }

                if (thumbnail && thumbnail !== src) {
                    normalizedImage.thumbnail = thumbnail;
                }

                if (!normalizedImage.src && normalizedImage.thumbnail) {
                    normalizedImage.src = normalizedImage.thumbnail;
                    delete normalizedImage.thumbnail;
                }

                return normalizedImage;
            })
            .filter(Boolean);
    }

    static createConversationAttachmentId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `conversation_image_${crypto.randomUUID()}`;
        }

        return `conversation_image_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    static async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Failed to read blob as data URL'));
            reader.readAsDataURL(blob);
        });
    }

    static parseDataUrlImage(dataUrl) {
        const match = String(dataUrl || '').match(/^data:([^;,]+)?;base64,(.+)$/);
        if (!match) {
            return null;
        }

        const mimeType = (match[1] || 'application/octet-stream').trim();
        const bytes = this.base64ToUint8Array(match[2]);

        return {
            mimeType,
            bytes,
            byteSize: bytes.length,
            dataUrl: String(dataUrl || '')
        };
    }

    static async resolveConversationImageBlobSource(image) {
        if (!image) {
            return null;
        }

        if (image && typeof image === 'object' && image.attachmentId) {
            return {
                attachmentRef: {
                    attachmentId: image.attachmentId,
                    mimeType: image.mimeType || image.mime_type || '',
                    fileName: image.fileName || image.file_name || '',
                    byteSize: image.byteSize || image.byte_size || 0
                }
            };
        }

        let blob = null;
        let dataUrl = '';
        let mimeType = '';
        let fileName = '';
        let byteSize = 0;

        if (typeof image === 'string') {
            if (image.startsWith('data:image/')) {
                dataUrl = image;
            } else if (image.startsWith('blob:')) {
                const response = await fetch(image);
                if (!response.ok) {
                    return null;
                }
                blob = await response.blob();
            } else {
                return null;
            }
        } else if (typeof image === 'object') {
            if (image.originalBlob instanceof Blob) {
                blob = image.originalBlob;
            } else if (image.blob instanceof Blob) {
                blob = image.blob;
            } else if (image.file instanceof Blob) {
                blob = image.file;
            }

            if (typeof image.dataUrl === 'string' && image.dataUrl.startsWith('data:image/')) {
                dataUrl = image.dataUrl;
            } else if (typeof image.src === 'string' && image.src.startsWith('data:image/')) {
                dataUrl = image.src;
            } else if (typeof image.thumbnail === 'string' && image.thumbnail.startsWith('data:image/')) {
                dataUrl = image.thumbnail;
            } else if (!blob && typeof image.src === 'string' && image.src.startsWith('blob:')) {
                const response = await fetch(image.src);
                if (!response.ok) {
                    return null;
                }
                blob = await response.blob();
            }

            mimeType = String(image.mimeType || image.mime_type || '').trim();
            fileName = String(image.fileName || image.file_name || image.name || '').trim();
            byteSize = Number(image.byteSize || image.byte_size || 0) || 0;
        }

        if (!blob && dataUrl) {
            const decoded = this.parseDataUrlImage(dataUrl);
            if (!decoded) {
                return null;
            }

            return {
                bytes: decoded.bytes,
                mimeType: mimeType || decoded.mimeType,
                fileName,
                byteSize: byteSize || decoded.byteSize,
                dataUrl
            };
        }

        if (!blob) {
            return null;
        }

        const bytes = new Uint8Array(await blob.arrayBuffer());

        return {
            bytes,
            mimeType: mimeType || blob.type || 'application/octet-stream',
            fileName,
            byteSize: byteSize || blob.size || bytes.length,
            dataUrl
        };
    }

    static async ensureConversationAttachmentTable(attachmentDb, hashedMasterKey) {
        attachmentDb.run(`
            CREATE TABLE IF NOT EXISTS conversation_attachments_${hashedMasterKey} (
                attachment_id TEXT PRIMARY KEY,
                conversation_group INTEGER DEFAULT 1,
                mime_type TEXT,
                file_name TEXT,
                byte_size INTEGER DEFAULT 0,
                blob_ciphertext BLOB,
                blob_iv BLOB,
                created_at TEXT
            )
        `);
    }

    static async serializeConversationImageRefs(attachmentDb, hashedMasterKey, imageData, conversationGroup = 1) {
        if (!Array.isArray(imageData) || imageData.length === 0) {
            return [];
        }

        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

        const storedImages = [];

        for (const image of imageData) {
            const resolvedSource = await this.resolveConversationImageBlobSource(image);

            if (resolvedSource?.attachmentRef) {
                storedImages.push(resolvedSource.attachmentRef);
                continue;
            }

            if (!resolvedSource || !resolvedSource.bytes || resolvedSource.bytes.length === 0) {
                const fallback = this.normalizeConversationImageData([image])[0];
                if (fallback) {
                    storedImages.push(fallback);
                }
                continue;
            }

            const attachmentId = this.createConversationAttachmentId();
            const encryptedBlob = await this.encryptBinary(hashedMasterKey, resolvedSource.bytes);
            const createdAt = new Date().toISOString();

            attachmentDb.run(
                `INSERT OR REPLACE INTO conversation_attachments_${hashedMasterKey}
                (attachment_id, conversation_group, mime_type, file_name, byte_size, blob_ciphertext, blob_iv, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    attachmentId,
                    conversationGroup,
                    resolvedSource.mimeType || 'application/octet-stream',
                    resolvedSource.fileName || '',
                    resolvedSource.byteSize || resolvedSource.bytes.length,
                    encryptedBlob.encrypted,
                    encryptedBlob.iv,
                    createdAt
                ]
            );

            storedImages.push({
                attachmentId,
                mimeType: resolvedSource.mimeType || 'application/octet-stream',
                fileName: resolvedSource.fileName || '',
                byteSize: resolvedSource.byteSize || resolvedSource.bytes.length
            });
        }

        return storedImages;
    }

    static async resolveStoredConversationImage(attachmentDb, hashedMasterKey, imageRef) {
        if (!imageRef || typeof imageRef !== 'object' || !imageRef.attachmentId) {
            return null;
        }

        if (!attachmentDb) {
            return null;
        }

        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

        const result = attachmentDb.exec(
            `SELECT mime_type, file_name, byte_size, blob_ciphertext, blob_iv
             FROM conversation_attachments_${hashedMasterKey}
             WHERE attachment_id = ?
             LIMIT 1`,
            [imageRef.attachmentId]
        );

        if (!result[0]?.values?.length) {
            return null;
        }

        const row = result[0].values[0];
        const mimeType = row[0] || imageRef.mimeType || imageRef.mime_type || 'application/octet-stream';
        const fileName = row[1] || imageRef.fileName || imageRef.file_name || '';
        const byteSize = row[2] || imageRef.byteSize || imageRef.byte_size || 0;
        const encryptedBlob = row[3];
        const blobIv = row[4];
        const decryptedBytes = await this.decryptBinary(hashedMasterKey, encryptedBlob, blobIv);
        const blob = new Blob([decryptedBytes], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const dataUrl = await this.blobToDataUrl(blob);

        return {
            attachmentId: imageRef.attachmentId,
            src: objectUrl,
            fullImage: objectUrl,
            dataUrl,
            mimeType,
            fileName,
            byteSize,
            blob
        };
    }

    static async resolveConversationImageData(attachmentDb, hashedMasterKey, images) {
        if (!Array.isArray(images) || images.length === 0) {
            return [];
        }

        const resolvedImages = [];

        for (const image of images) {
            if (image && typeof image === 'object' && image.attachmentId) {
                const resolvedAttachment = await this.resolveStoredConversationImage(attachmentDb, hashedMasterKey, image);
                if (resolvedAttachment) {
                    resolvedImages.push(resolvedAttachment);
                    continue;
                }
            }

            if (typeof image === 'string' && image.startsWith('data:image/')) {
                resolvedImages.push({
                    src: image,
                    fullImage: image,
                    dataUrl: image
                });
                continue;
            }

            if (image && typeof image === 'object') {
                const normalizedImage = { ...image };

                if (!normalizedImage.dataUrl) {
                    if (typeof normalizedImage.src === 'string' && normalizedImage.src.startsWith('data:image/')) {
                        normalizedImage.dataUrl = normalizedImage.src;
                    } else if (typeof normalizedImage.thumbnail === 'string' && normalizedImage.thumbnail.startsWith('data:image/')) {
                        normalizedImage.dataUrl = normalizedImage.thumbnail;
                    }
                }

                if (!normalizedImage.src && normalizedImage.dataUrl) {
                    normalizedImage.src = normalizedImage.dataUrl;
                }

                if (!normalizedImage.fullImage) {
                    normalizedImage.fullImage = normalizedImage.src || normalizedImage.thumbnail || normalizedImage.dataUrl || '';
                }

                resolvedImages.push(normalizedImage);
            }
        }

        return resolvedImages;
    }

    static extractConversationAttachmentIdsFromStoredMessage(messageValue) {
        if (!messageValue) {
            return [];
        }

        try {
            const parsedMessage = typeof messageValue === 'string'
                ? JSON.parse(messageValue)
                : messageValue;

            if (!parsedMessage || typeof parsedMessage !== 'object' || !Array.isArray(parsedMessage.images)) {
                return [];
            }

            return parsedMessage.images
                .map((image) => (image && typeof image === 'object' ? String(image.attachmentId || '').trim() : ''))
                .filter(Boolean);
        } catch (_error) {
            return [];
        }
    }

    static async deleteConversationAttachmentsByIds(attachmentDb, hashedMasterKey, attachmentIds = []) {
        const uniqueIds = [...new Set((attachmentIds || []).map(id => String(id || '').trim()).filter(Boolean))];
        if (!attachmentDb || !hashedMasterKey || uniqueIds.length === 0) {
            return 0;
        }

        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

        for (const attachmentId of uniqueIds) {
            attachmentDb.run(
                `DELETE FROM conversation_attachments_${hashedMasterKey} WHERE attachment_id = ?`,
                [attachmentId]
            );
        }

        return uniqueIds.length;
    }

    static async deleteConversationAttachmentsByGroup(attachmentDb, hashedMasterKey, conversationGroup) {
        if (!attachmentDb || !hashedMasterKey || conversationGroup === undefined || conversationGroup === null) {
            return 0;
        }

        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);
        attachmentDb.run(
            `DELETE FROM conversation_attachments_${hashedMasterKey} WHERE conversation_group = ?`,
            [conversationGroup]
        );

        return typeof attachmentDb.getRowsModified === 'function'
            ? (attachmentDb.getRowsModified() || 0)
            : 0;
    }

    static async migrateConversationImagesToAttachments(mainDb, attachmentDb, hashedMasterKey) {
        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

        const rows = mainDb.exec(`
            SELECT id, conversation, role, conversation_group
            FROM conversations_${hashedMasterKey}
            ORDER BY id ASC
        `);

        if (!rows[0]?.values?.length) {
            return { updatedMessages: 0 };
        }

        let updatedMessages = 0;

        for (const row of rows[0].values) {
            const messageId = row[0];
            const encryptedConversation = row[1];
            const encryptedRole = row[2];
            const conversationGroup = row[3] || 1;

            const decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(encryptedRole));
            if (decryptedRole !== 'user') {
                continue;
            }

            const decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(encryptedConversation));

            let parsedMessage;
            try {
                parsedMessage = JSON.parse(decryptedMessage);
            } catch (_error) {
                continue;
            }

            if (!parsedMessage || typeof parsedMessage !== 'object' || parsedMessage.text === undefined || !Array.isArray(parsedMessage.images) || parsedMessage.images.length === 0) {
                continue;
            }

            const migratedImages = await this.serializeConversationImageRefs(
                attachmentDb,
                hashedMasterKey,
                parsedMessage.images,
                conversationGroup
            );

            const nextMessage = JSON.stringify({
                text: parsedMessage.text || '',
                images: migratedImages
            });

            if (nextMessage === decryptedMessage) {
                continue;
            }

            const encryptedNextMessage = await this.encrypt(hashedMasterKey, nextMessage);
            mainDb.run(
                `UPDATE conversations_${hashedMasterKey} SET conversation = ? WHERE id = ?`,
                [JSON.stringify(encryptedNextMessage), messageId]
            );
            updatedMessages += 1;
        }

        return { updatedMessages };
    }

    static async migrateConversationAttachmentsToRoleDb(mainDb, attachmentDb, hashedMasterKey) {
        await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

        const tableCheck = mainDb.exec(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='conversation_attachments_${hashedMasterKey}'
        `);

        if (!tableCheck[0]?.values?.length) {
            return { movedAttachments: 0 };
        }

        const rows = mainDb.exec(`
            SELECT attachment_id, conversation_group, mime_type, file_name, byte_size, blob_ciphertext, blob_iv, created_at
            FROM conversation_attachments_${hashedMasterKey}
        `);

        if (!rows[0]?.values?.length) {
            return { movedAttachments: 0 };
        }

        let movedAttachments = 0;

        for (const row of rows[0].values) {
            attachmentDb.run(
                `INSERT OR REPLACE INTO conversation_attachments_${hashedMasterKey}
                (attachment_id, conversation_group, mime_type, file_name, byte_size, blob_ciphertext, blob_iv, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                row
            );
            movedAttachments += 1;
        }

        mainDb.run(`DELETE FROM conversation_attachments_${hashedMasterKey}`);
        return { movedAttachments };
    }

    static ensurePromptablePresentationHtmlTable(presentationsDb, hashedMasterKey) {
        presentationsDb.run(`
            CREATE TABLE IF NOT EXISTS promptable_presentations_html_${hashedMasterKey} (
                presentation_id INTEGER PRIMARY KEY,
                html_content TEXT,
                updated_at TEXT
            )
        `);
    }

    static ensureArtifactHtmlTable(artifactsDb, hashedMasterKey) {
        artifactsDb.run(`
            CREATE TABLE IF NOT EXISTS artifacts_html_${hashedMasterKey} (
                artifact_id INTEGER PRIMARY KEY,
                html_content TEXT,
                updated_at TEXT
            )
        `);
    }

    static ensureCampaignsTable(campaignsDb, hashedMasterKey) {
        const tableName = `campaigns_${hashedMasterKey}`;
        campaignsDb.run(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                campaign_brief TEXT,
                poster_png TEXT,
                poster_overlay_json TEXT,
                poster_background_image TEXT,
                presentation_html TEXT,
                miniapp_html TEXT,
                palette_json TEXT,
                chat_history_json TEXT,
                orchestrator_context_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);
        this.ensureCampaignConversationColumns(campaignsDb, hashedMasterKey);
        this.ensureCampaignPosterEditorColumns(campaignsDb, hashedMasterKey);
        return tableName;
    }

    static ensureCampaignConversationColumns(campaignsDb, hashedMasterKey) {
        if (!campaignsDb || !hashedMasterKey) {
            return;
        }

        const tableName = `campaigns_${hashedMasterKey}`;
        const tableCheck = campaignsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        if (!tableCheck?.[0]?.values?.length) {
            return;
        }

        const columns = campaignsDb.exec(`PRAGMA table_info(${tableName})`)[0]?.values || [];
        const columnNames = new Set(columns.map(column => String(column?.[1] || '')));

        if (!columnNames.has('chat_history_json')) {
            campaignsDb.run(`ALTER TABLE ${tableName} ADD COLUMN chat_history_json TEXT`);
        }

        if (!columnNames.has('orchestrator_context_json')) {
            campaignsDb.run(`ALTER TABLE ${tableName} ADD COLUMN orchestrator_context_json TEXT`);
        }
    }

    static ensureCampaignPosterEditorColumns(campaignsDb, hashedMasterKey) {
        if (!campaignsDb || !hashedMasterKey) {
            return;
        }

        const tableName = `campaigns_${hashedMasterKey}`;
        const tableCheck = campaignsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        if (!tableCheck?.[0]?.values?.length) {
            return;
        }

        const columns = campaignsDb.exec(`PRAGMA table_info(${tableName})`)[0]?.values || [];
        const columnNames = new Set(columns.map(column => String(column?.[1] || '')));

        if (!columnNames.has('poster_overlay_json')) {
            campaignsDb.run(`ALTER TABLE ${tableName} ADD COLUMN poster_overlay_json TEXT`);
        }

        if (!columnNames.has('poster_background_image')) {
            campaignsDb.run(`ALTER TABLE ${tableName} ADD COLUMN poster_background_image TEXT`);
        }
    }

    static async migrateLegacyCampaignsToDedicatedRoleDb(mainDb, hashedMasterKey) {
        const tableName = `campaigns_${hashedMasterKey}`;
        const legacyTableCheck = mainDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        const campaignsDb = await this.getCampaignsDatabase(hashedMasterKey);
        this.ensureCampaignsTable(campaignsDb, hashedMasterKey);

        let migratedRows = 0;
        let hadLegacyTable = false;

        if (legacyTableCheck[0]?.values?.length) {
            hadLegacyTable = true;
            const rows = mainDb.exec(`
                SELECT id, name, campaign_brief, poster_png, presentation_html, miniapp_html, palette_json, created_at, updated_at
                FROM ${tableName}
            `);

            for (const row of rows?.[0]?.values || []) {
                campaignsDb.run(
                    `INSERT OR REPLACE INTO ${tableName} (
                        id,
                        name,
                        campaign_brief,
                        poster_png,
                        presentation_html,
                        miniapp_html,
                        palette_json,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    row
                );
                migratedRows += 1;
            }

            mainDb.run(`DROP TABLE IF EXISTS ${tableName}`);
        }

        await this.saveToStorage(campaignsDb.export(), hashedMasterKey, 'campaings');
        return { migratedRows, hadLegacyTable };
    }

    static async migrateLegacyHtmlRoleDbToDedicatedRoles(hashedMasterKey, options = {}) {
        let legacyHtmlDb = options.legacyHtmlDb || null;
        let shouldCloseLegacyDb = false;

        try {
            if (!hashedMasterKey) {
                return { migratedPresentationRows: 0, migratedArtifactRows: 0, hadLegacyDb: false };
            }

            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            if (!legacyHtmlDb) {
                const legacyHtmlBytes = options.legacyHtmlBytes || await this.getLegacyHtmlRoleDatabaseBytes(hashedMasterKey);
                if (!legacyHtmlBytes || !legacyHtmlBytes.byteLength) {
                    return { migratedPresentationRows: 0, migratedArtifactRows: 0, hadLegacyDb: false };
                }

                legacyHtmlDb = new this.SQL.Database(legacyHtmlBytes);
                shouldCloseLegacyDb = true;
            }

            const tableExists = (sqlDb, tableName) => {
                try {
                    const result = sqlDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
                    return !!(result?.[0]?.values?.length);
                } catch (_error) {
                    return false;
                }
            };

            const presentationTableName = `promptable_presentations_html_${hashedMasterKey}`;
            const artifactTableName = `artifacts_html_${hashedMasterKey}`;
            const presentationsDb = await this.getDatabase(hashedMasterKey, 'presentations', true);
            const artifactsDb = await this.getDatabase(hashedMasterKey, 'artifacts', true);

            this.ensurePromptablePresentationHtmlTable(presentationsDb, hashedMasterKey);
            this.ensureArtifactHtmlTable(artifactsDb, hashedMasterKey);

            let migratedPresentationRows = 0;
            let migratedArtifactRows = 0;

            if (tableExists(legacyHtmlDb, presentationTableName)) {
                const rows = legacyHtmlDb.exec(`SELECT presentation_id, html_content, updated_at FROM ${presentationTableName}`);
                for (const row of rows?.[0]?.values || []) {
                    presentationsDb.run(
                        `INSERT OR REPLACE INTO ${presentationTableName} (presentation_id, html_content, updated_at) VALUES (?, ?, ?)`,
                        row
                    );
                    migratedPresentationRows += 1;
                }
            }

            if (tableExists(legacyHtmlDb, artifactTableName)) {
                const rows = legacyHtmlDb.exec(`SELECT artifact_id, html_content, updated_at FROM ${artifactTableName}`);
                for (const row of rows?.[0]?.values || []) {
                    artifactsDb.run(
                        `INSERT OR REPLACE INTO ${artifactTableName} (artifact_id, html_content, updated_at) VALUES (?, ?, ?)`,
                        row
                    );
                    migratedArtifactRows += 1;
                }
            }

            if (migratedPresentationRows > 0) {
                await this.saveToStorage(presentationsDb.export(), hashedMasterKey, 'presentations');
            }

            if (migratedArtifactRows > 0) {
                await this.saveToStorage(artifactsDb.export(), hashedMasterKey, 'artifacts');
            }

            if (options.cleanupLegacyStorage !== false) {
                await this.deleteLegacyHtmlDatabase(hashedMasterKey);
            }

            return {
                migratedPresentationRows,
                migratedArtifactRows,
                hadLegacyDb: true
            };
        } catch (error) {
            console.error('DATABASE MIGRATION: Error migrating legacy html role database', error);
            return { migratedPresentationRows: 0, migratedArtifactRows: 0, hadLegacyDb: false };
        } finally {
            if (shouldCloseLegacyDb) {
                try {
                    legacyHtmlDb?.close?.();
                } catch (_error) {
                    // Ignore SQL.js close errors during cleanup.
                }
            }
        }
    }

    // Reads a localStorage key that may be plaintext or secureLocalStorageSet-encrypted.
    // For encrypted payloads, this uses secureLocalStorageGet(key) with key-derived crypto.
    static async readNormalizedLocalStorageValue(key, hashedMasterKey = '') {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return '';

            const encryptedPayload = this.parseEncryptedPayloadString(raw);
            if (encryptedPayload) {
                const decrypted = await this.secureLocalStorageGet(key);
                return String(decrypted || '').trim();
            }

            return await this.normalizeStoredStringValue(raw, hashedMasterKey);
        } catch (_error) {
            return '';
        }
    }
    // Ensures the database and storage strategy are set up and available.
    static async ensureDatabaseExists() {
       //console.log('🔧 Ensuring PaiperworkDB database exists and determining storage strategy');

        // Reset storage strategy flags
        this.opfsSupported = false;
        this.useIndexedDBOnly = false;

        // Check OPFS support for non-Safari browsers
        if (!this.isSafari()) {
           //console.log('🔍 Non-Safari browser detected, checking OPFS support...');
            this.opfsSupported = await this.checkOPFSSupport();

            if (this.opfsSupported) {
                try {
                    // Create OPFS directory for databases
                    const root = await navigator.storage.getDirectory();
                    await root.getDirectoryHandle('PaiperworkDB', { create: true });
                   //console.log('✅ OPFS database directory created/verified - using OPFS as primary storage');
                    this.useIndexedDBOnly = false;
                } catch (error) {
                    console.error('❌ Error ensuring OPFS directory exists:', error);
                    this.opfsSupported = false;
                    this.useIndexedDBOnly = true;
                   //console.log('⚠️ OPFS failed, falling back to IndexedDB');
                }
            } else {
                this.useIndexedDBOnly = true;
               //console.log('⚠️ OPFS not supported, using IndexedDB');
            }
        } else {
            this.opfsSupported = false;
            this.useIndexedDBOnly = true;
           //console.log('🍎 Safari detected, using IndexedDB only');
        }

        // Set up IndexedDB only if we're not using OPFS or if OPFS failed
        if (this.useIndexedDBOnly) {
           //console.log('🗄️ Setting up IndexedDB as primary storage');
            return new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.open('PaiperworkDB', 1);

                    request.onupgradeneeded = (event) => {
                       //console.log('🔧 Creating or upgrading PaiperworkDB database');
                        const db = event.target.result;

                        if (!db.objectStoreNames.contains('databases')) {
                           //console.log('🆕 Creating databases object store');
                            db.createObjectStore('databases');
                        }
                    };

                    request.onsuccess = (event) => {
                       //console.log('✅ IndexedDB database opened successfully');
                        const db = event.target.result;

                        if (!db.objectStoreNames.contains('databases')) {
                            console.error('❌ Object store "databases" not found after initialization');
                            db.close();

                            const currentVersion = db.version;
                            const upgradeRequest = indexedDB.open('PaiperworkDB', currentVersion + 1);

                            upgradeRequest.onupgradeneeded = (event) => {
                               //console.log('🔧 Upgrading database version to create missing object store');
                                const upgradeDb = event.target.result;
                                if (!upgradeDb.objectStoreNames.contains('databases')) {
                                    upgradeDb.createObjectStore('databases');
                                   //console.log('✅ Created missing databases object store');
                                }
                            };

                            upgradeRequest.onsuccess = () => {
                               //console.log('✅ Database upgrade successful');
                                resolve(true);
                            };

                            upgradeRequest.onerror = (error) => {
                                console.error('❌ Error upgrading database:', error);
                                reject(error);
                            };
                        } else {
                           //console.log('✅ IndexedDB object store verified');
                            db.close();
                            resolve(true);
                        }
                    };

                    request.onerror = (error) => {
                        console.error('❌ Error opening IndexedDB:', error);
                        reject(error);
                    };
                } catch (error) {
                    console.error('❌ Exception ensuring IndexedDB exists:', error);
                    reject(error);
                }
            });
        } else {
           //console.log('✅ OPFS setup complete');
            return true;
        }
    }
    // Initializes the database for a given master key hash, creating tables if needed.
    static async initializeDatabase(hashedMasterKey) {
        // If already initialized, return immediately
        if (this.dbInitialized) {
           //console.log('Database already initialized, skipping');
            return true;
        }

        // If initialization is in progress, wait for it
        if (this.initializationPromise) {
           //console.log('Database initialization already in progress, waiting...');
            return this.initializationPromise;
        }

        // Set up the initialization promise
        this.initializationPromise = (async () => {
           //console.log('Starting database initialization for masterkey:', hashedMasterKey);

            try {
                // First, make sure the database and object store exist
                await this.ensureDatabaseExists();

               //console.log('Initializing SQL.js');
                const SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });

                // Store SQL reference for reuse
                this.SQL = SQL;

                // Check for existing database
               //console.log('Checking for existing database');
                const existingDb = await this.getExistingDatabase(hashedMasterKey);
                let db;

                if (existingDb) {
                   //console.log('Loading existing database for masterkey:', hashedMasterKey);
                    db = new SQL.Database(existingDb);
                } else {
                   //console.log('Creating new database for masterkey:', hashedMasterKey);
                    db = new SQL.Database();

                    // Create version tracking first
                    db.run(`
                        CREATE TABLE IF NOT EXISTS db_version (
                            version INTEGER PRIMARY KEY
                        )
                    `);

                    // Create initial table structure
                    db.run(`
                        CREATE TABLE IF NOT EXISTS user_settings (
                            masterkey_hash TEXT PRIMARY KEY,
                            system_prompt TEXT,
                            model TEXT,
                            context_size TEXT,
                            insights_enabled TEXT,
                            visual_model TEXT,
                            model_provider TEXT,
                            ollama_api_key TEXT
                        )
                    `);

                    // Initialize settings if needed
                    const count = db.exec(`SELECT COUNT(*) FROM user_settings WHERE masterkey_hash = ?`, [hashedMasterKey])[0].values[0][0];
                    if (count === 0) {
                        const defaultInsightsEnabled = await this.encrypt(hashedMasterKey, 'false');
                        db.run(`
                            INSERT INTO user_settings
                            (masterkey_hash, system_prompt, model, context_size, insights_enabled)
                            VALUES (?, ?, ?, ?, ?)
                        `, [hashedMasterKey, '', '', '8192', JSON.stringify(defaultInsightsEnabled)]);
                       //console.log('Initialized new user settings with insights disabled');
                    }

                    db.run(`
                        CREATE TABLE IF NOT EXISTS conversations_${hashedMasterKey} (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            message_id TEXT,
                            conversation TEXT,
                            embedding BLOB,
                            timestamp DATETIME, 
                            role TEXT,
                            conversation_group INTEGER DEFAULT 1
                        );
                    `);

                    db.run(`
                        CREATE TABLE IF NOT EXISTS subjective_insights_${hashedMasterKey} (
                            insight_id TEXT PRIMARY KEY,
                            insight_type TEXT,
                            insight_content TEXT,
                            confidence REAL,
                            timestamp TEXT,
                            related_conversation_id TEXT
                        )
                    `);

                    db.run(`
                        CREATE TABLE IF NOT EXISTS knowledge_collections_${hashedMasterKey} (
                            collection_id TEXT PRIMARY KEY,
                            collection_data TEXT,
                            created_at TEXT,
                            updated_at TEXT
                        )
                    `);

                    db.run(`
                        CREATE TABLE IF NOT EXISTS research_meta_${hashedMasterKey} (
                            key TEXT PRIMARY KEY,
                            value TEXT,
                            updated_at TEXT
                        )
                    `);

                   //console.log('Database tables created successfully');
                }

                // Save the database using our enhanced saveToStorage method
                // which will automatically use OPFS if supported
                await this.saveToStorage(db.export(), hashedMasterKey);

                // Migrate database - Run this only ONCE during initialization
                await this.migrateDatabase(db, hashedMasterKey);

               //console.log('Database initialization complete');
                this.dbInitialized = true;
                return true;
            } catch (error) {
                console.error('Database initialization error:', error);
                return false;
            } finally {
                // Clear the promise regardless of outcome
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }


    // Migrates the database schema to the latest version.
    static async migrateDatabase(db, hashedMasterKey) {
       //console.log('Migrating database for masterkey:', hashedMasterKey);

        try {
            const latestVersion = 34;
            // Get current version
            const versionResult = db.exec('SELECT version FROM db_version');
            const currentVersion = versionResult.length ? versionResult[0].values[0][0] : 0;

           //console.log('Current database version:', currentVersion);

            if (currentVersion >= latestVersion) {
                return true;
            }

            // Version 1: Initial tables
            if (currentVersion < 1) {
                db.run(`
                    CREATE TABLE IF NOT EXISTS user_settings (
                        masterkey_hash TEXT PRIMARY KEY,
                        system_prompt TEXT,
                        model TEXT,
                        context_size TEXT
                    )
                `);
               //console.log('Migrated to version 1');
            }

            // Version 2: Add insights_enabled
            if (currentVersion < 2) {
                const columnCheck = db.exec(`PRAGMA table_info(user_settings)`);
                const hasInsightsColumn = columnCheck[0].values.some(col => col[1] === 'insights_enabled');

                if (!hasInsightsColumn) {
                    db.run(`ALTER TABLE user_settings ADD COLUMN insights_enabled TEXT DEFAULT 'false'`);
                   //console.log('Added insights_enabled column in version 2');
                }
            }

            // Version 3: Add visual_model column
            if (currentVersion < 3) {
                const columnCheck = db.exec(`PRAGMA table_info(user_settings)`);
                const hasVisualModelColumn = columnCheck[0].values.some(col => col[1] === 'visual_model');

                if (!hasVisualModelColumn) {
                    db.run(`ALTER TABLE user_settings ADD COLUMN visual_model TEXT`);
                   //console.log('Added visual_model column in version 3');
                }
            }

            // Version 5: Add conversation_group column to all conversation tables
            if (currentVersion < 5) {
                try {
                   //console.log('DATABASE MIGRATION: Adding conversation_group column to tables');

                    // First check if the conversations table exists for this masterkey
                    const tableCheck = db.exec(`SELECT name FROM sqlite_master 
                        WHERE type='table' AND name='conversations_${hashedMasterKey}'`);

                    if (tableCheck.length > 0 && tableCheck[0].values.length > 0) {
                        // Check if the conversation_group column already exists
                        const columnCheck = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
                        const hasGroupColumn = columnCheck[0].values.some(col => col[1] === 'conversation_group');

                        if (!hasGroupColumn) {
                           //console.log(`Adding conversation_group column to conversations_${hashedMasterKey}`);

                            // Add the column
                            db.exec(`ALTER TABLE conversations_${hashedMasterKey} 
                                   ADD COLUMN conversation_group INTEGER DEFAULT 1`);

                           //console.log('conversation_group column added successfully');
                        } else {
                           //console.log('conversation_group column already exists');
                        }
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error during migration to version 5', error);
                }
            }

            // Version 6: Add research columns
            if (currentVersion < 6) {
                try {
                   //console.log('DATABASE MIGRATION: Adding research tables');

                    // Create knowledge collections table
                    db.exec(`
                        CREATE TABLE IF NOT EXISTS knowledge_collections_${hashedMasterKey} (
                            collection_id TEXT PRIMARY KEY,
                            collection_data TEXT,
                            created_at TEXT,
                            updated_at TEXT
                        )
                    `);

                    // Create research meta table for comparative analysis and other metadata
                    db.exec(`
                        CREATE TABLE IF NOT EXISTS research_meta_${hashedMasterKey} (
                            key TEXT PRIMARY KEY,
                            value TEXT,
                            updated_at TEXT
                        )
                    `);

                   //console.log('DATABASE MIGRATION: Research tables created successfully');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error creating research tables', error);
                }
            }

            // Version 7: Add model context sizes table
            if (currentVersion < 7) {
                try {
                   //console.log('DATABASE MIGRATION: Adding model context sizes table');

                    // Create model context sizes table
                    db.exec(`
            CREATE TABLE IF NOT EXISTS model_context_sizes_${hashedMasterKey} (
                model_name TEXT PRIMARY KEY,
                context_size INTEGER,
                is_kvcache_q8 BOOLEAN,
                created_at TEXT,
                updated_at TEXT
            )
        `);

                   //console.log('DATABASE MIGRATION: Model context sizes table created successfully');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error creating model context sizes table', error);
                }
            }
            if (currentVersion < 8) {
                try {
                   //console.log('DATABASE MIGRATION: Adding use_calculated_context flag to model context sizes table');

                    // Check if table exists first
                    const tableExists = db.exec(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='model_context_sizes_${hashedMasterKey}'
        `);

                    if (tableExists[0]?.values.length) {
                        // Check if the column already exists
                        const columnsResult = db.exec(`PRAGMA table_info(model_context_sizes_${hashedMasterKey})`);
                        const hasUseFlagColumn = columnsResult[0]?.values.some(col => col[1] === 'use_calculated_context');

                        if (!hasUseFlagColumn) {
                            db.exec(`
                    ALTER TABLE model_context_sizes_${hashedMasterKey} 
                    ADD COLUMN use_calculated_context BOOLEAN DEFAULT TRUE
                `);
                           //console.log('DATABASE MIGRATION: Added use_calculated_context column');
                        }
                    }

                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding use_calculated_context flag', error);
                }
            }

            // Version 9: Add custom styles table per-user
            if (currentVersion < 9) {
                try {
                    db.exec(`
                        CREATE TABLE IF NOT EXISTS custom_styles_${hashedMasterKey} (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT,
                            model TEXT,
                            prompt TEXT,
                            code TEXT,
                            is_active INTEGER DEFAULT 0,
                            created_at TEXT,
                            updated_at TEXT
                        )
                    `);
                   //console.log('DATABASE MIGRATION: custom_styles table created');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error creating custom_styles table', error);
                }
            }

            // Version 10: Add promptable presentations table per-user
            if (currentVersion < 10) {
                try {
                    db.exec(`
                        CREATE TABLE IF NOT EXISTS promptable_presentations_${hashedMasterKey} (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            title TEXT,
                            html_content TEXT,
                            mode TEXT DEFAULT 'html',
                            created_at TEXT,
                            updated_at TEXT
                        )
                    `);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error creating promptable presentations table', error);
                }
            }

            // Version 11: Add mode column to promptable presentations
            if (currentVersion < 11) {
                try {
                    const tableName = `promptable_presentations_${hashedMasterKey}`;
                    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
                    if (tableCheck.length > 0 && tableCheck[0].values.length > 0) {
                        const columns = db.exec(`PRAGMA table_info(${tableName})`);
                        const hasModeColumn = columns[0]?.values?.some(col => col[1] === 'mode');
                        if (!hasModeColumn) {
                            db.run(`ALTER TABLE ${tableName} ADD COLUMN mode TEXT DEFAULT 'html'`);
                        }
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding promptable presentation mode column', error);
                }
            }

            // Version 12: Add model provider + Ollama API key columns
            if (currentVersion < 12) {
                try {
                    const columnCheck = db.exec(`PRAGMA table_info(user_settings)`);
                    const hasModelProviderColumn = columnCheck[0].values.some(col => col[1] === 'model_provider');
                    const hasApiKeyColumn = columnCheck[0].values.some(col => col[1] === 'ollama_api_key');

                    if (!hasModelProviderColumn) {
                        db.run(`ALTER TABLE user_settings ADD COLUMN model_provider TEXT`);
                    }

                    if (!hasApiKeyColumn) {
                        db.run(`ALTER TABLE user_settings ADD COLUMN ollama_api_key TEXT`);
                    }

                    // Default legacy rows to local provider when empty.
                    db.run(`UPDATE user_settings SET model_provider = 'local' WHERE model_provider IS NULL OR model_provider = ''`);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding model provider/api key columns', error);
                }
            }

            // Version 13: Migrate legacy embedded KB entries to dedicated kb database
            if (currentVersion < 13) {
                try {
                    const migrationResult = await this.migrateLegacyKnowledgeCollectionsToDedicatedDb(db, hashedMasterKey);
                    if (migrationResult?.migratedCollections > 0) {
                        /* console.info(
                            `DATABASE MIGRATION: Moved ${migrationResult.migratedEntries} KB entries ` +
                            `from ${migrationResult.migratedCollections} collections to dedicated KB database.`
                        ); */
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating legacy KB entries', error);
                }
            }

            // Version 14: Add WhatsApp device mapping fields to user_settings
            if (currentVersion < 14) {
                try {
                    const columnCheck = db.exec(`PRAGMA table_info(user_settings)`);
                    const hasWhatsappDeviceId = columnCheck[0].values.some(col => col[1] === 'whatsapp_device_id');
                    const hasWhatsappDeviceMeta = columnCheck[0].values.some(col => col[1] === 'whatsapp_device_meta');

                    if (!hasWhatsappDeviceId) {
                        db.run(`ALTER TABLE user_settings ADD COLUMN whatsapp_device_id TEXT`);
                    }
                    if (!hasWhatsappDeviceMeta) {
                        db.run(`ALTER TABLE user_settings ADD COLUMN whatsapp_device_meta TEXT`);
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding whatsapp_device columns', error);
                }
            }

            // Version 16: Add WhatsApp mode for Personal/Bot mode toggle
            if (currentVersion < 16) {
                try {
                    const columnCheck = db.exec(`PRAGMA table_info(user_settings)`);
                    const hasWhatsappMode = columnCheck[0].values.some(col => col[1] === 'whatsapp_mode');
                    if (!hasWhatsappMode) {
                        db.run(`ALTER TABLE user_settings ADD COLUMN whatsapp_mode TEXT DEFAULT ''`);
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding whatsapp_mode column', error);
                }
            }

            // Version 17: Migrate WhatsApp per-phone context key format from localStorage into secure DB.
            if (currentVersion < 17) {
                try {
                    db.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                            phone TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const key = localStorage.key(i);
                        if (!key || !key.startsWith('whatsappPhoneContext_')) continue;

                        const remainder = key.replace('whatsappPhoneContext_', '');
                        if (!remainder) continue;

                        let normalizedPhone = remainder;
                        let sourceMasterHash = null;

                        const parts = remainder.split('_');
                        if (parts.length > 1) {
                            const cand = parts[0];
                            const candPhone = parts.slice(1).join('_');
                            if (cand === hashedMasterKey || cand.length === 64) {
                                sourceMasterHash = cand;
                                normalizedPhone = candPhone;
                            }
                        }

                        if (sourceMasterHash && sourceMasterHash !== hashedMasterKey) {
                            continue;
                        }

                        normalizedPhone = String(normalizedPhone).replace(/@.*$/g, '').trim();
                        if (!normalizedPhone) continue;

                        try {
                            const stored = await this.secureLocalStorageGet(key);
                            if (!stored) {
                                if (!sourceMasterHash || sourceMasterHash === hashedMasterKey) localStorage.removeItem(key);
                                continue;
                            }

                            let parsedContext;
                            try {
                                parsedContext = JSON.parse(stored);
                            } catch (_e) {
                                parsedContext = { value: stored };
                            }

                            const payload = typeof parsedContext === 'object' ? parsedContext : { value: parsedContext };
                            const encrypted = await this.encrypt(hashedMasterKey, JSON.stringify(payload));

                            db.run(`
                                INSERT OR REPLACE INTO whatsapp_phone_contexts (phone, context)
                                VALUES (?, ?)
                            `, [normalizedPhone, encrypted]);

                            if (!sourceMasterHash || sourceMasterHash === hashedMasterKey) {
                                localStorage.removeItem(key);
                            }
                        } catch (err) {
                            console.warn('DATABASE MIGRATION: Could not migrate whatsappPhoneContext for key', key, err);
                        }
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating whatsappPhoneContext keys', error);
                }
            }

            // Version 18: Move WhatsApp settings/context into dedicated whatsapp role DB.
            if (currentVersion < 18) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_settings (
                            masterkey_hash TEXT PRIMARY KEY,
                            whatsapp_device_id TEXT,
                            whatsapp_device_meta TEXT,
                            whatsapp_mode TEXT DEFAULT ''
                        )
                    `);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                            phone TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                            device_id TEXT PRIMARY KEY,
                            session_blob TEXT,
                            metadata_blob TEXT,
                            updated_at TEXT
                        )
                    `);

                    const settingsColumns = db.exec(`PRAGMA table_info(user_settings)`);
                    const hasDeviceID = settingsColumns[0]?.values?.some(col => col[1] === 'whatsapp_device_id');
                    const hasDeviceMeta = settingsColumns[0]?.values?.some(col => col[1] === 'whatsapp_device_meta');
                    const hasMode = settingsColumns[0]?.values?.some(col => col[1] === 'whatsapp_mode');

                    if (hasDeviceID || hasDeviceMeta || hasMode) {
                        const row = db.exec(`
                            SELECT whatsapp_device_id, whatsapp_device_meta, whatsapp_mode
                            FROM user_settings
                            WHERE masterkey_hash = ?
                            LIMIT 1
                        `, [hashedMasterKey]);

                        if (row && row[0] && row[0].values && row[0].values.length) {
                            const encDeviceID = row[0].values[0][0] || '';
                            const encDeviceMeta = row[0].values[0][1] || '';
                            const mode = row[0].values[0][2] || '';
                            const encMode = mode ? JSON.stringify(await this.encrypt(hashedMasterKey, String(mode))) : '';

                            whatsappDb.run(`
                                INSERT OR REPLACE INTO whatsapp_settings
                                (masterkey_hash, whatsapp_device_id, whatsapp_device_meta, whatsapp_mode)
                                VALUES (?, ?, ?, ?)
                            `, [hashedMasterKey, encDeviceID, encDeviceMeta, encMode]);
                        }
                    }

                    const legacyPhoneContextTable = db.exec(`
                        SELECT name FROM sqlite_master
                        WHERE type='table' AND name='whatsapp_phone_contexts'
                    `);
                    if (legacyPhoneContextTable.length && legacyPhoneContextTable[0].values.length) {
                        const rows = db.exec(`SELECT phone, context FROM whatsapp_phone_contexts`);
                        if (rows && rows[0] && rows[0].values && rows[0].values.length) {
                            for (const [phone, context] of rows[0].values) {
                                if (!phone) continue;
                                const lookupPhone = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_phone_context', String(phone).replace(/@.*$/g, '').trim());
                                whatsappDb.run(`
                                    INSERT OR REPLACE INTO whatsapp_phone_contexts (phone, context)
                                    VALUES (?, ?)
                                `, [lookupPhone || phone, context || '']);
                            }
                        }
                    }

                    await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating whatsapp role database', error);
                }
            }

            // Version 20: Move conversation images into the dedicated images role DB.
            if (currentVersion < 20) {
                try {
                    const attachmentDb = await this.getDatabase(hashedMasterKey, 'images', true);
                    await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

                    const migrationResult = await this.migrateConversationImagesToAttachments(db, attachmentDb, hashedMasterKey);
                    const movedAttachmentRows = await this.migrateConversationAttachmentsToRoleDb(db, attachmentDb, hashedMasterKey);

                    await this.saveToStorage(attachmentDb.export(), hashedMasterKey, 'images');

                    if (migrationResult.updatedMessages > 0 || movedAttachmentRows.movedAttachments > 0) {
                        db.exec('VACUUM');
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating conversation image attachments', error);
                }
            }

            // Version 21: Move shared legacy html payloads into dedicated presentations/artifacts databases.
            if (currentVersion < 21) {
                try {
                    const migrationResult = await this.migrateLegacyHtmlRoleDbToDedicatedRoles(hashedMasterKey);
                    if (migrationResult.migratedPresentationRows > 0 || migrationResult.migratedArtifactRows > 0) {
                        /* console.info(
                            `DATABASE MIGRATION: Migrated ${migrationResult.migratedPresentationRows} presentation payload rows ` +
                            `and ${migrationResult.migratedArtifactRows} artifact payload rows from legacy html DB.`
                        ); */
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating legacy html role DB', error);
                }
            }

            // Version 22: Add stable per-message identifiers to conversation rows.
            if (currentVersion < 22) {
                try {
                    const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='conversations_${hashedMasterKey}'`);
                    if (tableCheck.length > 0 && tableCheck[0].values.length > 0) {
                        await this.ensureConversationMessageIdColumn(db, hashedMasterKey);
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding conversation message_id column', error);
                }
            }

            // Version 23: Ensure dedicated WhatsApp role DB tables exist for device/session persistence.
            if (currentVersion < 23) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_settings (
                            masterkey_hash TEXT PRIMARY KEY,
                            whatsapp_device_id TEXT,
                            whatsapp_device_meta TEXT,
                            whatsapp_mode TEXT DEFAULT ''
                        )
                    `);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                            phone TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                            device_id TEXT PRIMARY KEY,
                            session_blob TEXT,
                            metadata_blob TEXT,
                            updated_at TEXT
                        )
                    `);

                    await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error ensuring whatsapp role DB tables', error);
                }
            }

            // Version 28: Create dedicated WeChat role DB tables matching wcfLink requirements.
            if (currentVersion < 28) {
                try {
                    const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);

                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS login_sessions (
                            session_id TEXT PRIMARY KEY,
                            base_url TEXT NOT NULL,
                            qr_code TEXT NOT NULL,
                            qr_code_url TEXT NOT NULL,
                            status TEXT NOT NULL,
                            account_id TEXT NOT NULL DEFAULT '',
                            ilink_user_id TEXT NOT NULL DEFAULT '',
                            bot_token TEXT NOT NULL DEFAULT '',
                            error TEXT NOT NULL DEFAULT '',
                            started_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL,
                            completed_at TEXT
                        )
                    `);

                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS accounts (
                            account_id TEXT PRIMARY KEY,
                            base_url TEXT NOT NULL,
                            token TEXT NOT NULL,
                            ilink_user_id TEXT NOT NULL DEFAULT '',
                            enabled INTEGER NOT NULL DEFAULT 1,
                            login_status TEXT NOT NULL DEFAULT 'pending',
                            last_error TEXT NOT NULL DEFAULT '',
                            get_updates_buf TEXT NOT NULL DEFAULT '',
                            last_poll_at TEXT,
                            last_inbound_at TEXT,
                            created_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL
                        )
                    `);

                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS peer_contexts (
                            account_id TEXT NOT NULL,
                            peer_user_id TEXT NOT NULL,
                            context_token TEXT NOT NULL,
                            updated_at TEXT NOT NULL,
                            PRIMARY KEY (account_id, peer_user_id)
                        )
                    `);

                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS events (
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
                            created_at TEXT NOT NULL
                        )
                    `);

                    wechatDb.run(`
                        CREATE UNIQUE INDEX IF NOT EXISTS idx_events_account_message_inbound
                        ON events(account_id, direction, message_id)
                        WHERE direction = 'inbound' AND message_id != 0;
                    `);

                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS logs (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            level TEXT NOT NULL,
                            message TEXT NOT NULL,
                            source TEXT NOT NULL,
                            meta_json TEXT NOT NULL DEFAULT '',
                            created_at TEXT NOT NULL
                        )
                    `);

                    await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error ensuring WeChat role DB tables', error);
                }
            }

            // Version 26: Encrypt legacy plaintext WhatsApp settings inside the whatsapp role DB.
            if (currentVersion < 26) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_settings (
                            masterkey_hash TEXT PRIMARY KEY,
                            whatsapp_device_id TEXT,
                            whatsapp_device_meta TEXT,
                            whatsapp_mode TEXT DEFAULT '',
                            whatsapp_model_locked TEXT DEFAULT 'false'
                        )
                    `);

                    const columnCheck = whatsappDb.exec(`PRAGMA table_info(whatsapp_settings)`);
                    const settingsColumns = columnCheck[0]?.values || [];
                    const hasWhatsappMode = settingsColumns.some(col => col[1] === 'whatsapp_mode');
                    const hasWhatsappModelLocked = settingsColumns.some(col => col[1] === 'whatsapp_model_locked');
                    let schemaChanged = false;

                    if (!hasWhatsappMode) {
                        whatsappDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_mode TEXT DEFAULT ''`);
                        schemaChanged = true;
                    }

                    if (!hasWhatsappModelLocked) {
                        whatsappDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_model_locked TEXT DEFAULT 'false'`);
                        schemaChanged = true;
                    }

                    if (schemaChanged) {
                        await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                    }

                    const row = whatsappDb.exec(`
                        SELECT whatsapp_mode, whatsapp_model_locked
                        FROM whatsapp_settings
                        WHERE masterkey_hash = ?
                        LIMIT 1
                    `, [hashedMasterKey]);

                    if (row && row[0] && row[0].values && row[0].values.length) {
                        const currentMode = String(row[0].values[0][0] || '').trim();
                        const currentLocked = String(row[0].values[0][1] || '').trim();

                        let nextMode = currentMode;
                        let nextLocked = currentLocked;
                        let shouldSave = false;

                        if (currentMode === 'personal' || currentMode === 'bot') {
                            nextMode = JSON.stringify(await this.encrypt(hashedMasterKey, currentMode));
                            shouldSave = true;
                        }

                        if (currentLocked === 'true' || currentLocked === 'false') {
                            nextLocked = JSON.stringify(await this.encrypt(hashedMasterKey, currentLocked));
                            shouldSave = true;
                        }

                        if (shouldSave) {
                            whatsappDb.run(`
                                UPDATE whatsapp_settings
                                SET whatsapp_mode = ?, whatsapp_model_locked = ?
                                WHERE masterkey_hash = ?
                            `, [nextMode, nextLocked, hashedMasterKey]);
                            await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                        }
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error encrypting legacy WhatsApp settings in role DB', error);
                }
            }

            // Version 27: Replace plaintext WhatsApp role DB lookup keys with master-key-scoped hashes.
            if (currentVersion < 27) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                            phone TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                            device_id TEXT PRIMARY KEY,
                            session_blob TEXT,
                            metadata_blob TEXT,
                            updated_at TEXT
                        )
                    `);

                    const lookupMigrated = await this.migrateWhatsappLookupKeys(hashedMasterKey, whatsappDb);
                    if (lookupMigrated) {
                        await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error hashing WhatsApp role DB lookup keys', error);
                }
            }

            // Version 29: Mirror gowa devices table into WhatsApp role DB and remove legacy device-id settings columns.
            if (currentVersion < 29) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS devices (
                            device_id TEXT PRIMARY KEY,
                            display_name TEXT DEFAULT '',
                            jid TEXT DEFAULT '',
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    whatsappDb.run(`CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at)`);

                    const decodeEncryptedField = async (rawValue) => {
                        const normalized = String(rawValue || '').trim();
                        if (!normalized) {
                            return '';
                        }

                        let payload = normalized;
                        try {
                            const parsed = JSON.parse(normalized);
                            if (parsed && typeof parsed === 'object') {
                                payload = parsed;
                            }
                        } catch (_e) {
                            // Keep legacy plaintext payloads as-is.
                        }

                        try {
                            return String(await this.decrypt(hashedMasterKey, payload) || '');
                        } catch (_e) {
                            return normalized;
                        }
                    };

                    const settingsTableExists = whatsappDb.exec(`
                        SELECT name FROM sqlite_master
                        WHERE type='table' AND name='whatsapp_settings'
                    `);

                    let rowMasterKeyHash = String(hashedMasterKey || '');
                    let rowDeviceMeta = '';
                    let rowMode = '';
                    let rowModelLocked = '';

                    if (settingsTableExists && settingsTableExists[0] && settingsTableExists[0].values && settingsTableExists[0].values.length) {
                        const settingsColumns = whatsappDb.exec(`PRAGMA table_info(whatsapp_settings)`)[0]?.values || [];
                        const hasMasterKeyHash = settingsColumns.some(col => col[1] === 'masterkey_hash');
                        const hasDeviceMeta = settingsColumns.some(col => col[1] === 'whatsapp_device_meta');
                        const hasMode = settingsColumns.some(col => col[1] === 'whatsapp_mode');
                        const hasModelLocked = settingsColumns.some(col => col[1] === 'whatsapp_model_locked');
                        const hasCurrentDeviceID = settingsColumns.some(col => col[1] === 'whatsapp_device_id');

                        const selectColumns = [];
                        if (hasMasterKeyHash) selectColumns.push('masterkey_hash');
                        if (hasDeviceMeta) selectColumns.push('whatsapp_device_meta');
                        if (hasMode) selectColumns.push('whatsapp_mode');
                        if (hasModelLocked) selectColumns.push('whatsapp_model_locked');
                        if (hasCurrentDeviceID) selectColumns.push('whatsapp_device_id');

                        if (selectColumns.length > 0) {
                            const settingsRow = whatsappDb.exec(`
                                SELECT ${selectColumns.join(', ')}
                                FROM whatsapp_settings
                                LIMIT 1
                            `);

                            if (settingsRow && settingsRow[0] && settingsRow[0].values && settingsRow[0].values.length) {
                                const rawValues = settingsRow[0].values[0];
                                const valueMap = {};
                                for (let index = 0; index < selectColumns.length; index++) {
                                    valueMap[selectColumns[index]] = rawValues[index];
                                }

                                rowMasterKeyHash = String(valueMap.masterkey_hash || hashedMasterKey || '').trim();
                                rowMode = String(valueMap.whatsapp_mode || '');
                                rowModelLocked = String(valueMap.whatsapp_model_locked || '');
                                rowDeviceMeta = String(valueMap.whatsapp_device_meta || '');

                                if (!rowDeviceMeta) {
                                    const currentDeviceId = await decodeEncryptedField(valueMap.whatsapp_device_id || '');
                                    const selectedDeviceId = String(currentDeviceId || '').trim();
                                    if (selectedDeviceId) {
                                        rowDeviceMeta = JSON.stringify(await this.encrypt(hashedMasterKey, JSON.stringify({
                                            selectedDeviceId,
                                            deviceId: selectedDeviceId
                                        })));
                                    }
                                }
                            }
                        }
                    }

                    whatsappDb.run(`DROP TABLE IF EXISTS whatsapp_settings_v29`);
                    whatsappDb.run(`
                        CREATE TABLE whatsapp_settings_v29 (
                            masterkey_hash TEXT PRIMARY KEY,
                            whatsapp_device_meta TEXT,
                            whatsapp_mode TEXT DEFAULT '',
                            whatsapp_model_locked TEXT DEFAULT 'false'
                        )
                    `);

                    whatsappDb.run(`
                        INSERT OR REPLACE INTO whatsapp_settings_v29
                        (masterkey_hash, whatsapp_device_meta, whatsapp_mode, whatsapp_model_locked)
                        VALUES (?, ?, ?, ?)
                    `, [rowMasterKeyHash || String(hashedMasterKey || ''), rowDeviceMeta || '', rowMode || '', rowModelLocked || '']);

                    whatsappDb.run(`DROP TABLE IF EXISTS whatsapp_settings`);
                    whatsappDb.run(`ALTER TABLE whatsapp_settings_v29 RENAME TO whatsapp_settings`);
                    whatsappDb.run(`DROP TABLE IF EXISTS whatsapp_device_registry`);

                    await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating WhatsApp devices/settings to v29 schema', error);
                }
            }

            // Version 30: Remove persisted runtime workflow sessions from WhatsApp/WeChat context blobs.
            if (currentVersion < 30) {
                try {
                    const whatsappDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);
                    whatsappDb.run(`
                        CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                            phone TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    const whatsappRows = whatsappDb.exec(`SELECT phone, context FROM whatsapp_phone_contexts`);
                    let whatsappChanged = false;
                    if (whatsappRows && whatsappRows[0] && Array.isArray(whatsappRows[0].values)) {
                        for (const [phone, context] of whatsappRows[0].values) {
                            if (!phone || !context) {
                                continue;
                            }
                            const cleaned = await this.scrubConnectorWorkflowSessionsFromEncryptedContextBlob(hashedMasterKey, context);
                            if (!cleaned.changed) {
                                continue;
                            }
                            whatsappDb.run(`UPDATE whatsapp_phone_contexts SET context = ? WHERE phone = ?`, [cleaned.encryptedJson, phone]);
                            whatsappChanged = true;
                        }
                    }
                    if (whatsappChanged) {
                        await this.saveWhatsappRoleSqlDatabase(whatsappDb, hashedMasterKey);
                    }

                    const wechatDb = await this.getWechatRoleSqlDatabase(hashedMasterKey, true);
                    wechatDb.run(`
                        CREATE TABLE IF NOT EXISTS wechat_account_contexts (
                            account TEXT PRIMARY KEY,
                            context TEXT
                        )
                    `);

                    const wechatRows = wechatDb.exec(`SELECT account, context FROM wechat_account_contexts`);
                    let wechatChanged = false;
                    if (wechatRows && wechatRows[0] && Array.isArray(wechatRows[0].values)) {
                        for (const [account, context] of wechatRows[0].values) {
                            if (!account || !context) {
                                continue;
                            }
                            const cleaned = await this.scrubConnectorWorkflowSessionsFromEncryptedContextBlob(hashedMasterKey, context);
                            if (!cleaned.changed) {
                                continue;
                            }
                            wechatDb.run(`UPDATE wechat_account_contexts SET context = ? WHERE account = ?`, [cleaned.encryptedJson, account]);
                            wechatChanged = true;
                        }
                    }
                    if (wechatChanged) {
                        await this.saveWechatRoleSqlDatabase(wechatDb, hashedMasterKey);
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error removing persisted connector workflow sessions', error);
                }
            }

            // Version 31: Move Campaign Studio payloads into the dedicated campaings role DB.
            if (currentVersion < 31) {
                try {
                    const migrationResult = await this.migrateLegacyCampaignsToDedicatedRoleDb(db, hashedMasterKey);
                    if (migrationResult.migratedRows > 0) {
                        db.exec('VACUUM');
                    }
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error migrating campaigns role database', error);
                }
            }

            // Version 32: Add persisted Campaign conversation history/context columns to the dedicated campaings role DB.
            if (currentVersion < 32) {
                try {
                    const campaignsDb = await this.getCampaignsDatabase(hashedMasterKey);
                    this.ensureCampaignsTable(campaignsDb, hashedMasterKey);
                    await this.saveToStorage(campaignsDb.export(), hashedMasterKey, 'campaings');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding Campaign conversation persistence columns', error);
                }
            }

            // Version 33: Persist Campaign poster editor overlay/background state in the dedicated campaings role DB.
            if (currentVersion < 33) {
                try {
                    const campaignsDb = await this.getCampaignsDatabase(hashedMasterKey);
                    this.ensureCampaignsTable(campaignsDb, hashedMasterKey);
                    this.ensureCampaignPosterEditorColumns(campaignsDb, hashedMasterKey);
                    await this.saveToStorage(campaignsDb.export(), hashedMasterKey, 'campaings');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error adding Campaign poster editor persistence columns', error);
                }
            }

            // Version 34: Create IVF index tables in the RAG database for fast vector search.
            if (currentVersion < 34) {
                try {
                    const ragDb = await this.getDatabase(hashedMasterKey, 'rag', true);
                    ragDb.exec(`
                        CREATE TABLE IF NOT EXISTS embedding_clusters_${hashedMasterKey} (
                            cluster_id INTEGER PRIMARY KEY,
                            centroid TEXT NOT NULL
                        )
                    `);
                    ragDb.exec(`
                        CREATE TABLE IF NOT EXISTS chunk_cluster_map_${hashedMasterKey} (
                            chunk_id TEXT PRIMARY KEY,
                            cluster_id INTEGER NOT NULL
                        )
                    `);
                    await this.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');
                } catch (error) {
                    console.error('DATABASE MIGRATION: Error creating IVF cluster tables in RAG DB', error);
                }
            }

            // Update database version to 34 (IVF cluster index tables in RAG DB)
            if (currentVersion === 0) {
                db.run(`INSERT INTO db_version (version) VALUES (${latestVersion})`);
            } else {
                db.run(`UPDATE db_version SET version = ${latestVersion}`);
            }

            // Save the migrated database using our enhanced saveToStorage method
            // which will automatically use OPFS if supported
            await this.saveToStorage(db.export(), hashedMasterKey);

           //console.log('Database migration completed');
            return true;
        } catch (error) {
            console.error('Error during database migration:', error);
            return false;
        }
    }

    static async ensureConversationMessageIdColumn(db, hashedMasterKey) {
        if (!db || !hashedMasterKey) return false;

        let changed = false;

        const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='conversations_${hashedMasterKey}'`);
        if (!tableCheck.length || !tableCheck[0].values.length) {
            return false;
        }

        const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
        const hasMessageIdColumn = columnsResult[0]?.values.some(col => col[1] === 'message_id');

        if (!hasMessageIdColumn) {
            db.exec(`ALTER TABLE conversations_${hashedMasterKey} ADD COLUMN message_id TEXT`);
            changed = true;
        }

        const missingIdsResult = db.exec(`
            SELECT rowid
            FROM conversations_${hashedMasterKey}
            WHERE message_id IS NULL OR TRIM(COALESCE(message_id, '')) = ''
        `);

        if (missingIdsResult[0]?.values?.length) {
            for (const [rowid] of missingIdsResult[0].values) {
                db.run(
                    `UPDATE conversations_${hashedMasterKey} SET message_id = ? WHERE rowid = ?`,
                    [crypto.randomUUID(), rowid]
                );
            }
            changed = true;
        }

        return changed;
    }

    static async migrateLegacyKnowledgeCollectionsToDedicatedDb(mainDb, hashedMasterKey) {
        try {
            if (!mainDb || !hashedMasterKey) {
                return { migratedCollections: 0, migratedEntries: 0 };
            }

            const collectionsTable = `knowledge_collections_${hashedMasterKey}`;
            const tableCheck = mainDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${collectionsTable}'`);
            if (!tableCheck.length || !tableCheck[0].values.length) {
                return { migratedCollections: 0, migratedEntries: 0 };
            }

            const rows = mainDb.exec(`SELECT collection_id, collection_data, updated_at FROM ${collectionsTable}`);
            if (!rows.length || !rows[0].values.length) {
                return { migratedCollections: 0, migratedEntries: 0 };
            }

            const kbDb = await this.getDatabase(hashedMasterKey, 'kb', true);
            if (!kbDb) {
                return { migratedCollections: 0, migratedEntries: 0 };
            }

            const entriesTable = `knowledge_entries_${hashedMasterKey}`;
            kbDb.exec(`
                CREATE TABLE IF NOT EXISTS ${entriesTable} (
                    collection_id TEXT PRIMARY KEY,
                    entries_data TEXT,
                    updated_at TEXT
                )
            `);

            let migratedCollections = 0;
            let migratedEntries = 0;
            let kbUpdated = false;

            for (const [collectionId, encryptedData, updatedAt] of rows[0].values) {
                try {
                    const decryptedData = await this.decrypt(hashedMasterKey, JSON.parse(encryptedData));
                    const collection = JSON.parse(decryptedData || '{}');
                    const legacyEntries = Array.isArray(collection?.entries) ? collection.entries : [];

                    if (!legacyEntries.length) {
                        continue;
                    }

                    const encryptedEntries = await this.encrypt(hashedMasterKey, JSON.stringify(legacyEntries));
                    kbDb.exec(
                        `INSERT OR REPLACE INTO ${entriesTable} (collection_id, entries_data, updated_at) VALUES (?, ?, ?)`,
                        [collectionId, JSON.stringify(encryptedEntries), updatedAt || new Date().toISOString()]
                    );
                    kbUpdated = true;

                    collection.entries = [];
                    collection.entryCount = legacyEntries.length;
                    collection.updated = collection.updated || updatedAt || new Date().toISOString();

                    const encryptedMetadataOnly = await this.encrypt(hashedMasterKey, JSON.stringify(collection));
                    mainDb.exec(
                        `UPDATE ${collectionsTable} SET collection_data = ?, updated_at = ? WHERE collection_id = ?`,
                        [JSON.stringify(encryptedMetadataOnly), updatedAt || new Date().toISOString(), collectionId]
                    );

                    migratedCollections += 1;
                    migratedEntries += legacyEntries.length;
                } catch (error) {
                    console.warn('Skipping legacy KB migration row due to parse/decrypt issue:', error);
                }
            }

            if (kbUpdated) {
                await this.saveToStorage(kbDb.export(), hashedMasterKey, 'kb');
            }

            return { migratedCollections, migratedEntries };
        } catch (error) {
            console.error('migrateLegacyKnowledgeCollectionsToDedicatedDb error:', error);
            return { migratedCollections: 0, migratedEntries: 0 };
        }
    }

    // Insert or update a custom style in the per-masterkey custom_styles table
    static async insertCustomStyle(hashedMasterKey, styleInfo) {
        try {
           //console.log('PaiperworkDB.insertCustomStyle called with masterkey:', hashedMasterKey, 'styleInfo:', { name: styleInfo?.name, model: styleInfo?.model });
            // Ensure database initialized
            await this.initializeDatabase(hashedMasterKey);

            // Ensure SQL.js loaded
            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            // Load existing DB data
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            const db = existingDb ? new this.SQL.Database(existingDb) : new this.SQL.Database();

            // Ensure table exists (defensive)
            db.run(`
                CREATE TABLE IF NOT EXISTS custom_styles_${hashedMasterKey} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    model TEXT,
                    prompt TEXT,
                    code TEXT,
                    is_active INTEGER DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT
                )
            `);

            const now = new Date().toISOString();

            // Check for existing style by name+prompt+model
            const selectRes = db.exec(`SELECT id FROM custom_styles_${hashedMasterKey} WHERE name = ? AND prompt = ? AND model = ? LIMIT 1`, [styleInfo.name, styleInfo.prompt, styleInfo.model]);
            let existingId = null;
            if (selectRes && selectRes[0] && selectRes[0].values && selectRes[0].values.length) {
                existingId = selectRes[0].values[0][0];
            }

            if (existingId) {
                db.run(`UPDATE custom_styles_${hashedMasterKey} SET code = ?, updated_at = ?, is_active = ? WHERE id = ?`, [styleInfo.code || '', now, styleInfo.is_active ? 1 : 0, existingId]);
                await this.saveToStorage(db.export(), hashedMasterKey);
               //console.log('PaiperworkDB.insertCustomStyle: updated existing style id=', existingId, 'name=', styleInfo.name);
                return existingId;
            }

            // Insert new
            db.run(`INSERT INTO custom_styles_${hashedMasterKey} (name, model, prompt, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [styleInfo.name || '', styleInfo.model || '', styleInfo.prompt || '', styleInfo.code || '', styleInfo.is_active ? 1 : 0, now, now]);

            // Get last inserted id
            const last = db.exec(`SELECT last_insert_rowid() AS id`);
            let newId = null;
            if (last && last[0] && last[0].values && last[0].values[0]) {
                newId = last[0].values[0][0];
            }

            await this.saveToStorage(db.export(), hashedMasterKey);
           //console.log('PaiperworkDB.insertCustomStyle: inserted new style id=', newId, 'name=', styleInfo.name);
            return newId;
        } catch (error) {
            console.error('insertCustomStyle error:', error && error.stack ? error.stack : error);
            throw error;
        }
    }

    // Retrieve custom styles for a given masterkey
    static async getCustomStyles(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return [];

            const db = new this.SQL.Database(existingDb);

            // Check table exists
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='custom_styles_${hashedMasterKey}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) return [];

            const rows = db.exec(`SELECT id, name, model, prompt, code, is_active, created_at, updated_at FROM custom_styles_${hashedMasterKey} ORDER BY created_at DESC`);
            if (!rows || !rows[0]) return [];

            const result = rows[0].values.map(r => ({
                id: r[0],
                name: r[1],
                model: r[2],
                prompt: r[3],
                code: r[4],
                is_active: r[5],
                created_at: r[6],
                updated_at: r[7]
            }));

            /* console.log(`PaiperworkDB.getCustomStyles: loaded ${result.length} styles for masterkey ${hashedMasterKey}`,
                result.slice(0, 5).map(s => s.name)); */
            return result;
        } catch (error) {
            console.error('getCustomStyles error:', error);
            return [];
        }
    }

    // Delete a custom style by id for a given masterkey
    static async deleteCustomStyle(hashedMasterKey, id) {
        try {
            if (!hashedMasterKey) throw new Error('Missing master key');

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                throw new Error('Database not found');
            }

            const db = new this.SQL.Database(existingDb);

            // Defensive check for table
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='custom_styles_${hashedMasterKey}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                console.warn('PaiperworkDB.deleteCustomStyle: custom styles table not found');
                return false;
            }

            db.run(`DELETE FROM custom_styles_${hashedMasterKey} WHERE id = ?`, [id]);

            await this.saveToStorage(db.export(), hashedMasterKey);
           //console.log('PaiperworkDB.deleteCustomStyle: deleted style id=', id);
            return true;
        } catch (error) {
            console.error('deleteCustomStyle error:', error);
            throw error;
        }
    }

    static async savePromptablePresentationHtmlContent(hashedMasterKey, presentationId, html) {
        if (!hashedMasterKey || !presentationId) return false;

        let presentationsDb = null;

        try {
            await this.initializeDatabase(hashedMasterKey);
            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const htmlTableName = `promptable_presentations_html_${hashedMasterKey}`;
            const existingPresentationsDb = await this.getExistingDatabase(hashedMasterKey, 'presentations');
            presentationsDb = existingPresentationsDb ? new this.SQL.Database(existingPresentationsDb) : new this.SQL.Database();

            this.ensurePromptablePresentationHtmlTable(presentationsDb, hashedMasterKey);

            const encryptedHtml = await this.encrypt(hashedMasterKey, html || '');
            presentationsDb.run(
                `INSERT OR REPLACE INTO ${htmlTableName} (presentation_id, html_content, updated_at) VALUES (?, ?, ?)`,
                [presentationId, JSON.stringify(encryptedHtml), new Date().toISOString()]
            );

            await this.saveToStorage(presentationsDb.export(), hashedMasterKey, 'presentations');
            return true;
        } catch (error) {
            console.error('savePromptablePresentationHtmlContent error:', error);
            return false;
        } finally {
            try {
                presentationsDb?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    // Save a promptable presentation metadata in main DB and HTML content in html DB.
    static async savePromptablePresentation(hashedMasterKey, payload) {
        let db = null;
        try {
            if (!hashedMasterKey) throw new Error('Missing master key');

            const html = payload && typeof payload.html === 'string' ? payload.html : '';
            if (!html.trim()) {
                throw new Error('Missing presentation HTML');
            }

            const title = (payload && payload.title ? String(payload.title) : '').trim() || 'Untitled presentation';
            const mode = payload && payload.mode === 'pdf' ? 'pdf' : 'html';
            const now = new Date().toISOString();
            const tableName = `promptable_presentations_${hashedMasterKey}`;

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            db = existingDb ? new this.SQL.Database(existingDb) : new this.SQL.Database();

            // Keep metadata in main database only.
            db.run(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    mode TEXT DEFAULT 'html',
                    created_at TEXT,
                    updated_at TEXT
                )
            `);

            const columns = db.exec(`PRAGMA table_info(${tableName})`);
            const hasModeColumn = columns[0]?.values?.some(col => col[1] === 'mode');
            if (!hasModeColumn) {
                db.run(`ALTER TABLE ${tableName} ADD COLUMN mode TEXT DEFAULT 'html'`);
            }

            db.run(
                `INSERT INTO ${tableName} (title, mode, created_at, updated_at) VALUES (?, ?, ?, ?)`,
                [title, mode, now, now]
            );

            const idResult = db.exec(`SELECT last_insert_rowid() AS id`);
            const insertedId = idResult && idResult[0] && idResult[0].values && idResult[0].values[0]
                ? idResult[0].values[0][0]
                : null;

            if (!insertedId) {
                throw new Error('Could not create promptable presentation metadata record');
            }

            const htmlSaved = await this.savePromptablePresentationHtmlContent(hashedMasterKey, insertedId, html);
            if (!htmlSaved) {
                db.run(`DELETE FROM ${tableName} WHERE id = ?`, [insertedId]);
                await this.saveToStorage(db.export(), hashedMasterKey);
                throw new Error('Could not persist promptable presentation HTML content');
            }

            await this.saveToStorage(db.export(), hashedMasterKey);
            return insertedId;
        } catch (error) {
            console.error('savePromptablePresentation error:', error);
            throw error;
        } finally {
            try {
                db?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    // Load promptable presentation list metadata for a given masterkey
    static async getPromptablePresentations(hashedMasterKey) {
        let db = null;
        try {
            if (!hashedMasterKey) return [];

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return [];

            db = new this.SQL.Database(existingDb);
            const tableName = `promptable_presentations_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return [];
            }

            const columns = db.exec(`PRAGMA table_info(${tableName})`);
            const hasModeColumn = columns[0]?.values?.some(col => col[1] === 'mode');
            const rows = hasModeColumn
                ? db.exec(`SELECT id, title, mode, created_at, updated_at FROM ${tableName} ORDER BY updated_at DESC, id DESC`)
                : db.exec(`SELECT id, title, created_at, updated_at FROM ${tableName} ORDER BY updated_at DESC, id DESC`);
            if (!rows || !rows[0] || !rows[0].values) {
                return [];
            }

            const rawItems = rows[0].values.map(row => ({
                id: row[0],
                title: row[1] || '',
                mode: hasModeColumn ? (row[2] || 'html') : 'html',
                created_at: hasModeColumn ? (row[3] || '') : (row[2] || ''),
                updated_at: hasModeColumn ? (row[4] || '') : (row[3] || '')
            }));

            const pruneMetadataItems = async (items) => {
                if (!items || !items.length) {
                    return;
                }

                for (const item of items) {
                    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [item.id]);
                }
                await this.saveToStorage(db.export(), hashedMasterKey);
            };

            const htmlTableName = `promptable_presentations_html_${hashedMasterKey}`;
            const existingPresentationsDb = await this.getExistingDatabase(hashedMasterKey, 'presentations');
            if (!existingPresentationsDb) {
                await pruneMetadataItems(rawItems);
                return [];
            }

            const presentationsDb = new this.SQL.Database(existingPresentationsDb);
            try {
                const htmlTableCheck = presentationsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
                if (!htmlTableCheck || !htmlTableCheck[0] || !htmlTableCheck[0].values.length) {
                    await pruneMetadataItems(rawItems);
                    return [];
                }

                const htmlRows = presentationsDb.exec(`SELECT presentation_id FROM ${htmlTableName}`);
                const htmlIds = new Set((htmlRows && htmlRows[0] && htmlRows[0].values ? htmlRows[0].values : []).map(row => Number(row[0] || 0)).filter(Boolean));
                const orphanedItems = rawItems.filter(item => !htmlIds.has(Number(item.id || 0)));
                const metadataIds = new Set(rawItems.map(item => Number(item.id || 0)).filter(Boolean));
                const orphanedHtmlIds = Array.from(htmlIds).filter(idValue => !metadataIds.has(idValue));

                if (orphanedItems.length) {
                    for (const orphaned of orphanedItems) {
                        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [orphaned.id]);
                    }
                    await this.saveToStorage(db.export(), hashedMasterKey);
                }

                if (orphanedHtmlIds.length) {
                    for (const orphanedHtmlId of orphanedHtmlIds) {
                        presentationsDb.run(`DELETE FROM ${htmlTableName} WHERE presentation_id = ?`, [orphanedHtmlId]);
                    }
                    await this.saveToStorage(presentationsDb.export(), hashedMasterKey, 'presentations');
                }

                return rawItems.filter(item => htmlIds.has(Number(item.id || 0)));
            } finally {
                try {
                    presentationsDb.close();
                } catch (_error) {
                    // Ignore SQL.js close errors during cleanup.
                }
            }
        } catch (error) {
            console.error('getPromptablePresentations error:', error);
            return [];
        } finally {
            try {
                db?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    // Load and decrypt a promptable presentation HTML by id
    static async loadPromptablePresentationHtml(hashedMasterKey, id) {
        let presentationsDb = null;
        try {
            /* console.info('[PaiperworkDB][presentation] loadPromptablePresentationHtml start', {
                hasHashedMasterKey: !!hashedMasterKey,
                hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                id
            }); */
            if (!hashedMasterKey || !id) return '';

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const htmlTableName = `promptable_presentations_html_${hashedMasterKey}`;
            const existingPresentationsDb = await this.getExistingDatabase(hashedMasterKey, 'presentations');
            if (!existingPresentationsDb) {
                console.warn('[PaiperworkDB][presentation] No presentations database found', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    role: 'presentations'
                });
                return '';
            }

            presentationsDb = new this.SQL.Database(existingPresentationsDb);
            const htmlTableCheck = presentationsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
            if (!htmlTableCheck || !htmlTableCheck[0] || !htmlTableCheck[0].values.length) {
                console.warn('[PaiperworkDB][presentation] HTML table missing', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    htmlTableName
                });
                return '';
            }

            const htmlResult = presentationsDb.exec(
                `SELECT html_content FROM ${htmlTableName} WHERE presentation_id = ? LIMIT 1`,
                [id]
            );
            if (!htmlResult || !htmlResult[0] || !htmlResult[0].values || !htmlResult[0].values.length) {
                console.warn('[PaiperworkDB][presentation] No HTML row found for presentation', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    htmlTableName
                });
                return '';
            }

            const encryptedStr = htmlResult[0].values[0][0];
            if (!encryptedStr) {
                console.warn('[PaiperworkDB][presentation] HTML row was empty', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    htmlTableName
                });
                return '';
            }

            /* console.info('[PaiperworkDB][presentation] HTML row loaded', {
                hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                id,
                storedLength: String(encryptedStr).length,
                storedPreview: String(encryptedStr).slice(0, 120)
            }); */

            const looksLikeHtml = (value) => {
                const normalized = String(value || '').trim();
                if (!normalized) {
                    return false;
                }

                return /^<!doctype\s+html/i.test(normalized)
                    || /^<html\b/i.test(normalized)
                    || /^<body\b/i.test(normalized)
                    || /^<(section|main|article|div|h1|h2|style|script)\b/i.test(normalized);
            };

            if (looksLikeHtml(encryptedStr)) {
                /* console.info('[PaiperworkDB][presentation] Returning raw stored HTML', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    htmlLength: String(encryptedStr).trim().length
                }); */
                return String(encryptedStr).trim();
            }

            try {
                const parsedEncrypted = JSON.parse(encryptedStr);
                if (typeof parsedEncrypted === 'string' && looksLikeHtml(parsedEncrypted)) {
                    /* console.info('[PaiperworkDB][presentation] Returning HTML from parsed JSON string', {
                        hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                        id,
                        htmlLength: parsedEncrypted.trim().length
                    }); */
                    return parsedEncrypted.trim();
                }
                const decrypted = await this.decrypt(hashedMasterKey, parsedEncrypted);
                if (decrypted) {
                    /* console.info('[PaiperworkDB][presentation] Returning decrypted HTML', {
                        hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                        id,
                        htmlLength: String(decrypted).length
                    }); */
                    return decrypted;
                }
            } catch (_error) {
                console.warn('[PaiperworkDB][presentation] Failed to parse/decrypt stored HTML payload', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    error: _error && _error.message ? _error.message : String(_error)
                });
                // Fall through to legacy compatibility checks below.
            }

            try {
                const normalizedStored = String(encryptedStr || '').trim();
                const unquotedStored = normalizedStored.replace(/^"|"$/g, '');
                if (looksLikeHtml(unquotedStored)) {
                    /* console.info('[PaiperworkDB][presentation] Returning unquoted legacy HTML', {
                        hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                        id,
                        htmlLength: unquotedStored.length
                    }); */
                    return unquotedStored;
                }
            } catch (_error) {
                console.warn('[PaiperworkDB][presentation] Legacy HTML fallback failed', {
                    hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                    id,
                    error: _error && _error.message ? _error.message : String(_error)
                });
                return '';
            }

            console.warn('[PaiperworkDB][presentation] Stored presentation HTML could not be decoded', {
                hashedMasterKeyPrefix: String(hashedMasterKey || '').slice(0, 8),
                id
            });
            return '';
        } catch (error) {
            console.error('loadPromptablePresentationHtml error:', error);
            return '';
        } finally {
            try {
                presentationsDb?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    // Delete a saved promptable presentation by id
    static async deletePromptablePresentation(hashedMasterKey, id) {
        let db = null;
        let presentationsDb = null;
        try {
            if (!hashedMasterKey || !id) return false;

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return false;

            db = new this.SQL.Database(existingDb);
            const tableName = `promptable_presentations_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return false;
            }

            const htmlTableName = `promptable_presentations_html_${hashedMasterKey}`;
            const existingPresentationsDb = await this.getExistingDatabase(hashedMasterKey, 'presentations');
            let htmlBackup = null;
            let htmlTableExists = false;

            if (existingPresentationsDb) {
                presentationsDb = new this.SQL.Database(existingPresentationsDb);
                const htmlTableCheck = presentationsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
                htmlTableExists = !!(htmlTableCheck && htmlTableCheck[0] && htmlTableCheck[0].values.length);
                if (htmlTableExists) {
                    const htmlRow = presentationsDb.exec(`SELECT html_content, updated_at FROM ${htmlTableName} WHERE presentation_id = ? LIMIT 1`, [id]);
                    if (htmlRow && htmlRow[0] && htmlRow[0].values && htmlRow[0].values[0]) {
                        htmlBackup = {
                            html_content: htmlRow[0].values[0][0],
                            updated_at: htmlRow[0].values[0][1]
                        };
                    }
                }
            }

            db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            await this.saveToStorage(db.export(), hashedMasterKey);

            if (presentationsDb && htmlTableExists) {
                presentationsDb.run(`DELETE FROM ${htmlTableName} WHERE presentation_id = ?`, [id]);
                try {
                    await this.saveToStorage(presentationsDb.export(), hashedMasterKey, 'presentations');
                } catch (storageError) {
                    console.error('deletePromptablePresentation failed to save presentations DB after HTML deletion:', storageError);
                    if (htmlBackup) {
                        try {
                            presentationsDb.run(
                                `INSERT OR REPLACE INTO ${htmlTableName} (presentation_id, html_content, updated_at) VALUES (?, ?, ?)`,
                                [id, htmlBackup.html_content, htmlBackup.updated_at]
                            );
                            await this.saveToStorage(presentationsDb.export(), hashedMasterKey, 'presentations');
                        } catch (restoreError) {
                            console.error('deletePromptablePresentation failed to restore HTML row after failed delete save:', restoreError);
                        }
                    }
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('deletePromptablePresentation error:', error);
            return false;
        } finally {
            try {
                db?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
            try {
                presentationsDb?.close?.();
            } catch (_error) {
                // Ignore SQL.js close errors during cleanup.
            }
        }
    }

    static async saveArtifactHtmlContent(hashedMasterKey, artifactId, html) {
        if (!hashedMasterKey || !artifactId) return false;

        try {
            await this.initializeDatabase(hashedMasterKey);
            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const htmlTableName = `artifacts_html_${hashedMasterKey}`;
            const artifactsDb = await this.getDatabase(hashedMasterKey, 'artifacts', true);

            this.ensureArtifactHtmlTable(artifactsDb, hashedMasterKey);

            const encryptedHtml = await this.encrypt(hashedMasterKey, html || '');
            artifactsDb.run(
                `INSERT OR REPLACE INTO ${htmlTableName} (artifact_id, html_content, updated_at) VALUES (?, ?, ?)`,
                [artifactId, JSON.stringify(encryptedHtml), new Date().toISOString()]
            );

            await this.saveToStorage(artifactsDb.export(), hashedMasterKey, 'artifacts');
            return true;
        } catch (error) {
            console.error('saveArtifactHtmlContent error:', error);
            return false;
        }
    }

    // Save artifact metadata in main DB and HTML content in html DB.
    static async saveArtifact(hashedMasterKey, payload) {
        try {
            if (!hashedMasterKey) throw new Error('Missing master key');

            const html = payload && typeof payload.html === 'string' ? payload.html : '';
            if (!html.trim()) {
                throw new Error('Missing artifact HTML');
            }

            const title = (payload && payload.title ? String(payload.title) : '').trim() || 'Untitled artifact';
            const promptText = payload && typeof payload.prompt === 'string' ? payload.prompt : '';
            const now = new Date().toISOString();
            const tableName = `artifacts_${hashedMasterKey}`;

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const db = await this.getDatabase(hashedMasterKey, 'main', true);

            db.run(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    prompt_text TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            `);

            const tableInfo = db.exec(`PRAGMA table_info(${tableName})`);
            const hasPromptColumn = !!(tableInfo && tableInfo[0] && tableInfo[0].values && tableInfo[0].values.some((row) => row[1] === 'prompt_text'));
            if (!hasPromptColumn) {
                db.run(`ALTER TABLE ${tableName} ADD COLUMN prompt_text TEXT`);
            }

            db.run(
                `INSERT INTO ${tableName} (title, prompt_text, created_at, updated_at) VALUES (?, ?, ?, ?)`,
                [title, promptText, now, now]
            );

            const idResult = db.exec(`SELECT last_insert_rowid() AS id`);
            const insertedId = idResult && idResult[0] && idResult[0].values && idResult[0].values[0]
                ? idResult[0].values[0][0]
                : null;

            await this.saveToStorage(db.export(), hashedMasterKey);

            if (!insertedId) {
                throw new Error('Could not create artifact metadata record');
            }

            const htmlSaved = await this.saveArtifactHtmlContent(hashedMasterKey, insertedId, html);
            if (!htmlSaved) {
                db.run(`DELETE FROM ${tableName} WHERE id = ?`, [insertedId]);
                await this.saveToStorage(db.export(), hashedMasterKey);
                throw new Error('Could not persist artifact HTML content');
            }

            return insertedId;
        } catch (error) {
            console.error('saveArtifact error:', error);
            throw error;
        }
    }

    static async updateArtifact(hashedMasterKey, artifactId, payload) {
        try {
            if (!hashedMasterKey) throw new Error('Missing master key');
            if (!artifactId) throw new Error('Missing artifact id');

            const html = payload && typeof payload.html === 'string' ? payload.html : '';
            if (!html.trim()) {
                throw new Error('Missing artifact HTML');
            }

            const title = (payload && payload.title ? String(payload.title) : '').trim() || 'Untitled artifact';
            const promptText = payload && typeof payload.prompt === 'string' ? payload.prompt : '';
            const now = new Date().toISOString();
            const tableName = `artifacts_${hashedMasterKey}`;

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const db = await this.getDatabase(hashedMasterKey, 'main', true);

            db.run(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    prompt_text TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            `);

            const tableInfo = db.exec(`PRAGMA table_info(${tableName})`);
            const hasPromptColumn = !!(tableInfo && tableInfo[0] && tableInfo[0].values && tableInfo[0].values.some((row) => row[1] === 'prompt_text'));
            if (!hasPromptColumn) {
                db.run(`ALTER TABLE ${tableName} ADD COLUMN prompt_text TEXT`);
            }

            db.run(
                `UPDATE ${tableName} SET title = ?, prompt_text = ?, updated_at = ? WHERE id = ?`,
                [title, promptText, now, artifactId]
            );

            await this.saveToStorage(db.export(), hashedMasterKey);
            await this.saveArtifactHtmlContent(hashedMasterKey, artifactId, html);
            return true;
        } catch (error) {
            console.error('updateArtifact error:', error);
            throw error;
        }
    }

    // Load artifact list metadata for a given masterkey
    static async getArtifacts(hashedMasterKey) {
        try {
            if (!hashedMasterKey) return [];

            await this.initializeDatabase(hashedMasterKey);
            const db = await this.getDatabase(hashedMasterKey, 'main', false);
            if (!db) return [];
            const tableName = `artifacts_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return [];
            }

            const tableInfo = db.exec(`PRAGMA table_info(${tableName})`);
            const hasPromptColumn = !!(tableInfo && tableInfo[0] && tableInfo[0].values && tableInfo[0].values.some((row) => row[1] === 'prompt_text'));
            const selectPrompt = hasPromptColumn ? 'prompt_text' : "'' AS prompt_text";

            const rows = db.exec(`SELECT id, title, ${selectPrompt}, created_at, updated_at FROM ${tableName} ORDER BY updated_at DESC, id DESC`);
            if (!rows || !rows[0] || !rows[0].values) {
                return [];
            }

            const rawItems = rows[0].values.map(row => ({
                id: row[0],
                title: row[1] || '',
                prompt_text: row[2] || '',
                created_at: row[3] || '',
                updated_at: row[4] || ''
            }));

            const htmlTableName = `artifacts_html_${hashedMasterKey}`;
            const artifactsDb = await this.getDatabase(hashedMasterKey, 'artifacts', false);
            if (!artifactsDb) {
                for (const item of rawItems) {
                    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [item.id]);
                }
                await this.saveToStorage(db.export(), hashedMasterKey);
                return [];
            }

            const htmlTableCheck = artifactsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
            if (!htmlTableCheck || !htmlTableCheck[0] || !htmlTableCheck[0].values.length) {
                for (const item of rawItems) {
                    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [item.id]);
                }
                await this.saveToStorage(db.export(), hashedMasterKey);
                return [];
            }

            const htmlRows = artifactsDb.exec(`SELECT artifact_id FROM ${htmlTableName}`);
            const htmlIds = new Set((htmlRows && htmlRows[0] && htmlRows[0].values ? htmlRows[0].values : []).map(row => Number(row[0] || 0)).filter(Boolean));
            const orphanedItems = rawItems.filter(item => !htmlIds.has(Number(item.id || 0)));
            if (orphanedItems.length) {
                for (const orphaned of orphanedItems) {
                    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [orphaned.id]);
                }
                await this.saveToStorage(db.export(), hashedMasterKey);
            }

            return rawItems.filter(item => htmlIds.has(Number(item.id || 0)));
        } catch (error) {
            console.error('getArtifacts error:', error);
            return [];
        }
    }

    // Load and decrypt artifact HTML by id
    static async loadArtifactHtml(hashedMasterKey, id) {
        try {
            if (!hashedMasterKey || !id) return '';

            await this.initializeDatabase(hashedMasterKey);

            const htmlTableName = `artifacts_html_${hashedMasterKey}`;
            const artifactsDb = await this.getDatabase(hashedMasterKey, 'artifacts', false);
            if (!artifactsDb) return '';
            const htmlTableCheck = artifactsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
            if (!htmlTableCheck || !htmlTableCheck[0] || !htmlTableCheck[0].values.length) {
                return '';
            }

            const htmlResult = artifactsDb.exec(
                `SELECT html_content FROM ${htmlTableName} WHERE artifact_id = ? LIMIT 1`,
                [id]
            );
            if (!htmlResult || !htmlResult[0] || !htmlResult[0].values || !htmlResult[0].values.length) {
                return '';
            }

            const encryptedStr = htmlResult[0].values[0][0];
            if (!encryptedStr) return '';

            try {
                const parsedEncrypted = JSON.parse(encryptedStr);
                const decrypted = await this.decrypt(hashedMasterKey, parsedEncrypted);
                return decrypted || '';
            } catch (_error) {
                return '';
            }
        } catch (error) {
            console.error('loadArtifactHtml error:', error);
            return '';
        }
    }

    // Delete a saved artifact by id
    static async deleteArtifact(hashedMasterKey, id) {
        try {
            if (!hashedMasterKey || !id) return false;

            await this.initializeDatabase(hashedMasterKey);
            const db = await this.getDatabase(hashedMasterKey, 'main', false);
            if (!db) return false;
            const tableName = `artifacts_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return false;
            }

            const metadataRow = db.exec(`SELECT title, prompt_text, created_at, updated_at FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
            const metadataBackup = (metadataRow && metadataRow[0] && metadataRow[0].values && metadataRow[0].values[0])
                ? {
                    title: metadataRow[0].values[0][0],
                    prompt_text: metadataRow[0].values[0][1],
                    created_at: metadataRow[0].values[0][2],
                    updated_at: metadataRow[0].values[0][3],
                }
                : null;

            const htmlTableName = `artifacts_html_${hashedMasterKey}`;
            const artifactsDb = await this.getDatabase(hashedMasterKey, 'artifacts', false);
            let htmlBackup = null;
            let htmlTableExists = false;

            if (artifactsDb) {
                const htmlTableCheck = artifactsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${htmlTableName}'`);
                htmlTableExists = !!(htmlTableCheck && htmlTableCheck[0] && htmlTableCheck[0].values.length);
                if (htmlTableExists) {
                    const htmlRow = artifactsDb.exec(`SELECT html_content, updated_at FROM ${htmlTableName} WHERE artifact_id = ? LIMIT 1`, [id]);
                    if (htmlRow && htmlRow[0] && htmlRow[0].values && htmlRow[0].values[0]) {
                        htmlBackup = {
                            html_content: htmlRow[0].values[0][0],
                            updated_at: htmlRow[0].values[0][1],
                        };
                    }
                }
            }

            db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            await this.saveToStorage(db.export(), hashedMasterKey);

            if (artifactsDb && htmlTableExists) {
                artifactsDb.run(`DELETE FROM ${htmlTableName} WHERE artifact_id = ?`, [id]);
                try {
                    await this.saveToStorage(artifactsDb.export(), hashedMasterKey, 'artifacts');
                } catch (storageError) {
                    console.error('deleteArtifact failed to save artifacts DB after HTML deletion:', storageError);
                    if (htmlBackup) {
                        try {
                            artifactsDb.run(
                                `INSERT OR REPLACE INTO ${htmlTableName} (artifact_id, html_content, updated_at) VALUES (?, ?, ?)`,
                                [id, htmlBackup.html_content, htmlBackup.updated_at]
                            );
                            await this.saveToStorage(artifactsDb.export(), hashedMasterKey, 'artifacts');
                        } catch (restoreError) {
                            console.error('deleteArtifact failed to restore HTML row after failed delete save:', restoreError);
                        }
                    }

                    if (metadataBackup) {
                        try {
                            db.run(
                                `INSERT OR REPLACE INTO ${tableName} (id, title, prompt_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
                                [id, metadataBackup.title, metadataBackup.prompt_text, metadataBackup.created_at, metadataBackup.updated_at]
                            );
                            await this.saveToStorage(db.export(), hashedMasterKey);
                        } catch (restoreMetadataError) {
                            console.error('deleteArtifact failed to restore metadata after failed delete save:', restoreMetadataError);
                        }
                    }

                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('deleteArtifact error:', error);
            return false;
        }
    }

    static async saveCampaign(hashedMasterKey, payload) {
        try {
            if (!hashedMasterKey) throw new Error('Missing master key');

            const name = String(payload?.name || '').trim();
            if (!name) {
                throw new Error('Missing campaign name');
            }

            const tableName = `campaigns_${hashedMasterKey}`;
            const now = new Date().toISOString();
            const campaignId = String(payload?.id || `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
            const createdAt = String(payload?.created_at || now);

            await this.initializeDatabase(hashedMasterKey);
            const campaignsDb = await this.getCampaignsDatabase(hashedMasterKey);
            this.ensureCampaignsTable(campaignsDb, hashedMasterKey);

            campaignsDb.run(
                `INSERT OR REPLACE INTO ${tableName} (
                    id,
                    name,
                    campaign_brief,
                    poster_png,
                    poster_overlay_json,
                    poster_background_image,
                    presentation_html,
                    miniapp_html,
                    palette_json,
                    chat_history_json,
                    orchestrator_context_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    campaignId,
                    name,
                    JSON.stringify(payload?.campaign_brief || {}),
                    payload?.poster_png || '',
                    JSON.stringify(payload?.poster_overlay_data || null),
                    payload?.poster_background_image || '',
                    payload?.presentation_html || '',
                    payload?.miniapp_html || '',
                    JSON.stringify(Array.isArray(payload?.palette) ? payload.palette : []),
                    JSON.stringify(Array.isArray(payload?.chat_history) ? payload.chat_history : []),
                    JSON.stringify(Array.isArray(payload?.orchestrator_context) ? payload.orchestrator_context : []),
                    createdAt,
                    now
                ]
            );

            await this.saveToStorage(campaignsDb.export(), hashedMasterKey, 'campaings');
            return campaignId;
        } catch (error) {
            console.error('saveCampaign error:', error);
            throw error;
        }
    }

    static async getCampaigns(hashedMasterKey) {
        try {
            if (!hashedMasterKey) return [];

            await this.initializeDatabase(hashedMasterKey);
            const campaignsDb = await this.getDatabase(hashedMasterKey, 'campaings', false);
            if (!campaignsDb) {
                console.warn('PaiperworkDB.getCampaigns: no campaings DB available after initialization', {
                    hashPrefix: String(hashedMasterKey || '').slice(0, 8)
                });
                return [];
            }

            const tableName = `campaigns_${hashedMasterKey}`;
            const tableCheck = campaignsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                console.warn('PaiperworkDB.getCampaigns: campaigns table missing in campaings DB', {
                    hashPrefix: String(hashedMasterKey || '').slice(0, 8),
                    tableName
                });
                return [];
            }

            const rows = campaignsDb.exec(`
                SELECT id, name, created_at, updated_at
                FROM ${tableName}
                ORDER BY updated_at DESC, created_at DESC, id DESC
            `);

            if (!rows || !rows[0] || !rows[0].values) {
                console.warn('PaiperworkDB.getCampaigns: query returned no rows array', {
                    hashPrefix: String(hashedMasterKey || '').slice(0, 8),
                    tableName
                });
                return [];
            }

            return rows[0].values.map(row => ({
                id: row[0] || '',
                name: row[1] || '',
                created_at: row[2] || '',
                updated_at: row[3] || ''
            }));
        } catch (error) {
            console.error('getCampaigns error:', error);
            return [];
        }
    }

    static async loadCampaign(hashedMasterKey, campaignId) {
        try {
            if (!hashedMasterKey || !campaignId) return null;

            await this.initializeDatabase(hashedMasterKey);
            const campaignsDb = await this.getDatabase(hashedMasterKey, 'campaings', false);
            if (!campaignsDb) return null;

            const tableName = this.ensureCampaignsTable(campaignsDb, hashedMasterKey);

            const rows = campaignsDb.exec(
                `SELECT id, name, campaign_brief, poster_png, poster_overlay_json, poster_background_image, presentation_html, miniapp_html, palette_json, chat_history_json, orchestrator_context_json, created_at, updated_at FROM ${tableName} WHERE id = ? LIMIT 1`,
                [campaignId]
            );

            if (!rows || !rows[0] || !rows[0].values || !rows[0].values.length) {
                return null;
            }

            const row = rows[0].values[0];
            return {
                id: row[0] || '',
                name: row[1] || '',
                campaign_brief: this.safeParseJson(row[2], {}),
                poster_png: row[3] || '',
                poster_overlay_data: this.safeParseJson(row[4], null),
                poster_background_image: row[5] || '',
                presentation_html: row[6] || '',
                miniapp_html: row[7] || '',
                palette: this.safeParseJson(row[8], []),
                chat_history: this.safeParseJson(row[9], []),
                orchestrator_context: this.safeParseJson(row[10], []),
                created_at: row[11] || '',
                updated_at: row[12] || ''
            };
        } catch (error) {
            console.error('loadCampaign error:', error);
            return null;
        }
    }

    static async deleteCampaign(hashedMasterKey, campaignId) {
        try {
            if (!hashedMasterKey || !campaignId) return false;

            await this.initializeDatabase(hashedMasterKey);
            const campaignsDb = await this.getDatabase(hashedMasterKey, 'campaings', false);
            if (!campaignsDb) return false;

            const tableName = `campaigns_${hashedMasterKey}`;
            const tableCheck = campaignsDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return false;
            }

            campaignsDb.run(`DELETE FROM ${tableName} WHERE id = ?`, [campaignId]);
            await this.saveToStorage(campaignsDb.export(), hashedMasterKey, 'campaings');
            return true;
        } catch (error) {
            console.error('deleteCampaign error:', error);
            return false;
        }
    }

    static safeParseJson(value, fallback) {
        if (typeof value !== 'string' || !value.trim()) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (_error) {
            return fallback;
        }
    }

    static async hashMasterKeyValue(masterkey) {
       //console.log('Generating hash for masterkey:', masterkey);
        const encoder = new TextEncoder();
        const data = encoder.encode(masterkey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedMasterKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
       //console.log('Hash generated:', hashedMasterKey);
        return hashedMasterKey;
    }

    static isHashedWhatsappLookupKey(value) {
        return String(value || '').startsWith(this.WHATSAPP_LOOKUP_PREFIX);
    }

    static async hashScopedLookupKey(hashedMasterKey, scope, rawValue) {
        const normalizedValue = String(rawValue || '').trim();
        if (!hashedMasterKey || !scope || !normalizedValue) {
            return '';
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(`${hashedMasterKey}:${scope}:${normalizedValue}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return this.WHATSAPP_LOOKUP_PREFIX + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async migrateWhatsappLookupKeys(hashedMasterKey, whatsappDb) {
        if (!hashedMasterKey || !whatsappDb) {
            return false;
        }

        let mutated = false;

        const phoneRows = whatsappDb.exec(`SELECT phone, context FROM whatsapp_phone_contexts`);
        if (phoneRows && phoneRows[0] && Array.isArray(phoneRows[0].values)) {
            for (const [storedPhone, context] of phoneRows[0].values) {
                const rawPhone = String(storedPhone || '').trim();
                if (!rawPhone || this.isHashedWhatsappLookupKey(rawPhone)) {
                    continue;
                }
                const normalizedPhone = rawPhone.replace(/@.*$/g, '').trim();
                const lookupPhone = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_phone_context', normalizedPhone);
                if (!lookupPhone) {
                    continue;
                }
                whatsappDb.run(`INSERT OR REPLACE INTO whatsapp_phone_contexts (phone, context) VALUES (?, ?)`, [lookupPhone, context || '']);
                whatsappDb.run(`DELETE FROM whatsapp_phone_contexts WHERE phone = ?`, [rawPhone]);
                mutated = true;
            }
        }

        const sessionRows = whatsappDb.exec(`SELECT device_id, session_blob, metadata_blob, updated_at FROM whatsapp_session_bundles`);
        if (sessionRows && sessionRows[0] && Array.isArray(sessionRows[0].values)) {
            for (const [storedDeviceId, sessionBlob, metadataBlob, updatedAt] of sessionRows[0].values) {
                const rawDeviceId = String(storedDeviceId || '').trim();
                if (!rawDeviceId || this.isHashedWhatsappLookupKey(rawDeviceId)) {
                    continue;
                }

                const deviceLookup = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_session_bundle', rawDeviceId);
                if (!deviceLookup) {
                    continue;
                }
                whatsappDb.run(`INSERT OR REPLACE INTO whatsapp_session_bundles (device_id, session_blob, metadata_blob, updated_at) VALUES (?, ?, ?, ?)`, [deviceLookup, sessionBlob || '', metadataBlob || '', updatedAt || new Date().toISOString()]);
                whatsappDb.run(`DELETE FROM whatsapp_session_bundles WHERE device_id = ?`, [rawDeviceId]);
                mutated = true;
            }
        }

        return mutated;
    }
    // Deletes the database for a given master key hash from OPFS and IndexedDB.
    static async deleteDatabase(hashedMasterKey) {
       //console.log('Starting deletion of database for hashedMasterKey:', hashedMasterKey);

        // Close any open DB handles for this profile to avoid blocked deletes.
        await this.closeRoleDatabases('rag', hashedMasterKey);
        await this.closeRoleDatabases('presentations', hashedMasterKey);
        await this.closeRoleDatabases('artifacts', hashedMasterKey);
        await this.closeRoleDatabases('campaings', hashedMasterKey);
        await this.closeRoleDatabases('kb', hashedMasterKey);
        await this.closeRoleDatabases('images', hashedMasterKey);
        await this.closeRoleDatabases('whatsapp', hashedMasterKey);
        await this.closeRoleDatabases('main', hashedMasterKey);

        let opfsDeleted = true;
        let indexedDBDeleted = false;

        // Delete from OPFS if supported
        if (this.opfsSupported) {
            try {
               //console.log('Deleting from OPFS...');
                const root = await navigator.storage.getDirectory();
                const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });

                try {
                    // Delete both main and rag database files for this profile
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'main'));
                } catch (error) {
                    console.warn('Error deleting main database from OPFS:', error);
                    opfsDeleted = false;
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'rag'));
                   //console.log('Successfully deleted database from OPFS');
                } catch (error) {
                    // Rag DB may not exist yet in older installs; treat NotFound as non-fatal.
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting rag database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'presentations'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting presentations database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'artifacts'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting artifacts database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'campaings'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting campaings database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'kb'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting kb database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'images'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting images database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }

                try {
                    await dbDir.removeEntry(this.getDbFileName(hashedMasterKey, 'whatsapp'));
                } catch (error) {
                    if (error?.name !== 'NotFoundError') {
                        console.warn('Error deleting whatsapp database from OPFS:', error);
                        opfsDeleted = false;
                    }
                }
            } catch (error) {
                // If directory doesn't exist, that's fine
               //console.log('No PaiperworkDB directory in OPFS or other error:', error);
            }
        }

        // Delete from IndexedDB
        indexedDBDeleted = await new Promise((resolve) => {
            const request = indexedDB.open('PaiperworkDB', 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['databases'], 'readwrite');
                const store = transaction.objectStore('databases');
                const mainKey = this.getDbStorageKey(hashedMasterKey, 'main');
                const ragKey = this.getDbStorageKey(hashedMasterKey, 'rag');
                const presentationsKey = this.getDbStorageKey(hashedMasterKey, 'presentations');
                const artifactsKey = this.getDbStorageKey(hashedMasterKey, 'artifacts');
                const campaingsKey = this.getDbStorageKey(hashedMasterKey, 'campaings');
                const kbKey = this.getDbStorageKey(hashedMasterKey, 'kb');
                const imagesKey = this.getDbStorageKey(hashedMasterKey, 'images');
                const whatsappKey = this.getDbStorageKey(hashedMasterKey, 'whatsapp');
                const deleteRequest = store.delete(mainKey);

                deleteRequest.onsuccess = () => {
                    const deleteRagRequest = store.delete(ragKey);
                    deleteRagRequest.onsuccess = () => {
                        const deletePresentationsRequest = store.delete(presentationsKey);
                        deletePresentationsRequest.onsuccess = () => {
                            const deleteArtifactsRequest = store.delete(artifactsKey);
                            deleteArtifactsRequest.onsuccess = () => {
                                const deleteCampaingsRequest = store.delete(campaingsKey);
                                deleteCampaingsRequest.onsuccess = () => {
                                    const deleteKbRequest = store.delete(kbKey);
                                    deleteKbRequest.onsuccess = () => {
                                        const deleteImagesRequest = store.delete(imagesKey);
                                        deleteImagesRequest.onsuccess = () => {
                                            const deleteWhatsappRequest = store.delete(whatsappKey);
                                            deleteWhatsappRequest.onsuccess = () => resolve(true);
                                            deleteWhatsappRequest.onerror = () => {
                                                console.error('Error deleting whatsapp database from IndexedDB:', deleteWhatsappRequest.error);
                                                resolve(false);
                                            };
                                        };
                                        deleteImagesRequest.onerror = () => {
                                            console.error('Error deleting images database from IndexedDB:', deleteImagesRequest.error);
                                            resolve(false);
                                        };
                                    };
                                    deleteKbRequest.onerror = () => {
                                        console.error('Error deleting kb database from IndexedDB:', deleteKbRequest.error);
                                        resolve(false);
                                    };
                                };
                                deleteCampaingsRequest.onerror = () => {
                                    console.error('Error deleting campaings database from IndexedDB:', deleteCampaingsRequest.error);
                                    resolve(false);
                                };
                            };
                            deleteArtifactsRequest.onerror = () => {
                                console.error('Error deleting artifacts database from IndexedDB:', deleteArtifactsRequest.error);
                                resolve(false);
                            };
                        };
                        deletePresentationsRequest.onerror = () => {
                            console.error('Error deleting presentations database from IndexedDB:', deletePresentationsRequest.error);
                            resolve(false);
                        };
                    };
                    deleteRagRequest.onerror = () => {
                        console.error('Error deleting rag database from IndexedDB:', deleteRagRequest.error);
                        resolve(false);
                    };
                };

                deleteRequest.onerror = () => {
                    console.error('Error deleting database from IndexedDB:', deleteRequest.error);
                    resolve(false);
                };
            };

            request.onerror = () => {
                console.error('Error opening database:', request.error);
                resolve(false);
            };
        });

        const legacyHtmlDeleted = await this.deleteLegacyHtmlDatabase(hashedMasterKey);

       //console.log(`Database deletion results - OPFS: ${opfsDeleted}, IndexedDB: ${indexedDBDeleted}`);
        const deleteSuccess = opfsDeleted && indexedDBDeleted && legacyHtmlDeleted;

        // Remove profile-specific traces from browser storage/session when profile deletion succeeds.
        if (deleteSuccess) {
            await this.clearUserSpecificClientTraces(hashedMasterKey);
        }

        return deleteSuccess;
    }

    static async clearUserSpecificClientTraces(hashedMasterKey) {
        try {
            const activeSessionHash = (typeof sessionStorage !== 'undefined')
                ? (sessionStorage.getItem('hashedMasterKey') || '')
                : '';
            const shouldClearLocalProfileKeys = !hashedMasterKey || !activeSessionHash || activeSessionHash === hashedMasterKey;

            if (shouldClearLocalProfileKeys && typeof localStorage !== 'undefined') {
                [
                    'selectedModel',
                    'selectedModelProvider',
                    'selectedVisualModel',
                    'selectedContextSize',
                    'contextSize',
                    'insightsEnabled'
                ].forEach((key) => {
                    try {
                        localStorage.removeItem(key);
                    } catch (_err) {
                        // Ignore storage cleanup issues.
                    }
                });
            }

            if (typeof sessionStorage !== 'undefined' && shouldClearLocalProfileKeys) {
                try { sessionStorage.removeItem('hashedMasterKey'); } catch (_err) { }
                try { sessionStorage.removeItem('encryptedMasterKey'); } catch (_err) { }
            }

            if (this.ollamaApiKeyCache && hashedMasterKey) {
                this.ollamaApiKeyCache.delete(hashedMasterKey);
            }

            if (typeof window !== 'undefined' && shouldClearLocalProfileKeys) {
                window.currentConversationGroup = null;
                if (window.OllamaAPI) {
                    window.OllamaAPI.previousContext = null;
                    if (typeof window.OllamaAPI.resetContext === 'function') {
                        window.OllamaAPI.resetContext();
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Error clearing user-specific client traces:', error);
            return false;
        }
    }

    // Deletes all databases and clears localStorage.
    static async deleteAllDatabases() {
       //console.log('🗑️ Starting deletion of all data');

        await this.closeRoleDatabases('rag');
        await this.closeRoleDatabases('presentations');
        await this.closeRoleDatabases('artifacts');
        await this.closeRoleDatabases('kb');
        await this.closeRoleDatabases('images');
        await this.closeRoleDatabases('whatsapp');
        await this.closeRoleDatabases('main');

        // CRITICAL FIX: Ensure we know our current storage strategy
        // If we haven't determined it yet, do it now
        if (!this.opfsSupported && !this.useIndexedDBOnly) {
           //console.log('🔧 Storage strategy not determined, checking now...');
            await this.ensureDatabaseExists();
        }

       //console.log(`📍 Current storage strategy: ${this.opfsSupported && !this.useIndexedDBOnly ? 'OPFS' : 'IndexedDB'}`);
       //console.log(`📊 Storage flags: opfsSupported=${this.opfsSupported}, useIndexedDBOnly=${this.useIndexedDBOnly}`);

        let storageDeleted = false;

        // Delete from our primary storage
        if (this.opfsSupported && !this.useIndexedDBOnly) {
           //console.log('🗑️ Deleting from OPFS (primary storage)...');
            try {
                const root = await navigator.storage.getDirectory();
                try {
                    const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });
                   //console.log('🗑️ Found PaiperworkDB directory in OPFS');

                    let deletedFiles = 0;
                    for await (const [name, handle] of dbDir.entries()) {
                        if (name.endsWith('.db')) {
                            try {
                                await dbDir.removeEntry(name);
                                deletedFiles++;
                               //console.log(`🗑️ Successfully deleted OPFS file: ${name}`);
                            } catch (deleteError) {
                                console.warn(`❌ Error deleting OPFS file ${name}:`, deleteError);
                            }
                        }
                    }
                   //console.log(`🗑️ Deleted ${deletedFiles} .db files from OPFS`);

                    try {
                        await root.removeEntry('PaiperworkDB', { recursive: true });
                       //console.log('🗑️ Successfully deleted PaiperworkDB directory from OPFS');
                        storageDeleted = true;
                    } catch (dirError) {
                        console.warn('⚠️ Error deleting PaiperworkDB directory:', dirError);
                        storageDeleted = deletedFiles > 0;
                    }
                } catch (error) {
                    if (error.name === 'NotFoundError') {
                       //console.log('ℹ️ No PaiperworkDB directory found in OPFS');
                        storageDeleted = true; // Nothing to delete is success
                    } else {
                        console.warn('❌ Error accessing PaiperworkDB directory in OPFS:', error);
                    }
                }
            } catch (error) {
                console.warn('❌ Error accessing OPFS root:', error);
            }

            // Also clean up any legacy IndexedDB data
           //console.log('🧹 Cleaning up any legacy IndexedDB data...');
            try {
                await new Promise((resolve) => {
                    const deleteRequest = indexedDB.deleteDatabase('PaiperworkDB');
                    deleteRequest.onsuccess = () => {
                       //console.log('🧹 Legacy IndexedDB data cleaned up');
                        resolve();
                    };
                    deleteRequest.onerror = deleteRequest.onblocked = () => resolve();
                });
            } catch (error) {
                console.warn('⚠️ Error cleaning up legacy IndexedDB:', error);
            }
        } else {
           //console.log('🗑️ Deleting from IndexedDB (primary storage)...');
            storageDeleted = await new Promise((resolve) => {
                const deleteRequest = indexedDB.deleteDatabase('PaiperworkDB');

                deleteRequest.onsuccess = () => {
                   //console.log('✅ PaiperworkDB successfully deleted from IndexedDB');
                    resolve(true);
                };

                deleteRequest.onerror = () => {
                    console.error('❌ Error deleting PaiperworkDB from IndexedDB:', deleteRequest.error);
                    resolve(false);
                };

                deleteRequest.onblocked = () => {
                    console.warn('⚠️ IndexedDB deletion blocked - some connections may still be open');
                    resolve(true); // Still resolve true as deletion will complete
                };
            });
        }

        // Clear localStorage regardless of outcome
        const localStorageKeys = Object.keys(localStorage);
       //console.log(`🗑️ Clearing localStorage (${localStorageKeys.length} items)...`);
        localStorage.clear();
       //console.log('✅ localStorage cleared');

        // Reset our initialization flags
        this.dbInitialized = false;
        this.initializationPromise = null;
        this.SQL = null;
        this.ollamaApiKeyCache.clear();
        // IMPORTANT: Also reset storage strategy flags so they're re-determined on next startup
        this.opfsSupported = false;
        this.useIndexedDBOnly = false;
       //console.log('🔄 Database initialization flags reset');

       //console.log(`🗑️ Storage deletion result: ${storageDeleted}`);
        return storageDeleted;
    }
    // Generates a cryptographic key from the master key for encryption.
    static async generateKey(masterkey) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(masterkey),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: encoder.encode("CodexSalt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    // Encrypts a prompt using the master key.
    static async encrypt(masterkey, prompt) {
        const key = await this.generateKey(masterkey);
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoder.encode(prompt)
        );

        return {
            encrypted: this.bytesToBase64(new Uint8Array(encryptedData)),
            iv: this.bytesToBase64(iv)
        };
    }

    static async encryptBinary(masterkey, bytes) {
        const key = await this.generateKey(masterkey);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        );

        return {
            encrypted: new Uint8Array(encryptedData),
            iv: new Uint8Array(iv)
        };
    }

    // Decrypts an encrypted prompt using the master key.
    static async decrypt(masterkey, encryptedData) {


        try {
            // Handle both string and object formats
            const parsedData = typeof encryptedData === 'string'
                ? JSON.parse(encryptedData)
                : encryptedData;

            // Enhanced validation with array handling
            if (Array.isArray(parsedData)) {
               //console.log('Processing array format data');
                return parsedData.encrypted || parsedData;
            }

            // Standard object format handling
            if (!parsedData?.encrypted || !parsedData?.iv) {
               //console.log('Data structure missing required fields');
                return '';
            }

            const encryptedBytes = Array.isArray(parsedData.encrypted)
                ? new Uint8Array(parsedData.encrypted)
                : this.base64ToUint8Array(parsedData.encrypted);
            const ivBytes = Array.isArray(parsedData.iv)
                ? new Uint8Array(parsedData.iv)
                : this.base64ToUint8Array(parsedData.iv);

            const key = await this.generateKey(masterkey);
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                key,
                encryptedBytes
            );

            const result = new TextDecoder().decode(decrypted);
           //console.log('Decryption successful');
            return result;

        } catch (error) {
           //console.log('Decryption failed:', error.message);
            return '';
        }
    }

    static async decryptBinary(masterkey, encryptedData, ivData) {
        const encryptedBytes = encryptedData instanceof Uint8Array
            ? encryptedData
            : new Uint8Array(encryptedData || []);
        const ivBytes = ivData instanceof Uint8Array
            ? ivData
            : new Uint8Array(ivData || []);

        const key = await this.generateKey(masterkey);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            key,
            encryptedBytes
        );

        return new Uint8Array(decrypted);
    }

    // Securely store a value in localStorage by encrypting it with a master key derived from the storage key
    static async secureLocalStorageSet(key, value) {
        try {
            const hashedMasterKey = await this.hashMasterKeyValue(String(key));
            const encrypted = await this.encrypt(hashedMasterKey, String(value));
            localStorage.setItem(key, JSON.stringify(encrypted));
            return true;
        } catch (error) {
            console.error('secureLocalStorageSet error:', error);
            try {
                // Fallback to plain storage if encryption fails
                localStorage.setItem(key, String(value));
            } catch (e) {
                console.error('Fallback localStorage.setItem failed:', e);
            }
            return false;
        }
    }

    // Securely retrieve a value from localStorage by decrypting it with a master key derived from the storage key
    // If the stored value isn't encrypted (legacy/plaintext), the plaintext value will be returned.
    static async secureLocalStorageGet(key) {
        try {
            const existing = localStorage.getItem(key);
            if (!existing) return null;

            // Try to parse as JSON - encrypted values are stored as JSON objects
            let parsed;
            try {
                parsed = JSON.parse(existing);
            } catch (e) {
                // Not JSON - assume plaintext legacy value
                return existing;
            }

            const hashedMasterKey = await this.hashMasterKeyValue(String(key));
            const decrypted = await this.decrypt(hashedMasterKey, parsed);

            // If decryption failed for an encrypted payload, avoid leaking ciphertext to callers.
            if (decrypted === '') {
                return this.isEncryptedPayloadObject(parsed) ? null : existing;
            }
            return decrypted;
        } catch (error) {
            console.error('secureLocalStorageGet error:', error);
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        }
    }

    // Loads user settings from the database for a given master key hash.
    static async loadSettings(hashedMasterKey) {
       //console.log('Loading settings for masterkey:', hashedMasterKey);

        try {
            // First ensure database is initialized, only runs once
            if (!this.dbInitialized) {
               //console.log('Database not yet initialized, initializing now...');
                await this.initializeDatabase(hashedMasterKey);
            }

            // We need a static SQL reference to avoid repeated initialization
            if (!this.SQL) {
               //console.log('Initializing SQL.js once for all operations');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get the existing database - this already handles OPFS when supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
               //console.log('No existing database found, returning default settings');
                return {
                    systemPrompt: '',
                    model: '',
                    contextSize: '8192',
                    contextSizeStored: false,
                    insights_enabled: 'false',
                    visualModel: '',
                    modelProvider: 'local',
                    ollamaApiKey: ''
                };
            }

            // If we have a database, proceed with loading settings
            try {
                const sqlDb = new this.SQL.Database(existingDb);

                // Check if user_settings table exists
                const tableCheck = sqlDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_settings'");

                if (!tableCheck.length || !tableCheck[0].values.length) {
                   //console.log('user_settings table not found, returning defaults');
                    sqlDb.close();
                    return {
                        systemPrompt: '',
                        model: '',
                        contextSize: '8192',
                        contextSizeStored: false,
                        insights_enabled: 'false',
                        modelProvider: 'local',
                        ollamaApiKey: ''
                    };
                }

                const result = sqlDb.exec(`
                SELECT system_prompt, model, context_size, insights_enabled, visual_model, model_provider, ollama_api_key
                FROM user_settings
                WHERE masterkey_hash = ?;
            `, [hashedMasterKey]);

                if (result[0] && result[0].values[0]) {
                    // Check if visual_model column exists and has a value
                    const hasVisualModel = result[0].columns.includes('visual_model');
                    const visualModelIndex = result[0].columns.indexOf('visual_model');
                    const visualModelStr = hasVisualModel && visualModelIndex >= 0 && result[0].values[0].length > visualModelIndex
                        ? result[0].values[0][visualModelIndex]
                        : null;

                    const hasModelProvider = result[0].columns.includes('model_provider');
                    const modelProviderIndex = result[0].columns.indexOf('model_provider');
                    const modelProviderStr = hasModelProvider && modelProviderIndex >= 0 && result[0].values[0].length > modelProviderIndex
                        ? result[0].values[0][modelProviderIndex]
                        : null;

                    const hasApiKey = result[0].columns.includes('ollama_api_key');
                    const apiKeyIndex = result[0].columns.indexOf('ollama_api_key');
                    const apiKeyStr = hasApiKey && apiKeyIndex >= 0 && result[0].values[0].length > apiKeyIndex
                        ? result[0].values[0][apiKeyIndex]
                        : null;

                    const [systemPromptStr, modelStr, contextSizeStr, insightsEnabledStr] = result[0].values[0];

                    let systemPrompt = '';
                    let model = '';
                    let contextSize = '8192';
                    let contextSizeStored = false;
                    let insightsEnabled = 'false';
                    let visualModel = '';
                    let modelProvider = 'local';
                    let ollamaApiKey = '';

                    try {
                        // Decrypt system prompt if it exists
                        if (systemPromptStr) {
                            const encryptedPrompt = JSON.parse(systemPromptStr);
                            systemPrompt = await this.decrypt(hashedMasterKey, encryptedPrompt);
                        }

                        // Decrypt model if it exists
                        if (modelStr) {
                            const encryptedModel = JSON.parse(modelStr);
                            model = await this.decrypt(hashedMasterKey, encryptedModel);
                            model = await this.normalizeStoredStringValue(model, hashedMasterKey);
                        }

                        // Decrypt context size if it exists
                        if (contextSizeStr) {
                            const encryptedSize = JSON.parse(contextSizeStr);
                            contextSize = await this.decrypt(hashedMasterKey, encryptedSize);
                            contextSizeStored = String(contextSize || '').trim().length > 0;
                        }

                        // ALWAYS decrypt and load insights_enabled without any conditions
                        if (insightsEnabledStr) {
                            try {
                                const encryptedInsights = JSON.parse(insightsEnabledStr);
                                insightsEnabled = await this.decrypt(hashedMasterKey, encryptedInsights);
                            } catch (parseError) {
                                // Legacy or unencrypted values may be stored as plain text
                                insightsEnabled = String(insightsEnabledStr).trim();
                            }
                        }

                        // Decrypt visual model if it exists
                        if (visualModelStr) {
                            const encryptedVisualModel = JSON.parse(visualModelStr);
                            visualModel = await this.decrypt(hashedMasterKey, encryptedVisualModel);
                        }

                        // Decrypt model provider if it exists
                        if (modelProviderStr) {
                            const encryptedProvider = JSON.parse(modelProviderStr);
                            modelProvider = await this.decrypt(hashedMasterKey, encryptedProvider);
                            modelProvider = await this.normalizeStoredStringValue(modelProvider, hashedMasterKey);
                        }

                        // Decrypt Ollama API key if it exists
                        if (apiKeyStr) {
                            const encryptedApiKey = JSON.parse(apiKeyStr);
                            ollamaApiKey = await this.decrypt(hashedMasterKey, encryptedApiKey);
                        }
                    } catch (decryptError) {
                       //console.log('Using default values due to decryption error:', decryptError);
                    }

                    sqlDb.close(); // Close the database connection

                    return {
                        systemPrompt,
                        model,
                        contextSize,
                        contextSizeStored,
                        insights_enabled: insightsEnabled,
                        visualModel,
                        modelProvider: modelProvider || 'local',
                        ollamaApiKey
                    };
                }

                sqlDb.close(); // Close the database connection
            } catch (error) {
                console.error('Error executing SQL query:', error);
            }

            // Return default values if no settings found or error occurred
            return {
                systemPrompt: '',
                model: '',
                contextSize: '8192',
                contextSizeStored: false,
                insights_enabled: 'false',
                visualModel: '',
                modelProvider: 'local',
                ollamaApiKey: ''
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                systemPrompt: '',
                model: '',
                contextSize: '8192',
                contextSizeStored: false,
                insights_enabled: 'false',
                visualModel: '',
                modelProvider: 'local',
                ollamaApiKey: ''
            };
        }
    }

    // Saves the selected model to the database and localStorage.
    static async saveModel(hashedMasterKey, model, modelProvider = 'local') {
           //console.log('Save model operation started:', { hashedMasterKey, model: model || 'empty' });

        try {
            await this.initializeDatabase(hashedMasterKey);

            const normalizedModel = await this.normalizeStoredStringValue(model, hashedMasterKey);
            const normalizedProvider = String(await this.normalizeStoredStringValue(modelProvider, hashedMasterKey) || 'local').trim().toLowerCase() || 'local';

            // Get SQL.js if not already loaded
            if (!this.SQL) {
               //console.log('Initializing SQL.js for saveModel');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

           //console.log('Encrypting model with key:', hashedMasterKey);
            const encryptedModel = await this.encrypt(hashedMasterKey, normalizedModel);
            const encryptedProvider = await this.encrypt(hashedMasterKey, normalizedProvider);

            // Get existing database - this already checks OPFS first if supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            const sqlDb = existingDb
                ? new this.SQL.Database(existingDb)
                : new this.SQL.Database();

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    system_prompt TEXT,
                    model TEXT,
                    context_size TEXT,
                    insights_enabled TEXT,
                    visual_model TEXT,
                    model_provider TEXT,
                    ollama_api_key TEXT
                )
            `);

            // Ensure model_provider exists (defensive for mixed-version databases)
            const columnCheck = sqlDb.exec(`PRAGMA table_info(user_settings)`);
            const hasModelProviderColumn = columnCheck[0]?.values.some(col => col[1] === 'model_provider');
            if (!hasModelProviderColumn) {
                sqlDb.run(`ALTER TABLE user_settings ADD COLUMN model_provider TEXT`);
            }

            sqlDb.run(`INSERT OR IGNORE INTO user_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);

            sqlDb.run(`
                UPDATE user_settings
                SET model = ?, model_provider = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedModel), JSON.stringify(encryptedProvider), hashedMasterKey]);

            // Export the database
            const dbExport = sqlDb.export();

            // Save to both OPFS and IndexedDB using our enhanced method
           //console.log('Saving updated database with model');
            await this.saveToStorage(dbExport, hashedMasterKey);

            // Verify and self-heal once if needed (guards against startup write races).
            try {
                const loaded = await this.loadSettings(hashedMasterKey);
                const loadedModel = String(loaded?.model || '').trim();
                const loadedProvider = String(loaded?.modelProvider || 'local').trim().toLowerCase();
                if (loadedModel !== normalizedModel || loadedProvider !== normalizedProvider) {
                    const retryDb = await this.getExistingDatabase(hashedMasterKey);
                    if (retryDb) {
                        const retrySqlDb = new this.SQL.Database(retryDb);
                        retrySqlDb.run(`
                            UPDATE user_settings
                            SET model = ?, model_provider = ?
                            WHERE masterkey_hash = ?
                        `, [JSON.stringify(encryptedModel), JSON.stringify(encryptedProvider), hashedMasterKey]);
                        await this.saveToStorage(retrySqlDb.export(), hashedMasterKey);
                    }
                }
            } catch (_verifyErr) {
                // non-fatal
            }

           //console.log('Model saved successfully for masterkey:', hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving model:', error);
            return false;
        }
    }

    static async saveOllamaApiKey(hashedMasterKey, apiKey) {
        try {
            // Ensure backing storage/schema exist even on fresh installs.
            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const normalizedApiKey = this.normalizeOllamaApiKey(apiKey || '');
            const encryptedApiKey = await this.encrypt(hashedMasterKey, normalizedApiKey);
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            const sqlDb = existingDb
                ? new this.SQL.Database(existingDb)
                : new this.SQL.Database();

            // Ensure table exists for first-write scenarios.
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    system_prompt TEXT,
                    model TEXT,
                    context_size TEXT,
                    insights_enabled TEXT,
                    visual_model TEXT,
                    model_provider TEXT,
                    ollama_api_key TEXT
                )
            `);

            // Ensure column exists for older databases.
            const columnCheck = sqlDb.exec(`PRAGMA table_info(user_settings)`);
            const hasApiKeyColumn = columnCheck[0]?.values.some(col => col[1] === 'ollama_api_key');
            if (!hasApiKeyColumn) {
                sqlDb.run(`ALTER TABLE user_settings ADD COLUMN ollama_api_key TEXT`);
            }

            // Ensure a settings row exists for this user before updating.
            sqlDb.run(`INSERT OR IGNORE INTO user_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);

            sqlDb.run(`
                UPDATE user_settings
                SET ollama_api_key = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedApiKey), hashedMasterKey]);

            if (typeof sqlDb.getRowsModified === 'function' && sqlDb.getRowsModified() === 0) {
                console.warn('Ollama API key save updated 0 rows', { hashedMasterKeyPresent: !!hashedMasterKey });
            }

            await this.saveToStorage(sqlDb.export(), hashedMasterKey);

            // Keep a consistent in-session view even if storage readback is delayed.
            this.ollamaApiKeyCache.set(hashedMasterKey, normalizedApiKey);

            return true;
        } catch (error) {
            console.error('Error saving Ollama API key:', error);
            return false;
        }
    }

    static async saveWhatsappDeviceInfo(hashedMasterKey, deviceId, metadata = '') {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS devices (
                    device_id TEXT PRIMARY KEY,
                    display_name TEXT DEFAULT '',
                    jid TEXT DEFAULT '',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            sqlDb.run(`CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at)`);

            const normalizedDeviceId = String(deviceId || '').trim();
            const metadataObj = metadata && typeof metadata === 'object' ? { ...metadata } : {};
            if (normalizedDeviceId) {
                metadataObj.selectedDeviceId = normalizedDeviceId;
                metadataObj.deviceId = normalizedDeviceId;
            } else {
                delete metadataObj.selectedDeviceId;
                delete metadataObj.deviceId;
            }
            if (Array.isArray(metadataObj.devices)) {
                metadataObj.devices = metadataObj.devices
                    .filter(entry => entry && typeof entry === 'object')
                    .map(entry => ({ ...entry }))
                    .filter(entry => String(entry.deviceId || entry.device_id || '').trim() === normalizedDeviceId)
                    .slice(0, 1);
            }
            const encryptedMeta = Object.keys(metadataObj).length > 0
                ? await this.encrypt(hashedMasterKey, JSON.stringify(metadataObj))
                : '';

            sqlDb.run(`DELETE FROM devices`);
            if (normalizedDeviceId) {
                const displayName = String(metadataObj.display_name || metadataObj.displayName || metadataObj.alias || metadataObj.name || '').trim();
                const jid = String(metadataObj.jid || '').trim();
                const now = new Date().toISOString();
                const createdAt = String(metadataObj.created_at || metadataObj.createdAt || metadataObj.savedAt || now).trim() || now;

                sqlDb.run(`
                    INSERT OR REPLACE INTO devices (device_id, display_name, jid, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                `, [normalizedDeviceId, displayName, jid, createdAt, now]);
            }

            sqlDb.run(`INSERT OR IGNORE INTO whatsapp_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);
            sqlDb.run(`
                UPDATE whatsapp_settings
                SET whatsapp_device_meta = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedMeta), hashedMasterKey]);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            //console.log('PaiperworkDB: saveWhatsappDeviceInfo succeeded', { hashedMasterKey, deviceId });
            return true;
        } catch (error) {
            console.error('Error saving Whatsapp device info:', error);
            return false;
        }
    }

    static async saveWhatsappPhoneContext(hashedMasterKey, phone, context) {
        try {
            if (!hashedMasterKey || !phone) return false;

            await this.initializeDatabase(hashedMasterKey);
            const normalizedPhone = String(phone).replace(/@.*$/g, '').trim();
            const lookupPhone = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_phone_context', normalizedPhone);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                    phone TEXT PRIMARY KEY,
                    context TEXT
                )
            `);

            const serialized = context && typeof context === 'object' ? JSON.stringify(context) : String(context || '');
            const encrypted = serialized ? await this.encrypt(hashedMasterKey, serialized) : '';
            const encryptedJson = encrypted ? JSON.stringify(encrypted) : '';

            sqlDb.run(`
                INSERT OR REPLACE INTO whatsapp_phone_contexts (phone, context)
                VALUES (?, ?)
            `, [lookupPhone, encryptedJson]);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving Whatsapp phone context:', error);
            return false;
        }
    }

    static async getWhatsappPhoneContext(hashedMasterKey, phone) {
        try {
            if (!hashedMasterKey || !phone) return null;

            await this.initializeDatabase(hashedMasterKey);
            const normalizedPhone = String(phone).replace(/@.*$/g, '').trim();
            const lookupPhone = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_phone_context', normalizedPhone);
            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'whatsapp');
            if (!existingDb) return null;

            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                    phone TEXT PRIMARY KEY,
                    context TEXT
                )
            `);
            const rows = sqlDb.exec(`SELECT context FROM whatsapp_phone_contexts WHERE phone = ? LIMIT 1`, [lookupPhone]);
            if (!rows || !rows[0] || !rows[0].values || !rows[0].values.length) {
                return null;
            }

            let encrypted = rows[0].values[0][0] || '';
            if (!encrypted) return null;

            // If we stored a JSON string, parse it into the encryption object.
            if (typeof encrypted === 'string') {
                try {
                    const maybeObj = JSON.parse(encrypted);
                    if (maybeObj && typeof maybeObj === 'object') {
                        encrypted = maybeObj;
                    }
                } catch (_err) {
                    // keep as raw string (legacy support)
                }
            }

            const decrypted = await this.decrypt(hashedMasterKey, encrypted);
            if (!decrypted) return null;

            try {
                return JSON.parse(decrypted);
            } catch (e) {
                return null;
            }
        } catch (error) {
            console.error('Error getting Whatsapp phone context:', error);
            return null;
        }
    }

    static async clearWhatsappPhoneContext(hashedMasterKey, phone) {
        try {
            if (!hashedMasterKey || !phone) return false;

            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) return false;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                    phone TEXT PRIMARY KEY,
                    context TEXT
                )
            `);
            const normalizedPhone = String(phone).replace(/@.*$/g, '').trim();
            const lookupPhone = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_phone_context', normalizedPhone);
            sqlDb.run(`DELETE FROM whatsapp_phone_contexts WHERE phone = ?`, [lookupPhone]);
            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error clearing Whatsapp phone context:', error);
            return false;
        }
    }

    static async clearAllWhatsappPhoneContexts(hashedMasterKey) {
        try {
            if (!hashedMasterKey) {
                return { success: false, count: 0 };
            }

            // Only clear the local per-phone WhatsApp context table.
            // Do not purge persisted pairing data, device info, or replay/history tracking state.
            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) {
                return { success: true, count: 0 };
            }

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_phone_contexts (
                    phone TEXT PRIMARY KEY,
                    context TEXT
                )
            `);

            let count = 0;
            try {
                const row = sqlDb.exec(`SELECT COUNT(*) FROM whatsapp_phone_contexts`);
                count = Number(row?.[0]?.values?.[0]?.[0] || 0);
            } catch (_countErr) {
                count = 0;
            }

            sqlDb.run(`DELETE FROM whatsapp_phone_contexts`);
            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return { success: true, count };
        } catch (error) {
            console.error('Error clearing all Whatsapp phone contexts:', error);
            return { success: false, count: 0 };
        }
    }

    static async getWhatsappDeviceInfo(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) {
                //console.info('PaiperworkDB:getWhatsappDeviceInfo source=whatsapp-role-db status=missing-db returning=null');
                return null;
            }

            //console.info('PaiperworkDB:getWhatsappDeviceInfo source=whatsapp-role-db status=db-found');
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS devices (
                    device_id TEXT PRIMARY KEY,
                    display_name TEXT DEFAULT '',
                    jid TEXT DEFAULT '',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const row = sqlDb.exec(`SELECT whatsapp_device_meta FROM whatsapp_settings WHERE masterkey_hash = ? LIMIT 1`, [hashedMasterKey]);
            if (!row || !row[0] || !row[0].values || !row[0].values.length) {
                console.info('PaiperworkDB:getWhatsappDeviceInfo source=whatsapp_settings status=no-row returning=null', { hashedMasterKey });
            }

            const encryptedMeta = row && row[0] && row[0].values && row[0].values.length
                ? (row[0].values[0][0] || '')
                : '';

            let meta = '';
            if (encryptedMeta) {
                try {
                    const decrypted = await this.decrypt(hashedMasterKey, encryptedMeta);
                    meta = decrypted ? JSON.parse(decrypted) : '';
                } catch (_e) {
                    meta = '';
                }
            }

            let deviceId = String((meta && (meta.selectedDeviceId || meta.deviceId || meta.device_id)) || '').trim();
            if (!deviceId) {
                const deviceRows = sqlDb.exec(`
                    SELECT device_id
                    FROM devices
                    ORDER BY updated_at DESC, created_at DESC, device_id ASC
                    LIMIT 1
                `);
                deviceId = String(deviceRows?.[0]?.values?.[0]?.[0] || '').trim();
            }

            if (!meta || typeof meta !== 'object') {
                meta = {};
            }
            if (deviceId && !meta.selectedDeviceId) {
                meta.selectedDeviceId = deviceId;
            }
            if (deviceId && !meta.deviceId) {
                meta.deviceId = deviceId;
            }

            if (!deviceId && (!meta || Object.keys(meta).length === 0)) {
                //console.info('PaiperworkDB:getWhatsappDeviceInfo source=whatsapp_settings status=empty-values returning=null');
                return null;
            }

            //console.info('PaiperworkDB:getWhatsappDeviceInfo source=whatsapp_settings status=resolved hasDeviceId=' + !!deviceId + ' hasMeta=' + !!(meta && Object.keys(meta).length));
            return { deviceId, meta };
        } catch (error) {
            console.error('Error getting Whatsapp device info:', error);
            return null;
        }
    }

    static async hasWhatsappPersistedPairingData(hashedMasterKey) {
        try {
            if (!hashedMasterKey) return false;

            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) return false;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS devices (
                    device_id TEXT PRIMARY KEY,
                    display_name TEXT DEFAULT '',
                    jid TEXT DEFAULT '',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const deviceRows = sqlDb.exec(`
                SELECT COUNT(*)
                FROM devices
                WHERE TRIM(COALESCE(device_id, '')) <> ''
            `);
            const deviceCount = Number(deviceRows?.[0]?.values?.[0]?.[0] || 0);
            if (deviceCount > 0) {
                return true;
            }

            const settingsRow = sqlDb.exec(`
                SELECT whatsapp_device_meta
                FROM whatsapp_settings
                WHERE masterkey_hash = ?
                LIMIT 1
            `, [hashedMasterKey]);
            const encryptedMeta = String(settingsRow?.[0]?.values?.[0]?.[0] || '').trim();
            if (!encryptedMeta) {
                return false;
            }

            try {
                const decrypted = await this.decrypt(hashedMasterKey, encryptedMeta);
                const meta = decrypted ? JSON.parse(decrypted) : null;
                const selectedDeviceId = String((meta && (meta.selectedDeviceId || meta.deviceId || meta.device_id)) || '').trim();
                if (selectedDeviceId) {
                    return true;
                }

                return !!(meta && Array.isArray(meta.devices) && meta.devices.some(entry => String(entry && (entry.deviceId || entry.device_id) || '').trim()));
            } catch (_e) {
                return true;
            }
        } catch (error) {
            console.error('Error checking Whatsapp persisted pairing data:', error);
            return false;
        }
    }

    static async saveWhatsappMode(hashedMasterKey, mode) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const normalizedMode = mode === 'personal' || mode === 'bot' ? mode : '';
            const encryptedMode = normalizedMode ? await this.encrypt(hashedMasterKey, normalizedMode) : '';
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT,
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);

            const columnCheck = sqlDb.exec(`PRAGMA table_info(whatsapp_settings)`);
            const settingsColumns = columnCheck[0]?.values || [];
            const hasWhatsappMode = settingsColumns.some(col => col[1] === 'whatsapp_mode');
            const hasModelLock = settingsColumns.some(col => col[1] === 'whatsapp_model_locked');
            if (!hasWhatsappMode) {
                sqlDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_mode TEXT DEFAULT ''`);
            }
            if (!hasModelLock) {
                sqlDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_model_locked TEXT DEFAULT 'false'`);
            }

            sqlDb.run(`INSERT OR IGNORE INTO whatsapp_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);
            sqlDb.run(`
                UPDATE whatsapp_settings
                SET whatsapp_mode = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedMode), hashedMasterKey]);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            //console.log('PaiperworkDB: saveWhatsappMode succeeded', { hashedMasterKey, normalizedMode });
            return true;
        } catch (error) {
            console.error('Error saving Whatsapp mode:', error);
            return false;
        }
    }

    static async saveWhatsappModelLock(hashedMasterKey, locked) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const normalizedLocked = String(locked).toLowerCase() === 'true' ? 'true' : 'false';
            const encryptedLocked = await this.encrypt(hashedMasterKey, normalizedLocked);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);

            const columnCheck = sqlDb.exec(`PRAGMA table_info(whatsapp_settings)`);
            const settingsColumns = columnCheck[0]?.values || [];
            const hasModelLock = settingsColumns.some(col => col[1] === 'whatsapp_model_locked');
            if (!hasModelLock) {
                sqlDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_model_locked TEXT DEFAULT 'false'`);
            }

            sqlDb.run(`INSERT OR IGNORE INTO whatsapp_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);
            sqlDb.run(`
                UPDATE whatsapp_settings
                SET whatsapp_model_locked = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedLocked), hashedMasterKey]);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving Whatsapp model lock:', error);
            return false;
        }
    }

    static async getWhatsappMode(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'whatsapp');
            if (!existingDb) return null;

            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);
            const row = sqlDb.exec(`SELECT whatsapp_mode FROM whatsapp_settings WHERE masterkey_hash = ? LIMIT 1`, [hashedMasterKey]);
            if (!row || !row[0] || !row[0].values || !row[0].values.length) {
                // Backward compatibility: migrate legacy mode from main DB if present.
                const legacyDbBytes = await this.getExistingDatabase(hashedMasterKey, 'main');
                if (!legacyDbBytes) {
                    return null;
                }

                const legacyDb = new this.SQL.Database(legacyDbBytes);
                const legacy = legacyDb.exec(`SELECT whatsapp_mode FROM user_settings WHERE masterkey_hash = ? LIMIT 1`, [hashedMasterKey]);
                if (!legacy || !legacy[0] || !legacy[0].values || !legacy[0].values.length) {
                    return null;
                }

                const legacyMode = legacy[0].values[0][0] || '';
                const normalized = legacyMode === 'personal' || legacyMode === 'bot' ? legacyMode : '';
                if (!normalized) {
                    return null;
                }

                await this.saveWhatsappMode(hashedMasterKey, normalized);
                return normalized;
            }

            const storedMode = row[0].values[0][0] || '';
            if (!storedMode) {
                return null;
            }

            try {
                const decryptedMode = await this.decrypt(hashedMasterKey, storedMode);
                const normalized = decryptedMode === 'personal' || decryptedMode === 'bot' ? decryptedMode : '';
                if (normalized) {
                    return normalized;
                }
            } catch (_e) {
                // Fall through to plaintext handling for backward compatibility.
            }

            const normalizedPlaintext = storedMode === 'personal' || storedMode === 'bot' ? storedMode : '';
            if (!normalizedPlaintext) {
                return null;
            }

            await this.saveWhatsappMode(hashedMasterKey, normalizedPlaintext);
            return normalizedPlaintext;
        } catch (error) {
            console.error('Error getting Whatsapp mode:', error);
            return null;
        }
    }

    static async getWhatsappModelLock(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'whatsapp');
            if (!existingDb) return false;

            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);

            const columnCheck = sqlDb.exec(`PRAGMA table_info(whatsapp_settings)`);
            const settingsColumns = columnCheck[0]?.values || [];
            const hasModelLock = settingsColumns.some(col => col[1] === 'whatsapp_model_locked');
            if (!hasModelLock) {
                sqlDb.run(`ALTER TABLE whatsapp_settings ADD COLUMN whatsapp_model_locked TEXT DEFAULT 'false'`);
                await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
                return false;
            }

            const row = sqlDb.exec(`SELECT whatsapp_model_locked FROM whatsapp_settings WHERE masterkey_hash = ? LIMIT 1`, [hashedMasterKey]);
            if (!row || !row[0] || !row[0].values || !row[0].values.length) {
                return false;
            }

            const storedLocked = String(row[0].values[0][0] || '').trim();
            if (!storedLocked) {
                return false;
            }

            try {
                const decryptedLocked = await this.decrypt(hashedMasterKey, storedLocked);
                return String(decryptedLocked || '').trim().toLowerCase() === 'true';
            } catch (_e) {
                const normalizedPlaintext = storedLocked.toLowerCase() === 'true';
                await this.saveWhatsappModelLock(hashedMasterKey, normalizedPlaintext);
                return normalizedPlaintext;
            }
        } catch (error) {
            console.error('Error getting Whatsapp model lock:', error);
            return false;
        }
    }

    static async clearWhatsappDeviceInfo(hashedMasterKey) {
        try {
            await this.initializeDatabase(hashedMasterKey);
            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) return false;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    whatsapp_device_meta TEXT,
                    whatsapp_mode TEXT DEFAULT '',
                    whatsapp_model_locked TEXT DEFAULT 'false'
                )
            `);
            sqlDb.run(`
                UPDATE whatsapp_settings
                SET whatsapp_device_meta = ''
                WHERE masterkey_hash = ?
            `, [hashedMasterKey]);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS devices (
                    device_id TEXT PRIMARY KEY,
                    display_name TEXT DEFAULT '',
                    jid TEXT DEFAULT '',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `);
            sqlDb.run(`DELETE FROM devices`);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error clearing Whatsapp device info:', error);
            return false;
        }
    }

    static async saveWhatsappSessionBundle(hashedMasterKey, deviceId, sessionBundle, metadata = {}) {
        try {
            if (!hashedMasterKey || !deviceId) return false;
            await this.initializeDatabase(hashedMasterKey);
            const normalizedDeviceId = String(deviceId).trim();
            const deviceLookup = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_session_bundle', normalizedDeviceId);

            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, true);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                    device_id TEXT PRIMARY KEY,
                    session_blob TEXT,
                    metadata_blob TEXT,
                    updated_at TEXT
                )
            `);

            const serializedBundle = typeof sessionBundle === 'string' ? sessionBundle : JSON.stringify(sessionBundle || {});
            const serializedMeta = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

            const encryptedBundle = await this.encrypt(hashedMasterKey, serializedBundle);
            const encryptedMeta = await this.encrypt(hashedMasterKey, serializedMeta);

            sqlDb.run(`
                INSERT OR REPLACE INTO whatsapp_session_bundles (device_id, session_blob, metadata_blob, updated_at)
                VALUES (?, ?, ?, ?)
            `, [deviceLookup, JSON.stringify(encryptedBundle), JSON.stringify(encryptedMeta), new Date().toISOString()]);

            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving WhatsApp session bundle:', error);
            return false;
        }
    }

    static async getWhatsappSessionBundle(hashedMasterKey, deviceId) {
        try {
            if (!hashedMasterKey || !deviceId) return null;
            await this.initializeDatabase(hashedMasterKey);
            const normalizedDeviceId = String(deviceId).trim();
            const deviceLookup = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_session_bundle', normalizedDeviceId);

            const existingDb = await this.getExistingDatabase(hashedMasterKey, 'whatsapp');
            if (!existingDb) return null;

            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                    device_id TEXT PRIMARY KEY,
                    session_blob TEXT,
                    metadata_blob TEXT,
                    updated_at TEXT
                )
            `);

            const row = sqlDb.exec(`
                SELECT session_blob, metadata_blob, updated_at
                FROM whatsapp_session_bundles
                WHERE device_id = ?
                LIMIT 1
            `, [deviceLookup]);
            if (!row || !row[0] || !row[0].values || !row[0].values.length) {
                return null;
            }

            const sessionBlob = row[0].values[0][0] || '';
            const metadataBlob = row[0].values[0][1] || '';
            const updatedAt = row[0].values[0][2] || '';
            if (!sessionBlob) return null;

            const sessionRaw = await this.decrypt(hashedMasterKey, sessionBlob);
            const metadataRaw = metadataBlob ? await this.decrypt(hashedMasterKey, metadataBlob) : '{}';

            let session = sessionRaw;
            let metadata = {};
            try { session = JSON.parse(sessionRaw); } catch (_e) {}
            try { metadata = JSON.parse(metadataRaw || '{}') || {}; } catch (_e) { metadata = {}; }

            return { deviceId: normalizedDeviceId, session, metadata, updatedAt };
        } catch (error) {
            console.error('Error getting WhatsApp session bundle:', error);
            return null;
        }
    }

    static async clearWhatsappSessionBundle(hashedMasterKey, deviceId) {
        try {
            if (!hashedMasterKey || !deviceId) return false;
            await this.initializeDatabase(hashedMasterKey);
            const normalizedDeviceId = String(deviceId).trim();
            const deviceLookup = await this.hashScopedLookupKey(hashedMasterKey, 'whatsapp_session_bundle', normalizedDeviceId);

            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) return true;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                    device_id TEXT PRIMARY KEY,
                    session_blob TEXT,
                    metadata_blob TEXT,
                    updated_at TEXT
                )
            `);
            sqlDb.run(`DELETE FROM whatsapp_session_bundles WHERE device_id = ?`, [deviceLookup]);
            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error clearing WhatsApp session bundle:', error);
            return false;
        }
    }


    static async clearAllWhatsappSessionBundles(hashedMasterKey) {
        try {
            if (!hashedMasterKey) return false;
            await this.initializeDatabase(hashedMasterKey);

            const sqlDb = await this.getWhatsappRoleSqlDatabase(hashedMasterKey, false);
            if (!sqlDb) return true;

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS whatsapp_session_bundles (
                    device_id TEXT PRIMARY KEY,
                    session_blob TEXT,
                    metadata_blob TEXT,
                    updated_at TEXT
                )
            `);
            sqlDb.run(`DELETE FROM whatsapp_session_bundles`);
            await this.saveWhatsappRoleSqlDatabase(sqlDb, hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error clearing all WhatsApp session bundles:', error);
            return false;
        }
    }

    static normalizeOllamaApiKey(rawKey) {
        const key = String(rawKey || '').trim();
        if (!key) return '';
        return key
            .replace(/^(?:Bearer\s+)+/i, '')
            .replace(/^['"]+|['"]+$/g, '')
            .trim();
    }

    static async getOllamaApiKey(hashedMasterKey) {
        try {
            if (this.ollamaApiKeyCache.has(hashedMasterKey)) {
                const cached = this.normalizeOllamaApiKey(this.ollamaApiKeyCache.get(hashedMasterKey) || '');
                // Return cached values only when non-empty. Empty cache entries can be transient
                // during startup, so force a re-read from storage in that case.
                if (cached) {
                    return cached;
                }
            }

            // Ensure DB init has run for this session before reading.
            await this.initializeDatabase(hashedMasterKey);

            let normalized = '';
            for (let attempt = 0; attempt < 3; attempt++) {
                const settings = await this.loadSettings(hashedMasterKey);
                normalized = this.normalizeOllamaApiKey(settings?.ollamaApiKey || '');
                if (normalized) {
                    this.ollamaApiKeyCache.set(hashedMasterKey, normalized);
                    return normalized;
                }
                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }

            // Do not persist empty key in cache to avoid sticky false negatives.
            this.ollamaApiKeyCache.delete(hashedMasterKey);
            return '';
        } catch (error) {
            console.error('Error loading Ollama API key:', error);
            return '';
        }
    }

    static async deleteOllamaApiKey(hashedMasterKey) {
        return this.saveOllamaApiKey(hashedMasterKey, '');
    }

    // Saves the selected visual model to the database and localStorage.
    static async saveVisualModel(hashedMasterKey, model) {
       //console.log('Save visual model operation started:', { hashedMasterKey, model: model || 'empty' });

        try {
            // Save to localStorage for quick access (secure when possible)
            try { await this.secureLocalStorageSet('selectedVisualModel', model); } catch (e) { localStorage.setItem('selectedVisualModel', model); }

            // Get SQL.js if not already loaded
            if (!this.SQL) {
               //console.log('Initializing SQL.js for saveVisualModel');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

           //console.log('Encrypting visual model with key:', hashedMasterKey);
            const encryptedModel = await this.encrypt(hashedMasterKey, model);

            // Get existing database - this already checks OPFS first if supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                console.error('No database found for masterkey:', hashedMasterKey);
                return false;
            }

            // Update the database
            const sqlDb = new this.SQL.Database(existingDb);

            // First check if visual_model column exists
            const columnCheck = sqlDb.exec(`PRAGMA table_info(user_settings)`);
            const hasVisualModelColumn = columnCheck[0]?.values.some(col => col[1] === 'visual_model');

            // Add the column if it doesn't exist
            if (!hasVisualModelColumn) {
               //console.log('Adding visual_model column to user_settings table');
                sqlDb.run(`ALTER TABLE user_settings ADD COLUMN visual_model TEXT`);
            }

            // Update the visual model
            sqlDb.run(`
                UPDATE user_settings
                SET visual_model = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedModel), hashedMasterKey]);

            // Export the database
            const dbExport = sqlDb.export();

            // Save to both OPFS and IndexedDB using our enhanced method
           //console.log('Saving updated database with visual model');
            await this.saveToStorage(dbExport, hashedMasterKey);

           //console.log('Visual model saved successfully for masterkey:', hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving visual model:', error);
            return false;
        }
    }

    // Saves the selected context size to the database and localStorage.
    static async saveContextSize(hashedMasterKey, contextSize) {
       //console.log('Save context size operation started:', { hashedMasterKey, contextSize });

        try {
            // Save to localStorage for quick access (secure when possible)
            try { await this.secureLocalStorageSet('selectedContextSize', contextSize); } catch (e) { localStorage.setItem('selectedContextSize', contextSize); }

            // Get SQL.js if not already loaded
            if (!this.SQL) {
               //console.log('Initializing SQL.js for saveContextSize');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

           //console.log('Encrypting context size with key:', hashedMasterKey);
            const encryptedContextSize = await this.encrypt(hashedMasterKey, contextSize);

            // Get existing database - this already checks OPFS first if supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                console.error('No database found for masterkey:', hashedMasterKey);
                return false;
            }

            // Update the database
            const sqlDb = new this.SQL.Database(existingDb);
            sqlDb.run(`
                UPDATE user_settings
                SET context_size = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedContextSize), hashedMasterKey]);

            // Export and save to both storage types
            const dbExport = sqlDb.export();

           //console.log('Saving updated database with context size');
            await this.saveToStorage(dbExport, hashedMasterKey);

           //console.log('Context size saved successfully for masterkey:', hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving context size:', error);
            return false;
        }
    }

    // Saves the system prompt to the database for a given master key hash.
    static async saveSystemPrompt(hashedMasterKey, promptText) {
       //console.log('Save system prompt operation started:', { hashedMasterKey, promptLength: promptText?.length });

        try {
            // Get SQL.js if not already loaded
            if (!this.SQL) {
               //console.log('Initializing SQL.js for saveSystemPrompt');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

           //console.log('Encrypting system prompt with key:', hashedMasterKey);
            const encryptedPrompt = await this.encrypt(hashedMasterKey, promptText);

            // Get existing database - this already checks OPFS first if supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            const sqlDb = existingDb
                ? new this.SQL.Database(existingDb)
                : new this.SQL.Database();

            sqlDb.run(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    masterkey_hash TEXT PRIMARY KEY,
                    system_prompt TEXT,
                    model TEXT,
                    context_size TEXT,
                    insights_enabled TEXT,
                    visual_model TEXT,
                    model_provider TEXT,
                    ollama_api_key TEXT
                )
            `);
            sqlDb.run(`INSERT OR IGNORE INTO user_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);

            sqlDb.run(`
                UPDATE user_settings
                SET system_prompt = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedPrompt), hashedMasterKey]);

            // Export the database
            const dbExport = sqlDb.export();

            // Save to both OPFS and IndexedDB using our enhanced method
           //console.log('Saving updated database with system prompt');
            await this.saveToStorage(dbExport, hashedMasterKey);

            // Keep prompt cache coherent across send-time prompt builds.
            if (window.OllamaAPI && typeof window.OllamaAPI.notifySystemPromptChanged === 'function') {
                window.OllamaAPI.notifySystemPromptChanged(hashedMasterKey);
            }

            // Verify persistence and retry once if the value did not persist cleanly.
            try {
                const loaded = await this.loadSettings(hashedMasterKey);
                if (String(loaded?.systemPrompt || '') !== String(promptText || '')) {
                    const retryDb = await this.getExistingDatabase(hashedMasterKey);
                    if (retryDb) {
                        const retrySqlDb = new this.SQL.Database(retryDb);
                        retrySqlDb.run(`INSERT OR IGNORE INTO user_settings (masterkey_hash) VALUES (?)`, [hashedMasterKey]);
                        retrySqlDb.run(`UPDATE user_settings SET system_prompt = ? WHERE masterkey_hash = ?`, [JSON.stringify(encryptedPrompt), hashedMasterKey]);
                        await this.saveToStorage(retrySqlDb.export(), hashedMasterKey);
                    }
                }
            } catch (verifyError) {
               //console.log('System prompt verification retry failed:', verifyError);
            }

           //console.log('System prompt saved successfully for masterkey:', hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving system prompt:', error);
            return false;
        }
    }

    // Saves the insights enabled setting to the database.
    static async saveInsightsEnabled(hashedMasterKey, enabled) {
       //console.log('Saving insights preference:', enabled);

        try {
            // Get SQL.js if not already loaded
            if (!this.SQL) {
               //console.log('Initializing SQL.js for saveInsightsEnabled');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get existing database - this already checks OPFS first if supported
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                console.error('No database found for masterkey:', hashedMasterKey);
                return false;
            }

            // Create database instance
            const db = new this.SQL.Database(existingDb);

           //console.log('Encrypting insights value:', enabled.toString());
            const encryptedValue = await this.encrypt(hashedMasterKey, enabled.toString());
           //console.log('Encrypted insights structure:', encryptedValue);

            const jsonString = JSON.stringify(encryptedValue);
           //console.log('Stringified encrypted value:', jsonString);

            // Ensure there is a settings row for this master key before updating.
            db.run(`
                INSERT OR IGNORE INTO user_settings (masterkey_hash, insights_enabled)
                VALUES (?, ?)
            `, [hashedMasterKey, jsonString]);

            db.run(`
                UPDATE user_settings 
                SET insights_enabled = ? 
                WHERE masterkey_hash = ?
            `, [jsonString, hashedMasterKey]);

            // Export the database
            const dbExport = db.export();

            // Save to both OPFS and IndexedDB using our enhanced method
           //console.log('Saving updated database with insights settings');
            await this.saveToStorage(dbExport, hashedMasterKey);

           //console.log('Insights preference saved and encrypted successfully');
            return true;
        } catch (error) {
            console.error('Error saving insights enabled setting:', error);
            return false;
        }
    }

    // Stores a conversation pair (user and assistant messages) in the database.
    static async storeConversationOnly(hashedMasterKey, userMessage, aiMessage, forceNewGroup = false, targetGroup = null, messageIds = null) {
       //console.log("Storing conversation with OPFS/IndexedDB compatibility");

        try {
            // Get database using our method that already handles OPFS/IndexedDB properly
            const db = await this.getDatabase(hashedMasterKey);
            const attachmentDb = await this.getDatabase(hashedMasterKey, 'images', true);
            if (!db) {
                console.error("Failed to get database for storing conversation");
                return false;
            }

            // Make sure the conversation_group column exists
            try {
                const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
                const hasGroupColumn = columnsResult[0]?.values.some(col => col[1] === 'conversation_group');

                if (!hasGroupColumn) {
                   //console.log(`Adding missing conversation_group column to conversations_${hashedMasterKey}`);
                    db.exec(`ALTER TABLE conversations_${hashedMasterKey} ADD COLUMN conversation_group INTEGER DEFAULT 1`);
                }
            } catch (error) {
                console.error('Error checking for conversation_group column:', error);
            }

            try {
                await this.ensureConversationMessageIdColumn(db, hashedMasterKey);
            } catch (error) {
                console.error('Error checking for message_id column:', error);
            }

            // Determine conversation group (existing code)
            let conversationGroup = 1; // Default to group 1
            let previousMaxGroup = 0;
            const rawUserPreview = typeof userMessage === 'string'
                ? userMessage
                : (userMessage && typeof userMessage === 'object' ? String(userMessage.text || '') : '');
            const normalizedUserPreview = String(rawUserPreview || '').replace(/<[^>]*>/g, '').trim().slice(0, 200);
            const isWechatConversationDebug = normalizedUserPreview.startsWith('WeChat account conversation (')
                || normalizedUserPreview.startsWith('Conversation started by Wechat Paiperwork Bot')
                || normalizedUserPreview.startsWith('Personal wechat conversation for ');

            if (forceNewGroup) {
                // Get the max group ID and increment
                const result = db.exec(`
                    SELECT MAX(conversation_group) as max_group
                    FROM conversations_${hashedMasterKey}
                `);

                if (result.length && result[0].values.length && result[0].values[0][0] !== null) {
                    previousMaxGroup = result[0].values[0][0];
                    conversationGroup = previousMaxGroup + 1;
                }
                window.currentConversationGroup = conversationGroup;
               //console.log(`PaiperworkDB: Updated currentConversationGroup = ${conversationGroup} for new chat`);
               //console.log(`Creating new conversation group: ${conversationGroup}`);
            } else if (targetGroup !== null) {
                // Use the specific target group if provided
                conversationGroup = targetGroup;
               //console.log(`Using specified target conversation group: ${conversationGroup}`);
            } else {
                // Get the most recent conversation group
                const result = db.exec(`
                    SELECT conversation_group 
                    FROM conversations_${hashedMasterKey}
                    ORDER BY ROWID DESC LIMIT 1
                `);

                if (result.length && result[0].values.length && result[0].values[0][0] !== null) {
                    conversationGroup = result[0].values[0][0];
                }
               //console.log(`Using existing conversation group: ${conversationGroup}`);
            }

            if (isWechatConversationDebug) {
                console.info('[PaiperworkDB][conversation-debug] storeConversationOnly:group-selected', {
                    forceNewGroup: !!forceNewGroup,
                    targetGroup,
                    previousMaxGroup,
                    conversationGroup,
                    userPreview: normalizedUserPreview,
                    messageIds: {
                        userMessageId: messageIds?.userMessageId || null,
                        assistantMessageId: messageIds?.assistantMessageId || null
                    }
                });
            }

            // Store the AI message exactly as is - no pre-processing
            // This ensures HTML structure and formatting are preserved exactly
            let processedAiMessage = aiMessage; // Store the HTML exactly as received
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(aiMessage, 'text/html');

                // Find all code blocks
                const codeBlocks = doc.querySelectorAll('.code-block code');

                codeBlocks.forEach(codeElement => {
                    // data-saved-code is the single persisted copy of the code.
                    if (!codeElement.hasAttribute('data-saved-code') && codeElement.textContent.trim()) {
                        const formattedCode = codeElement.textContent;
                        codeElement.setAttribute('data-saved-code', formattedCode);
                    }
                    // Drop the legacy duplicated copies (data-clean-code attribute
                    // and SAVED_CODE_BACKUP comment) so stored HTML keeps one copy.
                    codeElement.removeAttribute('data-clean-code');
                    Array.from(codeElement.childNodes).forEach(node => {
                        if (node.nodeType === Node.COMMENT_NODE && String(node.nodeValue || '').includes('SAVED_CODE_BACKUP:')) {
                            node.remove();
                        }
                    });
                });

                const links = doc.querySelectorAll('a');
                links.forEach(link => {
                    // Make sure links have required attributes
                    if (link.getAttribute('href')) {
                        // Ensure target and rel attributes are set
                        if (!link.getAttribute('target')) {
                            link.setAttribute('target', '_blank');
                        }
                        if (!link.getAttribute('rel')) {
                            link.setAttribute('rel', 'noopener noreferrer');
                        }
                    }
                });

                // Convert any remaining markdown links to HTML before storage
                const bodyHTML = doc.body.innerHTML;
                const processedHTML = this.processMarkdownLinksInHtml(bodyHTML);

                // Parse again to get the final HTML with all links properly processed
                const finalDoc = parser.parseFromString(processedHTML, 'text/html');
                processedAiMessage = finalDoc.body.innerHTML;

            } catch (error) {
                console.error("Error processing code blocks for storage:", error);
                // Fall back to original HTML if processing fails
            }

            // Handle user message processing with image data
            const isUserMessageObject = typeof userMessage === 'object' && userMessage !== null;
            let processedUserMessage = userMessage;
            let imageData = [];

            await this.ensureConversationAttachmentTable(attachmentDb, hashedMasterKey);

            if (isUserMessageObject) {
                // If userMessage is already an object with text and images
               //console.log('Processing user message with images:', userMessage);
                processedUserMessage = userMessage.text || '';
                imageData = userMessage.images || [];
            } else {
                // Check for saved message images
                if (window.currentMessageImages && window.currentMessageImages.length > 0) {
                    imageData = window.currentMessageImages;
                }
                // If no saved images, check for images in global variables as fallback
                else if (window.selectedImages && window.selectedImages.length > 0) {
                    imageData = window.selectedImages.map(img => ({ src: img }));
                } else if (window.selectedImage) {
                    imageData = [{
                        src: window.selectedImage
                    }];
                }

                // If we have images, create a structured object
                if (imageData.length > 0) {
                    imageData = await this.serializeConversationImageRefs(attachmentDb, hashedMasterKey, imageData, conversationGroup);

                    processedUserMessage = {
                        text: processedUserMessage,
                        images: imageData
                    };

                    // Convert to JSON string for storage
                    processedUserMessage = JSON.stringify(processedUserMessage);
                }
            }

            if (isUserMessageObject && imageData.length > 0) {
                imageData = await this.serializeConversationImageRefs(attachmentDb, hashedMasterKey, imageData, conversationGroup);
                processedUserMessage = JSON.stringify({
                    text: processedUserMessage,
                    images: imageData
                });
            }

            // Use separate timestamps with sufficient difference for proper ordering
            const baseTime = new Date();
            const userMessageId = String(messageIds?.userMessageId || crypto.randomUUID());
            const assistantMessageId = String(messageIds?.assistantMessageId || crypto.randomUUID());

            // Store user message with initial timestamp
            const userTimestamp = baseTime.toISOString();
            const encryptedUserMessage = await this.encrypt(
                hashedMasterKey,
                processedUserMessage
            );
            const encryptedUserRole = await this.encrypt(hashedMasterKey, "user");
            const encryptedUserTimestamp = await this.encrypt(
                hashedMasterKey,
                userTimestamp
            );

            // Insert user message with conversation group
            db.run(
                `INSERT INTO conversations_${hashedMasterKey}
                (message_id, conversation, timestamp, role, conversation_group)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    userMessageId,
                    JSON.stringify(encryptedUserMessage),
                    JSON.stringify(encryptedUserTimestamp),
                    JSON.stringify(encryptedUserRole),
                    conversationGroup
                ]
            );

            // Store AI message with timestamp + 1 SECOND to ensure proper ordering
            const aiTimestamp = new Date(baseTime.getTime() + 1000).toISOString();
            const encryptedAiMessage = await this.encrypt(
                hashedMasterKey,
                processedAiMessage
            );
            const encryptedAiRole = await this.encrypt(hashedMasterKey, "assistant");
            const encryptedAiTimestamp = await this.encrypt(
                hashedMasterKey,
                aiTimestamp
            );

            // Insert AI message with the same conversation group
            db.run(
                `INSERT INTO conversations_${hashedMasterKey}
                (message_id, conversation, timestamp, role, conversation_group)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    assistantMessageId,
                    JSON.stringify(encryptedAiMessage),
                    JSON.stringify(encryptedAiTimestamp),
                    JSON.stringify(encryptedAiRole),
                    conversationGroup
                ]
            );

            // Clear the saved message images after storing
            if (window.currentMessageImages) {
                window.currentMessageImages = [];
            }

            // Save to both OPFS and IndexedDB using our enhanced saveToStorage method
           //console.log(`Saving conversation to storage with group ${conversationGroup}`);
            await this.saveToStorage(db.export(), hashedMasterKey);
            if (imageData.length > 0) {
                await this.saveToStorage(attachmentDb.export(), hashedMasterKey, 'images');
            }
            if (isWechatConversationDebug) {
                console.info('[PaiperworkDB][conversation-debug] storeConversationOnly:saved', {
                    conversationGroup,
                    userMessageId,
                    assistantMessageId,
                    userPreview: normalizedUserPreview
                });
            }
            return {
                success: true,
                userMessageId,
                assistantMessageId,
                conversationGroup
            };
        } catch (error) {
            console.error('Error storing conversation:', error);
            return false;
        }
    }

    // One-time migration: strips legacy duplicated code copies
    // (data-clean-code attributes + SAVED_CODE_BACKUP comment nodes) from
    // previously stored assistant messages, keeping ONLY the canonical
    // data-saved-code attribute. Runs once per database (guarded by a
    // localStorage flag keyed on the master key hash) and is idempotent.
    static async cleanupLegacyCodeDuplicates(hashedMasterKey) {
        if (!hashedMasterKey) return false;

        const flagKey = `paiperwork_codestorage_cleanup_v1_${hashedMasterKey}`;
        try {
            if (localStorage.getItem(flagKey) === '1') {
                return true; // already cleaned
            }
        } catch (_guardErr) {
            // If storage is unavailable, just run the pass (it is idempotent).
        }

        try {
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
                this._markCodeCleanupDone(flagKey);
                return false;
            }

            const tableName = `conversations_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`, [tableName]);
            if (!tableCheck[0]?.values?.length) {
                this._markCodeCleanupDone(flagKey);
                return true;
            }

            const rows = db.exec(`SELECT rowid, conversation, role FROM ${tableName}`);
            const values = rows[0]?.values;
            if (!values || values.length === 0) {
                this._markCodeCleanupDone(flagKey);
                return true;
            }

            let changed = false;
            for (const row of values) {
                const rowid = row[0];
                const conversationPayload = row[1];
                const rolePayload = row[2];
                try {
                    const decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(conversationPayload));
                    if (typeof decryptedMessage !== 'string' || !decryptedMessage) continue;

                    // Only assistant messages carry the code-block HTML with the legacy copies.
                    let decryptedRole = '';
                    if (rolePayload) {
                        try {
                            decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(rolePayload));
                        } catch (_roleErr) { /* ignore */ }
                    }
                    if (decryptedRole !== 'assistant') continue;

                    const hasLegacy = decryptedMessage.includes('data-clean-code')
                        || decryptedMessage.includes('SAVED_CODE_BACKUP:');
                    if (!hasLegacy) continue;

                    // Strip the legacy duplicated copies, keep data-saved-code.
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(decryptedMessage, 'text/html');
                    let cleaned = false;
                    doc.querySelectorAll('code[data-clean-code]').forEach(el => {
                        el.removeAttribute('data-clean-code');
                        cleaned = true;
                    });
                    doc.querySelectorAll('code').forEach(el => {
                        Array.from(el.childNodes).forEach(node => {
                            if (node.nodeType === Node.COMMENT_NODE && String(node.nodeValue || '').includes('SAVED_CODE_BACKUP:')) {
                                node.remove();
                                cleaned = true;
                            }
                        });
                    });
                    if (!cleaned) continue;

                    const cleanedHtml = doc.body.innerHTML;
                    if (cleanedHtml === decryptedMessage) continue;

                    const reEncrypted = await this.encrypt(hashedMasterKey, cleanedHtml);
                    db.run(`UPDATE ${tableName} SET conversation = ? WHERE rowid = ?`, [JSON.stringify(reEncrypted), rowid]);
                    changed = true;
                } catch (rowErr) {
                    // Skip rows that fail to decrypt/parse without aborting the pass.
                    console.warn('[PaiperworkDB] cleanupLegacyCodeDuplicates: skipping row', rowErr);
                }
            }

            if (changed) {
                await this.saveToStorage(db.export(), hashedMasterKey);
            }
            this._markCodeCleanupDone(flagKey);
            return true;
        } catch (error) {
            console.error('[PaiperworkDB] cleanupLegacyCodeDuplicates failed:', error);
            return false;
        }
    }

    static _markCodeCleanupDone(flagKey) {
        try {
            localStorage.setItem(flagKey, '1');
        } catch (_err) {
            // Non-fatal; the pass is idempotent and may run again next open.
        }
    }

    // Loads the entire conversation history for a given master key hash.
    static async loadConversationHistory(hashedMasterKey, processForDisplay = true) {
       //console.log('Loading conversation history for masterkey:', hashedMasterKey);

        const result = {
            conversations: null,
            error: null
        };

        try {
            // Get the database using our unified method that handles OPFS/IndexedDB properly
            const db = await this.getDatabase(hashedMasterKey);
            const attachmentDb = await this.getDatabase(hashedMasterKey, 'images');
            if (!db) {
               //console.log('No database found when loading conversation history');
                return result;
            }

            // First check if the conversation_group column exists
            try {
                const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
                const hasGroupColumn = columnsResult[0]?.values.some(col => col[1] === 'conversation_group');

                if (!hasGroupColumn) {
                   //console.log(`Adding missing conversation_group column to conversations_${hashedMasterKey}`);
                    db.exec(`ALTER TABLE conversations_${hashedMasterKey} ADD COLUMN conversation_group INTEGER DEFAULT 1`);

                    // Save the updated schema to both OPFS and IndexedDB
                    await this.saveToStorage(db.export(), hashedMasterKey);
                   //console.log('Updated schema saved to storage');
                }
            } catch (error) {
                console.warn('Error checking for conversation_group column:', error);
                // Continue execution as this isn't critical
            }

            const schemaChanged = await this.ensureConversationMessageIdColumn(db, hashedMasterKey);
            if (schemaChanged) {
                await this.saveToStorage(db.export(), hashedMasterKey);
            }

            // IMPORTANT: Make sure we explicitly select conversation_group
            const queryResult = db.exec(`
                SELECT message_id, conversation, timestamp, role, conversation_group
                FROM conversations_${hashedMasterKey}
                ORDER BY timestamp ASC
            `);

            if (!queryResult[0]?.values) {
               //console.log('No conversations found for masterkey:', hashedMasterKey);
                return result;
            }

            // Log the group information for debugging
            const groupCounts = {};
            queryResult[0].values.forEach(row => {
                const group = row[3] || 1; // conversation_group is at index 3
                groupCounts[group] = (groupCounts[group] || 0) + 1;
            });
           //console.log('Found conversations with these groups:', groupCounts);

            const conversations = [];

            // Process all messages, now with conversation_group
            for (const row of queryResult[0].values) {
                const messageId = row[0];
                const conversation = row[1];
                const timestamp = row[2];
                const role = row[3];
                const group = row[4] || 1; // Default to 1 if null

                const decryptedMessage = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(conversation)
                );
                const decryptedRole = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(role)
                );
                const decryptedTimestamp = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(timestamp)
                );

                // Add the conversation group to each message object
                const conversationGroup = group;

                // Check if the message contains image data (in JSON format)
                let processedMessage = decryptedMessage;
                let images = [];

                if (decryptedRole === "user") {
                    try {
                        // Check if the message is a JSON object with text and images
                        const parsedMessage = JSON.parse(decryptedMessage);
                        if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text !== undefined) {
                            processedMessage = parsedMessage.text;
                            images = await this.resolveConversationImageData(attachmentDb, hashedMasterKey, parsedMessage.images || []);
                        }
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                }

                // Process message for display if needed
                if (processForDisplay && decryptedRole === "assistant") {
                    processedMessage = this.processMarkdownLinksInHtml(processedMessage);

                    // Add copy container if needed
                    if (!processedMessage.includes("copy-response-container")) {
                        // Use a safe method to add UI elements without modifying content
                        // First, check if the message already has an ai-response-container
                        if (processedMessage.includes('class="ai-response-container"') ||
                            processedMessage.includes("class='ai-response-container'")) {

                            // Create a DOM parser to safely add elements
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(processedMessage, "text/html");

                            // Add copy link container
                            const copyContainer = document.createElement("div");
                            copyContainer.className = "copy-response-container";
                            copyContainer.style.cssText = `
                                text-align: right;
                                margin-top: 0.5rem;
                                opacity: 0.7;
                                padding-top: 0.5rem; 
                                border-top: 1px solid var(--border-color);
                                transition: opacity 0.2s;
                            `;

                            // Add buttons (regenerate, delete, copy)
                            const regenerateButton = document.createElement("a");
                            regenerateButton.href = "#";
                            regenerateButton.className = "regenerate-message";
                            regenerateButton.textContent = Lang.get("regenerateMessage") || "Regenerate";
                            regenerateButton.style.cssText = `
                                color: inherit;
                                text-decoration: none;
                                cursor: pointer;
                                margin-right: 10px;
                            `;
                            regenerateButton.setAttribute(
                                "onclick",
                                'event.preventDefault(); window.chat.regenerateMessage(this.closest(".assistant-message")); return false;'
                            );

                            const deleteButton = document.createElement("a");
                            deleteButton.href = "#";
                            deleteButton.className = "delete-message-pair";
                            deleteButton.textContent = Lang.get("deleteMessagePair") || "Delete this message pair";
                            deleteButton.style.cssText = `
                                color: rgb(239, 68, 68);
                                text-decoration: none;
                                cursor: pointer;
                                margin-right: 10px;
                            `;
                            deleteButton.setAttribute(
                                "onclick",
                                'event.preventDefault(); window.chat.deleteConversationPair(this.closest(".assistant-message")); return false;'
                            );

                            const copyLink = document.createElement("a");
                            copyLink.href = "#";
                            copyLink.className = "copy-btn";
                            copyLink.textContent = Lang.get("copy") || "Copy";
                            copyLink.style.cssText = `
                                color: inherit;
                                text-decoration: none;
                                cursor: pointer;
                            `;
                            copyLink.setAttribute(
                                "onclick",
                                ` event.preventDefault(); const responseDiv = this.closest('.assistant-message').querySelector('.ai-response-container'); if (!responseDiv) { console.error('Cannot find response container for copying'); return false; } // Method 1: Try using streamProcessor if available if (responseDiv.streamProcessor && typeof responseDiv.streamProcessor.copyFullResponse === 'function') { responseDiv.streamProcessor.copyFullResponse(); } // Method 2: Fallback if no streamProcessor - copy the HTML without action buttons else { // Create a clone of the content to avoid modifying the original const tempDiv = document.createElement('div'); tempDiv.appendChild(responseDiv.cloneNode(true)); // Remove any action buttons from the copy const actionButtons = tempDiv.querySelectorAll('.message-actions, .copy-response-container'); actionButtons.forEach(el => el.remove()); // Also remove any cancel notes const cancelNotes = tempDiv.querySelectorAll('.cancel-note'); cancelNotes.forEach(el => el.remove()); // Get clean text content const cleanText = tempDiv.textContent.trim(); // Copy to clipboard navigator.clipboard.writeText(cleanText) .then(() => { // Show copied confirmation this.textContent = 'Copied!'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }) .catch(err => { console.error('Failed to copy text:', err); this.textContent = 'Error'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }); } return false; `
                            );

                            // Assemble all elements
                            copyContainer.appendChild(regenerateButton);
                            copyContainer.appendChild(deleteButton);
                            copyContainer.appendChild(copyLink);

                            // Find the AI response container and add copy container
                            const container = doc.querySelector(".ai-response-container");
                            if (container) {
                                container.appendChild(copyContainer);
                                processedMessage = doc.body.innerHTML;
                            }
                        } else {
                            // If no container, wrap the message but preserve its exact content
                            const copyContainer = `<div class="copy-response-container" style="text-align: right; margin-top: 0.5rem; opacity: 0.7; padding-top: 0.5rem; border-top: 1px solid var(--border-color); transition: opacity 0.2s;">
                                <a href="#" class="regenerate-message" style="color: inherit; text-decoration: none; cursor: pointer; margin-right: 10px;" onclick="event.preventDefault(); window.chat.regenerateMessage(this.closest('.assistant-message')); return false;">${Lang.get("regenerateMessage") || "Regenerate"}</a>
                                <a href="#" class="delete-message-pair" style="color: rgb(239, 68, 68); text-decoration: none; cursor: pointer; margin-right: 10px;" onclick="event.preventDefault(); window.chat.deleteConversationPair(this.closest('.assistant-message')); return false;">${Lang.get("deleteMessagePair") || "Delete this message pair"}</a>
                                <a href="#" class="copy-btn" style="color: inherit; text-decoration: none; cursor: pointer;" onclick="event.preventDefault(); const responseDiv = this.closest('.assistant-message').querySelector('.ai-response-container'); if (!responseDiv) { console.error('Cannot find response container for copying'); return false; } if (responseDiv.streamProcessor && typeof responseDiv.streamProcessor.copyFullResponse === 'function') { responseDiv.streamProcessor.copyFullResponse(); } else { const tempDiv = document.createElement('div'); tempDiv.appendChild(responseDiv.cloneNode(true)); const actionButtons = tempDiv.querySelectorAll('.message-actions, .copy-response-container'); actionButtons.forEach(el => el.remove()); const cancelNotes = tempDiv.querySelectorAll('.cancel-note'); cancelNotes.forEach(el => el.remove()); const cleanText = tempDiv.textContent.trim(); navigator.clipboard.writeText(cleanText).then(() => { this.textContent = 'Copied!'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }).catch(err => { console.error('Failed to copy text:', err); this.textContent = 'Error'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }); } return false;">${Lang.get("copy") || "Copy"}</a>
                            </div>`;

                            processedMessage = `<div class="ai-response-container">${processedMessage}${copyContainer}</div>`;
                        }
                    }
                }

                conversations.push({
                    message_id: messageId,
                    message: processedMessage,
                    timestamp: decryptedTimestamp,
                    role: decryptedRole,
                    isContainer: decryptedRole === "assistant",
                    conversation_group: conversationGroup,
                    images: images
                });
            }

            // Log a sample of the conversation data to verify groups
            if (conversations.length > 0) {
               //console.log(`Successfully loaded ${conversations.length} messages`);
            }

            // Ensure stable sort by timestamp to preserve order
            conversations.sort((a, b) => {
                if (a.timestamp < b.timestamp) return -1;
                if (a.timestamp > b.timestamp) return 1;
                return a.role === "user" ? -1 : 1;
            });

            // Add CSS for hover effect if not already present
            if (!document.getElementById("message-delete-styles")) {
                const style = document.createElement("style");
                style.id = "message-delete-styles";
                style.textContent = `
                .copy-response-container {
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .assistant-message:hover .copy-response-container {
                    opacity: 1;
                }
                .delete-message-pair:hover {
                    text-decoration: underline;
                }
                @keyframes fade-out {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
                .deleting {
                    pointer-events: none;
                }
            `;
                document.head.appendChild(style);
            }

            // Handle code block translations
            setTimeout(() => this.applyTranslationsToCodeBlocks(), 200);

            result.conversations = conversations;
            return result;
        } catch (error) {
            console.error('PaiperworkDB: Error loading conversation history:', error);
            result.error = error;
            return result;
        }
    }

    // Loads all conversations for a specific conversation group.
    static async loadConversationsByGroup(hashedMasterKey, groupId) {
       //console.log(`Loading conversation group ${groupId} for masterkey: ${hashedMasterKey}`);

        if (!hashedMasterKey || !groupId) {
            console.error('Missing required parameters for loadConversationsByGroup');
            return { conversations: [], error: 'Missing parameters' };
        }

        try {
            // Get the database using our unified method that handles OPFS/IndexedDB properly
            const db = await this.getDatabase(hashedMasterKey);
            const attachmentDb = await this.getDatabase(hashedMasterKey, 'images');
            if (!db) {
               //console.log(`No database found for masterkey when loading group ${groupId}`);
                return { conversations: [] };
            }

            // First check if the conversation_group column exists
            try {
                const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
                const hasGroupColumn = columnsResult[0]?.values.some(col => col[1] === 'conversation_group');

                if (!hasGroupColumn) {
                   //console.log(`Adding missing conversation_group column to conversations_${hashedMasterKey}`);
                    db.exec(`ALTER TABLE conversations_${hashedMasterKey} ADD COLUMN conversation_group INTEGER DEFAULT 1`);

                    // Save the updated schema to both OPFS and IndexedDB
                    await this.saveToStorage(db.export(), hashedMasterKey);
                   //console.log('Updated schema saved to storage');
                }
            } catch (error) {
                console.warn('Error checking for conversation_group column:', error);
                // Continue execution as this isn't critical
            }

            const schemaChanged = await this.ensureConversationMessageIdColumn(db, hashedMasterKey);
            if (schemaChanged) {
                await this.saveToStorage(db.export(), hashedMasterKey);
            }

            // Query for conversations in the specified group
            const queryResult = db.exec(`
                SELECT message_id, conversation, timestamp, role, conversation_group
                FROM conversations_${hashedMasterKey}
                WHERE conversation_group = ?
                ORDER BY timestamp ASC
            `, [groupId]);

            if (!queryResult[0]?.values) {
               //console.log(`No conversations found for group ${groupId}`);
                return { conversations: [] };
            }

            const conversations = [];

            // Process all messages in the group
            for (const row of queryResult[0].values) {
                const messageId = row[0];
                const conversation = row[1];
                const timestamp = row[2];
                const role = row[3];

                const decryptedMessage = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(conversation)
                );
                const decryptedRole = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(role)
                );
                const decryptedTimestamp = await this.decrypt(
                    hashedMasterKey,
                    JSON.parse(timestamp)
                );

                // Check if the message contains image data (in JSON format)
                let processedMessage = decryptedMessage;
                let images = [];

                if (decryptedRole === "user") {
                    try {
                        // Check if the message is a JSON object with text and images
                        const parsedMessage = JSON.parse(decryptedMessage);
                        if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text !== undefined) {
                            processedMessage = parsedMessage.text;
                            images = await this.resolveConversationImageData(attachmentDb, hashedMasterKey, parsedMessage.images || []);
                        }
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                } else if (decryptedRole === "assistant") {
                    // Process message for display
                    processedMessage = this.processMarkdownLinksInHtml(processedMessage);
                }

                conversations.push({
                    message_id: messageId,
                    message: processedMessage,
                    timestamp: decryptedTimestamp,
                    role: decryptedRole,
                    isContainer: decryptedRole === "assistant",
                    conversation_group: groupId,
                    images: images
                });
            }

            // Ensure stable sort by timestamp to preserve order
            conversations.sort((a, b) => {
                if (a.timestamp < b.timestamp) return -1;
                if (a.timestamp > b.timestamp) return 1;
                return a.role === "user" ? -1 : 1;
            });

            return { conversations };
        } catch (error) {
            console.error('Error loading conversations by group:', error);
            return { conversations: [], error };
        }
    }

    static async findConversationGroupByInitialUserText(hashedMasterKey, expectedText, options = null) {
        if (!hashedMasterKey || !expectedText) {
            return 0;
        }

        try {
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
                return 0;
            }

            const queryResult = db.exec(`
                SELECT conversation_group, conversation, role, timestamp
                FROM conversations_${hashedMasterKey}
                ORDER BY timestamp ASC
            `);

            if (!queryResult[0]?.values || !queryResult[0].values.length) {
                return 0;
            }

            const expected = String(expectedText || '').replace(/<[^>]*>/g, '').trim();
            const normalizedPhone = String(options?.normalizedPhone || options?.normalizedAccount || '').replace(/@.*$/g, '').trim();
            const exactCandidates = new Set([expected].filter(Boolean));
            const seenGroups = new Set();
            const debugCandidates = [];

            for (const row of queryResult[0].values) {
                const groupId = Number(row[0] || 0);
                if (!groupId || seenGroups.has(groupId)) {
                    continue;
                }

                const encryptedConversation = row[1];
                const encryptedRole = row[2];
                if (!encryptedConversation || !encryptedRole) {
                    continue;
                }

                let decryptedRole = '';
                let decryptedMessage = '';
                try {
                    decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(encryptedRole));
                    decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(encryptedConversation));
                } catch (_error) {
                    continue;
                }

                if (decryptedRole !== 'user') {
                    continue;
                }

                seenGroups.add(groupId);

                let normalizedMessage = String(decryptedMessage || '').trim();
                try {
                    const parsedMessage = JSON.parse(normalizedMessage);
                    if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text !== undefined) {
                        normalizedMessage = String(parsedMessage.text || '').trim();
                    }
                } catch (_error) {
                    // Keep raw plaintext messages as-is.
                }

                normalizedMessage = normalizedMessage.replace(/<[^>]*>/g, '').trim();
                if (!normalizedMessage) {
                    continue;
                }

                debugCandidates.push({
                    groupId,
                    normalizedMessage: normalizedMessage.slice(0, 180),
                    normalizedPhone,
                    exactMatch: exactCandidates.has(normalizedMessage),
                    phoneHeuristicMatch: !!(
                        normalizedPhone
                        && normalizedMessage.includes(`(${normalizedPhone})`)
                        && (
                            normalizedMessage.startsWith('Conversation started by ')
                            || normalizedMessage.startsWith('Personal WhatsApp conversation for ')
                            || normalizedMessage.startsWith('Personal wechat conversation for ')
                            || (normalizedMessage.startsWith('Group conversation') && normalizedMessage.includes(`participant ${normalizedPhone}`))
                        )
                    )
                });

                if (exactCandidates.has(normalizedMessage)) {

                    return groupId;
                }

                if (
                    normalizedPhone
                    && normalizedMessage.includes(`(${normalizedPhone})`)
                    && (
                        normalizedMessage.startsWith('Conversation started by ')
                        || normalizedMessage.startsWith('Personal WhatsApp conversation for ')
                        || normalizedMessage.startsWith('Personal wechat conversation for ')
                        || (normalizedMessage.startsWith('Group conversation') && normalizedMessage.includes(`participant ${normalizedPhone}`))
                    )
                ) {
                    return groupId;
                }
            }

            return 0;
        } catch (error) {
            console.error('Error finding conversation group by initial user text:', error);
            return 0;
        }
    }

    static async deleteConversationPairByIds(hashedMasterKey, userMessageId = null, assistantMessageId = null, options = null) {
        try {
            const db = await this.getDatabase(hashedMasterKey);
            const attachmentDb = await this.getDatabase(hashedMasterKey, 'images', true);
            if (!db) {
                throw new Error('Database not found');
            }

            await this.ensureConversationMessageIdColumn(db, hashedMasterKey);

            const requestedConversationGroup = Number.isFinite(Number(options?.conversationGroup))
                ? Number(options.conversationGroup)
                : null;

            const queryResult = db.exec(`
                SELECT rowid, message_id, conversation, role, timestamp, conversation_group
                FROM conversations_${hashedMasterKey}
                ORDER BY timestamp ASC
            `);

            if (!queryResult[0]?.values) {
                return false;
            }

            const orderedMessages = [];
            const userMessages = [];

            for (const [rowid, messageId, encryptedConversation, encryptedRole, encryptedTimestamp, conversationGroup] of queryResult[0].values) {
                const decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(encryptedRole));
                const decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(encryptedConversation));
                const decryptedTimestamp = await this.decrypt(hashedMasterKey, JSON.parse(encryptedTimestamp));

                const entry = {
                    rowid,
                    messageId,
                    role: decryptedRole,
                    rawContent: decryptedMessage,
                    timestamp: decryptedTimestamp,
                    conversationGroup: conversationGroup || 1
                };

                orderedMessages.push(entry);
                if (decryptedRole === 'user') {
                    userMessages.push(entry);
                }
            }

            const scopedOrderedMessages = requestedConversationGroup == null
                ? orderedMessages
                : orderedMessages.filter(msg => msg.conversationGroup === requestedConversationGroup);

            const rowsToDelete = new Set();

            const exactUserMatch = userMessageId
                ? scopedOrderedMessages.find(msg => msg.role === 'user' && String(msg.messageId) === String(userMessageId))
                : null;
            const exactAssistantMatch = assistantMessageId
                ? scopedOrderedMessages.find(msg => msg.role === 'assistant' && String(msg.messageId) === String(assistantMessageId))
                : null;

            if (exactUserMatch && exactAssistantMatch) {
                rowsToDelete.add(exactUserMatch.rowid);
                rowsToDelete.add(exactAssistantMatch.rowid);
            } else if (exactUserMatch) {
                rowsToDelete.add(exactUserMatch.rowid);
                const userIndex = scopedOrderedMessages.findIndex(msg => msg.rowid === exactUserMatch.rowid);
                for (let nextIndex = userIndex + 1; nextIndex < scopedOrderedMessages.length; nextIndex++) {
                    const nextMessage = scopedOrderedMessages[nextIndex];
                    if (nextMessage.conversationGroup !== exactUserMatch.conversationGroup) continue;
                    if (nextMessage.role === 'user') break;
                    if (nextMessage.role === 'assistant') {
                        rowsToDelete.add(nextMessage.rowid);
                        break;
                    }
                }
            } else if (exactAssistantMatch) {
                rowsToDelete.add(exactAssistantMatch.rowid);
                const assistantIndex = scopedOrderedMessages.findIndex(msg => msg.rowid === exactAssistantMatch.rowid);
                for (let prevIndex = assistantIndex - 1; prevIndex >= 0; prevIndex--) {
                    const prevMessage = scopedOrderedMessages[prevIndex];
                    if (prevMessage.conversationGroup !== exactAssistantMatch.conversationGroup) continue;
                    if (prevMessage.role === 'assistant') continue;
                    if (prevMessage.role === 'user') {
                        rowsToDelete.add(prevMessage.rowid);
                        break;
                    }
                }
            }

            if (!rowsToDelete.size) {
                console.warn('⚠️ No exact message id match found for deletion');
                return false;
            }

            const attachmentIdsToDelete = userMessages
                .filter(msg => rowsToDelete.has(msg.rowid))
                .flatMap(msg => this.extractConversationAttachmentIdsFromStoredMessage(msg.rawContent));

            let deletedCount = 0;
            let deletedAttachmentCount = 0;
            for (const rowid of rowsToDelete) {
                db.exec(`DELETE FROM conversations_${hashedMasterKey} WHERE rowid = ?`, [rowid]);
                deletedCount++;
            }

            if (deletedCount > 0) {
                if (attachmentIdsToDelete.length > 0 && attachmentDb) {
                    deletedAttachmentCount = await this.deleteConversationAttachmentsByIds(
                        attachmentDb,
                        hashedMasterKey,
                        attachmentIdsToDelete
                    );
                }

                await this.saveToStorage(db.export(), hashedMasterKey);
                if (deletedAttachmentCount > 0 && attachmentDb) {
                    await this.saveToStorage(attachmentDb.export(), hashedMasterKey, 'images');
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error in deleteConversationPairByIds:', error);
            return false;
        }
    }
    // Updates the timestamp for a specific conversation group.
    static async touchConversationGroup(hashedMasterKey, groupId) {
        try {
           //console.log(`START: Updating timestamp ONLY for group ${groupId}`);
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) return false;

            // Check if any conversations exist in this group
            const checkResult = db.exec(`
                SELECT COUNT(*) FROM conversations_${hashedMasterKey}
                WHERE conversation_group = ?
            `, [groupId]);

            if (!checkResult[0] || !checkResult[0].values[0][0]) {
               //console.log(`No conversations found in group ${groupId}`);
                return false;
            }

            // SIMPLER APPROACH: Add a group_updated_at field for sorting
            // Check if group_updated_at column exists
            const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
            const hasUpdatedAtColumn = columnsResult[0]?.values.some(col => col[1] === 'group_updated_at');

            if (!hasUpdatedAtColumn) {
               //console.log('Adding group_updated_at column to conversations table');
                db.exec(`ALTER TABLE conversations_${hashedMasterKey} ADD COLUMN group_updated_at TEXT`);
            }

            // Create current timestamp
            const now = new Date().toISOString();
            const encryptedNow = await this.encrypt(hashedMasterKey, now);

            // Update the group_updated_at field for all messages in this group
            db.run(`
                UPDATE conversations_${hashedMasterKey}
                SET group_updated_at = ?
                WHERE conversation_group = ?
            `, [
                JSON.stringify(encryptedNow),
                groupId
            ]);
           //console.log(`DONE: Updated timestamp only for group ${groupId}`);

            // Verify which groups were actually updated with a query
            const updatedGroups = db.exec(`
            SELECT DISTINCT conversation_group 
            FROM conversations_${hashedMasterKey} 
            WHERE group_updated_at = ?
        `, [JSON.stringify(encryptedNow)]);

           //console.log('Groups with this exact timestamp:',
                //updatedGroups[0]?.values?.map(v => v[0]) || []);
            // Save changes
            await this.saveToStorage(db.export(), hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error updating conversation group timestamp:', error);
            return false;
        }
    }
    // Deletes a user/assistant message pair from the conversation history.
    static async deleteConversationPair(hashedMasterKey, userContent, assistantContent, options = null) {
       //console.log('🗑️ Deleting conversation pair with exact canonical matching');

        try {
            const db = await this.getDatabase(hashedMasterKey);
            const attachmentDb = await this.getDatabase(hashedMasterKey, 'images', true);
            if (!db) {
                console.error('❌ Database not found for masterkey:', hashedMasterKey);
                throw new Error('Database not found');
            }

            const conversationsResult = db.exec(`
            SELECT rowid, conversation, role, timestamp, conversation_group
            FROM conversations_${hashedMasterKey}
            ORDER BY timestamp ASC
        `);

            if (!conversationsResult[0]?.values) {
                return false;
            }

            const requestedConversationGroup = Number.isFinite(Number(options?.conversationGroup))
                ? Number(options.conversationGroup)
                : null;
            const requirePair = Boolean(options?.requirePair);

            const normalizeExactText = (value) => String(value || '')
                .normalize('NFKC')
                .replace(/\r\n/g, '\n')
                .replace(/\u00a0/g, ' ')
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{2,}/g, '\n')
                .replace(/[ \t]*\n[ \t]*/g, '\n')
                .trim();

            const normalizeHtmlToText = (value) => {
                const raw = String(value || '');
                if (!raw) return '';
                try {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = raw;
                    const transientElements = tempDiv.querySelectorAll(
                        '.message-actions, .copy-response-container, .cancel-note, .code-copy-btn, .code-copy-with-lines-btn, .toggle-line-numbers, .code-run-btn, .line-numbers, [style*="display: none"], [style*="visibility: hidden"]'
                    );
                    transientElements.forEach(el => el.remove());
                    return normalizeExactText(tempDiv.textContent || tempDiv.innerText || raw);
                } catch (error) {
                    return normalizeExactText(raw);
                }
            };

            const userMessages = [];
            const assistantMessages = [];
            const orderedMessages = [];

            for (const [rowid, encryptedConversation, encryptedRole, encryptedTimestamp, conversationGroup] of conversationsResult[0].values) {
                try {
                    const decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(encryptedRole));
                    const decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(encryptedConversation));
                    const decryptedTimestamp = await this.decrypt(hashedMasterKey, JSON.parse(encryptedTimestamp));
                    const normalizedRaw = normalizeExactText(decryptedMessage);

                    if (decryptedRole === 'user') {
                        let jsonTextContent = null;
                        let normalizedJsonText = '';

                        try {
                            const parsedMessage = JSON.parse(decryptedMessage);
                            if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text !== undefined) {
                                jsonTextContent = String(parsedMessage.text || '');
                                normalizedJsonText = normalizeExactText(jsonTextContent);
                            }
                        } catch (error) {
                            // Stored user message is plain text; no-op.
                        }

                        const userMessage = {
                            rowid,
                            content: normalizedRaw,
                            jsonTextContent: normalizedJsonText,
                            rawContent: decryptedMessage,
                            timestamp: decryptedTimestamp,
                            conversationGroup: conversationGroup || 1
                        };
                        userMessages.push(userMessage);
                        orderedMessages.push({ role: 'user', ...userMessage });
                    } else if (decryptedRole === 'assistant') {
                        const assistantMessage = {
                            rowid,
                            content: normalizeHtmlToText(decryptedMessage),
                            rawContent: decryptedMessage,
                            timestamp: decryptedTimestamp,
                            conversationGroup: conversationGroup || 1
                        };
                        assistantMessages.push(assistantMessage);
                        orderedMessages.push({ role: 'assistant', ...assistantMessage });
                    }
                } catch (err) {
                    console.error('❌ Error decrypting message:', err);
                }
            }

            const scopedUserMessages = requestedConversationGroup == null
                ? userMessages
                : userMessages.filter(msg => msg.conversationGroup === requestedConversationGroup);
            const scopedAssistantMessages = requestedConversationGroup == null
                ? assistantMessages
                : assistantMessages.filter(msg => msg.conversationGroup === requestedConversationGroup);
            const scopedOrderedMessages = requestedConversationGroup == null
                ? orderedMessages
                : orderedMessages.filter(msg => msg.conversationGroup === requestedConversationGroup);

            const rowsToDelete = new Set();
            const normalizedTargetUserContent = normalizeExactText(userContent);
            const normalizedTargetAssistantContent = normalizeExactText(assistantContent);

            if (requirePair && normalizedTargetUserContent && normalizedTargetAssistantContent) {
                let exactPair = null;

                for (let index = 0; index < scopedOrderedMessages.length; index++) {
                    const currentMessage = scopedOrderedMessages[index];
                    if (currentMessage.role !== 'user') {
                        continue;
                    }

                    const userMatches = currentMessage.content === normalizedTargetUserContent
                        || currentMessage.jsonTextContent === normalizedTargetUserContent;
                    if (!userMatches) {
                        continue;
                    }

                    let pairedAssistant = null;
                    for (let nextIndex = index + 1; nextIndex < scopedOrderedMessages.length; nextIndex++) {
                        const nextMessage = scopedOrderedMessages[nextIndex];
                        if (nextMessage.conversationGroup !== currentMessage.conversationGroup) {
                            continue;
                        }
                        if (nextMessage.role === 'user') {
                            break;
                        }
                        if (nextMessage.role === 'assistant') {
                            pairedAssistant = nextMessage;
                            break;
                        }
                    }

                    if (!pairedAssistant) {
                        continue;
                    }

                    if (pairedAssistant.content === normalizedTargetAssistantContent) {
                        exactPair = {
                            user: currentMessage,
                            assistant: pairedAssistant
                        };
                        break;
                    }
                }

                if (!exactPair) {
                    console.warn('⚠️ No exact message pair match found in the current conversation group');
                    return false;
                }

                rowsToDelete.add(exactPair.user.rowid);
                rowsToDelete.add(exactPair.assistant.rowid);
            } else {
                let exactUserMatch = null;
                let exactAssistantMatch = null;

                if (normalizedTargetUserContent) {
                    exactUserMatch = scopedUserMessages.find(msg =>
                        msg.content === normalizedTargetUserContent
                        || msg.jsonTextContent === normalizedTargetUserContent
                    ) || null;
                }

                if (normalizedTargetAssistantContent) {
                    exactAssistantMatch = scopedAssistantMessages.find(msg =>
                        msg.content === normalizedTargetAssistantContent
                    ) || null;
                }

                if (exactUserMatch) {
                    rowsToDelete.add(exactUserMatch.rowid);

                    const userIndex = scopedOrderedMessages.findIndex(msg =>
                        msg.role === 'user' && msg.rowid === exactUserMatch.rowid
                    );
                    if (userIndex !== -1) {
                        for (let nextIndex = userIndex + 1; nextIndex < scopedOrderedMessages.length; nextIndex++) {
                            const nextMessage = scopedOrderedMessages[nextIndex];
                            if (nextMessage.conversationGroup !== exactUserMatch.conversationGroup) {
                                continue;
                            }
                            if (nextMessage.role === 'user') {
                                break;
                            }
                            if (nextMessage.role === 'assistant') {
                                rowsToDelete.add(nextMessage.rowid);
                                break;
                            }
                        }
                    }
                }

                if (!rowsToDelete.size && exactAssistantMatch) {
                    rowsToDelete.add(exactAssistantMatch.rowid);

                    const assistantIndex = scopedOrderedMessages.findIndex(msg =>
                        msg.role === 'assistant' && msg.rowid === exactAssistantMatch.rowid
                    );
                    if (assistantIndex !== -1) {
                        for (let prevIndex = assistantIndex - 1; prevIndex >= 0; prevIndex--) {
                            const previousMessage = scopedOrderedMessages[prevIndex];
                            if (previousMessage.conversationGroup !== exactAssistantMatch.conversationGroup) {
                                continue;
                            }
                            if (previousMessage.role === 'assistant') {
                                continue;
                            }
                            if (previousMessage.role === 'user') {
                                rowsToDelete.add(previousMessage.rowid);
                                break;
                            }
                        }
                    }
                }

                if (!rowsToDelete.size) {
                    console.warn('⚠️ No exact message match found for deletion');
                    return false;
                }
            }

            //  EXECUTE DELETION
            let deletedCount = 0;
            let deletedAttachmentCount = 0;
           //console.log(`🗑️ Attempting to delete ${rowsToDelete.size} messages`);

            const attachmentIdsToDelete = userMessages
                .filter(msg => rowsToDelete.has(msg.rowid))
                .flatMap(msg => this.extractConversationAttachmentIdsFromStoredMessage(msg.rawContent));

            for (const rowid of rowsToDelete) {
                try {
                    const result = db.exec(`DELETE FROM conversations_${hashedMasterKey} WHERE rowid = ?`, [rowid]);
                   //console.log(`✅ Deleted message with rowid ${rowid}`);
                    deletedCount++;
                } catch (deleteError) {
                    console.error(`❌ Error deleting message with rowid ${rowid}:`, deleteError);
                }
            }

            // Save changes if any deletions were successful
            if (deletedCount > 0) {
                if (attachmentIdsToDelete.length > 0 && attachmentDb) {
                    deletedAttachmentCount = await this.deleteConversationAttachmentsByIds(
                        attachmentDb,
                        hashedMasterKey,
                        attachmentIdsToDelete
                    );
                }

               //console.log(`💾 Successfully deleted ${deletedCount} messages, saving to storage`);
                await this.saveToStorage(db.export(), hashedMasterKey);
                if (deletedAttachmentCount > 0 && attachmentDb) {
                    await this.saveToStorage(attachmentDb.export(), hashedMasterKey, 'images');
                }
               //console.log('✅ Database saved successfully');
                return true;
            } else {
                console.warn('⚠️ No messages were deleted from the database');
                return false;
            }

        } catch (error) {
            console.error('❌ Error in enhanced deleteConversationPair:', error);
            return false;
        }
    }

    static async saveModelContextSize(hashedMasterKey, modelName, contextSize, isKvcacheQ8, useCalculatedContext = true) {
        try {
           //console.log('🗃️ PaiperworkDB.saveModelContextSize called with:', {
                //modelName: modelName,
                //contextSize: contextSize,
                //isKvcacheQ8: isKvcacheQ8,
                //useCalculatedContext: useCalculatedContext
            //});

            // Get SQL.js if not already loaded
            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get existing database
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                console.error('❌ PaiperworkDB: No database found for masterkey:', hashedMasterKey);
                return false;
            }

            const db = new this.SQL.Database(existingDb);

            // Create table if it doesn't exist
            const tableExists = db.exec(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='model_context_sizes_${hashedMasterKey}'
        `);

            if (!tableExists[0]?.values.length) {
               //console.log('🏗️ PaiperworkDB: Creating model_context_sizes table');
                db.exec(`
                CREATE TABLE IF NOT EXISTS model_context_sizes_${hashedMasterKey} (
                    model_name TEXT PRIMARY KEY,
                    context_size INTEGER,
                    is_kvcache_q8 BOOLEAN,
                    use_calculated_context BOOLEAN DEFAULT TRUE,
                    created_at TEXT,
                    updated_at TEXT
                )
            `);
            } else {
                // Check if the use_calculated_context column exists, add it if not
                const columnsResult = db.exec(`PRAGMA table_info(model_context_sizes_${hashedMasterKey})`);
                const hasUseFlagColumn = columnsResult[0]?.values.some(col => col[1] === 'use_calculated_context');

                if (!hasUseFlagColumn) {
                   //console.log('🔧 PaiperworkDB: Adding use_calculated_context column');
                    db.exec(`ALTER TABLE model_context_sizes_${hashedMasterKey} ADD COLUMN use_calculated_context BOOLEAN DEFAULT TRUE`);
                }
            }

            const now = new Date().toISOString();

            // Encrypt the data
            const encryptedModelName = await this.encrypt(hashedMasterKey, modelName);
            const encryptedContextSize = await this.encrypt(hashedMasterKey, contextSize.toString());
            const encryptedKvcacheQ8 = await this.encrypt(hashedMasterKey, isKvcacheQ8.toString());
            const encryptedUseCalculated = await this.encrypt(hashedMasterKey, useCalculatedContext.toString());
            const encryptedTimestamp = await this.encrypt(hashedMasterKey, now);

           //console.log('🔐 PaiperworkDB: Data encrypted, checking for existing record...');

            //  CRITICAL FIX: Find and delete existing record for this model first
            const allRecords = db.exec(`
            SELECT model_name, created_at FROM model_context_sizes_${hashedMasterKey}
        `);

            let existingCreatedAt = null;
            let foundExisting = false;

            if (allRecords[0]?.values.length) {
               //console.log(`🔍 PaiperworkDB: Checking ${allRecords[0].values.length} existing records for match...`);

                for (const row of allRecords[0].values) {
                    const [encryptedStoredModelName, storedCreatedAt] = row;
                    try {
                        const decryptedStoredModelName = await this.decrypt(hashedMasterKey, JSON.parse(encryptedStoredModelName));
                        if (decryptedStoredModelName === modelName) {
                           //console.log('🎯 PaiperworkDB: Found existing record for model:', modelName);
                            existingCreatedAt = storedCreatedAt;
                            foundExisting = true;

                            //  CRITICAL: Delete the old record first
                           //console.log('🗑️ PaiperworkDB: Deleting old record for clean update');
                            db.exec(`
                            DELETE FROM model_context_sizes_${hashedMasterKey} 
                            WHERE model_name = ?
                        `, [encryptedStoredModelName]);
                            break;
                        }
                    } catch (decryptError) {
                        console.warn('⚠️ PaiperworkDB: Could not decrypt stored model name:', decryptError);
                    }
                }
            }

            const finalCreatedAt = foundExisting ? existingCreatedAt : JSON.stringify(encryptedTimestamp);

           //console.log(`${foundExisting ? '🔄 PaiperworkDB: Updating' : '➕ PaiperworkDB: Creating new'} record for model: ${modelName}`);

            //  CRITICAL FIX: Use INSERT after DELETE (clean upsert)
            db.exec(`
            INSERT INTO model_context_sizes_${hashedMasterKey} 
            (model_name, context_size, is_kvcache_q8, use_calculated_context, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
                JSON.stringify(encryptedModelName),
                JSON.stringify(encryptedContextSize),
                JSON.stringify(encryptedKvcacheQ8),
                JSON.stringify(encryptedUseCalculated),
                finalCreatedAt,
                JSON.stringify(encryptedTimestamp)
            ]);

            // Save to storage
            await this.saveToStorage(db.export(), hashedMasterKey);

           //console.log(`✅ PaiperworkDB: Model context size ${foundExisting ? 'updated' : 'saved'}: ${modelName} -> ${contextSize} (use calculated: ${useCalculatedContext})`);
            return true;
        } catch (error) {
            console.error('❌ PaiperworkDB: Error saving model context size:', error);
            return false;
        }
    }
    // Loads the context size for a specific model from the database.
    static async loadModelContextSize(hashedMasterKey, modelName) {
        try {
           //console.log('🔍 PaiperworkDB.loadModelContextSize called for model:', modelName);

            // Get SQL.js if not already loaded
            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get existing database
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
               //console.log('⚠️ PaiperworkDB: No database found for model context loading');
                return null;
            }

            const db = new this.SQL.Database(existingDb);

            // Check if table exists
            const tableExists = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='model_context_sizes_${hashedMasterKey}'
    `);

            if (!tableExists[0]?.values.length) {
               //console.log('⚠️ PaiperworkDB: Model context sizes table does not exist');
                return null;
            }

            //  DEBUG: Let's see ALL records in the table first
            const allRecords = db.exec(`
        SELECT model_name, context_size, is_kvcache_q8, use_calculated_context, created_at, updated_at
        FROM model_context_sizes_${hashedMasterKey}
        ORDER BY updated_at DESC
    `);

            if (!allRecords[0]?.values.length) {
               //console.log('⚠️ PaiperworkDB: No model context records found in table');
                return null;
            }

           //console.log(`🔍 PaiperworkDB: Found ${allRecords[0].values.length} model context records, showing ALL records:`);

            //  DEBUG: Show all records before matching
            for (let i = 0; i < allRecords[0].values.length; i++) {
                const row = allRecords[0].values[i];
                try {
                    const decryptedModelName = await this.decrypt(hashedMasterKey, JSON.parse(row[0]));
                    const decryptedContextSize = await this.decrypt(hashedMasterKey, JSON.parse(row[1]));
                    const decryptedKvcacheQ8 = await this.decrypt(hashedMasterKey, JSON.parse(row[2]));
                    const decryptedUseCalculated = row[3] ? await this.decrypt(hashedMasterKey, JSON.parse(row[3])) : 'true';
                    const createdAt = row[4] ? await this.decrypt(hashedMasterKey, JSON.parse(row[4])) : 'unknown';
                    const updatedAt = row[5] ? await this.decrypt(hashedMasterKey, JSON.parse(row[5])) : 'unknown';

                    /*console.log(`📋 Record ${i + 1}:`, {
                        modelName: decryptedModelName,
                        contextSize: parseInt(decryptedContextSize),
                        isKvcacheQ8: decryptedKvcacheQ8 === 'true',
                        useCalculatedContext: decryptedUseCalculated === 'true',
                        createdAt: createdAt,
                        updatedAt: updatedAt
                    }); */

                    // Now check if this matches our target model
                    if (decryptedModelName === modelName) {
                        /*console.log(`🎯 FOUND MATCH for ${modelName}:`, {
                            contextSize: parseInt(decryptedContextSize),
                            isKvcacheQ8: decryptedKvcacheQ8 === 'true',
                            useCalculatedContext: decryptedUseCalculated === 'true'
                        });*/

                        // Return this match
                        return {
                            contextSize: parseInt(decryptedContextSize),
                            isKvcacheQ8: decryptedKvcacheQ8 === 'true',
                            useCalculatedContext: decryptedUseCalculated === 'true'
                        };
                    }
                } catch (decryptError) {
                    console.warn(`⚠️ PaiperworkDB: Error decrypting record ${i + 1}:`, decryptError);
                    continue;
                }
            }

           //console.log('❌ PaiperworkDB: No matching model context found for:', modelName);
            return null;
        } catch (error) {
            console.error('❌ PaiperworkDB: Error loading model context size:', error);
            return null;
        }
    }

    // Sets the useCalculatedContext flag for a specific model context entry.
    static async setModelContextFlag(hashedMasterKey, modelName, useCalculatedContext) {
        try {
           //console.log(`Setting context flag for ${modelName}: use calculated = ${useCalculatedContext}`);

            // Get existing model context data
            const existingData = await this.loadModelContextSize(hashedMasterKey, modelName);
            if (!existingData) {
                console.warn(`No model context data found for ${modelName}`);
                return false;
            }

            // Save with the new flag but keep existing context size and KV cache setting
            return await this.saveModelContextSize(
                hashedMasterKey,
                modelName,
                existingData.contextSize,
                existingData.isKvcacheQ8,
                useCalculatedContext
            );
        } catch (error) {
            console.error('Error setting model context flag:', error);
            return false;
        }
    }

    // Deletes the context size entry for a specific model.
    static async deleteModelContextSize(hashedMasterKey, modelName) {
        try {
            // Get SQL.js if not already loaded
            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get existing database
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                return false;
            }

            // Create database instance
            const db = new this.SQL.Database(existingDb);

            // Check if table exists
            const tableExists = db.exec(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='model_context_sizes_${hashedMasterKey}'
        `);

            if (!tableExists[0]?.values.length) {
                return false;
            }

            // Encrypt the model name to find the record
            const encryptedModelName = await this.encrypt(hashedMasterKey, modelName);

            // Delete the record
            db.exec(`
            DELETE FROM model_context_sizes_${hashedMasterKey} 
            WHERE model_name = ?
        `, [JSON.stringify(encryptedModelName)]);

            // Save to storage
            await this.saveToStorage(db.export(), hashedMasterKey);

           //console.log(`Deleted model context size for: ${modelName}`);
            return true;
        } catch (error) {
            console.error('Error deleting model context size:', error);
            return false;
        }
    }

    // Retrieves all model context size entries for the user.
    static async getAllModelContextSizes(hashedMasterKey) {
        try {
            // Get SQL.js if not already loaded
            if (!this.SQL) {
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            // Get existing database
            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) {
                return [];
            }

            // Create database instance
            const db = new this.SQL.Database(existingDb);

            // Check if table exists
            const tableExists = db.exec(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='model_context_sizes_${hashedMasterKey}'
        `);

            if (!tableExists[0]?.values.length) {
                return [];
            }

            // Get all records
            const allRecords = db.exec(`
            SELECT model_name, context_size, is_kvcache_q8, created_at, updated_at 
            FROM model_context_sizes_${hashedMasterKey}
            ORDER BY updated_at DESC
        `);

            if (!allRecords[0]?.values.length) {
                return [];
            }

            const modelContextSizes = [];

            // Decrypt all records
            for (const row of allRecords[0].values) {
                try {
                    const decryptedModelName = await this.decrypt(
                        hashedMasterKey,
                        JSON.parse(row[0])
                    );
                    const decryptedContextSize = await this.decrypt(
                        hashedMasterKey,
                        JSON.parse(row[1])
                    );
                    const decryptedKvcacheQ8 = await this.decrypt(
                        hashedMasterKey,
                        JSON.parse(row[2])
                    );
                    const decryptedCreatedAt = await this.decrypt(
                        hashedMasterKey,
                        JSON.parse(row[3])
                    );
                    const decryptedUpdatedAt = await this.decrypt(
                        hashedMasterKey,
                        JSON.parse(row[4])
                    );

                    modelContextSizes.push({
                        modelName: decryptedModelName,
                        contextSize: parseInt(decryptedContextSize),
                        isKvcacheQ8: decryptedKvcacheQ8 === 'true',
                        createdAt: decryptedCreatedAt,
                        updatedAt: decryptedUpdatedAt
                    });
                } catch (decryptError) {
                    console.warn('Error decrypting model context record:', decryptError);
                    continue;
                }
            }

            return modelContextSizes;
        } catch (error) {
            console.error('Error getting all model context sizes:', error);
            return [];
        }
    }
    // Research functions for saving to database

    static async loadKnowledgeCollections(hashedMasterKey) {
       //console.log(`Loading knowledge collections for masterkey: ${hashedMasterKey}`);

        try {
            // This now uses our unified database access method that handles browser compatibility
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
               //console.log('No database found or unable to access storage');
                return [];
            }

            // Check if table exists
            const tableCheck = db.exec(`SELECT name FROM sqlite_master 
            WHERE type='table' AND name='knowledge_collections_${hashedMasterKey}'`);

            if (!tableCheck.length || !tableCheck[0].values.length) {
               //console.log('Knowledge collections table not found');
                return [];
            }

            const result = db.exec(`
            SELECT collection_id, collection_data
            FROM knowledge_collections_${hashedMasterKey}
            `);

            if (!result.length || !result[0].values.length) {
                return [];
            }

            const collections = [];
            for (const [collectionId, encryptedData] of result[0].values) {
                try {
                    const decryptedData = await this.decrypt(hashedMasterKey, JSON.parse(encryptedData));
                    const collection = JSON.parse(decryptedData);
                    const legacyEntries = Array.isArray(collection?.entries) ? collection.entries : [];
                    const separatedEntries = await this.loadKnowledgeCollectionEntries(hashedMasterKey, collectionId);
                    collection.entries = Array.isArray(separatedEntries) ? separatedEntries : legacyEntries;


                    collections.push(collection);
                   //console.log(`Loaded knowledge collection: ${collection.name}`);
                } catch (e) {
                    console.error('Error decrypting knowledge collection:', e);
                }
            }

           //console.log(`Successfully loaded ${collections.length} knowledge collections`);
            return collections;
        } catch (error) {
            console.error('Error loading knowledge collections:', error);
            return [];
        }
    }

    static async saveKnowledgeCollection(hashedMasterKey, collection) {
       //console.log(`Saving knowledge collection "${collection.name}" (ID: ${collection.id})`);

        try {
            // This now uses our unified database access method that handles browser compatibility
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
                console.error('Failed to access database for saving knowledge collection');
                return false;
            }

            // Check if table exists
            const tableCheck = db.exec(`SELECT name FROM sqlite_master 
            WHERE type='table' AND name='knowledge_collections_${hashedMasterKey}'`);

            if (!tableCheck.length || !tableCheck[0].values.length) {
               //console.log('Creating knowledge collections table');
                // Create table if it doesn't exist
                db.exec(`
                CREATE TABLE IF NOT EXISTS knowledge_collections_${hashedMasterKey} (
                    collection_id TEXT PRIMARY KEY,
                    collection_data TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
                `);
            }

            const entriesPayload = Array.isArray(collection?.entries) ? collection.entries : [];
            const metadataOnlyCollection = {
                ...collection,
                entries: [],
                entryCount: entriesPayload.length,
                updated: collection?.updated || new Date().toISOString()
            };

            const collectionStr = JSON.stringify(metadataOnlyCollection);
            const encryptedData = await this.encrypt(hashedMasterKey, collectionStr);
            const timestamp = new Date().toISOString();

            // Check if collection exists
            const existingCheck = db.exec(`
            SELECT collection_id FROM knowledge_collections_${hashedMasterKey} 
            WHERE collection_id = ?
            `, [collection.id]);

            if (existingCheck.length && existingCheck[0].values.length) {
               //console.log(`Updating existing collection "${collection.name}"`);
                // Update existing collection
                db.exec(`
                UPDATE knowledge_collections_${hashedMasterKey}
                SET collection_data = ?, updated_at = ?
                WHERE collection_id = ?
                `, [JSON.stringify(encryptedData), timestamp, collection.id]);
            } else {
               //console.log(`Creating new collection "${collection.name}"`);
                // Insert new collection
                db.exec(`
                INSERT INTO knowledge_collections_${hashedMasterKey}
                (collection_id, collection_data, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                `, [collection.id, JSON.stringify(encryptedData), timestamp, timestamp]);
            }

            const savedEntries = await this.saveKnowledgeCollectionEntries(hashedMasterKey, collection.id, entriesPayload);
            if (!savedEntries) {
                console.error('Failed to save knowledge collection entries payload');
                return false;
            }

            // Save to either OPFS or IndexedDB based on browser support
            await this.saveToStorage(db.export(), hashedMasterKey);
           //console.log(`Knowledge collection "${collection.name}" saved successfully`);
            return true;
        } catch (error) {
            console.error('Error saving knowledge collection:', error);
            return false;
        }
    }

    static async updateKnowledgeCollection(hashedMasterKey, collection) {
        // This is essentially the same as saveKnowledgeCollection but with a different name
        return this.saveKnowledgeCollection(hashedMasterKey, collection);
    }

    static async deleteKnowledgeCollection(hashedMasterKey, collectionId) {
       //console.log(`Deleting knowledge collection ${collectionId} for key: ${hashedMasterKey}`);

        try {
            // Get database using our unified method that handles OPFS/IndexedDB properly
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
                console.error('Failed to get database for deleting knowledge collection');
                return false;
            }

            // Check if table exists before attempting deletion
            const tableCheck = db.exec(`SELECT name FROM sqlite_master 
            WHERE type='table' AND name='knowledge_collections_${hashedMasterKey}'`);

            if (!tableCheck.length || !tableCheck[0].values.length) {
               //console.log('Knowledge collections table not found, nothing to delete');
                return false;
            }

            // Check if the collection exists before attempting deletion
            const collectionCheck = db.exec(`
                SELECT collection_id FROM knowledge_collections_${hashedMasterKey} 
                WHERE collection_id = ?
            `, [collectionId]);

            if (!collectionCheck.length || !collectionCheck[0].values.length) {
               //console.log(`Knowledge collection ${collectionId} not found, nothing to delete`);
                return false;
            }

            // Perform the deletion
           //console.log(`Deleting knowledge collection with ID: ${collectionId}`);
            db.exec(`
                DELETE FROM knowledge_collections_${hashedMasterKey}
                WHERE collection_id = ?
            `, [collectionId]);

            await this.deleteKnowledgeCollectionEntries(hashedMasterKey, collectionId);

            // Save changes using our unified method (OPFS for Chrome, IndexedDB for all browsers)
            await this.saveToStorage(db.export(), hashedMasterKey);
           //console.log(`Knowledge collection ${collectionId} deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting knowledge collection:', error);
            return false;
        }
    }

    static async loadKnowledgeCollectionEntries(hashedMasterKey, collectionId) {
        try {
            if (!hashedMasterKey || !collectionId) {
                return null;
            }

            const kbDb = await this.getDatabase(hashedMasterKey, 'kb');
            if (!kbDb) {
                return null;
            }

            const entriesTable = `knowledge_entries_${hashedMasterKey}`;
            const tableCheck = kbDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${entriesTable}'`);
            if (!tableCheck.length || !tableCheck[0].values.length) {
                return null;
            }

            const result = kbDb.exec(
                `SELECT entries_data FROM ${entriesTable} WHERE collection_id = ? LIMIT 1`,
                [collectionId]
            );

            if (!result.length || !result[0].values.length) {
                return null;
            }

            const encryptedEntries = result[0].values[0][0];
            if (!encryptedEntries) {
                return [];
            }

            const decryptedEntries = await this.decrypt(hashedMasterKey, JSON.parse(encryptedEntries));
            const parsedEntries = JSON.parse(decryptedEntries || '[]');
            return Array.isArray(parsedEntries) ? parsedEntries : [];
        } catch (error) {
            console.error('Error loading knowledge collection entries:', error);
            return null;
        }
    }

    static async saveKnowledgeCollectionEntries(hashedMasterKey, collectionId, entries) {
        try {
            if (!hashedMasterKey || !collectionId) {
                return false;
            }

            const kbDb = await this.getDatabase(hashedMasterKey, 'kb', true);
            if (!kbDb) {
                return false;
            }

            const entriesTable = `knowledge_entries_${hashedMasterKey}`;
            kbDb.exec(`
                CREATE TABLE IF NOT EXISTS ${entriesTable} (
                    collection_id TEXT PRIMARY KEY,
                    entries_data TEXT,
                    updated_at TEXT
                )
            `);

            const safeEntries = Array.isArray(entries) ? entries : [];
            const encryptedEntries = await this.encrypt(hashedMasterKey, JSON.stringify(safeEntries));

            kbDb.exec(
                `INSERT OR REPLACE INTO ${entriesTable} (collection_id, entries_data, updated_at) VALUES (?, ?, ?)`,
                [collectionId, JSON.stringify(encryptedEntries), new Date().toISOString()]
            );

            await this.saveToStorage(kbDb.export(), hashedMasterKey, 'kb');
            return true;
        } catch (error) {
            console.error('Error saving knowledge collection entries:', error);
            return false;
        }
    }

    static async deleteKnowledgeCollectionEntries(hashedMasterKey, collectionId) {
        try {
            if (!hashedMasterKey || !collectionId) {
                return false;
            }

            const kbDb = await this.getDatabase(hashedMasterKey, 'kb');
            if (!kbDb) {
                return false;
            }

            const entriesTable = `knowledge_entries_${hashedMasterKey}`;
            const tableCheck = kbDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${entriesTable}'`);
            if (!tableCheck.length || !tableCheck[0].values.length) {
                return false;
            }

            kbDb.exec(`DELETE FROM ${entriesTable} WHERE collection_id = ?`, [collectionId]);
            await this.saveToStorage(kbDb.export(), hashedMasterKey, 'kb');
            return true;
        } catch (error) {
            console.error('Error deleting knowledge collection entries:', error);
            return false;
        }
    }

    // Translates code block UI elements in the DOM for localization.
    static applyTranslationsToCodeBlocks() {
       //console.log('🔧 applyTranslationsToCodeBlocks: Starting...');

        // Find all code blocks in the conversation history
        const codeBlocks = document.querySelectorAll(".assistant-message .code-block");
       //console.log(`🔧 Found ${codeBlocks.length} code blocks to process`);

        codeBlocks.forEach((block, index) => {
           //console.log(`🔧 Processing code block ${index + 1}/${codeBlocks.length}`);

            // Translate copy button
            const copyBtn = block.querySelector(".code-copy-btn");
            if (copyBtn) {
                copyBtn.textContent = Lang.get("codeCopyButton") || "Copy";
               //console.log(`✅ Copy button translated for block ${index + 1}`);
            } else {
               //console.log(`❌ No copy button found for block ${index + 1}`);
            }

            // Translate copy with line numbers button
            const copyWithLinesBtn = block.querySelector(".code-copy-with-lines-btn");
            if (copyWithLinesBtn) {
                copyWithLinesBtn.textContent = Lang.get("codeCopyWithLinesButton") || "Copy with #";
               //console.log(`✅ Copy with lines button translated for block ${index + 1}`);
            } else {
               //console.log(`❌ No copy with lines button found for block ${index + 1}`);
            }

            // Translate and fix line numbers toggle button
            const toggleLineNumBtn = block.querySelector(".toggle-line-numbers");
           //console.log(`🔧 Block ${index + 1}: toggle button found:`, !!toggleLineNumBtn);

            if (toggleLineNumBtn) {
               //console.log(`🔧 Block ${index + 1}: Processing toggle button...`);

                toggleLineNumBtn.textContent = Lang.get("codeToggleLineNumbers") || "#";
                toggleLineNumBtn.title = Lang.get("codeToggleLineNumbersTitle") || "Toggle line numbers";

                // Log current onclick attribute
               //console.log(`🔧 Block ${index + 1}: Current onclick:`, toggleLineNumBtn.getAttribute('onclick'));

                // Remove existing onclick and event listeners
                toggleLineNumBtn.removeAttribute('onclick');
               //console.log(`🔧 Block ${index + 1}: Removed onclick attribute`);

                // Clone the button to remove all event listeners
                const newBtn = toggleLineNumBtn.cloneNode(true);
                toggleLineNumBtn.parentNode.replaceChild(newBtn, toggleLineNumBtn);
               //console.log(`🔧 Block ${index + 1}: Cloned button to remove event listeners`);

                // Make sure the code block structure is complete
                const pre = block.querySelector('pre');
                const code = block.querySelector('code');

               //console.log(`🔧 Block ${index + 1}: Structure check - pre:`, !!pre, 'code:', !!code);

                if (pre && code) {
                    //  CRITICAL FIX: Always ensure line numbers container exists
                    let lineNumbersContainer = block.querySelector('.line-numbers');
                   //console.log(`🔧 Block ${index + 1}: Line numbers container exists:`, !!lineNumbersContainer);

                    if (!lineNumbersContainer) {
                       //console.log(`🔧 Block ${index + 1}: Creating missing line numbers container for loaded code block`);
                        lineNumbersContainer = document.createElement('div');
                        lineNumbersContainer.className = 'line-numbers';
                        lineNumbersContainer.style.cssText = `
                        position: absolute;
                        left: 0;
                        top: 0;
                        padding: 1em 0;
                        background-color: var(--bg-color, #f6f8fa);
                        border-right: 1px solid var(--border-color, #d1d9e0);
                        user-select: none;
                        display: none;
                        visibility: hidden;
                        width: 3em;
                        box-sizing: border-box;
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        font-size: 14px;
                        z-index: 1;
                    `;

                        // Ensure pre has relative positioning
                        pre.style.position = 'relative';
                        pre.appendChild(lineNumbersContainer);
                       //console.log(`✅ Block ${index + 1}: Line numbers container created and added to pre element`);
                    } else {
                       //console.log(`✅ Block ${index + 1}: Line numbers container already exists`);
                        // Ensure it has proper styling even if it exists
                        if (lineNumbersContainer.style.position !== 'absolute') {
                            lineNumbersContainer.style.cssText = `
                            position: absolute;
                            left: 0;
                            top: 0;
                            padding: 1em 0;
                            background-color: var(--bg-color, #f6f8fa);
                            border-right: 1px solid var(--border-color, #d1d9e0);
                            user-select: none;
                            display: none;
                            visibility: hidden;
                            width: 3em;
                            box-sizing: border-box;
                            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                            font-size: 14px;
                            z-index: 1;
                        `;
                            pre.style.position = 'relative';
                           //console.log(`🔧 Block ${index + 1}: Updated existing line numbers container styling`);
                        }
                    }

                    // Add the working event listener
                   //console.log(`🔧 Block ${index + 1}: Adding click event listener`);

                    newBtn.addEventListener('click', function (e) {
                       //console.log(`🚀 CLICK EVENT TRIGGERED for block ${index + 1}`);
                        e.preventDefault();
                        e.stopPropagation();

                        // Use the global function if available
                        if (typeof window.toggleCodeLineNumbers === 'function') {
                           //console.log(`🌍 Block ${index + 1}: Using global toggleCodeLineNumbers function`);
                            try {
                                window.toggleCodeLineNumbers(this);
                               //console.log(`✅ Block ${index + 1}: Global function executed successfully`);
                            } catch (error) {
                                console.error(`❌ Block ${index + 1}: Error in global function:`, error);
                            }
                        } else {
                           //console.log(`🔄 Block ${index + 1}: Using fallback line numbers toggle`);

                            // Improved fallback implementation
                            const codeBlock = this.closest('.code-block');
                            if (!codeBlock) {
                                console.error(`❌ Block ${index + 1}: No code block found from button`);
                                return;
                            }

                            const pre = codeBlock.querySelector('pre');
                            const codeElement = codeBlock.querySelector('code');
                            const lineNumbersContainer = codeBlock.querySelector('.line-numbers');

                           //console.log(`🔧 Block ${index + 1}: Fallback elements - pre:`, !!pre, 'code:', !!codeElement, 'lineNumbers:', !!lineNumbersContainer);

                            if (!lineNumbersContainer || !pre || !codeElement) {
                                console.error(`❌ Block ${index + 1}: Missing required elements for line numbers`);
                                return;
                            }

                            // Check current visibility
                            const isVisible = lineNumbersContainer.style.display === 'block' ||
                                lineNumbersContainer.style.visibility === 'visible';

                           //console.log(`🔧 Block ${index + 1}: Current visibility state:`, isVisible);

                            if (isVisible) {
                                // Hide line numbers
                               //console.log(`👁️ Block ${index + 1}: Hiding line numbers`);
                                lineNumbersContainer.style.display = 'none';
                                lineNumbersContainer.style.visibility = 'hidden';
                                pre.style.paddingLeft = '1em';
                                codeElement.style.paddingLeft = '';
                            } else {
                                // Show line numbers
                               //console.log(`👁️ Block ${index + 1}: Showing line numbers`);

                                // Get the code content - data-saved-code is the single persisted copy
                                let cleanCode = (window.getCodeBlockText && window.getCodeBlockText(codeElement)) ||
                                    codeElement.textContent ||
                                    codeElement.innerText || '';

                               //console.log(`📝 Block ${index + 1}: Code content length:`, cleanCode.length);
                               //console.log(`📝 Block ${index + 1}: Code sample:`, cleanCode.substring(0, 50) + '...');

                                if (!cleanCode.trim()) {
                                    console.warn(`⚠️ Block ${index + 1}: No code content found for line numbers`);
                                    return;
                                }

                                const lines = cleanCode.split('\n');
                                const lineCount = lines.length;
                               //console.log(`📊 Block ${index + 1}: Line count:`, lineCount);

                                // Generate line numbers HTML
                                let lineNumbersHTML = '';
                                for (let i = 1; i <= lineCount; i++) {
                                    lineNumbersHTML += `<div class="line-number-item">${i}</div>`;
                                }

                                lineNumbersContainer.innerHTML = lineNumbersHTML;
                               //console.log(`✅ Block ${index + 1}: Line numbers HTML generated`);

                                // Show with proper styling
                                lineNumbersContainer.style.cssText = `
                                position: absolute;
                                left: 0;
                                top: 0;
                                padding: 1em 0;
                                background-color: var(--bg-color, #f6f8fa);
                                border-right: 1px solid var(--border-color, #d1d9e0);
                                user-select: none;
                                display: block !important;
                                visibility: visible !important;
                                width: 3em;
                                box-sizing: border-box;
                                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                                font-size: 14px;
                                z-index: 1;
                            `;

                                // Adjust padding
                                pre.style.position = 'relative';
                                pre.style.paddingLeft = '3.5em';
                                codeElement.style.paddingLeft = '0.5em';

                               //console.log(`✅ Block ${index + 1}: Line numbers displayed and styling applied`);
                            }
                        }
                    });

                   //console.log(`✅ Block ${index + 1}: Event listener added successfully`);

                    // Test that the button is clickable
                    setTimeout(() => {
                       //console.log(`🧪 Block ${index + 1}: Testing button accessibility...`);
                       //console.log(`🧪 Block ${index + 1}: Button in DOM:`, document.contains(newBtn));
                       //console.log(`🧪 Block ${index + 1}: Button visible:`, newBtn.offsetParent !== null);
                       //console.log(`🧪 Block ${index + 1}: Button position:`, newBtn.getBoundingClientRect());

                        //  ADDITIONAL DEBUG: Verify line numbers container is properly attached
                        const verifyContainer = block.querySelector('.line-numbers');
                       //console.log(`🧪 Block ${index + 1}: Line numbers container in DOM:`, !!verifyContainer);
                        if (verifyContainer) {
                           //console.log(`🧪 Block ${index + 1}: Container parent:`, verifyContainer.parentNode?.tagName);
                           //console.log(`🧪 Block ${index + 1}: Container styles:`, verifyContainer.style.cssText);
                        }
                    }, 1000);

                } else {
                    console.error(`❌ Block ${index + 1}: Missing pre or code elements`);
                }
            } else {
               //console.log(`❌ Block ${index + 1}: No toggle line numbers button found`);
            }

            // Translate run button if present
            const runBtn = block.querySelector(".code-run-btn");
            if (runBtn) {
                runBtn.textContent = Lang.get("codeRunButton") || "Run";
               //console.log(`✅ Run button translated for block ${index + 1}`);
            }
        });

       //console.log('🔧 applyTranslationsToCodeBlocks: Completed processing all blocks');
    }
    // New helper method to translate code block buttons in a message HTML string
    static translateCodeBlockButtons(html) {
        // Use a DOMParser to work with the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Find all code blocks
        const codeBlocks = doc.querySelectorAll(".code-block");

        codeBlocks.forEach((block) => {
            // Translate copy button
            const copyBtn = block.querySelector(".code-copy-btn");
            if (copyBtn) {
                copyBtn.textContent = Lang.get("codeCopyButton") || "Copy";
            }

            // Translate copy with line numbers button
            const copyWithLinesBtn = block.querySelector(".code-copy-with-lines-btn");
            if (copyWithLinesBtn) {
                copyWithLinesBtn.textContent =
                    Lang.get("codeCopyWithLinesButton") || "Copy with #";
            }

            // Translate line numbers toggle button
            const toggleLineNumBtn = block.querySelector(".toggle-line-numbers");
            if (toggleLineNumBtn) {
                toggleLineNumBtn.textContent = Lang.get("codeToggleLineNumbers") || "#";
                toggleLineNumBtn.title =
                    Lang.get("codeToggleLineNumbersTitle") || "Toggle line numbers";
            }

            // Translate run button if present
            const runBtn = block.querySelector(".code-run-btn");
            if (runBtn) {
                runBtn.textContent = Lang.get("codeRunButton") || "Run";
            }
        });

        return doc.body.innerHTML;
    }
    static escapeHtmlCodeBlocks(html) {
        if (!html) return html;

        try {
            // Create a DOM parser to work with the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Find HTML textareas and ensure their content is preserved
            const htmlCodeBlocks = doc.querySelectorAll('.code-block');
            htmlCodeBlocks.forEach(block => {
                const language = block.querySelector('.code-language')?.textContent?.toLowerCase();
                if (language === 'html' || language === 'markup') {
                    const codeElement = block.querySelector('code');
                    if (codeElement) {
                        // Get the raw code (data-saved-code is the single persisted copy)
                        const rawCode = (window.getCodeBlockText && window.getCodeBlockText(codeElement)) || codeElement.textContent;

                        // Create a preservation element to store the raw text
                        const preserveSpan = doc.createElement('span');
                        preserveSpan.className = 'preserve-formatting';
                        preserveSpan.style.display = 'none';
                        preserveSpan.textContent = rawCode;

                        // Append the preservation element
                        codeElement.appendChild(preserveSpan);
                    }
                }
            });

            return doc.body.innerHTML;
        } catch (error) {
            console.error('Error escaping HTML code blocks:', error);
            return html; // Return original HTML if there's an error
        }
    }
    static processMarkdownLinksInHtml(html) {
        if (!html) return html;

        try {
            // Use a DOM parser to safely process the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Find text nodes that might contain markdown links
            const textWalker = document.createTreeWalker(
                doc.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const nodesToReplace = [];
            while (textWalker.nextNode()) {
                const node = textWalker.currentNode;
                const content = node.textContent;

                // Skip empty nodes or nodes in tags we want to ignore
                if (!content.trim() ||
                    (node.parentNode.tagName === 'CODE') ||
                    (node.parentNode.tagName === 'A') ||
                    (node.parentNode.closest('.code-block'))) {
                    continue;
                }

                // Check for markdown links
                if (content.includes('[') && content.includes('](')) {
                    const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
                    if (pattern.test(content)) {
                        nodesToReplace.push(node);
                    }
                }
            }

            // Replace the nodes with processed versions
            for (const node of nodesToReplace) {
                const content = node.textContent;
                const processed = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                });

                // Create and insert the new HTML
                const fragment = document.createRange().createContextualFragment(processed);
                node.parentNode.replaceChild(fragment, node);
            }

            return doc.body.innerHTML;
        } catch (error) {
            console.error('Error processing markdown links in loaded HTML:', error);
            return html; // Return original HTML if processing fails
        }
    }
    // Retrieves statistics about the user's database (size, document count, etc.).
    static async getDatabaseStatistics(hashedMasterKey) {
        try {
            const db = await PaiperworkDB.getDatabase(hashedMasterKey, 'main', true);
            const ragData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'rag');
            const presentationsData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'presentations');
            const artifactsData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'artifacts');
            const campaingsData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'campaings');
            const kbData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'kb');
            const imagesData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'images');
            const whatsappData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'whatsapp');
            const wechatData = await PaiperworkDB.getExistingDatabase(hashedMasterKey, 'wechat');

            const ragDb = ragData ? new this.SQL.Database(ragData) : null;
            const presentationsDb = presentationsData ? new this.SQL.Database(presentationsData) : null;
            const artifactsDb = artifactsData ? new this.SQL.Database(artifactsData) : null;
            const campaingsDb = campaingsData ? new this.SQL.Database(campaingsData) : null;
            const kbDb = kbData ? new this.SQL.Database(kbData) : null;
            const imagesDb = imagesData ? new this.SQL.Database(imagesData) : null;
            const whatsappDb = whatsappData ? new this.SQL.Database(whatsappData) : null;
            const wechatDb = wechatData ? new this.SQL.Database(wechatData) : null;
            if (!db) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            const tableExists = (sqlDb, tableName) => {
                if (!sqlDb) return false;
                try {
                    const check = sqlDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
                    return !!(check && check.length > 0 && check[0]?.values.length > 0);
                } catch (_error) {
                    return false;
                }
            };

            const countRows = (sqlDb, tableName) => {
                if (!sqlDb) return 0;
                try {
                    if (!tableExists(sqlDb, tableName)) return 0;
                    const result = sqlDb.exec(`SELECT COUNT(*) FROM ${tableName}`);
                    return result?.[0]?.values?.[0]?.[0] || 0;
                } catch (_error) {
                    return 0;
                }
            };

            const textColumnBytes = (sqlDb, tableName, columnName) => {
                if (!sqlDb) return 0;
                try {
                    if (!tableExists(sqlDb, tableName)) return 0;
                    const result = sqlDb.exec(`SELECT COALESCE(SUM(LENGTH(${columnName})), 0) FROM ${tableName}`);
                    return Number(result?.[0]?.values?.[0]?.[0] || 0);
                } catch (_error) {
                    return 0;
                }
            };

            const multiColumnBytes = (sqlDb, tableName, columnNames = []) => {
                if (!sqlDb) return 0;
                try {
                    if (!tableExists(sqlDb, tableName) || !Array.isArray(columnNames) || !columnNames.length) return 0;
                    const expression = columnNames
                        .map(columnName => `COALESCE(LENGTH(${columnName}), 0)`)
                        .join(' + ');
                    const result = sqlDb.exec(`SELECT COALESCE(SUM(${expression}), 0) FROM ${tableName}`);
                    return Number(result?.[0]?.values?.[0]?.[0] || 0);
                } catch (_error) {
                    return 0;
                }
            };

            // Get total database size across all dedicated role databases.
            const exportedDb = db.export();
            const exportedRagDb = ragDb ? ragDb.export() : new Uint8Array(0);
            const exportedPresentationsDb = presentationsDb ? presentationsDb.export() : new Uint8Array(0);
            const exportedArtifactsDb = artifactsDb ? artifactsDb.export() : new Uint8Array(0);
            const exportedCampaingsDb = campaingsDb ? campaingsDb.export() : new Uint8Array(0);
            const exportedKbDb = kbDb ? kbDb.export() : new Uint8Array(0);
            const exportedImagesDb = imagesDb ? imagesDb.export() : new Uint8Array(0);
            const exportedWhatsappDb = whatsappDb ? whatsappDb.export() : new Uint8Array(0);
            const exportedWechatDb = wechatDb ? wechatDb.export() : new Uint8Array(0);
            const mainSizeBytes = exportedDb.length;
            const ragSizeBytes = exportedRagDb.length;
            const presentationsSizeBytes = exportedPresentationsDb.length;
            const artifactsSizeBytes = exportedArtifactsDb.length;
            const campaignsSizeBytes = exportedCampaingsDb.length;
            const kbSizeBytes = exportedKbDb.length;
            const imagesSizeBytes = exportedImagesDb.length;
            const whatsappSizeBytes = exportedWhatsappDb.length;
            const wechatSizeBytes = exportedWechatDb.length;
            const totalSizeInBytes = mainSizeBytes + ragSizeBytes + presentationsSizeBytes + artifactsSizeBytes + campaignsSizeBytes + kbSizeBytes + imagesSizeBytes + whatsappSizeBytes + wechatSizeBytes;

            const documentsTable = `documents_${hashedMasterKey}`;
            const chunksTable = `document_chunks_${hashedMasterKey}`;
            const promptableTable = `promptable_presentations_${hashedMasterKey}`;
            const promptableHtmlTable = `promptable_presentations_html_${hashedMasterKey}`;
            const artifactsTable = `artifacts_${hashedMasterKey}`;
            const artifactsHtmlTable = `artifacts_html_${hashedMasterKey}`;
            const campaignsTable = `campaigns_${hashedMasterKey}`;
            const kbCollectionsTable = `knowledge_collections_${hashedMasterKey}`;
            const kbEntriesTable = `knowledge_entries_${hashedMasterKey}`;
            const attachmentsTable = `conversation_attachments_${hashedMasterKey}`;
            const whatsappSettingsTable = 'whatsapp_settings';
            const whatsappContextsTable = 'whatsapp_phone_contexts';
            const whatsappSessionsTable = 'whatsapp_session_bundles';

            // Get document count (guard if table doesn't exist yet)
            const documentCount = countRows(db, documentsTable);

            // Get chunk count (guard if table doesn't exist yet)
            const chunkCount = countRows(ragDb, chunksTable);

            const presentationsCount = countRows(db, promptableTable);
            const presentationsPayloadBytes = textColumnBytes(presentationsDb, promptableHtmlTable, 'html_content');

            const artifactsCount = countRows(db, artifactsTable);
            const artifactsPayloadBytes = textColumnBytes(artifactsDb, artifactsHtmlTable, 'html_content');

            const campaignsCount = countRows(campaingsDb, campaignsTable);
            const campaignsPayloadBytes = multiColumnBytes(campaingsDb, campaignsTable, ['campaign_brief', 'poster_png', 'poster_overlay_json', 'poster_background_image', 'presentation_html', 'miniapp_html', 'palette_json']);

            const kbCollectionsCount = countRows(db, kbCollectionsTable);
            const kbPayloadCollectionsCount = countRows(kbDb, kbEntriesTable);
            const imagesCount = countRows(imagesDb, attachmentsTable);
            const whatsappSettingsCount = countRows(whatsappDb, whatsappSettingsTable);
            const whatsappDeviceCount = countRows(whatsappDb, 'devices');
            const whatsappContextsCount = countRows(whatsappDb, whatsappContextsTable);
            const whatsappSessionsCount = countRows(whatsappDb, whatsappSessionsTable);
            const whatsappContextsPayloadBytes = textColumnBytes(whatsappDb, whatsappContextsTable, 'context');
            const whatsappSessionsPayloadBytes = multiColumnBytes(whatsappDb, whatsappSessionsTable, ['session_blob', 'metadata_blob']);

            const wechatAccountsCount = countRows(wechatDb, 'accounts');
            const wechatLoginSessionsCount = countRows(wechatDb, 'login_sessions');
            const wechatEventsCount = countRows(wechatDb, 'events');
            const wechatPeerContextsCount = countRows(wechatDb, 'peer_contexts');
            const wechatAccountContextsCount = countRows(wechatDb, 'wechat_account_contexts');
            const wechatLogsCount = countRows(wechatDb, 'logs');
            const wechatEventsPayloadBytes = multiColumnBytes(wechatDb, 'events', ['body_text', 'raw_json']);
            const wechatPeerContextPayloadBytes = textColumnBytes(wechatDb, 'peer_contexts', 'context_token');
            const wechatAccountContextPayloadBytes = textColumnBytes(wechatDb, 'wechat_account_contexts', 'context');

            // Check for orphaned chunks (chunks with no parent document) - guard if either table is missing
            let orphanedCount = 0;
            try {
                const haveBoth = tableExists(ragDb, chunksTable) && tableExists(db, documentsTable);
                if (haveBoth) {
                    const docIdsResult = db.exec(`SELECT document_id FROM ${documentsTable}`);
                    const docIds = (docIdsResult?.[0]?.values || []).map(row => row[0]).filter(Boolean);

                    if (!docIds.length) {
                        const orphanedResult = ragDb.exec(`SELECT COUNT(*) FROM ${chunksTable}`);
                        orphanedCount = orphanedResult?.[0]?.values?.[0]?.[0] || 0;
                    } else {
                        const placeholders = docIds.map(() => '?').join(',');
                        const orphanedResult = ragDb.exec(
                            `SELECT COUNT(*) FROM ${chunksTable} WHERE document_id NOT IN (${placeholders})`,
                            docIds
                        );
                        orphanedCount = orphanedResult?.[0]?.values?.[0]?.[0] || 0;
                    }
                } else {
                    orphanedCount = 0;
                }
            } catch (e) {
                console.warn('Error checking orphaned chunks:', e);
                orphanedCount = 0;
            }

            return {
                totalSize: {
                    bytes: totalSizeInBytes,
                    formatted: this.formatFileSize(totalSizeInBytes)
                },
                dbBreakdown: {
                    main: {
                        bytes: mainSizeBytes,
                        formatted: this.formatFileSize(mainSizeBytes)
                    },
                    rag: {
                        bytes: ragSizeBytes,
                        formatted: this.formatFileSize(ragSizeBytes)
                    },
                    presentations: {
                        bytes: presentationsSizeBytes,
                        formatted: this.formatFileSize(presentationsSizeBytes),
                        count: presentationsCount,
                        payloadBytes: presentationsPayloadBytes,
                        payloadFormatted: this.formatFileSize(presentationsPayloadBytes)
                    },
                    artifacts: {
                        bytes: artifactsSizeBytes,
                        formatted: this.formatFileSize(artifactsSizeBytes),
                        count: artifactsCount,
                        payloadBytes: artifactsPayloadBytes,
                        payloadFormatted: this.formatFileSize(artifactsPayloadBytes)
                    },
                    campaigns: {
                        bytes: campaignsSizeBytes,
                        formatted: this.formatFileSize(campaignsSizeBytes),
                        count: campaignsCount,
                        payloadBytes: campaignsPayloadBytes,
                        payloadFormatted: this.formatFileSize(campaignsPayloadBytes)
                    },
                    knowledgeBase: {
                        bytes: kbSizeBytes,
                        formatted: this.formatFileSize(kbSizeBytes),
                        collections: kbCollectionsCount,
                        payloadCollections: kbPayloadCollectionsCount
                    },
                    images: {
                        bytes: imagesSizeBytes,
                        formatted: this.formatFileSize(imagesSizeBytes),
                        count: imagesCount
                    },
                    whatsapp: {
                        bytes: whatsappSizeBytes,
                        formatted: this.formatFileSize(whatsappSizeBytes),
                        settings: whatsappSettingsCount,
                        devices: whatsappDeviceCount,
                        contexts: whatsappContextsCount,
                        sessions: whatsappSessionsCount,
                        contextBytes: whatsappContextsPayloadBytes,
                        contextFormatted: this.formatFileSize(whatsappContextsPayloadBytes),
                        sessionBytes: whatsappSessionsPayloadBytes,
                        sessionFormatted: this.formatFileSize(whatsappSessionsPayloadBytes)
                    },
                    wechat: {
                        bytes: wechatSizeBytes,
                        formatted: this.formatFileSize(wechatSizeBytes),
                        accounts: wechatAccountsCount,
                        sessions: wechatLoginSessionsCount,
                        events: wechatEventsCount,
                        logs: wechatLogsCount,
                        peerContexts: wechatPeerContextsCount,
                        accountContexts: wechatAccountContextsCount,
                        eventsPayloadBytes: wechatEventsPayloadBytes,
                        eventsPayloadFormatted: this.formatFileSize(wechatEventsPayloadBytes),
                        peerContextBytes: wechatPeerContextPayloadBytes,
                        peerContextFormatted: this.formatFileSize(wechatPeerContextPayloadBytes),
                        accountContextBytes: wechatAccountContextPayloadBytes,
                        accountContextFormatted: this.formatFileSize(wechatAccountContextPayloadBytes)
                    }
                },
                documents: {
                    count: documentCount
                },
                chunks: {
                    count: chunkCount,
                    orphaned: orphanedCount
                },
                health: {
                    hasOrphanedChunks: orphanedCount > 0,
                    status: orphanedCount > 0 ? 'needs_cleanup' : 'healthy'
                }
            };
        } catch (error) {
            console.error("Error getting database statistics:", error);
            return null;
        }
    }

    static formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    static async cleanupOrphanedChunks(hashedMasterKey) {
        try {
            const db = await PaiperworkDB.getDatabase(hashedMasterKey, 'main');
            const ragDb = await PaiperworkDB.getDatabase(hashedMasterKey, 'rag');
            if (!db || !ragDb) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            // Get size before cleanup
            const beforeExport = ragDb.export();
            const beforeSize = beforeExport.length;

            // Count orphaned chunks before cleanup
            const docIdsResult = db.exec(`SELECT document_id FROM documents_${hashedMasterKey}`);
            const docIds = (docIdsResult?.[0]?.values || []).map(row => row[0]).filter(Boolean);

            let beforeCount = 0;
            if (!docIds.length) {
                const beforeResult = ragDb.exec(`SELECT COUNT(*) FROM document_chunks_${hashedMasterKey}`);
                beforeCount = beforeResult?.[0]?.values?.[0]?.[0] || 0;
            } else {
                const placeholders = docIds.map(() => '?').join(',');
                const beforeResult = ragDb.exec(
                    `SELECT COUNT(*) FROM document_chunks_${hashedMasterKey} WHERE document_id NOT IN (${placeholders})`,
                    docIds
                );
                beforeCount = beforeResult?.[0]?.values?.[0]?.[0] || 0;
            }

            // Delete orphaned chunks
            if (beforeCount > 0) {
                if (!docIds.length) {
                    ragDb.exec(`DELETE FROM document_chunks_${hashedMasterKey}`);
                } else {
                    const placeholders = docIds.map(() => '?').join(',');
                    ragDb.exec(
                        `DELETE FROM document_chunks_${hashedMasterKey} WHERE document_id NOT IN (${placeholders})`,
                        docIds
                    );
                }

                // Save changes to database
                await PaiperworkDB.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');

                // Get new size after cleanup
                const afterExport = ragDb.export();
                const afterSize = afterExport.length;

                return {
                    orphanedChunksRemoved: beforeCount,
                    sizeBeforeCleanup: this.formatFileSize(beforeSize),
                    sizeAfterCleanup: this.formatFileSize(afterSize),
                    bytesSaved: beforeSize - afterSize,
                    savedFormatted: this.formatFileSize(beforeSize - afterSize),
                    success: true
                };
            }

            return {
                orphanedChunksRemoved: 0,
                success: true
            };
        } catch (error) {
            console.error("Error cleaning up orphaned chunks:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async vacuumDatabase(hashedMasterKey) {
        try {
            const roles = ['main', 'rag', 'presentations', 'artifacts', 'campaings', 'kb', 'images', 'whatsapp', 'wechat'];
            let totalBeforeSize = 0;
            let totalAfterSize = 0;

            for (const role of roles) {
                const db = await PaiperworkDB.getDatabase(hashedMasterKey, role, true);
                if (!db) {
                    continue;
                }

                const beforeExport = db.export();
                totalBeforeSize += beforeExport.length;

                db.exec('VACUUM');

                const afterExport = db.export();
                totalAfterSize += afterExport.length;
                await PaiperworkDB.saveToStorage(afterExport, hashedMasterKey, role);
            }

            if (totalBeforeSize === 0 && totalAfterSize === 0) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            return {
                sizeBeforeOptimize: this.formatFileSize(totalBeforeSize),
                sizeAfterOptimize: this.formatFileSize(totalAfterSize),
                bytesSaved: totalBeforeSize - totalAfterSize,
                savedFormatted: this.formatFileSize(totalBeforeSize - totalAfterSize),
                success: true
            };
        } catch (error) {
            console.error("Error vacuuming database:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }


}

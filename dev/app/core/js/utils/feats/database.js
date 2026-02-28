class PaiperworkDB {

    static dbInitialized = false;
    static initializationPromise = null;
    static SQL = null;
    static opfsSupported = false;
    static useIndexedDBOnly = false;

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
    static async getDatabase(hashedMasterKey) {
        // Initialize SQL.js
        if (!this.SQL) {
            this.SQL = await initSqlJs({
                locateFile: file => `/core/js/libraries/SQLjs/${file}`
            });
        }

        // Use our getExistingDatabase method which already handles OPFS/IndexedDB properly
        const dbData = await this.getExistingDatabase(hashedMasterKey);

        // If we found data, create a new SQL.Database instance from it
        if (dbData) {
            return new this.SQL.Database(dbData);
        } else {
            return null;
        }
    }
    // Retrieves the database file from OPFS for a given master key hash.
    static async getOPFSDatabase(hashedMasterKey) {
        try {
            const root = await navigator.storage.getDirectory();
            const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: true });

            try {
                // Try to get the database file
                const fileHandle = await dbDir.getFileHandle(`${hashedMasterKey}.db`, { create: false });
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
    static async getExistingDatabase(hashedMasterKey) {
        //console.log(`🔍 Getting existing database for masterkey: ${hashedMasterKey}`);
        //console.log(`📍 Storage strategy: ${this.opfsSupported && !this.useIndexedDBOnly ? 'OPFS' : 'IndexedDB'}`);

        // Try OPFS first if it's our primary storage
        if (this.opfsSupported && !this.useIndexedDBOnly) {
            //console.log('🔍 Checking OPFS for database...');
            const opfsData = await this.getOPFSDatabase(hashedMasterKey);
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
                    const getRequest = store.get(hashedMasterKey);

                    getRequest.onsuccess = () => {
                        if (getRequest.result) {
                            //console.log(`✅ Database found in IndexedDB for ${hashedMasterKey}`);

                            // If we found data in IndexedDB but we're supposed to use OPFS,
                            // migrate it to OPFS
                            if (this.opfsSupported && !this.useIndexedDBOnly) {
                                //console.log('🔄 Migrating from IndexedDB to OPFS...');
                                this.saveToOPFS(getRequest.result, hashedMasterKey).then(() => {
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
    // Saves the exported database to OPFS or IndexedDB, depending on support.
    static async saveToStorage(dbExport, hashedMasterKey) {
        //console.log(`💾 Saving database for masterkey: ${hashedMasterKey}`);
        //console.log(`📍 Storage strategy: ${this.opfsSupported ? 'OPFS' : 'IndexedDB'}`);

        // Use OPFS if supported and enabled
        if (this.opfsSupported && !this.useIndexedDBOnly) {
            //console.log('💾 Saving to OPFS...');
            const success = await this.saveToOPFS(dbExport, hashedMasterKey);
            if (success) {
                //console.log('✅ Database saved successfully to OPFS');
                return true;
            } else {
                console.error('❌ OPFS save failed, falling back to IndexedDB');
                // If OPFS fails, mark it as unsupported and fall back to IndexedDB
                this.opfsSupported = false;
                this.useIndexedDBOnly = true;
            }
        }

        // Use IndexedDB (either as primary choice or fallback)
        //console.log('💾 Saving to IndexedDB...');
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

                const putRequest = store.put(dbExport, hashedMasterKey);

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
    // Saves the exported database to OPFS for a given master key hash.
    static async saveToOPFS(dbExport, hashedMasterKey) {
        try {
            const root = await navigator.storage.getDirectory();
            const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: true });
            const fileHandle = await dbDir.getFileHandle(`${hashedMasterKey}.db`, { create: true });

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
                            visual_model TEXT
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
            // Get current version
            const versionResult = db.exec('SELECT version FROM db_version');
            const currentVersion = versionResult.length ? versionResult[0].values[0][0] : 0;

            //console.log('Current database version:', currentVersion);

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

            // Update database version to 11
            if (currentVersion === 0) {
                db.run('INSERT INTO db_version (version) VALUES (11)');
            } else {
                db.run('UPDATE db_version SET version = 11');
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

    // Save a promptable presentation HTML (encrypted) for a given masterkey
    static async savePromptablePresentation(hashedMasterKey, payload) {
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

            console.info('savePromptablePresentation: start', {
                tableName,
                title,
                htmlLength: html.length,
                masterKeyPrefix: String(hashedMasterKey).slice(0, 8)
            });

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            const db = existingDb ? new this.SQL.Database(existingDb) : new this.SQL.Database();
            console.info('savePromptablePresentation: opened database', {
                tableName,
                hasExistingDb: !!existingDb
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    html_content TEXT,
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

            const encryptedHtml = await this.encrypt(hashedMasterKey, html);
            db.run(
                `INSERT INTO ${tableName} (title, html_content, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
                [title, JSON.stringify(encryptedHtml), mode, now, now]
            );

            const idResult = db.exec(`SELECT last_insert_rowid() AS id`);
            const insertedId = idResult && idResult[0] && idResult[0].values && idResult[0].values[0]
                ? idResult[0].values[0][0]
                : null;

            await this.saveToStorage(db.export(), hashedMasterKey);
            console.info('savePromptablePresentation: success', {
                tableName,
                insertedId
            });
            return insertedId;
        } catch (error) {
            console.error('savePromptablePresentation error:', {
                error,
                message: error && error.message ? error.message : String(error),
                stack: error && error.stack ? error.stack : null,
                hasPayload: !!payload,
                payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
                htmlLength: payload && typeof payload.html === 'string' ? payload.html.length : 0,
                hasMasterKey: !!hashedMasterKey,
                masterKeyPrefix: hashedMasterKey ? String(hashedMasterKey).slice(0, 8) : null
            });
            throw error;
        }
    }

    // Load promptable presentation list metadata for a given masterkey
    static async getPromptablePresentations(hashedMasterKey) {
        try {
            if (!hashedMasterKey) return [];

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return [];

            const db = new this.SQL.Database(existingDb);
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

            return rows[0].values.map(row => ({
                id: row[0],
                title: row[1] || '',
                mode: hasModeColumn ? (row[2] || 'html') : 'html',
                created_at: hasModeColumn ? (row[3] || '') : (row[2] || ''),
                updated_at: hasModeColumn ? (row[4] || '') : (row[3] || '')
            }));
        } catch (error) {
            console.error('getPromptablePresentations error:', error);
            return [];
        }
    }

    // Load and decrypt a promptable presentation HTML by id
    static async loadPromptablePresentationHtml(hashedMasterKey, id) {
        try {
            if (!hashedMasterKey || !id) return '';

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return '';

            const db = new this.SQL.Database(existingDb);
            const tableName = `promptable_presentations_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return '';
            }

            const rowResult = db.exec(`SELECT html_content FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
            if (!rowResult || !rowResult[0] || !rowResult[0].values || !rowResult[0].values.length) {
                return '';
            }

            const encryptedStr = rowResult[0].values[0][0];
            if (!encryptedStr) return '';

            let parsedEncrypted;
            try {
                parsedEncrypted = JSON.parse(encryptedStr);
            } catch (error) {
                return '';
            }

            const decrypted = await this.decrypt(hashedMasterKey, parsedEncrypted);
            return decrypted || '';
        } catch (error) {
            console.error('loadPromptablePresentationHtml error:', error);
            return '';
        }
    }

    // Delete a saved promptable presentation by id
    static async deletePromptablePresentation(hashedMasterKey, id) {
        try {
            if (!hashedMasterKey || !id) return false;

            await this.initializeDatabase(hashedMasterKey);

            if (!this.SQL) {
                this.SQL = await initSqlJs({ locateFile: file => `/core/js/libraries/SQLjs/${file}` });
            }

            const existingDb = await this.getExistingDatabase(hashedMasterKey);
            if (!existingDb) return false;

            const db = new this.SQL.Database(existingDb);
            const tableName = `promptable_presentations_${hashedMasterKey}`;
            const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
            if (!tableCheck || !tableCheck[0] || !tableCheck[0].values.length) {
                return false;
            }

            db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            await this.saveToStorage(db.export(), hashedMasterKey);
            return true;
        } catch (error) {
            console.error('deletePromptablePresentation error:', error);
            return false;
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
    // Deletes the database for a given master key hash from OPFS and IndexedDB.
    static async deleteDatabase(hashedMasterKey) {
        //console.log('Starting deletion of database for hashedMasterKey:', hashedMasterKey);

        let opfsDeleted = true;
        let indexedDBDeleted = false;

        // Delete from OPFS if supported
        if (this.opfsSupported) {
            try {
                //console.log('Deleting from OPFS...');
                const root = await navigator.storage.getDirectory();
                const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });

                try {
                    // Delete specific database file
                    await dbDir.removeEntry(`${hashedMasterKey}.db`);
                    //console.log('Successfully deleted database from OPFS');
                } catch (error) {
                    console.warn('Error deleting database from OPFS:', error);
                    opfsDeleted = false;
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
                const deleteRequest = store.delete(hashedMasterKey);

                deleteRequest.onsuccess = () => {
                    //console.log('Database deleted successfully from IndexedDB');
                    resolve(true);
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

        //console.log(`Database deletion results - OPFS: ${opfsDeleted}, IndexedDB: ${indexedDBDeleted}`);
        return opfsDeleted && indexedDBDeleted;
    }
    // Deletes all databases and clears localStorage.
    static async deleteAllDatabases() {
        //console.log('🗑️ Starting deletion of all data');

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
            encrypted: Array.from(new Uint8Array(encryptedData)),
            iv: Array.from(iv)
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

            const key = await this.generateKey(masterkey);
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: new Uint8Array(parsedData.iv) },
                key,
                new Uint8Array(parsedData.encrypted)
            );

            const result = new TextDecoder().decode(decrypted);
            //console.log('Decryption successful');
            return result;

        } catch (error) {
            //console.log('Decryption failed:', error.message);
            return '';
        }
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

            // If decryption failed (empty string), return the original raw value as fallback
            if (decrypted === '') return existing;
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
                    insights_enabled: 'false',
                    visualModel: ''
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
                        insights_enabled: 'false'
                    };
                }

                const result = sqlDb.exec(`
                SELECT system_prompt, model, context_size, insights_enabled, visual_model
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

                    const [systemPromptStr, modelStr, contextSizeStr, insightsEnabledStr] = result[0].values[0];

                    let systemPrompt = '';
                    let model = '';
                    let contextSize = '8192';
                    let insightsEnabled = 'false';
                    let visualModel = '';

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
                        }

                        // Decrypt context size if it exists
                        if (contextSizeStr) {
                            const encryptedSize = JSON.parse(contextSizeStr);
                            contextSize = await this.decrypt(hashedMasterKey, encryptedSize);
                        }

                        // ALWAYS decrypt and load insights_enabled without any conditions
                        if (insightsEnabledStr) {
                            const encryptedInsights = JSON.parse(insightsEnabledStr);
                            insightsEnabled = await this.decrypt(hashedMasterKey, encryptedInsights);
                        }

                        // Decrypt visual model if it exists
                        if (visualModelStr) {
                            const encryptedVisualModel = JSON.parse(visualModelStr);
                            visualModel = await this.decrypt(hashedMasterKey, encryptedVisualModel);
                        }
                    } catch (decryptError) {
                        //console.log('Using default values due to decryption error:', decryptError);
                    }

                    sqlDb.close(); // Close the database connection

                    // Store model in localStorage for faster access (especially for startup)
                    if (model) {
                        // Try to store securely; fallback to plaintext if unavailable
                        try { await this.secureLocalStorageSet('selectedModel', model); } catch (e) { localStorage.setItem('selectedModel', model); }
                    }

                    return {
                        systemPrompt,
                        model,
                        contextSize,
                        insights_enabled: insightsEnabled,
                        visualModel
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
                insights_enabled: 'false',
                visualModel: ''
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                systemPrompt: '',
                model: '',
                contextSize: '8192',
                insights_enabled: 'false',
                visualModel: ''
            };
        }
    }

    // Saves the selected model to the database and localStorage.
    static async saveModel(hashedMasterKey, model) {
            //console.log('Save model operation started:', { hashedMasterKey, model: model || 'empty' });

        try {
            // Always store selected model in localStorage for fast access during startup
            try { await this.secureLocalStorageSet('selectedModel', model); } catch (e) { localStorage.setItem('selectedModel', model); }

            // Get SQL.js if not already loaded
            if (!this.SQL) {
                //console.log('Initializing SQL.js for saveModel');
                this.SQL = await initSqlJs({
                    locateFile: file => `/core/js/libraries/SQLjs/${file}`
                });
            }

            //console.log('Encrypting model with key:', hashedMasterKey);
            const encryptedModel = await this.encrypt(hashedMasterKey, model);

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
                SET model = ?
                WHERE masterkey_hash = ?
            `, [JSON.stringify(encryptedModel), hashedMasterKey]);

            // Export the database
            const dbExport = sqlDb.export();

            // Save to both OPFS and IndexedDB using our enhanced method
            //console.log('Saving updated database with model');
            await this.saveToStorage(dbExport, hashedMasterKey);

            //console.log('Model saved successfully for masterkey:', hashedMasterKey);
            return true;
        } catch (error) {
            console.error('Error saving model:', error);
            return false;
        }
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
            if (!existingDb) {
                console.error('No database found for masterkey:', hashedMasterKey);
                return false;
            }

            // Update the database
            const sqlDb = new this.SQL.Database(existingDb);
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
    static async storeConversationOnly(hashedMasterKey, userMessage, aiMessage, forceNewGroup = false, targetGroup = null) {
        //console.log("Storing conversation with OPFS/IndexedDB compatibility");

        try {
            // Get database using our method that already handles OPFS/IndexedDB properly
            const db = await this.getDatabase(hashedMasterKey);
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

            // Determine conversation group (existing code)
            let conversationGroup = 1; // Default to group 1
            let previousMaxGroup = 0;

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

            // Store the AI message exactly as is - no pre-processing
            // This ensures HTML structure and formatting are preserved exactly
            let processedAiMessage = aiMessage; // Store the HTML exactly as received
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(aiMessage, 'text/html');

                // Find all code blocks
                const codeBlocks = doc.querySelectorAll('.code-block code');

                codeBlocks.forEach(codeElement => {
                    // If there's no data-saved-code attribute but there is formatted code,
                    // add the formatted code as a data attribute
                    if (!codeElement.hasAttribute('data-saved-code') && codeElement.textContent.trim()) {
                        // Extract the indented, formatted code from the HTML
                        let formattedCode = codeElement.textContent;
                        // Store it in the data-saved-code attribute
                        codeElement.setAttribute('data-saved-code', formattedCode);
                    }
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
                    imageData = window.selectedImages.map(img => ({
                        src: img,
                        thumbnail: img
                    }));
                } else if (window.selectedImage) {
                    imageData = [{
                        src: window.selectedImage,
                        thumbnail: window.selectedImage
                    }];
                }

                // If we have images, create a structured object
                if (imageData.length > 0) {
                    processedUserMessage = {
                        text: processedUserMessage,
                        images: imageData
                    };

                    // Convert to JSON string for storage
                    processedUserMessage = JSON.stringify(processedUserMessage);
                }
            }

            // Use separate timestamps with sufficient difference for proper ordering
            const baseTime = new Date();

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
                (conversation, timestamp, role, conversation_group)
                VALUES (?, ?, ?, ?)`,
                [
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
                (conversation, timestamp, role, conversation_group)
                VALUES (?, ?, ?, ?)`,
                [
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
            return true;
        } catch (error) {
            console.error('Error storing conversation:', error);
            return false;
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

            // IMPORTANT: Make sure we explicitly select conversation_group
            const queryResult = db.exec(`
                SELECT conversation, timestamp, role, conversation_group
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
                const conversation = row[0];
                const timestamp = row[1];
                const role = row[2];
                const group = row[3] || 1; // Default to 1 if null

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
                            images = parsedMessage.images || [];
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
                                ` event.preventDefault(); const responseDiv = this.closest('.assistant-message').querySelector('.ai-response-container'); if (!responseDiv) { console.error('Cannot find response container for copying'); return false; } // Method 1: Try using streamProcessor if available if (responseDiv.streamProcessor && typeof responseDiv.streamProcessor.copyFullResponse === 'function') { responseDiv.streamProcessor.copyFullResponse(); } // Method 2: Fallback if no streamProcessor - copy the HTML without action buttons else { // Create a clone of the content to avoid modifying the original const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseDiv.innerHTML; // Remove any action buttons from the copy const actionButtons = tempDiv.querySelectorAll('.message-actions, .copy-response-container'); actionButtons.forEach(el => el.remove()); // Also remove any cancel notes const cancelNotes = tempDiv.querySelectorAll('.cancel-note'); cancelNotes.forEach(el => el.remove()); // Get clean text content const cleanText = tempDiv.textContent.trim(); // Copy to clipboard navigator.clipboard.writeText(cleanText) .then(() => { // Show copied confirmation this.textContent = 'Copied!'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }) .catch(err => { console.error('Failed to copy text:', err); this.textContent = 'Error'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }); } return false; `
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
                                <a href="#" class="copy-btn" style="color: inherit; text-decoration: none; cursor: pointer;" onclick="event.preventDefault(); const responseDiv = this.closest('.assistant-message').querySelector('.ai-response-container'); if (!responseDiv) { console.error('Cannot find response container for copying'); return false; } if (responseDiv.streamProcessor && typeof responseDiv.streamProcessor.copyFullResponse === 'function') { responseDiv.streamProcessor.copyFullResponse(); } else { const tempDiv = document.createElement('div'); tempDiv.innerHTML = responseDiv.innerHTML; const actionButtons = tempDiv.querySelectorAll('.message-actions, .copy-response-container'); actionButtons.forEach(el => el.remove()); const cancelNotes = tempDiv.querySelectorAll('.cancel-note'); cancelNotes.forEach(el => el.remove()); const cleanText = tempDiv.textContent.trim(); navigator.clipboard.writeText(cleanText).then(() => { this.textContent = 'Copied!'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }).catch(err => { console.error('Failed to copy text:', err); this.textContent = 'Error'; setTimeout(() => { this.textContent = 'Copy'; }, 2000); }); } return false;">${Lang.get("copy") || "Copy"}</a>
                            </div>`;

                            processedMessage = `<div class="ai-response-container">${processedMessage}${copyContainer}</div>`;
                        }
                    }
                }

                conversations.push({
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

            // Query for conversations in the specified group
            const queryResult = db.exec(`
                SELECT conversation, timestamp, role, conversation_group
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
                const conversation = row[0];
                const timestamp = row[1];
                const role = row[2];

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
                            images = parsedMessage.images || [];
                        }
                    } catch (e) {
                        // Not JSON, use as-is
                    }
                } else if (decryptedRole === "assistant") {
                    // Process message for display
                    processedMessage = this.processMarkdownLinksInHtml(processedMessage);
                }

                conversations.push({
                    message: processedMessage,
                    timestamp: decryptedTimestamp,
                    role: decryptedRole,
                    isContainer: decryptedRole === "assistant",
                    conversation_group: groupId,
                    images: images
                });
            }

            // Log a summary of retrieved data
            //console.log(`Successfully loaded ${conversations.length} messages for group ${groupId}`);

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
    static async deleteConversationPair(hashedMasterKey, userContent, assistantContent) {
        //console.log('🗑️ Enhanced deletion of conversation pair with multi-strategy matching');

        try {
            const db = await this.getDatabase(hashedMasterKey);
            if (!db) {
                console.error('❌ Database not found for masterkey:', hashedMasterKey);
                throw new Error('Database not found');
            }

            // Get all conversations for analysis
            const conversationsResult = db.exec(`
            SELECT rowid, conversation, role, timestamp, conversation_group
            FROM conversations_${hashedMasterKey}
            ORDER BY timestamp ASC
        `);

            if (!conversationsResult[0]?.values) {
                //console.log('❌ No conversations found in database');
                return false;
            }

            //console.log(`🔍 Found ${conversationsResult[0].values.length} conversations to check`);

            // Separate user and assistant messages with enhanced content extraction
            const userMessages = [];
            const assistantMessages = [];

            for (const [rowid, encryptedConversation, encryptedRole, encryptedTimestamp, conversationGroup] of conversationsResult[0].values) {
                try {
                    const decryptedRole = await this.decrypt(hashedMasterKey, JSON.parse(encryptedRole));
                    const decryptedMessage = await this.decrypt(hashedMasterKey, JSON.parse(encryptedConversation));
                    const decryptedTimestamp = await this.decrypt(hashedMasterKey, JSON.parse(encryptedTimestamp));

                    //  ENHANCED: Multiple content representations for better matching
                    let cleanContent = decryptedMessage.trim();
                    let jsonTextContent = null;
                    let rawContent = decryptedMessage;

                    if (decryptedRole === "user") {
                        // Try to extract text from JSON format (messages with images)
                        try {
                            const parsedMessage = JSON.parse(decryptedMessage);
                            if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text !== undefined) {
                                jsonTextContent = parsedMessage.text.trim();
                                //console.log(`📄 Found JSON user message: "${jsonTextContent.substring(0, 50)}..."`);
                            }
                        } catch (e) {
                            // Not JSON, use text as-is
                        }

                        userMessages.push({
                            rowid,
                            content: cleanContent,
                            jsonTextContent,
                            rawContent,
                            timestamp: decryptedTimestamp,
                            conversationGroup: conversationGroup || 1
                        });
                    } else if (decryptedRole === "assistant") {
                        // For assistant messages, clean up HTML/markdown for comparison
                        let cleanAssistantContent = cleanContent;

                        // Remove HTML tags for text comparison
                        try {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = cleanContent;
                            cleanAssistantContent = tempDiv.textContent || tempDiv.innerText || cleanContent;
                        } catch (e) {
                            // Keep original if HTML parsing fails
                        }

                        assistantMessages.push({
                            rowid,
                            content: cleanAssistantContent.trim(),
                            rawContent,
                            timestamp: decryptedTimestamp,
                            conversationGroup: conversationGroup || 1
                        });
                    }
                } catch (err) {
                    console.error('❌ Error decrypting message:', err);
                }
            }

            //console.log(`📊 Parsed messages - Users: ${userMessages.length}, Assistants: ${assistantMessages.length}`);

            //  ENHANCED: Multi-strategy user message matching
            let bestUserMatch = null;
            if (userContent && userContent.trim()) {
                const targetUserContent = userContent.trim();
                //console.log(`🎯 Looking for user message: "${targetUserContent.substring(0, 50)}..."`);

                // Strategy 1: Exact text match
                bestUserMatch = userMessages.find(msg => msg.content === targetUserContent);
                if (bestUserMatch) //console.log('✅ User match: Exact text match');

                // Strategy 2: JSON text content match (for messages with images)
                if (!bestUserMatch) {
                    bestUserMatch = userMessages.find(msg =>
                        msg.jsonTextContent && msg.jsonTextContent === targetUserContent
                    );
                    //if (bestUserMatch) //console.log('✅ User match: JSON text content match');
                }

                // Strategy 3: Content inclusion (either direction)
                if (!bestUserMatch) {
                    bestUserMatch = userMessages.find(msg =>
                        targetUserContent.includes(msg.content) ||
                        msg.content.includes(targetUserContent) ||
                        (msg.jsonTextContent && (targetUserContent.includes(msg.jsonTextContent) || msg.jsonTextContent.includes(targetUserContent)))
                    );
                    //if (bestUserMatch) //console.log('✅ User match: Content inclusion match');
                }

                // Strategy 4: Fuzzy word matching (50%+ word overlap)
                if (!bestUserMatch) {
                    const targetWords = targetUserContent.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                    let bestScore = 0;

                    for (const msg of userMessages) {
                        const contentToCheck = msg.jsonTextContent || msg.content;
                        const msgWords = contentToCheck.toLowerCase().split(/\s+/).filter(w => w.length > 2);

                        if (targetWords.length > 0 && msgWords.length > 0) {
                            const intersection = targetWords.filter(word => msgWords.includes(word));
                            const score = intersection.length / Math.min(targetWords.length, msgWords.length);

                            if (score > bestScore && score >= 0.5) {
                                bestScore = score;
                                bestUserMatch = msg;
                            }
                        }
                    }
                    //if (bestUserMatch) //console.log(`✅ User match: Fuzzy match (${(bestScore * 100).toFixed(1)}% similarity)`);
                }
            }

            //  ENHANCED: Multi-strategy assistant message matching
            let bestAssistantMatch = null;
            if (assistantContent && assistantContent.trim()) {
                const targetAssistantContent = assistantContent.trim();
                //console.log(`🎯 Looking for assistant message: "${targetAssistantContent.substring(0, 50)}..."`);

                // Strategy 1: Exact text match
                bestAssistantMatch = assistantMessages.find(msg => msg.content === targetAssistantContent);
                //if (bestAssistantMatch) console.log('✅ Assistant match: Exact text match');

                // Strategy 2: Content inclusion (either direction)
                if (!bestAssistantMatch) {
                    bestAssistantMatch = assistantMessages.find(msg =>
                        targetAssistantContent.includes(msg.content) || msg.content.includes(targetAssistantContent)
                    );
                    //if (bestAssistantMatch) console.log('✅ Assistant match: Content inclusion match');
                }

                // Strategy 3: Fuzzy word matching
                if (!bestAssistantMatch) {
                    const targetWords = targetAssistantContent.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                    let bestScore = 0;

                    for (const msg of assistantMessages) {
                        const msgWords = msg.content.toLowerCase().split(/\s+/).filter(w => w.length > 2);

                        if (targetWords.length > 0 && msgWords.length > 0) {
                            const intersection = targetWords.filter(word => msgWords.includes(word));
                            const score = intersection.length / Math.min(targetWords.length, msgWords.length);

                            if (score > bestScore && score >= 0.3) { // Lower threshold for assistant content
                                bestScore = score;
                                bestAssistantMatch = msg;
                            }
                        }
                    }
                    //if (bestAssistantMatch) console.log(`✅ Assistant match: Fuzzy match (${(bestScore * 100).toFixed(1)}% similarity)`);
                }
            }

            //  ENHANCED: Smart pairing with conversation group awareness
            const rowsToDelete = new Set();

            if (bestUserMatch) {
                //console.log(`✅ Found user message to delete (Group ${bestUserMatch.conversationGroup}): "${bestUserMatch.content.substring(0, 50)}..."`);
                rowsToDelete.add(bestUserMatch.rowid);

                // Find corresponding assistant message in the same group
                if (!bestAssistantMatch) {
                    const userTime = new Date(bestUserMatch.timestamp).getTime();

                    // Look for assistant message in same group that came after this user message
                    const candidateAssistants = assistantMessages.filter(msg =>
                        msg.conversationGroup === bestUserMatch.conversationGroup
                    );

                    let closestAssistant = null;
                    let closestDiff = Infinity;

                    for (const msg of candidateAssistants) {
                        const msgTime = new Date(msg.timestamp).getTime();
                        const timeDiff = msgTime - userTime; // Assistant should come after user

                        if (timeDiff > 0 && timeDiff < closestDiff && timeDiff < 60000) { // Within 1 minute
                            closestDiff = timeDiff;
                            closestAssistant = msg;
                        }
                    }

                    if (closestAssistant) {
                        //console.log(`✅ Found paired assistant message by timestamp in group ${bestUserMatch.conversationGroup}`);
                        rowsToDelete.add(closestAssistant.rowid);
                    }
                }
            }

            if (bestAssistantMatch) {
                //console.log(`✅ Found assistant message to delete (Group ${bestAssistantMatch.conversationGroup}): "${bestAssistantMatch.content.substring(0, 50)}..."`);
                rowsToDelete.add(bestAssistantMatch.rowid);

                // Find corresponding user message in the same group
                if (!bestUserMatch) {
                    const assistantTime = new Date(bestAssistantMatch.timestamp).getTime();

                    // Look for user message in same group that came before this assistant message
                    const candidateUsers = userMessages.filter(msg =>
                        msg.conversationGroup === bestAssistantMatch.conversationGroup
                    );

                    let closestUser = null;
                    let closestDiff = Infinity;

                    for (const msg of candidateUsers) {
                        const msgTime = new Date(msg.timestamp).getTime();
                        const timeDiff = assistantTime - msgTime; // User should come before assistant

                        if (timeDiff > 0 && timeDiff < closestDiff && timeDiff < 60000) { // Within 1 minute
                            closestDiff = timeDiff;
                            closestUser = msg;
                        }
                    }

                    if (closestUser) {
                        //console.log(`✅ Found paired user message by timestamp in group ${bestAssistantMatch.conversationGroup}`);
                        rowsToDelete.add(closestUser.rowid);
                    }
                }
            }

            //  EXECUTE DELETION
            let deletedCount = 0;
            //console.log(`🗑️ Attempting to delete ${rowsToDelete.size} messages`);

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
                //console.log(`💾 Successfully deleted ${deletedCount} messages, saving to storage`);
                await this.saveToStorage(db.export(), hashedMasterKey);
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

            const collectionStr = JSON.stringify(collection);
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

            // Save changes using our unified method (OPFS for Chrome, IndexedDB for all browsers)
            await this.saveToStorage(db.export(), hashedMasterKey);
            //console.log(`Knowledge collection ${collectionId} deleted successfully`);
            return true;
        } catch (error) {
            console.error('Error deleting knowledge collection:', error);
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

                                // Get the code content - try multiple sources
                                let cleanCode = codeElement.dataset.cleanCode ||
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
                        // Get the raw code
                        const rawCode = codeElement.dataset.cleanCode || codeElement.textContent;

                        // Create a preservation element to store the raw text
                        const preserveSpan = doc.createElement('span');
                        preserveSpan.className = 'preserve-formatting';
                        preserveSpan.style.display = 'none';
                        preserveSpan.textContent = rawCode;

                        // Append the preservation element
                        codeElement.appendChild(preserveSpan);

                        // Set the data attribute
                        codeElement.dataset.cleanCode = rawCode;
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
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            // Get total database size
            const exportedDb = db.export();
            const totalSizeInBytes = exportedDb.length;

            // Get document count (guard if table doesn't exist yet)
            let documentCount = 0;
            try {
                const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='documents_${hashedMasterKey}'`);
                const docTableExists = tableCheck && tableCheck.length > 0 && tableCheck[0]?.values.length > 0;
                if (docTableExists) {
                    const docResult = db.exec(`SELECT COUNT(*) FROM documents_${hashedMasterKey}`);
                    documentCount = docResult[0]?.values[0][0] || 0;
                } else {
                    documentCount = 0;
                }
            } catch (e) {
                console.warn('Error checking documents table existence:', e);
                documentCount = 0;
            }

            // Get chunk count (guard if table doesn't exist yet)
            let chunkCount = 0;
            try {
                const chunkTableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='document_chunks_${hashedMasterKey}'`);
                const chunkTableExists = chunkTableCheck && chunkTableCheck.length > 0 && chunkTableCheck[0]?.values.length > 0;
                if (chunkTableExists) {
                    const chunkResult = db.exec(`SELECT COUNT(*) FROM document_chunks_${hashedMasterKey}`);
                    chunkCount = chunkResult[0]?.values[0][0] || 0;
                } else {
                    chunkCount = 0;
                }
            } catch (e) {
                console.warn('Error checking document_chunks table existence:', e);
                chunkCount = 0;
            }

            // Check for orphaned chunks (chunks with no parent document) - guard if either table is missing
            let orphanedCount = 0;
            try {
                const bothExist = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='document_chunks_${hashedMasterKey}'`);
                const bothExist2 = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='documents_${hashedMasterKey}'`);
                const haveBoth = bothExist && bothExist.length > 0 && bothExist[0]?.values.length > 0 && bothExist2 && bothExist2.length > 0 && bothExist2[0]?.values.length > 0;
                if (haveBoth) {
                    const orphanedResult = db.exec(`
        SELECT COUNT(*) FROM document_chunks_${hashedMasterKey} dc
        LEFT JOIN documents_${hashedMasterKey} d ON dc.document_id = d.document_id
        WHERE d.document_id IS NULL
      `);
                    orphanedCount = orphanedResult[0]?.values[0][0] || 0;
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
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            // Get size before cleanup
            const beforeExport = db.export();
            const beforeSize = beforeExport.length;

            // Count orphaned chunks before cleanup
            const beforeResult = db.exec(`
             SELECT COUNT(*) FROM document_chunks_${hashedMasterKey} dc
             LEFT JOIN documents_${hashedMasterKey} d ON dc.document_id = d.document_id
             WHERE d.document_id IS NULL
           `);
            const beforeCount = beforeResult[0]?.values[0][0] || 0;

            // Delete orphaned chunks
            if (beforeCount > 0) {
                db.exec(`
             DELETE FROM document_chunks_${hashedMasterKey}
             WHERE document_id NOT IN (
               SELECT document_id FROM documents_${hashedMasterKey}
             )
           `);

                // Save changes to database
                await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);

                // Get new size after cleanup
                const afterExport = db.export();
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
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                throw new Error(Lang.get("databaseNotAvailable") || "Database not available");
            }

            // Get size before vacuum
            const beforeExport = db.export();
            const beforeSize = beforeExport.length;

            // Run VACUUM command
            db.exec('VACUUM');

            // Get new size after vacuum
            const afterExport = db.export();
            const afterSize = afterExport.length;

            // Save the optimized database
            await PaiperworkDB.saveToStorage(afterExport, hashedMasterKey);

            return {
                sizeBeforeOptimize: this.formatFileSize(beforeSize),
                sizeAfterOptimize: this.formatFileSize(afterSize),
                bytesSaved: beforeSize - afterSize,
                savedFormatted: this.formatFileSize(beforeSize - afterSize),
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

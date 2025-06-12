class SecurityUtils {
    static PROTECTION_KEY = 'database_protection_password';

    // Verifies that the database has been deleted from primary storage (OPFS or IndexedDB)
    static async verifyDatabaseDeletion() {
        //console.log('🔍 Verifying database deletion...');

        let primaryStorageHasData = false;

        // Check the primary storage that should be in use
        if (PaiperworkDB.opfsSupported && !PaiperworkDB.useIndexedDBOnly) {
            //console.log('🔍 Checking OPFS (primary storage)...');
            try {
                const root = await navigator.storage.getDirectory();
                try {
                    const dbDir = await root.getDirectoryHandle('PaiperworkDB', { create: false });
                    let fileCount = 0;
                    for await (const [name, handle] of dbDir.entries()) {
                        if (name.endsWith('.db')) {
                            fileCount++;
                            //console.log(`🔍 Found remaining OPFS file: ${name}`);
                        }
                    }
                    primaryStorageHasData = fileCount > 0;
                    //console.log(`🔍 OPFS verification: ${fileCount} .db files found`);
                } catch (error) {
                    if (error.name === 'NotFoundError') {
                        //console.log('🔍 OPFS: PaiperworkDB directory not found (good)');
                    } else {
                        console.warn('🔍 OPFS verification error:', error);
                    }
                }
            } catch (error) {
                console.warn('🔍 OPFS root access error:', error);
            }
        } else {
            //console.log('🔍 Checking IndexedDB (primary storage)...');
            try {
                primaryStorageHasData = await new Promise((resolve) => {
                    const request = indexedDB.open('PaiperworkDB');

                    request.onsuccess = (event) => {
                        const db = event.target.result;
                        const hasStore = db.objectStoreNames.contains('databases');
                        //console.log(`🔍 IndexedDB verification: databases store exists = ${hasStore}`);
                        db.close();
                        resolve(hasStore);
                    };

                    request.onerror = () => {
                        //console.log('🔍 IndexedDB verification: database does not exist (good)');
                        resolve(false);
                    };

                    request.onupgradeneeded = (event) => {
                        //console.log('🔍 IndexedDB verification: database being created (means it was deleted)');
                        event.target.result.close();
                        resolve(false);
                    };
                });
            } catch (error) {
                console.warn('🔍 IndexedDB verification error:', error);
            }
        }

        const deletionSuccessful = !primaryStorageHasData;
        //console.log(`🔍 Verification complete - Data actually deleted: ${deletionSuccessful}`);

        return {
            successful: deletionSuccessful,
            primaryStorageHasData
        };
    }
    // Allows the user to manually reset the protection password, verifying the current password if set
    static async resetProtectionPassword() {
        const currentPassword = localStorage.getItem(this.PROTECTION_KEY);

        if (currentPassword) {
            // Verify current password first
            const verified = await this.verifyProtectionPassword();
            if (!verified) {
                return false;
            }
        }

        // Set up new password
        const success = await this.setupProtectionPassword();
        if (success) {
            alert(Lang.get('securityPasswordUpdatedSuccess'));
        }
        return success;
    }

    // Checks if a protection password is currently set in localStorage
    static hasProtectionPassword() {
        return this.validateStoredPassword() !== null;
    }

    // Prompts the user to set up a new protection password and stores its hash and salt
    static async setupProtectionPassword() {
        return new Promise((resolve) => {
            const modal = this.createPasswordModal(
                Lang.get('securitySetupPasswordTitle'),
                Lang.get('securitySetupPasswordMessage'),
                true
            );

            const handleSetup = async (password, confirmPassword) => {
                if (password !== confirmPassword) {
                    alert(Lang.get('securityPasswordsNoMatch'));
                    return false;
                }

                if (password.length < 6) {
                    alert(Lang.get('securityPasswordTooShort'));
                    return false;
                }

                try {
                    const { hash, salt } = await this.hashPassword(password);
                    localStorage.setItem(this.PROTECTION_KEY, JSON.stringify({ hash, salt }));

                    document.body.removeChild(modal);
                    alert(Lang.get('securityPasswordSetSuccess'));
                    resolve(true);
                    return true;
                } catch (error) {
                    console.error('Error setting up protection password:', error);
                    alert(Lang.get('securityPasswordSetupError'));
                    resolve(false);
                    return false;
                }
            };

            const handleCancel = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            this.attachModalEventHandlers(modal, handleSetup, handleCancel, true);
            document.body.appendChild(modal);
            modal.querySelector('#protection-password').focus();
        });
    }

    // Prompts the user to verify the protection password and checks it against the stored hash
    static async verifyProtectionPassword() {
        return new Promise((resolve) => {
            const modal = this.createPasswordModal(
                Lang.get('securityVerifyPasswordTitle'),
                Lang.get('securityVerifyPasswordMessage'),
                false
            );

            const handleVerification = async (password) => {
                try {
                    const storedPasswordData = this.validateStoredPassword();
                    
                    if (!storedPasswordData) {
                        console.error('🔒 No valid stored password found during verification');
                        alert(Lang.get('securityPasswordNotFound'));
                        document.body.removeChild(modal);
                        resolve(false);
                        return false;
                    }

                    // Use the same hashing method with the stored salt
                    const { hash: enteredHash } = await this.hashPassword(password, storedPasswordData.salt);

                    if (enteredHash === storedPasswordData.hash) {
                        document.body.removeChild(modal);
                        resolve(true);
                        return true;
                    } else {
                        alert(Lang.get('securityIncorrectPassword'));
                        modal.querySelector('#protection-password').value = '';
                        modal.querySelector('#protection-password').focus();
                        return false;
                    }
                } catch (error) {
                    console.error('Error verifying protection password:', error);
                    alert(Lang.get('securityVerifyPasswordError'));
                    resolve(false);
                    return false;
                }
            };

            const handleCancel = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            this.attachModalEventHandlers(modal, handleVerification, handleCancel, false);
            document.body.appendChild(modal);
            modal.querySelector('#protection-password').focus();
        });
    }

    // Creates and returns a modal dialog for password entry/setup with appropriate UI
    static createPasswordModal(title, message, isSetup = false) {
        const modal = document.createElement('div');
        modal.className = 'password-modal-overlay';
        modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

        // Check if there's an existing password for reset functionality
        const hasExistingPassword = !!localStorage.getItem(this.PROTECTION_KEY);

        modal.innerHTML = `
        <div class="password-modal-content" style="
            background-color: var(--bg-color);
            color: var(--text-color);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 450px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        ">
            <h3 style="margin: 0; color: var(--danger-color); text-align: center; font-size: 18px; font-weight: 600;">${title}</h3>
            <p style="margin: 0; color: var(--text-color); text-align: center; line-height: 1.5;">${message}</p>
            
            <div class="password-input-wrapper" style="position: relative; display: flex; align-items: center;">
                <input type="password" id="protection-password" placeholder="${Lang.get('securityEnterPasswordPlaceholder')}" style="
                    padding: 12px 40px 12px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    background-color: var(--input-bg);
                    color: var(--text-color);
                    font-size: 14px;
                    width: 100%;
                    box-sizing: border-box;
                ">
                <button type="button" class="password-toggle" id="password-toggle-1" style="
                    position: absolute;
                    right: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
                    color: var(--text-muted);
                    font-size: 14px;
                    z-index: 2;
                " title="Show password">👁️</button>
            </div>
            
            ${isSetup ? `
            <div class="password-input-wrapper" style="position: relative; display: flex; align-items: center;">
                <input type="password" id="confirm-protection-password" placeholder="${Lang.get('securityConfirmPasswordPlaceholder')}"style="
                    padding: 12px 40px 12px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    background-color: var(--input-bg);
                    color: var(--text-color);
                    font-size: 14px;
                    width: 100%;
                    box-sizing: border-box;
                ">
                <button type="button" class="password-toggle" id="password-toggle-2" style="
                    position: absolute;
                    right: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
                    color: var(--text-muted);
                    font-size: 14px;
                    z-index: 2;
                " title="${Lang.get('securityShowPassword')}">👁️</button>
            </div>
            ` : ''}
            
            <div style="display: flex; gap: 8px; margin-top: 8px; ${!isSetup && hasExistingPassword ? 'flex-wrap: wrap;' : ''}">
                <button class="cancel-password-btn" style="
                    ${!isSetup && hasExistingPassword ? 'flex: 1; min-width: calc(50% - 4px);' : 'flex: 1;'}
                    padding: 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    background-color: transparent;
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                ">${Lang.get('cancel')}</button>
                <button class="confirm-password-btn" style="
                    ${!isSetup && hasExistingPassword ? 'flex: 1; min-width: calc(50% - 4px);' : 'flex: 1;'}
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    background-color: #dc2626;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                ">${isSetup ? Lang.get('securitySetPassword') : Lang.get('securityVerify')}</button>
                ${!isSetup && hasExistingPassword ? `
                <button class="reset-password-btn" style="
                    width: 100%;
                    margin-top: 8px;
                    padding: 12px;
                    border: 2px solid #f59e0b;
                    border-radius: 6px;
                    background-color: transparent;
                    color: #f59e0b;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                ">${Lang.get('securityResetPassword')}</button>
                ` : ''}
            </div>
        </div>
    `;

        return modal;
    }

    // Attaches event handlers to the password modal for actions, toggles, and keyboard shortcuts
    static attachModalEventHandlers(modal, handleAction, handleCancel, isSetup) {
        const confirmBtn = modal.querySelector('.confirm-password-btn');
        const cancelBtn = modal.querySelector('.cancel-password-btn');
        const resetBtn = modal.querySelector('.reset-password-btn');
        const passwordInput = modal.querySelector('#protection-password');
        const confirmPasswordInput = modal.querySelector('#confirm-protection-password');

        // Add password toggle functionality
        const setupPasswordToggle = (inputId, toggleId) => {
            const input = modal.querySelector(`#${inputId}`);
            const toggle = modal.querySelector(`#${toggleId}`);

            if (input && toggle) {
                toggle.addEventListener('click', () => {
                    if (input.type === 'password') {
                        input.type = 'text';
                        toggle.textContent = '👁️‍🗨️'; // Eye with speech bubble (hide)
                        toggle.title = Lang.get('securityHidePassword');
                        toggle.style.color = 'var(--text-color)';
                    } else {
                        input.type = 'password';
                        toggle.textContent = '👁️'; // Eye (show)
                        toggle.title = Lang.get('securityShowPassword');
                        toggle.style.color = 'var(--text-muted)';
                    }
                });

                // Hover effect for password toggle
                toggle.addEventListener('mouseenter', () => {
                    toggle.style.color = 'var(--text-color)';
                });

                toggle.addEventListener('mouseleave', () => {
                    if (input.type === 'password') {
                        toggle.style.color = 'var(--text-muted)';
                    }
                });
            }
        };

        // Setup toggles for both password fields
        setupPasswordToggle('protection-password', 'password-toggle-1');
        if (isSetup) {
            setupPasswordToggle('confirm-protection-password', 'password-toggle-2');
        }
        // Confirm button handler
        confirmBtn.onclick = () => {
            const password = passwordInput.value;
            if (isSetup) {
                const confirmPassword = confirmPasswordInput.value;
                handleAction(password, confirmPassword);
            } else {
                handleAction(password);
            }
        };

        // Cancel button handler
        cancelBtn.onclick = handleCancel;

        // Reset password button handler (only available in verification mode)
        if (resetBtn) {
            resetBtn.onclick = async () => {
                // Close current modal
                document.body.removeChild(modal);

                // In verification mode, manually verify current password then setup new one
                const enteredPassword = passwordInput.value;

                if (!enteredPassword) {
                    alert(Lang.get('securityEnterCurrentPasswordFirst'));

                    const newModal = this.createPasswordModal(
                        Lang.get('securityVerifyPasswordTitle'),
                        Lang.get('securityVerifyPasswordMessage'),
                        false
                    );
                    this.attachModalEventHandlers(newModal, handleAction, handleCancel, false);
                    document.body.appendChild(newModal);
                    newModal.querySelector('#protection-password').focus();
                    return;
                }

                try {
                    // Verify the entered password
                    const storedData = JSON.parse(localStorage.getItem(this.PROTECTION_KEY));
                    const { hash: enteredHash } = await this.hashPassword(enteredPassword, storedData.salt);

                    if (enteredHash === storedData.hash) {
                        // Password is correct, proceed to setup new password
                        const success = await this.setupProtectionPassword();
                        if (success) {
                            alert(Lang.get('securityPasswordUpdatedSuccess'));
                        }
                    } else {
                        alert(Lang.get('securityIncorrectCurrentPassword'));

                        const newModal = this.createPasswordModal(
                            Lang.get('securityVerifyPasswordTitle'),
                            Lang.get('securityVerifyPasswordMessage'),
                            false
                        );
                        this.attachModalEventHandlers(newModal, handleAction, handleCancel, false);
                        document.body.appendChild(newModal);
                        newModal.querySelector('#protection-password').focus();
                    }
                } catch (error) {
                    console.error('Error verifying password for reset:', error);
                    alert(Lang.get('securityVerifyPasswordError'));
                }
            };

            // Add hover effects for reset button
            resetBtn.addEventListener('mouseenter', () => {
                resetBtn.style.backgroundColor = '#f59e0b';
                resetBtn.style.color = 'white';
            });

            resetBtn.addEventListener('mouseleave', () => {
                resetBtn.style.backgroundColor = 'transparent';
                resetBtn.style.color = '#f59e0b';
            });
        }

        // Enter key handler
        const enterHandler = (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        };

        passwordInput.onkeypress = enterHandler;
        if (confirmPasswordInput) {
            confirmPasswordInput.onkeypress = enterHandler;
        }

        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                handleCancel();
            }
        };
        document.addEventListener('keydown', escHandler);

        // Hover effects for existing buttons
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.backgroundColor = 'var(--card-bg)';
        });

        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.backgroundColor = 'transparent';
        });

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.backgroundColor = '#dc2626';
        });

        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.backgroundColor = 'var(--danger-color)';
        });
    }

    // Hashes a password with a salt (generates one if not provided) using SHA-256
    static async hashPassword(password, salt = null) {
        // Generate salt if not provided
        if (!salt) {
            const saltArray = new Uint8Array(16);
            crypto.getRandomValues(saltArray);
            salt = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashHex = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return { hash: hashHex, salt: salt };
    }

    // Validates and parses the stored protection password from localStorage, removing it if invalid
    static validateStoredPassword() {
        try {
            const stored = localStorage.getItem(this.PROTECTION_KEY);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            if (!parsed || typeof parsed !== 'object' || !parsed.hash || !parsed.salt) {
                // Invalid format, remove it
                localStorage.removeItem(this.PROTECTION_KEY);
                console.warn('🔒 Invalid password format detected and removed');
                return null;
            }
            
            return parsed;
        } catch (error) {
            // Corrupted data, remove it
            localStorage.removeItem(this.PROTECTION_KEY);
            console.warn('🔒 Corrupted password data detected and removed');
            return null;
        }
    }

    // Securely deletes all databases after verifying the protection password and final confirmation
    static async deleteAllDatabasesSecurely() {
        try {
            //console.log('🔒 Starting secure database deletion process');

            // Always validate the stored password first
            const storedPasswordData = this.validateStoredPassword();

            if (!storedPasswordData) {
                //console.log('🔒 No valid protection password found, setting up new one');
                // First time - just set up protection password and exit
                const success = await this.setupProtectionPassword();
                if (success) {
                    //console.log('🔒 Protection password setup completed successfully');
                    return false; // Don't proceed with deletion, just password setup
                } else {
                    //console.log('🔒 Protection password setup cancelled or failed');
                    return false;
                }
            } else {
                //console.log('🔒 Valid protection password exists, verifying for deletion');
                // Password exists - verify it to proceed with deletion
                const success = await this.verifyProtectionPassword();
                if (!success) {
                    //console.log('🔒 Protection password verification failed');
                    return false;
                }
                //console.log('🔒 Protection password verified successfully, proceeding with deletion');
            }

            // Final confirmation before deletion (only reached if password was verified)
            //console.log('🔒 Requesting final confirmation');
            const finalConfirm = confirm(Lang.get('securityFinalDeleteWarning'));

            if (!finalConfirm) {
                //console.log('🔒 Final confirmation cancelled');
                return false;
            }

            // Show loading state if button exists
            const deleteButton = document.getElementById('delete-all');
            if (deleteButton) {
                deleteButton.disabled = true;
                deleteButton.textContent = Lang.get('securityDeleting');
                //console.log('🔒 Delete button disabled and text updated');
            }

            // Perform the deletion
            //console.log('🔒 Calling PaiperworkDB.deleteAllDatabases()');
            const success = await PaiperworkDB.deleteAllDatabases();
            //console.log(`🔒 PaiperworkDB.deleteAllDatabases() returned: ${success}`);

            if (success) {
                //console.log('✅ Database deletion reported as successful');
                alert(Lang.get('securityDataDeletedSuccess'));

                // SECURITY CHANGE: Clear ALL localStorage including protection password
                // The password should be reset after deletion for security
                //console.log('🔒 Clearing ALL localStorage including protection password');
                localStorage.clear();

                // Redirect to welcome page
                //console.log('🔒 Redirecting to welcome page');
                window.location.href = '../welcome.html';
                return true;
            } else {
                //console.log('❌ Database deletion failed');
                alert(Lang.get('securityDeleteError'));
                if (deleteButton) {
                    deleteButton.disabled = false;
                    deleteButton.textContent = Lang.get('deleteAllButton');
                    //console.log('🔒 Delete button re-enabled');
                }
                return false;
            }

        } catch (error) {
            console.error('❌ Error in secure database deletion:', error);
            alert(Lang.get('securityDeletionError'));
            return false;
        }
    }
}

window.SecurityUtils = SecurityUtils;
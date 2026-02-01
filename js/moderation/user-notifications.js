/**
 * User Moderation Notifications
 * Shows notifications to users when their content has been moderated
 * Allows users to submit appeals
 */

class ModerationNotifications {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.pendingNotifications = [];
        this.syncInterval = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Wait for Supabase
            await this.waitForSupabase();
            
            // Get current user
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;
            
            this.currentUser = user;
            this.initialized = true;
            
            // Check for pending notifications
            await this.checkNotifications();
            
            // Start silent sync every 60 seconds
            this.startSilentSync();
            
        } catch (error) {
            console.error('[ModerationNotifications] Init error:', error);
        }
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            const check = async () => {
                if (window.supabaseClientManager) {
                    try {
                        this.supabase = await window.supabaseClientManager.getClient();
                        if (this.supabase) {
                            resolve();
                            return;
                        }
                    } catch (e) {}
                }
                setTimeout(check, 100);
            };
            check();
        });
    }

    startSilentSync() {
        // Sync every 60 seconds
        this.syncInterval = setInterval(() => {
            this.checkNotifications(true); // silent mode
        }, 60000);
    }

    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async checkNotifications(silent = false) {
        if (!this.currentUser) return;

        try {
            // Get unread moderation actions for this user
            const { data: actions, error } = await this.supabase
                .from('moderation_actions')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('user_notified', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[ModerationNotifications] Error fetching:', error);
                return;
            }

            if (actions && actions.length > 0 && !silent) {
                this.pendingNotifications = actions;
                this.showNotificationModal(actions[0]); // Show first unread
            }

        } catch (error) {
            console.error('[ModerationNotifications] Check error:', error);
        }
    }

    showNotificationModal(action) {
        // Remove existing modal if any
        const existing = document.getElementById('moderationNotificationModal');
        if (existing) existing.remove();

        const actionLabels = {
            'content_deleted': 'Contenuto Rimosso',
            'content_deleted_permanent': 'Contenuto Eliminato Definitivamente',
            'content_shadowban': 'Contenuto Nascosto',
            'content_restored': 'Contenuto Ripristinato',
            'warning': 'Avvertimento',
            'suspension_24h': 'Sospensione 24 ore',
            'suspension_7d': 'Sospensione 7 giorni',
            'suspension_30d': 'Sospensione 30 giorni',
            'ban': 'Account Sospeso'
        };

        const actionIcons = {
            'content_deleted': 'fa-trash-alt',
            'content_deleted_permanent': 'fa-trash',
            'content_shadowban': 'fa-eye-slash',
            'content_restored': 'fa-undo',
            'warning': 'fa-exclamation-triangle',
            'suspension_24h': 'fa-clock',
            'suspension_7d': 'fa-calendar-week',
            'suspension_30d': 'fa-calendar-alt',
            'ban': 'fa-ban'
        };

        const actionColors = {
            'content_deleted': '#ef4444',
            'content_deleted_permanent': '#991b1b',
            'content_shadowban': '#f59e0b',
            'content_restored': '#22c55e',
            'warning': '#f59e0b',
            'suspension_24h': '#ef4444',
            'suspension_7d': '#ef4444',
            'suspension_30d': '#dc2626',
            'ban': '#991b1b'
        };

        const contentTypeLabels = {
            'post': 'post',
            'comment': 'commento'
        };

        const actionType = action.action_type || 'warning';
        const label = actionLabels[actionType] || 'Azione di Moderazione';
        const icon = actionIcons[actionType] || 'fa-info-circle';
        const color = actionColors[actionType] || '#3b82f6';
        const contentType = contentTypeLabels[action.content_type] || 'contenuto';
        const canAppeal = action.appeal_status !== 'rejected' && action.appeal_status !== 'approved';

        const modal = document.createElement('div');
        modal.id = 'moderationNotificationModal';
        modal.innerHTML = `
            <div class="mod-notif-backdrop"></div>
            <div class="mod-notif-container">
                <div class="mod-notif-content">
                    <div class="mod-notif-header">
                        <div class="mod-notif-icon" style="background: ${color}20; color: ${color};">
                            <i class="fas ${icon}"></i>
                        </div>
                        <h2>${label}</h2>
                    </div>
                    
                    <div class="mod-notif-body">
                        <p class="mod-notif-message">
                            ${this.getActionMessage(action, contentType)}
                        </p>
                        
                        ${action.reason ? `
                            <div class="mod-notif-reason">
                                <strong>Motivo:</strong>
                                <p>${this.escapeHtml(action.reason)}</p>
                            </div>
                        ` : ''}
                        
                        ${action.suspension_until ? `
                            <div class="mod-notif-suspension">
                                <i class="fas fa-clock"></i>
                                <span>Fino al: ${new Date(action.suspension_until).toLocaleDateString('it-IT', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        ` : ''}
                        
                        <div class="mod-notif-info">
                            <i class="fas fa-info-circle"></i>
                            <p>
                                Se ritieni che questa decisione sia stata presa per errore, 
                                puoi presentare un ricorso spiegando le tue ragioni. 
                                Il nostro team esaminerà la tua richiesta.
                            </p>
                        </div>
                        
                        ${canAppeal ? `
                            <div class="mod-notif-appeal-section" id="appealSection">
                                <button class="mod-notif-btn-appeal" id="showAppealFormBtn">
                                    <i class="fas fa-balance-scale"></i>
                                    Presenta Ricorso
                                </button>
                                
                                <div class="mod-notif-appeal-form" id="appealForm" style="display: none;">
                                    <label>Spiega perché ritieni che la decisione sia errata:</label>
                                    <textarea id="appealText" placeholder="Descrivi le tue ragioni..." maxlength="1000"></textarea>
                                    <div class="mod-notif-appeal-actions">
                                        <button class="mod-notif-btn-cancel" id="cancelAppealBtn">Annulla</button>
                                        <button class="mod-notif-btn-submit" id="submitAppealBtn">
                                            <i class="fas fa-paper-plane"></i>
                                            Invia Ricorso
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : action.appeal_status === 'pending' ? `
                            <div class="mod-notif-appeal-pending">
                                <i class="fas fa-hourglass-half"></i>
                                <span>Ricorso in attesa di revisione</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="mod-notif-footer">
                        <button class="mod-notif-btn-acknowledge" id="acknowledgeBtn">
                            Ho capito
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.injectStyles();
        this.attachModalEvents(modal, action);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    getActionMessage(action, contentType) {
        const messages = {
            'content_deleted': `Il tuo ${contentType} è stato rimosso perché viola le nostre linee guida della community.`,
            'content_deleted_permanent': `Il tuo ${contentType} è stato eliminato definitivamente dalla piattaforma.`,
            'content_shadowban': `Il tuo ${contentType} è stato nascosto dalla visualizzazione pubblica a causa di una violazione delle linee guida.`,
            'content_restored': `Il tuo ${contentType} è stato ripristinato e ora è nuovamente visibile.`,
            'warning': `Hai ricevuto un avvertimento per il tuo comportamento sulla piattaforma.`,
            'suspension_24h': `Il tuo account è stato temporaneamente sospeso per 24 ore.`,
            'suspension_7d': `Il tuo account è stato sospeso per 7 giorni.`,
            'suspension_30d': `Il tuo account è stato sospeso per 30 giorni.`,
            'ban': `Il tuo account è stato sospeso a tempo indeterminato.`
        };
        return messages[action.action_type] || 'È stata intrapresa un\'azione di moderazione sul tuo account.';
    }

    attachModalEvents(modal, action) {
        const backdrop = modal.querySelector('.mod-notif-backdrop');
        const acknowledgeBtn = modal.querySelector('#acknowledgeBtn');
        const showAppealBtn = modal.querySelector('#showAppealFormBtn');
        const cancelAppealBtn = modal.querySelector('#cancelAppealBtn');
        const submitAppealBtn = modal.querySelector('#submitAppealBtn');
        const appealForm = modal.querySelector('#appealForm');

        // Acknowledge and close
        acknowledgeBtn?.addEventListener('click', () => {
            this.acknowledgeNotification(action.id);
            this.closeModal(modal);
        });

        // Close on backdrop click
        backdrop?.addEventListener('click', () => {
            this.acknowledgeNotification(action.id);
            this.closeModal(modal);
        });

        // Show appeal form
        showAppealBtn?.addEventListener('click', () => {
            showAppealBtn.style.display = 'none';
            appealForm.style.display = 'block';
        });

        // Cancel appeal
        cancelAppealBtn?.addEventListener('click', () => {
            appealForm.style.display = 'none';
            showAppealBtn.style.display = 'flex';
        });

        // Submit appeal
        submitAppealBtn?.addEventListener('click', () => {
            this.submitAppeal(action.id, modal);
        });
    }

    async acknowledgeNotification(actionId) {
        try {
            await this.supabase
                .from('moderation_actions')
                .update({ 
                    user_notified: true,
                    user_notified_at: new Date().toISOString()
                })
                .eq('id', actionId);

            // Remove from pending
            this.pendingNotifications = this.pendingNotifications.filter(n => n.id !== actionId);

            // Show next notification if any
            if (this.pendingNotifications.length > 0) {
                setTimeout(() => {
                    this.showNotificationModal(this.pendingNotifications[0]);
                }, 500);
            }

        } catch (error) {
            console.error('[ModerationNotifications] Acknowledge error:', error);
        }
    }

    async submitAppeal(actionId, modal) {
        const appealText = modal.querySelector('#appealText')?.value?.trim();
        const submitBtn = modal.querySelector('#submitAppealBtn');
        
        if (!appealText) {
            this.showToast('Inserisci una motivazione per il ricorso', 'warning');
            return;
        }

        if (appealText.length < 20) {
            this.showToast('La motivazione deve essere più dettagliata (min. 20 caratteri)', 'warning');
            return;
        }

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';

        try {
            const { error } = await this.supabase
                .from('moderation_actions')
                .update({
                    appeal_status: 'pending',
                    appeal_text: appealText,
                    appeal_submitted_at: new Date().toISOString(),
                    user_notified: true,
                    user_notified_at: new Date().toISOString()
                })
                .eq('id', actionId);

            if (error) throw error;

            this.showToast('Ricorso inviato con successo! Riceverai una risposta a breve.', 'success');
            this.closeModal(modal);

            // Remove from pending
            this.pendingNotifications = this.pendingNotifications.filter(n => n.id !== actionId);

        } catch (error) {
            console.error('[ModerationNotifications] Appeal error:', error);
            this.showToast('Errore nell\'invio del ricorso. Riprova.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia Ricorso';
        }
    }

    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `mod-notif-toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    injectStyles() {
        if (document.getElementById('moderationNotificationStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'moderationNotificationStyles';
        styles.textContent = `
            #moderationNotificationModal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s, visibility 0.3s;
            }
            
            #moderationNotificationModal.active {
                opacity: 1;
                visibility: visible;
            }
            
            .mod-notif-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .mod-notif-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .mod-notif-content {
                background: #1e293b;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                overflow: hidden;
            }
            
            .mod-notif-header {
                padding: 1.5rem;
                text-align: center;
                border-bottom: 1px solid #334155;
            }
            
            .mod-notif-icon {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                font-size: 1.75rem;
            }
            
            .mod-notif-header h2 {
                color: #f1f5f9;
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0;
            }
            
            .mod-notif-body {
                padding: 1.5rem;
            }
            
            .mod-notif-message {
                color: #e2e8f0;
                font-size: 1rem;
                line-height: 1.6;
                margin: 0 0 1rem;
            }
            
            .mod-notif-reason {
                background: #0f172a;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .mod-notif-reason strong {
                color: #94a3b8;
                font-size: 0.875rem;
                display: block;
                margin-bottom: 0.5rem;
            }
            
            .mod-notif-reason p {
                color: #e2e8f0;
                margin: 0;
                font-size: 0.95rem;
            }
            
            .mod-notif-suspension {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                color: #fca5a5;
                font-size: 0.9rem;
                margin-bottom: 1rem;
            }
            
            .mod-notif-info {
                display: flex;
                gap: 0.75rem;
                padding: 1rem;
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .mod-notif-info i {
                color: #60a5fa;
                font-size: 1rem;
                margin-top: 0.125rem;
            }
            
            .mod-notif-info p {
                color: #94a3b8;
                font-size: 0.875rem;
                line-height: 1.5;
                margin: 0;
            }
            
            .mod-notif-appeal-section {
                margin-top: 1rem;
            }
            
            .mod-notif-btn-appeal {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.875rem;
                background: transparent;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                color: #3b82f6;
                font-size: 0.95rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mod-notif-btn-appeal:hover {
                background: #3b82f6;
                color: white;
            }
            
            .mod-notif-appeal-form {
                margin-top: 1rem;
            }
            
            .mod-notif-appeal-form label {
                display: block;
                color: #94a3b8;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
            }
            
            .mod-notif-appeal-form textarea {
                width: 100%;
                min-height: 120px;
                padding: 0.875rem;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                color: #e2e8f0;
                font-size: 0.95rem;
                resize: vertical;
                font-family: inherit;
            }
            
            .mod-notif-appeal-form textarea:focus {
                outline: none;
                border-color: #3b82f6;
            }
            
            .mod-notif-appeal-actions {
                display: flex;
                gap: 0.75rem;
                margin-top: 0.75rem;
            }
            
            .mod-notif-btn-cancel {
                flex: 1;
                padding: 0.75rem;
                background: transparent;
                border: 1px solid #475569;
                border-radius: 8px;
                color: #94a3b8;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mod-notif-btn-cancel:hover {
                background: #334155;
            }
            
            .mod-notif-btn-submit {
                flex: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem;
                background: #3b82f6;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mod-notif-btn-submit:hover:not(:disabled) {
                background: #2563eb;
            }
            
            .mod-notif-btn-submit:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .mod-notif-appeal-pending {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.875rem;
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 8px;
                color: #fbbf24;
                font-size: 0.9rem;
            }
            
            .mod-notif-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #334155;
            }
            
            .mod-notif-btn-acknowledge {
                width: 100%;
                padding: 0.875rem;
                background: #475569;
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mod-notif-btn-acknowledge:hover {
                background: #64748b;
            }
            
            /* Toast */
            .mod-notif-toast {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.5rem;
                background: #1e293b;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                color: white;
                font-size: 0.95rem;
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .mod-notif-toast.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            
            .mod-notif-toast.success { border-left: 4px solid #22c55e; }
            .mod-notif-toast.success i { color: #22c55e; }
            .mod-notif-toast.error { border-left: 4px solid #ef4444; }
            .mod-notif-toast.error i { color: #ef4444; }
            .mod-notif-toast.warning { border-left: 4px solid #f59e0b; }
            .mod-notif-toast.warning i { color: #f59e0b; }
            
            @media (max-width: 640px) {
                .mod-notif-container {
                    width: 95%;
                }
                
                .mod-notif-header, .mod-notif-body, .mod-notif-footer {
                    padding: 1rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize when DOM is ready
window.moderationNotifications = new ModerationNotifications();
document.addEventListener('DOMContentLoaded', () => {
    window.moderationNotifications.init();
});

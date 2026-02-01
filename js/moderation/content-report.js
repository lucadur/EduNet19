/**
 * Content Report System
 * Handles content reporting with categories per Privacy Policy §4.5 and Terms §5.3
 */

class ContentReportManager {
    constructor() {
        this.categories = [
            { id: 'cyberbullying', label: 'Cyberbullismo', icon: 'fas fa-user-slash', priority: 'high' },
            { id: 'inappropriate', label: 'Contenuto inappropriato', icon: 'fas fa-ban', priority: 'normal' },
            { id: 'spam', label: 'Spam o pubblicità', icon: 'fas fa-ad', priority: 'low' },
            { id: 'privacy', label: 'Violazione privacy', icon: 'fas fa-user-secret', priority: 'high' },
            { id: 'misinformation', label: 'Informazioni false', icon: 'fas fa-exclamation-triangle', priority: 'normal' },
            { id: 'harassment', label: 'Molestie o minacce', icon: 'fas fa-angry', priority: 'high' },
            { id: 'other', label: 'Altro', icon: 'fas fa-flag', priority: 'normal' }
        ];
        
        this.modal = null;
        this.currentReport = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        // Check if modal already exists
        if (document.getElementById('reportModal')) {
            this.modal = document.getElementById('reportModal');
            return;
        }

        const modalHtml = `
            <div id="reportModal" class="report-modal" role="dialog" aria-labelledby="report-title" aria-hidden="true">
                <div class="report-modal-backdrop"></div>
                <div class="report-modal-container">
                    <div class="report-modal-content">
                        <header class="report-modal-header">
                            <h2 id="report-title" class="report-modal-title">
                                <i class="fas fa-flag"></i>
                                Segnala Contenuto
                            </h2>
                            <button class="report-modal-close" aria-label="Chiudi">
                                <i class="fas fa-times"></i>
                            </button>
                        </header>
                        
                        <div class="report-modal-body">
                            <p class="report-intro">
                                Seleziona il motivo della segnalazione. Le segnalazioni vengono esaminate entro 24 ore.
                            </p>
                            
                            <div class="report-categories">
                                ${this.categories.map(cat => `
                                    <label class="report-category-option">
                                        <input type="radio" name="reportCategory" value="${cat.id}" data-priority="${cat.priority}">
                                        <span class="report-category-card">
                                            <i class="${cat.icon}"></i>
                                            <span>${cat.label}</span>
                                        </span>
                                    </label>
                                `).join('')}
                            </div>
                            
                            <div class="report-description-section" style="display: none;">
                                <label for="reportDescription" class="report-label">
                                    Descrivi il problema (opzionale)
                                </label>
                                <textarea 
                                    id="reportDescription" 
                                    class="report-textarea" 
                                    placeholder="Fornisci dettagli aggiuntivi che possano aiutarci a valutare la segnalazione..."
                                    maxlength="500"
                                ></textarea>
                                <div class="report-char-count">
                                    <span id="reportCharCount">0</span>/500
                                </div>
                            </div>
                            
                            <div class="report-cyberbullying-info" style="display: none;">
                                <div class="report-info-box warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <div>
                                        <strong>Segnalazione di Cyberbullismo</strong>
                                        <p>Se sei vittima di cyberbullismo o conosci qualcuno che lo è, puoi anche contattare:</p>
                                        <ul>
                                            <li><strong>Telefono Azzurro:</strong> 19696 (gratuito, attivo 24/7)</li>
                                            <li><strong>Email:</strong> <a href="mailto:cyberbullismo@edunet19.it">cyberbullismo@edunet19.it</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <footer class="report-modal-footer">
                            <button class="btn btn-secondary report-cancel-btn">Annulla</button>
                            <button class="btn btn-primary report-submit-btn" disabled>
                                <i class="fas fa-paper-plane"></i>
                                Invia Segnalazione
                            </button>
                        </footer>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('reportModal');
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('report-modal-styles')) return;

        const styles = `
            <style id="report-modal-styles">
                .report-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                }
                
                .report-modal.active {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .report-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }
                
                .report-modal-container {
                    position: relative;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .report-modal-content {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }
                
                .report-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }
                
                .report-modal-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                }
                
                .report-modal-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .report-modal-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                .report-modal-body {
                    padding: 1.5rem;
                }
                
                .report-intro {
                    color: #6b7280;
                    margin-bottom: 1.25rem;
                    font-size: 0.95rem;
                }
                
                .report-categories {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }
                
                .report-category-option {
                    cursor: pointer;
                }
                
                .report-category-option input {
                    display: none;
                }
                
                .report-category-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    transition: all 0.2s;
                    text-align: center;
                }
                
                .report-category-card i {
                    font-size: 1.5rem;
                    color: #6b7280;
                }
                
                .report-category-card span {
                    font-size: 0.85rem;
                    color: #374151;
                    font-weight: 500;
                }
                
                .report-category-option input:checked + .report-category-card {
                    border-color: #ef4444;
                    background: #fef2f2;
                }
                
                .report-category-option input:checked + .report-category-card i {
                    color: #ef4444;
                }
                
                .report-category-option:hover .report-category-card {
                    border-color: #d1d5db;
                    background: #f9fafb;
                }
                
                .report-description-section {
                    margin-top: 1.25rem;
                }
                
                .report-label {
                    display: block;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }
                
                .report-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 0.95rem;
                }
                
                .report-textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                
                .report-char-count {
                    text-align: right;
                    font-size: 0.8rem;
                    color: #9ca3af;
                    margin-top: 0.25rem;
                }
                
                .report-info-box {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                }
                
                .report-info-box.warning {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                }
                
                .report-info-box.warning i {
                    color: #f59e0b;
                    font-size: 1.25rem;
                }
                
                .report-info-box strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #92400e;
                }
                
                .report-info-box p {
                    margin: 0 0 0.5rem;
                    font-size: 0.9rem;
                    color: #78350f;
                }
                
                .report-info-box ul {
                    margin: 0;
                    padding-left: 1.25rem;
                    font-size: 0.85rem;
                    color: #78350f;
                }
                
                .report-info-box a {
                    color: #b45309;
                }
                
                .report-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }
                
                .report-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Dark theme */
                body.dark-theme .report-modal-content {
                    background: #1f2937;
                }
                
                body.dark-theme .report-intro {
                    color: #9ca3af;
                }
                
                body.dark-theme .report-category-card {
                    border-color: #374151;
                    background: #111827;
                }
                
                body.dark-theme .report-category-card span {
                    color: #e5e7eb;
                }
                
                body.dark-theme .report-category-option input:checked + .report-category-card {
                    background: rgba(239, 68, 68, 0.15);
                }
                
                body.dark-theme .report-category-option:hover .report-category-card {
                    border-color: #4b5563;
                    background: #1f2937;
                }
                
                body.dark-theme .report-label {
                    color: #e5e7eb;
                }
                
                body.dark-theme .report-textarea {
                    background: #111827;
                    border-color: #374151;
                    color: #f9fafb;
                }
                
                body.dark-theme .report-modal-footer {
                    background: #111827;
                    border-top-color: #374151;
                }
                
                body.dark-theme .report-info-box.warning {
                    background: rgba(245, 158, 11, 0.15);
                    border-color: rgba(245, 158, 11, 0.4);
                }
                
                body.dark-theme .report-info-box.warning strong,
                body.dark-theme .report-info-box.warning p,
                body.dark-theme .report-info-box.warning ul {
                    color: #fcd34d;
                }
                
                @media (max-width: 480px) {
                    .report-categories {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEventListeners() {
        if (!this.modal) return;

        // Close button
        const closeBtn = this.modal.querySelector('.report-modal-close');
        closeBtn?.addEventListener('click', () => this.close());

        // Backdrop click
        const backdrop = this.modal.querySelector('.report-modal-backdrop');
        backdrop?.addEventListener('click', () => this.close());

        // Cancel button
        const cancelBtn = this.modal.querySelector('.report-cancel-btn');
        cancelBtn?.addEventListener('click', () => this.close());

        // Category selection
        const categoryInputs = this.modal.querySelectorAll('input[name="reportCategory"]');
        categoryInputs.forEach(input => {
            input.addEventListener('change', (e) => this.onCategoryChange(e));
        });

        // Description textarea
        const textarea = this.modal.querySelector('#reportDescription');
        textarea?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('reportCharCount').textContent = count;
        });

        // Submit button
        const submitBtn = this.modal.querySelector('.report-submit-btn');
        submitBtn?.addEventListener('click', () => this.submit());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    onCategoryChange(e) {
        const category = e.target.value;
        const descSection = this.modal.querySelector('.report-description-section');
        const cyberbullyingInfo = this.modal.querySelector('.report-cyberbullying-info');
        const submitBtn = this.modal.querySelector('.report-submit-btn');

        // Show description section
        descSection.style.display = 'block';

        // Show cyberbullying info if selected
        cyberbullyingInfo.style.display = category === 'cyberbullying' ? 'block' : 'none';

        // Enable submit button
        submitBtn.disabled = false;
    }

    open(contentType, contentId, authorId = null) {
        this.currentReport = {
            contentType,
            contentId,
            authorId
        };

        // Reset form
        const categoryInputs = this.modal.querySelectorAll('input[name="reportCategory"]');
        categoryInputs.forEach(input => input.checked = false);

        const textarea = this.modal.querySelector('#reportDescription');
        if (textarea) textarea.value = '';

        const charCount = document.getElementById('reportCharCount');
        if (charCount) charCount.textContent = '0';

        const descSection = this.modal.querySelector('.report-description-section');
        if (descSection) descSection.style.display = 'none';

        const cyberbullyingInfo = this.modal.querySelector('.report-cyberbullying-info');
        if (cyberbullyingInfo) cyberbullyingInfo.style.display = 'none';

        const submitBtn = this.modal.querySelector('.report-submit-btn');
        if (submitBtn) submitBtn.disabled = true;

        // Show modal
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.currentReport = null;
    }

    async submit() {
        if (!this.currentReport) return;

        const selectedCategory = this.modal.querySelector('input[name="reportCategory"]:checked');
        if (!selectedCategory) return;

        const category = selectedCategory.value;
        const priority = selectedCategory.dataset.priority;
        const description = this.modal.querySelector('#reportDescription')?.value || '';

        const submitBtn = this.modal.querySelector('.report-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';

        try {
            await this.sendReport({
                contentType: this.currentReport.contentType,
                contentId: this.currentReport.contentId,
                authorId: this.currentReport.authorId,
                category,
                priority,
                description
            });

            this.close();
            this.showNotification('📢 Segnalazione inviata. Grazie per aiutarci a mantenere la community sicura!', 'success');

        } catch (error) {
            console.error('Error submitting report:', error);
            this.showNotification('Errore nell\'invio della segnalazione. Riprova.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia Segnalazione';
        }
    }

    async sendReport(reportData) {
        if (!window.supabaseClientManager?.client) {
            console.log('Demo mode: sendReport', reportData);
            return;
        }

        const supabase = await window.supabaseClientManager.getClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('content_reports')
            .insert({
                reporter_id: user.id,
                reported_user_id: reportData.authorId,
                reported_content_type: reportData.contentType,
                reported_content_id: reportData.contentId,
                report_reason: reportData.category,
                report_description: reportData.description,
                category: reportData.category,
                priority: reportData.priority,
                status: 'pending'
            });

        if (error) throw error;
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.homepageManager?.showNotification) {
            window.homepageManager.showNotification(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize and export
window.contentReportManager = new ContentReportManager();

// Export function for easy use
window.openReportModal = function(contentType, contentId, authorId = null) {
    if (window.contentReportManager) {
        window.contentReportManager.open(contentType, contentId, authorId);
    }
};

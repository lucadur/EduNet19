// ============================================
// PANNELLO MODERAZIONE RECENSIONI
// Per admin istituti: verifica recensioni privati
// ============================================

class ReviewModerationPanel {
    constructor() {
        this.instituteId = null;
        this.pendingReviews = [];
        this.supabase = null;
    }

    async init(instituteId) {
        this.instituteId = instituteId;
        
        // Inizializza client Supabase
        if (window.supabaseClientManager) {
            this.supabase = await window.supabaseClientManager.getClient();
        } else {
            console.error('❌ Supabase client manager not available');
            return;
        }
        
        await this.loadPendingReviews();
        this.render();
    }

    async loadPendingReviews() {
        // Carica recensioni in attesa
        const { data: reviews, error } = await this.supabase
            .from('institute_reviews')
            .select('*')
            .eq('reviewed_institute_id', this.instituteId)
            .eq('is_verified', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Errore caricamento recensioni in sospeso:', error);
            return;
        }

        if (!reviews || reviews.length === 0) {
            this.pendingReviews = [];
            return;
        }

        // Carica dati reviewer per ogni recensione
        const reviewsWithData = await Promise.all(reviews.map(async (review) => {
            let reviewerData = null;

            if (review.reviewer_type === 'institute') {
                const { data: instituteUser } = await this.supabase
                    .from('school_institutes')
                    .select('institute_name, logo_url')
                    .eq('id', review.reviewer_id)
                    .single();
                
                if (instituteUser) {
                    reviewerData = {
                        name: instituteUser.institute_name,
                        avatar_url: instituteUser.logo_url,
                        type: 'institute'
                    };
                }
            } else {
                const { data: privateUser } = await this.supabase
                    .from('private_users')
                    .select('first_name, last_name, avatar_url')
                    .eq('id', review.reviewer_id)
                    .single();
                
                if (privateUser) {
                    reviewerData = {
                        name: `${privateUser.first_name} ${privateUser.last_name}`,
                        avatar_url: privateUser.avatar_url,
                        type: 'private'
                    };
                }
            }

            return {
                ...review,
                reviewer_data: reviewerData || { name: 'Utente sconosciuto', avatar_url: null, type: 'unknown' }
            };
        }));

        this.pendingReviews = reviewsWithData;
    }

    render() {
        const container = document.getElementById('review-moderation-panel');
        if (!container) return;

        if (this.pendingReviews.length === 0) {
            container.innerHTML = `
                <div class="moderation-empty">
                    <p>✅ Nessuna recensione in attesa di verifica</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="moderation-header">
                <h3>Recensioni da verificare (${this.pendingReviews.length})</h3>
                <p class="text-muted">Approva o rifiuta le recensioni degli utenti privati</p>
            </div>
            <div class="pending-reviews-list">
                ${this.pendingReviews.map(review => this.renderPendingReview(review)).join('')}
            </div>
        `;
    }

    renderPendingReview(review) {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        // Determina nome e avatar
        const reviewerName = review.reviewer_data?.name || 'Utente';
        const reviewerAvatar = review.reviewer_data?.avatar_url;
        const reviewerType = review.reviewer_data?.type === 'institute' ? 'Istituto' : 'Utente privato';
        
        // Fallback solo se non c'è l'avatar reale
        const avatarSrc = reviewerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random`;

        // Verifica se modificata
        const isEdited = review.updated_at && new Date(review.updated_at) > new Date(review.created_at);
        const editedBadge = isEdited ? '<span class="badge badge-warning" style="margin-left: 8px; font-size: 0.8em;">Modificata</span>' : '';

        return `
            <div class="pending-review-card" data-review-id="${review.id}">
                <div class="pending-review-header">
                    <img src="${avatarSrc}" 
                         alt="${reviewerName}" 
                         class="reviewer-avatar-small"
                         onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random';">
                    <div class="reviewer-info-small">
                        <div class="reviewer-name-small">
                            ${reviewerName}
                            <span class="badge ${review.reviewer_data?.type === 'institute' ? 'badge-institute' : 'badge-private'}">${reviewerType}</span>
                            ${editedBadge}
                        </div>
                        <div class="review-stars-small">${stars}</div>
                        <div class="review-date-small">${this.formatDate(review.created_at)}</div>
                    </div>
                </div>
                
                ${review.review_text ? `
                    <div class="pending-review-text">${this.escapeHtml(review.review_text)}</div>
                ` : ''}
                
                <div class="moderation-actions">
                    <button class="btn btn-approve" onclick="moderationPanel.approveReview('${review.id}')">
                        ✓ Approva
                    </button>
                    <button class="btn btn-reject" onclick="moderationPanel.rejectReview('${review.id}')">
                        ✗ Rifiuta
                    </button>
                </div>
            </div>
        `;
    }

    async approveReview(reviewId) {
        // Assicurati che this.supabase sia inizializzato
        if (!this.supabase) {
             if (window.supabaseClientManager) {
                this.supabase = await window.supabaseClientManager.getClient();
            } else {
                console.error('❌ Supabase client manager not available');
                return;
            }
        }

        // Aggiorna lo stato della recensione a 'approved' e imposta is_verified a true
        const { error } = await this.supabase
            .from('institute_reviews')
            .update({ 
                status: 'approved',
                is_verified: true 
            })
            .eq('id', reviewId);

        if (error) {
            console.error('Errore approvazione recensione:', error);
            alert('Errore durante l\'approvazione');
            return;
        }

        // Rimuovi dalla lista
        this.pendingReviews = this.pendingReviews.filter(r => r.id !== reviewId);
        this.render();
        
        // Aggiorna contatore badge se presente
        this.updateBadgeCount();
        
        alert('✅ Recensione approvata e pubblicata');
    }

    async rejectReview(reviewId) {
        // Assicurati che this.supabase sia inizializzato
        if (!this.supabase) {
             if (window.supabaseClientManager) {
                this.supabase = await window.supabaseClientManager.getClient();
            } else {
                console.error('❌ Supabase client manager not available');
                return;
            }
        }

        if (!confirm('Sei sicuro di voler rifiutare questa recensione? Verrà eliminata definitivamente.')) {
            return;
        }

        const { error } = await this.supabase
            .from('institute_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            console.error('Errore rifiuto recensione:', error);
            alert('Errore durante il rifiuto');
            return;
        }

        // Rimuovi dalla lista
        this.pendingReviews = this.pendingReviews.filter(r => r.id !== reviewId);
        this.render();
        
        // Aggiorna contatore badge
        this.updateBadgeCount();
        
        alert('✅ Recensione rifiutata ed eliminata');
    }

    updateBadgeCount() {
        const badge = document.getElementById('pending-reviews-badge');
        if (badge) {
            const count = this.pendingReviews.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inizializza pannello globale
const moderationPanel = new ReviewModerationPanel();

// Funzione per caricare contatore badge in navbar
async function loadPendingReviewsCount(instituteId) {
    if (!window.supabaseClientManager) {
        console.error('❌ Supabase client manager not available');
        return;
    }
    
    const supabase = await window.supabaseClientManager.getClient();
    
    const { count, error } = await supabase
        .from('institute_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewed_institute_id', instituteId)
        .eq('is_verified', false)
        .eq('reviewer_type', 'private');

    if (!error && count > 0) {
        const badge = document.getElementById('pending-reviews-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        }
    }
}

/**
 * EduNet19 - Gestore Recensioni
 * Gestisce caricamento, invio e moderazione delle recensioni
 */

class EduNetReviewManager {
    constructor() {
        this.supabase = window.eduNetAuth ? window.eduNetAuth.supabase : null;
        this.currentInstituteId = null;
        this.currentUser = null;
        this.currentUserType = null; // 'institute' o 'private'
        this.editingReviewId = null;

        // Elementi UI
        this.reviewsListEl = null;
        this.reviewFormEl = null;
        this.ratingSummaryEl = null;
    }

    async init(instituteId) {
        this.currentInstituteId = instituteId;

        // Recupera client Supabase dal manager centralizzato se disponibile
        if (window.supabaseClientManager) {
            this.supabase = await window.supabaseClientManager.getClient();
        }
        // Fallback sul vecchio metodo
        else if (window.eduNetAuth && window.eduNetAuth.supabase) {
            this.supabase = window.eduNetAuth.supabase;
        }

        if (!this.supabase) {
            console.error('Supabase non inizializzato in ReviewManager - tentativo recupero tardivo');
            // Ultimo tentativo: aspettiamo un attimo se il client sta caricando
            if (window.supabaseClientManager) {
                await new Promise(resolve => setTimeout(resolve, 500));
                this.supabase = await window.supabaseClientManager.getClient();
            }
        }

        if (!this.supabase) {
            console.error('❌ ERRORE FATALE: Supabase non disponibile in ReviewManager');
            return;
        }

        // Ottieni info utente corrente
        if (window.eduNetAuth) {
            const user = window.eduNetAuth.getCurrentUser();
            if (user) {
                this.currentUser = user;
            }
        } else if (this.supabase.auth) {
            // Fallback diretto su supabase auth
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
        }

        if (this.currentUser) {
            // Determina il tipo di utente
            if (window.eduNetProfileManager) {
                const profile = await window.eduNetProfileManager.loadCurrentUserProfile();
                this.currentUserType = profile?.user_type || 'private';
            } else {
                // Fallback: fetch diretto dal database
                try {
                    const { data: profile } = await this.supabase
                        .from('user_profiles')
                        .select('user_type')
                        .eq('id', this.currentUser.id)
                        .maybeSingle();
                    this.currentUserType = profile?.user_type || 'private';
                } catch (e) {
                    console.warn('Errore recupero tipo utente in ReviewManager', e);
                    this.currentUserType = 'private'; // Default sicuro
                }
            }
            console.log('ReviewManager: User Type detected:', this.currentUserType);
        }

        this.bindElements();
        await this.loadReviews();
    }

    bindElements() {
        this.reviewsListEl = document.getElementById('reviews-list');
        this.reviewFormEl = document.getElementById('review-form');
        this.ratingSummaryEl = document.getElementById('rating-summary');

        // Bind form submit
        if (this.reviewFormEl) {
            this.reviewFormEl.addEventListener('submit', (e) => this.handleReviewSubmit(e));
        }

        // Gestione visibilità form basata sul tipo utente
        this.updateFormVisibility();
    }

    updateFormVisibility() {
        const commentField = document.getElementById('review-comment-group');
        if (!commentField) return;

        if (this.currentUserType === 'private') {
            // Privati: Solo stelle (commento nascosto o disabilitato)
            // La richiesta dice "possibilità attuale di mettere solo le stelle, corretta"
            // Quindi nascondiamo il campo commento
            commentField.style.display = 'none';

            // Rimuovi 'required' se presente
            const textarea = commentField.querySelector('textarea');
            if (textarea) textarea.removeAttribute('required');

        } else if (this.currentUserType === 'institute') {
            // Istituti: Stelle + Commento
            commentField.style.display = 'block';
        }
    }

    async loadReviews() {
        if (!this.reviewsListEl) return;

        this.reviewsListEl.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento recensioni...</div>';

        try {
            let query = this.supabase
                .from('institute_reviews')
                .select(`
                    *,
                    reviewer:reviewer_id (
                        display_name,
                        avatar_url,
                        user_type
                    )
                `)
                .eq('reviewed_institute_id', this.currentInstituteId)
                .order('created_at', { ascending: false });

            // Logica di visibilità:
            // - Il proprietario del profilo vede TUTTE (pending, approved, rejected)
            // - Gli altri vedono solo 'approved'
            // - L'autore vede anche le sue 'pending'

            const isOwner = this.currentUser && this.currentUser.id === this.currentInstituteId;

            if (!isOwner) {
                // Se non è il proprietario, filtra per approved O proprie recensioni
                // Nota: RLS gestisce la sicurezza, ma filtriamo anche lato client per UI pulita
                if (this.currentUser) {
                    // Complicato fare OR in query semplice, ci affidiamo a RLS e filtriamo lato client se necessario
                    // O usiamo .or(`status.eq.approved,reviewer_id.eq.${this.currentUser.id}`)
                    query = query.or(`status.eq.approved,reviewer_id.eq.${this.currentUser.id}`);
                } else {
                    query = query.eq('status', 'approved');
                }
            }

            const { data: reviews, error } = await query;

            if (error) throw error;

            this.renderReviews(reviews, isOwner);
            this.updateRatingSummary(reviews); // Calcola stats basate su quelle caricate (o fetch separata per stats globali)

            // Se isOwner, carica anche le recensioni scritte dall'istituto verso altri
            if (isOwner) {
                this.loadWrittenReviews();
            }

        } catch (error) {
            console.error('Errore caricamento recensioni:', error);
            this.reviewsListEl.innerHTML = '<div class="error-message">Impossibile caricare le recensioni.</div>';
        }
    }

    async loadWrittenReviews() {
        const container = document.createElement('div');
        container.id = 'written-reviews-section';
        container.className = 'reviews-section';
        container.style.marginTop = '40px';
        container.innerHTML = '<h3>Le tue recensioni inviate</h3><div id="written-reviews-list" class="reviews-list"></div>';

        // Aggiungi dopo la lista recensioni ricevute
        if (this.reviewsListEl && !document.getElementById('written-reviews-section')) {
            this.reviewsListEl.parentNode.appendChild(container);
        }

        const listEl = document.getElementById('written-reviews-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            const { data: reviews, error } = await this.supabase
                .from('institute_reviews')
                .select(`
                    *,
                    reviewed_institute:school_institutes!institute_reviews_reviewed_institute_id_fkey(
                        institute_name,
                        logo_url,
                        city
                    )
                `)
                .eq('reviewer_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                listEl.innerHTML = '<p class="text-muted">Non hai ancora scritto recensioni.</p>';
                return;
            }

            listEl.innerHTML = reviews.map(review => {
                const instituteName = review.reviewed_institute?.institute_name || 'Istituto';
                const instituteLogo = review.reviewed_institute?.logo_url || 'assets/images/default-institute.png';
                const statusBadge = review.status === 'approved'
                    ? '<span class="badge badge-success">Approvata</span>'
                    : (review.status === 'rejected' ? '<span class="badge badge-danger">Rifiutata</span>' : '<span class="badge badge-warning">In attesa</span>');

                return `
                    <div class="review-card">
                        <div class="review-header">
                            <img src="${instituteLogo}" alt="${instituteName}" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <div class="reviewer-name">
                                    A: ${this.escapeHtml(instituteName)}
                                    ${statusBadge}
                                </div>
                                <div class="review-meta">
                                    <div class="stars-container size-small">
                                        ${this.renderStars(review.rating)}
                                    </div>
                                    <span class="review-date">${new Date(review.created_at).toLocaleDateString('it-IT')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="review-content">
                            ${review.comment ? `<div class="review-text">${this.escapeHtml(review.comment)}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Errore caricamento recensioni inviate:', error);
            listEl.innerHTML = '<div class="error-message">Impossibile caricare le recensioni inviate.</div>';
        }
    }

    renderReviews(reviews, isOwner) {
        if (!reviews || reviews.length === 0) {
            this.reviewsListEl.innerHTML = `
                <div class="no-reviews">
                    <i class="far fa-comment-alt"></i>
                    <p>Nessuna recensione ancora presente.</p>
                </div>
            `;
            return;
        }

        this.reviewsListEl.innerHTML = reviews.map(review => {
            const isPending = review.status === 'pending';
            const isRejected = review.status === 'rejected';
            const reviewerName = review.reviewer?.display_name || 'Utente EduNet';
            const reviewerAvatar = review.reviewer?.avatar_url;
            const reviewerType = review.reviewer?.user_type === 'institute' ? 'Istituto' : 'Privato';
            const badgeClass = review.reviewer?.user_type === 'institute' ? 'badge-institute' : 'badge-private';

            // Actions for owner
            let moderationActions = '';
            if (isOwner && isPending) {
                moderationActions = `
                    <div class="moderation-actions">
                        <button class="btn-reject" onclick="window.eduNetReviewManager.moderateReview('${review.id}', 'rejected')">
                            <i class="fas fa-times"></i> Rifiuta
                        </button>
                        <button class="btn-approve" onclick="window.eduNetReviewManager.moderateReview('${review.id}', 'approved')">
                            <i class="fas fa-check"></i> Approva
                        </button>
                    </div>
                `;
            }

            // Status badge
            let statusBadge = '';
            if (isPending) statusBadge = '<span class="pending-badge">In attesa di approvazione</span>';
            if (isRejected && isOwner) statusBadge = '<span class="pending-badge" style="background:red;">Rifiutata</span>';

            // Check if editing allowed (own review)
            const isMyReview = this.currentUser && review.reviewer_id === this.currentUser.id;
            let editAction = '';
            if (isMyReview) {
                // Use data attributes to pass review data safely
                // We need to be careful with quotes in JSON stringify
                const reviewJson = JSON.stringify(review).replace(/"/g, '&quot;');
                editAction = `
                    <button class="btn-text" onclick='window.eduNetReviewManager.handleEditReview(${reviewJson})' style="margin-left: auto; color: var(--color-primary); font-size: 0.9em;">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                `;
            }

            // Se non sei il proprietario e la recensione è rejected, non mostrarla (anche se RLS dovrebbe bloccarla)
            if (!isOwner && isRejected) return '';

            // Avatar HTML (with fallback)
            const avatarHtml = reviewerAvatar
                ? `<img src="${reviewerAvatar}" alt="${reviewerName}" class="reviewer-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                   <div class="reviewer-avatar default-avatar-fallback" style="display:none; align-items:center; justify-content:center; background:#eee; border-radius:50%; width:40px; height:40px;"><i class="fas fa-user" style="color:#666;"></i></div>`
                : `<div class="reviewer-avatar default-avatar-fallback" style="display:flex; align-items:center; justify-content:center; background:#eee; border-radius:50%; width:40px; height:40px;"><i class="fas fa-user" style="color:#666;"></i></div>`;

            return `
                <div class="review-card ${isPending ? 'pending' : ''}" data-id="${review.id}">
                    <div class="review-header">
                        <div class="avatar-container">
                            ${avatarHtml}
                        </div>
                        <div class="reviewer-info">
                            <div class="reviewer-name">
                                ${this.escapeHtml(reviewerName)}
                                <span class="badge ${badgeClass}">${reviewerType}</span>
                                ${statusBadge}
                            </div>
                            <div class="review-meta">
                                <div class="stars-container size-small">
                                    ${this.renderStars(review.rating)}
                                </div>
                                <span class="review-date">${new Date(review.created_at).toLocaleDateString('it-IT')}</span>
                            </div>
                        </div>
                        ${editAction}
                    </div>
                    <div class="review-content">
                        ${review.comment ? `<div class="review-text">${this.escapeHtml(review.comment)}</div>` : ''}
                    </div>
                    ${moderationActions}
                </div>
            `;
        }).join('');
    }

    renderStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const iconClass = i <= rating ? 'fas' : 'far';
            const colorClass = i <= rating ? 'filled' : '';
            starsHtml += `<i class="${iconClass} fa-star star ${colorClass}"></i>`;
        }
        return starsHtml;
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        if (!this.currentUser) {
            alert('Devi effettuare l\'accesso per scrivere una recensione.');
            return;
        }

        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const comment = document.getElementById('review-comment')?.value;

        if (!rating) {
            alert('Seleziona una valutazione in stelle.');
            return;
        }

        try {
            const reviewData = {
                reviewed_institute_id: this.currentInstituteId,
                reviewer_id: this.currentUser.id,
                rating: parseInt(rating),
                comment: this.currentUserType === 'institute' ? comment : null, // Ignora commento se privato
                status: 'pending', // Sempre pending all'inizio
                is_verified: false, // Forza non verificato
                reviewer_type: this.currentUserType
            };

            let error;

            if (this.editingReviewId) {
                // UPDATE
                reviewData.updated_at = new Date().toISOString();
                const { error: updateError } = await this.supabase
                    .from('institute_reviews')
                    .update(reviewData)
                    .eq('id', this.editingReviewId);
                error = updateError;
            } else {
                // INSERT
                const { error: insertError } = await this.supabase
                    .from('institute_reviews')
                    .insert(reviewData);
                error = insertError;
            }

            if (error) throw error;

            const message = this.editingReviewId
                ? 'Recensione aggiornata! Sarà visibile dopo l\'approvazione.'
                : 'Recensione inviata con successo! Sarà visibile dopo l\'approvazione dell\'istituto.';

            alert(message);
            this.resetForm();
            this.loadReviews(); // Ricarica per mostrare la "tua" recensione in pending

        } catch (error) {
            console.error('Errore invio recensione:', error);
            alert('Errore durante l\'invio della recensione.');
        }
    }

    resetForm() {
        this.reviewFormEl.reset();
        this.editingReviewId = null;
        const submitBtn = this.reviewFormEl.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = 'Invia Recensione <i class="fas fa-paper-plane"></i>';

        // Reset cancel button if exists
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.remove();
    }

    handleEditReview(review) {
        this.editingReviewId = review.id;

        // Populate rating
        const ratingInput = document.querySelector(`input[name="rating"][value="${review.rating}"]`);
        if (ratingInput) ratingInput.checked = true;

        // Populate comment
        const commentInput = document.getElementById('review-comment');
        if (commentInput && review.comment) commentInput.value = review.comment;

        // Scroll to form
        this.reviewFormEl.scrollIntoView({ behavior: 'smooth' });

        // Change button text
        const submitBtn = this.reviewFormEl.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = 'Aggiorna Recensione <i class="fas fa-sync"></i>';

        // Add cancel button
        if (!document.getElementById('cancel-edit-btn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancel-edit-btn';
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn-secondary';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.innerHTML = 'Annulla';
            cancelBtn.onclick = () => this.resetForm();
            submitBtn.parentNode.appendChild(cancelBtn);
        }
    }

    async moderateReview(reviewId, status) {
        try {
            const { error } = await this.supabase
                .from('institute_reviews')
                .update({ status: status })
                .eq('id', reviewId);

            if (error) throw error;

            // Ricarica la lista
            await this.loadReviews();

            // Aggiorna notifiche se necessario (opzionale)

        } catch (error) {
            console.error('Errore moderazione recensione:', error);
            alert('Errore durante l\'aggiornamento della recensione.');
        }
    }

    updateRatingSummary(reviews) {
        // Filtra solo quelle approvate per il calcolo pubblico
        const approvedReviews = reviews.filter(r => r.status === 'approved');

        if (approvedReviews.length === 0) return;

        const total = approvedReviews.length;
        const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
        const average = (sum / total).toFixed(1);

        // Aggiorna UI
        const avgEl = document.querySelector('.rating-number');
        const countEl = document.querySelector('.rating-count');

        if (avgEl) avgEl.textContent = average;
        if (countEl) countEl.textContent = `${total} Recensioni`;

        // Distribution bars could be updated here too
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inizializza globalmente
window.eduNetReviewManager = new EduNetReviewManager();


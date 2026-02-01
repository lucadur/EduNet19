/* ===================================================================
   COLLABORATORS MANAGER - EduNet19
   Gestione collaboratori per istituti scolastici
   Max 3 collaboratori per istituto
   =================================================================== */

class CollaboratorsManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.instituteId = null;
    this.instituteName = null;
    this.collaborators = [];
    this.maxCollaborators = 3;
    this.isOwner = false;
    this.canManage = false;
  }

  async init(instituteId) {
    console.log('👥 CollaboratorsManager initializing...');

    if (!window.supabaseClientManager) {
      console.error('❌ Supabase client not available');
      return false;
    }

    this.supabase = await window.supabaseClientManager.getClient();
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;
    this.instituteId = instituteId;

    if (!this.currentUser || !this.instituteId) {
      console.error('❌ Missing user or institute ID');
      return false;
    }

    // Carica nome istituto
    await this.loadInstituteName();

    // Verifica se è proprietario o admin
    this.isOwner = this.instituteId === this.currentUser.id;
    this.canManage = await this.checkCanManage();

    // Carica collaboratori
    await this.loadCollaborators();

    // Setup UI
    this.setupUI();

    console.log('✅ CollaboratorsManager initialized');
    return true;
  }

  async loadInstituteName() {
    try {
      const { data } = await this.supabase
        .from('school_institutes')
        .select('institute_name')
        .eq('id', this.instituteId)
        .single();

      this.instituteName = data?.institute_name || 'Istituto';
    } catch (e) {
      this.instituteName = 'Istituto';
    }
  }

  async checkCanManage() {
    if (this.isOwner) return true;

    try {
      const { data } = await this.supabase.rpc('can_manage_collaborators', {
        p_institute_id: this.instituteId,
        p_user_id: this.currentUser.id
      });
      return data === true;
    } catch (e) {
      return this.isOwner;
    }
  }

  async loadCollaborators() {
    try {
      console.log('📋 Loading collaborators for institute:', this.instituteId);
      console.log('📋 Current user ID:', this.currentUser?.id);

      // Usa la funzione RPC che bypassa le RLS
      const { data, error } = await this.supabase.rpc('get_institute_collaborators', {
        p_institute_id: this.instituteId
      });

      if (error) {
        console.error('❌ RPC error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      this.collaborators = data || [];
      console.log('📋 Collaborators loaded:', this.collaborators.length, this.collaborators);

      this.renderCollaboratorsList();
    } catch (error) {
      console.error('❌ Error loading collaborators:', error);
      this.collaborators = [];
      this.renderCollaboratorsList();
    }
  }

  setupUI() {
    const container = document.getElementById('collaborators-section');
    console.log('👥 setupUI - container found:', !!container, 'canManage:', this.canManage, 'isOwner:', this.isOwner);

    if (!container) {
      console.warn('👥 Sezione collaboratori non trovata nel DOM');
      return;
    }

    // Mostra sezione solo per proprietari/admin
    if (!this.canManage) {
      console.log('👥 Utente non può gestire collaboratori, nascondo sezione');
      container.style.display = 'none';
      return;
    }

    console.log('👥 Mostrando sezione collaboratori');
    container.style.display = '';

    // Setup event listeners
    const addBtn = document.getElementById('add-collaborator-btn');
    console.log('👥 Add button found:', !!addBtn);
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        console.log('👥 Add button clicked!');
        this.showInviteModal();
      });
    }

    const inviteForm = document.getElementById('invite-collaborator-form');
    console.log('👥 Invite form found:', !!inviteForm);
    if (inviteForm) {
      inviteForm.addEventListener('submit', (e) => {
        console.log('👥 Form submitted!');
        this.handleInvite(e);
      });
    }

    const closeModalBtn = document.getElementById('close-invite-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.hideInviteModal());
    }

    // Chiudi modal cliccando fuori
    const modal = document.getElementById('invite-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideInviteModal();
      });
    }

    // Chiudi link modal
    const closeLinkModalBtn = document.getElementById('close-link-modal');
    if (closeLinkModalBtn) {
      closeLinkModalBtn.addEventListener('click', () => this.hideLinkModal());
    }
  }

  renderCollaboratorsList() {
    const listContainer = document.getElementById('collaborators-list');
    const countEl = document.getElementById('collaborators-count');
    const addBtn = document.getElementById('add-collaborator-btn');

    if (!listContainer) return;

    // Conta separatamente
    const pendingCount = this.collaborators.filter(c => c.status === 'pending').length;
    const activeCount = this.collaborators.filter(c => c.status === 'active').length;
    const totalCount = pendingCount + activeCount;

    // Aggiorna contatore
    if (countEl) {
      countEl.textContent = `${totalCount}/${this.maxCollaborators}`;
      countEl.className = 'collaborators-badge';
      if (pendingCount > 0) {
        countEl.classList.add('has-pending');
      }
    }

    // Disabilita pulsante se limite raggiunto
    if (addBtn) {
      addBtn.disabled = totalCount >= this.maxCollaborators;
      if (totalCount >= this.maxCollaborators) {
        addBtn.title = 'Limite massimo di collaboratori raggiunto';
      }
    }

    // Render lista
    if (this.collaborators.length === 0) {
      listContainer.innerHTML = `
        <div class="collaborators-empty">
          <i class="fas fa-user-plus"></i>
          <p>Nessun collaboratore aggiunto</p>
          <span>Invita fino a 3 persone a gestire questo profilo</span>
        </div>
      `;
      return;
    }

    // Separa pending e attivi
    const pendingCollabs = this.collaborators.filter(c => c.status === 'pending');
    const activeCollabs = this.collaborators.filter(c => c.status === 'active');

    let html = '';

    // Sezione Pending (se ci sono)
    if (pendingCollabs.length > 0) {
      html += `
        <div class="collaborators-section-header pending-header">
          <i class="fas fa-clock"></i>
          <span>In attesa di accettazione (${pendingCollabs.length})</span>
        </div>
      `;
      html += pendingCollabs.map(collab => this.renderCollaboratorCard(collab)).join('');
    }

    // Sezione Attivi (se ci sono)
    if (activeCollabs.length > 0) {
      if (pendingCollabs.length > 0) {
        html += `
          <div class="collaborators-section-header active-header">
            <i class="fas fa-check-circle"></i>
            <span>Collaboratori attivi (${activeCollabs.length})</span>
          </div>
        `;
      }
      html += activeCollabs.map(collab => this.renderCollaboratorCard(collab)).join('');
    }

    listContainer.innerHTML = html;

    // Attach event listeners ai pulsanti
    this.attachCardListeners();
  }

  renderCollaboratorCard(collab) {
    const statusClass = collab.status === 'active' ? 'status-active' : 'status-pending';
    const statusText = collab.status === 'active' ? 'Attivo' : 'In attesa';
    const statusIcon = collab.status === 'active' ? 'fa-check-circle' : 'fa-clock';
    const cardClass = collab.status === 'pending' ? 'collaborator-card pending' : 'collaborator-card';

    const roleLabels = {
      'admin': 'Amministratore',
      'editor': 'Editor',
      'viewer': 'Visualizzatore'
    };

    const roleIcons = {
      'admin': 'fa-user-shield',
      'editor': 'fa-edit',
      'viewer': 'fa-eye'
    };

    // Calcola tempo trascorso per pending
    let pendingInfo = '';
    if (collab.status === 'pending' && collab.invited_at) {
      const invitedDate = new Date(collab.invited_at);
      const now = new Date();
      const diffDays = Math.floor((now - invitedDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        pendingInfo = 'Invitato oggi';
      } else if (diffDays === 1) {
        pendingInfo = 'Invitato ieri';
      } else {
        pendingInfo = `Invitato ${diffDays} giorni fa`;
      }
    }

    return `
      <div class="${cardClass}" data-id="${collab.id}" data-token="${collab.invite_token || ''}">
        <div class="collaborator-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="collaborator-info">
          <div class="collaborator-email">${this.escapeHtml(collab.email)}</div>
          <div class="collaborator-meta">
            <span class="collaborator-role">
              <i class="fas ${roleIcons[collab.role]}"></i>
              ${roleLabels[collab.role]}
            </span>
            <span class="collaborator-status ${statusClass}">
              <i class="fas ${statusIcon}"></i>
              ${statusText}
            </span>
            ${pendingInfo ? `<span class="collaborator-pending-info">${pendingInfo}</span>` : ''}
          </div>
        </div>
        <div class="collaborator-actions">
          ${collab.status === 'pending' ? `
            <button class="btn-icon btn-copy-link" data-id="${collab.id}" title="Copia link invito">
              <i class="fas fa-link"></i>
            </button>
            <button class="btn-icon btn-resend" data-id="${collab.id}" title="Reinvia invito">
              <i class="fas fa-paper-plane"></i>
            </button>
          ` : ''}
          <button class="btn-icon btn-edit-role" data-id="${collab.id}" title="Modifica ruolo">
            <i class="fas fa-user-cog"></i>
          </button>
          <button class="btn-icon btn-remove btn-danger" data-id="${collab.id}" title="Rimuovi">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  attachCardListeners() {
    // Copia link
    document.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.copyInviteLink(btn.dataset.id);
      });
    });

    // Reinvia invito
    document.querySelectorAll('.btn-resend').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resendInvite(btn.dataset.id);
      });
    });

    // Modifica ruolo
    document.querySelectorAll('.btn-edit-role').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showEditRoleModal(btn.dataset.id);
      });
    });

    // Rimuovi
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeCollaborator(btn.dataset.id);
      });
    });
  }

  showInviteModal() {
    const modal = document.getElementById('invite-modal');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('invite-email')?.focus();
    }
  }

  hideInviteModal() {
    const modal = document.getElementById('invite-modal');
    if (modal) {
      modal.classList.remove('active');
      document.getElementById('invite-collaborator-form')?.reset();
    }
  }

  showLinkModal(inviteLink, email) {
    // Crea modal se non esiste
    let modal = document.getElementById('link-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'link-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content modal-sm">
          <div class="modal-header success-header">
            <h3><i class="fas fa-check-circle"></i> Invito Creato!</h3>
            <button type="button" class="modal-close" id="close-link-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="link-modal-text">Condividi questo link con <strong id="link-modal-email"></strong>:</p>
            <div class="invite-link-box">
              <input type="text" id="invite-link-input" readonly>
              <button type="button" class="btn-copy" id="copy-link-btn">
                <i class="fas fa-copy"></i>
                Copia
              </button>
            </div>
            <p class="link-modal-hint">
              <i class="fas fa-info-circle"></i>
              Il collaboratore dovrà accedere con questo link per accettare l'invito.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-primary" onclick="document.getElementById('link-modal').classList.remove('active')">
              <i class="fas fa-check"></i> Ho capito
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event listener per chiusura
      modal.querySelector('#close-link-modal')?.addEventListener('click', () => this.hideLinkModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideLinkModal();
      });

      // Event listener per copia
      modal.querySelector('#copy-link-btn')?.addEventListener('click', () => {
        const input = document.getElementById('invite-link-input');
        if (input) {
          input.select();
          navigator.clipboard.writeText(input.value);
          const btn = modal.querySelector('#copy-link-btn');
          btn.innerHTML = '<i class="fas fa-check"></i> Copiato!';
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Copia';
          }, 2000);
        }
      });
    }

    // Popola dati
    document.getElementById('link-modal-email').textContent = email;
    document.getElementById('invite-link-input').value = inviteLink;

    // Mostra modal
    modal.classList.add('active');
  }

  hideLinkModal() {
    const modal = document.getElementById('link-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async handleInvite(e) {
    e.preventDefault();

    const emailInput = document.getElementById('invite-email');
    const roleSelect = document.getElementById('invite-role');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const email = emailInput?.value?.trim().toLowerCase();
    const role = roleSelect?.value || 'editor';

    if (!email) {
      this.showNotification('Inserisci un indirizzo email', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showNotification('Indirizzo email non valido', 'error');
      return;
    }

    if (this.collaborators.some(c => c.email === email)) {
      this.showNotification('Questo utente è già stato invitato', 'error');
      return;
    }

    if (this.collaborators.length >= this.maxCollaborators) {
      this.showNotification('Limite massimo di collaboratori raggiunto', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';
    }

    try {
      const inviteToken = this.generateToken();

      // Inserisci collaboratore nel DB usando RPC
      console.log('📝 Inserting collaborator via RPC:', {
        institute_id: this.instituteId,
        email: email,
        role: role
      });

      const { data, error } = await this.supabase.rpc('insert_collaborator', {
        p_institute_id: this.instituteId,
        p_email: email,
        p_role: role,
        p_invite_token: inviteToken
      });

      console.log('📝 Insert result:', { data, error });

      if (error) throw error;

      // Costruisci link invito
      const inviteLink = window.AppConfig.getPageUrl(`pages/profile/accept-invite.html?token=${inviteToken}`);

      // Prova a inviare email tramite Edge Function
      try {
        const { data: funcData } = await this.supabase.functions.invoke('send-collaborator-invite', {
          body: {
            email: email,
            inviteToken: inviteToken,
            instituteName: this.instituteName,
            role: role,
            inviterName: this.currentUser.email,
            siteUrl: window.location.origin // Passa l'URL corrente del sito
          }
        });
        console.log('📧 Edge function response:', funcData);
      } catch (funcError) {
        console.warn('⚠️ Edge function error (non-blocking):', funcError);
      }

      // Chiudi modal invito
      this.hideInviteModal();

      // Mostra modal con link
      this.showLinkModal(inviteLink, email);

      // Ricarica lista
      await this.loadCollaborators();

    } catch (error) {
      console.error('❌ Error inviting collaborator:', error);
      this.showNotification(error.message || 'Errore durante l\'invito', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia Invito';
      }
    }
  }

  async copyInviteLink(collaboratorId) {
    const collab = this.collaborators.find(c => c.id === collaboratorId);
    if (!collab || !collab.invite_token) {
      this.showNotification('Link non disponibile', 'error');
      return;
    }

    const inviteLink = window.AppConfig.getPageUrl(`pages/profile/accept-invite.html?token=${collab.invite_token}`);

    try {
      await navigator.clipboard.writeText(inviteLink);
      this.showNotification('Link copiato negli appunti!', 'success');
    } catch (e) {
      // Fallback: mostra modal
      this.showLinkModal(inviteLink, collab.email);
    }
  }

  async resendInvite(collaboratorId) {
    const collab = this.collaborators.find(c => c.id === collaboratorId);
    if (!collab) return;

    console.log('📧 Resending invite to:', collab.email);

    try {
      // Genera nuovo token
      const newToken = this.generateToken();
      console.log('📧 New token generated');

      // Usa RPC per aggiornare
      const { data, error } = await this.supabase.rpc('update_collaborator_invite', {
        p_collaborator_id: collaboratorId,
        p_new_token: newToken
      });

      console.log('📧 RPC result:', { data, error });

      if (error) throw error;

      const inviteLink = window.AppConfig.getPageUrl(`pages/profile/accept-invite.html?token=${newToken}`);

      // Prova a inviare email
      console.log('📧 Calling Edge Function...');
      try {
        const { data: funcData, error: funcError } = await this.supabase.functions.invoke('send-collaborator-invite', {
          body: {
            email: collab.email,
            inviteToken: newToken,
            instituteName: this.instituteName,
            role: collab.role,
            inviterName: this.currentUser.email,
            siteUrl: window.location.origin
          }
        });
        console.log('📧 Edge function response:', funcData, funcError);
      } catch (funcError) {
        console.warn('⚠️ Edge function error:', funcError);
      }

      // Mostra link
      this.showLinkModal(inviteLink, collab.email);

      // Ricarica lista
      await this.loadCollaborators();

      this.showNotification('Invito reinviato!', 'success');

    } catch (error) {
      console.error('❌ Error resending invite:', error);
      this.showNotification('Errore durante il reinvio', 'error');
    }
  }

  showEditRoleModal(collaboratorId) {
    const collab = this.collaborators.find(c => c.id === collaboratorId);
    if (!collab) return;

    const newRole = prompt(
      `Seleziona nuovo ruolo per ${collab.email}:\n\n` +
      `• admin - Può gestire tutto inclusi collaboratori\n` +
      `• editor - Può modificare profilo e pubblicare\n` +
      `• viewer - Solo visualizzazione\n\n` +
      `Inserisci: admin, editor o viewer`,
      collab.role
    );

    if (newRole && ['admin', 'editor', 'viewer'].includes(newRole.toLowerCase())) {
      this.updateRole(collaboratorId, newRole.toLowerCase());
    }
  }

  async updateRole(collaboratorId, newRole) {
    try {
      // Usa RPC per aggiornare il ruolo
      const { error } = await this.supabase.rpc('update_collaborator_role', {
        p_collaborator_id: collaboratorId,
        p_new_role: newRole
      });

      if (error) throw error;

      this.showNotification('Ruolo aggiornato', 'success');
      await this.loadCollaborators();

    } catch (error) {
      console.error('❌ Error updating role:', error);
      this.showNotification('Errore durante l\'aggiornamento', 'error');
    }
  }

  async removeCollaborator(collaboratorId) {
    const collab = this.collaborators.find(c => c.id === collaboratorId);
    if (!collab) return;

    // Mostra modal di conferma personalizzato
    this.showRemoveConfirmModal(collab);
  }

  showRemoveConfirmModal(collab) {
    // Rimuovi modal esistente se presente
    const existingModal = document.getElementById('remove-confirm-modal');
    if (existingModal) existingModal.remove();

    const isActive = collab.status === 'active';
    const hasAccount = isActive && collab.user_id;

    const modal = document.createElement('div');
    modal.id = 'remove-confirm-modal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-content modal-md">
        <div class="modal-header danger-header">
          <h3><i class="fas fa-exclamation-triangle"></i> Rimuovi Collaboratore</h3>
          <button type="button" class="modal-close" id="close-remove-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="remove-confirm-info">
            <p class="remove-email"><strong>${this.escapeHtml(collab.email)}</strong></p>
            <p class="remove-status">Stato: ${isActive ? 'Attivo' : 'In attesa di accettazione'}</p>
          </div>
          
          ${hasAccount ? `
            <div class="remove-options">
              <label class="remove-option">
                <input type="radio" name="remove-type" value="collaborator-only" checked>
                <div class="option-content">
                  <span class="option-title"><i class="fas fa-user-minus"></i> Rimuovi solo dai collaboratori</span>
                  <span class="option-desc">L'utente non potrà più gestire questo istituto, ma il suo account rimarrà attivo su EduNet19.</span>
                </div>
              </label>
              <label class="remove-option danger-option">
                <input type="radio" name="remove-type" value="delete-account">
                <div class="option-content">
                  <span class="option-title"><i class="fas fa-user-times"></i> Elimina anche l'account</span>
                  <span class="option-desc">
                    <strong>⚠️ ATTENZIONE:</strong> Questa azione eliminerà completamente l'account dell'utente da EduNet19. 
                    Tutti i suoi dati verranno cancellati permanentemente. Questa azione è <strong>IRREVERSIBILE</strong>.
                  </span>
                </div>
              </label>
            </div>
          ` : `
            <div class="remove-warning">
              <i class="fas fa-info-circle"></i>
              <p>${isActive ?
        'Rimuovendo questo collaboratore, non potrà più gestire questo istituto.' :
        'L\'invito verrà annullato e l\'utente non potrà più accettarlo.'
      }</p>
            </div>
          `}
          
          <div class="remove-confirm-checkbox">
            <label>
              <input type="checkbox" id="confirm-remove-checkbox">
              <span>Confermo di voler procedere con questa azione</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="cancel-remove-btn">
            <i class="fas fa-times"></i> Annulla
          </button>
          <button type="button" class="btn-danger" id="confirm-remove-btn" disabled>
            <i class="fas fa-trash"></i> Rimuovi
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const checkbox = document.getElementById('confirm-remove-checkbox');
    const confirmBtn = document.getElementById('confirm-remove-btn');
    const cancelBtn = document.getElementById('cancel-remove-btn');
    const closeBtn = document.getElementById('close-remove-modal');

    // Abilita/disabilita pulsante conferma
    checkbox.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
    });

    // Chiudi modal
    const closeModal = () => modal.remove();
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Conferma rimozione
    confirmBtn.addEventListener('click', async () => {
      const deleteAccount = hasAccount &&
        document.querySelector('input[name="remove-type"]:checked')?.value === 'delete-account';

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rimozione...';

      try {
        const { data, error } = await this.supabase.rpc('delete_collaborator_with_account', {
          p_collaborator_id: collab.id,
          p_delete_account: deleteAccount
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Errore durante la rimozione');
        }

        closeModal();

        if (data.account_deleted) {
          this.showNotification(`Collaboratore e account di ${collab.email} eliminati`, 'success');
        } else {
          this.showNotification('Collaboratore rimosso', 'success');
        }

        await this.loadCollaborators();

      } catch (error) {
        console.error('❌ Error removing collaborator:', error);
        this.showNotification(error.message || 'Errore durante la rimozione', 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Rimuovi';
      }
    });
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }

    // Fallback toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      <span>${message}</span>
    `;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// =====================================================
// ACCEPT INVITE HANDLER
// =====================================================

class AcceptInviteHandler {
  constructor() {
    this.supabase = null;
    this.token = null;
    this.inviteDetails = null;
    this.currentUser = null;
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');

    if (!this.token) {
      this.showError('Link di invito non valido');
      return;
    }

    if (!window.supabaseClientManager) {
      this.showError('Errore di connessione');
      return;
    }

    this.supabase = await window.supabaseClientManager.getClient();

    // Prima carica i dettagli dell'invito (non richiede autenticazione)
    await this.loadInviteDetailsPublic();

    if (!this.inviteDetails) return; // Errore già mostrato

    // Poi controlla se l'utente è loggato
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;

    if (!user) {
      // Mostra form di registrazione/login
      this.showAuthForm();
      return;
    }

    // Verifica che l'email corrisponda
    if (this.inviteDetails.email !== user.email) {
      this.showError(
        `Questo invito è per <strong>${this.inviteDetails.email}</strong>.<br><br>` +
        `Sei loggato come <strong>${user.email}</strong>.<br><br>` +
        `Effettua il logout e accedi con l'account corretto.`
      );
      return;
    }

    // Mostra form per completare il profilo
    this.showNameForm();
  }

  async loadInviteDetailsPublic() {
    try {
      const { data: result, error } = await this.supabase.rpc('get_invite_details', {
        p_token: this.token
      });

      console.log('Invite details:', result, error);

      if (error || !result.success) {
        this.showError(result?.error || 'Invito non trovato o già utilizzato');
        return;
      }

      this.inviteDetails = result;
    } catch (error) {
      console.error('❌ Error loading invite details:', error);
      this.showError('Errore durante il caricamento dell\'invito');
    }
  }

  showAuthForm() {
    const container = document.getElementById('invite-status');
    if (!container) return;

    const roleLabels = {
      'admin': 'Amministratore',
      'editor': 'Editor',
      'viewer': 'Visualizzatore'
    };

    container.innerHTML = `
      <div class="invite-form">
        <h2>Sei stato invitato!</h2>
        <p class="invite-subtitle">Crea un account o accedi per accettare l'invito</p>
        
        <div class="invite-info-box">
          <p>
            <i class="fas fa-building"></i> 
            Invitato come <strong>${roleLabels[this.inviteDetails.role] || this.inviteDetails.role}</strong> 
            per <strong>${this.escapeHtml(this.inviteDetails.institute_name)}</strong>
          </p>
          <p style="margin-top: 8px; font-size: 13px;">
            <i class="fas fa-envelope"></i> Email: <strong>${this.escapeHtml(this.inviteDetails.email)}</strong>
          </p>
        </div>
        
        <div class="auth-tabs">
          <button type="button" class="auth-tab active" data-tab="register">Registrati</button>
          <button type="button" class="auth-tab" data-tab="login">Accedi</button>
        </div>
        
        <form id="auth-form">
          <div id="register-fields">
            <div class="form-row">
              <div class="form-group">
                <label for="first-name">Nome <span class="required">*</span></label>
                <input type="text" id="first-name" name="first_name" required placeholder="Il tuo nome">
              </div>
              <div class="form-group">
                <label for="last-name">Cognome <span class="required">*</span></label>
                <input type="text" id="last-name" name="last_name" required placeholder="Il tuo cognome">
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="auth-email">Email</label>
            <input type="email" id="auth-email" value="${this.escapeHtml(this.inviteDetails.email)}" readonly 
                   style="background: #f3f4f6; cursor: not-allowed;">
            <small style="color: #6b7280; font-size: 12px;">L'email è quella dell'invito e non può essere modificata</small>
          </div>
          
          <div class="form-group">
            <label for="auth-password">Password <span class="required">*</span></label>
            <input type="password" id="auth-password" name="password" required placeholder="Crea una password" minlength="6">
            <small id="password-hint" style="color: #6b7280; font-size: 12px;">Minimo 6 caratteri</small>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" id="auth-submit-btn">
              <i class="fas fa-user-plus"></i> <span>Registrati e Accetta</span>
            </button>
          </div>
          
          <div id="auth-error" style="display: none; margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; font-size: 14px;"></div>
        </form>
      </div>
    `;

    // Setup tabs
    const tabs = container.querySelectorAll('.auth-tab');
    const registerFields = document.getElementById('register-fields');
    const submitBtn = document.getElementById('auth-submit-btn');
    const passwordHint = document.getElementById('password-hint');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const isRegister = tab.dataset.tab === 'register';
        registerFields.style.display = isRegister ? 'block' : 'none';
        submitBtn.querySelector('span').textContent = isRegister ? 'Registrati e Accetta' : 'Accedi e Accetta';
        submitBtn.querySelector('i').className = isRegister ? 'fas fa-user-plus' : 'fas fa-sign-in-alt';
        passwordHint.textContent = isRegister ? 'Minimo 6 caratteri' : 'Inserisci la tua password';

        // Aggiorna required sui campi nome
        document.getElementById('first-name').required = isRegister;
        document.getElementById('last-name').required = isRegister;
      });
    });

    // Setup form submit
    const form = document.getElementById('auth-form');
    form.addEventListener('submit', (e) => this.handleAuthSubmit(e));

    // Focus sul primo campo
    document.getElementById('first-name')?.focus();
  }

  async handleAuthSubmit(e) {
    e.preventDefault();

    const isRegister = document.querySelector('.auth-tab.active')?.dataset.tab === 'register';
    const email = this.inviteDetails.email;
    const password = document.getElementById('auth-password')?.value;
    const firstName = document.getElementById('first-name')?.value?.trim();
    const lastName = document.getElementById('last-name')?.value?.trim();
    const submitBtn = document.getElementById('auth-submit-btn');
    const errorDiv = document.getElementById('auth-error');

    // Nascondi errori precedenti
    errorDiv.style.display = 'none';

    if (!password || password.length < 6) {
      errorDiv.textContent = 'La password deve essere di almeno 6 caratteri';
      errorDiv.style.display = 'block';
      return;
    }

    if (isRegister && (!firstName || !lastName)) {
      errorDiv.textContent = 'Inserisci nome e cognome';
      errorDiv.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Attendere...</span>';

    try {
      let authResult;

      if (isRegister) {
        // Registrazione
        authResult = await this.supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              user_type: 'collaborator',
              invite_type: 'collaborator'
            }
          }
        });
      } else {
        // Login
        authResult = await this.supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
      }

      if (authResult.error) {
        console.error('Auth error:', authResult.error);

        let errorMessage = authResult.error.message;
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Credenziali non valide. Se non hai un account, usa la tab "Registrati".';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'Esiste già un account con questa email. Usa la tab "Accedi".';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Devi confermare la tua email prima di accedere. Controlla la tua casella di posta.';
        }

        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = isRegister ?
          '<i class="fas fa-user-plus"></i> <span>Registrati e Accetta</span>' :
          '<i class="fas fa-sign-in-alt"></i> <span>Accedi e Accetta</span>';
        return;
      }

      this.currentUser = authResult.data.user;

      // Se è una registrazione, potrebbe richiedere conferma email
      if (isRegister && !authResult.data.session) {
        this.showEmailConfirmation();
        return;
      }

      // Procedi con l'accettazione dell'invito
      await this.acceptInviteAfterAuth(firstName, lastName);

    } catch (error) {
      console.error('❌ Auth error:', error);
      errorDiv.textContent = 'Errore durante l\'autenticazione. Riprova.';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = isRegister ?
        '<i class="fas fa-user-plus"></i> <span>Registrati e Accetta</span>' :
        '<i class="fas fa-sign-in-alt"></i> <span>Accedi e Accetta</span>';
    }
  }

  showEmailConfirmation() {
    const container = document.getElementById('invite-status');
    if (container) {
      container.innerHTML = `
        <div class="invite-success" style="background: #fef3c7; border: 1px solid #fbbf24;">
          <i class="fas fa-envelope" style="color: #f59e0b;"></i>
          <h2 style="color: #92400e;">Conferma la tua email</h2>
          <p style="color: #78350f;">
            Ti abbiamo inviato un'email di conferma a <strong>${this.escapeHtml(this.inviteDetails.email)}</strong>.<br><br>
            Clicca sul link nell'email per confermare il tuo account, poi torna su questa pagina per accettare l'invito.
          </p>
          <a href="${window.location.href}" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
            <i class="fas fa-refresh"></i> Ho confermato, ricarica
          </a>
        </div>
      `;
    }
  }

  async acceptInviteAfterAuth(firstName, lastName) {
    try {
      const { data: result, error } = await this.supabase.rpc('accept_collaborator_invite', {
        p_token: this.token,
        p_first_name: firstName || '',
        p_last_name: lastName || ''
      });

      console.log('Accept invite result:', result, error);

      if (error) {
        console.error('RPC error:', error);
        this.showError('Errore durante l\'accettazione dell\'invito');
        return;
      }

      if (!result.success) {
        this.showError(result.error || 'Errore durante l\'accettazione');
        return;
      }

      this.showSuccess(result.institute_name || 'l\'istituto', firstName || 'Collaboratore');

    } catch (error) {
      console.error('❌ Error accepting invite:', error);
      this.showError('Errore durante l\'accettazione dell\'invito');
    }
  }

  showNameForm() {
    const container = document.getElementById('invite-status');
    if (!container) return;

    const roleLabels = {
      'admin': 'Amministratore',
      'editor': 'Editor',
      'viewer': 'Visualizzatore'
    };

    container.innerHTML = `
      <div class="invite-form">
        <h2>Benvenuto!</h2>
        <p class="invite-subtitle">Completa il tuo profilo per accettare l'invito</p>
        
        <div class="invite-info-box">
          <p>
            <i class="fas fa-building"></i> 
            Sei stato invitato come <strong>${roleLabels[this.inviteDetails.role] || this.inviteDetails.role}</strong> 
            per <strong>${this.escapeHtml(this.inviteDetails.institute_name)}</strong>
          </p>
        </div>
        
        <form id="accept-invite-form">
          <div class="form-row">
            <div class="form-group">
              <label for="first-name">Nome <span class="required">*</span></label>
              <input type="text" id="first-name" name="first_name" required placeholder="Il tuo nome">
            </div>
            <div class="form-group">
              <label for="last-name">Cognome <span class="required">*</span></label>
              <input type="text" id="last-name" name="last_name" required placeholder="Il tuo cognome">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">
              <i class="fas fa-check"></i> Accetta Invito
            </button>
          </div>
        </form>
      </div>
    `;

    // Attach form listener
    const form = document.getElementById('accept-invite-form');
    form.addEventListener('submit', (e) => this.handleAcceptSubmit(e));

    // Focus sul primo campo
    document.getElementById('first-name')?.focus();
  }

  async handleAcceptSubmit(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name')?.value?.trim();
    const lastName = document.getElementById('last-name')?.value?.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!firstName || !lastName) {
      alert('Inserisci nome e cognome');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accettazione in corso...';
    }

    try {
      // Accetta l'invito con nome e cognome
      const { data: result, error } = await this.supabase.rpc('accept_collaborator_invite', {
        p_token: this.token,
        p_first_name: firstName,
        p_last_name: lastName
      });

      console.log('Accept invite result:', result, error);

      if (error) {
        console.error('RPC error:', error);
        this.showError('Errore durante l\'accettazione dell\'invito');
        return;
      }

      if (!result.success) {
        this.showError(result.error || 'Errore durante l\'accettazione');
        return;
      }

      this.showSuccess(result.institute_name || 'l\'istituto', firstName);

    } catch (error) {
      console.error('❌ Error accepting invite:', error);
      this.showError('Errore durante l\'accettazione dell\'invito');
    }
  }

  showError(message) {
    const container = document.getElementById('invite-status');
    if (container) {
      container.innerHTML = `
        <div class="invite-error">
          <i class="fas fa-times-circle"></i>
          <h2>Invito non valido</h2>
          <p>${message}</p>
          <a href="../../homepage.html" class="btn-primary">Torna alla Home</a>
        </div>
      `;
    }
  }

  showSuccess(instituteName, firstName) {
    const container = document.getElementById('invite-status');
    if (container) {
      container.innerHTML = `
        <div class="invite-success">
          <i class="fas fa-check-circle"></i>
          <h2>Benvenuto, ${this.escapeHtml(firstName)}!</h2>
          <p>Ora sei un collaboratore di <strong>${this.escapeHtml(instituteName)}</strong></p>
          <a href="../../homepage.html" class="btn-primary">
            <i class="fas fa-home"></i> Vai alla Home
          </a>
        </div>
      `;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
}

// Export
window.CollaboratorsManager = CollaboratorsManager;
window.AcceptInviteHandler = AcceptInviteHandler;

// Auto-init per accept-invite page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('invite-status')) {
    const handler = new AcceptInviteHandler();
    handler.init();
  }
});

/**
 * ===================================================================
 * EDUNET19 - ADMIN MANAGER
 * Gestione amministratori istituti (max 3)
 * ===================================================================
 */

'use strict';

class AdminManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentInstitute = null;
    this.admins = [];
    this.pendingInvites = [];
    this.maxAdmins = 3;
    this.initialized = false;
    
    // Inizializza in modo asincrono
    this.initPromise = this.init();
  }

  /**
   * Inizializza il manager
   */
  async init() {
    console.log('🚀 [AdminManager] Inizializzazione...');
    
    // Attendi che eduNetAuth sia disponibile
    let attempts = 0;
    while (!window.eduNetAuth && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.eduNetAuth) {
      console.error('❌ [AdminManager] eduNetAuth non disponibile');
      return;
    }
    
    this.supabase = window.eduNetAuth.supabase;
    console.log('✅ [AdminManager] Supabase disponibile');
    
    // Attendi che l'utente sia autenticato
    attempts = 0;
    while (!window.eduNetAuth.isAuthenticated() && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    this.currentUser = window.eduNetAuth.getCurrentUser();
    if (!this.currentUser) {
      console.warn('⚠️ [AdminManager] Utente non autenticato');
      return;
    }
    
    console.log('✅ [AdminManager] Utente autenticato:', this.currentUser.email);

    // Carica istituto dell'admin corrente
    await this.loadCurrentInstitute();
    
    this.initialized = true;
    console.log('✅ [AdminManager] Inizializzato completamente');
  }
  
  /**
   * Attendi che il manager sia inizializzato
   */
  async waitForInit() {
    await this.initPromise;
    return this.initialized;
  }

  /**
   * Carica l'istituto dell'admin corrente
   */
  async loadCurrentInstitute() {
    console.log('🔍 [AdminManager] Caricamento istituto per utente:', this.currentUser.id);
    
    try {
      const { data, error } = await this.supabase
        .rpc('get_admin_institute', { p_user_id: this.currentUser.id });

      if (error) {
        console.error('❌ [AdminManager] Errore RPC get_admin_institute:', error);
        throw error;
      }
      
      this.currentInstitute = data;
      console.log('📋 [AdminManager] Istituto caricato:', this.currentInstitute);
      
      if (this.currentInstitute) {
        await this.loadAdmins();
        await this.loadPendingInvites();
      } else {
        console.warn('⚠️ [AdminManager] Nessun istituto trovato per questo utente');
      }
      
    } catch (error) {
      console.error('❌ [AdminManager] Errore caricamento istituto:', error);
    }
  }

  /**
   * Carica lista admin dell'istituto
   */
  async loadAdmins() {
    if (!this.currentInstitute) return;

    try {
      const { data, error } = await this.supabase
        .from('institute_admins_view')
        .select('*')
        .eq('institute_id', this.currentInstitute)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;

      this.admins = data || [];
      console.log(`📋 Caricati ${this.admins.length} admin`);
      
    } catch (error) {
      console.error('Errore caricamento admin:', error);
      this.admins = [];
    }
  }

  /**
   * Carica inviti in sospeso
   */
  async loadPendingInvites() {
    if (!this.currentInstitute) return;

    try {
      const { data, error } = await this.supabase
        .from('institute_admin_invites')
        .select('*')
        .eq('institute_id', this.currentInstitute)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.pendingInvites = data || [];
      console.log(`📨 Caricati ${this.pendingInvites.length} inviti in sospeso`);
      
    } catch (error) {
      console.error('Errore caricamento inviti:', error);
      this.pendingInvites = [];
    }
  }

  /**
   * Verifica se l'utente corrente può gestire admin
   */
  async canManageAdmins() {
    if (!this.currentInstitute) return false;

    try {
      const { data, error } = await this.supabase
        .rpc('can_manage_admins', {
          p_user_id: this.currentUser.id,
          p_institute_id: this.currentInstitute
        });

      if (error) throw error;
      return data === true;
      
    } catch (error) {
      console.error('Errore verifica permessi:', error);
      return false;
    }
  }

  /**
   * Verifica se si può aggiungere un altro admin
   */
  canAddMoreAdmins() {
    return this.admins.length < this.maxAdmins;
  }

  /**
   * Invita un nuovo admin
   */
  async inviteAdmin(email, role = 'admin') {
    if (!this.currentInstitute) {
      throw new Error('Nessun istituto associato');
    }

    if (!this.canAddMoreAdmins()) {
      throw new Error('Limite massimo di 3 amministratori raggiunto');
    }

    // Valida email
    if (!this.validateEmail(email)) {
      throw new Error('Email non valida');
    }

    // Verifica che l'email non sia già admin
    if (this.admins.some(admin => admin.email && admin.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Questo utente è già amministratore');
    }

    // Verifica che non ci sia già un invito pendente
    if (this.pendingInvites.some(invite => invite.email && invite.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Invito già inviato a questa email');
    }

    try {
      const { data, error } = await this.supabase
        .rpc('invite_institute_admin', {
          p_institute_id: this.currentInstitute,
          p_email: email.toLowerCase(),
          p_role: role
        });

      if (error) throw error;

      // Ricarica inviti
      await this.loadPendingInvites();

      console.log('✅ Invito inviato con successo');
      return data;
      
    } catch (error) {
      console.error('Errore invio invito:', error);
      throw error;
    }
  }

  /**
   * Accetta un invito admin
   */
  async acceptInvite(token) {
    try {
      const { data, error } = await this.supabase
        .rpc('accept_admin_invite', {
          p_token: token,
          p_user_id: this.currentUser.id
        });

      if (error) throw error;

      console.log('✅ Invito accettato con successo');
      
      // Ricarica dati
      await this.loadCurrentInstitute();
      
      return true;
      
    } catch (error) {
      console.error('Errore accettazione invito:', error);
      throw error;
    }
  }

  /**
   * Rimuove un admin
   */
  async removeAdmin(adminId) {
    if (!await this.canManageAdmins()) {
      throw new Error('Non hai i permessi per rimuovere amministratori');
    }

    try {
      const { data, error } = await this.supabase
        .rpc('remove_institute_admin', {
          p_admin_id: adminId,
          p_removed_by: this.currentUser.id
        });

      if (error) throw error;

      // Ricarica admin
      await this.loadAdmins();

      console.log('✅ Admin rimosso con successo');
      return true;
      
    } catch (error) {
      console.error('Errore rimozione admin:', error);
      throw error;
    }
  }

  /**
   * Cancella un invito
   */
  async cancelInvite(inviteId) {
    if (!await this.canManageAdmins()) {
      throw new Error('Non hai i permessi per cancellare inviti');
    }

    try {
      const { error } = await this.supabase
        .from('institute_admin_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      // Ricarica inviti
      await this.loadPendingInvites();

      console.log('✅ Invito cancellato');
      return true;
      
    } catch (error) {
      console.error('Errore cancellazione invito:', error);
      throw error;
    }
  }

  /**
   * Aggiorna permessi admin
   */
  async updateAdminPermissions(adminId, permissions) {
    if (!await this.canManageAdmins()) {
      throw new Error('Non hai i permessi per modificare gli amministratori');
    }

    try {
      const { error } = await this.supabase
        .from('institute_admins')
        .update({ permissions })
        .eq('id', adminId);

      if (error) throw error;

      // Ricarica admin
      await this.loadAdmins();

      console.log('✅ Permessi aggiornati');
      return true;
      
    } catch (error) {
      console.error('Errore aggiornamento permessi:', error);
      throw error;
    }
  }

  /**
   * Ottieni ruolo admin corrente
   */
  getCurrentAdminRole() {
    const currentAdmin = this.admins.find(admin => admin.user_id === this.currentUser.id);
    return currentAdmin?.role || null;
  }

  /**
   * Ottieni permessi admin corrente
   */
  getCurrentAdminPermissions() {
    const currentAdmin = this.admins.find(admin => admin.user_id === this.currentUser.id);
    return currentAdmin?.permissions || {};
  }

  /**
   * Verifica se l'admin corrente è owner
   */
  isOwner() {
    return this.getCurrentAdminRole() === 'owner';
  }

  /**
   * Valida email
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Genera link invito
   */
  generateInviteLink(token) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/accept-invite.html?token=${token}`;
  }

  /**
   * Renderizza lista admin in un container
   */
  renderAdminList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.admins.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>Nessun amministratore</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.admins.map(admin => `
      <div class="admin-card" data-admin-id="${admin.id}">
        <div class="admin-avatar">
          ${admin.avatar_url 
            ? `<img src="${admin.avatar_url}" alt="${admin.first_name} ${admin.last_name}">` 
            : `<div class="avatar-placeholder">${this.getInitials(admin.first_name, admin.last_name)}</div>`
          }
        </div>
        <div class="admin-info">
          <div class="admin-name">${admin.first_name} ${admin.last_name}</div>
          <div class="admin-email">${admin.email}</div>
          <div class="admin-role">
            <span class="role-badge role-${admin.role}">${this.getRoleLabel(admin.role)}</span>
          </div>
        </div>
        <div class="admin-actions">
          ${admin.role !== 'owner' && this.isOwner() ? `
            <button class="btn-icon btn-danger" onclick="adminManager.confirmRemoveAdmin('${admin.id}')">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderizza lista inviti in sospeso
   */
  renderPendingInvites(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.pendingInvites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-envelope"></i>
          <p>Nessun invito in sospeso</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.pendingInvites.map(invite => `
      <div class="invite-card" data-invite-id="${invite.id}">
        <div class="invite-info">
          <div class="invite-email">${invite.email}</div>
          <div class="invite-meta">
            <span class="role-badge role-${invite.role}">${this.getRoleLabel(invite.role)}</span>
            <span class="invite-date">Inviato ${this.formatDate(invite.created_at)}</span>
            <span class="invite-expires">Scade ${this.formatDate(invite.expires_at)}</span>
          </div>
        </div>
        <div class="invite-actions">
          <button class="btn-icon btn-secondary" onclick="adminManager.copyInviteLink('${invite.token}')">
            <i class="fas fa-link"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="adminManager.confirmCancelInvite('${invite.id}')">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Conferma rimozione admin
   */
  async confirmRemoveAdmin(adminId) {
    const admin = this.admins.find(a => a.id === adminId);
    if (!admin) return;

    if (confirm(`Sei sicuro di voler rimuovere ${admin.first_name} ${admin.last_name} come amministratore?`)) {
      try {
        await this.removeAdmin(adminId);
        this.showNotification('Amministratore rimosso con successo', 'success');
        this.renderAdminList('admin-list');
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    }
  }

  /**
   * Conferma cancellazione invito
   */
  async confirmCancelInvite(inviteId) {
    if (confirm('Sei sicuro di voler cancellare questo invito?')) {
      try {
        await this.cancelInvite(inviteId);
        this.showNotification('Invito cancellato', 'success');
        this.renderPendingInvites('pending-invites');
      } catch (error) {
        this.showNotification(error.message, 'error');
      }
    }
  }

  /**
   * Copia link invito
   */
  async copyInviteLink(token) {
    const link = this.generateInviteLink(token);
    
    try {
      await navigator.clipboard.writeText(link);
      this.showNotification('Link copiato negli appunti', 'success');
    } catch (error) {
      // Fallback per browser che non supportano clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showNotification('Link copiato negli appunti', 'success');
    }
  }

  /**
   * Utility: ottieni iniziali
   */
  getInitials(firstName, lastName) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  /**
   * Utility: ottieni label ruolo
   */
  getRoleLabel(role) {
    const labels = {
      owner: 'Proprietario',
      admin: 'Amministratore',
      editor: 'Editor'
    };
    return labels[role] || role;
  }

  /**
   * Utility: formatta data
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'oggi';
    if (diffDays === 1) return 'ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    
    return date.toLocaleDateString('it-IT');
  }

  /**
   * Mostra notifica
   */
  showNotification(message, type = 'info') {
    if (window.eduNetHomepage && window.eduNetHomepage.showNotification) {
      window.eduNetHomepage.showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// Inizializza globalmente
if (typeof window !== 'undefined') {
  window.AdminManager = AdminManager;
  
  // Auto-inizializza quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.adminManager = new AdminManager();
    });
  } else {
    window.adminManager = new AdminManager();
  }
}

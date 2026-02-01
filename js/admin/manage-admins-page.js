/**
 * ===================================================================
 * MANAGE ADMINS PAGE SCRIPT - V2
 * Versione migliorata con UI moderna e funzionalità complete
 * ===================================================================
 */

'use strict';

// Variabile globale per tracciare l'admin da rimuovere
let adminToRemove = null;

// Attendi che tutto sia caricato
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 [Manage Admins] DOMContentLoaded');

  try {
    // Attendi che auth sia pronto
    console.log('⏳ [Manage Admins] Attendo auth system...');
    let attempts = 0;
    while (!window.eduNetAuth && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.eduNetAuth) {
      console.error('❌ [Manage Admins] Auth system non disponibile');
      window.location.href = window.AppConfig.getPageUrl('index.html');
      return;
    }

    console.log('✅ [Manage Admins] Auth system disponibile');

    // Attendi che l'utente sia autenticato
    attempts = 0;
    while (!window.eduNetAuth.isAuthenticated() && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.eduNetAuth.isAuthenticated()) {
      console.log('❌ [Manage Admins] Utente non autenticato, redirect a login');
      window.location.href = window.AppConfig.getPageUrl('index.html');
      return;
    }

    console.log('✅ [Manage Admins] Utente autenticato');

    // Attendi che il profilo sia caricato
    attempts = 0;
    while (!window.eduNetAuth.getUserProfile() && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const profile = window.eduNetAuth.getUserProfile();
    console.log('📋 [Manage Admins] Profilo utente:', profile);

    if (!profile) {
      console.error('❌ [Manage Admins] Profilo non disponibile');
      alert('Errore nel caricamento del profilo');
      window.location.href = window.AppConfig.getPageUrl('homepage.html');
      return;
    }

    // Verifica che sia un istituto
    if (profile.user_type !== 'istituto') {
      console.log('❌ [Manage Admins] Utente non è un istituto');
      alert('Solo gli istituti possono accedere a questa pagina');
      window.location.href = window.AppConfig.getPageUrl('homepage.html');
      return;
    }

    console.log('✅ [Manage Admins] Utente è un istituto, procedo...');

    // Attendi che AdminManager sia pronto
    await waitForAdminManager();

    // Inizializza pagina
    await initializePage();

    // Setup event listeners
    setupEventListeners();

    // Nascondi loading screen
    hideLoadingScreen();

    console.log('🎉 [Manage Admins] Pagina inizializzata con successo');

  } catch (error) {
    console.error('❌ [Manage Admins] Errore inizializzazione:', error);
    alert('Errore nel caricamento della pagina: ' + error.message);
    window.location.href = window.AppConfig.getPageUrl('homepage.html');
  }
});

/**
 * Attendi che AdminManager sia inizializzato
 */
async function waitForAdminManager() {
  console.log('⏳ [Manage Admins] Attendo AdminManager...');
  let attempts = 0;
  const maxAttempts = 100;

  while (!window.adminManager && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.adminManager) {
    console.error('❌ [Manage Admins] AdminManager non disponibile dopo', maxAttempts * 100, 'ms');
    throw new Error('AdminManager non disponibile');
  }

  console.log('✅ [Manage Admins] AdminManager disponibile, attendo inizializzazione...');

  // Attendi che sia completamente inizializzato
  const initialized = await window.adminManager.waitForInit();

  if (!initialized) {
    console.error('❌ [Manage Admins] AdminManager non inizializzato correttamente');
    throw new Error('AdminManager non inizializzato');
  }

  console.log('✅ [Manage Admins] AdminManager inizializzato');
  console.log('📋 [Manage Admins] AdminManager.currentInstitute:', window.adminManager.currentInstitute);
}

/**
 * Inizializza la pagina
 */
async function initializePage() {
  console.log('🚀 [Manage Admins] Inizializzazione pagina...');
  const manager = window.adminManager;

  // Verifica che l'utente sia un admin
  if (!manager.currentInstitute) {
    console.error('❌ [Manage Admins] currentInstitute non disponibile');
    alert('Devi essere un amministratore di un istituto per accedere a questa pagina');
    window.location.href = window.AppConfig.getPageUrl('homepage.html');
    return;
  }

  console.log('✅ [Manage Admins] currentInstitute:', manager.currentInstitute);

  // Verifica permessi
  console.log('🔐 [Manage Admins] Verifico permessi...');
  const canManage = await manager.canManageAdmins();
  console.log('📋 [Manage Admins] canManageAdmins:', canManage);

  if (!canManage) {
    console.error('❌ [Manage Admins] Permessi insufficienti');
    alert('Non hai i permessi per gestire i collaboratori');
    window.location.href = window.AppConfig.getPageUrl('homepage.html');
    return;
  }

  console.log('✅ [Manage Admins] Permessi OK, carico dati...');

  // Carica e renderizza dati
  await refreshData();

  console.log('✅ [Manage Admins] Pagina inizializzata');
}

/**
 * Aggiorna tutti i dati
 */
async function refreshData() {
  const manager = window.adminManager;

  // Ricarica dati
  await manager.loadAdmins();
  await manager.loadPendingInvites();

  // Aggiorna statistiche
  updateStats();

  // Renderizza liste
  renderAdminList();
  renderPendingInvites();

  // Aggiorna pulsante invita
  updateInviteButton();
}

/**
 * Aggiorna statistiche
 */
function updateStats() {
  const manager = window.adminManager;

  const activeCount = manager.admins.length;
  const pendingCount = manager.pendingInvites.length;
  const availableSlots = manager.maxAdmins - activeCount;

  document.getElementById('active-admins-count').textContent = activeCount;
  document.getElementById('pending-invites-count').textContent = pendingCount;
  document.getElementById('available-slots').textContent = availableSlots;
}

/**
 * Renderizza lista admin
 */
function renderAdminList() {
  const manager = window.adminManager;
  const container = document.getElementById('admin-list');

  if (!container) return;

  if (manager.admins.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <div class="empty-title">Nessun collaboratore</div>
        <p class="empty-text">Inizia invitando il primo collaboratore</p>
      </div>
    `;
    return;
  }

  const currentUserId = window.eduNetAuth.getCurrentUser().id;

  container.innerHTML = manager.admins.map(admin => {
    const isCurrentUser = admin.user_id === currentUserId;
    const canRemove = admin.role !== 'owner' && manager.isOwner() && !isCurrentUser;

    return `
      <div class="admin-card" data-admin-id="${admin.id}">
        <div class="admin-avatar">
          ${admin.avatar_url
        ? `<img src="${admin.avatar_url}" alt="${admin.first_name || 'Admin'}">`
        : `<div class="avatar-placeholder">${getInitials(admin.first_name, admin.last_name)}</div>`
      }
        </div>
        <div class="admin-info">
          <div class="admin-name">
            ${admin.first_name || 'Admin'} ${admin.last_name || ''}
            ${isCurrentUser ? '<span style="color: #667eea; font-size: 0.85rem;">(Tu)</span>' : ''}
          </div>
          <div class="admin-email">${admin.email}</div>
          <div class="admin-role">
            <span class="role-badge role-${admin.role}">${getRoleLabel(admin.role)}</span>
            ${admin.invited_at ? `<span class="admin-date">Aggiunto ${formatDate(admin.invited_at)}</span>` : ''}
          </div>
        </div>
        <div class="admin-actions">
          ${canRemove ? `
            <button 
              class="btn-icon btn-danger" 
              onclick="showRemoveAdminModal('${admin.id}', '${admin.first_name} ${admin.last_name}')"
              title="Rimuovi collaboratore"
            >
              <i class="fas fa-user-minus"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderizza lista inviti
 */
function renderPendingInvites() {
  const manager = window.adminManager;
  const container = document.getElementById('pending-invites');

  if (!container) return;

  if (manager.pendingInvites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-envelope"></i>
        <div class="empty-title">Nessun invito in sospeso</div>
        <p class="empty-text">Gli inviti inviati appariranno qui</p>
      </div>
    `;
    return;
  }

  container.innerHTML = manager.pendingInvites.map(invite => `
    <div class="invite-card" data-invite-id="${invite.id}">
      <div class="invite-icon">
        <i class="fas fa-envelope"></i>
      </div>
      <div class="invite-info">
        <div class="invite-email">${invite.email}</div>
        <div class="invite-meta">
          <span class="badge badge-${invite.role}">${getRoleLabel(invite.role)}</span>
          <span class="invite-date">
            <i class="fas fa-clock"></i>
            Inviato ${formatDate(invite.created_at)}
          </span>
          <span class="invite-date">
            <i class="fas fa-hourglass-end"></i>
            Scade ${formatDate(invite.expires_at)}
          </span>
        </div>
      </div>
      <div class="invite-actions">
        <button 
          class="btn-icon btn-secondary" 
          onclick="copyInviteLink('${invite.token}')"
          title="Copia link invito"
        >
          <i class="fas fa-link"></i>
        </button>
        <button 
          class="btn-icon btn-danger" 
          onclick="cancelInvite('${invite.id}')"
          title="Cancella invito"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Aggiorna stato pulsante invita
 */
function updateInviteButton() {
  const manager = window.adminManager;
  const btn = document.getElementById('add-admin-btn');

  if (!btn) return;

  if (!manager.canAddMoreAdmins()) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-user-plus"></i><span>Limite Raggiunto</span>';
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i><span>Invita Collaboratore</span>';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Form invito
  const inviteForm = document.getElementById('invite-form');
  if (inviteForm) {
    inviteForm.addEventListener('submit', handleInviteSubmit);
  }

  // Chiudi modal cliccando fuori
  const inviteModal = document.getElementById('invite-modal');
  if (inviteModal) {
    inviteModal.addEventListener('click', (e) => {
      if (e.target === inviteModal) {
        closeInviteModal();
      }
    });
  }

  const confirmModal = document.getElementById('confirm-remove-modal');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        closeConfirmRemoveModal();
      }
    });
  }

  // ESC per chiudere modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeInviteModal();
      closeConfirmRemoveModal();
    }
  });

  // Confirm remove button
  const confirmRemoveBtn = document.getElementById('confirm-remove-btn');
  if (confirmRemoveBtn) {
    confirmRemoveBtn.addEventListener('click', handleRemoveAdmin);
  }
}

/**
 * Mostra modal invito
 */
function showInviteModal() {
  const manager = window.adminManager;

  if (!manager.canAddMoreAdmins()) {
    showNotification('Hai raggiunto il limite massimo di 3 collaboratori', 'warning');
    return;
  }

  const modal = document.getElementById('invite-modal');
  if (modal) {
    modal.classList.add('active');

    // Focus su email input
    setTimeout(() => {
      document.getElementById('invite-email')?.focus();
    }, 100);
  }
}

/**
 * Chiudi modal invito
 */
function closeInviteModal() {
  const modal = document.getElementById('invite-modal');
  if (modal) {
    modal.classList.remove('active');

    // Reset form
    const form = document.getElementById('invite-form');
    if (form) {
      form.reset();
    }
  }
}

/**
 * Mostra modal conferma rimozione
 */
function showRemoveAdminModal(adminId, adminName) {
  adminToRemove = adminId;

  const modal = document.getElementById('confirm-remove-modal');
  const nameElement = document.getElementById('remove-admin-name');

  if (modal && nameElement) {
    nameElement.textContent = adminName;
    modal.classList.add('active');
  }
}

/**
 * Chiudi modal conferma rimozione
 */
function closeConfirmRemoveModal() {
  adminToRemove = null;

  const modal = document.getElementById('confirm-remove-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Gestisci submit form invito
 */
async function handleInviteSubmit(e) {
  e.preventDefault();

  const manager = window.adminManager;
  const btn = document.getElementById('send-invite-btn');
  const email = document.getElementById('invite-email').value.trim();
  const role = document.getElementById('invite-role').value;

  // Disabilita pulsante
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';

  try {
    // Invia invito
    await manager.inviteAdmin(email, role);

    // Mostra successo
    showNotification('Invito inviato con successo!', 'success');

    // Chiudi modal
    closeInviteModal();

    // Aggiorna dati
    await refreshData();

  } catch (error) {
    console.error('Errore invio invito:', error);
    showNotification(error.message || 'Errore nell\'invio dell\'invito', 'error');
  } finally {
    // Riabilita pulsante
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia Invito';
  }
}

/**
 * Gestisci rimozione admin
 */
async function handleRemoveAdmin() {
  if (!adminToRemove) return;

  const btn = document.getElementById('confirm-remove-btn');
  const manager = window.adminManager;

  // Disabilita pulsante
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rimozione...';

  try {
    await manager.removeAdmin(adminToRemove);

    showNotification('Collaboratore rimosso con successo', 'success');

    closeConfirmRemoveModal();

    await refreshData();

  } catch (error) {
    console.error('Errore rimozione admin:', error);
    showNotification(error.message || 'Errore nella rimozione del collaboratore', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash"></i> Rimuovi Collaboratore';
  }
}

/**
 * Copia link invito
 */
async function copyInviteLink(token) {
  const baseUrl = window.location.origin;
  const link = `${baseUrl}${window.AppConfig.getBasePath()}accept-invite.html?token=${token}`;

  try {
    await navigator.clipboard.writeText(link);
    showNotification('Link invito copiato negli appunti!', 'success');
  } catch (error) {
    console.error('Errore copia link:', error);
    showNotification('Errore nella copia del link', 'error');
  }
}

/**
 * Cancella invito
 */
async function cancelInvite(inviteId) {
  if (!confirm('Sei sicuro di voler cancellare questo invito?')) {
    return;
  }

  const manager = window.adminManager;

  try {
    await manager.cancelInvite(inviteId);
    showNotification('Invito cancellato', 'success');
    await refreshData();
  } catch (error) {
    console.error('Errore cancellazione invito:', error);
    showNotification(error.message || 'Errore nella cancellazione dell\'invito', 'error');
  }
}

/**
 * Utility: Ottieni iniziali
 */
function getInitials(firstName, lastName) {
  const first = (firstName || '').charAt(0).toUpperCase();
  const last = (lastName || '').charAt(0).toUpperCase();
  return first + last || 'A';
}

/**
 * Utility: Ottieni label ruolo
 */
function getRoleLabel(role) {
  const labels = {
    owner: 'Proprietario',
    admin: 'Admin',
    editor: 'Editor'
  };
  return labels[role] || role;
}

/**
 * Utility: Formatta data
 */
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'oggi';
  } else if (diffDays === 1) {
    return 'ieri';
  } else if (diffDays < 7) {
    return `${diffDays} giorni fa`;
  } else {
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

/**
 * Mostra notifica
 */
function showNotification(message, type = 'info') {
  // Crea elemento notifica
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Aggiungi al body
  document.body.appendChild(notification);

  // Anima entrata
  setTimeout(() => notification.classList.add('show'), 10);

  // Rimuovi automaticamente dopo 5 secondi
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Ottieni icona notifica
 */
function getNotificationIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'times-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * Nascondi loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 300);
  }
}

// Esponi funzioni globalmente per onclick
window.showInviteModal = showInviteModal;
window.closeInviteModal = closeInviteModal;
window.showRemoveAdminModal = showRemoveAdminModal;
window.closeConfirmRemoveModal = closeConfirmRemoveModal;
window.copyInviteLink = copyInviteLink;
window.cancelInvite = cancelInvite;

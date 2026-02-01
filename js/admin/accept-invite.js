/**
 * ===================================================================
 * ACCEPT INVITE PAGE SCRIPT
 * ===================================================================
 */

'use strict';

let inviteToken = null;
let inviteData = null;

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', async () => {

  // Ottieni token dall'URL
  const urlParams = new URLSearchParams(window.location.search);
  inviteToken = urlParams.get('token');

  if (!inviteToken) {
    showInvalidInvite('Nessun token di invito fornito');
    return;
  }

  // Verifica autenticazione
  if (!window.eduNetAuth || !window.eduNetAuth.isAuthenticated()) {
    // Salva token e reindirizza al login
    sessionStorage.setItem('pendingInviteToken', inviteToken);
    window.location.href = window.AppConfig.getPageUrl(`index.html?redirect=accept-invite&token=${inviteToken}`);
    return;
  }

  // Attendi AdminManager
  await waitForAdminManager();

  // Verifica invito
  await verifyInvite();
});

/**
 * Attendi che AdminManager sia pronto
 */
async function waitForAdminManager() {
  let attempts = 0;
  const maxAttempts = 50;

  while (!window.adminManager && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.adminManager) {
    throw new Error('AdminManager non disponibile');
  }
}

/**
 * Verifica validità invito
 */
async function verifyInvite() {
  try {
    const { data, error } = await window.eduNetAuth.supabase
      .from('institute_admin_invites')
      .select(`
        *,
        school_institutes (
          id,
          institute_name,
          institute_type,
          logo_url
        )
      `)
      .eq('token', inviteToken)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error('Invito non trovato o scaduto');
    }

    // Verifica che l'email corrisponda
    const currentUser = window.eduNetAuth.getCurrentUser();
    if (data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new Error('Questo invito è destinato a un altro indirizzo email');
    }

    inviteData = data;
    showValidInvite();

  } catch (error) {
    console.error('Errore verifica invito:', error);
    showInvalidInvite(error.message);
  }
}

/**
 * Mostra invito valido
 */
function showValidInvite() {
  // Nascondi loading
  document.getElementById('loading-state').style.display = 'none';

  // Mostra invito valido
  const validState = document.getElementById('valid-invite-state');
  validState.style.display = 'block';

  // Popola dati istituto
  const institute = inviteData.school_institutes;

  document.getElementById('institute-name').textContent = institute.institute_name;
  document.getElementById('institute-type').textContent = institute.institute_type || 'Istituto Scolastico';

  // Avatar istituto
  const avatarEl = document.getElementById('institute-avatar');
  if (institute.logo_url) {
    avatarEl.innerHTML = `<img src="${institute.logo_url}" alt="${institute.institute_name}">`;
  } else {
    const initials = getInstituteInitials(institute.institute_name);
    avatarEl.innerHTML = initials;
  }

  // Ruolo
  const roleEl = document.getElementById('invite-role');
  roleEl.textContent = getRoleLabel(inviteData.role);
  roleEl.className = `role-badge role-${inviteData.role}`;
}

/**
 * Mostra invito non valido
 */
function showInvalidInvite(message) {
  // Nascondi loading
  document.getElementById('loading-state').style.display = 'none';

  // Mostra errore
  const invalidState = document.getElementById('invalid-invite-state');
  invalidState.style.display = 'block';

  // Messaggio errore
  document.getElementById('error-message').textContent = message;
}

/**
 * Accetta invito
 */
async function acceptInvite() {
  const btn = document.getElementById('accept-btn');

  // Disabilita pulsante
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accettazione...';

  try {
    // Accetta invito tramite AdminManager
    await window.adminManager.acceptInvite(inviteToken);

    // Mostra successo
    showSuccess();

  } catch (error) {
    console.error('Errore accettazione invito:', error);
    alert(error.message || 'Errore nell\'accettazione dell\'invito');

    // Riabilita pulsante
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Accetta Invito';
  }
}

/**
 * Rifiuta invito
 */
function declineInvite() {
  if (confirm('Sei sicuro di voler rifiutare questo invito?')) {
    window.location.href = window.AppConfig.getPageUrl('homepage.html');
  }
}

/**
 * Mostra successo
 */
function showSuccess() {
  // Nascondi invito valido
  document.getElementById('valid-invite-state').style.display = 'none';

  // Mostra successo
  document.getElementById('success-state').style.display = 'block';
}

/**
 * Ottieni iniziali istituto
 */
function getInstituteInitials(name) {
  if (!name) return '?';
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Ottieni label ruolo
 */
function getRoleLabel(role) {
  const labels = {
    owner: 'Proprietario',
    admin: 'Amministratore',
    editor: 'Editor'
  };
  return labels[role] || role;
}

// Esponi funzioni globalmente
window.acceptInvite = acceptInvite;
window.declineInvite = declineInvite;

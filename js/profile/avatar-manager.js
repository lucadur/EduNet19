/**
 * ===================================================================
 * AVATAR MANAGER - EduNet19
 * Gestione centralizzata degli avatar utente
 * ===================================================================
 */

class AvatarManager {
  constructor() {
    this.supabase = null;
    this.currentUserAvatar = null;
    this.init();
  }

  async init() {
    // Aspetta che il client Supabase sia disponibile
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
      await this.loadCurrentUserAvatar();
    }
  }

  /**
   * Carica l'avatar dell'utente corrente
   */
  async loadCurrentUserAvatar() {
    try {
      if (!this.supabase) {
        console.log('Supabase not available yet');
        return;
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return;
      }

      console.log('Loading avatar for user:', user.id);

      // Prima determina il tipo di utente
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (!userProfile) {
        console.log('No user profile found');
        return;
      }

      // Carica avatar in base al tipo
      if (userProfile.user_type === 'istituto') {
        const { data: instituteProfile, error: instituteError } = await this.supabase
          .from('school_institutes')
          .select('logo_url')
          .eq('id', user.id)
          .maybeSingle();

        if (instituteError) {
          console.error('Error loading institute profile:', instituteError);
        }

        // ✅ Usa SOLO logo_url per avatar (cover_image è la copertina, non l'avatar!)
        if (instituteProfile?.logo_url) {
          console.log('Found institute avatar:', instituteProfile.logo_url);
          this.currentUserAvatar = instituteProfile.logo_url;
          this.updateAllAvatars(instituteProfile.logo_url);
        } else {
          console.log('No avatar found for institute');
        }
      } else if (userProfile.user_type === 'privato') {
        const { data: privateProfile, error: privateError } = await this.supabase
          .from('private_users')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (privateError) {
          console.error('Error loading private profile:', privateError);
        }

        if (privateProfile?.avatar_url) {
          console.log('Found private user avatar:', privateProfile.avatar_url);
          this.currentUserAvatar = privateProfile.avatar_url;
          this.updateAllAvatars(privateProfile.avatar_url);
        } else {
          console.log('No avatar found for private user');
        }
      } else {
        console.log('Unknown user type:', userProfile.user_type);
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
    }
  }

  /**
   * Aggiorna tutti gli avatar dell'utente corrente nella pagina
   */
  updateAllAvatars(avatarUrl) {
    if (!avatarUrl) return;

    console.log('Updating all avatars with URL:', avatarUrl);

    // Avatar nel menu utente (navbar) - sono IMG tags
    this.setAvatarImage('user-avatar', avatarUrl);
    this.setAvatarImage('user-avatar-large', avatarUrl);
    this.setAvatarImage('mobile-user-avatar', avatarUrl);

    // Avatar nel profilo - è un DIV con background
    this.setAvatarBackground('profile-avatar', avatarUrl);

    // Avatar nei post/commenti creati dall'utente
    this.updateUserPostAvatars(avatarUrl);
  }

  /**
   * Imposta avatar per elemento IMG
   */
  setAvatarImage(elementId, avatarUrl) {
    const element = document.getElementById(elementId);
    if (!element) {
      // Silent: element may not exist on all pages
      return;
    }

    console.log('Setting avatar image for:', elementId, 'Tag:', element.tagName);

    if (element.tagName === 'IMG') {
      element.src = avatarUrl;
      element.style.display = 'block';
      element.style.width = '';
      element.style.height = '';
      element.onerror = () => {
        console.error('Failed to load avatar image:', avatarUrl);
        element.style.display = 'none';
        const defaultIcon = element.parentElement?.querySelector('.default-avatar, .default-avatar-large, .mobile-default-avatar');
        if (defaultIcon) defaultIcon.style.display = 'block';
      };
      // Nascondi icona default
      const defaultIcon = element.parentElement?.querySelector('.default-avatar, .default-avatar-large, .mobile-default-avatar');
      if (defaultIcon) defaultIcon.style.display = 'none';
    } else {
      console.warn('Element is not an IMG tag:', elementId, element.tagName);
    }
  }

  /**
   * Imposta avatar per elemento DIV con background
   */
  setAvatarBackground(elementId, avatarUrl) {
    const element = document.getElementById(elementId);
    if (!element) {
      // Silent: element may not exist on all pages
      return;
    }

    console.log('Setting avatar background for:', elementId);

    element.style.backgroundImage = `url(${avatarUrl})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    
    // Nascondi icona placeholder
    const icon = element.querySelector('i');
    if (icon) icon.style.display = 'none';
  }

  /**
   * Imposta l'avatar per un elemento specifico (DEPRECATO - usa setAvatarImage o setAvatarBackground)
   */
  setAvatar(elementId, avatarUrl, size = 'medium') {
    console.warn('setAvatar is deprecated, use setAvatarImage or setAvatarBackground instead');
    const element = document.getElementById(elementId);
    if (!element) return;

    // Determina automaticamente il tipo
    if (element.tagName === 'IMG') {
      this.setAvatarImage(elementId, avatarUrl);
    } else if (element.id === 'profile-avatar' || 
               element.classList.contains('comment-avatar') ||
               element.classList.contains('author-avatar')) {
      this.setAvatarBackground(elementId, avatarUrl);
    }
  }

  /**
   * Aggiorna gli avatar nei post dell'utente
   */
  updateUserPostAvatars(avatarUrl) {
    // Trova tutti gli avatar nei post/commenti dell'utente corrente
    const userAvatars = document.querySelectorAll('.user-avatar-small, .comment-avatar, .post-author-avatar');
    
    userAvatars.forEach(avatar => {
      // Verifica se è dell'utente corrente (puoi aggiungere un data-attribute per identificarlo)
      if (avatar.dataset.isCurrentUser === 'true') {
        avatar.style.backgroundImage = `url(${avatarUrl})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        const icon = avatar.querySelector('i');
        if (icon) icon.style.display = 'none';
      }
    });
  }

  /**
   * Carica l'avatar di un utente specifico (per post/commenti di altri)
   */
  async loadUserAvatar(userId) {
    try {
      if (!this.supabase) return null;

      // Prima determina il tipo di utente
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (!userProfile) return null;

      // Carica avatar in base al tipo
      if (userProfile.user_type === 'istituto') {
        const { data: instituteProfile } = await this.supabase
          .from('school_institutes')
          .select('logo_url')
          .eq('id', userId)
          .maybeSingle();

        return instituteProfile?.logo_url || null;
      } else if (userProfile.user_type === 'privato') {
        const { data: privateProfile } = await this.supabase
          .from('private_users')
          .select('avatar_url')
          .eq('id', userId)
          .maybeSingle();

        return privateProfile?.avatar_url || null;
      }

      return null;
    } catch (error) {
      console.error('Error loading avatar for user:', userId, error);
      return null;
    }
  }

  /**
   * Imposta l'avatar per un elemento con URL
   */
  setAvatarByUrl(element, avatarUrl) {
    if (!element || !avatarUrl) return;

    if (element.tagName === 'IMG') {
      element.src = avatarUrl;
      element.style.display = 'block';
      element.onerror = () => {
        element.style.display = 'none';
      };
    } else {
      // Solo per elementi avatar specifici, non dropdown o container
      if (element.classList.contains('comment-avatar') || 
          element.classList.contains('author-avatar') ||
          element.classList.contains('profile-avatar') ||
          element.classList.contains('user-avatar-small')) {
        element.style.backgroundImage = `url(${avatarUrl})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
      }
    }

    // Nascondi icona placeholder
    const icon = element.querySelector('i');
    if (icon) icon.style.display = 'none';
  }

  /**
   * Crea un elemento avatar con immagine
   */
  createAvatarElement(avatarUrl, className = 'avatar', size = 'medium') {
    const avatar = document.createElement('div');
    avatar.className = className;
    
    if (avatarUrl) {
      avatar.style.backgroundImage = `url(${avatarUrl})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
      avatar.style.backgroundRepeat = 'no-repeat';
    } else {
      avatar.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    return avatar;
  }
}

// Inizializza globalmente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.avatarManager = new AvatarManager();
  });
} else {
  window.avatarManager = new AvatarManager();
}

console.log('👤 Avatar Manager - Script loaded successfully');

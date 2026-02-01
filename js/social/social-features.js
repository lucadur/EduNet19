/**
 * ===================================================================
 * EDUNET19 - SOCIAL FEATURES MODULE
 * Gestione funzionalità social: likes, commenti, condivisioni, attività
 * ===================================================================
 */

'use strict';

/**
 * Social Features Manager Class
 * Gestisce tutte le funzionalità social della piattaforma
 */
class EduNetSocialFeatures {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.isInitialized = false;

    // Cache per ottimizzare le performance
    this.likesCache = new Map();
    this.commentsCache = new Map();

    this.init();
  }

  /**
   * Initialize the social features system
   */
  async init() {
    try {
      // Wait for Supabase client
      await this.waitForSupabase();

      // Wait for auth system to be ready
      await this.waitForAuthSystem();

      // Get current user
      if (window.eduNetAuth) {
        this.currentUser = window.eduNetAuth.getCurrentUser();
        console.log('Social Features - Current user:', this.currentUser?.email || 'Not logged in');
      }

      this.isInitialized = true;
      console.log('✅ EduNet Social Features - Initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize social features:', error);
    }
  }

  /**
   * Wait for authentication system to be ready
   */
  async waitForAuthSystem() {
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let waitTime = 0;

    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.eduNetAuth && window.eduNetAuth.isInitialized && window.eduNetAuth.getCurrentUser()) {
          console.log('Social Features - Auth system ready');
          resolve();
        } else if (waitTime >= maxWaitTime) {
          console.log('Social Features - Auth system timeout, continuing anyway');
          resolve();
        } else {
          waitTime += checkInterval;
          setTimeout(checkAuth, checkInterval);
        }
      };

      checkAuth();
    });
  }

  /**
   * Wait for Supabase client to be available
   */
  async waitForSupabase() {
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let waitTime = 0;

    return new Promise((resolve, reject) => {
      const checkSupabase = () => {
        if (window.supabaseClientManager) {
          window.supabaseClientManager.getClient().then(client => {
            this.supabase = client;
            resolve();
          });
        } else if (waitTime >= maxWaitTime) {
          reject(new Error('Supabase client not available'));
        } else {
          waitTime += checkInterval;
          setTimeout(checkSupabase, checkInterval);
        }
      };

      checkSupabase();
    });
  }

  // ===================================================================
  // LIKES SYSTEM
  // ===================================================================

  /**
   * Toggle like on a post
   */
  async toggleLike(postId, likeButton) {
    if (!this.currentUser) {
      this.showNotification('Devi essere loggato per mettere like', 'warning');
      return;
    }

    // Validate button element
    if (!likeButton) {
      console.error('Like button element is undefined');
      return;
    }

    // Prevent multiple clicks
    if (likeButton.disabled) {
      return;
    }

    let isLiked = false;

    try {
      // Add loading state
      this.setLikeButtonLoading(likeButton, true);

      // Check if user already liked this post (simplified query)
      const { data: existingLikes, error: checkError } = await this.supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', this.currentUser.id);

      if (checkError) {
        console.error('Error checking existing like:', checkError);
        throw checkError;
      }

      const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;

      if (existingLike) {
        // Remove like
        await this.removeLike(postId, likeButton, false); // false = don't animate yet
        isLiked = false;
      } else {
        // Add like
        await this.addLike(postId, likeButton, false); // false = don't animate yet
        isLiked = true;
      }

      // Remove loading state
      this.setLikeButtonLoading(likeButton, false);

      // Now animate with the correct state
      this.animateLikeButton(likeButton, isLiked);

    } catch (error) {
      console.error('Error toggling like:', error);
      this.showNotification('Errore nell\'aggiornamento del like', 'error');

      // Remove loading state and restore original icon
      this.setLikeButtonLoading(likeButton, false);
      const icon = likeButton.querySelector('i');
      if (icon && likeButton.dataset.originalIcon) {
        icon.className = likeButton.dataset.originalIcon;
        delete likeButton.dataset.originalIcon;
      }
    }
  }

  /**
   * Add like to a post
   */
  async addLike(postId, likeButton, shouldAnimate = true) {
    try {
      // Insert like
      const { error } = await this.supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: this.currentUser.id
        }]);

      if (error) throw error;

      // Update count immediately
      this.updateLikeCount(likeButton, 1);

      // Update cache
      this.likesCache.set(`${postId}_${this.currentUser.id}`, true);

      // ✅ Track activity
      await this.logPostActivity('like', postId);

      console.log('Like added successfully');

    } catch (error) {
      console.error('Error adding like:', error);
      throw error;
    }
  }

  /**
   * Remove like from a post
   */
  async removeLike(postId, likeButton, shouldAnimate = true) {
    try {
      // Delete like
      const { error } = await this.supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;

      // Update count immediately
      this.updateLikeCount(likeButton, -1);

      // Update cache
      this.likesCache.delete(`${postId}_${this.currentUser.id}`);

      // ✅ Track activity (unlike)
      await this.logPostActivity('unlike', postId);

      console.log('Like removed successfully');

    } catch (error) {
      console.error('Error removing like:', error);
      throw error;
    }
  }

  /**
   * Animate like button
   */
  animateLikeButton(button, isLiked) {
    const icon = button.querySelector('i');
    const countSpan = button.querySelector('span');

    // Remove any existing animation class first to ensure clean state
    button.classList.remove('like-animating');

    // Force reflow to restart animation
    void button.offsetWidth;

    // Add animation class
    button.classList.add('like-animating');

    // Update icon and state
    if (isLiked) {
      icon.classList.remove('far');
      icon.classList.add('fas');
      button.classList.add('liked');
      icon.style.color = '#e53e3e';

    } else {
      icon.classList.remove('fas');
      icon.classList.add('far');
      button.classList.remove('liked');
      icon.style.color = '';
    }

    // Remove animation class after animation completes (600ms for heartBeat animation)
    setTimeout(() => {
      button.classList.remove('like-animating');
    }, 600);
  }

  /**
   * Update like count display
   */
  updateLikeCount(button, increment) {
    const countSpan = button.querySelector('span');
    if (countSpan) {
      const currentCount = parseInt(countSpan.textContent) || 0;
      const newCount = Math.max(0, currentCount + increment);
      countSpan.textContent = newCount;

      // Animate count change
      countSpan.style.transform = 'scale(1.2)';
      setTimeout(() => {
        countSpan.style.transform = 'scale(1)';
      }, 150);
    }
  }

  /**
   * Set like button loading state
   */
  setLikeButtonLoading(button, isLoading) {
    const icon = button.querySelector('i');

    if (isLoading) {
      button.disabled = true;
      // Store original icon classes before changing to spinner
      button.dataset.originalIcon = icon.className;
      icon.className = 'fas fa-spinner fa-spin';
    } else {
      button.disabled = false;
      // Restore original icon if stored
      if (button.dataset.originalIcon) {
        icon.className = button.dataset.originalIcon;
        delete button.dataset.originalIcon;
      }
    }
  }

  // ===================================================================
  // COMMENTS SYSTEM
  // ===================================================================

  /**
   * Show comments for a post
   */
  async showComments(postId, commentsContainer) {
    try {
      // Show loading
      commentsContainer.innerHTML = '<div class="comments-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento commenti...</div>';

      // Simple query without joins to avoid 400 errors
      // Ottimizzato: seleziona solo i campi necessari
      const { data: comments, error } = await this.supabase
        .from('post_comments')
        .select('id, post_id, user_id, content, created_at, updated_at, is_edited, parent_comment_id')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`Loaded ${comments?.length || 0} comments for post ${postId}`);

      // Enrich comments with user data
      if (comments && comments.length > 0) {
        await this.enrichCommentsWithUserData(comments);
      }

      // Render comments
      this.renderComments(comments, commentsContainer, postId);

      // Update comment counter in the post
      this.updateCommentCounter(postId, comments?.length || 0);

    } catch (error) {
      console.error('Error loading comments:', error);
      commentsContainer.innerHTML = '<div class="comments-error">Errore nel caricamento dei commenti</div>';
    }
  }

  /**
   * Update comment counter for a post
   */
  updateCommentCounter(postId, count) {
    // Find the post element
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;

    // Find the comment button and update counter
    const commentBtn = postElement.querySelector('.comment-btn span');
    if (commentBtn) {
      commentBtn.textContent = count;
      console.log(`Updated comment counter for post ${postId}: ${count}`);
    }

    // Also update in the comments toggle button
    const commentsToggle = postElement.querySelector('.comments-toggle');
    if (commentsToggle && count > 0) {
      const toggleText = commentsToggle.childNodes[1]; // Text node after icon
      if (toggleText && toggleText.nodeType === Node.TEXT_NODE) {
        toggleText.textContent = ` Mostra commenti (${count})`;
      }
    }
  }

  /**
   * Enrich comments with user data
   */
  async enrichCommentsWithUserData(comments) {
    for (const comment of comments) {
      // Initialize user_profiles object
      comment.user_profiles = {};

      try {
        // Get user profile to determine type
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', comment.user_id)
          .maybeSingle();

        if (profile) {
          comment.user_profiles.user_type = profile.user_type;

          // Get specific user data based on type
          if (profile.user_type === 'istituto') {
            const { data: institute } = await this.supabase
              .from('school_institutes')
              .select('institute_name')
              .eq('id', comment.user_id)
              .maybeSingle();

            if (institute) {
              comment.user_profiles.school_institutes = institute;
            }
          } else if (profile.user_type === 'privato') {
            const { data: privateUser } = await this.supabase
              .from('private_users')
              .select('first_name, last_name')
              .eq('id', comment.user_id)
              .maybeSingle();

            if (privateUser) {
              comment.user_profiles.private_users = privateUser;
            }
          }
        }
      } catch (err) {
        // Silent fail - use default values
        console.log('Could not load user details for comment:', comment.id);
      }
    }
  }

  /**
   * Render comments HTML
   */
  renderComments(comments, container, postId) {
    if (!comments || comments.length === 0) {
      container.innerHTML = `
        <div class="no-comments">
          <i class="fas fa-comment-slash"></i>
          <p>Nessun commento ancora. Sii il primo a commentare!</p>
        </div>
      `;
      return;
    }

    const commentsHTML = comments.map(comment => this.createCommentHTML(comment)).join('');

    container.innerHTML = `
      <div class="comments-list">
        ${commentsHTML}
      </div>
    `;
  }

  /**
   * Create HTML for a single comment
   */
  createCommentHTML(comment) {
    const authorName = this.getAuthorName(comment.user_profiles);
    const timeAgo = this.formatTimeAgo(new Date(comment.created_at));

    // ✅ Carica avatar immediatamente (senza setTimeout)
    if (window.avatarManager && comment.user_id) {
      // Carica avatar in modo asincrono ma immediato
      window.avatarManager.loadUserAvatar(comment.user_id).then(avatarUrl => {
        if (avatarUrl) {
          const avatarEl = document.getElementById(`comment-avatar-${comment.id}`);
          if (avatarEl) {
            window.avatarManager.setAvatarByUrl(avatarEl, avatarUrl);
          }
        }
      }).catch(err => {
        console.warn(`Could not load avatar for comment ${comment.id}:`, err);
      });
    }

    return `
      <div class="comment-item" data-comment-id="${comment.id}" data-user-id="${comment.user_id || ''}">
        <div class="comment-avatar" id="comment-avatar-${comment.id}" data-user-id="${comment.user_id || ''}">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${authorName}</span>
            <span class="comment-time">${timeAgo}</span>
            ${comment.user_id === this.currentUser?.id ? `
              <div class="comment-actions">
                <button class="comment-edit-btn" onclick="eduNetSocial.editComment('${comment.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="comment-delete-btn" onclick="eduNetSocial.deleteComment('${comment.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="comment-text">${this.escapeHtml(comment.content)}</div>
          ${comment.is_edited ? '<span class="comment-edited">(modificato)</span>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Add new comment
   */
  async addComment(postId, content, commentsContainer) {
    if (!this.currentUser) {
      this.showNotification('Devi essere loggato per commentare', 'warning');
      return;
    }

    // 🔒 PRIVACY CHECK: Private users cannot comment
    const userType = this.currentUser.user_metadata?.user_type || 'privato';
    if (userType === 'privato') {
      this.showNotification('Solo gli istituti possono commentare i post.', 'warning');
      return;
    }

    if (!content.trim()) {
      this.showNotification('Il commento non può essere vuoto', 'warning');
      return;
    }

    try {
      // Insert comment with simplified query
      const { data: newComment, error } = await this.supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: this.currentUser.id,
          content: content.trim()
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Enrich with current user profile data
      newComment.user_profiles = {
        user_type: this.currentUser.user_metadata?.user_type || 'privato'
      };

      if (newComment.user_profiles.user_type === 'istituto') {
        newComment.user_profiles.school_institutes = {
          institute_name: this.currentUser.user_metadata?.institute_name || 'Istituto'
        };
      } else {
        newComment.user_profiles.private_users = {
          first_name: this.currentUser.user_metadata?.first_name || '',
          last_name: this.currentUser.user_metadata?.last_name || ''
        };
      }

      // Add comment to UI
      this.addCommentToUI(newComment, commentsContainer);

      // Update comments count
      this.updateCommentsCount(postId, 1);

      // ✅ Track activity
      await this.logPostActivity('comment', postId);

      this.showNotification('Commento aggiunto con successo!', 'success');

    } catch (error) {
      console.error('Error adding comment:', error);
      this.showNotification('Errore nell\'aggiunta del commento', 'error');
    }
  }

  /**
   * Add comment to UI
   */
  addCommentToUI(comment, container) {
    const commentsList = container.querySelector('.comments-list');
    const noComments = container.querySelector('.no-comments');

    if (noComments) {
      // Replace no comments message with comments list
      container.innerHTML = '<div class="comments-list"></div>';
    }

    const commentHTML = this.createCommentHTML(comment);
    const commentsListElement = container.querySelector('.comments-list');
    commentsListElement.insertAdjacentHTML('beforeend', commentHTML);

    // Animate new comment
    const newCommentElement = commentsListElement.lastElementChild;
    newCommentElement.style.opacity = '0';
    newCommentElement.style.transform = 'translateY(20px)';

    setTimeout(() => {
      newCommentElement.style.transition = 'all 0.3s ease';
      newCommentElement.style.opacity = '1';
      newCommentElement.style.transform = 'translateY(0)';
    }, 100);
  }

  /**
   * Update comments count
   */
  updateCommentsCount(postId, increment) {
    const commentButtons = document.querySelectorAll(`[data-post-id="${postId}"] .comment-btn span`);
    commentButtons.forEach(span => {
      const currentCount = parseInt(span.textContent) || 0;
      const newCount = Math.max(0, currentCount + increment);
      span.textContent = newCount;
    });
  }

  // ===================================================================
  // POST CREATION SYSTEM
  // ===================================================================

  /**
   * Create new post
   */
  async createPost(postData) {
    // Refresh current user before checking
    if (window.eduNetAuth && window.eduNetAuth.isAuthenticated()) {
      this.currentUser = window.eduNetAuth.getCurrentUser();
    }

    if (!this.currentUser) {
      console.log('Social Features - No current user available');
      this.showNotification('Devi essere loggato per creare un post', 'warning');
      return null;
    }

    // 🔒 PRIVACY CHECK: Private users cannot create posts (except collaborators)
    const userType = this.currentUser.user_metadata?.user_type || 'privato';
    const userProfile = window.eduNetAuth?.getUserProfile();
    const isCollaborator = userProfile?.is_collaborator &&
      (userProfile?.collaborator_role === 'admin' || userProfile?.collaborator_role === 'editor');

    if (userType === 'privato' && !isCollaborator) {
      console.log('❌ Utente privato non collaboratore, blocco creazione post');
      this.showNotification('Solo gli istituti possono pubblicare post.', 'warning');
      return null;
    }

    // 🔒 VERIFICATION CHECK: Unverified institutes have limited posting
    if (userType === 'istituto' && !isCollaborator) {
      const verificationStatus = userProfile?.verification_status;
      const isVerified = verificationStatus === 'verified' || userProfile?.verified === true;
      
      if (!isVerified) {
        console.log('⚠️ Istituto non verificato, avviso limitazioni');
        // Permetti comunque la pubblicazione ma con avviso
        // In futuro si potrebbe bloccare completamente
      }
    }

    if (isCollaborator) {
      console.log('👥 Collaboratore autorizzato a creare post');
    }

    try {
      // Validate post data
      if (!postData.title?.trim()) {
        this.showNotification('Il titolo è obbligatorio', 'warning');
        return null;
      }

      if (!postData.content?.trim()) {
        this.showNotification('Il contenuto è obbligatorio', 'warning');
        return null;
      }

      console.log('Creating post for user:', this.currentUser.id);

      // Check if posts table exists before attempting to create
      if (!this.supabase) {
        console.log('Supabase client not available');
        this.showNotification('Servizio non disponibile al momento', 'warning');
        return null;
      }

      try {
        let instituteProfile = null;

        // Prima verifica se l'utente è un collaboratore
        const userProfile = window.eduNetAuth?.getUserProfile();

        if (userProfile?.is_collaborator && userProfile?.collaborator_data) {
          // L'utente è un collaboratore - usa l'istituto associato
          console.log('👥 Utente è un collaboratore, uso istituto associato');
          instituteProfile = {
            id: userProfile.collaborator_data.institute_id,
            institute_name: userProfile.collaborator_data.institute_name
          };
        } else if (userProfile?.can_manage_institute && userProfile?.managed_institute_id) {
          // L'utente può gestire un istituto (collaboratore admin/editor)
          console.log('👥 Utente può gestire istituto:', userProfile.managed_institute_name);
          instituteProfile = {
            id: userProfile.managed_institute_id,
            institute_name: userProfile.managed_institute_name
          };
        } else {
          // Verifica se l'utente ha un profilo istituto diretto
          // school_institutes.id è FK a user_profiles.id (che è uguale a auth.users.id)
          const { data: directProfile, error: profileError } = await this.supabase
            .from('school_institutes')
            .select('id, institute_name')
            .eq('id', this.currentUser.id)
            .maybeSingle();

          console.log('🏫 Direct institute profile check:', { directProfile, profileError });
          instituteProfile = directProfile;
        }

        if (!instituteProfile) {
          console.warn('⚠️ Utente non ha un profilo istituto completato');
          this.showNotification('⚠️ Completa il tuo profilo istituto per pubblicare post', 'warning');
          return null;
        }

        console.log('✅ Creating post for institute:', instituteProfile.institute_name);

        // Mappa post_type ai valori accettati dal database
        // Valori validi: 'post', 'progetto_didattico', 'metodologia', 'evento', 'notizia'
        const typeMapping = {
          'post': 'post',                    // Post generale
          'text': 'post',                    // Post di testo
          'project': 'progetto_didattico',   // Progetto didattico
          'methodology': 'metodologia',      // Metodologia educativa
          'evento': 'evento',                // Evento
          'notizia': 'notizia'               // Notizia
        };
        const postType = typeMapping[postData.type] || 'post';

        console.log('📤 Creating post via RPC:', {
          institute_id: instituteProfile.id,
          title: postData.title.trim(),
          post_type: postType
        });

        // Usa la funzione RPC per creare il post (bypassa RLS per collaboratori)
        const { data: result, error } = await this.supabase.rpc('create_institute_post', {
          p_institute_id: instituteProfile.id,
          p_title: postData.title.trim(),
          p_content: postData.content.trim(),
          p_post_type: postType,
          p_published: true
        });

        if (error) {
          console.error('❌ RPC Error creating post:', error);
          this.showNotification('Errore nella pubblicazione del post', 'error');
          return null;
        }

        if (!result.success) {
          console.error('❌ Post creation failed:', result.error);
          this.showNotification(result.error || 'Errore nella pubblicazione del post', 'error');
          return null;
        }

        const newPost = result.post;
        console.log('✅ Post created successfully:', newPost.id);

        // Log activity
        await this.logPostActivity('post_created', newPost.id);

        this.showNotification('Post pubblicato con successo!', 'success');

        // Return post with basic author info for immediate display
        return {
          ...newPost,
          author_id: this.currentUser.id, // Usa l'ID utente per compatibilità frontend
          user_profiles: {
            user_type: this.currentUser.user_metadata?.user_type || 'istituto',
            school_institutes: {
              id: instituteProfile.id,
              institute_name: instituteProfile.institute_name
            },
            private_users: {
              first_name: this.currentUser.user_metadata?.first_name || 'Utente',
              last_name: this.currentUser.user_metadata?.last_name || ''
            }
          }
        };

      } catch (dbError) {
        if (dbError.message === 'DATABASE_ERROR') {
          this.showNotification('Errore nella pubblicazione del post', 'error');
        } else {
          console.log('Database connection issue');
          this.showNotification('⚠️ Problema di connessione. Verifica la configurazione Supabase.', 'warning');
        }
        return null;
      }

    } catch (error) {
      // Silent handling of any other errors
      this.showNotification('Errore nella pubblicazione del post', 'error');
      return null;
    }
  }

  /**
   * Log post activity
   */
  async logPostActivity(activityType, postId, metadata = {}) {
    if (!this.currentUser) return;

    try {
      await this.supabase
        .from('user_activities')
        .insert([{
          user_id: this.currentUser.id,
          activity_type: activityType,
          target_type: 'post',
          target_id: postId,
          activity_data: metadata // ✅ Corretto: activity_data invece di metadata
        }]);
    } catch (error) {
      console.error('Error logging post activity:', error);
    }
  }

  /**
   * Show create post modal
   */
  showCreatePostModal(postType = 'post') {
    console.log('🎨 showCreatePostModal called with type:', postType);

    // Rimuovi eventuali modal esistenti
    const existingModal = document.querySelector('.create-post-modal');
    if (existingModal) {
      console.log('🗑️ Removing existing modal');
      existingModal.remove();
    }

    const modal = this.createPostModal(postType);
    console.log('📦 Modal created:', modal);

    // Applica stili inline come fallback se il CSS non è caricato
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 99999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(modal);
    console.log('✅ Modal appended to body');

    // Show modal with animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.classList.add('show');
      console.log('✅ Modal now visible');
      // Focus on title input
      const titleInput = modal.querySelector('#post-title');
      if (titleInput) titleInput.focus();
    }, 10);
  }

  /**
   * Create post modal HTML
   */
  createPostModal(postType) {
    const modal = document.createElement('div');
    modal.className = 'create-post-modal';
    modal.innerHTML = `
      <div class="create-post-modal-backdrop"></div>
      <div class="create-post-modal-content">
        <div class="create-post-modal-header">
          <h3>
            <i class="fas fa-${this.getPostTypeIcon(postType)}" aria-hidden="true"></i>
            ${this.getPostTypeTitle(postType)}
          </h3>
          <button class="create-post-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="create-post-modal-body">
          <form class="create-post-form" id="create-post-form">
            <div class="form-group">
              <label for="post-title">Titolo *</label>
              <input 
                type="text" 
                id="post-title" 
                name="title" 
                placeholder="Inserisci il titolo del ${postType}..."
                required
                maxlength="200"
              >
              <div class="char-counter">
                <span class="current">0</span>/<span class="max">200</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="post-content">Contenuto *</label>
              <textarea 
                id="post-content" 
                name="content" 
                placeholder="Descrivi il tuo ${postType}..."
                required
                rows="8"
                maxlength="5000"
              ></textarea>
              <div class="char-counter">
                <span class="current">0</span>/<span class="max">5000</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="post-type">Tipo di contenuto</label>
              <select id="post-type" name="type">
                <option value="post" ${postType === 'post' ? 'selected' : ''}>Post generale</option>
                <option value="project" ${postType === 'project' ? 'selected' : ''}>Progetto didattico</option>
                <option value="methodology" ${postType === 'methodology' ? 'selected' : ''}>Metodologia educativa</option>
                <option value="evento" ${postType === 'evento' ? 'selected' : ''}>Evento</option>
                <option value="notizia" ${postType === 'notizia' ? 'selected' : ''}>Notizia</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline cancel-btn">
                <i class="fas fa-times" aria-hidden="true"></i>
                Annulla
              </button>
              <button type="submit" class="btn btn-primary submit-btn">
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
                Pubblica ${postType}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachCreatePostModalListeners(modal, postType);

    return modal;
  }

  /**
   * Get post type icon
   */
  getPostTypeIcon(postType) {
    const icons = {
      post: 'plus',
      project: 'lightbulb',
      methodology: 'book-open'
    };
    return icons[postType] || 'plus';
  }

  /**
   * Get post type title
   */
  getPostTypeTitle(postType) {
    const titles = {
      post: 'Crea Nuovo Post',
      project: 'Crea Nuovo Progetto',
      methodology: 'Crea Nuova Metodologia'
    };
    return titles[postType] || 'Crea Nuovo Post';
  }

  /**
   * Attach event listeners to create post modal
   */
  attachCreatePostModalListeners(modal, postType) {
    console.log('🔗 Attaching modal listeners...');

    // Close modal
    const closeBtn = modal.querySelector('.create-post-modal-close');
    const backdrop = modal.querySelector('.create-post-modal-backdrop');
    const cancelBtn = modal.querySelector('.cancel-btn');

    [closeBtn, backdrop, cancelBtn].forEach(element => {
      if (element) {
        element.addEventListener('click', () => {
          this.closeCreatePostModal(modal);
        });
      }
    });

    console.log('✅ Close listeners attached');

    // Character counters
    const titleInput = modal.querySelector('#post-title');
    const contentTextarea = modal.querySelector('#post-content');

    if (titleInput) {
      this.setupCharacterCounter(titleInput, modal.querySelector('.form-group:nth-child(1) .char-counter'));
    }

    if (contentTextarea) {
      this.setupCharacterCounter(contentTextarea, modal.querySelector('.form-group:nth-child(2) .char-counter'));
    }

    // Form submission
    const form = modal.querySelector('#create-post-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleCreatePostSubmit(form, modal);
    });

    // Auto-resize textarea
    if (contentTextarea) {
      contentTextarea.addEventListener('input', () => {
        this.autoResizeTextarea(contentTextarea);
      });
    }

    // Keyboard shortcuts
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeCreatePostModal(modal);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  /**
   * Setup character counter
   */
  setupCharacterCounter(input, counterElement) {
    const updateCounter = () => {
      const current = input.value.length;
      const max = parseInt(input.getAttribute('maxlength'));
      const currentSpan = counterElement.querySelector('.current');

      currentSpan.textContent = current;

      // Color coding
      if (current > max * 0.9) {
        counterElement.classList.add('warning');
      } else {
        counterElement.classList.remove('warning');
      }

      if (current >= max) {
        counterElement.classList.add('error');
      } else {
        counterElement.classList.remove('error');
      }
    };

    input.addEventListener('input', updateCounter);
    updateCounter(); // Initial update
  }

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
  }

  /**
   * Handle create post form submission
   */
  async handleCreatePostSubmit(form, modal) {
    const submitBtn = modal.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;

    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pubblicando...';

      // Get form data
      const formData = new FormData(form);
      const postData = {
        title: formData.get('title'),
        content: formData.get('content'),
        type: formData.get('type')
      };

      // Create post
      const newPost = await this.createPost(postData);

      if (newPost) {
        // Add post to feed if homepage is loaded
        if (window.eduNetHomepage) {
          this.addPostToFeed(newPost);
        }

        // Close modal
        this.closeCreatePostModal(modal);
      }

    } catch (error) {
      console.error('Error submitting post:', error);
      this.showNotification('Errore nella pubblicazione del post', 'error');
    } finally {
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Add new post to feed
   */
  addPostToFeed(post) {
    if (!window.eduNetHomepage) return;

    // Transform post data to match expected format
    const transformedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: this.getAuthorName(post.user_profiles),
      created_at: new Date(post.created_at),
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      type: post.post_type
    };

    // Create post element (not mock since it's a real post)
    const postElement = window.eduNetHomepage.createPostElement(transformedPost, false);

    // Add to top of feed
    const feedContent = document.getElementById('feed-content');
    if (feedContent) {
      // Remove mock data banner if present
      const mockBanner = document.getElementById('mock-data-banner');
      if (mockBanner) {
        mockBanner.remove();
      }

      const firstChild = feedContent.firstElementChild;
      if (firstChild) {
        feedContent.insertBefore(postElement, firstChild);
      } else {
        feedContent.appendChild(postElement);
      }

      // Hide empty state if present
      const emptyState = feedContent.querySelector('.feed-empty');
      if (emptyState) {
        emptyState.style.display = 'none';
      }

      // Animate new post
      postElement.style.opacity = '0';
      postElement.style.transform = 'translateY(-20px)';

      setTimeout(() => {
        postElement.style.transition = 'all 0.5s ease';
        postElement.style.opacity = '1';
        postElement.style.transform = 'translateY(0)';
      }, 100);

      // Refresh the feed data to include the new post in future loads
      if (window.eduNetHomepage.feedData) {
        window.eduNetHomepage.feedData.unshift(transformedPost);
      }
    }
  }

  /**
   * Close create post modal
   */
  closeCreatePostModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }

  /**
   * Show share modal
   */
  showShareModal(postId, postTitle, postUrl) {
    const modal = this.createShareModal(postId, postTitle, postUrl);
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  /**
   * Create share modal HTML
   */
  createShareModal(postId, postTitle, postUrl) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-backdrop"></div>
      <div class="share-modal-content">
        <div class="share-modal-header">
          <h3>Condividi questo post</h3>
          <button class="share-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="share-modal-body">
          <div class="share-options">
            <button class="share-option" data-platform="facebook">
              <i class="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </button>
            <button class="share-option" data-platform="twitter">
              <i class="fab fa-twitter"></i>
              <span>Twitter</span>
            </button>
            <button class="share-option" data-platform="linkedin">
              <i class="fab fa-linkedin-in"></i>
              <span>LinkedIn</span>
            </button>
            <button class="share-option" data-platform="whatsapp">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </button>
            <button class="share-option" data-platform="telegram">
              <i class="fab fa-telegram-plane"></i>
              <span>Telegram</span>
            </button>
            <button class="share-option" data-platform="email">
              <i class="fas fa-envelope"></i>
              <span>Email</span>
            </button>
          </div>
          <div class="share-link">
            <label>Link diretto:</label>
            <div class="share-link-input">
              <input type="text" value="${postUrl}" readonly id="share-url-${postId}" name="shareUrl">
              <button class="copy-link-btn" data-url="${postUrl}">
                <i class="fas fa-copy"></i>
                Copia
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachShareModalListeners(modal, postId, postTitle, postUrl);

    return modal;
  }

  /**
   * Attach event listeners to share modal
   */
  attachShareModalListeners(modal, postId, postTitle, postUrl) {
    // Close modal
    const closeBtn = modal.querySelector('.share-modal-close');
    const backdrop = modal.querySelector('.share-modal-backdrop');

    [closeBtn, backdrop].forEach(element => {
      element.addEventListener('click', () => {
        this.closeShareModal(modal);
      });
    });

    // Share options
    const shareOptions = modal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
      option.addEventListener('click', () => {
        const platform = option.dataset.platform;
        this.shareToPlatform(platform, postId, postTitle, postUrl);
        this.closeShareModal(modal);
      });
    });

    // Copy link
    const copyBtn = modal.querySelector('.copy-link-btn');
    copyBtn.addEventListener('click', () => {
      this.copyToClipboard(postUrl);
      this.recordShare(postId, 'copy_link');
    });
  }

  /**
   * Share to specific platform
   */
  async shareToPlatform(platform, postId, postTitle, postUrl) {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(postTitle + ' ' + postUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`,
      email: `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(postTitle + '\n\n' + postUrl)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      await this.recordShare(postId, platform);
    }
  }

  /**
   * Record share in database
   */
  async recordShare(postId, platform) {
    if (!this.currentUser) return;

    try {
      const { error } = await this.supabase
        .from('post_shares')
        .insert([{
          post_id: postId,
          user_id: this.currentUser.id,
          platform: platform
        }]);

      if (error) throw error;

      // Update shares count in UI
      this.updateSharesCount(postId, 1);

    } catch (error) {
      console.error('Error recording share:', error);
    }
  }

  /**
   * Update shares count
   */
  updateSharesCount(postId, increment) {
    const shareButtons = document.querySelectorAll(`[data-post-id="${postId}"] .share-btn span`);
    shareButtons.forEach(span => {
      if (span.textContent !== 'Condividi') {
        const currentCount = parseInt(span.textContent) || 0;
        const newCount = Math.max(0, currentCount + increment);
        span.textContent = newCount;
      }
    });
  }

  /**
   * Close share modal
   */
  closeShareModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Link copiato negli appunti!', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showNotification('Errore nella copia del link', 'error');
    }
  }

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================

  /**
   * Get author name from user profile
   */
  getAuthorName(userProfile) {
    // Handle missing or incomplete user profile
    if (!userProfile) {
      return 'Utente';
    }

    if (userProfile.user_type === 'istituto') {
      return userProfile.school_institutes?.institute_name || 'Istituto';
    } else if (userProfile.user_type === 'privato') {
      const firstName = userProfile.private_users?.first_name || '';
      const lastName = userProfile.private_users?.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Utente';
    } else {
      return 'Utente';
    }
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;

    return date.toLocaleDateString('it-IT');
  }

  /**
   * Escape HTML to prevent XSS
   * Uses sanitizer module when available, fallback to basic escaping
   */
  escapeHtml(text) {
    // Use sanitizer module if available
    if (window.sanitizer && window.sanitizer.escapeHtml) {
      return window.sanitizer.escapeHtml(text);
    }
    // Fallback to basic escaping
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (window.eduNetApp && window.eduNetApp.showNotification) {
      window.eduNetApp.showNotification(message, type);
    } else if (window.eduNetAuth && window.eduNetAuth.showNotification) {
      window.eduNetAuth.showNotification(message, type);
    } else {
      // Fallback silenzioso - non loggare in console per evitare spam
      if (type === 'error') {
        console.log(`⚠️ ${message}`);
      }
    }
  }
}

// Initialize social features
window.eduNetSocial = new EduNetSocialFeatures();

console.log('🎯 EduNet Social Features - Script loaded successfully');
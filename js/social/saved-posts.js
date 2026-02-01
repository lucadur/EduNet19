/**
 * ===================================================================
 * SAVED POSTS MANAGER
 * Gestisce la visualizzazione e interazione con i post salvati
 * ===================================================================
 */

'use strict';

class SavedPostsManager {
  constructor() {
    this.currentFilter = 'all';
    this.savedPosts = [];
    this.isLoading = false;

    this.init();
  }

  /**
   * Inizializza il manager
   */
  async init() {
    this.setupEventListeners();

    // Carica conteggio iniziale
    await this.updateSavedCount();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.saved-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.savedFilter;
        this.applyFilter(filter);
      });
    });

    // Back to feed button
    const backBtn = document.getElementById('back-to-feed-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideSavedPosts();
        // Trigger feed section
        const feedLink = document.querySelector('[data-section="feed"]');
        if (feedLink) feedLink.click();
      });
    }
  }

  /**
   * Mostra la sezione saved posts
   */
  async showSavedPosts() {
    console.log('📂 showSavedPosts called');

    const savedSection = document.getElementById('saved-posts-section');
    const feedContent = document.getElementById('feed-content');
    const loadMoreSection = document.getElementById('load-more-section');
    const eduMatchSection = document.getElementById('eduMatchSection');
    const feedHeader = document.querySelector('.feed-header');
    const smartFilters = document.querySelector('.smart-filters');
    const feedTabs = document.querySelector('.feed-tabs');

    console.log('📂 Elements found:', {
      savedSection: !!savedSection,
      feedContent: !!feedContent,
      eduMatchSection: !!eduMatchSection,
      feedHeader: !!feedHeader
    });

    if (!savedSection) {
      console.error('❌ saved-posts-section not found!');
      return;
    }

    // Nascondi COMPLETAMENTE tutte le altre sezioni
    if (feedContent) {
      feedContent.style.display = 'none';
      feedContent.classList.add('hidden');
    }
    if (loadMoreSection) loadMoreSection.style.display = 'none';
    if (eduMatchSection) eduMatchSection.style.display = 'none';
    if (feedHeader) feedHeader.style.display = 'none';
    if (smartFilters) smartFilters.style.display = 'none';
    if (feedTabs) feedTabs.style.display = 'none';

    // Mostra sezione salvati
    savedSection.classList.remove('hidden');
    savedSection.style.display = 'block';

    // Scroll to top per vedere subito i salvati
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('✅ Saved section should now be visible');

    // Carica i post salvati
    await this.loadSavedPosts();
  }

  /**
   * Nascondi la sezione saved posts
   */
  hideSavedPosts() {
    console.log('📂 hideSavedPosts called');

    const savedSection = document.getElementById('saved-posts-section');
    const feedContent = document.getElementById('feed-content');
    const loadMoreSection = document.getElementById('load-more-section');
    const eduMatchSection = document.getElementById('eduMatchSection');
    const feedHeader = document.querySelector('.feed-header');
    const smartFilters = document.querySelector('.smart-filters');
    const feedTabs = document.querySelector('.feed-tabs');

    // Nascondi sezione salvati
    if (savedSection) {
      savedSection.classList.add('hidden');
      savedSection.style.display = 'none';
    }

    // Ripristina TUTTO il feed
    if (feedContent) {
      feedContent.style.display = '';
      feedContent.classList.remove('hidden');
    }
    if (loadMoreSection) loadMoreSection.style.display = 'block';
    if (eduMatchSection) eduMatchSection.style.display = '';
    if (feedHeader) feedHeader.style.display = '';
    if (smartFilters) smartFilters.style.display = '';
    if (feedTabs) feedTabs.style.display = '';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('✅ Feed restored');
  }

  /**
   * Carica i post salvati dal database
   */
  async loadSavedPosts() {
    if (this.isLoading) return;
    this.isLoading = true;

    const loadingEl = document.getElementById('saved-loading');
    const emptyEl = document.getElementById('saved-empty');
    const contentEl = document.getElementById('saved-posts-content');

    try {
      // Mostra loading
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');

      // Verifica Supabase disponibile
      if (!window.supabaseClientManager?.client) {
        console.log('Supabase not available, showing empty state');
        this.showEmptyState();
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('User not authenticated');
        this.showEmptyState();
        return;
      }

      // Query per ottenere i post salvati
      console.log('Fetching saved posts for user:', user.id);

      const { data: savedData, error } = await supabase
        .from('saved_posts')
        .select('id, created_at, post_id, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Saved posts query result:', { savedData, error, count: savedData?.length });

      if (error) {
        console.error('Error loading saved posts:', error);
        this.showEmptyState();
        return;
      }

      // Fetch post details separately per evitare problemi di join
      const postIds = (savedData || []).map(item => item.post_id);

      console.log('Post IDs to fetch:', postIds);

      if (postIds.length === 0) {
        console.log('No saved posts found, showing empty state');
        this.savedPosts = [];
        await this.updateStats();
        this.renderSavedPosts();
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('institute_posts')
        .select('id, title, content, institute_id, post_type, image_urls, created_at, likes_count, comments_count, views_count')
        .in('id', postIds);

      console.log('Posts data fetched:', { postsData, postsError, count: postsData?.length });

      if (postsError) {
        console.error('Error loading posts details:', postsError);
      }

      // Load author names for all posts
      const instituteIds = [...new Set((postsData || []).map(post => post.institute_id))];
      const authorsMap = {};

      for (const instituteId of instituteIds) {
        try {
          const { data: institute } = await supabase
            .from('school_institutes')
            .select('institute_name')
            .eq('id', instituteId)
            .maybeSingle();

          if (institute) {
            authorsMap[instituteId] = institute.institute_name;
          }
        } catch (err) {
          console.warn('Could not load author for institute:', instituteId);
        }
      }

      // Crea mappa post_id -> post
      const postsMap = {};
      (postsData || []).forEach(post => {
        postsMap[post.id] = {
          ...post,
          author_name: authorsMap[post.institute_id] || 'Istituto'
        };
      });

      // Combina saved_posts con i dettagli dei post
      this.savedPosts = (savedData || [])
        .map(item => {
          const post = postsMap[item.post_id];
          if (!post) return null; // Post eliminato

          return {
            saved_id: item.id,
            saved_at: item.created_at,
            post: {
              ...post,
              // Normalizza i nomi per compatibilità con il resto del codice
              author_id: post.institute_id,
              likes: post.likes_count,
              comments: post.comments_count,
              shares: 0, // shares_count non esiste nella tabella
              views: post.views_count,
              image_url: post.image_urls?.[0] || null
            }
          };
        })
        .filter(item => item !== null); // Rimuovi post eliminati

      console.log(`Loaded ${this.savedPosts.length} saved posts`);

      // Aggiorna statistiche
      await this.updateStats();

      // Renderizza i post
      this.renderSavedPosts();

    } catch (error) {
      console.error('Error in loadSavedPosts:', error);
      this.showEmptyState();
    } finally {
      this.isLoading = false;
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  /**
   * Aggiorna solo il contatore senza ricaricare tutto
   */
  async updateSavedCount() {
    try {
      if (!window.supabaseClientManager?.client) return;

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { count, error } = await supabase
        .from('saved_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      const totalCount = count || 0;

      // Update badges
      const sidebarBadge = document.getElementById('saved-count');
      if (sidebarBadge) {
        sidebarBadge.textContent = totalCount;
        sidebarBadge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
      }

      const mobileBadge = document.getElementById('mobile-saved-count');
      if (mobileBadge) {
        mobileBadge.textContent = totalCount;
        mobileBadge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
      }
    } catch (error) {
      console.error('Error updating saved count:', error);
    }
  }

  /**
   * Aggiorna le statistiche
   */
  async updateStats() {
    const totalCount = this.savedPosts.length;

    // Total saved
    const totalEl = document.getElementById('total-saved-count');
    if (totalEl) totalEl.textContent = totalCount;

    // Saved count in sidebar badge
    const sidebarBadge = document.getElementById('saved-count');
    if (sidebarBadge) {
      sidebarBadge.textContent = totalCount;
      sidebarBadge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    }

    // Mobile badge
    const mobileBadge = document.getElementById('mobile-saved-count');
    if (mobileBadge) {
      mobileBadge.textContent = totalCount;
      mobileBadge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    }

    // This week count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekCount = this.savedPosts.filter(item => {
      const savedDate = new Date(item.saved_at);
      return savedDate >= oneWeekAgo;
    }).length;

    const weekEl = document.getElementById('saved-this-week-count');
    if (weekEl) weekEl.textContent = thisWeekCount;

    // Most saved category
    const categories = {};
    this.savedPosts.forEach(item => {
      const category = item.post?.category || 'Altro';
      categories[category] = (categories[category] || 0) + 1;
    });

    let mostSavedCategory = '-';
    let maxCount = 0;
    Object.entries(categories).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostSavedCategory = cat;
      }
    });

    const categoryEl = document.getElementById('most-saved-category');
    if (categoryEl) categoryEl.textContent = mostSavedCategory;
  }

  /**
   * Renderizza i post salvati
   */
  renderSavedPosts() {
    const contentEl = document.getElementById('saved-posts-content');
    const emptyEl = document.getElementById('saved-empty');

    if (!contentEl) return;

    // Rimuovi vecchi post (mantieni loading ed empty state)
    const oldPosts = contentEl.querySelectorAll('.saved-post-item');
    oldPosts.forEach(post => post.remove());

    if (this.savedPosts.length === 0) {
      this.showEmptyState();
      return;
    }

    // Nascondi empty state
    if (emptyEl) emptyEl.classList.add('hidden');

    // Applica filtro corrente
    let filteredPosts = [...this.savedPosts];

    switch (this.currentFilter) {
      case 'recent':
        // Già ordinati per data (più recenti prima)
        break;
      case 'oldest':
        filteredPosts.reverse();
        break;
      case 'most-liked':
        filteredPosts.sort((a, b) => (b.post?.likes || 0) - (a.post?.likes || 0));
        break;
      default:
        // 'all' - mantieni ordine originale
        break;
    }

    // Renderizza ogni post
    filteredPosts.forEach(item => {
      const postEl = this.createSavedPostElement(item);
      contentEl.appendChild(postEl);
    });
  }

  /**
   * Crea l'elemento HTML per un post salvato
   */
  createSavedPostElement(item) {
    const post = item.post;
    const savedAt = new Date(item.saved_at);
    const postDate = new Date(post.created_at);

    const article = document.createElement('article');
    article.className = 'saved-post-item';
    article.dataset.postId = post.id;
    article.dataset.savedId = item.saved_id;

    // Format dates
    const savedTimeAgo = this.getTimeAgo(savedAt);
    const postTimeAgo = this.getTimeAgo(postDate);

    // Get author info
    const authorName = post.author_name || 'Istituto Autore';
    const authorId = post.institute_id || post.author_id;

    // ✅ Load avatar immediatamente (senza setTimeout)
    if (window.avatarManager && authorId) {
      window.avatarManager.loadUserAvatar(authorId).then(avatarUrl => {
        if (avatarUrl) {
          const avatarEl = article.querySelector('.saved-post-author-avatar');
          if (avatarEl) {
            avatarEl.src = avatarUrl;
          }
        }
      }).catch(err => {
        console.warn(`Could not load avatar for saved post ${post.id}:`, err);
      });
    }

    article.innerHTML = `
      <div class="saved-post-header">
        <div class="saved-post-meta">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%236366f1' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-family='Arial'%3E${authorName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E" alt="${authorName}" class="saved-post-author-avatar">
          <div class="saved-post-author-info">
            <h4>${authorName}</h4>
            <p>${postTimeAgo}</p>
          </div>
        </div>
        <div class="saved-post-actions">
          <button class="saved-action-btn share-btn" title="Condividi" data-post-id="${post.id}">
            <i class="fas fa-share"></i>
          </button>
          <button class="saved-action-btn remove-saved" title="Rimuovi dai salvati" data-saved-id="${item.saved_id}" data-post-id="${post.id}">
            <i class="fas fa-bookmark"></i>
          </button>
        </div>
      </div>
      <div class="saved-post-content">
        <h3>${this.escapeHtml(post.title || 'Post senza titolo')}</h3>
        <p>${this.escapeHtml(post.content || '')}</p>
      </div>
      <div class="saved-post-footer">
        <span class="saved-post-stat">
          <i class="fas fa-heart"></i>
          ${post.likes || 0}
        </span>
        <span class="saved-post-stat">
          <i class="fas fa-comment"></i>
          ${post.comments || 0}
        </span>
        <span class="saved-post-stat">
          <i class="fas fa-share"></i>
          ${post.shares || 0}
        </span>
        <span class="saved-date">Salvato ${savedTimeAgo}</span>
      </div>
    `;

    // Event listeners
    this.attachSavedPostListeners(article);

    return article;
  }

  /**
   * Attach event listeners to saved post element
   */
  attachSavedPostListeners(article) {
    // Remove from saved
    const removeBtn = article.querySelector('.remove-saved');
    if (removeBtn) {
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const savedId = e.currentTarget.dataset.savedId;
        const postId = e.currentTarget.dataset.postId;
        await this.removeFromSaved(savedId, postId, article);
      });
    }

    // Share button
    const shareBtn = article.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = e.currentTarget.dataset.postId;
        await this.sharePost(postId);
      });
    }

    // Click on post to navigate to it in the feed
    article.addEventListener('click', (e) => {
      // Ignora click sui bottoni
      if (e.target.closest('.saved-action-btn')) return;

      const postId = article.dataset.postId;
      console.log('📍 Navigating to post:', postId);
      this.navigateToPost(postId);
    });
  }

  /**
   * Rimuovi post dai salvati
   */
  async removeFromSaved(savedId, postId, articleEl) {
    try {
      if (!window.supabaseClientManager?.client) return;

      const supabase = await window.supabaseClientManager.getClient();

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      // Rimuovi visivamente
      articleEl.style.opacity = '0';
      articleEl.style.transform = 'translateX(100px)';

      setTimeout(() => {
        articleEl.remove();

        // Aggiorna array locale
        this.savedPosts = this.savedPosts.filter(item => item.saved_id !== savedId);

        // Aggiorna stats
        this.updateStats();

        // Se nessun post rimane, mostra empty state
        if (this.savedPosts.length === 0) {
          this.showEmptyState();
        }
      }, 300);

      // Mostra notifica
      if (window.eduNetHomepage) {
        window.eduNetHomepage.showNotification('Post rimosso dai salvati', 'success');
      }

      // Track activity
      await this.trackActivity('unsave_post', postId);

    } catch (error) {
      console.error('Error removing saved post:', error);
      if (window.eduNetHomepage) {
        window.eduNetHomepage.showNotification('Errore nella rimozione', 'error');
      }
    }
  }

  /**
   * Condividi post
   */
  async sharePost(postId) {
    const postUrl = window.AppConfig.getPageUrl(`post/${postId}`);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Post da EduNet19',
          url: postUrl
        });

        // Track share activity
        await this.trackActivity('share_post', postId);

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(postUrl);
      if (window.eduNetHomepage) {
        window.eduNetHomepage.showNotification('🔗 Link copiato negli appunti', 'success');
      }
    }
  }

  /**
   * Applica filtro
   */
  applyFilter(filter) {
    this.currentFilter = filter;

    // Aggiorna UI dei bottoni
    const filterButtons = document.querySelectorAll('.saved-filter-btn');
    filterButtons.forEach(btn => {
      if (btn.dataset.savedFilter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Re-render posts
    this.renderSavedPosts();
  }

  /**
   * Mostra empty state
   */
  showEmptyState() {
    const emptyEl = document.getElementById('saved-empty');
    const contentEl = document.getElementById('saved-posts-content');

    if (emptyEl) emptyEl.classList.remove('hidden');

    // Rimuovi tutti i post
    if (contentEl) {
      const oldPosts = contentEl.querySelectorAll('.saved-post-item');
      oldPosts.forEach(post => post.remove());
    }

    // Reset stats
    const totalEl = document.getElementById('total-saved-count');
    if (totalEl) totalEl.textContent = '0';

    const weekEl = document.getElementById('saved-this-week-count');
    if (weekEl) weekEl.textContent = '0';

    const categoryEl = document.getElementById('most-saved-category');
    if (categoryEl) categoryEl.textContent = '-';
  }

  /**
   * Track activity nel database
   */
  async trackActivity(activityType, targetId) {
    try {
      if (!window.supabaseClientManager?.client) return;

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          target_type: 'post',
          target_id: targetId
        });

      if (error && error.code !== 'PGRST116') {
        console.log('Activity tracking error:', error.message);
      }
    } catch (error) {
      // Silent fail for activity tracking
      console.log('Activity tracking failed:', error.message);
    }
  }

  /**
   * Helper: Get time ago string
   */
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' anni fa';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' mesi fa';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' giorni fa';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' ore fa';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minuti fa';

    return Math.floor(seconds) + ' secondi fa';
  }

  /**
   * Helper: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Naviga al post nel feed della homepage
   */
  navigateToPost(postId) {
    console.log('📍 Navigating to post in feed:', postId);

    // Prima nascondi la sezione salvati e mostra il feed
    this.hideSavedPosts();

    // Attendi che il feed sia visibile
    setTimeout(() => {
      // Usa la funzione navigateToPost di homepage se disponibile
      if (window.eduNetHomepage && typeof window.eduNetHomepage.navigateToPost === 'function') {
        window.eduNetHomepage.navigateToPost(postId);
      } else {
        // Fallback: cerca manualmente il post
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);

        if (postElement) {
          console.log('✅ Post found in feed, scrolling...');

          postElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Aggiungi highlight temporaneo (usa stessa classe di homepage)
          postElement.classList.add('post-highlighted');
          setTimeout(() => {
            postElement.classList.remove('post-highlighted');
          }, 3000);
        } else {
          // Fallback: ricarica la pagina con hash
          console.log('⚠️ Post not found, redirecting...');
          window.location.href = window.AppConfig.getPageUrl(`homepage.html#post/${postId}`);
        }
      }
    }, 150);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.savedPostsManager = new SavedPostsManager();
  });
} else {
  window.savedPostsManager = new SavedPostsManager();
}

console.log('💾 Saved Posts Manager - Script loaded successfully');

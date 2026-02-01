/**
 * MOBILE SEARCH - Con ricerca live integrata
 */

(function () {
  'use strict';

  const btn = document.getElementById('mobileSearchBtn');
  const overlay = document.getElementById('mobileSearchOverlay');
  const backBtn = document.getElementById('mobileSearchBack');
  const input = document.getElementById('mobileSearchInput');
  const clearBtn = document.getElementById('mobileSearchClear');
  const resultsContainer = document.getElementById('mobileSearchResults');

  if (!btn || !overlay) return;

  let searchTimeout = null;

  // Apri search
  btn.addEventListener('click', () => {
    overlay.classList.add('active');
    document.body.classList.add('mobile-search-active');
    setTimeout(() => input?.focus(), 300);
  });

  // Chiudi search
  function closeSearch() {
    overlay.classList.remove('active');
    document.body.classList.remove('mobile-search-active');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    // Reset to empty state
    showEmptyState();
  }

  backBtn?.addEventListener('click', closeSearch);

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Clear button
  input?.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }

    // Debounced search
    clearTimeout(searchTimeout);

    if (query.length === 0) {
      showEmptyState();
    } else if (query.length >= 2) {
      searchTimeout = setTimeout(() => {
        performMobileSearch(query);
      }, 300); // 300ms debounce
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (input) {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();
      showEmptyState();
    }
  });

  // Setup suggestion clicks
  setupSuggestions();

  /**
   * Show empty state (suggestions)
   */
  function showEmptyState() {
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="mobile-search-empty">
        <div class="quick-suggestions">
          <h3>Suggerimenti</h3>
          <div class="suggestion-item" data-query="Istituti Roma">
            <i class="fas fa-search"></i>
            <span>Istituti Roma</span>
          </div>
          <div class="suggestion-item" data-query="Progetti STEM">
            <i class="fas fa-search"></i>
            <span>Progetti STEM</span>
          </div>
          <div class="suggestion-item" data-query="Metodologie innovative">
            <i class="fas fa-search"></i>
            <span>Metodologie innovative</span>
          </div>
        </div>
      </div>
    `;

    setupSuggestions();
  }

  /**
   * Setup suggestion item clicks
   */
  function setupSuggestions() {
    const suggestionItems = resultsContainer?.querySelectorAll('.suggestion-item[data-query]');
    suggestionItems?.forEach(item => {
      item.addEventListener('click', () => {
        const query = item.dataset.query;
        if (input && query) {
          input.value = query;
          performMobileSearch(query);
        }
      });
    });
  }

  /**
   * Perform mobile search (riutilizza logica homepage)
   */
  async function performMobileSearch(query) {
    if (!resultsContainer) return;

    // Show loading
    resultsContainer.innerHTML = `
      <div class="mobile-search-no-results">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Ricerca in corso...</p>
      </div>
    `;

    try {
      console.log('Mobile search for:', query);

      const results = [];

      // Get Supabase client
      const supabase = window.supabaseClientManager ? await window.supabaseClientManager.getClient() : null;

      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Search in institutes (with avatar via avatarManager AND PRIVACY CHECK)
      try {
        const { data: institutes, error: institutesError } = await supabase
          .from('school_institutes')
          .select('id, institute_name, institute_type, city')
          .ilike('institute_name', `*${query}*`)
          .limit(10); // Fetch more, then filter

        if (institutesError) {
          console.error('Institutes search error:', institutesError);
        } else if (institutes && institutes.length > 0) {
          for (const inst of institutes) {
            // 🔒 Check Privacy
            const { data: privacy } = await supabase
              .from('user_privacy_settings')
              .select('profile_visibility, searchable_by_email')
              .eq('user_id', inst.id)
              .maybeSingle();

            // Skip if private
            if (privacy && privacy.profile_visibility === 'private') continue;

            // Skip if email search is disabled AND query looks like an email
            if (privacy && privacy.searchable_by_email === false && query.includes('@')) {
              continue;
            }

            let avatarUrl = null;

            // Get avatar using avatarManager
            if (window.avatarManager) {
              try {
                avatarUrl = await window.avatarManager.loadUserAvatar(inst.id);
              } catch (avatarError) {
                console.warn('Could not load avatar for institute:', inst.id);
              }
            }

            results.push({
              type: 'institute',
              name: inst.institute_name || 'Istituto',
              location: `${inst.institute_type || 'Istituto'} - ${inst.city || 'Posizione non specificata'}`,
              avatarUrl: avatarUrl,
              id: inst.id
            });

            if (results.length >= 5) break; // Limit visible results
          }
        }
      } catch (instituteError) {
        console.error('Error searching institutes:', instituteError);
      }

      // Search in private users (with avatar via avatarManager AND PRIVACY CHECK)
      // DISABLED FOR PRIVACY
      /*
      try {
        const { data: privateUsers, error: usersError } = await supabase
          .from('private_users')
          .select('id, first_name, last_name')
          .or(`first_name.ilike.*${query}*,last_name.ilike.*${query}*`)
          .limit(10);
        
        if (usersError) {
          console.error('Users search error:', usersError);
        } else if (privateUsers && privateUsers.length > 0) {
          for (const user of privateUsers) {
            // 🔒 Check Privacy
            const { data: privacy } = await supabase
              .from('user_privacy_settings')
              .select('profile_visibility, searchable_by_email')
              .eq('user_id', user.id)
              .maybeSingle();

            // Skip if private
            if (privacy && privacy.profile_visibility === 'private') continue;

            // Skip if email search is disabled AND query looks like an email
            if (privacy && privacy.searchable_by_email === false && query.includes('@')) {
               continue;
            }

            let avatarUrl = null;
            
            // Get avatar using avatarManager
            if (window.avatarManager) {
              try {
                avatarUrl = await window.avatarManager.loadUserAvatar(user.id);
              } catch (avatarError) {
                console.warn('Could not load avatar for user:', user.id);
              }
            }
            
            results.push({
              type: 'user',
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utente',
              location: 'Utente Privato',
              avatarUrl: avatarUrl,
              id: user.id
            });

            if (results.length >= 10) break; // Combined limit logic simplified
          }
        }
      } catch (userError) {
        console.error('Error searching users:', userError);
      }
      */

      // Search posts using institute_posts table (with tags and avatar)
      try {
        const { data: posts, error: postsError } = await supabase
          .from('institute_posts')
          .select('id, title, post_type, institute_id, tags')
          .ilike('title', `*${query}*`)
          .eq('published', true)
          .limit(10);

        if (postsError) {
          console.error('Posts search error:', postsError);
        } else if (posts && posts.length > 0) {
          for (const post of posts) {
            let authorName = 'Autore sconosciuto';
            let authorAvatar = null;

            // Get author name from school_institutes
            try {
              const { data: author } = await supabase
                .from('school_institutes')
                .select('institute_name')
                .eq('id', post.institute_id)
                .maybeSingle();

              if (author) {
                authorName = author.institute_name || 'Istituto';
              }

              // Get avatar using avatarManager
              if (window.avatarManager) {
                authorAvatar = await window.avatarManager.loadUserAvatar(post.institute_id);
              }
            } catch (authorError) {
              console.warn('Could not fetch author for post:', post.id);
            }

            results.push({
              type: post.post_type || 'post',
              title: post.title,
              author: authorName,
              avatarUrl: authorAvatar,
              tags: post.tags || [],
              id: post.id,
              authorId: post.institute_id // Added for avatar
            });
          }
        }
      } catch (postError) {
        console.error('Error searching posts:', postError);
      }

      console.log('Mobile search results:', results);

      // Display results
      displayMobileResults(results);

    } catch (error) {
      console.error('Mobile search error:', error);
      displayMobileResults([]);
    }
  }

  /**
   * Display mobile search results (unified with desktop format)
   */
  function displayMobileResults(results) {
    if (!resultsContainer) return;

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="mobile-search-no-results">
          <i class="fas fa-search"></i>
          <p>Nessun risultato trovato</p>
          <small>Prova con parole chiave diverse</small>
        </div>
      `;
    } else {
      // Wrap results in a container for proper scrolling
      const resultsHtml = results.map(result => {
        // Determine the correct User ID for the avatar
        const avatarUserId = (result.type === 'notizia' || result.type === 'progetto' || result.type === 'metodologia' || result.type === 'evento' || result.type === 'post')
          ? result.authorId
          : result.id;

        // Avatar HTML (unified with desktop)
        const avatarHtml = result.avatarUrl
          ? `<img src="${result.avatarUrl}" alt="Avatar" class="search-result-avatar" data-user-id="${avatarUserId}">`
          : `<div class="search-result-avatar search-result-avatar-default" data-user-id="${avatarUserId}">
               <i class="fas fa-${result.type === 'institute' ? 'school' : result.type === 'user' ? 'user' : 'school'}"></i>
             </div>`;

        // For posts, show badge and tags (unified with desktop)
        if (result.type === 'notizia' || result.type === 'progetto' || result.type === 'metodologia' || result.type === 'evento' || result.type === 'post') {
          const badgeInfo = getPostBadgeInfo(result.type);
          return `
            <div class="search-result-item" data-id="${result.id || ''}" data-type="${result.type}">
              ${avatarHtml}
              <div class="search-result-main">
                <div class="search-result-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="result-author" style="margin: 0; font-weight: 600; color: var(--color-gray-700); font-size: 0.85rem;">${result.author}</span>
                  <span class="search-badge ${badgeInfo.class}" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">
                    <i class="${badgeInfo.icon}"></i>
                    ${badgeInfo.label}
                  </span>
                </div>
                <div class="result-content" style="margin-top: 0.25rem;">
                  <h4 style="margin-bottom: 0.25rem;">${result.title}</h4>
                  ${result.tags && result.tags.length > 0 ? `
                    <div class="result-tags">
                      ${result.tags.slice(0, 3).map(tag => `<span class="result-tag">#${tag}</span>`).join('')}
                      ${result.tags.length > 3 ? `<span class="result-tag-more">+${result.tags.length - 3}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        } else {
          // For profiles (unified with desktop)
          return `
            <div class="search-result-item" data-id="${result.id || ''}" data-type="${result.type}">
              ${avatarHtml}
              <div class="result-content">
                <h4>${result.name || result.title}</h4>
                <p>${result.location || result.author || result.category || ''}</p>
              </div>
            </div>
          `;
        }
      }).join('');

      // Insert with wrapper container
      resultsContainer.innerHTML = `<div class="mobile-search-results-container">${resultsHtml}</div>`;

      // Add click handlers
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const resultType = item.dataset.type;
          const resultId = item.dataset.id;

          console.log('Mobile search - Clicked result:', resultType, resultId);

          // Handle navigation
          if (resultType === 'institute' || resultType === 'user') {
            window.location.href = window.AppConfig.getPageUrl(`pages/profile/profile.html?id=${resultId}`);
          } else if (resultType === 'notizia' || resultType === 'progetto' || resultType === 'metodologia' || resultType === 'evento') {
            if (window.eduNetHomepage && typeof window.eduNetHomepage.navigateToPost === 'function') {
              window.eduNetHomepage.navigateToPost(resultId);
            } else {
              window.location.href = window.AppConfig.getPageUrl(`homepage.html#post/${resultId}`);
            }
          }

          closeSearch();
        });
      });
    }
  }

  /**
   * Get badge info for post types (unified with desktop)
   */
  function getPostBadgeInfo(type) {
    const badges = {
      'notizia': { label: 'Post', icon: 'fas fa-align-left', class: 'badge-post' },
      'progetto': { label: 'Progetto', icon: 'fas fa-lightbulb', class: 'badge-project' },
      'metodologia': { label: 'Metodologia', icon: 'fas fa-book-open', class: 'badge-methodology' },
      'evento': { label: 'Galleria', icon: 'fas fa-images', class: 'badge-gallery' }
    };
    return badges[type] || badges['notizia'];
  }

  /**
   * Get search icon based on result type
   */
  function getSearchIcon(type) {
    const icons = {
      institute: 'school',
      user: 'user',
      post: 'file-alt',
      methodology: 'book-open',
      project: 'lightbulb'
    };
    return icons[type] || 'search';
  }

})();
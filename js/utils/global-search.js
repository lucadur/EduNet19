/**
 * GLOBAL SEARCH MANAGER
 * Unified search functionality for all pages (Desktop Header Search)
 * Mimics homepage search behavior with result previews.
 */

class GlobalSearch {
    constructor() {
        this.elements = {
            input: document.getElementById('global-search'),
            results: document.getElementById('search-results'),
            clearBtn: document.querySelector('.nav-search .search-clear')
        };

        this.searchTimer = null;
        this.init();
    }

    init() {
        if (!this.elements.input || !this.elements.results) {
            console.warn('GlobalSearch: Elements not found');
            return;
        }

        console.log('🔍 GlobalSearch initializing...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Input handling with debounce
        this.elements.input.addEventListener('input', (e) => {
            const query = e.target.value;
            this.handleSearch(query);
        });

        // Focus handling
        this.elements.input.addEventListener('focus', () => {
            if (this.elements.input.value.trim().length > 0) {
                this.showSearchResults();
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search')) {
                this.hideSearchResults();
            }
        });

        // Clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.clearSearch();
                this.elements.input.focus();
            });
        }
    }

    handleSearch(query) {
        clearTimeout(this.searchTimer);

        if (query.trim() === '') {
            this.hideSearchResults();
            this.hideSearchClear();
            return;
        }

        this.showSearchClear();

        this.searchTimer = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    showSearchClear() {
        if (this.elements.clearBtn) this.elements.clearBtn.style.display = 'block';
    }

    hideSearchClear() {
        if (this.elements.clearBtn) this.elements.clearBtn.style.display = 'none';
    }

    showSearchResults() {
        if (this.elements.results.innerHTML.trim() !== '') {
            this.elements.results.style.display = 'block';
        }
    }

    hideSearchResults() {
        this.elements.results.style.display = 'none';
    }

    clearSearch() {
        this.elements.input.value = '';
        this.hideSearchResults();
        this.hideSearchClear();
    }

    async performSearch(query) {
        // Show loading state
        this.elements.results.style.display = 'block';
        this.elements.results.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner-small"></div>
                <p>Ricerca in corso...</p>
            </div>
        `;

        try {
            console.log('GlobalSearch: Searching for:', query);
            const results = [];

            // 1. Search Profiles (Institutes & Users)
            // Fallback to direct Supabase query if ProfileManager is not available
            const supabase = window.supabaseClientManager ? await window.supabaseClientManager.getClient() : null;

            if (window.eduNetProfileManager) {
                try {
                    const profiles = await window.eduNetProfileManager.searchProfiles(query);

                    if (profiles && profiles.length > 0) {
                        for (const profile of profiles) {
                            // 🔒 Check Privacy
                            let isPrivate = false;
                            let isEmailHidden = false;

                            if (window.supabaseClientManager) {
                                const sb = await window.supabaseClientManager.getClient();
                                const { data: privacy } = await sb
                                    .from('user_privacy_settings')
                                    .select('profile_visibility, searchable_by_email')
                                    .eq('user_id', profile.id)
                                    .maybeSingle();

                                if (privacy) {
                                    if (privacy.profile_visibility === 'private') isPrivate = true;
                                    if (privacy.searchable_by_email === false && query.includes('@')) isEmailHidden = true;
                                }
                            }

                            if (isPrivate || isEmailHidden) continue;

                            let avatarUrl = null;
                            if (window.avatarManager) {
                                try {
                                    avatarUrl = await window.avatarManager.loadUserAvatar(profile.id);
                                } catch (e) { console.warn('Avatar load error', e); }
                            }

                            if (profile.user_type === 'istituto' && profile.school_institutes) {
                                results.push({
                                    type: 'institute',
                                    name: profile.school_institutes.institute_name,
                                    location: profile.school_institutes.city || 'Posizione non specificata',
                                    id: profile.id,
                                    avatarUrl: avatarUrl
                                });
                            } else if (profile.user_type === 'privato' && profile.private_users) {
                                // 🔒 PRIVACY: Student search disabled
                                /*
                                results.push({
                                    type: 'user',
                                    name: `${profile.private_users.first_name} ${profile.private_users.last_name}`,
                                    location: profile.private_users.city || 'Posizione non specificata',
                                    id: profile.id,
                                    avatarUrl: avatarUrl
                                });
                                */
                            }
                        }
                    }
                } catch (e) {
                    console.error('GlobalSearch: Profile search error', e);
                }
            } else if (supabase) {
                // FALLBACK: Direct Supabase Search (like Mobile Search)
                try {
                    console.log('GlobalSearch: ProfileManager missing, using fallback search');

                    // Search Institutes
                    const { data: institutes } = await supabase
                        .from('school_institutes')
                        .select('id, institute_name, city')
                        .ilike('institute_name', `%${query}%`)
                        .limit(5);

                    if (institutes) {
                        for (const inst of institutes) {
                            // 🔒 Check Privacy
                            const { data: privacy } = await supabase
                                .from('user_privacy_settings')
                                .select('profile_visibility, searchable_by_email')
                                .eq('user_id', inst.id)
                                .maybeSingle();

                            if (privacy && privacy.profile_visibility === 'private') continue;

                            // 🔍 Filtra istituti falsi usando il validatore MIUR
                            if (window.miurValidator) {
                                const validation = await window.miurValidator.validateInstitute({
                                    instituteName: inst.institute_name,
                                    instituteCode: inst.institute_code
                                });
                                // Mostra solo istituti con confidence >= 0.3 (hanno almeno keywords scolastiche)
                                if (!validation.isValid && validation.confidence < 0.3) {
                                    console.log('🚫 Istituto filtrato (non valido MIUR):', inst.institute_name);
                                    continue;
                                }
                            }

                            let avatarUrl = null;
                            if (window.avatarManager) {
                                try {
                                    avatarUrl = await window.avatarManager.loadUserAvatar(inst.id);
                                } catch (e) { }
                            }

                            results.push({
                                type: 'institute',
                                name: inst.institute_name,
                                location: inst.city || 'Posizione non specificata',
                                id: inst.id,
                                avatarUrl: avatarUrl
                            });
                        }
                    }

                    // Search Private Users - DISABLED FOR PRIVACY
                    /*
                    const { data: users } = await supabase
                        .from('private_users')
                        .select('id, first_name, last_name, city')
                        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                        .limit(5);

                    if (users) {
                        for (const user of users) {
                            // 🔒 Check Privacy
                            const { data: privacy } = await supabase
                                .from('user_privacy_settings')
                                .select('profile_visibility, searchable_by_email')
                                .eq('user_id', user.id)
                                .maybeSingle();

                            if (privacy && privacy.profile_visibility === 'private') continue;

                            let avatarUrl = null;
                            if (window.avatarManager) {
                                try {
                                    avatarUrl = await window.avatarManager.loadUserAvatar(user.id);
                                } catch (e) { }
                            }

                            results.push({
                                type: 'user',
                                name: `${user.first_name} ${user.last_name}`,
                                location: user.city || 'Utente Privato',
                                id: user.id,
                                avatarUrl: avatarUrl
                            });
                        }
                    }
                    */

                } catch (fallbackError) {
                    console.error('GlobalSearch: Fallback search error', fallbackError);
                }
            }

            // 2. Search Posts
            if (window.supabaseClientManager) {
                try {
                    const supabase = await window.supabaseClientManager.getClient();

                    // Search in institute_posts with title, content, and tags
                    const { data: posts, error } = await supabase
                        .from('institute_posts')
                        .select('id, title, content, post_type, institute_id, tags')
                        .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
                        .eq('published', true)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    // Also search by tags if query doesn't match title/content
                    let tagPosts = [];
                    if (!error) {
                        const { data: tagResults, error: tagError } = await supabase
                            .from('institute_posts')
                            .select('id, title, content, post_type, institute_id, tags')
                            .contains('tags', [query.toLowerCase()])
                            .eq('published', true)
                            .order('created_at', { ascending: false })
                            .limit(5);

                        if (!tagError && tagResults) {
                            tagPosts = tagResults;
                        }
                    }

                    // Merge results and remove duplicates
                    const allPosts = [...(posts || []), ...tagPosts];
                    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());

                    if (uniquePosts.length > 0) {
                        for (const post of uniquePosts) {
                            let authorName = 'Autore sconosciuto';
                            let avatarUrl = null;

                            try {
                                const { data: institute } = await supabase
                                    .from('school_institutes')
                                    .select('institute_name')
                                    .eq('id', post.institute_id)
                                    .maybeSingle();

                                if (institute) authorName = institute.institute_name;

                                if (window.avatarManager) {
                                    avatarUrl = await window.avatarManager.loadUserAvatar(post.institute_id);
                                }
                            } catch (e) { console.warn('Post author fetch error', e); }

                            const badgeInfo = this.getPostBadgeInfo(post.post_type);

                            results.push({
                                type: 'post',
                                post_type: post.post_type,
                                title: post.title,
                                author: authorName,
                                id: post.id,
                                authorId: post.institute_id, // Added for avatar
                                avatarUrl: avatarUrl,
                                tags: post.tags || [],
                                badgeClass: badgeInfo.class,
                                badgeIcon: badgeInfo.icon,
                                badgeLabel: badgeInfo.label
                            });
                        }
                    }
                } catch (e) {
                    console.error('GlobalSearch: Post search error', e);
                }
            }

            this.displaySearchResults(results);

        } catch (error) {
            console.error('GlobalSearch: Critical error', error);
            this.displaySearchResults([]);
        }
    }

    displaySearchResults(results) {
        if (results.length === 0) {
            this.elements.results.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search" aria-hidden="true"></i>
                    <p>Nessun risultato trovato</p>
                </div>
            `;
            return;
        }

        this.elements.results.innerHTML = results.map(result => {
            // Determine the correct User ID for the avatar (Author ID for posts, Self ID for profiles)
            const avatarUserId = result.type === 'post' ? result.authorId : result.id;

            const avatarHtml = result.avatarUrl
                ? `<img src="${result.avatarUrl}" alt="Avatar" class="search-result-avatar" data-user-id="${avatarUserId}">`
                : `<div class="search-result-avatar search-result-avatar-default" data-user-id="${avatarUserId}">
                     <i class="fas fa-${result.type === 'institute' ? 'school' : result.type === 'user' ? 'user' : 'file-alt'}"></i>
                   </div>`;

            if (result.type === 'post') {
                return `
                    <div class="search-result-item" data-id="${result.id}" data-type="post">
                        ${avatarHtml}
                        <div class="search-result-main">
                            <div class="search-result-header">
                                <span class="result-author" style="margin: 0; font-weight: 600; color: var(--color-gray-700);">${result.author}</span>
                                <span class="search-badge ${result.badgeClass}" style="font-size: 0.65rem; padding: 0.2rem 0.5rem;">
                                    <i class="${result.badgeIcon}"></i> ${result.badgeLabel}
                                </span>
                            </div>
                            <div class="result-content">
                                <h4 style="margin-top: 0.25rem;">${result.title}</h4>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="search-result-item" data-id="${result.id}" data-type="${result.type}">
                        ${avatarHtml}
                        <div class="result-content">
                            <h4>${result.name}</h4>
                            <p>${result.location}</p>
                        </div>
                    </div>
                `;
            }
        }).join('');

        // Add click handlers
        this.elements.results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const type = item.dataset.type;

                // Fix: Handle navigation paths correctly based on current location
                const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
                const homepagePath = basePath.endsWith('/') ? basePath + 'homepage.html' : basePath + '/homepage.html';
                const profilePath = window.location.pathname.includes('/pages/profile/') ? 'profile.html' : 'pages/profile/profile.html';

                if (type === 'institute' || type === 'user') {
                    // Use absolute URLs to prevent query parameter loss
                    const baseUrl = window.location.origin;
                    window.location.href = `${baseUrl}/pages/profile/profile.html?id=${id}`;
                } else if (type === 'post') {
                    // Use root relative path for homepage
                    // If we are in /pages/..., go to ../../homepage.html
                    if (window.location.pathname.includes('/pages/')) {
                        window.location.href = `../../homepage.html#post/${id}`;
                    } else {
                        window.location.href = `homepage.html#post/${id}`;
                    }
                }
                this.hideSearchResults();
            });
        });
    }

    getPostBadgeInfo(type) {
        const badges = {
            'notizia': { label: 'Post', icon: 'fas fa-align-left', class: 'badge-post' },
            'progetto': { label: 'Progetto', icon: 'fas fa-lightbulb', class: 'badge-project' },
            'metodologia': { label: 'Metodologia', icon: 'fas fa-book-open', class: 'badge-methodology' },
            'evento': { label: 'Galleria', icon: 'fas fa-images', class: 'badge-gallery' },
            'gallery': { label: 'Galleria', icon: 'fas fa-images', class: 'badge-gallery' },
            'experience': { label: 'Esperienza', icon: 'fas fa-star', class: 'badge-experience' },
            'collaboration': { label: 'Collaborazione', icon: 'fas fa-handshake', class: 'badge-collaboration' }
        };
        return badges[type] || badges['notizia'];
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if NOT on homepage (homepage has its own script)
    // AND if the search input exists
    if (!window.eduNetHomepage && document.getElementById('global-search')) {
        window.globalSearch = new GlobalSearch();
    }
});

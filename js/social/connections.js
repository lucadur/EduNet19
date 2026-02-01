/**
 * CONNECTIONS PAGE - Gestione Follower e Following
 */

'use strict';

class ConnectionsPage {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.currentTab = 'following';

    this.init();
  }

  async init() {
    try {
      // Wait for Supabase
      await this.waitForSupabase();

      // Wait for auth
      await this.waitForAuth();

      // Get current user
      this.currentUser = window.eduNetAuth?.getCurrentUser();

      if (!this.currentUser) {
        window.location.href = window.AppConfig.getPageUrl('index.html');
        return;
      }

      // Setup tabs
      this.setupTabs();

      // Setup event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadFollowing();

      console.log('✅ Connections page initialized');

    } catch (error) {
      console.error('Error initializing connections page:', error);
    }
  }

  async waitForSupabase() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.supabaseClientManager) {
          window.supabaseClientManager.getClient().then(client => {
            this.supabase = client;
            resolve();
          });
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  async waitForAuth() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.eduNetAuth && window.eduNetAuth.isInitialized) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  async switchTab(tab) {
    this.currentTab = tab;

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeContent = document.getElementById(`${tab}-tab`);
    if (activeContent) {
      activeContent.classList.add('active');
    }

    // Load data
    if (tab === 'following') {
      await this.loadFollowing();
    } else {
      await this.loadFollowers();
    }
  }

  async loadFollowing() {
    const container = document.getElementById('following-list');

    try {
      // Usa user_connections invece di user_follows per coerenza con homepage
      const { data: following, error } = await this.supabase
        .from('user_connections')
        .select('followed_id')
        .eq('follower_id', this.currentUser.id)
        .eq('status', 'accepted');

      if (error) throw error;

      // Update count
      const countEl = document.getElementById('following-count');
      if (countEl) {
        const badge = countEl.querySelector('.count, .badge');
        if (badge) {
          badge.textContent = following?.length || 0;
        } else {
          countEl.textContent = following?.length || 0;
        }
      }

      if (!following || following.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-plus"></i>
            <p>Non segui ancora nessuno</p>
            <a href="../../homepage.html" class="btn btn-primary">Scopri Istituti</a>
          </div>
        `;
        return;
      }

      // Load user details
      const users = await this.loadUsersDetails(following.map(f => f.followed_id));

      container.innerHTML = users.map(user => this.createUserCard(user, 'following')).join('');

      // Load avatars
      this.loadAvatars();

    } catch (error) {
      console.error('Error loading following:', error);
      container.innerHTML = '<div class="error-state">Errore nel caricamento</div>';
    }
  }

  async loadFollowers() {
    const container = document.getElementById('followers-list');

    try {
      // Usa user_connections invece di user_follows per coerenza con homepage
      const { data: followers, error } = await this.supabase
        .from('user_connections')
        .select('follower_id')
        .eq('followed_id', this.currentUser.id)
        .eq('status', 'accepted');

      if (error) throw error;

      // Update count
      const countEl = document.getElementById('followers-count');
      if (countEl) {
        const badge = countEl.querySelector('.count, .badge');
        if (badge) {
          badge.textContent = followers?.length || 0;
        } else {
          countEl.textContent = followers?.length || 0;
        }
      }

      if (!followers || followers.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>Nessuno ti segue ancora</p>
          </div>
        `;
        return;
      }

      // Load user details
      const users = await this.loadUsersDetails(followers.map(f => f.follower_id));

      container.innerHTML = users.map(user => this.createUserCard(user, 'followers')).join('');

      // Load avatars
      this.loadAvatars();

    } catch (error) {
      console.error('Error loading followers:', error);
      container.innerHTML = '<div class="error-state">Errore nel caricamento</div>';
    }
  }

  async loadUsersDetails(userIds) {
    const users = [];

    for (const userId of userIds) {
      try {
        // Get user profile
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', userId)
          .maybeSingle();

        if (!profile) continue;

        let userData = { id: userId, user_type: profile.user_type };

        if (profile.user_type === 'istituto') {
          const { data: institute } = await this.supabase
            .from('school_institutes')
            .select('institute_name, city, logo_url')
            .eq('id', userId)
            .maybeSingle();

          if (institute) {
            userData.name = institute.institute_name;
            userData.location = institute.city;
            userData.avatar_url = institute.logo_url;
          }
        } else {
          const { data: privateUser } = await this.supabase
            .from('private_users')
            .select('first_name, last_name, avatar_url')
            .eq('id', userId)
            .maybeSingle();

          if (privateUser) {
            userData.name = `${privateUser.first_name} ${privateUser.last_name}`;
            userData.avatar_url = privateUser.avatar_url;
          }
        }

        users.push(userData);
      } catch (error) {
        console.error('Error loading user details:', error);
      }
    }

    return users;
  }

  createUserCard(user, type) {
    const userType = user.user_type === 'istituto' ? 'Istituto' : 'Utente Privato';

    return `
      <div class="connection-card" data-user-id="${user.id}">
        <div class="connection-avatar" data-user-id="${user.id}">
          <i class="fas fa-${user.user_type === 'istituto' ? 'school' : 'user'}"></i>
        </div>
        <div class="connection-info">
          <h4>${user.name || 'Utente'}</h4>
          <p class="connection-type">${userType}</p>
          ${user.location ? `<p class="connection-location"><i class="fas fa-map-marker-alt"></i> ${user.location}</p>` : ''}
        </div>
        <div class="connection-actions">
          <a href="profile.html?id=${user.id}" class="btn btn-outline btn-sm">
            <i class="fas fa-eye"></i>
            Visualizza
          </a>
          ${type === 'following' ? `
            <button class="btn btn-outline btn-sm unfollow-btn" data-user-id="${user.id}">
              <i class="fas fa-user-minus"></i>
              Smetti di seguire
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  loadAvatars() {
    if (!window.avatarManager) return;

    document.querySelectorAll('.connection-avatar').forEach(async (avatar) => {
      const userId = avatar.dataset.userId;
      if (userId) {
        const avatarUrl = await window.avatarManager.loadUserAvatar(userId);
        if (avatarUrl) {
          avatar.style.backgroundImage = `url(${avatarUrl})`;
          avatar.style.backgroundSize = 'cover';
          avatar.style.backgroundPosition = 'center';
          const icon = avatar.querySelector('i');
          if (icon) icon.style.display = 'none';
        }
      }
    });
  }

  async handleUnfollow(userId) {
    try {
      // Usa user_connections invece di user_follows per coerenza
      const { error } = await this.supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', this.currentUser.id)
        .eq('followed_id', userId);

      if (error) throw error;

      // Reload following list
      await this.loadFollowing();

    } catch (error) {
      console.error('Error unfollowing user:', error);
      alert('Errore durante l\'operazione. Riprova.');
    }
  }

  setupEventListeners() {
    // Unfollow button handler
    document.addEventListener('click', (e) => {
      if (e.target.closest('.unfollow-btn')) {
        const btn = e.target.closest('.unfollow-btn');
        const userId = btn.dataset.userId;
        if (userId && confirm('Vuoi smettere di seguire questo utente?')) {
          this.handleUnfollow(userId);
        }
      }
    });
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.connectionsPage = new ConnectionsPage();
  });
} else {
  window.connectionsPage = new ConnectionsPage();
}

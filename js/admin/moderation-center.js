/**
 * Moderation Center - Admin Dashboard
 * Handles content moderation, user management, and GDPR requests
 */

class ModerationCenter {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminRole = null;
        this.permissions = {};
        this.currentSection = 'overview';
        this.syncInterval = null;
        this.filters = {
            reportStatus: 'pending',
            reportCategory: 'all',
            reportPriority: 'all',
            gdprStatus: 'pending',
            gdprType: 'all',
            appealStatus: 'pending',
            parentalStatus: 'pending'
        };
        
        this.init();
    }

    async init() {
        this.showLoadingScreen();
        
        try {
            await this.waitForSupabase();
        } catch (error) {
            console.error('[ModerationCenter] Failed to initialize Supabase:', error);
            this.hideLoadingScreen();
            this.showError('Errore di connessione al database. Ricarica la pagina.');
            return;
        }
        
        const authResult = await this.checkAuth();
        
        if (authResult === 'login_shown') {
            // Login form is displayed, don't do anything else
            return;
        }
        
        if (!authResult) {
            this.hideLoadingScreen();
            this.showAccessDenied();
            return;
        }
        
        this.hideLoadingScreen();
        this.setupEventListeners();
        this.setupTheme();
        this.applyPermissions();
        this.loadSection('overview');
        this.loadStats();
        this.startSilentSync();
    }

    // Silent background sync every 30 seconds
    startSilentSync() {
        this.syncInterval = setInterval(() => {
            this.silentRefresh();
        }, 30000);
    }

    stopSilentSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async silentRefresh() {
        try {
            // Refresh stats silently
            await this.loadStats();
            
            // Refresh current section data silently
            switch (this.currentSection) {
                case 'overview': 
                    await this.loadRecentActivity();
                    break;
                case 'reports': 
                    await this.loadReports();
                    break;
                case 'appeals': 
                    await this.loadAppeals();
                    break;
                case 'gdpr': 
                    await this.loadGdprRequests();
                    break;
                case 'parental': 
                    await this.loadParentalConsents();
                    break;
                case 'actions':
                    await this.loadActions();
                    break;
            }
            console.log('[ModerationCenter] Silent sync completed');
        } catch (error) {
            console.error('[ModerationCenter] Silent sync error:', error);
        }
    }

    showError(message) {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; text-align: center; padding: 2rem;">
                <div style="width: 80px; height: 80px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">Errore</h1>
                <p style="color: #94a3b8; margin-bottom: 2rem; max-width: 400px;">${message}</p>
                <button onclick="location.reload()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Ricarica pagina
                </button>
            </div>
        `;
    }

    showLoadingScreen() {
        // Add loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'authLoadingOverlay';
        overlay.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;">
                <div style="width: 50px; height: 50px; border: 4px solid #1e3a5f; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="color: #94a3b8; margin-top: 1rem;">Verifica autorizzazioni...</p>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('authLoadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showAccessDenied() {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; text-align: center; padding: 2rem;">
                <div style="width: 80px; height: 80px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">Accesso Negato</h1>
                <p style="color: #94a3b8; margin-bottom: 2rem; max-width: 400px;">
                    Non hai i permessi necessari per accedere al Centro Moderazione. 
                    Questa area è riservata agli amministratori e moderatori della piattaforma.
                </p>
                <a href="../../homepage.html" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    Torna alla Home
                </a>
            </div>
        `;
    }

    showAdminLogin() {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; padding: 2rem;">
                <div style="width: 100%; max-width: 400px; background: #1e293b; border-radius: 16px; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                            <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Centro Moderazione</h1>
                        <p style="color: #94a3b8; font-size: 0.9rem;">Accedi con le tue credenziali admin</p>
                    </div>
                    
                    <form id="adminLoginForm" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: #e2e8f0;">Email</label>
                            <input type="email" id="adminEmail" required 
                                style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 1rem; outline: none; transition: border-color 0.2s;"
                                placeholder="admin@example.com"
                                onfocus="this.style.borderColor='#3b82f6'" 
                                onblur="this.style.borderColor='#334155'">
                        </div>
                        
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: #e2e8f0;">Password</label>
                            <input type="password" id="adminPassword" required 
                                style="width: 100%; padding: 0.75rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 1rem; outline: none; transition: border-color 0.2s;"
                                placeholder="••••••••"
                                onfocus="this.style.borderColor='#3b82f6'" 
                                onblur="this.style.borderColor='#334155'">
                        </div>
                        
                        <div id="adminLoginError" style="display: none; padding: 0.75rem; background: rgba(220, 38, 38, 0.2); border: 1px solid #dc2626; border-radius: 8px; color: #fca5a5; font-size: 0.875rem;"></div>
                        
                        <button type="submit" id="adminLoginBtn"
                            style="width: 100%; padding: 0.875rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 8px; color: white; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; margin-top: 0.5rem;"
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <span id="loginBtnText">Accedi</span>
                            <span id="loginBtnSpinner" style="display: none;">
                                <svg style="animation: spin 1s linear infinite; width: 20px; height: 20px; display: inline-block; vertical-align: middle;" fill="none" viewBox="0 0 24 24">
                                    <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        </button>
                    </form>
                    
                    <p style="text-align: center; margin-top: 1.5rem; color: #64748b; font-size: 0.8rem;">
                        Area riservata al personale autorizzato
                    </p>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>
        `;

        // Attach login handler
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => this.handleAdminLogin(e));
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminLoginError');
        const btnText = document.getElementById('loginBtnText');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        const btn = document.getElementById('adminLoginBtn');
        
        // Show loading
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
        btn.disabled = true;
        errorDiv.style.display = 'none';
        
        try {
            // Attempt login
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Check if user is admin
            const { data: adminData, error: adminError } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', data.user.id)
                .single();
            
            if (adminError || !adminData) {
                // Not an admin - sign out and show error
                await this.supabase.auth.signOut();
                throw new Error('Account non autorizzato per il Centro Moderazione');
            }
            
            // Success - reload page
            window.location.reload();
            
        } catch (error) {
            console.error('Admin login error:', error);
            errorDiv.textContent = error.message || 'Credenziali non valide';
            errorDiv.style.display = 'block';
            
            // Reset button
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            btn.disabled = false;
        }
    }

    async waitForSupabase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            
            const check = async () => {
                attempts++;
                console.log(`[ModerationCenter] Waiting for Supabase... attempt ${attempts}`);
                
                if (attempts > maxAttempts) {
                    console.error('[ModerationCenter] Timeout waiting for Supabase client');
                    reject(new Error('Timeout waiting for Supabase'));
                    return;
                }
                
                if (window.supabaseClientManager) {
                    try {
                        this.supabase = await window.supabaseClientManager.getClient();
                        if (this.supabase) {
                            console.log('[ModerationCenter] Supabase client ready');
                            resolve();
                            return;
                        } else {
                            console.warn('[ModerationCenter] getClient() returned null');
                        }
                    } catch (e) {
                        console.error('[ModerationCenter] Error getting Supabase client:', e);
                    }
                } else {
                    console.warn('[ModerationCenter] supabaseClientManager not found yet');
                }
                setTimeout(check, 100);
            };
            check();
        });
    }

    async checkAuth() {
        try {
            if (!this.supabase) {
                console.error('[ModerationCenter] Supabase client not initialized');
                return false;
            }
            
            // Check if user is logged in
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            console.log('[ModerationCenter] Auth check - user:', user?.id, user?.email, 'error:', authError?.message);
            
            if (!user) {
                console.log('[ModerationCenter] No user logged in, showing admin login...');
                this.hideLoadingScreen();
                this.showAdminLogin();
                return 'login_shown';
            }
            this.currentUser = user;

            // Check if user has admin role
            console.log('[ModerationCenter] Checking admin_users for user_id:', user.id);
            const { data: adminData, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', user.id)
                .single();

            console.log('[ModerationCenter] Admin query result:', adminData, 'error:', error?.message, error?.code);

            if (error || !adminData) {
                console.warn('[ModerationCenter] User is not an admin:', error?.message);
                return false;
            }

            this.adminRole = adminData.role;
            this.permissions = adminData.permissions || {};
            
            console.log('Admin authenticated:', this.adminRole, this.permissions);
            return true;

        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    applyPermissions() {
        // Hide sections based on permissions
        const gdprNav = document.querySelector('[data-section="gdpr"]');
        const parentalNav = document.querySelector('[data-section="parental"]');
        const usersNav = document.querySelector('[data-section="users"]');
        const adminManagementSection = document.getElementById('adminManagementSection');
        
        // Only super_admin and admin can access GDPR
        if (!this.permissions.can_manage_gdpr && this.adminRole !== 'super_admin') {
            gdprNav?.parentElement?.removeChild(gdprNav);
        }
        
        // Only super_admin can manage users directly
        if (this.adminRole !== 'super_admin' && this.adminRole !== 'admin') {
            usersNav?.parentElement?.removeChild(usersNav);
        }

        // Only super_admin can manage other admins
        if (this.adminRole === 'super_admin' && adminManagementSection) {
            adminManagementSection.style.display = 'block';
        }

        // Update UI to show role
        const navTitle = document.querySelector('.mod-nav-title');
        if (navTitle) {
            const roleLabels = {
                super_admin: 'Super Admin',
                admin: 'Amministratore',
                moderator: 'Moderatore'
            };
            navTitle.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                Centro Moderazione
                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">
                    ${roleLabels[this.adminRole] || this.adminRole}
                </span>
            `;
        }
    }

    setupEventListeners() {
        // Mobile Menu Toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.mod-sidebar');
        const mobileOverlay = document.getElementById('mobileOverlay');
        
        mobileMenuToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
            mobileOverlay?.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (sidebar?.classList.contains('open')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        mobileOverlay?.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            mobileOverlay?.classList.remove('active');
            const icon = mobileMenuToggle?.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        });

        // Navigation
        document.querySelectorAll('.mod-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
                
                // Close mobile menu after selection
                sidebar?.classList.remove('open');
                mobileOverlay?.classList.remove('active');
                const icon = mobileMenuToggle?.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });

        // Filters
        document.getElementById('reportStatusFilter')?.addEventListener('change', (e) => {
            this.filters.reportStatus = e.target.value;
            this.loadReports();
        });

        document.getElementById('reportCategoryFilter')?.addEventListener('change', (e) => {
            this.filters.reportCategory = e.target.value;
            this.loadReports();
        });

        document.getElementById('reportPriorityFilter')?.addEventListener('change', (e) => {
            this.filters.reportPriority = e.target.value;
            this.loadReports();
        });

        document.getElementById('gdprStatusFilter')?.addEventListener('change', (e) => {
            this.filters.gdprStatus = e.target.value;
            this.loadGdprRequests();
        });

        document.getElementById('gdprTypeFilter')?.addEventListener('change', (e) => {
            this.filters.gdprType = e.target.value;
            this.loadGdprRequests();
        });

        document.getElementById('appealStatusFilter')?.addEventListener('change', (e) => {
            this.filters.appealStatus = e.target.value;
            this.loadAppeals();
        });

        document.getElementById('parentalStatusFilter')?.addEventListener('change', (e) => {
            this.filters.parentalStatus = e.target.value;
            this.loadParentalConsents();
        });

        // Content filters
        document.getElementById('contentTypeFilter')?.addEventListener('change', () => {
            this.loadContent();
        });

        document.getElementById('contentStatusFilter')?.addEventListener('change', () => {
            this.loadContent();
        });

        // User search
        const userSearchInput = document.getElementById('userSearchInput');
        let searchTimeout;
        userSearchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchUsers(e.target.value);
            }, 300);
        });

        // Modal close
        document.querySelectorAll('.mod-modal-backdrop, .mod-modal-close').forEach(el => {
            el.addEventListener('click', () => this.closeModals());
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModals();
        });
    }

    setupTheme() {
        // Read from unified edunet_settings (default: dark)
        let currentTheme = 'dark';
        try {
            const saved = localStorage.getItem('edunet_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                currentTheme = settings.theme || 'dark';
            }
        } catch (e) { /* use default */ }

        if (currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-theme');
        }

        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';

        document.getElementById('themeToggle')?.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            // Save to unified edunet_settings
            try {
                const saved = localStorage.getItem('edunet_settings');
                const settings = saved ? JSON.parse(saved) : {};
                settings.theme = isDark ? 'dark' : 'light';
                localStorage.setItem('edunet_settings', JSON.stringify(settings));
            } catch (e) { /* ignore */ }
            const toggleIcon = document.querySelector('#themeToggle i');
            if (toggleIcon) toggleIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    loadSection(section) {
        // Update nav
        document.querySelectorAll('.mod-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        document.querySelectorAll('.mod-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });

        this.currentSection = section;

        // Load data
        switch (section) {
            case 'overview': this.loadOverview(); break;
            case 'reports': this.loadReports(); break;
            case 'users': break; // Loaded on search
            case 'content': this.loadContent(); break;
            case 'actions': this.loadActions(); break;
            case 'appeals': this.loadAppeals(); break;
            case 'gdpr': this.loadGdprRequests(); break;
            case 'parental': this.loadParentalConsents(); break;
            case 'admins': this.loadAdmins(); break;
        }
    }

    async loadStats() {
        try {
            // Pending reports
            const { count: pendingReports } = await this.supabase
                .from('content_reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // High priority
            const { count: highPriority } = await this.supabase
                .from('content_reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .eq('priority', 'high');

            // Resolved today
            const today = new Date().toISOString().split('T')[0];
            const { count: resolvedToday } = await this.supabase
                .from('content_reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'resolved')
                .gte('resolved_at', today);

            // Suspended users
            const { count: suspendedUsers } = await this.supabase
                .from('moderation_actions')
                .select('*', { count: 'exact', head: true })
                .in('action_type', ['suspension_24h', 'suspension_7d', 'suspension_30d', 'ban'])
                .gt('suspension_until', new Date().toISOString());

            // Pending appeals
            const { count: pendingAppeals } = await this.supabase
                .from('moderation_actions')
                .select('*', { count: 'exact', head: true })
                .eq('appeal_status', 'pending');

            // Pending GDPR
            const { count: pendingGdpr } = await this.supabase
                .from('gdpr_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Update UI
            document.getElementById('statPendingReports').textContent = pendingReports || 0;
            document.getElementById('statHighPriority').textContent = highPriority || 0;
            document.getElementById('statResolvedToday').textContent = resolvedToday || 0;
            document.getElementById('statSuspendedUsers').textContent = suspendedUsers || 0;
            document.getElementById('pendingReportsBadge').textContent = pendingReports || 0;
            document.getElementById('pendingAppealsBadge').textContent = pendingAppeals || 0;
            document.getElementById('pendingGdprBadge').textContent = pendingGdpr || 0;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadOverview() {
        await this.loadStats();
        await this.loadRecentActivity();
    }

    async loadRecentActivity() {
        const container = document.getElementById('recentActivityList');
        
        try {
            // Get recent reports
            const { data: reports } = await this.supabase
                .from('content_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // Get recent actions
            const { data: actions } = await this.supabase
                .from('moderation_actions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            const activities = [
                ...(reports || []).map(r => ({ ...r, type: 'report' })),
                ...(actions || []).map(a => ({ ...a, type: 'action' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

            if (activities.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessuna attività recente</p>';
                return;
            }

            container.innerHTML = activities.map(activity => this.renderActivityItem(activity)).join('');

        } catch (error) {
            console.error('Error loading activity:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderActivityItem(activity) {
        const isReport = activity.type === 'report';
        const iconClass = isReport ? 'report' : (activity.action_type === 'warning' ? 'action' : 'resolved');
        const icon = isReport ? 'fa-flag' : 'fa-gavel';
        
        const text = isReport 
            ? `Nuova segnalazione: <strong>${this.getCategoryLabel(activity.category || activity.report_reason)}</strong>`
            : `Azione: <strong>${this.getActionLabel(activity.action_type)}</strong>`;

        return `
            <div class="mod-activity-item">
                <div class="mod-activity-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="mod-activity-content">
                    <p class="mod-activity-text">${text}</p>
                    <span class="mod-activity-time">${this.formatTimeAgo(activity.created_at)}</span>
                </div>
            </div>
        `;
    }

    async loadReports() {
        const container = document.getElementById('reportsList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            let query = this.supabase
                .from('content_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (this.filters.reportStatus !== 'all') {
                query = query.eq('status', this.filters.reportStatus);
            }
            if (this.filters.reportCategory !== 'all') {
                query = query.or(`category.eq.${this.filters.reportCategory},report_reason.eq.${this.filters.reportCategory}`);
            }
            if (this.filters.reportPriority !== 'all') {
                query = query.eq('priority', this.filters.reportPriority);
            }

            const { data: reports, error } = await query.limit(50);

            if (error) throw error;

            if (!reports || reports.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessuna segnalazione trovata</p>';
                return;
            }

            container.innerHTML = reports.map(report => this.renderReportCard(report)).join('');
            this.attachReportActions();

        } catch (error) {
            console.error('Error loading reports:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderReportCard(report) {
        const category = report.category || report.report_reason || 'other';
        const priority = report.priority || 'normal';
        const contentTypeLabel = report.reported_content_type === 'post' ? 'Post' : 
                                 report.reported_content_type === 'comment' ? 'Commento' : 
                                 report.reported_content_type || 'N/A';
        
        // Priority colors
        const priorityColors = {
            high: '#dc2626',
            normal: '#f59e0b',
            low: '#10b981'
        };
        
        return `
            <div class="mod-report-card" data-report-id="${report.id}" style="border-left: 4px solid ${priorityColors[priority] || '#6b7280'};">
                <div class="mod-report-header">
                    <div class="mod-report-meta">
                        <span class="mod-report-id" style="font-family: monospace;">#${report.id.substring(0, 8)}</span>
                        <span class="mod-priority-badge ${priority}" style="background: ${priorityColors[priority]}15; color: ${priorityColors[priority]};">
                            <i class="fas ${priority === 'high' ? 'fa-exclamation-triangle' : priority === 'low' ? 'fa-arrow-down' : 'fa-minus'}"></i>
                            ${this.getPriorityLabel(priority)}
                        </span>
                        <span class="mod-category-badge">
                            <i class="${this.getCategoryIcon(category)}"></i>
                            ${this.getCategoryLabel(category)}
                        </span>
                        <span style="background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            <i class="fas ${report.reported_content_type === 'post' ? 'fa-file-alt' : 'fa-comment'}"></i>
                            ${contentTypeLabel}
                        </span>
                    </div>
                    <span class="mod-status-badge ${report.status}">${this.getStatusLabel(report.status)}</span>
                </div>
                <div class="mod-report-body">
                    ${report.report_description ? `
                        <div class="mod-report-content" style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 0.75rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem;">
                            <h4 style="font-size: 0.85rem; color: #92400e; margin-bottom: 0.25rem;">
                                <i class="fas fa-quote-left"></i> Descrizione segnalazione
                            </h4>
                            <p style="color: #78350f; margin: 0;">${this.escapeHtml(report.report_description)}</p>
                        </div>
                    ` : ''}
                    <div class="mod-report-info">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Data segnalazione</span>
                            <span class="mod-info-value">${this.formatDate(report.created_at)}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">ID Contenuto</span>
                            <span class="mod-info-value" style="font-family: monospace; font-size: 0.8rem;">${report.reported_content_id?.substring(0, 12) || 'N/A'}...</span>
                        </div>
                        ${report.reviewed_at ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Preso in carico</span>
                                <span class="mod-info-value">${this.formatDate(report.reviewed_at)}</span>
                            </div>
                        ` : ''}
                        ${report.resolved_at ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Risolto il</span>
                                <span class="mod-info-value">${this.formatDate(report.resolved_at)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="mod-report-actions">
                        <button class="mod-btn mod-btn-primary" data-action="preview" data-report-id="${report.id}">
                            <i class="fas fa-eye"></i> Visualizza Contenuto
                        </button>
                        ${report.status === 'pending' ? `
                            <button class="mod-btn mod-btn-outline" data-action="review" data-report-id="${report.id}" style="color: #3b82f6; border-color: #3b82f6;">
                                <i class="fas fa-hand-paper"></i> Prendi in carico
                            </button>
                        ` : ''}
                        ${report.status === 'pending' || report.status === 'reviewing' ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0; width: 100%;">
                                <span style="font-size: 0.75rem; color: #6b7280; width: 100%; margin-bottom: 0.25rem;">Azioni sul contenuto:</span>
                                <button class="mod-btn mod-btn-warning" data-action="shadowban" data-report-id="${report.id}">
                                    <i class="fas fa-eye-slash"></i> Shadowban
                                </button>
                                <button class="mod-btn mod-btn-danger" data-action="delete-content" data-report-id="${report.id}">
                                    <i class="fas fa-trash"></i> Elimina
                                </button>
                                <button class="mod-btn mod-btn-success" data-action="dismiss" data-report-id="${report.id}">
                                    <i class="fas fa-check"></i> Respingi
                                </button>
                            </div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0; width: 100%;">
                                <span style="font-size: 0.75rem; color: #6b7280; width: 100%; margin-bottom: 0.25rem;">Azioni sull'utente:</span>
                                <button class="mod-btn mod-btn-outline" data-action="warn-user" data-report-id="${report.id}" title="Invia avviso all'utente">
                                    <i class="fas fa-exclamation-circle"></i> Avviso
                                </button>
                                <button class="mod-btn mod-btn-outline" data-action="suspend-user" data-report-id="${report.id}" title="Sospendi utente" style="color: #f59e0b; border-color: #f59e0b;">
                                    <i class="fas fa-user-clock"></i> Sospendi
                                </button>
                                <button class="mod-btn mod-btn-outline" data-action="ban-user" data-report-id="${report.id}" title="Banna utente" style="color: #dc2626; border-color: #dc2626;">
                                    <i class="fas fa-user-slash"></i> Ban
                                </button>
                            </div>
                        ` : ''}
                        ${report.moderator_notes ? `
                            <div style="width: 100%; margin-top: 0.5rem; padding: 0.5rem; background: #f1f5f9; border-radius: 6px; font-size: 0.8rem;">
                                <strong>Note moderatore:</strong> ${this.escapeHtml(report.moderator_notes)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachReportActions() {
        document.querySelectorAll('.mod-report-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const reportId = btn.dataset.reportId;
                this.handleReportAction(action, reportId);
            });
        });
    }

    async handleReportAction(action, reportId) {
        const report = await this.getReport(reportId);
        if (!report) return;

        switch (action) {
            case 'preview':
                await this.showContentPreview(report);
                break;
            case 'review':
                await this.takeReportInReview(reportId);
                break;
            case 'shadowban':
                this.showActionModal('shadowban', report);
                break;
            case 'delete-content':
                this.showActionModal('delete', report);
                break;
            case 'dismiss':
                this.showActionModal('dismiss', report);
                break;
            case 'warn-user':
                this.showActionModal('warn', report);
                break;
            case 'suspend-user':
                this.showActionModal('suspend', report);
                break;
            case 'ban-user':
                this.showActionModal('ban', report);
                break;
        }
    }

    async getReport(reportId) {
        const { data } = await this.supabase
            .from('content_reports')
            .select('*')
            .eq('id', reportId)
            .single();
        return data;
    }

    async takeReportInReview(reportId) {
        try {
            await this.supabase
                .from('content_reports')
                .update({ 
                    status: 'reviewing',
                    reviewed_by: this.currentUser.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', reportId);
            
            this.showNotification('Segnalazione presa in carico - ora visibile in "In revisione"', 'success');
            
            // Cambia automaticamente il filtro a "reviewing" per mostrare la segnalazione
            this.filters.reportStatus = 'reviewing';
            const statusFilter = document.getElementById('reportStatusFilter');
            if (statusFilter) {
                statusFilter.value = 'reviewing';
            }
            
            this.loadReports();
            this.loadStats();
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Errore', 'error');
        }
    }

    showActionModal(actionType, report) {
        const modal = document.getElementById('actionModal');
        const title = document.getElementById('actionModalTitle');
        const body = document.getElementById('actionModalBody');
        const footer = document.getElementById('actionModalFooter');

        const titles = {
            shadowban: 'Shadowban Contenuto',
            delete: 'Elimina Contenuto',
            dismiss: 'Respingi Segnalazione',
            warn: 'Invia Avviso',
            suspend: 'Sospendi Utente',
            ban: 'Banna Utente'
        };

        title.textContent = titles[actionType] || 'Azione';

        body.innerHTML = `
            <div class="mod-form-group">
                <label class="mod-form-label">Motivo dell'azione</label>
                <textarea id="actionReason" class="mod-form-textarea" placeholder="Inserisci il motivo..." required></textarea>
            </div>
            ${actionType === 'suspend' ? `
                <div class="mod-form-group">
                    <label class="mod-form-label">Durata sospensione</label>
                    <select id="suspensionDuration" class="mod-select" style="width: 100%;">
                        <option value="24h">24 ore</option>
                        <option value="7d">7 giorni</option>
                        <option value="30d">30 giorni</option>
                    </select>
                </div>
            ` : ''}
            ${actionType === 'dismiss' ? `
                <p style="color: #64748b; font-size: 0.9rem;">
                    La segnalazione verrà chiusa come "non valida". Il contenuto rimarrà visibile.
                </p>
            ` : ''}
        `;

        const confirmBtnClass = actionType === 'dismiss' ? 'mod-btn-success' : 'mod-btn-danger';
        const confirmText = actionType === 'dismiss' ? 'Respingi' : 'Conferma';

        footer.innerHTML = `
            <button class="mod-btn mod-btn-outline" onclick="moderationCenter.closeModals()">Annulla</button>
            <button class="mod-btn ${confirmBtnClass}" id="confirmActionBtn">
                <i class="fas fa-check"></i> ${confirmText}
            </button>
        `;

        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            this.executeAction(actionType, report);
        });

        modal.classList.add('active');
    }

    async executeAction(actionType, report) {
        const reason = document.getElementById('actionReason')?.value;
        if (!reason) {
            this.showNotification('Inserisci un motivo', 'warning');
            return;
        }

        try {
            switch (actionType) {
                case 'shadowban':
                    await this.shadowbanContent(report, reason);
                    break;
                case 'delete':
                    await this.deleteContent(report, reason);
                    break;
                case 'dismiss':
                    await this.dismissReport(report, reason);
                    break;
                case 'warn':
                    await this.warnUser(report, reason);
                    break;
                case 'suspend':
                    const duration = document.getElementById('suspensionDuration')?.value || '24h';
                    await this.suspendUser(report, reason, duration);
                    break;
                case 'ban':
                    await this.banUser(report, reason);
                    break;
            }

            this.closeModals();
            this.loadReports();
            this.loadStats();

        } catch (error) {
            console.error('Error executing action:', error);
            this.showNotification('Errore nell\'esecuzione', 'error');
        }
    }

    async shadowbanContent(report, reason) {
        const contentType = report.reported_content_type;
        const contentId = report.reported_content_id;
        const now = new Date().toISOString();

        // Update content visibility with proper shadowban tracking
        if (contentType === 'post') {
            await this.supabase
                .from('institute_posts')
                .update({ 
                    shadowbanned: true,
                    shadowbanned_at: now,
                    shadowbanned_reason: reason,
                    published: false 
                })
                .eq('id', contentId);
        } else if (contentType === 'comment') {
            await this.supabase
                .from('post_comments')
                .update({ 
                    hidden: true,
                    shadowbanned_at: now,
                    shadowbanned_reason: reason
                })
                .eq('id', contentId);
        }

        // Log moderation action - will trigger user notification
        await this.logModerationAction(report.reported_user_id, 'content_shadowban', reason, report.id, contentType, contentId);

        // Update report status
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'resolved', 
                resolved_at: new Date().toISOString(),
                moderator_notes: `Shadowban: ${reason}`
            })
            .eq('id', report.id);

        this.showNotification('Contenuto shadowbannato', 'success');
    }

    async deleteContent(report, reason) {
        const contentType = report.reported_content_type;
        const contentId = report.reported_content_id;

        // Delete content
        if (contentType === 'post') {
            await this.supabase
                .from('institute_posts')
                .delete()
                .eq('id', contentId);
        } else if (contentType === 'comment') {
            await this.supabase
                .from('post_comments')
                .delete()
                .eq('id', contentId);
        }

        // Log moderation action - will trigger user notification
        await this.logModerationAction(report.reported_user_id, 'content_deleted', reason, report.id, contentType, contentId);

        // Update report status
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'resolved', 
                resolved_at: new Date().toISOString(),
                moderator_notes: `Eliminato: ${reason}`
            })
            .eq('id', report.id);

        this.showNotification('Contenuto eliminato', 'success');
    }

    async dismissReport(report, reason) {
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'dismissed', 
                resolved_at: new Date().toISOString(),
                moderator_notes: reason
            })
            .eq('id', report.id);

        this.showNotification('Segnalazione respinta', 'success');
    }

    async warnUser(report, reason) {
        await this.logModerationAction(report.reported_user_id, 'warning', reason, report.id);

        // Update report
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'resolved', 
                resolved_at: new Date().toISOString(),
                moderator_notes: `Avviso inviato: ${reason}`
            })
            .eq('id', report.id);

        // TODO: Send email notification to user

        this.showNotification('Avviso inviato all\'utente', 'success');
    }

    async suspendUser(report, reason, duration) {
        // Check permission
        if (!this.permissions.can_ban && this.adminRole !== 'super_admin' && this.adminRole !== 'admin') {
            this.showNotification('Non hai i permessi per sospendere utenti', 'error');
            return;
        }

        const durationMap = {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const suspensionUntil = new Date(Date.now() + durationMap[duration]).toISOString();
        const actionType = `suspension_${duration}`;

        await this.logModerationAction(report.reported_user_id, actionType, reason, report.id, null, null, suspensionUntil);

        // Update user status
        await this.supabase
            .from('private_users')
            .update({ account_status: 'suspended' })
            .eq('id', report.reported_user_id);

        // Update report
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'resolved', 
                resolved_at: new Date().toISOString(),
                moderator_notes: `Sospeso ${duration}: ${reason}`
            })
            .eq('id', report.id);

        this.showNotification(`Utente sospeso per ${duration}`, 'success');
    }

    async banUser(report, reason) {
        // Check permission - only super_admin and admin can ban
        if (!this.permissions.can_ban && this.adminRole !== 'super_admin') {
            this.showNotification('Non hai i permessi per bannare utenti', 'error');
            return;
        }

        await this.logModerationAction(report.reported_user_id, 'ban', reason, report.id);

        // Update user status
        await this.supabase
            .from('private_users')
            .update({ account_status: 'banned' })
            .eq('id', report.reported_user_id);

        // Update report
        await this.supabase
            .from('content_reports')
            .update({ 
                status: 'resolved', 
                resolved_at: new Date().toISOString(),
                moderator_notes: `Bannato: ${reason}`
            })
            .eq('id', report.id);

        this.showNotification('Utente bannato permanentemente', 'success');
    }

    async logModerationAction(userId, actionType, reason, reportId = null, contentType = null, contentId = null, suspensionUntil = null) {
        await this.supabase
            .from('moderation_actions')
            .insert({
                user_id: userId,
                moderator_id: this.currentUser.id,
                action_type: actionType,
                reason: reason,
                report_id: reportId,
                content_type: contentType,
                content_id: contentId,
                suspension_until: suspensionUntil,
                user_notified: false // User will see notification on next page load
            });
    }

    async showContentPreview(report) {
        const modal = document.getElementById('contentPreviewModal');
        const body = document.getElementById('contentPreviewBody');

        body.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';
        modal.classList.add('active');

        try {
            let content = null;
            let authorInfo = null;
            const contentType = report.reported_content_type;
            const contentId = report.reported_content_id;

            if (contentType === 'post') {
                const { data } = await this.supabase
                    .from('institute_posts')
                    .select('*')
                    .eq('id', contentId)
                    .single();
                content = data;
                
                // Get author info
                if (content?.author_id) {
                    const { data: author } = await this.supabase
                        .from('school_institutes')
                        .select('name, logo_url, city, province')
                        .eq('id', content.author_id)
                        .single();
                    authorInfo = author;
                }
            } else if (contentType === 'comment') {
                const { data } = await this.supabase
                    .from('post_comments')
                    .select('*')
                    .eq('id', contentId)
                    .single();
                content = data;
                
                // Get commenter info
                if (content?.user_id) {
                    const { data: user } = await this.supabase
                        .from('private_users')
                        .select('first_name, last_name, avatar_url')
                        .eq('id', content.user_id)
                        .single();
                    authorInfo = user;
                }
            }

            if (!content) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-trash-alt" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
                        <p class="mod-empty-state">Contenuto non trovato o già eliminato</p>
                    </div>
                `;
                return;
            }

            // Parse images array if exists
            let images = [];
            if (content.images) {
                try {
                    images = typeof content.images === 'string' ? JSON.parse(content.images) : content.images;
                } catch (e) {
                    images = [];
                }
            }
            if (content.image_url && !images.includes(content.image_url)) {
                images.unshift(content.image_url);
            }

            // Build author display
            const authorDisplay = contentType === 'post' 
                ? `
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: #f1f5f9; border-radius: 8px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${authorInfo?.logo_url 
                                ? `<img src="${authorInfo.logo_url}" style="width: 100%; height: 100%; object-fit: cover;">`
                                : `<i class="fas fa-school" style="color: white;"></i>`
                            }
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${authorInfo?.name || 'Istituto'}</div>
                            ${authorInfo?.city ? `<div style="font-size: 0.8rem; color: #6b7280;">${authorInfo.city}${authorInfo.province ? `, ${authorInfo.province}` : ''}</div>` : ''}
                        </div>
                    </div>
                `
                : `
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: #f1f5f9; border-radius: 8px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${authorInfo?.avatar_url 
                                ? `<img src="${authorInfo.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">`
                                : `<i class="fas fa-user" style="color: white;"></i>`
                            }
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">${authorInfo ? `${authorInfo.first_name || ''} ${authorInfo.last_name || ''}`.trim() : 'Utente'}</div>
                            <div style="font-size: 0.8rem; color: #6b7280;">Commento</div>
                        </div>
                    </div>
                `;

            // Build images gallery
            const imagesHtml = images.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h4 style="font-size: 0.9rem; color: #6b7280; margin-bottom: 0.5rem;">
                        <i class="fas fa-images"></i> Immagini (${images.length})
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">
                        ${images.map((img, idx) => `
                            <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="window.open('${img}', '_blank')">
                                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="Immagine ${idx + 1}">
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 0.5rem; color: white; font-size: 0.75rem;">
                                    <i class="fas fa-expand"></i> Clicca per ingrandire
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '';

            // Build report info section
            const reportInfoHtml = `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4 style="color: #92400e; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-flag"></i> Dettagli Segnalazione
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.85rem;">
                        <div><strong>Motivo:</strong> ${this.getCategoryLabel(report.category || report.report_reason)}</div>
                        <div><strong>Priorità:</strong> ${this.getPriorityLabel(report.priority || 'normal')}</div>
                        <div><strong>Segnalato il:</strong> ${this.formatDate(report.created_at)}</div>
                        <div><strong>Stato:</strong> ${this.getStatusLabel(report.status)}</div>
                    </div>
                    ${report.report_description ? `
                        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #fcd34d;">
                            <strong>Descrizione:</strong>
                            <p style="margin: 0.25rem 0 0; color: #78350f;">${this.escapeHtml(report.report_description)}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            body.innerHTML = `
                <div class="mod-preview-content">
                    ${reportInfoHtml}
                    
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
                        ${authorDisplay}
                        
                        ${content.title ? `
                            <h3 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem;">
                                ${this.escapeHtml(content.title)}
                            </h3>
                        ` : ''}
                        
                        ${content.post_type ? `
                            <span style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.75rem;">
                                ${content.post_type}
                            </span>
                        ` : ''}
                        
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; color: #374151;">
                            ${this.escapeHtml(content.content)}
                        </div>
                        
                        ${imagesHtml}
                        
                        ${content.tags ? `
                            <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                ${(typeof content.tags === 'string' ? content.tags.split(',') : content.tags).map(tag => `
                                    <span style="background: #f1f5f9; color: #475569; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                                        #${tag.trim()}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="mod-report-info" style="margin-bottom: 1rem;">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Tipo contenuto</span>
                            <span class="mod-info-value">${contentType === 'post' ? 'Post' : 'Commento'}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">ID Contenuto</span>
                            <span class="mod-info-value" style="font-family: monospace; font-size: 0.8rem;">${contentId}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Creato il</span>
                            <span class="mod-info-value">${this.formatDate(content.created_at)}</span>
                        </div>
                        ${content.likes_count !== undefined ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Like</span>
                                <span class="mod-info-value">${content.likes_count || 0}</span>
                            </div>
                        ` : ''}
                        ${content.comments_count !== undefined ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Commenti</span>
                                <span class="mod-info-value">${content.comments_count || 0}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="mod-report-actions" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <button class="mod-btn mod-btn-outline" onclick="moderationCenter.closeModals()">
                        <i class="fas fa-times"></i> Chiudi
                    </button>
                    <button class="mod-btn mod-btn-warning" onclick="moderationCenter.closeModals(); moderationCenter.handleReportAction('shadowban', '${report.id}')">
                        <i class="fas fa-eye-slash"></i> Shadowban
                    </button>
                    <button class="mod-btn mod-btn-danger" onclick="moderationCenter.closeModals(); moderationCenter.handleReportAction('delete-content', '${report.id}')">
                        <i class="fas fa-trash"></i> Elimina Contenuto
                    </button>
                    <button class="mod-btn mod-btn-success" onclick="moderationCenter.closeModals(); moderationCenter.handleReportAction('dismiss', '${report.id}')">
                        <i class="fas fa-check"></i> Respingi Segnalazione
                    </button>
                </div>
            `;

        } catch (error) {
            console.error('Error loading preview:', error);
            body.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    async loadGdprRequests() {
        const container = document.getElementById('gdprList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            let query = this.supabase
                .from('gdpr_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (this.filters.gdprStatus !== 'all') {
                query = query.eq('status', this.filters.gdprStatus);
            }
            if (this.filters.gdprType !== 'all') {
                query = query.eq('request_type', this.filters.gdprType);
            }

            const { data: requests, error } = await query.limit(50);

            if (error) throw error;

            if (!requests || requests.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessuna richiesta GDPR</p>';
                return;
            }

            container.innerHTML = requests.map(req => this.renderGdprCard(req)).join('');

        } catch (error) {
            console.error('Error loading GDPR requests:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderGdprCard(request) {
        const typeLabels = {
            access: 'Accesso dati',
            rectification: 'Rettifica',
            erasure: 'Cancellazione',
            portability: 'Portabilità',
            objection: 'Opposizione',
            restriction: 'Limitazione'
        };

        return `
            <div class="mod-report-card">
                <div class="mod-report-header">
                    <div class="mod-report-meta">
                        <span class="mod-report-id">#${request.id.substring(0, 8)}</span>
                        <span class="mod-category-badge">
                            <i class="fas fa-user-shield"></i>
                            ${typeLabels[request.request_type] || request.request_type}
                        </span>
                    </div>
                    <span class="mod-status-badge ${request.status}">${this.getStatusLabel(request.status)}</span>
                </div>
                <div class="mod-report-body">
                    <div class="mod-report-info">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Email</span>
                            <span class="mod-info-value">${request.user_email}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Data richiesta</span>
                            <span class="mod-info-value">${this.formatDate(request.created_at)}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Scadenza</span>
                            <span class="mod-info-value">${request.deadline_at ? this.formatDate(request.deadline_at) : '30 giorni'}</span>
                        </div>
                    </div>
                    ${request.request_details ? `
                        <div class="mod-report-content">
                            <h4>Dettagli</h4>
                            <p>${this.escapeHtml(request.request_details)}</p>
                        </div>
                    ` : ''}
                    <div class="mod-report-actions">
                        ${request.status === 'pending' ? `
                            <button class="mod-btn mod-btn-primary" onclick="moderationCenter.processGdprRequest('${request.id}')">
                                <i class="fas fa-play"></i> Elabora
                            </button>
                        ` : ''}
                        ${request.status === 'processing' ? `
                            <button class="mod-btn mod-btn-success" onclick="moderationCenter.completeGdprRequest('${request.id}')">
                                <i class="fas fa-check"></i> Completa
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async processGdprRequest(requestId) {
        await this.supabase
            .from('gdpr_requests')
            .update({ 
                status: 'processing',
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        this.showNotification('Richiesta presa in carico', 'success');
        this.loadGdprRequests();
        this.loadStats();
    }

    async completeGdprRequest(requestId) {
        await this.supabase
            .from('gdpr_requests')
            .update({ 
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', requestId);
        
        this.showNotification('Richiesta completata', 'success');
        this.loadGdprRequests();
        this.loadStats();
    }

    async loadParentalConsents() {
        const container = document.getElementById('parentalList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            let query = this.supabase
                .from('parental_consents')
                .select('*')
                .order('created_at', { ascending: false });

            const now = new Date().toISOString();
            
            // Filtra per status (usa la nuova colonna status)
            if (this.filters.parentalStatus === 'pending') {
                query = query.eq('status', 'pending').gt('token_expires_at', now);
            } else if (this.filters.parentalStatus === 'approved') {
                query = query.eq('status', 'approved');
            } else if (this.filters.parentalStatus === 'denied') {
                query = query.eq('status', 'denied');
            } else if (this.filters.parentalStatus === 'expired') {
                query = query.or(`status.eq.expired,and(status.eq.pending,token_expires_at.lt.${now})`);
            }
            // 'all' non applica filtri

            const { data: consents, error } = await query.limit(50);

            if (error) throw error;

            if (!consents || consents.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessun consenso parentale trovato</p>';
                return;
            }

            // Calcola statistiche
            const stats = this.calculateParentalStats(consents);
            
            container.innerHTML = `
                <div class="mod-parental-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="mod-stat-mini" style="background: rgba(251, 191, 36, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${stats.pending}</div>
                        <div style="font-size: 0.8rem; color: #92400e;">In Attesa</div>
                    </div>
                    <div class="mod-stat-mini" style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${stats.approved}</div>
                        <div style="font-size: 0.8rem; color: #065f46;">Approvati</div>
                    </div>
                    <div class="mod-stat-mini" style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${stats.denied}</div>
                        <div style="font-size: 0.8rem; color: #991b1b;">Rifiutati</div>
                    </div>
                    <div class="mod-stat-mini" style="background: rgba(107, 114, 128, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #6b7280;">${stats.expired}</div>
                        <div style="font-size: 0.8rem; color: #374151;">Scaduti</div>
                    </div>
                </div>
                ${consents.map(consent => this.renderParentalCard(consent)).join('')}
            `;

        } catch (error) {
            console.error('Error loading parental consents:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    calculateParentalStats(consents) {
        const now = new Date();
        return consents.reduce((acc, c) => {
            const isExpired = new Date(c.token_expires_at) < now;
            const status = c.status || (c.confirmed_at ? 'approved' : (isExpired ? 'expired' : 'pending'));
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { pending: 0, approved: 0, denied: 0, expired: 0 });
    }

    renderParentalCard(consent) {
        const now = new Date();
        const isExpired = new Date(consent.token_expires_at) < now;
        const status = consent.status || (consent.confirmed_at ? 'approved' : (isExpired ? 'expired' : 'pending'));
        
        const statusConfig = {
            pending: { label: 'In Attesa', class: 'pending', icon: 'clock' },
            approved: { label: 'Approvato', class: 'resolved', icon: 'check-circle' },
            denied: { label: 'Rifiutato', class: 'dismissed', icon: 'times-circle' },
            expired: { label: 'Scaduto', class: 'expired', icon: 'hourglass-end' },
            cancelled: { label: 'Annullato', class: 'dismissed', icon: 'ban' }
        };
        
        const statusInfo = statusConfig[status] || statusConfig.pending;
        
        // Calcola età del minore se disponibile
        let minorAge = null;
        if (consent.minor_birth_date) {
            const birth = new Date(consent.minor_birth_date);
            minorAge = now.getFullYear() - birth.getFullYear();
            const monthDiff = now.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
                minorAge--;
            }
        }

        // Storico stati
        const statusHistory = consent.status_history || [];
        const historyHtml = statusHistory.length > 0 ? `
            <div class="mod-status-history" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                <h5 style="font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.5rem;">
                    <i class="fas fa-history"></i> Storico Stati
                </h5>
                <div style="font-size: 0.8rem; color: #6b7280;">
                    ${statusHistory.map(h => `
                        <div style="padding: 0.25rem 0; display: flex; justify-content: space-between;">
                            <span>${h.from_status || 'nuovo'} → ${h.to_status}</span>
                            <span>${this.formatDate(h.changed_at)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `
            <div class="mod-report-card" style="margin-bottom: 1rem;">
                <div class="mod-report-header">
                    <div class="mod-report-meta">
                        <span class="mod-report-id">#${consent.id.substring(0, 8)}</span>
                        <span class="mod-category-badge">
                            <i class="fas fa-child"></i>
                            Consenso Parentale
                        </span>
                        ${minorAge ? `<span class="mod-age-badge" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${minorAge} anni</span>` : ''}
                    </div>
                    <span class="mod-status-badge ${statusInfo.class}">
                        <i class="fas fa-${statusInfo.icon}"></i> ${statusInfo.label}
                    </span>
                </div>
                <div class="mod-report-body">
                    <!-- Info Minore -->
                    <div class="mod-section-title" style="font-size: 0.9rem; font-weight: 600; color: #e5e7eb; margin-bottom: 0.75rem;">
                        <i class="fas fa-user"></i> Dati Minore
                    </div>
                    <div class="mod-report-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Nome</span>
                            <span class="mod-info-value">${consent.minor_first_name || 'N/A'} ${consent.minor_last_name || ''}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Email</span>
                            <span class="mod-info-value">${consent.minor_email || 'N/A'}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Data Nascita</span>
                            <span class="mod-info-value">${consent.minor_birth_date ? this.formatDate(consent.minor_birth_date) : 'N/A'}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Codice Fiscale</span>
                            <span class="mod-info-value" style="font-family: monospace;">${consent.minor_codice_fiscale || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <!-- Info Genitore -->
                    <div class="mod-section-title" style="font-size: 0.9rem; font-weight: 600; color: #e5e7eb; margin: 1rem 0 0.75rem;">
                        <i class="fas fa-user-shield"></i> Dati Genitore/Tutore
                    </div>
                    <div class="mod-report-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Nome</span>
                            <span class="mod-info-value">${consent.parent_name || 'N/A'}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Email</span>
                            <span class="mod-info-value">${consent.parent_email}</span>
                        </div>
                    </div>
                    
                    <!-- Date -->
                    <div class="mod-section-title" style="font-size: 0.9rem; font-weight: 600; color: #e5e7eb; margin: 1rem 0 0.75rem;">
                        <i class="fas fa-calendar"></i> Timeline
                    </div>
                    <div class="mod-report-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Richiesto il</span>
                            <span class="mod-info-value">${this.formatDate(consent.created_at)}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Scadenza Token</span>
                            <span class="mod-info-value ${isExpired ? 'text-danger' : ''}">${this.formatDate(consent.token_expires_at)}</span>
                        </div>
                        ${consent.confirmed_at ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Approvato il</span>
                                <span class="mod-info-value" style="color: #10b981;">${this.formatDate(consent.confirmed_at)}</span>
                            </div>
                        ` : ''}
                        ${consent.denied_at ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Rifiutato il</span>
                                <span class="mod-info-value" style="color: #ef4444;">${this.formatDate(consent.denied_at)}</span>
                            </div>
                        ` : ''}
                        ${consent.reminder_count > 0 ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Promemoria inviati</span>
                                <span class="mod-info-value">${consent.reminder_count}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${consent.denial_reason ? `
                        <div class="mod-denial-reason" style="margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444;">
                            <strong style="color: #fca5a5;">Motivo rifiuto:</strong>
                            <p style="margin: 0.5rem 0 0; color: #fecaca;">${this.escapeHtml(consent.denial_reason)}</p>
                        </div>
                    ` : ''}
                    
                    ${historyHtml}
                    
                    <!-- Azioni -->
                    ${status === 'pending' && !isExpired ? `
                        <div class="mod-report-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="mod-btn mod-btn-outline" onclick="moderationCenter.resendParentalEmail('${consent.id}')">
                                <i class="fas fa-envelope"></i> Reinvia Email
                            </button>
                            <button class="mod-btn mod-btn-success" onclick="moderationCenter.approveParentalConsent('${consent.id}')">
                                <i class="fas fa-check"></i> Approva Manualmente
                            </button>
                            <button class="mod-btn mod-btn-danger" onclick="moderationCenter.denyParentalConsent('${consent.id}')">
                                <i class="fas fa-times"></i> Rifiuta
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async resendParentalEmail(consentId) {
        try {
            // Recupera i dati del consenso
            const { data: consent, error } = await this.supabase
                .from('parental_consents')
                .select('*')
                .eq('id', consentId)
                .single();

            if (error || !consent) {
                this.showNotification('Consenso non trovato', 'error');
                return;
            }

            // Chiama l'Edge Function per reinviare l'email
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-parental-consent-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    minorUserId: consent.minor_user_id,
                    parentEmail: consent.parent_email,
                    parentName: consent.parent_name,
                    minorFirstName: consent.minor_first_name,
                    minorLastName: consent.minor_last_name,
                    minorEmail: consent.minor_email,
                    minorBirthDate: consent.minor_birth_date,
                    minorCodiceFiscale: consent.minor_codice_fiscale
                })
            });

            if (response.ok) {
                // Aggiorna il contatore promemoria
                await this.supabase
                    .from('parental_consents')
                    .update({ 
                        reminder_sent_at: new Date().toISOString(),
                        reminder_count: (consent.reminder_count || 0) + 1
                    })
                    .eq('id', consentId);

                this.showNotification('Email reinviata con successo', 'success');
                this.loadParentalConsents();
            } else {
                this.showNotification('Errore nell\'invio dell\'email', 'error');
            }
        } catch (error) {
            console.error('Error resending email:', error);
            this.showNotification('Errore nell\'invio dell\'email', 'error');
        }
    }

    async approveParentalConsent(consentId) {
        if (!confirm('Sei sicuro di voler approvare manualmente questo consenso? L\'account del minore verrà attivato.')) {
            return;
        }

        try {
            // Aggiorna il consenso
            const { data: consent, error: consentError } = await this.supabase
                .from('parental_consents')
                .update({ 
                    status: 'approved',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', consentId)
                .select()
                .single();

            if (consentError) throw consentError;

            // Attiva l'account del minore
            if (consent.minor_user_id) {
                await this.supabase
                    .from('private_users')
                    .update({
                        parental_consent_verified: true,
                        account_status: 'active'
                    })
                    .eq('id', consent.minor_user_id);
            }

            this.showNotification('Consenso approvato e account attivato', 'success');
            this.loadParentalConsents();
        } catch (error) {
            console.error('Error approving consent:', error);
            this.showNotification('Errore nell\'approvazione', 'error');
        }
    }

    async denyParentalConsent(consentId) {
        const reason = prompt('Inserisci il motivo del rifiuto (opzionale):');
        
        if (!confirm('Sei sicuro di voler rifiutare questo consenso? L\'account del minore non sarà attivato.')) {
            return;
        }

        try {
            // Aggiorna il consenso
            const { data: consent, error: consentError } = await this.supabase
                .from('parental_consents')
                .update({ 
                    status: 'denied',
                    denied_at: new Date().toISOString(),
                    denial_reason: reason || null
                })
                .eq('id', consentId)
                .select()
                .single();

            if (consentError) throw consentError;

            // Aggiorna lo stato dell'account del minore
            if (consent.minor_user_id) {
                await this.supabase
                    .from('private_users')
                    .update({
                        account_status: 'parental_consent_denied'
                    })
                    .eq('id', consent.minor_user_id);
            }

            this.showNotification('Consenso rifiutato', 'info');
            this.loadParentalConsents();
        } catch (error) {
            console.error('Error denying consent:', error);
            this.showNotification('Errore nel rifiuto', 'error');
        }
    }

    async loadAppeals() {
        const container = document.getElementById('appealsList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            let query = this.supabase
                .from('moderation_actions')
                .select('*')
                .not('appeal_text', 'is', null) // Has appeal text = has submitted appeal
                .order('appeal_submitted_at', { ascending: false, nullsFirst: false });

            if (this.filters.appealStatus !== 'all') {
                query = query.eq('appeal_status', this.filters.appealStatus);
            }

            const { data: appeals, error } = await query.limit(50);

            if (error) throw error;

            if (!appeals || appeals.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessun appello trovato</p>';
                return;
            }

            container.innerHTML = appeals.map(appeal => this.renderAppealCard(appeal)).join('');

        } catch (error) {
            console.error('Error loading appeals:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderAppealCard(appeal) {
        return `
            <div class="mod-report-card">
                <div class="mod-report-header">
                    <div class="mod-report-meta">
                        <span class="mod-report-id">#${appeal.id.substring(0, 8)}</span>
                        <span class="mod-category-badge">
                            <i class="fas fa-gavel"></i>
                            ${this.getActionLabel(appeal.action_type)}
                        </span>
                    </div>
                    <span class="mod-status-badge ${appeal.appeal_status}">${this.getAppealStatusLabel(appeal.appeal_status)}</span>
                </div>
                <div class="mod-report-body">
                    <div class="mod-report-content">
                        <h4>Motivo originale</h4>
                        <p>${this.escapeHtml(appeal.reason)}</p>
                    </div>
                    ${appeal.appeal_text ? `
                        <div class="mod-report-content">
                            <h4>Testo appello</h4>
                            <p>${this.escapeHtml(appeal.appeal_text)}</p>
                        </div>
                    ` : ''}
                    <div class="mod-report-info">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Data azione</span>
                            <span class="mod-info-value">${this.formatDate(appeal.created_at)}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Data appello</span>
                            <span class="mod-info-value">${appeal.appeal_submitted_at ? this.formatDate(appeal.appeal_submitted_at) : 'N/A'}</span>
                        </div>
                    </div>
                    ${appeal.appeal_status === 'pending' ? `
                        <div class="mod-report-actions">
                            <button class="mod-btn mod-btn-success" onclick="moderationCenter.resolveAppeal('${appeal.id}', 'approved')">
                                <i class="fas fa-check"></i> Approva
                            </button>
                            <button class="mod-btn mod-btn-danger" onclick="moderationCenter.resolveAppeal('${appeal.id}', 'rejected')">
                                <i class="fas fa-times"></i> Respingi
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async resolveAppeal(appealId, decision) {
        try {
            // Get the action first
            const { data: action } = await this.supabase
                .from('moderation_actions')
                .select('*')
                .eq('id', appealId)
                .single();

            if (!action) {
                this.showNotification('Azione non trovata', 'error');
                return;
            }

            // Update appeal status
            await this.supabase
                .from('moderation_actions')
                .update({ 
                    appeal_status: decision,
                    appeal_resolved_at: new Date().toISOString(),
                    appeal_response: decision === 'approved' 
                        ? 'Il tuo ricorso è stato accettato. L\'azione è stata annullata.'
                        : 'Il tuo ricorso è stato esaminato ma non è stato accolto.',
                    user_notified: false // Notify user of the decision
                })
                .eq('id', appealId);

            if (decision === 'approved') {
                // Reverse the action based on type
                if (action.action_type === 'content_shadowban' && action.content_id) {
                    // Restore shadowbanned content with proper field clearing
                    if (action.content_type === 'post') {
                        await this.supabase
                            .from('institute_posts')
                            .update({ 
                                shadowbanned: false,
                                shadowbanned_at: null,
                                shadowbanned_reason: null,
                                published: true 
                            })
                            .eq('id', action.content_id);
                    } else if (action.content_type === 'comment') {
                        await this.supabase
                            .from('post_comments')
                            .update({ 
                                hidden: false,
                                shadowbanned_at: null,
                                shadowbanned_reason: null
                            })
                            .eq('id', action.content_id);
                    }
                }

                // Restore user status for suspensions/bans
                if (['suspension_24h', 'suspension_7d', 'suspension_30d', 'ban'].includes(action.action_type)) {
                    await this.supabase
                        .from('private_users')
                        .update({ account_status: 'active' })
                        .eq('id', action.user_id);
                }
            }

            this.showNotification(`Appello ${decision === 'approved' ? 'approvato' : 'respinto'}`, 'success');
            this.loadAppeals();
            this.loadStats();

        } catch (error) {
            console.error('Error resolving appeal:', error);
            this.showNotification('Errore', 'error');
        }
    }

    async loadActions() {
        const container = document.getElementById('actionsList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            const { data: actions, error } = await this.supabase
                .from('moderation_actions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            if (!actions || actions.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessuna azione registrata</p>';
                return;
            }

            container.innerHTML = actions.map(action => `
                <div class="mod-report-card" style="margin-bottom: 0.75rem;">
                    <div class="mod-report-header">
                        <div class="mod-report-meta">
                            <span class="mod-report-id">#${action.id.substring(0, 8)}</span>
                            <span class="mod-category-badge" style="background: ${this.getActionColor(action.action_type)}20; color: ${this.getActionColor(action.action_type)};">
                                <i class="fas ${this.getActionIcon(action.action_type)}"></i>
                                ${this.getActionLabel(action.action_type)}
                            </span>
                            ${action.content_type ? `<span class="mod-category-badge"><i class="fas ${action.content_type === 'post' ? 'fa-newspaper' : 'fa-comment'}"></i> ${action.content_type}</span>` : ''}
                        </div>
                        <span class="mod-activity-time">${this.formatDate(action.created_at)}</span>
                    </div>
                    <div class="mod-report-body" style="padding: 0.75rem 1rem;">
                        <p style="margin: 0; color: #475569;">${this.escapeHtml(action.reason || 'Nessun motivo specificato')}</p>
                        <div class="mod-report-info" style="margin-top: 0.75rem;">
                            ${action.user_id ? `
                                <div class="mod-info-item">
                                    <span class="mod-info-label">Utente</span>
                                    <span class="mod-info-value">${action.user_id.substring(0, 8)}...</span>
                                </div>
                            ` : ''}
                            ${action.appeal_status && action.appeal_status !== 'none' ? `
                                <div class="mod-info-item">
                                    <span class="mod-info-label">Appello</span>
                                    <span class="mod-info-value mod-status-badge ${action.appeal_status}">${this.getAppealStatusLabel(action.appeal_status)}</span>
                                </div>
                            ` : ''}
                            ${action.suspension_until ? `
                                <div class="mod-info-item">
                                    <span class="mod-info-label">Scadenza</span>
                                    <span class="mod-info-value">${this.formatDate(action.suspension_until)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading actions:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    async loadContent() {
        const container = document.getElementById('contentList');
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        const contentType = document.getElementById('contentTypeFilter')?.value || 'posts';
        const statusFilter = document.getElementById('contentStatusFilter')?.value || 'shadowbanned';

        try {
            let items = [];

            if (contentType === 'posts') {
                let query = this.supabase
                    .from('institute_posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                // Apply status filter - use shadowbanned column for accurate tracking
                if (statusFilter === 'shadowbanned') {
                    query = query.eq('shadowbanned', true);
                } else if (statusFilter === 'visible') {
                    query = query.or('shadowbanned.is.null,shadowbanned.eq.false');
                }
                // 'all' doesn't add filter

                const { data, error } = await query;
                if (error) throw error;
                
                // Fetch institute names separately
                const posts = data || [];
                if (posts.length > 0) {
                    const instituteIds = [...new Set(posts.map(p => p.institute_id).filter(Boolean))];
                    if (instituteIds.length > 0) {
                        const { data: institutes } = await this.supabase
                            .from('school_institutes')
                            .select('id, institute_name, logo_url')
                            .in('id', instituteIds);
                        
                        const instituteMap = {};
                        (institutes || []).forEach(i => instituteMap[i.id] = { name: i.institute_name, logo_url: i.logo_url });
                        
                        items = posts.map(p => ({ 
                            ...p, 
                            type: 'post',
                            school_institutes: instituteMap[p.institute_id] || null
                        }));
                    } else {
                        items = posts.map(p => ({ ...p, type: 'post', school_institutes: null }));
                    }
                }

            } else if (contentType === 'comments') {
                let query = this.supabase
                    .from('post_comments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (statusFilter === 'shadowbanned') {
                    query = query.eq('hidden', true);
                } else if (statusFilter === 'visible') {
                    query = query.or('hidden.is.null,hidden.eq.false');
                }

                const { data, error } = await query;
                if (error) throw error;
                
                // Fetch user names separately
                const comments = data || [];
                if (comments.length > 0) {
                    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))];
                    const { data: users } = await this.supabase
                        .from('private_users')
                        .select('id, first_name, last_name')
                        .in('id', userIds);
                    
                    const userMap = {};
                    (users || []).forEach(u => userMap[u.id] = u);
                    
                    items = comments.map(c => ({ 
                        ...c, 
                        type: 'comment',
                        private_users: userMap[c.user_id] || null
                    }));
                }
            }

            if (items.length === 0) {
                const statusLabels = {
                    shadowbanned: 'shadowbannati',
                    visible: 'visibili',
                    all: ''
                };
                container.innerHTML = `<p class="mod-empty-state">Nessun ${contentType === 'posts' ? 'post' : 'commento'} ${statusLabels[statusFilter]} trovato</p>`;
                return;
            }

            // Get moderation history for these items
            const itemIds = items.map(i => i.id);
            const { data: moderationHistory } = await this.supabase
                .from('moderation_actions')
                .select('*')
                .in('content_id', itemIds)
                .order('created_at', { ascending: false });

            const historyMap = {};
            (moderationHistory || []).forEach(h => {
                if (!historyMap[h.content_id]) historyMap[h.content_id] = [];
                historyMap[h.content_id].push(h);
            });

            container.innerHTML = items.map(item => this.renderContentCard(item, historyMap[item.id] || [])).join('');
            this.attachContentActions();

        } catch (error) {
            console.error('Error loading content:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderContentCard(item, history) {
        const isPost = item.type === 'post';
        const isShadowbanned = isPost ? (item.shadowbanned === true) : (item.hidden === true);
        const authorName = isPost 
            ? (item.school_institutes?.name || 'Istituto sconosciuto')
            : (item.private_users ? `${item.private_users.first_name} ${item.private_users.last_name}` : item.school_institutes?.name || 'Utente');

        return `
            <div class="mod-report-card" data-content-id="${item.id}" data-content-type="${item.type}">
                <div class="mod-report-header">
                    <div class="mod-report-meta">
                        <span class="mod-report-id">#${item.id.substring(0, 8)}</span>
                        <span class="mod-category-badge">
                            <i class="fas ${isPost ? 'fa-newspaper' : 'fa-comment'}"></i>
                            ${isPost ? 'Post' : 'Commento'}
                        </span>
                        ${isShadowbanned ? '<span class="mod-priority-badge high"><i class="fas fa-eye-slash"></i> Shadowban</span>' : '<span class="mod-priority-badge low"><i class="fas fa-eye"></i> Visibile</span>'}
                    </div>
                    <span class="mod-status-badge ${isShadowbanned ? 'pending' : 'resolved'}">${isShadowbanned ? 'Nascosto' : 'Pubblico'}</span>
                </div>
                <div class="mod-report-body">
                    <div class="mod-report-content">
                        <h4>Autore: ${this.escapeHtml(authorName)}</h4>
                        ${isPost && item.title ? `<p><strong>${this.escapeHtml(item.title)}</strong></p>` : ''}
                        <p style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem; max-height: 150px; overflow-y: auto;">
                            ${this.escapeHtml(item.content?.substring(0, 500) || 'Nessun contenuto')}${item.content?.length > 500 ? '...' : ''}
                        </p>
                    </div>
                    <div class="mod-report-info">
                        <div class="mod-info-item">
                            <span class="mod-info-label">Creato</span>
                            <span class="mod-info-value">${this.formatDate(item.created_at)}</span>
                        </div>
                        ${isPost ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Likes</span>
                                <span class="mod-info-value">${item.likes_count || 0}</span>
                            </div>
                        ` : ''}
                        ${isShadowbanned && item.shadowbanned_at ? `
                            <div class="mod-info-item">
                                <span class="mod-info-label">Shadowban</span>
                                <span class="mod-info-value">${this.formatDate(item.shadowbanned_at)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${isShadowbanned && item.shadowbanned_reason ? `
                        <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px;">
                            <strong style="color: #ef4444; font-size: 0.8rem;"><i class="fas fa-ban"></i> Motivo shadowban:</strong>
                            <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem;">${this.escapeHtml(item.shadowbanned_reason)}</p>
                        </div>
                    ` : ''}
                    
                    ${history.length > 0 ? `
                        <div class="mod-content-history" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                            <h4 style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">
                                <i class="fas fa-history"></i> Storico Moderazione (${history.length})
                            </h4>
                            <div style="max-height: 150px; overflow-y: auto;">
                                ${history.map(h => `
                                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f1f5f9; border-radius: 4px; margin-bottom: 0.25rem; font-size: 0.8rem;">
                                        <i class="fas ${this.getActionIcon(h.action_type)}" style="color: ${this.getActionColor(h.action_type)};"></i>
                                        <span style="flex: 1;">${this.getActionLabel(h.action_type)}</span>
                                        <span style="color: #94a3b8;">${this.formatTimeAgo(h.created_at)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mod-report-actions" style="margin-top: 1rem;">
                        ${isShadowbanned ? `
                            <button class="mod-btn mod-btn-success" data-action="restore" data-id="${item.id}" data-type="${item.type}">
                                <i class="fas fa-undo"></i> Ripristina
                            </button>
                            <button class="mod-btn mod-btn-danger" data-action="delete-permanent" data-id="${item.id}" data-type="${item.type}">
                                <i class="fas fa-trash"></i> Elimina Definitivamente
                            </button>
                        ` : `
                            <button class="mod-btn mod-btn-warning" data-action="shadowban" data-id="${item.id}" data-type="${item.type}">
                                <i class="fas fa-eye-slash"></i> Shadowban
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    attachContentActions() {
        document.querySelectorAll('.mod-content-list button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                this.handleContentAction(action, id, type);
            });
        });
    }

    async handleContentAction(action, contentId, contentType) {
        try {
            if (action === 'restore') {
                await this.restoreContent(contentId, contentType);
            } else if (action === 'shadowban') {
                await this.shadowbanContentDirect(contentId, contentType);
            } else if (action === 'delete-permanent') {
                if (confirm('Sei sicuro di voler eliminare definitivamente questo contenuto? Questa azione non può essere annullata.')) {
                    await this.deleteContentPermanent(contentId, contentType);
                }
            }
        } catch (error) {
            console.error('Content action error:', error);
            this.showNotification('Errore nell\'esecuzione', 'error');
        }
    }

    async restoreContent(contentId, contentType) {
        if (contentType === 'post') {
            await this.supabase
                .from('institute_posts')
                .update({ 
                    shadowbanned: false,
                    shadowbanned_at: null,
                    shadowbanned_reason: null,
                    published: true 
                })
                .eq('id', contentId);
        } else {
            await this.supabase
                .from('post_comments')
                .update({ 
                    hidden: false,
                    shadowbanned_at: null,
                    shadowbanned_reason: null
                })
                .eq('id', contentId);
        }

        // Log the restore action
        await this.supabase
            .from('moderation_actions')
            .insert({
                moderator_id: this.currentUser.id,
                action_type: 'content_restored',
                reason: 'Contenuto ripristinato manualmente',
                content_type: contentType,
                content_id: contentId
            });

        this.showNotification('Contenuto ripristinato', 'success');
        this.loadContent();
        this.loadStats();
    }

    async shadowbanContentDirect(contentId, contentType) {
        const reason = prompt('Motivo dello shadowban:');
        if (!reason) return;

        const now = new Date().toISOString();

        if (contentType === 'post') {
            await this.supabase
                .from('institute_posts')
                .update({ 
                    shadowbanned: true,
                    shadowbanned_at: now,
                    shadowbanned_reason: reason,
                    published: false 
                })
                .eq('id', contentId);
        } else {
            await this.supabase
                .from('post_comments')
                .update({ 
                    hidden: true,
                    shadowbanned_at: now,
                    shadowbanned_reason: reason
                })
                .eq('id', contentId);
        }

        // Get content owner for notification (only for comments, posts don't have direct user_id)
        let userId = null;
        if (contentType === 'comment') {
            const { data } = await this.supabase
                .from('post_comments')
                .select('user_id')
                .eq('id', contentId)
                .single();
            userId = data?.user_id;
        }
        // Note: For posts, we skip user notification since posts belong to institutes, not users

        // Log the action
        await this.supabase
            .from('moderation_actions')
            .insert({
                user_id: userId,
                moderator_id: this.currentUser.id,
                action_type: 'content_shadowban',
                reason: reason,
                content_type: contentType,
                content_id: contentId,
                user_notified: false
            });

        this.showNotification('Contenuto shadowbannato', 'success');
        this.loadContent();
        this.loadStats();
    }

    async deleteContentPermanent(contentId, contentType) {
        if (contentType === 'post') {
            await this.supabase
                .from('institute_posts')
                .delete()
                .eq('id', contentId);
        } else {
            await this.supabase
                .from('post_comments')
                .delete()
                .eq('id', contentId);
        }

        // Log the action
        await this.supabase
            .from('moderation_actions')
            .insert({
                moderator_id: this.currentUser.id,
                action_type: 'content_deleted_permanent',
                reason: 'Eliminazione definitiva',
                content_type: contentType,
                content_id: contentId
            });

        this.showNotification('Contenuto eliminato definitivamente', 'success');
        this.loadContent();
    }

    getActionIcon(actionType) {
        const icons = {
            'content_deleted': 'fa-trash',
            'content_shadowban': 'fa-eye-slash',
            'content_restored': 'fa-undo',
            'content_deleted_permanent': 'fa-trash-alt',
            'warning': 'fa-exclamation-triangle',
            'suspension_24h': 'fa-clock',
            'suspension_7d': 'fa-calendar-week',
            'suspension_30d': 'fa-calendar-alt',
            'ban': 'fa-ban'
        };
        return icons[actionType] || 'fa-gavel';
    }

    getActionColor(actionType) {
        const colors = {
            'content_deleted': '#ef4444',
            'content_shadowban': '#f59e0b',
            'content_restored': '#22c55e',
            'content_deleted_permanent': '#991b1b',
            'warning': '#f59e0b',
            'suspension_24h': '#ef4444',
            'suspension_7d': '#ef4444',
            'suspension_30d': '#dc2626',
            'ban': '#991b1b'
        };
        return colors[actionType] || '#64748b';
    }

    async searchUsers(query) {
        const container = document.getElementById('usersList');
        
        if (!query || query.length < 3) {
            container.innerHTML = '<p class="mod-empty-state">Inserisci almeno 3 caratteri per cercare</p>';
            return;
        }

        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Ricerca...</div>';

        try {
            const { data: users, error } = await this.supabase
                .from('private_users')
                .select('*')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .limit(20);

            if (error) throw error;

            if (!users || users.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessun utente trovato</p>';
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="mod-report-card">
                    <div class="mod-report-header">
                        <div class="mod-report-meta">
                            <span class="mod-report-id">${user.first_name} ${user.last_name}</span>
                            ${user.is_minor ? '<span class="mod-category-badge"><i class="fas fa-child"></i> Minore</span>' : ''}
                        </div>
                        <span class="mod-status-badge ${user.account_status === 'active' ? 'resolved' : 'pending'}">${user.account_status || 'active'}</span>
                    </div>
                    <div class="mod-report-body">
                        <div class="mod-report-info">
                            <div class="mod-info-item">
                                <span class="mod-info-label">ID</span>
                                <span class="mod-info-value">${user.id.substring(0, 8)}</span>
                            </div>
                            <div class="mod-info-item">
                                <span class="mod-info-label">Registrato</span>
                                <span class="mod-info-value">${this.formatDate(user.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error searching users:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nella ricerca</p>';
        }
    }

    // === UTILITY METHODS ===

    closeModals() {
        document.querySelectorAll('.mod-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showNotification(message, type = 'info') {
        // Simple notification
        const notification = document.createElement('div');
        notification.className = `mod-notification mod-notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getCategoryLabel(category) {
        const labels = {
            cyberbullying: 'Cyberbullismo',
            inappropriate: 'Contenuto inappropriato',
            spam: 'Spam',
            privacy: 'Violazione privacy',
            harassment: 'Molestie',
            misinformation: 'Informazioni false',
            other: 'Altro',
            user_report: 'Segnalazione utente'
        };
        return labels[category] || category;
    }

    getCategoryIcon(category) {
        const icons = {
            cyberbullying: 'fas fa-user-slash',
            inappropriate: 'fas fa-ban',
            spam: 'fas fa-ad',
            privacy: 'fas fa-user-secret',
            harassment: 'fas fa-angry',
            misinformation: 'fas fa-exclamation-triangle',
            other: 'fas fa-flag'
        };
        return icons[category] || 'fas fa-flag';
    }

    getPriorityLabel(priority) {
        const labels = { high: 'Alta', normal: 'Normale', low: 'Bassa' };
        return labels[priority] || priority;
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'In attesa',
            reviewing: 'In revisione',
            resolved: 'Risolto',
            dismissed: 'Respinto',
            processing: 'In elaborazione',
            completed: 'Completato',
            acknowledged: 'Preso in carico'
        };
        return labels[status] || status;
    }

    getActionLabel(action) {
        const labels = {
            warning: 'Avviso',
            content_removal: 'Rimozione contenuto',
            content_deleted: 'Contenuto eliminato',
            content_shadowban: 'Shadowban',
            content_restored: 'Contenuto ripristinato',
            content_deleted_permanent: 'Eliminazione definitiva',
            suspension_24h: 'Sospensione 24h',
            suspension_7d: 'Sospensione 7 giorni',
            suspension_30d: 'Sospensione 30 giorni',
            ban: 'Ban permanente'
        };
        return labels[action] || action;
    }

    getAppealStatusLabel(status) {
        const labels = {
            none: 'Nessuno',
            pending: 'In attesa',
            approved: 'Approvato',
            rejected: 'Respinto'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Ora';
        if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} giorni fa`;
        return this.formatDate(dateString);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // === ADMIN MANAGEMENT ===

    async loadAdmins() {
        const container = document.getElementById('adminsList');
        if (!container) return;
        
        container.innerHTML = '<div class="mod-loading"><i class="fas fa-spinner fa-spin"></i> Caricamento...</div>';

        try {
            const { data: admins, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!admins || admins.length === 0) {
                container.innerHTML = '<p class="mod-empty-state">Nessun amministratore configurato</p>';
                return;
            }

            // Fetch user details for each admin
            const adminsWithDetails = await Promise.all(admins.map(async (admin) => {
                // Try to get user info from private_users
                const { data: privateUser } = await this.supabase
                    .from('private_users')
                    .select('first_name, last_name, avatar_url')
                    .eq('id', admin.user_id)
                    .single();
                
                // Try to get email from auth (via school_institutes as fallback)
                const { data: institute } = await this.supabase
                    .from('school_institutes')
                    .select('email, name')
                    .eq('id', admin.user_id)
                    .single();

                return {
                    ...admin,
                    userDetails: privateUser || null,
                    instituteDetails: institute || null
                };
            }));

            container.innerHTML = adminsWithDetails.map(admin => this.renderAdminCard(admin)).join('');

        } catch (error) {
            console.error('Error loading admins:', error);
            container.innerHTML = '<p class="mod-empty-state">Errore nel caricamento</p>';
        }
    }

    renderAdminCard(admin) {
        const roleLabels = {
            super_admin: 'Super Admin',
            admin: 'Amministratore',
            moderator: 'Moderatore'
        };

        const roleColors = {
            super_admin: '#dc2626',
            admin: '#2563eb',
            moderator: '#059669'
        };

        const roleIcons = {
            super_admin: 'fa-crown',
            admin: 'fa-user-shield',
            moderator: 'fa-user-check'
        };

        const isCurrentUser = admin.user_id === this.currentUser?.id;
        
        // Get display name and avatar
        const userDetails = admin.userDetails;
        const instituteDetails = admin.instituteDetails;
        const displayName = userDetails 
            ? `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() 
            : (instituteDetails?.name || 'Utente');
        const avatarUrl = userDetails?.avatar_url;
        const email = instituteDetails?.email || '';
        
        // Get initials for avatar fallback
        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';

        return `
            <div class="mod-report-card" style="border-left: 4px solid ${roleColors[admin.role]};">
                <div class="mod-report-header">
                    <div class="mod-report-meta" style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: ${avatarUrl ? 'transparent' : `linear-gradient(135deg, ${roleColors[admin.role]}, ${roleColors[admin.role]}99)`}; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                            ${avatarUrl 
                                ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${displayName}">`
                                : `<span style="color: white; font-weight: 600; font-size: 1rem;">${initials}</span>`
                            }
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 1rem; color: #1f2937; display: flex; align-items: center; gap: 0.5rem;">
                                ${displayName}
                                ${isCurrentUser ? '<span style="font-size: 0.7rem; background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px;">Tu</span>' : ''}
                            </div>
                            ${email ? `<div style="font-size: 0.85rem; color: #6b7280;">${email}</div>` : ''}
                        </div>
                    </div>
                    <span class="mod-status-badge" style="background: ${roleColors[admin.role]}15; color: ${roleColors[admin.role]}; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas ${roleIcons[admin.role]}"></i>
                        ${roleLabels[admin.role] || admin.role}
                    </span>
                </div>
                <div class="mod-report-body">
                    <div class="mod-report-info">
                        <div class="mod-info-item">
                            <span class="mod-info-label">User ID</span>
                            <span class="mod-info-value" style="font-family: monospace; font-size: 0.8rem;">${admin.user_id}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Aggiunto il</span>
                            <span class="mod-info-value">${this.formatDate(admin.created_at)}</span>
                        </div>
                        <div class="mod-info-item">
                            <span class="mod-info-label">Permessi</span>
                            <span class="mod-info-value">
                                ${admin.permissions?.can_ban ? '<i class="fas fa-ban" title="Può bannare" style="color: #dc2626; margin-right: 4px;"></i>' : ''}
                                ${admin.permissions?.can_delete_content ? '<i class="fas fa-trash" title="Può eliminare contenuti" style="color: #f59e0b; margin-right: 4px;"></i>' : ''}
                                ${admin.permissions?.can_manage_gdpr ? '<i class="fas fa-user-shield" title="Gestione GDPR" style="color: #3b82f6; margin-right: 4px;"></i>' : ''}
                                ${admin.permissions?.can_manage_admins ? '<i class="fas fa-users-cog" title="Gestione Admin" style="color: #8b5cf6; margin-right: 4px;"></i>' : ''}
                            </span>
                        </div>
                    </div>
                    ${!isCurrentUser ? `
                        <div class="mod-report-actions">
                            <select class="mod-select" id="roleSelect-${admin.id}" style="margin-right: 0.5rem;">
                                <option value="moderator" ${admin.role === 'moderator' ? 'selected' : ''}>Moderatore</option>
                                <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Amministratore</option>
                                <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                            </select>
                            <button class="mod-btn mod-btn-primary" onclick="moderationCenter.updateAdminRole('${admin.id}')">
                                <i class="fas fa-save"></i> Salva
                            </button>
                            <button class="mod-btn mod-btn-danger" onclick="moderationCenter.removeAdmin('${admin.id}')">
                                <i class="fas fa-trash"></i> Rimuovi
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async addAdmin() {
        const emailInput = document.getElementById('newAdminEmail');
        const roleSelect = document.getElementById('newAdminRole');
        
        const email = emailInput?.value?.trim();
        const role = roleSelect?.value;

        if (!email) {
            this.showNotification('Inserisci un\'email valida', 'warning');
            return;
        }

        try {
            // Find user by email
            const { data: users, error: userError } = await this.supabase
                .from('auth.users')
                .select('id')
                .eq('email', email)
                .single();

            // If direct query doesn't work, try via user_profiles or private_users
            let userId = users?.id;
            
            if (!userId) {
                // Try to find in auth.users via RPC or alternative method
                const { data: authUser } = await this.supabase.rpc('get_user_id_by_email', { user_email: email });
                userId = authUser;
            }

            if (!userId) {
                this.showNotification('Utente non trovato con questa email', 'error');
                return;
            }

            // Add admin
            const { error } = await this.supabase
                .from('admin_users')
                .insert({
                    user_id: userId,
                    role: role,
                    created_by: this.currentUser.id,
                    permissions: this.getDefaultPermissions(role)
                });

            if (error) {
                if (error.code === '23505') {
                    this.showNotification('Questo utente è già un amministratore', 'warning');
                } else {
                    throw error;
                }
                return;
            }

            this.showNotification('Amministratore aggiunto con successo', 'success');
            emailInput.value = '';
            this.loadAdmins();

        } catch (error) {
            console.error('Error adding admin:', error);
            this.showNotification('Errore nell\'aggiunta dell\'amministratore', 'error');
        }
    }

    getDefaultPermissions(role) {
        const permissions = {
            super_admin: {
                can_view_reports: true,
                can_moderate: true,
                can_ban: true,
                can_manage_admins: true,
                can_delete_content: true,
                can_manage_gdpr: true
            },
            admin: {
                can_view_reports: true,
                can_moderate: true,
                can_ban: true,
                can_manage_admins: false,
                can_delete_content: true,
                can_manage_gdpr: true
            },
            moderator: {
                can_view_reports: true,
                can_moderate: true,
                can_ban: false,
                can_manage_admins: false,
                can_delete_content: true,
                can_manage_gdpr: false
            }
        };
        return permissions[role] || permissions.moderator;
    }

    async updateAdminRole(adminId) {
        const roleSelect = document.getElementById(`roleSelect-${adminId}`);
        const newRole = roleSelect?.value;

        if (!newRole) return;

        try {
            const { error } = await this.supabase
                .from('admin_users')
                .update({ 
                    role: newRole,
                    permissions: this.getDefaultPermissions(newRole),
                    updated_at: new Date().toISOString()
                })
                .eq('id', adminId);

            if (error) throw error;

            this.showNotification('Ruolo aggiornato', 'success');
            this.loadAdmins();

        } catch (error) {
            console.error('Error updating admin:', error);
            this.showNotification('Errore nell\'aggiornamento', 'error');
        }
    }

    async removeAdmin(adminId) {
        if (!confirm('Sei sicuro di voler rimuovere questo amministratore?')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('admin_users')
                .delete()
                .eq('id', adminId);

            if (error) throw error;

            this.showNotification('Amministratore rimosso', 'success');
            this.loadAdmins();

        } catch (error) {
            console.error('Error removing admin:', error);
            this.showNotification('Errore nella rimozione', 'error');
        }
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize
const moderationCenter = new ModerationCenter();

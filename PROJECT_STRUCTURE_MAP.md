# EduNet19 - Complete Project Structure Map

**Generated:** 2025-01-12  
**Project Type:** Italian Educational Social Platform  
**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Supabase Backend

---

## 📊 Project Overview

### Statistics
- **Total JavaScript Files:** 50+
- **Total HTML Pages:** 15+
- **Total CSS Files:** 30+
- **Database Tables:** 20+
- **Entry Points:** 2 (index.html, homepage.html)
- **Main Modules:** 8 core systems

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (HTML Pages + CSS Styling + UI Components)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  (JavaScript Modules + Business Logic)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  (Supabase Client + Auth + Database)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                             │
│  (Supabase PostgreSQL + Storage + Edge Functions)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Complete File Structure

### Root Configuration Files
```
config.js                          # Supabase configuration (URL, anonKey)
supabase-client.js                 # Centralized Supabase client manager
script.js                          # Main landing page application logic
styles.css                         # Global styles
favicon.svg / favicon.ico          # Branding
```

### 🔐 Authentication System (`js/auth/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `auth.js` | Main EduNetAuth class, session management | supabase-client.js, error-handling.js | `window.eduNetAuth` |
| `validation.js` | Form field validation rules | - | `window.eduNetValidation` |
| `age-verification.js` | Age verification logic, parental consent | codice-fiscale-validator.js | - |
| `cf-form-validation.js` | Codice Fiscale form validation | codice-fiscale-validator.js | - |
| `codice-fiscale-validator.js` | Codice Fiscale parsing & age extraction | - | `window.codiceFiscaleValidator` |
| `registration-miur.js` | MIUR institute registration flow | miur-autocomplete.js, auth.js | - |
| `password-reset.js` | Password reset functionality | auth.js | `window.eduNetPasswordReset` |
| `2fa-totp.js` | TOTP token generation/verification | - | - |

**Auth Flow:**
```
User Input → validation.js → age-verification.js → 
codice-fiscale-validator.js → registration-miur.js → 
auth.js → supabase-client.js → Supabase Backend
```

### 👤 Profile Management (`js/profile/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `profile-management.js` | Core profile CRUD operations | supabase-client.js, auth.js | `window.eduNetProfileManager` |
| `profile-page.js` | Profile display page logic | profile-management.js, review-manager.js | - |
| `edit-profile.js` | Profile editing interface | profile-management.js, miur-update.js, collaborators.js | - |
| `profile-gallery.js` | Photo gallery management | profile-management.js | `window.profileGallery` |
| `avatar-manager.js` | Avatar upload/display | profile-management.js | - |
| `miur-update.js` | MIUR data update for institutes | miur-validator.js, profile-management.js | - |
| `collaborators.js` | Multi-admin system, invite management | profile-management.js, auth.js | `window.CollaboratorsManager`, `window.AcceptInviteHandler` |
| `review-manager.js` | Institute reviews/ratings | profile-management.js, auth.js | `window.eduNetReviewManager` |
| `settings-page.js` | User settings and preferences | profile-management.js | - |

**Profile Dependencies:**
```
profile-page.js
├── profile-management.js
├── review-manager.js
├── avatar-manager.js
└── profile-gallery.js
```

### 🤝 Social Features (`js/social/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `social-features.js` | Posts, comments, interactions | profile-management.js, auth.js | `window.eduNetSocial` |
| `connections.js` | Follow/unfollow system | auth.js, profile-management.js | - |
| `saved-posts.js` | Bookmark/save functionality | social-features.js | - |
| `review-moderation.js` | Review moderation panel | profile-management.js, review-manager.js | - |

### 🎓 Recommendations (`js/recommendations/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `edumatch.js` | EduMatch card swipe interface | edumatch-ai-algorithm.js | `window.eduMatch` |
| `edumatch-ai-algorithm.js` | AI recommendation algorithm | - | `window.eduMatchAI` |
| `edumatch-collapse.js` | EduMatch section collapse logic | edumatch.js | - |
| `edumatch-visibility-guard.js` | Visibility controls for EduMatch | - | - |
| `recommendation-engine.js` | Core recommendation logic | auth.js, profile-management.js | `window.recommendationEngine` |
| `recommendation-integration.js` | UI integration for recommendations | recommendation-engine.js, homepage-script.js | `window.recommendationUI`, `window.discoverManager` |

**Recommendation Flow:**
```
User Profile → recommendation-engine.js → edumatch-ai-algorithm.js →
edumatch.js (UI) → recommendation-integration.js (Display)
```

### 🛡️ Moderation (`js/moderation/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `content-report.js` | Report content functionality | social-features.js, auth.js | - |
| `user-notifications.js` | Notification system | auth.js, profile-management.js | - |

### 🔧 Utilities (`js/utils/`)

| File | Purpose | Dependencies | Global Export |
|------|---------|--------------|----------------|
| `error-handling.js` | Global error handler | - | `window.eduNetErrorHandler` |
| `supabase-error-handler.js` | Supabase-specific error handling | supabase-client.js | `window.supabaseErrorHandler` |
| `console-optimizer.js` | Console logging optimization | - | `window.consoleOptimizer` |
| `codice-fiscale-validator.js` | CF parsing & validation | - | `window.codiceFiscaleValidator` |
| `miur-validator.js` | MIUR code validation | - | `window.miurValidator` |
| `miur-autocomplete.js` | MIUR institute autocomplete | - | `window.miurAutocomplete` |
| `institute-autocomplete.js` | Institute search autocomplete | - | - |
| `institute-contact.js` | Institute contact management | - | - |
| `global-search.js` | Global search functionality | social-features.js, profile-management.js | - |
| `mobile-search.js` | Mobile search interface | global-search.js | - |
| `modern-filters.js` | Advanced filtering system | - | `window.modernFilters` |
| `homepage-script.js` | Homepage main logic | social-features.js, recommendation-engine.js | `window.homepage` |
| `homepage-recommendation-init.js` | Homepage recommendation init | recommendation-integration.js | - |
| `create-page.js` | Content creation page | profile-management.js, social-features.js | `window.createPage` |
| `avatar-loader-fix.js` | Avatar loading optimization | avatar-manager.js | - |
| `preference-loader.js` | User preferences (theme, etc.) | - | - |

### 📄 HTML Pages

#### Root Pages
```
index.html                         # Landing page (auth modals)
homepage.html                      # Main app homepage (authenticated)
```

#### Authentication Pages (`pages/auth/`)
```
reset-password.html               # Password reset page
verify-institute.html             # Institute verification
```

#### Profile Pages (`pages/profile/`)
```
profile.html                      # User profile view
edit-profile.html                 # Profile editing
settings.html                     # User settings
connections.html                  # Connections/followers
accept-invite.html                # Admin invite acceptance
```

#### Admin Pages (`pages/admin/`)
```
moderation.html                   # Moderation center
manage-admins.html                # Admin management
accept-invite.html                # Admin invite acceptance
```

#### Content Creation (`pages/main/`)
```
create.html                       # Create post/project

```

#### Legal Pages (`pages/legal/`)
```
privacy-policy.html               # Privacy policy
terms-of-service.html             # Terms of service
cookie-policy.html                # Cookie policy
parental-consent.html             # Parental consent form
```

### 🎨 CSS Files

#### Component Styles (`css/components/`)
```
homepage-styles.css               # Homepage layout
profile-page.css                  # Profile page styling
edit-profile.css                  # Edit profile styling
dark-theme-fixes.css              # Dark theme adjustments
landing-dark-theme.css            # Landing page dark theme
auth-modal-dark-theme.css         # Auth modal dark theme
edumatch-styles.css               # EduMatch card styling
edumatch-collapse.css             # EduMatch collapse animation
create-post-modal.css             # Create post modal
create-page.css                   # Create page styling
mobile-menu-fix.css               # Mobile menu styling
mobile-search.css                 # Mobile search styling
modern-filters.css                # Filter UI styling
miur-preview.css                  # MIUR data preview
institute-autocomplete.css        # Autocomplete styling
institute-contact.css             # Contact form styling
institute-reviews.css             # Reviews display
collaborators.css                 # Collaborators UI
connections.css                   # Connections page
profile-gallery.css               # Gallery styling
recommendation-ui.css             # Recommendation UI
review-moderation.css             # Moderation panel
saved-posts-styles.css            # Saved posts styling
sessions-modal.css                # Sessions modal
settings-page.css                 # Settings page
upload-progress.css               # Upload progress bar
2fa-modal.css                     # 2FA modal
accept-invite.css                 # Invite acceptance
image-carousel.css                # Image carousel
fix-comment-background.css        # Comment styling fix
manage-admins.css                 # Admin management
```

#### Admin Styles (`css/admin/`)
```
moderation.css                    # Moderation center styling
```

### 🗄️ Database Files

#### Setup Scripts (`database/setup/`)
```
database-schema.sql               # Core tables
social-features-schema.sql        # Social tables
edumatch-database-schema.sql      # Recommendation tables
multi-admin-system-setup.sql      # Admin system
reviews-approval.sql              # Review system
session-security.sql              # Session management
user-management-functions.sql     # User functions
storage-usage-function.sql        # Storage tracking
setup-statistics-tables.sql       # Statistics
institute-collaborators.sql       # Collaborators
recommendation-system-FINAL.sql   # Recommendations
database-privacy-schema.sql       # Privacy settings
add-preferences-column.sql        # User preferences
```

#### Production Scripts (`database/production/`)
```
01_CORE_TABLES_PRODUCTION.sql
02_SOCIAL_FEATURES_PRODUCTION.sql
03_FUNCTIONS_TRIGGERS_PRODUCTION.sql
04_STORAGE_BUCKETS_PRODUCTION.sql
05_RLS_POLICIES_PRODUCTION.sql
06_EDUMATCH_TABLES_PRODUCTION.sql
07_PRIVACY_AUDIT_PRODUCTION.sql
08_TABELLE_MANCANTI_PRODUCTION.sql
```

#### Fixes (`database/fixes/`)
```
add-missing-columns-school-institutes.sql
add-miur-fields.sql
align-privacy-settings.sql
fix-cover-image-rls.sql
fix-institute-validation.sql
fix-private-user-type.sql
fix-private-users-data.sql
fix-private-users-names.sql
fix-reviews-display-name-error.sql
fix-reviews-foreign-key.sql
fix-reviews-institute-fk.sql
restrict-private-users-permissions.sql
security-audit-fixes.sql
```

#### Queries (`database/queries/`)
```
lista-tutti-account.sql           # List all accounts
elimina-account-test.sql          # Delete test account
elimina-account-semplice.sql      # Simple account deletion
```

#### Archive (`database/archive/`)
```
50+ historical migration files
```

### 📊 School Database (`db scuole/`)
```
scuole-statali.json               # Public schools
scuole-statali-province-autonome.json  # Autonomous province schools
scuole-paritarie.json             # Private schools
scuole-paritarie-province-autonome.json # Autonomous private schools
```

---

## 🔄 Module Dependencies Map

### Initialization Order (Critical)

```
1. config.js                      # Load Supabase config
2. console-optimizer.js           # Setup console
3. error-handling.js              # Global error handler
4. supabase-error-handler.js      # Supabase errors
5. supabase-client.js             # Initialize Supabase client
6. validation.js                  # Form validation rules
7. codice-fiscale-validator.js    # CF validation
8. age-verification.js            # Age verification
9. miur-validator.js              # MIUR validation
10. miur-autocomplete.js          # MIUR autocomplete
11. auth.js                       # Authentication system
12. profile-management.js         # Profile operations
13. social-features.js            # Social features
14. recommendation-engine.js      # Recommendations
15. homepage-script.js            # Homepage logic
```

### Dependency Graph

```
CORE LAYER
├── config.js
├── supabase-client.js
└── error-handling.js

VALIDATION LAYER
├── validation.js
├── codice-fiscale-validator.js
├── miur-validator.js
└── age-verification.js

AUTH LAYER
├── auth.js
│   ├── supabase-client.js
│   ├── error-handling.js
│   └── profile-management.js
├── registration-miur.js
│   ├── miur-autocomplete.js
│   └── auth.js
└── password-reset.js
    └── auth.js

PROFILE LAYER
├── profile-management.js
│   ├── supabase-client.js
│   └── auth.js
├── profile-page.js
│   ├── profile-management.js
│   ├── review-manager.js
│   └── avatar-manager.js
├── edit-profile.js
│   ├── profile-management.js
│   ├── miur-update.js
│   └── collaborators.js
├── collaborators.js
│   ├── profile-management.js
│   └── auth.js
└── review-manager.js
    ├── profile-management.js
    └── auth.js

SOCIAL LAYER
├── social-features.js
│   ├── profile-management.js
│   └── auth.js
├── connections.js
│   ├── auth.js
│   └── profile-management.js
├── saved-posts.js
│   └── social-features.js
└── review-moderation.js
    ├── profile-management.js
    └── review-manager.js

RECOMMENDATION LAYER
├── recommendation-engine.js
│   ├── auth.js
│   └── profile-management.js
├── edumatch-ai-algorithm.js
├── edumatch.js
│   └── edumatch-ai-algorithm.js
└── recommendation-integration.js
    ├── recommendation-engine.js
    └── homepage-script.js

UTILITY LAYER
├── global-search.js
│   ├── social-features.js
│   └── profile-management.js
├── mobile-search.js
│   └── global-search.js
├── modern-filters.js
├── create-page.js
│   ├── profile-management.js
│   └── social-features.js
└── homepage-script.js
    ├── social-features.js
    ├── recommendation-engine.js
    └── profile-management.js
```

---

## 🌐 Page-to-Module Mapping

### Landing Page (index.html)
**Purpose:** Authentication and registration  
**Scripts Loaded:**
```
1. console-optimizer.js
2. config.js
3. error-handling.js
4. supabase-error-handler.js
5. supabase-client.js
6. validation.js
7. age-verification.js
8. codice-fiscale-validator.js
9. cf-form-validation.js
10. miur-autocomplete.js
11. registration-miur.js
12. auth.js
13. password-reset.js
14. profile-management.js
15. institute-autocomplete.js
16. script.js (main app logic)
```

**Key Classes Initialized:**
- `EduNetApp` (script.js)
- `EduNetAuth` (auth.js)
- `EduNetValidation` (validation.js)
- `EduNetErrorHandler` (error-handling.js)

---

### Homepage (homepage.html)
**Purpose:** Main authenticated application  
**Scripts Loaded:**
```
1. preference-loader.js (HEAD - prevents FOUC)
2. config.js
3. console-optimizer.js
4. error-handling.js
5. supabase-error-handler.js
6. supabase-client.js
7. auth.js
8. profile-management.js
9. social-features.js
10. content-report.js
11. user-notifications.js
12. edumatch-ai-algorithm.js
13. edumatch.js
14. edumatch-collapse.js
15. edumatch-visibility-guard.js
16. modern-filters.js
17. mobile-search.js
18. saved-posts.js
19. avatar-manager.js
20. avatar-loader-fix.js
21. miur-validator.js
22. recommendation-engine.js
23. recommendation-integration.js
24. homepage-script.js
25. homepage-recommendation-init.js
```

**Key Classes Initialized:**
- `EduNetHomepage` (homepage-script.js)
- `EduNetSocialFeatures` (social-features.js)
- `RecommendationEngine` (recommendation-engine.js)
- `RecommendationUI` (recommendation-integration.js)
- `EduMatch` (edumatch.js)

---

### Profile Page (pages/profile/profile.html)
**Scripts Loaded:**
```
1. console-optimizer.js
2. supabase-client.js
3. mobile-search.js
4. avatar-manager.js
5. avatar-loader-fix.js
6. review-moderation.js
7. institute-contact.js
8. miur-validator.js
9. global-search.js
10. profile-page.js
11. profile-gallery.js
12. review-manager.js
```

---

### Edit Profile (pages/profile/edit-profile.html)
**Scripts Loaded:**
```
1. console-optimizer.js
2. supabase-client.js
3. mobile-search.js
4. avatar-manager.js
5. avatar-loader-fix.js
6. miur-autocomplete.js
7. miur-validator.js
8. global-search.js
9. miur-update.js
10. collaborators.js
11. edit-profile.js
```

---

### Settings Page (pages/profile/settings.html)
**Scripts Loaded:**
```
1. console-optimizer.js
2. mobile-search.js
3. avatar-manager.js
4. avatar-loader-fix.js
5. 2fa-totp.js
6. miur-validator.js
7. global-search.js
8. settings-page.js
```

---

### Connections Page (pages/profile/connections.html)
**Scripts Loaded:**
```
1. config.js
2. supabase-client.js
3. auth.js
4. avatar-manager.js
5. connections.js
```

---

### Moderation Center (pages/admin/moderation.html)
**Purpose:** Content moderation and admin functions  
**Key Module:** `moderation-center.js`

---

## 🔌 Global Window Objects

### Authentication
- `window.eduNetAuth` - Main auth class
- `window.eduNetValidation` - Form validation
- `window.codiceFiscaleValidator` - CF validation
- `window.eduNetPasswordReset` - Password reset

### Profile & Social
- `window.eduNetProfileManager` - Profile operations
- `window.eduNetSocial` - Social features
- `window.eduNetReviewManager` - Reviews
- `window.profileGallery` - Photo gallery
- `window.CollaboratorsManager` - Collaborators
- `window.AcceptInviteHandler` - Invite handling

### Recommendations
- `window.recommendationEngine` - Core engine
- `window.recommendationUI` - UI integration
- `window.discoverManager` - Discover section
- `window.eduMatch` - EduMatch cards
- `window.eduMatchAI` - AI algorithm

### Utilities
- `window.eduNetErrorHandler` - Error handling
- `window.supabaseErrorHandler` - Supabase errors
- `window.consoleOptimizer` - Console logging
- `window.miurValidator` - MIUR validation
- `window.miurAutocomplete` - MIUR autocomplete
- `window.modernFilters` - Advanced filters
- `window.homepage` - Homepage instance
- `window.supabaseClientManager` - Supabase client

### Configuration
- `window.SUPABASE_CONFIG` - Supabase config
- `window.SUPABASE_URL` - Supabase URL
- `window.SUPABASE_ANON_KEY` - Anon key

---

## 📊 Database Schema Overview

### Core Tables
- `user_profiles` - Base user data
- `school_institutes` - Institute data
- `private_users` - Private user data
- `user_privacy_settings` - Privacy controls

### Social Tables
- `institute_posts` - Posts
- `post_comments` - Comments
- `user_connections` - Follows
- `institute_reviews` - Reviews/ratings

### Admin Tables
- `institute_admins` - Admin assignments
- `admin_invites` - Admin invitations

### Recommendation Tables
- `user_preferences` - User preferences
- `recommendation_scores` - Recommendation data
- `edumatch_interactions` - EduMatch data

### Storage Buckets
- `avatars` - User avatars
- `covers` - Cover images
- `post-images` - Post images
- `gallery` - Profile gallery

---

## 🔐 Security Architecture

### Authentication Flow
```
User Registration/Login
    ↓
validation.js (client-side validation)
    ↓
age-verification.js (age check)
    ↓
auth.js (Supabase auth)
    ↓
Supabase Auth Service
    ↓
JWT Token + Session
```

### Authorization
- RLS (Row Level Security) policies on all tables
- User type-based access control (istituto vs privato)
- Admin role verification
- Privacy settings enforcement

### Data Protection
- Codice Fiscale validation for age verification
- Parental consent for minors (14-16)
- Private profile defaults for minors
- GDPR-compliant data handling

---

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] All modules initialized in correct order
- [ ] Supabase configuration verified
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Error handling tested
- [ ] Dark theme verified
- [ ] Mobile responsiveness checked
- [ ] Performance optimized
- [ ] Security audit completed

### Post-Launch
- [ ] Monitor error logs
- [ ] Track user registrations
- [ ] Verify email notifications
- [ ] Check recommendation engine
- [ ] Monitor database performance
- [ ] Review user feedback

---

## 📝 Key Conventions

### Naming
- Classes: PascalCase (e.g., `EduNetAuth`)
- Functions: camelCase (e.g., `loadUserProfile`)
- Constants: UPPER_SNAKE_CASE (e.g., `SUPABASE_CONFIG`)
- Global exports: `window.moduleName`

### Logging
- ✅ Success: `console.log('✅ message')`
- ❌ Error: `console.error('❌ message')`
- ⚠️ Warning: `console.warn('⚠️ message')`
- 🔄 Loading: `console.log('🔄 message')`
- 📋 Info: `console.log('📋 message')`

### Error Handling
- All async operations wrapped in try-catch
- User-friendly error messages in Italian
- Errors logged to console and error handler
- Notifications shown for critical errors

### Database Queries
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (error) throw error;
```

---

## 🔗 Cross-Module Communication

### Event-Based
- Auth state changes trigger profile loading
- Profile updates trigger UI refresh
- Social actions trigger notifications
- Recommendations update on preference changes

### Direct References
- `auth.js` → `profile-management.js` (user data)
- `social-features.js` → `profile-management.js` (user info)
- `recommendation-engine.js` → `profile-management.js` (preferences)
- `homepage-script.js` → all modules (orchestration)

### Shared State
- User session (via `window.eduNetAuth.currentUser`)
- User profile (via `window.eduNetAuth.userProfile`)
- Supabase client (via `window.supabaseClientManager`)

---

## 📚 Documentation Files

### Project Guides
- `README.md` - Project overview
- `README_STRUTTURA_PROGETTO.md` - Project structure
- `🚀_LAUNCH_CHECKLIST.md` - Launch checklist
- `📋_DEPLOYMENT_GUIDE.md` - Deployment guide

### Feature Documentation
- `📚_SISTEMA_AUTOCOMPILAZIONE_MIUR.md` - MIUR auto-fill
- `docs/guide/` - Feature guides

### Fixes & Optimizations
- `docs/summaries/` - Fix summaries and outcomes
- `docs/archive/` - Historical fixes and session logs

### Database Documentation
- `docs/summaries/RESTRIZIONI_UTENTI_PRIVATI.md` - Private user restrictions
- `docs/summaries/VERIFICA_ETA_CODICE_FISCALE.md` - Age verification
- `docs/summaries/NUOVI_CAMPI_PROFILO_ISTITUTO.md` - New institute fields
- `docs/TASKS_LEGAL_COMPLIANCE.md` - Legal compliance

---

## 🎯 Active Development Areas

### Current Focus
1. **MIUR Integration** - Auto-fill institute data
2. **Recommendations** - EduMatch algorithm
3. **Social Features** - Posts, comments, reviews
4. **Admin System** - Multi-admin management
5. **Privacy** - GDPR compliance, age verification

### Recent Fixes
- Cover image RLS policies
- Private user permissions
- Institute validation
- Review system
- Profile fields alignment

---

## 📞 Support & Maintenance

### Common Issues
- **Auth not working:** Check `supabase-client.js` initialization
- **Profile not loading:** Verify RLS policies in database
- **Recommendations not showing:** Check `recommendation-engine.js`
- **Styling issues:** Check dark theme CSS files
- **Mobile issues:** Check `mobile-*.css` files

### Performance Optimization
- Lazy loading images with `avatar-loader-fix.js`
- Console optimization with `console-optimizer.js`
- Preference caching with `preference-loader.js`
- Debounced search with `global-search.js`

---

**Last Updated:** 2025-01-12  
**Maintained By:** EduNet19 Development Team  
**Status:** ✅ Active & Maintained

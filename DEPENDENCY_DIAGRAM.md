# EduNet19 - Module Dependency Diagram

## 🔗 Complete Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND                                   │
│  (PostgreSQL Database + Auth + Storage + Edge Functions)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↑
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  config.js ──→ supabase-client.js ──→ window.supabaseClientManager         │
│                                                                              │
│  Provides centralized Supabase client instance for all modules             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↑
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────┴────┐  ┌──────┴──────┐  ┌────┴────────┐
        │                │  │             │  │             │
        ↓                ↓  ↓             ↓  ↓             ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ERROR LAYER  │  │ VALIDATION   │  │ UTILITY      │  │ PREFERENCE   │
├──────────────┤  │ LAYER        │  │ LAYER        │  │ LAYER        │
│              │  ├──────────────┤  ├──────────────┤  ├──────────────┤
│ • error-     │  │              │  │              │  │              │
│   handling   │  │ • validation │  │ • console-   │  │ • preference-│
│ • supabase-  │  │ • age-       │  │   optimizer  │  │   loader    │
│   error-     │  │   verification│ │ • codice-    │  │              │
│   handler    │  │ • cf-form-   │  │   fiscale-   │  │ Prevents     │
│              │  │   validation │  │   validator  │  │ FOUC on      │
│ Global error │  │              │  │ • miur-      │  │ page load    │
│ handling &   │  │ Form field   │  │   validator  │  │              │
│ logging      │  │ validation   │  │ • miur-      │  │ Loads theme, │
│              │  │ & age checks │  │   autocomplete│ │ font size,   │
└──────────────┘  └──────────────┘  │              │  │ preferences  │
                                     │ Utilities    │  │              │
                                     │ for all      │  └──────────────┘
                                     │ modules      │
                                     └──────────────┘
                                            ↑
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ↓                       ↓                       ↓
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │  AUTH LAYER      │    │  PROFILE LAYER   │    │  SOCIAL LAYER    │
        ├──────────────────┤    ├──────────────────┤    ├──────────────────┤
        │                  │    │                  │    │                  │
        │ • auth.js        │    │ • profile-       │    │ • social-        │
        │   (EduNetAuth)   │    │   management.js  │    │   features.js    │
        │ • registration-  │    │ • profile-page   │    │ • connections.js │
        │   miur.js        │    │ • edit-profile   │    │ • saved-posts.js │
        │ • password-      │    │ • collaborators  │    │ • review-        │
        │   reset.js       │    │ • review-manager │    │   moderation.js  │
        │                  │    │ • avatar-manager │    │ • content-report │
        │ • 2fa-totp.js    │    │ • miur-update    │    │                  │
        │                  │    │ • settings-page  │    │ Social features: │
        │ Authentication & │    │ • profile-gallery│    │ • Posts          │
        │ registration     │    │                  │    │ • Comments       │
        │ flow             │    │ User profile     │    │ • Reviews        │
        │                  │    │ management &     │    │ • Connections    │
        └──────────────────┘    │ editing          │    │ • Saved posts    │
                 ↑               │                  │    │                  │
                 │               └──────────────────┘    └──────────────────┘
                 │                       ↑                       ↑
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ↓                    ↓                    ↓
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ RECOMMENDATION   │  │ MODERATION       │  │ UTILITY MODULES  │
        │ LAYER            │  │ LAYER            │  │                  │
        ├──────────────────┤  ├──────────────────┤  ├──────────────────┤
        │                  │  │                  │  │                  │
        │ • recommendation-│  │ • user-          │  │ • global-search  │
        │   engine.js      │  │   notifications  │  │ • mobile-search  │
        │ • edumatch-ai-   │  │ • moderation-    │  │ • modern-filters │
        │   algorithm.js   │  │   center.js      │  │ • create-page    │
        │ • edumatch.js    │  │                  │  │ • homepage-      │
        │ • edumatch-      │  │ Moderation &     │  │   script         │
        │   collapse.js    │  │ notification     │  │ • homepage-      │
        │ • edumatch-      │  │ management       │  │   recommendation-│
        │   visibility-    │  │                  │  │   init           │
        │   guard.js       │  │                  │  │ • avatar-loader- │
        │ • recommendation-│  │                  │  │   fix            │
        │   integration.js │  │                  │  │ • institute-     │
        │                  │  │                  │  │   autocomplete   │
        │ AI-powered       │  │                  │  │ • institute-     │
        │ recommendations  │  │                  │  │   contact        │
        │ & EduMatch       │  │                  │  │                  │
        │ cards            │  │                  │  │ Supporting       │
        │                  │  │                  │  │ utilities for    │
        └──────────────────┘  └──────────────────┘  │ all modules      │
                 ↑                                   │                  │
                 │                                   └──────────────────┘
                 │                                           ↑
                 └───────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ↓                               ↓
        ┌──────────────────────┐      ┌──────────────────────┐
        │  LANDING PAGE        │      │  HOMEPAGE            │
        │  (index.html)        │      │  (homepage.html)     │
        ├──────────────────────┤      ├──────────────────────┤
        │                      │      │                      │
        │ Entry point for:     │      │ Main app for:        │
        │ • Registration       │      │ • Feed               │
        │ • Login              │      │ • Recommendations    │
        │ • Password reset     │      │ • Social features    │
        │ • 2FA                │      │ • Profile            │
        │                      │      │ • Search             │
        │ Loads 16 scripts     │      │ • Moderation         │
        │ in order             │      │                      │
        │                      │      │ Loads 25 scripts     │
        │                      │      │ in order             │
        └──────────────────────┘      └──────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ↓                               ↓
        ┌──────────────────────┐      ┌──────────────────────┐
        │  PROFILE PAGES       │      │  ADMIN PAGES         │
        │                      │      │                      │
        │ • profile.html       │      │ • moderation.html    │
        │ • edit-profile.html  │      │ • manage-admins.html │
        │ • settings.html      │      │ • accept-invite.html │
        │ • connections.html   │      │                      │
        │ • accept-invite.html │      │ Admin-only pages     │
        │                      │      │ for content & user    │
        │ User profile pages   │      │ management           │
        │ with specific        │      │                      │
        │ module loading       │      │                      │
        └──────────────────────┘      └──────────────────────┘
```

---

## 📊 Detailed Module Dependencies

### Authentication System Dependencies

```
auth.js (EduNetAuth)
├── Depends on:
│   ├── supabase-client.js (Supabase client)
│   ├── error-handling.js (Error handling)
│   └── profile-management.js (Profile loading)
│
├── Used by:
│   ├── registration-miur.js
│   ├── password-reset.js
│   ├── profile-management.js
│   ├── social-features.js
│   ├── recommendation-engine.js
│   └── All authenticated pages
│
└── Exports:
    └── window.eduNetAuth
```

### Profile Management Dependencies

```
profile-management.js (EduNetProfileManager)
├── Depends on:
│   ├── supabase-client.js
│   ├── auth.js
│   └── error-handling.js
│
├── Used by:
│   ├── profile-page.js
│   ├── edit-profile.js
│   ├── avatar-manager.js
│   ├── collaborators.js
│   ├── review-manager.js
│   ├── social-features.js
│   ├── recommendation-engine.js
│   ├── create-page.js
│   └── homepage-script.js
│
└── Exports:
    └── window.eduNetProfileManager
```

### Social Features Dependencies

```
social-features.js (EduNetSocialFeatures)
├── Depends on:
│   ├── supabase-client.js
│   ├── auth.js
│   ├── profile-management.js
│   └── error-handling.js
│
├── Used by:
│   ├── connections.js
│   ├── saved-posts.js
│   ├── review-moderation.js
│   ├── content-report.js
│   ├── global-search.js
│   ├── homepage-script.js
│   └── create-page.js
│
└── Exports:
    └── window.eduNetSocial
```

### Recommendation System Dependencies

```
recommendation-engine.js (RecommendationEngine)
├── Depends on:
│   ├── supabase-client.js
│   ├── auth.js
│   ├── profile-management.js
│   └── error-handling.js
│
├── Used by:
│   ├── recommendation-integration.js
│   ├── edumatch.js
│   ├── homepage-script.js
│   └── homepage-recommendation-init.js
│
└── Exports:
    └── window.recommendationEngine

edumatch-ai-algorithm.js (EduMatchAI)
├── Depends on: (none - standalone)
│
├── Used by:
│   ├── edumatch.js
│   └── recommendation-engine.js
│
└── Exports:
    └── window.eduMatchAI

recommendation-integration.js (RecommendationUI + DiscoverManager)
├── Depends on:
│   ├── recommendation-engine.js
│   ├── homepage-script.js
│   └── profile-management.js
│
├── Used by:
│   ├── homepage-script.js
│   └── homepage-recommendation-init.js
│
└── Exports:
    ├── window.recommendationUI
    └── window.discoverManager
```

### Validation System Dependencies

```
validation.js (EduNetValidation)
├── Depends on: (none - standalone)
│
├── Used by:
│   ├── script.js (landing page)
│   ├── registration-miur.js
│   └── password-reset.js
│
└── Exports:
    └── window.eduNetValidation

codice-fiscale-validator.js (CodiceFiscaleValidator)
├── Depends on: (none - standalone)
│
├── Used by:
│   ├── age-verification.js
│   ├── cf-form-validation.js
│   └── registration-miur.js
│
└── Exports:
    └── window.codiceFiscaleValidator

miur-validator.js (MIURValidator)
├── Depends on: (none - standalone)
│
├── Used by:
│   ├── registration-miur.js
│   ├── miur-update.js
│   └── edit-profile.js
│
└── Exports:
    └── window.miurValidator

miur-autocomplete.js (MIURAutocomplete)
├── Depends on: (none - standalone)
│
├── Used by:
│   ├── registration-miur.js
│   ├── miur-update.js
│   └── edit-profile.js
│
└── Exports:
    └── window.miurAutocomplete
```

### Utility Dependencies

```
global-search.js (GlobalSearch)
├── Depends on:
│   ├── supabase-client.js
│   ├── social-features.js
│   └── profile-management.js
│
├── Used by:
│   ├── mobile-search.js
│   └── All pages with search
│
└── Exports:
    └── window.globalSearch

mobile-search.js (MobileSearch)
├── Depends on:
│   ├── global-search.js
│   └── error-handling.js
│
├── Used by:
│   └── All pages
│
└── Exports:
    └── (Initializes on load)

modern-filters.js (ModernFilters)
├── Depends on: (none - standalone)
│
├── Used by:
│   └── homepage.html
│
└── Exports:
    └── window.modernFilters

create-page.js (CreatePage)
├── Depends on:
│   ├── supabase-client.js
│   ├── profile-management.js
│   ├── social-features.js
│   └── error-handling.js
│
├── Used by:
│   └── pages/main/create.html
│
└── Exports:
    └── window.createPage

homepage-script.js (EduNetHomepage)
├── Depends on:
│   ├── supabase-client.js
│   ├── auth.js
│   ├── profile-management.js
│   ├── social-features.js
│   ├── recommendation-engine.js
│   ├── global-search.js
│   └── error-handling.js
│
├── Used by:
│   ├── homepage.html
│   ├── recommendation-integration.js
│   └── homepage-recommendation-init.js
│
└── Exports:
    └── window.homepage
```

---

## 🔄 Data Flow Diagrams

### User Registration Flow

```
User Input (Landing Page)
    ↓
validation.js (Form validation)
    ↓
age-verification.js (Age check via CF)
    ↓
codice-fiscale-validator.js (Parse CF)
    ↓
registration-miur.js (MIUR lookup if institute)
    ↓
miur-autocomplete.js (Get institute data)
    ↓
auth.js (Create Supabase auth)
    ↓
profile-management.js (Create profile record)
    ↓
Supabase Backend
    ├── auth.users table
    ├── user_profiles table
    ├── school_institutes or private_users table
    └── user_privacy_settings table
    ↓
Success → Redirect to homepage.html
```

### User Login Flow

```
User Input (Landing Page)
    ↓
validation.js (Email/password validation)
    ↓
auth.js (Supabase auth.signIn)
    ↓
Supabase Auth Service
    ↓
Session Created + JWT Token
    ↓
auth.js (Load user profile)
    ↓
profile-management.js (Fetch profile data)
    ↓
Supabase Backend (Query user_profiles)
    ↓
auth.js (Sync preferences)
    ↓
preference-loader.js (Apply theme/settings)
    ↓
Success → Redirect to homepage.html
```

### Homepage Feed Load Flow

```
homepage.html loads
    ↓
preference-loader.js (Apply saved preferences)
    ↓
All scripts load in order
    ↓
auth.js (Check session)
    ↓
profile-management.js (Load user profile)
    ↓
social-features.js (Initialize)
    ↓
recommendation-engine.js (Calculate recommendations)
    ↓
homepage-script.js (Initialize homepage)
    ↓
homepage-recommendation-init.js (Load recommendations)
    ↓
recommendation-integration.js (Display recommendations)
    ↓
edumatch.js (Initialize EduMatch cards)
    ↓
modern-filters.js (Initialize filters)
    ↓
global-search.js (Initialize search)
    ↓
Homepage fully loaded and interactive
```

### Profile Edit Flow

```
User navigates to edit-profile.html
    ↓
All scripts load
    ↓
auth.js (Verify session)
    ↓
profile-management.js (Load current profile)
    ↓
avatar-manager.js (Load avatar)
    ↓
miur-autocomplete.js (Load MIUR data if institute)
    ↓
collaborators.js (Load collaborators if institute)
    ↓
edit-profile.js (Initialize form)
    ↓
User edits profile
    ↓
miur-update.js (Update MIUR data if changed)
    ↓
profile-management.js (Save profile changes)
    ↓
avatar-manager.js (Upload new avatar if changed)
    ↓
Supabase Backend (Update tables)
    ↓
Success notification
```

---

## 🎯 Critical Initialization Sequence

### Landing Page (index.html)

```
1. console-optimizer.js
   └─ Optimizes console output

2. config.js
   └─ Loads Supabase configuration

3. error-handling.js
   └─ Initializes global error handler
   └─ window.eduNetErrorHandler

4. supabase-error-handler.js
   └─ Initializes Supabase error handler
   └─ window.supabaseErrorHandler

5. supabase-client.js
   └─ Creates centralized Supabase client
   └─ window.supabaseClientManager

6. validation.js
   └─ Loads validation rules
   └─ window.eduNetValidation

7. age-verification.js
   └─ Loads age verification logic

8. codice-fiscale-validator.js
   └─ Initializes CF validator
   └─ window.codiceFiscaleValidator

9. cf-form-validation.js
   └─ Loads CF form validation

10. miur-autocomplete.js
    └─ Initializes MIUR autocomplete
    └─ window.miurAutocomplete

11. registration-miur.js
    └─ Loads MIUR registration logic

12. auth.js
    └─ Initializes authentication
    └─ window.eduNetAuth
    └─ Checks for existing session

13. password-reset.js
    └─ Loads password reset logic
    └─ window.eduNetPasswordReset

14. profile-management.js
    └─ Initializes profile manager
    └─ window.eduNetProfileManager

15. institute-autocomplete.js
    └─ Loads institute autocomplete

16. script.js
    └─ Initializes main app
    └─ window.eduNetApp
    └─ Sets up modals and forms
```

### Homepage (homepage.html)

```
1. preference-loader.js (in HEAD)
   └─ Prevents FOUC
   └─ Applies saved theme/settings

2. config.js
   └─ Loads Supabase configuration

3. console-optimizer.js
   └─ Optimizes console output

4. error-handling.js
   └─ Initializes global error handler

5. supabase-error-handler.js
   └─ Initializes Supabase error handler

6. supabase-client.js
   └─ Creates centralized Supabase client

7. auth.js
   └─ Initializes authentication
   └─ Verifies session
   └─ Loads user profile

8. profile-management.js
   └─ Initializes profile manager

9. social-features.js
   └─ Initializes social features
   └─ window.eduNetSocial

10. content-report.js
    └─ Loads content reporting

11. user-notifications.js
    └─ Initializes notifications

12. edumatch-ai-algorithm.js
    └─ Initializes AI algorithm
    └─ window.eduMatchAI

13. edumatch.js
    └─ Initializes EduMatch cards
    └─ window.eduMatch

14. edumatch-collapse.js
    └─ Initializes collapse logic

15. edumatch-visibility-guard.js
    └─ Initializes visibility controls

16. modern-filters.js
    └─ Initializes filters
    └─ window.modernFilters

17. mobile-search.js
    └─ Initializes mobile search

18. saved-posts.js
    └─ Initializes saved posts

19. avatar-manager.js
    └─ Initializes avatar manager

20. avatar-loader-fix.js
    └─ Optimizes avatar loading

21. miur-validator.js
    └─ Initializes MIUR validator
    └─ window.miurValidator

22. recommendation-engine.js
    └─ Initializes recommendation engine
    └─ window.recommendationEngine

23. recommendation-integration.js
    └─ Initializes recommendation UI
    └─ window.recommendationUI
    └─ window.discoverManager

24. homepage-script.js
    └─ Initializes homepage
    └─ window.homepage
    └─ Orchestrates all modules

25. homepage-recommendation-init.js
    └─ Initializes recommendations display
```

---

## 🔐 Security Dependencies

```
Security Layer
├── Supabase Auth
│   ├── JWT tokens
│   ├── Session management
│   └── Password hashing
│
├── RLS Policies
│   ├── user_profiles
│   ├── school_institutes
│   ├── private_users
│   ├── institute_posts
│   ├── post_comments
│   └── user_connections
│
├── Client-side Validation
│   ├── validation.js
│   ├── age-verification.js
│   ├── codice-fiscale-validator.js
│   ├── miur-validator.js
│   └── cf-form-validation.js
│
└── Error Handling
    ├── error-handling.js
    └── supabase-error-handler.js
```

---

## 📈 Performance Optimization Dependencies

```
Performance Layer
├── Lazy Loading
│   ├── avatar-loader-fix.js
│   └── Intersection Observer
│
├── Caching
│   ├── preference-loader.js
│   ├── localStorage
│   └── sessionStorage
│
├── Optimization
│   ├── console-optimizer.js
│   ├── Debouncing (global-search.js)
│   └── Throttling (homepage-script.js)
│
└── Compression
    ├── Image compression (create-page.js)
    └── Browser-image-compression library
```

---

## 🎨 Styling Dependencies

```
CSS Layer
├── Global Styles
│   └── styles.css
│
├── Component Styles
│   ├── homepage-styles.css
│   ├── profile-page.css
│   ├── edit-profile.css
│   ├── create-post-modal.css
│   ├── create-page.css
│   ├── edumatch-styles.css
│   ├── edumatch-collapse.css
│   ├── recommendation-ui.css
│   └── ... (25+ more)
│
├── Theme Styles
│   ├── dark-theme-fixes.css
│   ├── landing-dark-theme.css
│   ├── auth-modal-dark-theme.css
│   └── Applied via preference-loader.js
│
├── Mobile Styles
│   ├── mobile-menu-fix.css
│   ├── mobile-search.css
│   └── Responsive design
│
└── Admin Styles
    └── css/admin/moderation.css
```

---

## 📊 Database Dependencies

```
Database Layer
├── Core Tables
│   ├── user_profiles
│   ├── school_institutes
│   ├── private_users
│   └── user_privacy_settings
│
├── Social Tables
│   ├── institute_posts
│   ├── post_comments
│   ├── user_connections
│   └── institute_reviews
│
├── Admin Tables
│   ├── institute_admins
│   └── admin_invites
│
├── Recommendation Tables
│   ├── user_preferences
│   ├── recommendation_scores
│   └── edumatch_interactions
│
├── Storage Buckets
│   ├── avatars
│   ├── covers
│   ├── post-images
│   └── gallery
│
└── Functions & Triggers
    ├── User management functions
    ├── Privacy functions
    ├── Recommendation functions
    └── Notification triggers
```

---

**Last Updated:** 2025-01-12  
**Diagram Version:** 1.0  
**Status:** ✅ Complete

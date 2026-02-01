# EduNet19 - Quick Reference Guide

## 🚀 Quick Start

### Finding Files
- **Authentication:** `js/auth/auth.js`
- **Profiles:** `js/profile/profile-management.js`
- **Social:** `js/social/social-features.js`
- **Recommendations:** `js/recommendations/recommendation-engine.js`
- **Homepage:** `js/utils/homepage-script.js`

### Key Global Objects
```javascript
window.eduNetAuth                    // Authentication
window.eduNetProfileManager          // Profile management
window.eduNetSocial                  // Social features
window.recommendationEngine          // Recommendations
window.homepage                      // Homepage instance
window.supabaseClientManager         // Supabase client
window.eduNetErrorHandler            // Error handling
```

### Common Tasks

#### Get Current User
```javascript
const user = window.eduNetAuth.currentUser;
const profile = window.eduNetAuth.userProfile;
```

#### Get Supabase Client
```javascript
const supabase = await window.supabaseClientManager.getClient();
```

#### Query Database
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId)
  .maybeSingle();
```

#### Show Notification
```javascript
window.eduNetErrorHandler.showNotification('Message', 'success');
```

#### Validate Form Field
```javascript
const result = window.eduNetValidation.validators.email('test@example.com');
```

---

## 📁 File Organization

### By Feature
| Feature | Main File | Supporting Files |
|---------|-----------|------------------|
| Auth | `js/auth/auth.js` | validation.js, age-verification.js, registration-miur.js |
| Profile | `js/profile/profile-management.js` | profile-page.js, edit-profile.js, avatar-manager.js |
| Social | `js/social/social-features.js` | connections.js, saved-posts.js, review-manager.js |
| Recommendations | `js/recommendations/recommendation-engine.js` | edumatch.js, edumatch-ai-algorithm.js |
| Homepage | `js/utils/homepage-script.js` | modern-filters.js, global-search.js |

### By Type
| Type | Location | Count |
|------|----------|-------|
| JavaScript | `js/` | 50+ files |
| HTML | `pages/` + root | 15+ files |
| CSS | `css/` | 30+ files |
| Database | `database/` | 100+ files |
| Config | root | 2 files |

---

## 🔐 Authentication Flow

```
1. User enters email/password
2. validation.js validates input
3. auth.js calls Supabase auth
4. Session created with JWT
5. profile-management.js loads profile
6. User redirected to homepage
```

### Key Functions
- `auth.js` → `login(email, password)`
- `auth.js` → `registerInstitute(data)`
- `auth.js` → `registerPrivateUser(data)`
- `auth.js` → `logout()`

---

## 👤 Profile Management

### Load Profile
```javascript
const profile = await window.eduNetProfileManager.loadProfile(userId);
```

### Update Profile
```javascript
await window.eduNetProfileManager.updateProfile(userId, {
  first_name: 'John',
  last_name: 'Doe'
});
```

### Upload Avatar
```javascript
await window.eduNetProfileManager.uploadAvatar(userId, file);
```

---

## 🤝 Social Features

### Create Post
```javascript
await window.eduNetSocial.createPost({
  content: 'Post content',
  institute_id: instituteId
});
```

### Add Comment
```javascript
await window.eduNetSocial.addComment({
  post_id: postId,
  content: 'Comment text'
});
```

### Follow User
```javascript
await window.eduNetSocial.followUser(targetUserId);
```

---

## 🎓 Recommendations

### Get Recommendations
```javascript
const recommendations = await window.recommendationEngine
  .getRecommendations(userId);
```

### Update Preferences
```javascript
await window.recommendationEngine.updateUserPreferences(userId, {
  interests: ['STEM', 'Arts'],
  level: 'secondary'
});
```

---

## 🔍 Search & Filters

### Global Search
```javascript
const results = await window.globalSearch.search('query');
```

### Apply Filters
```javascript
window.modernFilters.applyFilters({
  contentType: ['post', 'project'],
  dateRange: 'week'
});
```

---

## 🎨 Styling

### Dark Theme
```javascript
// Enable dark theme
document.body.classList.add('dark-theme');

// Save preference
localStorage.setItem('edunet_settings', JSON.stringify({
  theme: 'dark'
}));
```

### CSS Variables
```css
--color-primary: #2563eb;
--color-secondary: #10b981;
--color-danger: #ef4444;
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 1rem;
--space-4: 1.5rem;
```

---

## 🗄️ Database Tables

### Core Tables
- `user_profiles` - All users
- `school_institutes` - Institute data
- `private_users` - Private user data
- `user_privacy_settings` - Privacy controls

### Social Tables
- `institute_posts` - Posts
- `post_comments` - Comments
- `user_connections` - Follows
- `institute_reviews` - Reviews

### Admin Tables
- `institute_admins` - Admin assignments
- `admin_invites` - Invitations

---

## 🛠️ Common Debugging

### Check Authentication
```javascript
console.log(window.eduNetAuth.currentUser);
console.log(window.eduNetAuth.userProfile);
console.log(window.eduNetAuth.isInitialized);
```

### Check Supabase Connection
```javascript
const client = await window.supabaseClientManager.getClient();
console.log(client ? '✅ Connected' : '❌ Not connected');
```

### View Console Logs
```javascript
// All logs are optimized and categorized
// ✅ Success, ❌ Error, ⚠️ Warning, 🔄 Loading, 📋 Info
```

### Check Errors
```javascript
window.eduNetErrorHandler.getLastError();
window.supabaseErrorHandler.getLastError();
```

---

## 📱 Mobile Considerations

### Mobile Menu
- Hamburger menu in top-right
- Mobile search overlay
- Bottom navigation on profile pages

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-Specific Files
- `mobile-menu-fix.css`
- `mobile-search.css`
- `mobile-search.js`

---

## 🔄 Data Flow

### User Registration
```
Landing Page → Validation → Age Check → MIUR Lookup → 
Auth Creation → Profile Creation → Homepage
```

### Homepage Load
```
Session Check → Profile Load → Social Features Init → 
Recommendations Load → Filters Init → Search Init → 
Homepage Ready
```

### Profile Edit
```
Load Profile → Load Avatar → Load MIUR Data → 
User Edits → Save Changes → Upload Files → 
Success Notification
```

---

## 🚨 Error Handling

### Try-Catch Pattern
```javascript
try {
  const result = await someAsyncOperation();
  console.log('✅ Success:', result);
} catch (error) {
  console.error('❌ Error:', error);
  window.eduNetErrorHandler.showNotification(
    'Errore durante l\'operazione',
    'error'
  );
}
```

### Error Messages
- User-friendly Italian messages
- Logged to console with emoji prefix
- Shown in notifications
- Tracked in error handler

---

## 📊 Performance Tips

### Lazy Loading
- Images use `avatar-loader-fix.js`
- Intersection Observer for visibility
- Defer non-critical scripts

### Caching
- User preferences in localStorage
- Session data in sessionStorage
- Supabase client cached globally

### Optimization
- Console logging optimized
- Debounced search (300ms)
- Throttled scroll events (16ms)

---

## 🔐 Security Checklist

- [ ] Never expose service role key
- [ ] All queries use RLS policies
- [ ] Validate user input client-side
- [ ] Verify user type before operations
- [ ] Check age for minors
- [ ] Require parental consent for 14-16
- [ ] Use HTTPS only
- [ ] Sanitize user-generated content

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PROJECT_STRUCTURE_MAP.md` | Complete project overview |
| `DEPENDENCY_DIAGRAM.md` | Module dependencies |
| `QUICK_REFERENCE.md` | This file |
| `README.md` | Project overview |
| `README_STRUTTURA_PROGETTO.md` | Project structure |
| `🚀_LAUNCH_CHECKLIST.md` | Launch checklist |

---

## 🎯 Common Workflows

### Add New Feature
1. Create module in appropriate `js/` folder
2. Add class with `window.moduleName` export
3. Add to HTML page script tags
4. Import in dependent modules
5. Add CSS file if needed
6. Test on landing and homepage

### Fix Bug
1. Check console for errors
2. Review error-handling.js logs
3. Check database RLS policies
4. Verify Supabase connection
5. Test in browser dev tools
6. Check mobile responsiveness

### Deploy Changes
1. Test locally
2. Run security audit
3. Check database migrations
4. Verify RLS policies
5. Test all pages
6. Check mobile
7. Deploy to production

---

## 🔗 Important URLs

- **Supabase Dashboard:** https://app.supabase.com
- **Project URL:** `https://skuohmocimslevtkqilx.supabase.co`
- **API Docs:** https://supabase.com/docs
- **Font Awesome:** https://fontawesome.com/icons

---

## 📞 Support

### Common Issues

**Auth not working**
- Check `config.js` has correct credentials
- Verify `supabase-client.js` initialization
- Check browser console for errors

**Profile not loading**
- Check RLS policies in database
- Verify user has profile record
- Check `profile-management.js` logs

**Recommendations not showing**
- Check `recommendation-engine.js` initialization
- Verify user preferences exist
- Check `edumatch.js` is loaded

**Styling issues**
- Check dark theme CSS files
- Verify CSS files are loaded
- Check browser cache

---

## 🎓 Learning Resources

### Key Concepts
- **Supabase:** PostgreSQL + Auth + Storage
- **RLS:** Row Level Security for data access
- **JWT:** JSON Web Tokens for authentication
- **ES6+:** Modern JavaScript features used

### External Links
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Font Awesome Icons](https://fontawesome.com/)

---

**Last Updated:** 2025-01-12  
**Version:** 1.0  
**Status:** ✅ Ready for Use

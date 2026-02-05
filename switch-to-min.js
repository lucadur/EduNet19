/**
 * Switch HTML references from .js/.css to .min.js/.min.css
 * Only changes LOCAL project references, not CDN/external links.
 * 
 * Safety rules:
 *  - Only matches src="..." and href="..." attributes
 *  - Skips any URL containing "://" (CDN, external)
 *  - Skips files already ending in .min.js or .min.css
 *  - Skips references to build-minify.js and switch-to-min.js (build tools)
 *  - Dry-run with --dry flag
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DRY_RUN = process.argv.includes('--dry');
const REVERT = process.argv.includes('--revert');

// HTML files to process (exclude node_modules, seo-analyzer)
const HTML_FILES = [
  'homepage.html',
  'index.html',
  'pages/admin/accept-invite.html',
  'pages/admin/manage-admins.html',
  'pages/admin/moderation.html',
  'pages/auth/reset-password.html',
  'pages/auth/verify-institute.html',
  'pages/legal/cookie-policy.html',
  'pages/legal/parental-consent.html',
  'pages/legal/privacy-policy.html',
  'pages/legal/terms-of-service.html',
  'pages/main/create.html',
  'pages/profile/accept-invite.html',
  'pages/profile/connections.html',
  'pages/profile/edit-profile.html',
  'pages/profile/profile.html',
  'pages/profile/settings.html'
];

// Build tool files that should never be switched
const SKIP_FILES = ['build-minify.js', 'switch-to-min.js', 'package.json'];

let totalChanges = 0;

for (const htmlFile of HTML_FILES) {
  const fullPath = path.join(ROOT, htmlFile);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  Not found: ${htmlFile}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  if (REVERT) {
    // Revert: .min.js → .js and .min.css → .css (local only)
    content = content.replace(
      /((?:src|href)\s*=\s*["'])([^"']*?)\.min\.(js|css)(["'])/g,
      (match, prefix, filePath, ext, suffix) => {
        // Skip external URLs
        if (filePath.includes('://')) return match;
        changes++;
        return `${prefix}${filePath}.${ext}${suffix}`;
      }
    );
  } else {
    // Forward: .js → .min.js and .css → .min.css (local only)
    content = content.replace(
      /((?:src|href)\s*=\s*["'])([^"']*?)\.(js|css)(["'])/g,
      (match, prefix, filePath, ext, suffix) => {
        // Skip external URLs (CDN)
        if (filePath.includes('://')) return match;
        // Skip already minified
        if (filePath.endsWith('.min')) return match;
        // Skip build tools
        const filename = filePath.split('/').pop();
        if (SKIP_FILES.includes(filename + '.' + ext)) return match;
        changes++;
        return `${prefix}${filePath}.min.${ext}${suffix}`;
      }
    );
  }

  if (changes > 0) {
    if (!DRY_RUN) {
      fs.writeFileSync(fullPath, content, 'utf8');
    }
    console.log(`  ✅ ${htmlFile} — ${changes} reference(s) ${REVERT ? 'reverted' : 'switched'}`);
    totalChanges += changes;
  } else {
    console.log(`  — ${htmlFile} — no changes needed`);
  }
}

console.log('');
console.log(`Total: ${totalChanges} references ${REVERT ? 'reverted' : 'switched to .min'} across ${HTML_FILES.length} files`);
if (DRY_RUN) console.log('⚠️  DRY RUN — no files were modified');
if (!DRY_RUN && !REVERT) console.log('💡 To revert: node switch-to-min.js --revert');

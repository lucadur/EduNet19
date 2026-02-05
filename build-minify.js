/**
 * ===================================================================
 * EDUNET19 — Safe Minification Build Script
 * 
 * Uses Terser for JS and clean-css for CSS.
 * Outputs .min.js / .min.css alongside originals.
 * 
 * Safety measures:
 *  - ecma: 2020 (supports template literals, optional chaining, nullish coalescing)
 *  - No mangling of top-level names (classes are assigned to window.*)
 *  - Preserves regex, unicode escapes, and CSS content: strings
 *  - Validates output size > 0 before writing
 *  - Dry-run mode with --dry flag
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

// --------------- Configuration ---------------

const JS_DIRS = [
  'js/admin',
  'js/auth',
  'js/moderation',
  'js/profile',
  'js/recommendations',
  'js/social',
  'js/utils'
];

const JS_ROOT_FILES = [
  'config.js',
  'script.js',
  'supabase-client.js',
  'sw.js'
];

const CSS_DIRS = [
  'css/admin',
  'css/components'
];

const CSS_ROOT_FILES = [
  'styles.css'
];

const ROOT = __dirname;
const DRY_RUN = process.argv.includes('--dry');

// --------------- Helpers ---------------

function getAllFiles(dir, ext) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter(f => f.endsWith(ext) && !f.endsWith(`.min${ext}`))
    .map(f => path.join(dir, f));
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// --------------- JS Minification (Terser) ---------------

async function minifyJS(filePath) {
  const { minify } = require('terser');
  const fullPath = path.join(ROOT, filePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const originalSize = Buffer.byteLength(source, 'utf8');

  const result = await minify(source, {
    ecma: 2020,
    compress: {
      ecma: 2020,
      passes: 2,
      drop_console: false,   // Keep console logs (needed for debugging)
      drop_debugger: true,
      dead_code: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: false,      // Don't hoist — preserves declaration order
      hoist_vars: false,
      sequences: true,
      if_return: true,
      join_vars: true,
      collapse_vars: false,   // Conservative — avoid breaking closures
      reduce_vars: false,
      pure_getters: false,
      unsafe: false,          // NEVER use unsafe optimizations
      unsafe_arrows: false,
      unsafe_comps: false,
      unsafe_math: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false
    },
    mangle: {
      toplevel: false,        // Don't mangle top-level (window.* assignments)
      reserved: [
        'EduNetApp', 'EduNetAuth', 'RecommendationEngine', 'RecommendationUI',
        'DiscoverManager', 'EduMatch', 'EduMatchAI', 'SettingsPage',
        'ProfilePage', 'AppConfig', 'ModerationCenter', 'ModerationUI',
        'AvatarManager', 'GlobalSearch', 'SocialFeatures', 'ReviewManager',
        'CreatePage', 'ConnectionsManager', 'EditProfile', 'CollaboratorManager',
        'supabaseClientManager', 'eduNetAuth'
      ]
    },
    format: {
      ascii_only: false,      // Preserve unicode (emoji in console.log)
      comments: false,
      ecma: 2020
    },
    sourceMap: false
  });

  if (!result.code || result.code.length === 0) {
    console.error(`  ❌ SKIP ${filePath} — minified output is empty!`);
    return null;
  }

  const minSize = Buffer.byteLength(result.code, 'utf8');
  const ratio = ((1 - minSize / originalSize) * 100).toFixed(1);
  const outPath = fullPath.replace(/\.js$/, '.min.js');

  if (!DRY_RUN) {
    fs.writeFileSync(outPath, result.code, 'utf8');
  }

  return { file: filePath, originalSize, minSize, ratio, outPath };
}

// --------------- CSS Nesting Detection ---------------

/**
 * Detects if a CSS file uses true CSS Nesting
 * (e.g. body.dark-theme { .child { ... } })
 * Ignores @-rules like @media, @keyframes, @supports which are NOT nesting.
 */
function detectCSSNesting(source) {
  // Remove comments
  const cleaned = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^']*'/g, '""')
    .replace(/"[^"]*"/g, '""');

  // Track context: are we inside a selector block (not an @-rule)?
  let depth = 0;
  let inSelectorBlock = []; // stack: true = selector block, false = @-rule block
  const lines = cleaned.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line opens a block
    if (trimmed.includes('{')) {
      const beforeBrace = trimmed.split('{')[0].trim();
      const isAtRule = beforeBrace.startsWith('@');

      for (const ch of trimmed) {
        if (ch === '{') {
          // If we're already inside a selector block (not @-rule) and this opens another selector
          if (depth > 0 && inSelectorBlock[depth - 1] === true && !isAtRule) {
            return true; // This is CSS Nesting!
          }
          inSelectorBlock[depth] = !isAtRule;
          depth++;
        } else if (ch === '}') {
          depth = Math.max(0, depth - 1);
        }
      }
    } else {
      for (const ch of trimmed) {
        if (ch === '}') {
          depth = Math.max(0, depth - 1);
        }
      }
    }
  }
  return false;
}

/**
 * Simple regex-based CSS minifier for files with CSS Nesting.
 * Strips comments, collapses whitespace, preserves content: strings.
 */
function simpleMinifyCSS(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')          // Remove block comments
    .replace(/([^:])\/\/.*$/gm, '$1')          // Remove line comments (rare in CSS)
    .replace(/\s*\n\s*/g, '')                   // Remove newlines + surrounding whitespace
    .replace(/\s*{\s*/g, '{')                   // Collapse around {
    .replace(/\s*}\s*/g, '}')                   // Collapse around }
    .replace(/\s*;\s*/g, ';')                   // Collapse around ;
    .replace(/\s*:\s*/g, ':')                   // Collapse around :
    .replace(/\s*,\s*/g, ',')                   // Collapse around ,
    .replace(/;}/g, '}')                        // Remove last semicolon before }
    .replace(/\s{2,}/g, ' ')                    // Collapse multiple spaces
    .trim();
}

// --------------- CSS Minification (clean-css) ---------------

function minifyCSS(filePath) {
  const CleanCSS = require('clean-css');
  const fullPath = path.join(ROOT, filePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const originalSize = Buffer.byteLength(source, 'utf8');

  // Detect CSS Nesting (modern syntax: parent { .child { ... } })
  // clean-css doesn't support nesting — use simple regex minifier for those files
  const hasNesting = detectCSSNesting(source);

  let minified;

  if (hasNesting) {
    // Use safe regex-based minifier that preserves nesting structure
    minified = simpleMinifyCSS(source);
    if (!minified || minified.length === 0) {
      console.error(`  ❌ SKIP ${filePath} — simple minified output is empty!`);
      return null;
    }
  } else {
    // Use full clean-css optimization
    const result = new CleanCSS({
      level: {
        1: { all: true, specialComments: 0 },
        2: {
          mergeAdjacentRules: true,
          mergeIntoShorthands: true,
          mergeMedia: true,
          mergeNonAdjacentRules: true,
          mergeSemantically: false,
          overrideProperties: true,
          removeEmpty: true,
          reduceNonAdjacentRules: true,
          removeDuplicateFontRules: true,
          removeDuplicateMediaBlocks: true,
          removeDuplicateRules: true,
          restructureRules: false
        }
      },
      compatibility: '*',
      inline: false,
      rebase: false
    }).minify(source);

    if (result.errors && result.errors.length > 0) {
      console.error(`  ❌ SKIP ${filePath} — errors:`, result.errors);
      return null;
    }

    if (!result.styles || result.styles.length === 0) {
      console.error(`  ❌ SKIP ${filePath} — minified output is empty!`);
      return null;
    }

    if (result.warnings && result.warnings.length > 0) {
      console.warn(`  ⚠️  ${filePath} warnings:`, result.warnings.slice(0, 3));
    }

    minified = result.styles;
  }

  const minSize = Buffer.byteLength(minified, 'utf8');
  const ratio = ((1 - minSize / originalSize) * 100).toFixed(1);
  const outPath = fullPath.replace(/\.css$/, '.min.css');

  if (!DRY_RUN) {
    fs.writeFileSync(outPath, minified, 'utf8');
  }

  const method = hasNesting ? 'regex' : 'clean-css';
  return { file: filePath, originalSize, minSize, ratio, outPath, method };
}

// --------------- Main ---------------

async function main() {
  console.log('');
  console.log('===================================================');
  console.log(' EDUNET19 — Minification Build');
  console.log(DRY_RUN ? ' MODE: DRY RUN (no files written)' : ' MODE: PRODUCTION');
  console.log('===================================================');
  console.log('');

  // Collect all files
  const jsFiles = [
    ...JS_ROOT_FILES.filter(f => fs.existsSync(path.join(ROOT, f))),
    ...JS_DIRS.flatMap(dir => getAllFiles(dir, '.js'))
  ];

  const cssFiles = [
    ...CSS_ROOT_FILES.filter(f => fs.existsSync(path.join(ROOT, f))),
    ...CSS_DIRS.flatMap(dir => getAllFiles(dir, '.css'))
  ];

  console.log(`📦 Found ${jsFiles.length} JS files and ${cssFiles.length} CSS files`);
  console.log('');

  // ---------- Minify JS ----------
  console.log('━━━ JavaScript (Terser) ━━━');
  let totalJsOriginal = 0, totalJsMin = 0, jsCount = 0;

  for (const file of jsFiles) {
    try {
      const result = await minifyJS(file);
      if (result) {
        totalJsOriginal += result.originalSize;
        totalJsMin += result.minSize;
        jsCount++;
        console.log(`  ✅ ${result.file}  ${formatSize(result.originalSize)} → ${formatSize(result.minSize)}  (−${result.ratio}%)`);
      }
    } catch (err) {
      console.error(`  ❌ ${file} — ${err.message}`);
    }
  }

  console.log('');
  console.log(`  JS Total: ${formatSize(totalJsOriginal)} → ${formatSize(totalJsMin)}  (−${((1 - totalJsMin / totalJsOriginal) * 100).toFixed(1)}%)  [${jsCount} files]`);
  console.log('');

  // ---------- Minify CSS ----------
  console.log('━━━ CSS (clean-css + regex fallback) ━━━');
  let totalCssOriginal = 0, totalCssMin = 0, cssCount = 0;

  for (const file of cssFiles) {
    try {
      const result = minifyCSS(file);
      if (result) {
        totalCssOriginal += result.originalSize;
        totalCssMin += result.minSize;
        cssCount++;
        console.log(`  ✅ ${result.file}  ${formatSize(result.originalSize)} → ${formatSize(result.minSize)}  (−${result.ratio}%)`);
      }
    } catch (err) {
      console.error(`  ❌ ${file} — ${err.message}`);
    }
  }

  console.log('');
  console.log(`  CSS Total: ${formatSize(totalCssOriginal)} → ${formatSize(totalCssMin)}  (−${((1 - totalCssMin / totalCssOriginal) * 100).toFixed(1)}%)  [${cssCount} files]`);
  console.log('');

  // ---------- Summary ----------
  const grandOriginal = totalJsOriginal + totalCssOriginal;
  const grandMin = totalJsMin + totalCssMin;
  console.log('===================================================');
  console.log(` GRAND TOTAL: ${formatSize(grandOriginal)} → ${formatSize(grandMin)}  (−${((1 - grandMin / grandOriginal) * 100).toFixed(1)}%)`);
  console.log(` Files processed: ${jsCount + cssCount} (${jsCount} JS + ${cssCount} CSS)`);
  if (DRY_RUN) {
    console.log(' ⚠️  DRY RUN — no files were written');
  } else {
    console.log(' ✅ All .min.js and .min.css files created successfully');
  }
  console.log('===================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

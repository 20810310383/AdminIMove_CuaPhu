// TH79 iMove hotfix — safe, idempotent, local-only patch.
// Run from the AdminIMove_CuaPhu project root: node scripts/FIX_CLIPBOARDCHECK_EXPORT.cjs
const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(process.cwd(), 'src', 'adminPngLucide.jsx');
if (!fs.existsSync(target)) {
  console.error('[ERROR] Not found: '+target+' (run from AdminIMove_CuaPhu root)');
  process.exit(1);
}
const original = fs.readFileSync(target, 'utf8');
if (!original.includes('function glyph(')) {
  console.error('[ERROR] Incompatible adminPngLucide.jsx: glyph() not found. File unchanged.');
  process.exit(1);
}
let updated = original;
if (!/export\s+const\s+ClipboardCheck\s*=/.test(updated)) {
  updated=updated.replace(/\s*$/, '\n')+'export const ClipboardCheck = glyph("ClipboardCheck");\n';
}
if (!/['"]ClipboardCheck['"]\s*:/.test(updated)) {
  if (/['"]FileText['"]\s*:\s*['"]ic_terms\.png['"]\s*,/.test(updated)) {
    updated=updated.replace(/(['"]FileText['"]\s*:\s*['"]ic_terms\.png['"]\s*,)/,
        '$1\n  "ClipboardCheck": "ic_orders.png",');
  } else {
    // Export still works with lucide fallback if icon map format was customized.
    console.warn('[WARN] Could not find PNG_MAP FileText entry. ClipboardCheck will fall back to Lucide.');
  }
}
if (updated===original) {
  console.log('[OK] ClipboardCheck already exported. No changes required.');
} else {
  const backup = target + '.backup_before_clipboardcheck';
  if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
  fs.writeFileSync(target, updated, 'utf8');
  console.log('[OK] Patched '+target);
  console.log('[OK] Backup '+backup);
}
// Report all named Lucide/icon-wrapper imports that are missing from the adapter.
const exportedNames=new Set([...updated.matchAll(/export\s+const\s+(\w+)\s*=/g)].map(m=>m[1]));
const srcDir=path.resolve(process.cwd(),'src');
const missing = new Map();
for (const filename of fs.readdirSync(srcDir).filter(f=>/\.(jsx|tsx)$/.test(f)&&f!=='adminPngLucide.jsx')) {
  const s=fs.readFileSync(path.join(srcDir,filename),'utf8');
  for(const m of s.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](?:lucide-react|\.\/adminPngLucide\.jsx)['"]/g)) {
    for (const token of m[1].split(',')) {
      const name=token.trim().split(/\s+as\s+/)[0].trim();
      if(name && !exportedNames.has(name)) {
        if (!missing.has(filename)) missing.set(filename,[]);
        missing.get(filename).push(name);
      }
    }
  }
}
if(missing.size){
 console.log('[WARN] Other icon exports might be missing:');
 for(const [file,names] of missing)console.log(' '+file+': '+[...new Set(names)].join(', '));
}else console.log('[OK] No other missing named icon exports found in JSX imports.');

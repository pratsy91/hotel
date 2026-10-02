const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      rewrite(fullPath);
    }
  }
}

function rewrite(file) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (match, prefix, spec, suffix) =>
      /\.[a-z0-9]+$/i.test(spec) ? match : `${prefix}${spec}.js${suffix}`,
  );
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    console.log(file);
  }
}

walk(path.join(__dirname, '..', 'src'));

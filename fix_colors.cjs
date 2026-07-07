const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src', 'styles');

const replacements = [
  { search: /#0c0f14/gi, replace: 'var(--bg)' },
  { search: /#080b10/gi, replace: 'var(--bg-darker)' },
  { search: /#090c11/gi, replace: 'var(--bg-darker)' },
  { search: /#0a0e15/gi, replace: 'var(--bg-dark)' },
  { search: /#121721/gi, replace: 'var(--panel)' },
  { search: /#171d28/gi, replace: 'var(--panel-soft)' },
  { search: /#1b2230/gi, replace: 'var(--panel-raised)' },
  { search: /#202a3a/gi, replace: 'var(--panel-raised)' },
  { search: /#1a1f2e/gi, replace: 'var(--chrome-bg)' },
  { search: /#0f131b/gi, replace: 'var(--header-bg)' },
  { search: /#0d1118/gi, replace: 'var(--code-bg)' },
  { search: /#151d2c/gi, replace: 'var(--tooltip-bg)' },
  { search: /#172943/gi, replace: 'var(--highlight-bg)' },
  { search: /rgba\(12,\s*15,\s*20,\s*0\.86\)/gi, replace: 'var(--topbar-bg)' }
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { search, replace } of replacements) {
        // use match to see if it exists
        if (content.match(search)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDir(stylesDir);

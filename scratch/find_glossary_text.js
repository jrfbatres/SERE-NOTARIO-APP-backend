const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(filepath, callback);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      callback(filepath);
    }
  }
}

walk('c:\\Users\\jrfba\\OneDrive\\Desktop\\SERE NOTARIO\\sere-notario-app', (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('<GlossaryText')) {
    console.log(`Found in: ${filepath}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('<GlossaryText')) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});

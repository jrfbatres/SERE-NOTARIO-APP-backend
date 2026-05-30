const fs = require('fs');

const content = fs.readFileSync('c:/Users/jrfba/OneDrive/Desktop/SERE NOTARIO/sere-notario-app/src/app/estudio/[ley]/page.js', 'utf8');
const lines = content.split('\n');

const tags = [];
const tagRegex = /<\/?([a-zA-Z0-9\-:]+)(?:\s+[^>]*)?>/g;

// Simple JSX tag parser to find matching tags
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // Remove comments
  line = line.replace(/\{\/\*.*?\*\/\}/g, '');
  line = line.replace(/\/\/.*/, '');

  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = fullTag.endsWith('/>');

    if (isSelfClosing) continue;

    if (isClosing) {
      if (tags.length === 0) {
        console.log(`Error: Extra closing tag </${tagName}> at line ${i + 1}`);
      } else {
        const last = tags.pop();
        if (last.name !== tagName) {
          console.log(`Mismatch: Opened <${last.name}> at line ${last.line} but closed with </${tagName}> at line ${i + 1}`);
        }
      }
    } else {
      tags.push({ name: tagName, line: i + 1 });
    }
  }
}

console.log('Unclosed tags remaining:', tags);

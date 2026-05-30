const fs = require('fs');
const path = require('path');

const fontUrl = 'https://fonts.gstatic.com/s/materialsymbolsoutlined/v339/kJEPBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzBwG-RpA6RzaxHMPdY40KH8nGzv3fzfVJO1Q.woff2';
const destDir = path.join(__dirname, '..', 'public', 'fonts');
const destPath = path.join(destDir, 'material-symbols-outlined.woff2');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading font from:', fontUrl);

fetch(fontUrl)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.arrayBuffer();
  })
  .then(buffer => {
    fs.writeFileSync(destPath, Buffer.from(buffer));
    console.log('Font saved successfully to:', destPath);
  })
  .catch(err => {
    console.error('Error downloading font:', err);
  });

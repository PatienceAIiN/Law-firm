const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir('./src', (filePath) => {
  if (!filePath.match(/\.(tsx|ts|css)$/)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/\[#c9a227\]/g, '[var(--secondary)]')
    .replace(/\[#f59e0b\]/g, '[var(--secondary)]')
    .replace(/\[#c5a059\]/g, '[var(--secondary)]')
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    count++;
  }
});
console.log(`Updated ${count} files.`);

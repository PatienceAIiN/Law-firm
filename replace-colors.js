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
    .replace(/bg-\[\#14203E\]/g, 'bg-[var(--primary)]')
    .replace(/text-\[\#14203E\]/g, 'text-[var(--primary)]')
    .replace(/border-\[\#14203E\]/g, 'border-[var(--primary)]')
    .replace(/fill-\[\#14203E\]/g, 'fill-[var(--primary)]')
    .replace(/bg-\[\#1d2c52\]/g, 'bg-[var(--accent)]')
    .replace(/hover:bg-\[\#1d2c52\]/g, 'hover:bg-[var(--accent)]')
    .replace(/'#14203E'/g, "'var(--primary)'")
    .replace(/"#14203E"/g, '"var(--primary)"')
    .replace(/color:\s*['"]#14203E['"]/g, "color: 'var(--primary)'")
    .replace(/background:\s*['"]#14203E['"]/g, "background: 'var(--primary)'")
    
    // Also replace gold colors if needed, but let's stick to primary for now to ensure it works
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    count++;
  }
});
console.log(`Updated ${count} files.`);

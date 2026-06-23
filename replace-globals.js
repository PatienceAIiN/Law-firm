const fs = require('fs');
let content = fs.readFileSync('src/app/globals.css', 'utf8');
content = content.replace(/197,\s*160,\s*89/g, 'var(--secondary-rgb, 197, 160, 89)');
fs.writeFileSync('src/app/globals.css', content, 'utf8');

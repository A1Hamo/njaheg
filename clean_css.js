const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend/src/styles/global.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Remove all blocks starting with [data-theme="light"]
css = css.replace(/\[data-theme="light"\]\s*[^{]*{[^}]*}/g, '');

// 2. Remove body::before ambient background as requested by "clean off-white"
css = css.replace(/body::before\s*{[^}]*}/g, '');

fs.writeFileSync(cssPath, css);
console.log('Cleaned global.css');

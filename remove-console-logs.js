const fs = require('fs');
const path = require('path');

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove standalone console.log/error/warn/info/debug statements (single line)
  content = content.replace(/^[ \t]*console\.(log|error|warn|info|debug)\([^)]*\);?\s*$/gm, '');
  
  // Remove multi-line console statements
  content = content.replace(/^[ \t]*console\.(log|error|warn|info|debug)\([^;]*?\);?\s*$/gms, '');
  
  // Remove console in JSX event handlers like onError={(e) => console.error(...)}
  content = content.replace(/on(Error|Play|Pause|Load[^=]*)=\{[^}]*console\.(log|error|warn|info|debug)\([^}]*\}\s*/g, '');
  
  // Remove console in catch blocks like .catch(console.error)
  content = content.replace(/\.catch\(console\.(error|log|warn)\)/g, '.catch(() => {})');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      console.log(`Processing: ${filePath}`);
      removeConsoleLogs(filePath);
    }
  });
}

const srcDir = path.join(__dirname, 'src');
walkDir(srcDir);
console.log('Done removing console logs!');

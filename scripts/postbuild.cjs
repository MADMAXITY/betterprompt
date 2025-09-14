// Copy static assets that are not under client/public into the build output.
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname + '/..';
const outDir = path.resolve(projectRoot, 'dist', 'public');

function copyIfExists(src, destName) {
  const srcPath = path.resolve(projectRoot, src);
  const destPath = path.resolve(outDir, destName);
  try {
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      console.log(`[postbuild] Copied ${src} -> ${path.relative(projectRoot, destPath)}`);
    }
  } catch (e) {
    console.warn(`[postbuild] Failed to copy ${src}:`, e.message);
  }
}

copyIfExists('fav.png', 'fav.png');


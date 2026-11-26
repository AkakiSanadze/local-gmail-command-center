import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const MANIFESTS_DIR = path.join(ROOT_DIR, 'manifests');
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const ICON_FILES = ['icon-16.png', 'icon-48.png', 'icon-128.png'];

/**
 * Recursively copies a directory into target destination.
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Derives sidepanel.html cleanly from src/popup.html so both views stay in sync.
 */
function generateSidePanelHtml(popupHtml) {
  return popupHtml
    .replace(
      '<title>Local Gmail Command Center</title>',
      '<title>Local Gmail Command Center - Side Panel</title>'
    )
    .replace('<body data-view="popup">', '<body data-view="sidepanel">');
}

/**
 * Builds a single browser extension target into dist/<target>.
 */
export function buildTarget(target) {
  const outDir = path.join(DIST_DIR, target);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Copy shared modules & entry scripts
  copyDir(path.join(SRC_DIR, 'shared'), path.join(outDir, 'shared'));
  fs.copyFileSync(path.join(SRC_DIR, 'background.js'), path.join(outDir, 'background.js'));
  fs.copyFileSync(path.join(SRC_DIR, 'popup.js'), path.join(outDir, 'popup.js'));
  fs.copyFileSync(path.join(SRC_DIR, 'popup.css'), path.join(outDir, 'popup.css'));

  // Popup + generated Side Panel HTML
  const popupHtml = fs.readFileSync(path.join(SRC_DIR, 'popup.html'), 'utf8');
  fs.writeFileSync(path.join(outDir, 'popup.html'), popupHtml, 'utf8');
  fs.writeFileSync(path.join(outDir, 'sidepanel.html'), generateSidePanelHtml(popupHtml), 'utf8');

  // Chrome-only offscreen files
  if (target === 'chrome') {
    fs.copyFileSync(path.join(SRC_DIR, 'offscreen.html'), path.join(outDir, 'offscreen.html'));
    fs.copyFileSync(path.join(SRC_DIR, 'offscreen.js'), path.join(outDir, 'offscreen.js'));
  }

  // Copy only runtime icon sizes (exclude icon-master.png)
  const outIconsDir = path.join(outDir, 'icons');
  fs.mkdirSync(outIconsDir, { recursive: true });
  for (const iconName of ICON_FILES) {
    fs.copyFileSync(path.join(ICONS_DIR, iconName), path.join(outIconsDir, iconName));
  }

  // Copy target manifest
  fs.copyFileSync(
    path.join(MANIFESTS_DIR, `${target}.json`),
    path.join(outDir, 'manifest.json')
  );

  return outDir;
}

/**
 * Packages built directories into .zip (Chrome) and .xpi (Firefox) archives using zip CLI.
 */
function packTarget(target, extension) {
  const targetDir = path.join(DIST_DIR, target);
  const archiveName = `local-gmail-command-center-${target}.${extension}`;
  const archivePath = path.join(DIST_DIR, archiveName);
  fs.rmSync(archivePath, { force: true });

  execFileSync('zip', ['-r', '-q', archivePath, '.'], { cwd: targetDir });
  return archivePath;
}

export function buildAll({ pack = false } = {}) {
  const chromeDir = buildTarget('chrome');
  const firefoxDir = buildTarget('firefox');

  const result = { chromeDir, firefoxDir, archives: [] };
  if (pack) {
    result.archives.push(packTarget('chrome', 'zip'));
    result.archives.push(packTarget('firefox', 'xpi'));
  }
  return result;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  const pack = process.argv.includes('--pack');
  const res = buildAll({ pack });
  console.log(`Built Chrome  -> ${res.chromeDir}`);
  console.log(`Built Firefox -> ${res.firefoxDir}`);
  for (const archive of res.archives) {
    console.log(`Packed        -> ${archive}`);
  }
}

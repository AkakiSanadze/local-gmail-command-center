import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildAll } from '../scripts/build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function collectJsFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(full));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
}

test('Build outputs valid Chrome & Firefox MV3 artifacts, manifests, CSS, HTML, and JS syntax', () => {
  const { chromeDir, firefoxDir } = buildAll({ pack: false });
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));

  // 1. package.json must remain 100% zero-dependency
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);

  // 2. Legacy root files must not remain
  const legacyRootFiles = [
    'manifest.json',
    'background.js',
    'offscreen.html',
    'offscreen.js',
    'popup.html',
    'sidepanel.html',
    'popup.css',
    'popup.js'
  ];
  for (const name of legacyRootFiles) {
    assert.equal(
      fs.existsSync(path.join(ROOT_DIR, name)),
      false,
      `Legacy root file must be removed: ${name}`
    );
  }

  // 3. Validate Chrome manifest & files
  const chromeManifest = JSON.parse(
    fs.readFileSync(path.join(chromeDir, 'manifest.json'), 'utf8')
  );
  assert.equal(chromeManifest.manifest_version, 3);
  assert.equal(chromeManifest.version, pkg.version);
  assert.equal(chromeManifest.background.service_worker, 'background.js');
  assert.equal(chromeManifest.background.type, 'module');
  assert.equal(chromeManifest.side_panel.default_path, 'sidepanel.html');
  assert.ok(chromeManifest.permissions.includes('offscreen'));
  assert.ok(chromeManifest.permissions.includes('sidePanel'));
  assert.equal(fs.existsSync(path.join(chromeDir, 'offscreen.html')), true);
  assert.equal(fs.existsSync(path.join(chromeDir, 'offscreen.js')), true);

  // 4. Validate Firefox manifest & files
  const firefoxManifest = JSON.parse(
    fs.readFileSync(path.join(firefoxDir, 'manifest.json'), 'utf8')
  );
  assert.equal(firefoxManifest.manifest_version, 3);
  assert.equal(firefoxManifest.version, pkg.version);
  assert.deepEqual(firefoxManifest.background.scripts, ['background.js']);
  assert.equal(firefoxManifest.background.type, 'module');
  assert.equal(firefoxManifest.sidebar_action.default_panel, 'sidepanel.html');
  assert.ok(firefoxManifest.browser_specific_settings?.gecko?.id);
  assert.equal(firefoxManifest.permissions.includes('offscreen'), false);
  assert.equal(firefoxManifest.permissions.includes('sidePanel'), false);
  assert.equal(firefoxManifest.side_panel, undefined);
  assert.equal(firefoxManifest.background.service_worker, undefined);
  assert.equal(fs.existsSync(path.join(firefoxDir, 'offscreen.html')), false);
  assert.equal(fs.existsSync(path.join(firefoxDir, 'offscreen.js')), false);

  // 5. Verify all referenced assets exist and icon-master.png is excluded
  for (const [label, dir, manifest] of [
    ['chrome', chromeDir, chromeManifest],
    ['firefox', firefoxDir, firefoxManifest]
  ]) {
    assert.equal(
      fs.existsSync(path.join(dir, 'icons', 'icon-master.png')),
      false,
      `${label} build must exclude icon-master.png`
    );

    const referencedPaths = [
      manifest.action?.default_popup,
      manifest.side_panel?.default_path,
      manifest.sidebar_action?.default_panel,
      manifest.background?.service_worker,
      ...(manifest.background?.scripts || []),
      ...Object.values(manifest.icons || {}),
      ...Object.values(manifest.action?.default_icon || {}),
      ...Object.values(manifest.sidebar_action?.default_icon || {})
    ].filter(Boolean);

    for (const rel of referencedPaths) {
      assert.equal(
        fs.existsSync(path.join(dir, rel)),
        true,
        `${label} manifest references missing file: ${rel}`
      );
    }

    // 6. Verify generated popup.html and sidepanel.html consistency
    const popupHtml = fs.readFileSync(path.join(dir, 'popup.html'), 'utf8');
    const sidepanelHtml = fs.readFileSync(path.join(dir, 'sidepanel.html'), 'utf8');
    assert.match(popupHtml, /<body data-view="popup">/);
    assert.match(sidepanelHtml, /<body data-view="sidepanel">/);
    assert.match(popupHtml, /id="btnAddAccountRow"/);
    assert.match(sidepanelHtml, /id="btnAddAccountRow"/);
    assert.match(popupHtml, /<script type="module" src="popup\.js"><\/script>/);
    assert.match(sidepanelHtml, /<script type="module" src="popup\.js"><\/script>/);

    // 7. Verify cleaned CSS
    const css = fs.readFileSync(path.join(dir, 'popup.css'), 'utf8');
    assert.equal(css.includes('--bg-page: #0c1017 !important'), false);
    assert.equal(css.includes('.brand-icon'), false);
    assert.equal(css.includes('.status-pulse.offline'), false);
    assert.match(css, /\.settings-section\s*\{[\s\S]*?\.btn-add-account\s*\{/);
    assert.doesNotMatch(css, /\.accounts-grid\s*\{[\s\S]*?\.btn-add-account\s*\{/);
  }

  // 8. Syntax-check every .js/.mjs file across src/, scripts/, dist/chrome/, dist/firefox/
  const jsFiles = [
    ...collectJsFiles(path.join(ROOT_DIR, 'src')),
    ...collectJsFiles(path.join(ROOT_DIR, 'scripts')),
    ...collectJsFiles(chromeDir),
    ...collectJsFiles(firefoxDir)
  ];
  assert.ok(jsFiles.length >= 20);
  for (const file of jsFiles) {
    execFileSync(process.execPath, ['--check', file]);
  }
});

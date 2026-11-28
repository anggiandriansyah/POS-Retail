import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeShiftSummary } from '../../src/utils/shiftHelpers.ts';
import { APP_VERSION } from '../../src/utils/format.ts';
import { translations } from '../../src/i18n/translations.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
}

function listFilesRecursive(relDir, exts) {
  const results = [];
  const absDir = path.join(ROOT_DIR, relDir);
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(path.relative(ROOT_DIR, absPath), exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(path.relative(ROOT_DIR, absPath));
    }
  }
  return results;
}

describe('Epik 5: Shift Helpers Behavior', () => {
  it('computeShiftSummary calculates expected drawer cash from opening float, cash sales, and petty logs', () => {
    const summary = computeShiftSummary(
      { opening_cash: 200000 },
      1450000,
      [
        {
          id: 'p1',
          shift_id: 's1',
          cashier_id: 'u1',
          type: 'IN',
          amount: 50000,
          category: 'KEMBALIAN',
          description: null,
          created_at: '2026-11-28T08:00:00Z',
        },
        {
          id: 'p2',
          shift_id: 's1',
          cashier_id: 'u1',
          type: 'OUT',
          amount: 35000,
          category: 'OPERASIONAL',
          description: null,
          created_at: '2026-11-28T09:00:00Z',
        },
      ]
    );
    assert.equal(summary.opening, 200000);
    assert.equal(summary.pettyIn, 50000);
    assert.equal(summary.pettyOut, 35000);
    assert.equal(summary.expectedCash, 1665000);
  });

  it('computeShiftSummary handles null activeShift and empty logs safely', () => {
    const summary = computeShiftSummary(null, 0, []);
    assert.equal(summary.opening, 0);
    assert.equal(summary.expectedCash, 0);
  });
});

describe('Epik 5: SemVer v1.7.0 Synchronization', () => {
  it('synchronizes v1.7.0 across all 5 required files', () => {
    const pkg = JSON.parse(readRepoFile('package.json'));
    const monitorHtml = readRepoFile('public/monitor.html');
    const sprint2Test = readRepoFile('tests/sprint2.test.mjs');

    assert.equal(pkg.version, '1.7.0');
    assert.equal(APP_VERSION, '1.7.0');
    assert.match(translations.id.landing.footerVersion, /1\.7\.0/);
    assert.match(translations.en.landing.footerVersion, /1\.7\.0/);
    assert.match(monitorHtml, /v1\.7\.0/);
    assert.match(sprint2Test, /assert\.equal\(APP_VERSION, '1\.7\.0'\)/);
  });
});

describe('Epik 5: Safe Area, Anti-Slop & Hallmark Compliance', () => {
  it('removes maximumScale: 1 while retaining viewportFit: cover in layout.tsx', () => {
    const layout = readRepoFile('src/app/layout.tsx');
    assert.match(layout, /viewportFit:\s*'cover'/);
    assert.doesNotMatch(layout, /maximumScale/);
    assert.doesNotMatch(layout, /—/);
  });

  it('enforces globals.css tokens, safe areas, focus-visible, reduced-motion, and no transition: all', () => {
    const css = readRepoFile('src/app/globals.css');
    assert.match(css, /--radius-md:/);
    assert.match(css, /--radius-lg:/);
    assert.match(css, /--radius-full:/);
    assert.doesNotMatch(css, /transition:\s*all\b/);
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /@media \(max-width:\s*639px\)/);
    assert.match(css, /@media \(min-width:\s*640px\)/);
    assert.match(css, /minmax\(min\(100%,\s*420px\),\s*1fr\)/);
    assert.doesNotMatch(css, /#a855f7 50%, #ec4899/);
  });

  it('keeps SmartNotificationCenter free of hardcoded hex colors, Sparkles, and v1.5.1, and portals mobile sheet', () => {
    const notif = readRepoFile('src/components/SmartNotificationCenter.tsx');
    assert.doesNotMatch(notif, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(notif, /Sparkles/);
    assert.doesNotMatch(notif, /v1\.5\.1/);
    assert.match(notif, /createPortal/);
    assert.match(notif, /\(max-width:\s*639px\)/);
    assert.match(notif, /Escape/);
    assert.match(notif, /pointerdown/);
    assert.match(notif, /aria-expanded=\{isOpen\}/);
    assert.match(notif, /role="dialog"/);
  });

  it('enforces zero transition: all across src/ and public/monitor.html', () => {
    const srcFiles = listFilesRecursive('src', ['.ts', '.tsx', '.css']);
    for (const file of [...srcFiles, 'public/monitor.html']) {
      const content = readRepoFile(file);
      assert.doesNotMatch(
        content,
        /transition\s*:\s*['"]?all\b/i,
        `Unexpected "transition: all" found in ${file}`
      );
    }
  });

  it('keeps src/components/ free of stale v1.5.1 and standalone UI emojis', () => {
    const componentFiles = listFilesRecursive('src/components', ['.tsx']);
    for (const file of componentFiles) {
      const content = readRepoFile(file);
      assert.doesNotMatch(content, /v1\.5\.1/, `Stale v1.5.1 found in ${file}`);
    }

    const posCashier = readRepoFile('src/components/PosCashier.tsx');
    const superadminHub = readRepoFile('src/components/SuperadminHub.tsx');
    const storeSettings = readRepoFile('src/components/StoreSettingsForm.tsx');
    const visualAnalytics = readRepoFile('src/components/VisualAnalytics.tsx');

    assert.doesNotMatch(posCashier, /📶|🎉|🏢|💰|📈|⚡/);
    assert.doesNotMatch(superadminHub, /📶|🎉|🏢|💰|📈|⚡|⏳/);
    assert.doesNotMatch(storeSettings, /🔔/);
    assert.doesNotMatch(visualAnalytics, /#[0-9a-fA-F]{3,8}\b/);
  });

  it('hardens public/monitor.html viewport, grids, safe areas, reduced motion, and em-dashes', () => {
    const monitorHtml = readRepoFile('public/monitor.html');
    assert.match(monitorHtml, /viewport-fit=cover/);
    assert.match(monitorHtml, /minmax\(min\(100%,\s*360px\),\s*1fr\)/);
    assert.match(monitorHtml, /minmax\(min\(100%,\s*340px\),\s*1fr\)/);
    assert.match(monitorHtml, /env\(safe-area-inset-top/);
    assert.match(monitorHtml, /prefers-reduced-motion:\s*reduce/);
    assert.match(monitorHtml, /:focus-visible/);
    assert.doesNotMatch(monitorHtml, /—/);
  });

  it('keeps audited UI components free of em-dashes', () => {
    const files = [
      'src/components/LandingPage.tsx',
      'src/components/RegistrationModal.tsx',
      'src/components/ShiftManager.tsx',
      'src/components/StaffManager.tsx',
      'src/components/StoreSettingsForm.tsx',
      'src/components/PosCashier.tsx',
      'src/components/PosShiftBanner.tsx',
      'src/components/AuthenticatedApp.tsx',
      'src/i18n/translations.ts',
    ];
    for (const file of files) {
      const content = readRepoFile(file);
      assert.doesNotMatch(content, /—/, `Unexpected em-dash found in ${file}`);
    }
  });
});

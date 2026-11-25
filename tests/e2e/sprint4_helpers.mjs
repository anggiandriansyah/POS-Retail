import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ROOT_DIR,
  loadDevEnv,
  readWorkspaceFile,
  workspaceFileExists,
  workspacePath,
} from './helpers.mjs';

export * from './helpers.mjs';

export const PROD_REF = 'sbtzajhgchpcdscrwtha';
export const DEV_REF = 'tcbhaiyhtndnqgatysmh';
export const EXPECTED_DEV_RECEIPT_ORIGIN =
  'https://pos-retail-git-develop-anggiandriansyah.vercel.app';

export const CONCEPT2_PATHS = {
  horizontal: 'M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19',
  vertical: 'M 52 26 C 37 21, 19 32, 19 46 C 19 58, 32 63, 42 55 L 48 63 L 64 26',
  light: 'M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19',
  thermal: 'M 40 16 C 28 12, 13 22, 13 34 C 13 44, 23 48, 32 42 L 37 48 L 49 16',
};

export const CONCEPT2_PALETTES = {
  horizontal: {
    stroke: '#10b981',
    alphosFill: '#f8fafc',
    byFill: '#10b981',
    alphagenFill: '#34d399',
    viewBox: '0 0 320 74',
  },
  vertical: {
    stroke: '#10b981',
    alphosFill: '#f8fafc',
    byFill: '#10b981',
    alphagenFill: '#34d399',
    viewBox: '0 0 260 170',
  },
  light: {
    stroke: '#059669',
    alphosFill: '#0f172a',
    byFill: '#059669',
    alphagenFill: '#10b981',
    viewBox: '0 0 320 74',
  },
  thermal: {
    stroke: '#000000',
    alphosFill: '#000000',
    byFill: '#000000',
    alphagenFill: '#000000',
    viewBox: '0 0 260 74',
  },
};

export const OFFICIAL_CONCEPT2_SVGS = {
  horizontal: `<svg width="340" height="80" viewBox="0 0 320 74" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(6, 6)"><path d="M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19" stroke="#10B981" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g><text x="74" y="42" fill="#F8FAFC" font-size="28" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="2.5">ALPHOS</text><text x="76" y="58" fill="#10B981" font-size="10" font-weight="700" font-family="system-ui, sans-serif" letter-spacing="3">by <tspan fill="#34D399">AlphaGen</tspan></text></svg>`,
  vertical: `<svg width="240" height="150" viewBox="0 0 260 170" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(98, 16)"><path d="M 52 26 C 37 21, 19 32, 19 46 C 19 58, 32 63, 42 55 L 48 63 L 64 26" stroke="#10B981" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g><text x="130" y="124" text-anchor="middle" fill="#F8FAFC" font-size="30" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="3">ALPHOS</text><text x="130" y="148" text-anchor="middle" fill="#10B981" font-size="11" font-weight="700" font-family="system-ui, sans-serif" letter-spacing="3">by <tspan fill="#34D399">AlphaGen</tspan></text></svg>`,
  light: `<svg width="340" height="80" viewBox="0 0 320 74" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(6, 6)"><path d="M 44 19 C 31 15, 14 25, 14 37 C 14 48, 25 52, 34 45 L 39 52 L 53 19" stroke="#059669" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></g><text x="74" y="42" fill="#0F172A" font-size="28" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="2.5">ALPHOS</text><text x="76" y="58" fill="#059669" font-size="10" font-weight="700" font-family="system-ui, sans-serif" letter-spacing="3">by <tspan fill="#10B981">AlphaGen</tspan></text></svg>`,
  thermal: `<svg width="280" height="80" viewBox="0 0 260 74" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(4, 8)"><path d="M 40 16 C 28 12, 13 22, 13 34 C 13 44, 23 48, 32 42 L 37 48 L 49 16" stroke="#000000" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></g><text x="68" y="38" fill="#000000" font-size="28" font-weight="900" font-family="monospace" letter-spacing="2">ALPHOS</text><text x="70" y="56" fill="#000000" font-size="10.5" font-weight="700" font-family="monospace" letter-spacing="2.5">by AlphaGen</text></svg>`,
};

export const ANTI_UI_VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

export function makeSprint4RunTag() {
  return `E2E-S4-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function isDryRunMode() {
  const val = String(process.env.E2E_DRY_RUN || '').trim().toLowerCase();
  return val === '1' || val === 'true';
}

export function isAndroidRequired() {
  const val = String(process.env.E2E_REQUIRE_ANDROID || '').trim().toLowerCase();
  return val === '1' || val === 'true';
}

export function isMobileRequired() {
  const val = String(process.env.E2E_REQUIRE_MOBILE || '').trim().toLowerCase();
  return val === '1' || val === 'true';
}

export function isWebRevampLanded() {
  if (!workspaceFileExists('src/components/AlphosLogo.tsx')) return false;
  const layout = readWorkspaceFile('src/app/layout.tsx');
  const login = readWorkspaceFile('src/components/LoginPage.tsx');
  const css = readWorkspaceFile('src/app/globals.css');
  return (
    !layout.includes('POS Retail') &&
    login.includes('AlphosLogo') &&
    css.includes('.price-result.not-found')
  );
}

export function requireDeliverableOrDryRunSkip(t, condition, message) {
  if (condition) return true;
  if (isDryRunMode()) {
    t.skip(`DRY_RUN: ${message}`);
    return false;
  }
  assert.fail(message);
  return false;
}

export async function loadPlaywright() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_MODULE_PATH) {
    const raw = process.env.PLAYWRIGHT_MODULE_PATH.trim();
    candidates.push(raw.startsWith('file://') ? raw : pathToFileURL(path.resolve(raw)).href);
  }
  candidates.push('playwright');
  const appData = process.env.APPDATA || 'C:\\Users\\2419\\AppData\\Roaming';
  const globalPwIndex = path.join(appData, 'npm', 'node_modules', 'playwright', 'index.mjs');
  candidates.push(pathToFileURL(globalPwIndex).href);

  let lastErr = null;
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      const pw = mod?.chromium ? mod : mod?.default;
      if (pw?.chromium) return pw;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `Unable to load Playwright ESM module from candidates [${candidates.join(', ')}]: ${lastErr?.message || 'unknown'}`
  );
}

export async function withBrowserPage(options, fn) {
  const {
    viewport = { width: 1440, height: 900 },
    colorScheme = 'light',
    baseUrl = null,
    allowProdRequests = false,
  } = typeof options === 'function' ? {} : options || {};
  const callback = typeof options === 'function' ? options : fn;

  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    colorScheme,
  });
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  const prodRequests = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err?.message || String(err));
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  await page.route('**/*', (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.includes(PROD_REF)) {
      prodRequests.push(reqUrl);
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  try {
    if (baseUrl) {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    }
    const result = await callback(page, {
      context,
      browser,
      pageErrors,
      consoleErrors,
      prodRequests,
    });
    if (!allowProdRequests) {
      assert.equal(
        prodRequests.length,
        0,
        `PROD network guard triggered: requests to ${PROD_REF}: ${prodRequests.join(', ')}`
      );
    }
    return result;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function killProcessTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32' && child.pid) {
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    try {
      child.kill();
    } catch {
      // Ignore already exited child
    }
  }
}

export function scanNextBuildForLeaks() {
  const nextDir = workspacePath('.next');
  if (!fs.existsSync(nextDir)) {
    return { exists: false, devHits: 0, prodHits: 0, sampleProdFiles: [] };
  }
  const scanRoots = ['static', 'server']
    .map((sub) => path.join(nextDir, sub))
    .filter((p) => fs.existsSync(p));
  let devHits = 0;
  let prodHits = 0;
  const sampleProdFiles = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(js|mjs|cjs|html|json|txt)$/i.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(DEV_REF)) devHits += 1;
        if (content.includes(PROD_REF)) {
          prodHits += 1;
          if (sampleProdFiles.length < 5) {
            sampleProdFiles.push(path.relative(ROOT_DIR, full).replace(/\\/g, '/'));
          }
        }
      }
    }
  }

  for (const r of scanRoots) walk(r);
  return { exists: true, devHits, prodHits, sampleProdFiles };
}

export async function ensureWebServer(t, options = {}) {
  const { envDev } = loadDevEnv();
  const explicitUrl = (
    process.env.E2E_BASE_URL ||
    process.env.APP_BASE_URL ||
    envDev.E2E_BASE_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (explicitUrl) {
    const res = await fetch(explicitUrl);
    assert.ok(
      res.status >= 200 && res.status < 400,
      `Configured E2E_BASE_URL (${explicitUrl}) returned HTTP ${res.status}`
    );
    return { baseUrl: explicitUrl, managed: false, stop: async () => {} };
  }

  const nextBin = workspacePath('node_modules/next/dist/bin/next');
  if (!fs.existsSync(nextBin)) {
    requireDeliverableOrDryRunSkip(
      t,
      false,
      'node_modules/next/dist/bin/next not found to launch ephemeral DEV server'
    );
    return null;
  }

  const nextScan = scanNextBuildForLeaks();
  let mode = options.mode;
  if (!mode) {
    mode = nextScan.exists && nextScan.prodHits === 0 && nextScan.devHits > 0 ? 'start' : 'dev';
  }
  if (mode === 'start' && (!nextScan.exists || nextScan.prodHits > 0)) {
    if (isDryRunMode()) {
      t.skip(
        `DRY_RUN: .next build not DEV-ready (exists=${nextScan.exists}, prodHits=${nextScan.prodHits})`
      );
      return null;
    }
    assert.fail(
      `.next build is missing or tainted with PROD host (${PROD_REF}): ${JSON.stringify(nextScan)}`
    );
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(
    process.execPath,
    [nextBin, mode, '-H', '127.0.0.1', '-p', String(port)],
    {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: mode === 'start' ? 'production' : 'development',
        NEXT_PUBLIC_APP_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: envDev.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: envDev.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }
  );

  let stderrTail = '';
  child.stderr?.on('data', (chunk) => {
    stderrTail = (stderrTail + chunk.toString()).slice(-1500);
  });

  const stop = async () => {
    killProcessTree(child);
  };
  if (t && typeof t.after === 'function') {
    t.after(stop);
  }

  const deadline = Date.now() + (options.timeoutMs || 45000);
  let ready = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      const existingMatch = stderrTail.match(/Local:\s*(https?:\/\/[^\s]+)/i);
      if (/Another next dev server is already running/i.test(stderrTail) && existingMatch) {
        const existingUrl = existingMatch[1].replace(/\/+$/, '');
        try {
          const probe = await fetch(`${existingUrl}/`);
          if (probe.status === 200) {
            return { baseUrl: existingUrl, managed: false, mode, stop: async () => {} };
          }
        } catch {
          // Fall through to throw
        }
      }
      throw new Error(
        `Next.js (${mode}) exited prematurely with code ${child.exitCode}: ${stderrTail}`
      );
    }
    try {
      const res = await fetch(`${baseUrl}/`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // Server still booting
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  if (!ready) {
    await stop();
    throw new Error(
      `Timed out waiting for ephemeral Next.js (${mode}) server at ${baseUrl}: ${stderrTail}`
    );
  }

  return { baseUrl, managed: true, mode, stop };
}

function normalizeColorHex(color) {
  if (!color) return '';
  const c = String(color).trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
    }
    return c;
  }
  const rgb = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const toHex = (n) => Number(n).toString(16).padStart(2, '0');
    return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
  }
  return c;
}

function parseSvgStringDescriptor(svgMarkup) {
  const svgMatch = svgMarkup.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!svgMatch) {
    return null;
  }
  const svgAttrs = svgMatch[1] || '';
  const inner = svgMatch[2] || '';

  const readAttr = (attrStr, name) => {
    const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
    const m = attrStr.match(re);
    return m ? (m[1] ?? m[2] ?? '') : '';
  };

  const paths = [];
  const pathRe = /<path\b([^>]*?)(?:\/>|>([\s\S]*?)<\/path>)/gi;
  for (const m of inner.matchAll(pathRe)) {
    const attrs = m[1] || '';
    paths.push({
      d: readAttr(attrs, 'd'),
      fill: readAttr(attrs, 'fill'),
      stroke: readAttr(attrs, 'stroke'),
      strokeWidth: readAttr(attrs, 'stroke-width') || readAttr(attrs, 'strokeWidth'),
      strokeLinecap: readAttr(attrs, 'stroke-linecap') || readAttr(attrs, 'strokeLinecap'),
      strokeLinejoin: readAttr(attrs, 'stroke-linejoin') || readAttr(attrs, 'strokeLinejoin'),
    });
  }

  const rectsCount = (inner.match(/<rect\b/gi) || []).length;
  const circlesCount = (inner.match(/<circle\b/gi) || []).length;
  const ellipsesCount = (inner.match(/<ellipse\b/gi) || []).length;

  const texts = [];
  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  for (const m of inner.matchAll(textRe)) {
    const attrs = m[1] || '';
    const body = m[2] || '';
    const tspanMatches = [...body.matchAll(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/gi)];
    const tspanColors = tspanMatches.map((tm) => ({
      text: (tm[2] || '').replace(/<[^>]+>/g, '').trim(),
      fill: normalizeColorHex(readAttr(tm[1] || '', 'fill')),
    }));
    texts.push({
      text: body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      fill: normalizeColorHex(readAttr(attrs, 'fill')),
      fontFamily: readAttr(attrs, 'font-family') || readAttr(attrs, 'fontFamily'),
      tspans: tspanColors,
    });
  }

  return {
    viewBox: readAttr(svgAttrs, 'viewBox'),
    fill: readAttr(svgAttrs, 'fill'),
    rectsCount,
    circlesCount,
    ellipsesCount,
    paths,
    texts,
    rawInner: inner,
  };
}

export function validateConcept2Svg(svgInput, options = {}) {
  const {
    variant = null,
    requireWordmark = true,
    strictGeometry = false,
  } = options;
  const errors = [];

  const desc =
    typeof svgInput === 'string' ? parseSvgStringDescriptor(svgInput) : svgInput;

  if (!desc) {
    return { ok: false, errors: ['Missing or invalid <svg> element'], details: null };
  }

  if (Number(desc.rectsCount || 0) > 0) {
    errors.push(`Concept 2 violation: found ${desc.rectsCount} <rect> element(s) (enclosing box prohibited)`);
  }
  if (Number(desc.circlesCount || 0) > 0 || Number(desc.ellipsesCount || 0) > 0) {
    errors.push(
      `Concept 2 violation: found <circle>/<ellipse> elements (dot prohibited)`
    );
  }

  const svgFill = String(desc.fill || '').trim().toLowerCase();
  const paths = Array.isArray(desc.paths) ? desc.paths : [];
  if (paths.length === 0) {
    errors.push('Concept 2 violation: no <path> Alpha-Checkmark geometry found');
  } else {
    const alphaPath = paths.find((p) => {
      const dNorm = String(p.d || '').replace(/\s+/g, ' ').trim();
      return /^M\s*\d+.*\bC\b.*\bL\b/i.test(dNorm);
    });
    if (!alphaPath) {
      errors.push('Concept 2 violation: missing open-stroke Alpha-Checkmark curve (M ... C ... L ...)');
    } else {
      const pathFill = String(alphaPath.fill || svgFill || '').trim().toLowerCase();
      if (pathFill && pathFill !== 'none') {
        errors.push(`Concept 2 violation: Alpha-Checkmark path fill must be "none", got "${pathFill}"`);
      }
      if (!svgFill && !String(alphaPath.fill || '').trim()) {
        errors.push('Concept 2 violation: <svg> or <path> must explicitly specify fill="none"');
      }
      const cap = String(alphaPath.strokeLinecap || '').trim().toLowerCase();
      const join = String(alphaPath.strokeLinejoin || '').trim().toLowerCase();
      if (cap !== 'round' || join !== 'round') {
        errors.push(
          `Concept 2 violation: stroke-linecap/linejoin must be "round"/"round", got "${cap}"/"${join}"`
        );
      }
      if (/Z\s*$/i.test(String(alphaPath.d || '').trim())) {
        errors.push('Concept 2 violation: Alpha-Checkmark path must be open-stroke (no closing Z)');
      }
    }

    const suspiciousBoxPath = paths.find((p) => {
      const dNorm = String(p.d || '').trim();
      return /^M[\d\s.,-]+(H|V|L)[\d\s.,-]+(H|V|L)[\d\s.,-]+(H|V|L)[\d\s.,-]+Z$/i.test(dNorm);
    });
    if (suspiciousBoxPath) {
      errors.push('Concept 2 violation: closed rectangular <path> box detected');
    }
  }

  const texts = Array.isArray(desc.texts) ? desc.texts : [];
  const combinedText = texts
    .map((t) => String(t.text || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/\bPOS\b/i.test(combinedText)) {
    errors.push(`Concept 2 violation: prohibited "POS" text found in logo lockup ("${combinedText}")`);
  }

  if (requireWordmark) {
    if (!combinedText.includes('ALPHOS')) {
      errors.push(`Concept 2 violation: missing "ALPHOS" wordmark in logo ("${combinedText}")`);
    }
    if (!/by\s+AlphaGen/i.test(combinedText)) {
      errors.push(`Concept 2 violation: missing "by AlphaGen" tagline in logo ("${combinedText}")`);
    }
  }

  if (variant && CONCEPT2_PALETTES[variant]) {
    const pal = CONCEPT2_PALETTES[variant];
    const strokes = paths.map((p) => normalizeColorHex(p.stroke)).filter(Boolean);
    if (!strokes.includes(pal.stroke)) {
      errors.push(
        `Concept 2 ${variant} palette violation: expected stroke ${pal.stroke}, got [${strokes.join(', ')}]`
      );
    }
    if (requireWordmark) {
      const alphosText = texts.find((t) => String(t.text || '').includes('ALPHOS'));
      const byText = texts.find((t) => /by\s+AlphaGen/i.test(String(t.text || '')));
      if (alphosText && normalizeColorHex(alphosText.fill) !== pal.alphosFill) {
        errors.push(
          `Concept 2 ${variant} palette violation: ALPHOS text fill expected ${pal.alphosFill}, got ${alphosText.fill}`
        );
      }
      if (byText && normalizeColorHex(byText.fill) !== pal.byFill) {
        errors.push(
          `Concept 2 ${variant} palette violation: "by" fill expected ${pal.byFill}, got ${byText.fill}`
        );
      }
      if (variant === 'thermal') {
        const nonMono = texts.find(
          (t) => !String(t.fontFamily || '').toLowerCase().includes('mono')
        );
        if (nonMono) {
          errors.push(
            `Concept 2 thermal font violation: expected monospace, got "${nonMono.fontFamily}"`
          );
        }
      } else if (byText?.tspans?.length) {
        const agSpan = byText.tspans.find((s) => /AlphaGen/i.test(s.text));
        if (agSpan && normalizeColorHex(agSpan.fill) !== pal.alphagenFill) {
          errors.push(
            `Concept 2 ${variant} palette violation: AlphaGen span fill expected ${pal.alphagenFill}, got ${agSpan.fill}`
          );
        }
      }
    }
    if (strictGeometry) {
      if (String(desc.viewBox || '').trim() !== pal.viewBox) {
        errors.push(
          `Concept 2 ${variant} viewBox mismatch: expected "${pal.viewBox}", got "${desc.viewBox}"`
        );
      }
      const normExpected = CONCEPT2_PATHS[variant].replace(/\s+/g, ' ').trim();
      const matched = paths.some(
        (p) => String(p.d || '').replace(/\s+/g, ' ').trim() === normExpected
      );
      if (!matched) {
        errors.push(`Concept 2 ${variant} exact path geometry mismatch`);
      }
    }
  }

  return { ok: errors.length === 0, errors, details: desc };
}

export function assertConcept2Svg(svgInput, options = {}) {
  const res = validateConcept2Svg(svgInput, options);
  assert.ok(res.ok, res.errors.join(' | '));
  return res;
}

export async function extractLogoDescriptorsFromPage(page, selector = 'svg') {
  return page.evaluate((sel) => {
    const svgs = [...document.querySelectorAll(sel)];
    return svgs
      .filter((el) => {
        const text = (el.textContent || '').trim();
        return text.includes('ALPHOS') || el.closest('[data-alphos-logo], .brand, .brand-logo');
      })
      .map((el) => {
        const paths = [...el.querySelectorAll('path')].map((p) => {
          const cs = getComputedStyle(p);
          return {
            d: p.getAttribute('d') || '',
            fill: p.getAttribute('fill') || cs.fill || '',
            stroke: p.getAttribute('stroke') || cs.stroke || '',
            strokeWidth: p.getAttribute('stroke-width') || cs.strokeWidth || '',
            strokeLinecap: p.getAttribute('stroke-linecap') || cs.strokeLinecap || '',
            strokeLinejoin: p.getAttribute('stroke-linejoin') || cs.strokeLinejoin || '',
          };
        });
        const texts = [...el.querySelectorAll('text')].map((t) => {
          const cs = getComputedStyle(t);
          const tspans = [...t.querySelectorAll('tspan')].map((ts) => ({
            text: (ts.textContent || '').trim(),
            fill: ts.getAttribute('fill') || getComputedStyle(ts).fill || '',
          }));
          return {
            text: (t.textContent || '').replace(/\s+/g, ' ').trim(),
            fill: t.getAttribute('fill') || cs.fill || '',
            fontFamily: t.getAttribute('font-family') || cs.fontFamily || '',
            tspans,
          };
        });
        const rect = el.getBoundingClientRect();
        return {
          viewBox: el.getAttribute('viewBox') || '',
          fill: el.getAttribute('fill') || '',
          rectsCount: el.querySelectorAll('rect').length,
          circlesCount: el.querySelectorAll('circle').length,
          ellipsesCount: el.querySelectorAll('ellipse').length,
          paths,
          texts,
          width: rect.width,
          height: rect.height,
        };
      });
  }, selector);
}

export async function auditPageAntiUiSlop(page, options = {}) {
  const {
    checkContrast = true,
    checkOverflow = true,
    checkClipping = true,
    checkPlaceholders = true,
    maxOverlapArea = 4,
    interactiveSelectors = 'button, a, input, select, textarea, [role="tab"], [role="switch"], .nav-tab',
    overlapCheckSelectors = '[role="switch"], [role="tab"], button, input',
  } = options;

  const report = await page.evaluate(
    ({
      doContrast,
      doOverflow,
      doClipping,
      doPlaceholders,
      maxOverlap,
      interSel,
      overlapSel,
    }) => {
      const violations = [];
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;

      function isVisible(el) {
        const st = getComputedStyle(el);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) {
          return false;
        }
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }

      if (doOverflow) {
        const docSw = document.documentElement.scrollWidth;
        const bodySw = document.body ? document.body.scrollWidth : docSw;
        if (docSw > vw + 1) {
          violations.push(
            `Horizontal overflow: documentElement.scrollWidth (${docSw}) > clientWidth (${vw})`
          );
        }
        if (bodySw > vw + 1) {
          violations.push(
            `Horizontal overflow: body.scrollWidth (${bodySw}) > clientWidth (${vw})`
          );
        }
      }

      if (doClipping) {
        const controls = [...document.querySelectorAll(interSel)].filter(isVisible);
        for (const el of controls) {
          const r = el.getBoundingClientRect();
          const inScrollParent = Boolean(
            el.closest('.table-responsive, .nav-tabs, [data-horizontal-scroll]')
          );
          if (!inScrollParent && (r.right > vw + 2 || r.left < -2)) {
            violations.push(
              `Control clipped horizontally (${el.tagName}.${el.className}): left=${Math.round(r.left)} right=${Math.round(r.right)} vw=${vw}`
            );
          }
          const cs = getComputedStyle(el);
          if (
            (cs.overflowX === 'hidden' || cs.overflow === 'hidden') &&
            cs.textOverflow !== 'ellipsis' &&
            el.scrollWidth > el.clientWidth + 4
          ) {
            violations.push(
              `Clipped text inside ${el.tagName}: scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}`
            );
          }
        }

        const overlapEls = [...document.querySelectorAll(overlapSel)].filter(isVisible);
        for (let i = 0; i < overlapEls.length; i += 1) {
          for (let j = i + 1; j < overlapEls.length; j += 1) {
            const a = overlapEls[i];
            const b = overlapEls[j];
            if (a.contains(b) || b.contains(a)) continue;
            const sharedPwdWrap = a.closest('.input-password-wrap');
            if (sharedPwdWrap && sharedPwdWrap === b.closest('.input-password-wrap')) {
              const pairTags = `${a.tagName}:${b.tagName}`;
              if (pairTags === 'INPUT:BUTTON' || pairTags === 'BUTTON:INPUT') continue;
            }
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const ix = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
            const iy = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
            if (ix * iy > maxOverlap) {
              violations.push(
                `Overlapping interactive controls: "${(a.textContent || a.tagName).trim().slice(0, 24)}" overlaps "${(b.textContent || b.tagName).trim().slice(0, 24)}"`
              );
            }
          }
        }
      }

      function parseRgba(str) {
        const m = String(str || '').match(
          /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)/
        );
        if (!m) return null;
        return {
          r: Number(m[1]),
          g: Number(m[2]),
          b: Number(m[3]),
          a: m[4] === undefined ? 1 : Number(m[4]),
        };
      }

      function blendOver(fg, bg) {
        const alpha = fg.a;
        return {
          r: fg.r * alpha + bg.r * (1 - alpha),
          g: fg.g * alpha + bg.g * (1 - alpha),
          b: fg.b * alpha + bg.b * (1 - alpha),
          a: 1,
        };
      }

      function resolveBgColor(el) {
        const layers = [];
        let cur = el;
        while (cur && cur.nodeType === 1) {
          const parsed = parseRgba(getComputedStyle(cur).backgroundColor);
          if (parsed && parsed.a > 0) {
            layers.unshift(parsed);
            if (parsed.a >= 0.99) break;
          }
          cur = cur.parentElement;
        }
        let acc = { r: 255, g: 255, b: 255, a: 1 };
        for (const layer of layers) {
          acc = blendOver(layer, acc);
        }
        return acc;
      }

      function relLum(rgb) {
        const norm = [rgb.r, rgb.g, rgb.b].map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
      }

      function contrastRatio(c1, c2) {
        const l1 = relLum(c1);
        const l2 = relLum(c2);
        const hi = Math.max(l1, l2);
        const lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
      }

      const contrastSamples = [];
      if (doContrast) {
        const textEls = [
          ...document.querySelectorAll('h1, h2, h3, h4, p, div, li, small, strong, em, label, button, a, span, td, th, .badge, .alert'),
        ].filter(isVisible);
        for (const el of textEls) {
          const ownText = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join(' ')
            .trim();
          if (!ownText) continue;
          const st = getComputedStyle(el);
          const fg = parseRgba(st.color);
          if (!fg || fg.a === 0) continue;
          const bg = resolveBgColor(el);
          const effectiveFg = fg.a < 1 ? blendOver(fg, bg) : fg;
          const ratio = contrastRatio(effectiveFg, bg);
          const fontSize = parseFloat(st.fontSize) || 14;
          const fontWeight = parseInt(st.fontWeight, 10) || 400;
          const isLarge = fontSize >= 18.66 || (fontSize >= 14 && fontWeight >= 700);
          const minRatio = isLarge ? 3.0 : 4.5;
          contrastSamples.push({
            text: ownText.slice(0, 30),
            ratio: Number(ratio.toFixed(2)),
            minRatio,
          });
          if (ratio < minRatio) {
            violations.push(
              `Low contrast (${ratio.toFixed(2)}:1 < ${minRatio}:1) on "${ownText.slice(0, 32)}"`
            );
          }
        }
      }

      if (doPlaceholders) {
        const bodyText = (document.body?.innerText || '').trim();
        const forbidden = [
          { re: /\bLorem\s+ipsum\b/i, label: 'Lorem ipsum' },
          { re: /Toko Retail Anda/i, label: 'Toko Retail Anda' },
          { re: /Jl\.\s*Contoh/i, label: 'Jl. Contoh' },
          { re: /PT\s+POS\s+Retail\s+Indonesia/i, label: 'PT POS Retail Indonesia' },
          { re: /\[\s*(?:TBD|TODO)\s*\]/i, label: '[TBD]/[TODO]' },
          { re: /\bNaN\b/, label: 'NaN' },
          { re: /\[object Object\]/, label: '[object Object]' },
          { re: /\bundefined\b/, label: 'undefined' },
        ];
        for (const f of forbidden) {
          if (f.re.test(bodyText)) {
            violations.push(`Placeholder/broken UI text detected: ${f.label}`);
          }
        }
      }

      return {
        ok: violations.length === 0,
        violations,
        viewport: { width: vw, height: vh },
        scrollWidth: document.documentElement.scrollWidth,
        contrastCount: contrastSamples.length,
      };
    },
    {
      doContrast: checkContrast,
      doOverflow: checkOverflow,
      doClipping: checkClipping,
      doPlaceholders: checkPlaceholders,
      maxOverlap: maxOverlapArea,
      interSel: interactiveSelectors,
      overlapSel: overlapCheckSelectors,
    }
  );

  return report;
}

export async function assertPageAntiUiSlop(page, options = {}) {
  const report = await auditPageAntiUiSlop(page, options);
  assert.ok(report.ok, `Anti-UI-Slop violations: ${report.violations.join(' | ')}`);
  return report;
}

export function auditAntiAiSlop(text, options = {}) {
  const {
    kind = 'docs',
    requireBrandTerms = false,
    allowProhibitedExamples = false,
  } = options;
  const content = String(text || '');
  const violations = [];

  if (!content.trim()) {
    violations.push('Empty content');
    return { ok: false, violations };
  }

  const clichePatterns = [
    { re: /\bdelve\s+into\b/i, label: 'cliche: delve into' },
    { re: /\btapestry\s+of\b/i, label: 'cliche: tapestry of' },
    { re: /\bgame[-\s]?changer\b/i, label: 'cliche: game-changer' },
    { re: /\bseamless\s+synergy\b/i, label: 'cliche: seamless synergy' },
    { re: /\brevolutionize\b/i, label: 'cliche: revolutionize' },
    { re: /\bunleash\s+the\s+power\b/i, label: 'cliche: unleash the power' },
    { re: /\bin\s+today'?s\s+fast[-\s]?paced\s+world\b/i, label: "cliche: in today's fast-paced world" },
    { re: /\bas\s+an\s+ai\b/i, label: 'cliche: as an AI' },
    { re: /\btestament\s+to\b/i, label: 'cliche: testament to' },
    { re: /\bparadigm\s+shift\b/i, label: 'cliche: paradigm shift' },
  ];

  const placeholderPatterns = [
    { re: /\[\s*TBD\s*\]/i, label: 'placeholder: [TBD]' },
    { re: /\[\s*TODO\s*\]/i, label: 'placeholder: [TODO]' },
    { re: /\bTBD\b/, label: 'placeholder: TBD' },
    { re: /\{\{[^}]+\}\}/, label: 'unfilled template: {{...}}' },
    { re: /your-project-id/i, label: 'placeholder: your-project-id' },
    { re: /your-anon-public-key/i, label: 'placeholder: your-anon-public-key' },
    { re: /\blorem\s+ipsum\b/i, label: 'placeholder: Lorem ipsum' },
  ];

  const scanText = allowProhibitedExamples
    ? content
        .split(/\r?\n/)
        .filter(
          (line) =>
            !/(terlarang|larangan|dilarang|prohibited|forbidden|otomatis gagal|klise|hiperbolis|pengisi generik|anti-ai-slop|anti-ui-slop|hindari)/i.test(
              line
            )
        )
        .join('\n')
    : content;

  for (const p of clichePatterns) {
    if (p.re.test(scanText)) violations.push(p.label);
  }
  for (const p of placeholderPatterns) {
    if (p.re.test(scanText)) violations.push(p.label);
  }

  if (kind === 'docs' || kind === 'copy') {
    const paragraphs = content
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length >= 60);
    for (let i = 1; i < paragraphs.length; i += 1) {
      if (paragraphs[i] === paragraphs[i - 1]) {
        violations.push(`duplicated consecutive paragraph: "${paragraphs[i].slice(0, 40)}..."`);
      }
    }
  }

  if (requireBrandTerms) {
    if (!content.includes('ALPHOS')) violations.push('missing brand term: ALPHOS');
    if (!content.includes('AlphaGen')) violations.push('missing brand term: AlphaGen');
  }

  return { ok: violations.length === 0, violations };
}

export function assertAntiAiSlop(text, options = {}) {
  const res = auditAntiAiSlop(text, options);
  assert.ok(res.ok, `Anti-AI-Slop violations: ${res.violations.join(' | ')}`);
  return res;
}

export function decodeEscPosStream(bytesInput) {
  const bytes = bytesInput instanceof Uint8Array ? bytesInput : Uint8Array.from(bytesInput || []);
  const textBytes = [];
  let hasInit = false;
  let hasCut = false;
  let hasRasterLogo = false;

  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b === 0x1b) {
      const cmd = bytes[i + 1];
      if (cmd === 0x40) {
        hasInit = true;
        i += 2;
        continue;
      }
      if (cmd === 0x2a) {
        // ESC * m nL nH d1..dk (bit image)
        hasRasterLogo = true;
        const m = bytes[i + 2] ?? 0;
        const nL = bytes[i + 3] ?? 0;
        const nH = bytes[i + 4] ?? 0;
        const cols = nL + nH * 256;
        const bytesPerCol = m === 32 || m === 33 ? 3 : 1;
        i += 5 + cols * bytesPerCol;
        continue;
      }
      if ([0x21, 0x2d, 0x33, 0x45, 0x47, 0x4d, 0x61, 0x64, 0x74].includes(cmd)) {
        i += 3;
        continue;
      }
      i += 2;
      continue;
    }
    if (b === 0x1d) {
      const cmd = bytes[i + 1];
      if (cmd === 0x56) {
        hasCut = true;
        const m = bytes[i + 2];
        i += m === 65 || m === 66 ? 4 : 3;
        continue;
      }
      if (cmd === 0x76 && bytes[i + 2] === 0x30) {
        // GS v 0 m xL xH yL yH d1..dk (raster bitmap)
        hasRasterLogo = true;
        const xL = bytes[i + 4] ?? 0;
        const xH = bytes[i + 5] ?? 0;
        const yL = bytes[i + 6] ?? 0;
        const yH = bytes[i + 7] ?? 0;
        const widthBytes = xL + xH * 256;
        const heightDots = yL + yH * 256;
        i += 8 + widthBytes * heightDots;
        continue;
      }
      if ([0x21, 0x42, 0x48, 0x66, 0x68, 0x77].includes(cmd)) {
        i += 3;
        continue;
      }
      i += 2;
      continue;
    }
    textBytes.push(b);
    i += 1;
  }

  const text = Buffer.from(textBytes).toString('utf8');
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\r/g, ''));
  return { hasInit, hasCut, hasRasterLogo, text, lines };
}

export function validateEscPosPayload(bytesInput, expectations = {}) {
  const {
    paperWidth = '58mm',
    maxCols = paperWidth === '80mm' ? 48 : 32,
    requireLogoText = true,
    requiredSnippets = [],
  } = expectations;

  const decoded = decodeEscPosStream(bytesInput);
  const errors = [];

  if (!decoded.hasInit) {
    errors.push('Missing ESC @ (0x1B 0x40) printer initialization sequence');
  }
  if (!decoded.hasCut) {
    errors.push('Missing GS V (0x1D 0x56) paper cut sequence');
  }

  const headerRegion = decoded.lines.slice(0, 6).join('\n');
  if (requireLogoText) {
    if (!/ALPHOS/.test(decoded.text)) {
      errors.push('Thermal receipt missing "ALPHOS" brand header');
    }
    if (!/by\s+AlphaGen/i.test(decoded.text)) {
      errors.push('Thermal receipt missing "by AlphaGen" brand tagline');
    }
    if (/\bALPHOS\s+POS\b|\bPOS\s+ALPHOS\b/i.test(headerRegion)) {
      errors.push('Thermal logo header violates Concept 2: contains "POS" in ALPHOS lockup');
    }
  }

  for (let idx = 0; idx < decoded.lines.length; idx += 1) {
    const line = decoded.lines[idx];
    if (line.length > maxCols) {
      errors.push(
        `Line ${idx + 1} exceeds ${paperWidth} (${maxCols}-col) width: len=${line.length} ("${line}")`
      );
    }
  }

  if (/\b(NaN|undefined)\b|\[object Object\]/.test(decoded.text)) {
    errors.push('Thermal receipt contains invalid literal (NaN/undefined/[object Object])');
  }

  for (const snippet of requiredSnippets) {
    if (!decoded.text.includes(snippet)) {
      errors.push(`Thermal receipt missing expected text "${snippet}"`);
    }
  }

  return { ok: errors.length === 0, errors, ...decoded };
}

export function assertEscPosPayload(bytesInput, expectations = {}) {
  const res = validateEscPosPayload(bytesInput, expectations);
  assert.ok(res.ok, res.errors.join(' | '));
  return res;
}

export function scanFilesForProdLeak(relFiles, options = {}) {
  const { allowExclusionMentions = false } = options;
  const leaks = [];
  for (const rel of relFiles) {
    if (!workspaceFileExists(rel)) continue;
    const content = readWorkspaceFile(rel);
    if (!content.includes(PROD_REF)) continue;
    if (allowExclusionMentions) {
      const lines = content.split(/\r?\n/);
      const badLines = lines.filter((line) => {
        if (!line.includes(PROD_REF)) return false;
        const safeNotice =
          /(untouched|tidak disentuh|tidak tersentuh|tidak pernah|dilarang|forbidden|prohibited|excluded|bukan|never|not\s+touched|read-only|isolated|blocked|`?0`?\s*(mutasi|perubahan|migrasi|write|deployment)|promosi.*prod)/i.test(
            line
          );
        const looksLikeActiveEndpoint = new RegExp(`https:\\/\\/${PROD_REF}\\.supabase\\.co`).test(line);
        return looksLikeActiveEndpoint || !safeNotice;
      });
      if (badLines.length > 0) {
        leaks.push({ file: rel, count: badLines.length, sample: badLines[0].trim().slice(0, 120) });
      }
    } else {
      leaks.push({ file: rel, count: 1, sample: PROD_REF });
    }
  }
  return leaks;
}

export function getSharedCorePaths() {
  return [
    'src/types/pos.ts',
    'src/utils/pricing.ts',
    'src/utils/format.ts',
    'src/utils/csv.ts',
    'src/i18n/translations.ts',
  ];
}

export function listDocHtmlFiles() {
  const dir = workspacePath('docs/html');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^0[1-5].*\.html$/i.test(f))
    .sort()
    .map((f) => `docs/html/${f}`);
}

export function listDocPdfFiles() {
  const dir = workspacePath('docs/pdf');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^0[1-5].*\.pdf$/i.test(f))
    .sort()
    .map((f) => `docs/pdf/${f}`);
}

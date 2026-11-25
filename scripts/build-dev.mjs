import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const EXPECTED_DEV_HOST = 'tcbhaiyhtndnqgatysmh.supabase.co';
const EXPECTED_DEV_REF = 'tcbhaiyhtndnqgatysmh';
const FORBIDDEN_PROD_REF = 'sbtzajhgchpcdscrwtha';
const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.html', '.json', '.txt', '.rsc']);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required DEV env file: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function validateDevEnvironment(envDev) {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? envDev.NEXT_PUBLIC_APP_ENV;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? envDev.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? envDev.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (appEnv !== 'development') {
    throw new Error(
      `[DEV GUARD] NEXT_PUBLIC_APP_ENV must be "development", got "${String(appEnv || '')}".`
    );
  }

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error('[DEV GUARD] NEXT_PUBLIC_SUPABASE_URL is missing.');
  }

  if (supabaseUrl.includes(FORBIDDEN_PROD_REF) || supabaseUrl.includes('your-project-id')) {
    throw new Error('[DEV GUARD] Forbidden PROD or placeholder Supabase URL detected.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(`[DEV GUARD] Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  }

  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== EXPECTED_DEV_HOST) {
    throw new Error(
      `[DEV GUARD] Expected Supabase host ${EXPECTED_DEV_HOST}, got ${parsedUrl.hostname}.`
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-public-key')) {
    throw new Error('[DEV GUARD] Missing or placeholder NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return { appEnv, supabaseUrl, supabaseAnonKey };
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function scanNextOutput() {
  const staticDir = path.join(ROOT_DIR, '.next', 'static');
  const serverDir = path.join(ROOT_DIR, '.next', 'server');
  const exists = fs.existsSync(staticDir) && fs.existsSync(serverDir);
  if (!exists) {
    return { exists: false, devHits: 0, prodHits: 0, prodFiles: [] };
  }

  const files = [...walkFiles(staticDir), ...walkFiles(serverDir)];
  let devHits = 0;
  let prodHits = 0;
  const prodFiles = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(EXPECTED_DEV_REF)) {
      devHits += 1;
    }
    if (content.includes(FORBIDDEN_PROD_REF)) {
      prodHits += 1;
      prodFiles.push(path.relative(ROOT_DIR, file));
    }
  }

  return { exists: true, devHits, prodHits, prodFiles };
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const startMode = args.includes('--start');
  const passthroughArgs = args.filter((a) => a !== '--check-only' && a !== '--start');

  const envDev = parseEnvFile(path.join(ROOT_DIR, '.env.development'));
  const validated = validateDevEnvironment(envDev);

  if (checkOnly) {
    console.log(
      `[DEV GUARD] Check passed (NEXT_PUBLIC_APP_ENV=${validated.appEnv}, target=${EXPECTED_DEV_REF})`
    );
    return;
  }

  const nextBin = path.join(ROOT_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next.js CLI binary not found at ${nextBin}`);
  }

  const childEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_ENV: validated.appEnv,
    NEXT_PUBLIC_SUPABASE_URL: validated.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: validated.supabaseAnonKey,
  };

  if (startMode) {
    const preScan = scanNextOutput();
    if (!preScan.exists) {
      throw new Error('[DEV GUARD] .next build not found. Run "npm run build:dev" first.');
    }
    if (preScan.prodHits > 0 || preScan.devHits === 0) {
      throw new Error(
        `[DEV GUARD] Refusing to start: .next scan failed (devHits=${preScan.devHits}, prodHits=${preScan.prodHits}, files=${preScan.prodFiles.join(', ')})`
      );
    }
    console.log(
      `[DEV GUARD] Starting DEV server (devHits=${preScan.devHits}, prodHits=${preScan.prodHits})`
    );
    const res = spawnSync(process.execPath, [nextBin, 'start', ...passthroughArgs], {
      cwd: ROOT_DIR,
      env: childEnv,
      stdio: 'inherit',
    });
    process.exit(res.status ?? 1);
  }

  const nextDir = path.join(ROOT_DIR, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }

  console.log(`[DEV GUARD] Building Next.js app strictly for DEV (${EXPECTED_DEV_REF})...`);
  execFileSync(process.execPath, [nextBin, 'build', ...passthroughArgs], {
    cwd: ROOT_DIR,
    env: childEnv,
    stdio: 'inherit',
  });

  const postScan = scanNextOutput();
  console.log(
    `[DEV GUARD] Post-build .next scan: exists=${postScan.exists}, devHits=${postScan.devHits}, prodHits=${postScan.prodHits}`
  );

  if (!postScan.exists || postScan.prodHits > 0 || postScan.devHits === 0) {
    throw new Error(
      `[DEV GUARD] Post-build verification failed: devHits=${postScan.devHits}, prodHits=${postScan.prodHits}, prodFiles=${postScan.prodFiles.join(', ')}`
    );
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

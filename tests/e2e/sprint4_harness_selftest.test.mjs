import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANTI_UI_VIEWPORTS,
  DEV_REF,
  OFFICIAL_CONCEPT2_SVGS,
  PROD_REF,
  auditAntiAiSlop,
  auditPageAntiUiSlop,
  extractLogoDescriptorsFromPage,
  loadPlaywright,
  requireDeliverableOrDryRunSkip,
  validateConcept2Svg,
  validateEscPosPayload,
  withBrowserPage,
} from './sprint4_helpers.mjs';

function buildEscPosBytes(lines, { withInit = true, withCut = true, withRaster = false } = {}) {
  const chunks = [];
  if (withInit) chunks.push(Buffer.from([0x1b, 0x40]));
  if (withRaster) {
    // GS v 0 m xL xH yL yH + 2x2 dummy raster bytes (4 bytes total)
    chunks.push(Buffer.from([0x1d, 0x76, 0x30, 0x00, 0x02, 0x00, 0x02, 0x00, 0xff, 0x81, 0x81, 0xff]));
  }
  chunks.push(Buffer.from(lines.join('\n') + '\n', 'utf8'));
  if (withCut) chunks.push(Buffer.from([0x1d, 0x56, 0x00]));
  return Buffer.concat(chunks);
}

describe('Sprint 4 Harness Self-Test (Positive & Negative Validators)', () => {
  it('SH-01: Concept 2 SVG validator passes all 4 official variants (string + live DOM)', async () => {
    for (const variant of ['horizontal', 'vertical', 'light', 'thermal']) {
      const res = validateConcept2Svg(OFFICIAL_CONCEPT2_SVGS[variant], {
        variant,
        strictGeometry: true,
      });
      assert.equal(
        res.ok,
        true,
        `Official ${variant} SVG failed validation: ${res.errors.join(' | ')}`
      );
    }

    await withBrowserPage({ viewport: { width: 1024, height: 768 } }, async (page) => {
      await page.setContent(`
        <!doctype html>
        <html lang="id">
          <body style="background:#090e1a;margin:0;padding:16px;">
            <div data-alphos-logo="horizontal">${OFFICIAL_CONCEPT2_SVGS.horizontal}</div>
            <div data-alphos-logo="vertical">${OFFICIAL_CONCEPT2_SVGS.vertical}</div>
            <div data-alphos-logo="light" style="background:#ffffff;padding:8px;">${OFFICIAL_CONCEPT2_SVGS.light}</div>
            <div data-alphos-logo="thermal" style="background:#f8fafc;padding:8px;">${OFFICIAL_CONCEPT2_SVGS.thermal}</div>
          </body>
        </html>
      `);
      const descriptors = await extractLogoDescriptorsFromPage(page);
      assert.equal(descriptors.length, 4);
      const variants = ['horizontal', 'vertical', 'light', 'thermal'];
      for (let i = 0; i < variants.length; i += 1) {
        const res = validateConcept2Svg(descriptors[i], {
          variant: variants[i],
          strictGeometry: true,
        });
        assert.equal(res.ok, true, `DOM ${variants[i]} failed: ${res.errors.join(' | ')}`);
      }
    });
  });

  it('SH-02: Concept 2 SVG validator rejects box (<rect>), dot (<circle>), "POS" text, and bad palette', () => {
    const withBox = OFFICIAL_CONCEPT2_SVGS.horizontal.replace(
      '<g transform',
      '<rect x="2" y="2" width="56" height="56" rx="8" stroke="#10B981"/><g transform'
    );
    const boxRes = validateConcept2Svg(withBox, { variant: 'horizontal' });
    assert.equal(boxRes.ok, false);
    assert.ok(boxRes.errors.some((e) => /<rect>/i.test(e)));

    const withDot = OFFICIAL_CONCEPT2_SVGS.horizontal.replace(
      '</g>',
      '<circle cx="52" cy="18" r="4" fill="#10B981"/></g>'
    );
    const dotRes = validateConcept2Svg(withDot, { variant: 'horizontal' });
    assert.equal(dotRes.ok, false);
    assert.ok(dotRes.errors.some((e) => /<circle>/i.test(e)));

    const withPos = OFFICIAL_CONCEPT2_SVGS.horizontal.replace('>ALPHOS<', '>ALPHOS POS<');
    const posRes = validateConcept2Svg(withPos, { variant: 'horizontal' });
    assert.equal(posRes.ok, false);
    assert.ok(posRes.errors.some((e) => /POS/i.test(e)));

    const wrongColor = OFFICIAL_CONCEPT2_SVGS.light;
    const palRes = validateConcept2Svg(wrongColor, { variant: 'horizontal' });
    assert.equal(palRes.ok, false);
    assert.ok(palRes.errors.some((e) => /palette violation/i.test(e)));
  });

  it('SH-03: Anti-UI-Slop Playwright probe passes clean responsive high-contrast layout across 3 viewports', async () => {
    const cleanHtml = `
      <!doctype html>
      <html lang="id">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }
            header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #090e1a; color: #f8fafc; gap: 12px; flex-wrap: wrap; }
            main { padding: 16px; max-width: 960px; margin: 0 auto; }
            .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
            button { background: #047857; color: #ffffff; border: 0; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          </style>
        </head>
        <body>
          <header>
            <div data-alphos-logo="horizontal">${OFFICIAL_CONCEPT2_SVGS.horizontal}</div>
            <button type="button">Masuk</button>
          </header>
          <main>
            <section class="card">
              <h1>ALPHOS Kasir</h1>
              <p>Ringkasan transaksi harian toko siap diproses pada lingkungan DEV.</p>
            </section>
          </main>
        </body>
      </html>
    `;

    await withBrowserPage({ viewport: ANTI_UI_VIEWPORTS[0] }, async (page) => {
      await page.setContent(cleanHtml);
      for (const vp of ANTI_UI_VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const audit = await auditPageAntiUiSlop(page);
        assert.equal(
          audit.ok,
          true,
          `Clean layout failed at ${vp.width}x${vp.height}: ${audit.violations.join(' | ')}`
        );
      }
    });
  });

  it('SH-04: Anti-UI-Slop Playwright probe catches horizontal overflow, low contrast, overlap, clipping, and placeholder text', async () => {
    await withBrowserPage({ viewport: { width: 375, height: 812 } }, async (page) => {
      await page.setContent(`
        <!doctype html>
        <html lang="id">
          <body style="margin:0;background:#ffffff;color:#0f172a;font-family:system-ui,sans-serif;">
            <div style="width:520px;background:#ffffff;color:#94a3b8;font-size:14px;">
              Lorem ipsum low contrast overflow text from Toko Retail Anda
            </div>
            <button style="position:fixed;top:10px;left:10px;width:120px;height:40px;background:#047857;color:#fff;">Btn A</button>
            <button style="position:fixed;top:15px;left:30px;width:120px;height:40px;background:#047857;color:#fff;">Btn B</button>
            <button style="width:45px;overflow:hidden;white-space:nowrap;background:#047857;color:#fff;">VeryLongClippedButtonLabel</button>
          </body>
        </html>
      `);
      const audit = await auditPageAntiUiSlop(page);
      assert.equal(audit.ok, false);
      assert.ok(audit.violations.some((v) => /Horizontal overflow/i.test(v)), 'Expected overflow catch');
      assert.ok(audit.violations.some((v) => /Low contrast/i.test(v)), 'Expected contrast catch');
      assert.ok(audit.violations.some((v) => /Overlapping/i.test(v)), 'Expected overlap catch');
      assert.ok(audit.violations.some((v) => /Clipped text/i.test(v)), 'Expected clipped text catch');
      assert.ok(audit.violations.some((v) => /Lorem ipsum/i.test(v)), 'Expected Lorem ipsum catch');
      assert.ok(audit.violations.some((v) => /Toko Retail Anda/i.test(v)), 'Expected placeholder store catch');
    });
  });

  it('SH-05: Anti-AI-Slop checker passes crisp copy and catches cliches, [TBD], and duplicated paragraphs', () => {
    const goodCopy = `
ALPHOS v1.4.0 by AlphaGen menyatukan kasir web Next.js dan aplikasi kasir Android React Native pada satu Shared Core tanpa duplikasi kalkulasi harga.

Setiap transaksi diuji pada Supabase DEV sebelum rilis didokumentasikan dalam 5 berkas PDF resmi.
    `;
    const goodRes = auditAntiAiSlop(goodCopy, { kind: 'copy', requireBrandTerms: true });
    assert.equal(goodRes.ok, true, `Unexpected violations: ${goodRes.violations.join(' | ')}`);

    const badCopy = `
In today's fast-paced world, let us delve into this game-changer platform with seamless synergy that will revolutionize retail. [TBD]

Paragraf ini sengaja diulang secara persis untuk menguji detektor duplikasi konten dokumentasi pada rilis Sprint 4.

Paragraf ini sengaja diulang secara persis untuk menguji detektor duplikasi konten dokumentasi pada rilis Sprint 4.
    `;
    const badRes = auditAntiAiSlop(badCopy, { kind: 'docs' });
    assert.equal(badRes.ok, false);
    assert.ok(badRes.violations.some((v) => /delve into/i.test(v)));
    assert.ok(badRes.violations.some((v) => /game-changer/i.test(v)));
    assert.ok(badRes.violations.some((v) => /seamless synergy/i.test(v)));
    assert.ok(badRes.violations.some((v) => /TBD/i.test(v)));
    assert.ok(badRes.violations.some((v) => /duplicated consecutive paragraph/i.test(v)));
  });

  it('SH-06: ESC/POS validator passes valid 58mm/80mm buffers (with raster) and rejects missing ESC @, width overflow, and "ALPHOS POS"', () => {
    const valid58 = buildEscPosBytes(
      [
        'ALPHOS',
        'by AlphaGen',
        'ALPHOS Flagship DEV',
        '--------------------------------',
        'INV-20261124-100001-123',
        'Kopi Arabika x2        Rp 40.000',
        'PPN (11%)               Rp 4.400',
        'TOTAL                  Rp 44.400',
        'Bayar (Cash)           Rp 50.000',
        'Kembali                 Rp 5.600',
      ],
      { withInit: true, withCut: true, withRaster: true }
    );
    const ok58 = validateEscPosPayload(valid58, {
      paperWidth: '58mm',
      requiredSnippets: ['INV-20261124-100001-123', 'Rp 44.400'],
    });
    assert.equal(ok58.ok, true, `Valid 58mm failed: ${ok58.errors.join(' | ')}`);
    assert.equal(ok58.hasRasterLogo, true);

    const valid80 = buildEscPosBytes(
      [
        'ALPHOS',
        'by AlphaGen',
        'Kopi Arabika 250g x2              Rp 40.000',
      ],
      { withInit: true, withCut: true }
    );
    assert.equal(validateEscPosPayload(valid80, { paperWidth: '80mm' }).ok, true);

    const badBuf = buildEscPosBytes(
      [
        'ALPHOS POS',
        'by AlphaGen',
        'Baris ini melebihi batas tiga puluh dua karakter untuk kertas 58mm',
        'Total: NaN',
      ],
      { withInit: false, withCut: false }
    );
    const badRes = validateEscPosPayload(badBuf, { paperWidth: '58mm' });
    assert.equal(badRes.ok, false);
    assert.ok(badRes.errors.some((e) => /ESC @/.test(e)));
    assert.ok(badRes.errors.some((e) => /GS V/.test(e)));
    assert.ok(badRes.errors.some((e) => /Concept 2/.test(e)));
    assert.ok(badRes.errors.some((e) => /58mm/.test(e)));
    assert.ok(badRes.errors.some((e) => /NaN/.test(e)));
  });

  it('SH-07: Playwright ESM loader + PROD network guard intercepts sbtzajhgchpcdscrwtha while allowing DEV', async () => {
    const pw = await loadPlaywright();
    assert.equal(typeof pw.chromium.launch, 'function');

    await assert.rejects(async () => {
      await withBrowserPage({ viewport: { width: 800, height: 600 } }, async (page) => {
        await page.setContent('<html><body><p>Guard Test</p></body></html>');
        await page.evaluate(async (prodUrl) => {
          await fetch(prodUrl).catch(() => {});
        }, `https://${PROD_REF}.supabase.co/rest/v1/products`);
      });
    }, /PROD network guard triggered/);

    const devOk = await withBrowserPage({ viewport: { width: 800, height: 600 } }, async (page, ctx) => {
      await page.setContent(`<html><body><p>DEV ${DEV_REF}</p></body></html>`);
      return ctx.prodRequests.length;
    });
    assert.equal(devOk, 0);
  });

  it('SH-08: requireDeliverableOrDryRunSkip enforces strict failure when E2E_DRY_RUN is unset and skips when E2E_DRY_RUN=1', async (t) => {
    const prevDry = process.env.E2E_DRY_RUN;
    try {
      delete process.env.E2E_DRY_RUN;
      assert.throws(
        () => requireDeliverableOrDryRunSkip(t, false, 'missing artifact'),
        /missing artifact/
      );

      let skippedMsg = null;
      const fakeT = { skip: (m) => { skippedMsg = m; } };
      process.env.E2E_DRY_RUN = '1';
      const ok = requireDeliverableOrDryRunSkip(fakeT, false, 'missing artifact');
      assert.equal(ok, false);
      assert.equal(skippedMsg, 'DRY_RUN: missing artifact');
    } finally {
      if (prevDry === undefined) delete process.env.E2E_DRY_RUN;
      else process.env.E2E_DRY_RUN = prevDry;
    }
  });
});

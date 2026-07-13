const fs = require('fs');
const path = require('path');

const DEFAULT_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
];

function candidatosChrome() {
  const env = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
  ].filter(Boolean);

  const unix = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];

  const win = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);

  return [...env, ...(process.platform === 'win32' ? win : unix)];
}

function resolverExecutablePath() {
  for (const p of candidatosChrome()) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Lanza Chromium/Chrome para HTML→PDF.
 * Docker: instalar `chromium` y/o definir PUPPETEER_EXECUTABLE_PATH.
 */
async function launchBrowser() {
  const puppeteer = require('puppeteer-core');
  const executablePath = resolverExecutablePath();
  if (!executablePath) {
    const err = new Error(
      'No se encontró Chrome/Chromium para generar PDF. Instálelo o configure PUPPETEER_EXECUTABLE_PATH.',
    );
    err.status = 503;
    throw err;
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: DEFAULT_ARGS,
  });
}

/**
 * Convierte HTML a buffer PDF (respeta @page size del certificado).
 * @param {import('puppeteer-core').Browser} browser
 * @param {string} html
 */
async function htmlToPdfBuffer(browser, html) {
  const page = await browser.newPage();
  try {
    await page.emulateMediaType('print');
    await page.setContent(String(html || ''), {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
      timeout: 90_000,
    });
    await page.evaluate(async () => {
      const imgs = Array.from(document.images || []);
      await Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
        ),
      );
    });
    const buf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(buf);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Une varios PDF en uno (orden de `buffers`).
 * @param {Buffer[]} buffers
 */
async function mergePdfBuffers(buffers) {
  const { PDFDocument } = require('pdf-lib');
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    if (!buf || !buf.length) continue;
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const p of pages) merged.addPage(p);
  }
  if (merged.getPageCount() === 0) {
    const err = new Error('No se pudo armar el PDF combinado.');
    err.status = 500;
    throw err;
  }
  return Buffer.from(await merged.save());
}

module.exports = {
  launchBrowser,
  htmlToPdfBuffer,
  mergePdfBuffers,
  resolverExecutablePath,
};

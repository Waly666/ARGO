/** URL pública bajo /uploads/ (relativa al host que sirve el portal o ERP). */
function publicUploadUrl(relative) {
  let rel = String(relative || '').trim();
  if (!rel) return null;

  if (/^https?:\/\//i.test(rel)) {
    try {
      const pathname = new URL(rel).pathname;
      const idx = pathname.indexOf('/uploads/');
      if (idx >= 0) return pathname.slice(idx);
    } catch {
      return null;
    }
  }

  rel = rel.replace(/^\/+/, '');
  if (rel.startsWith('uploads/')) rel = rel.slice('uploads/'.length);
  return `/uploads/${rel}`;
}

module.exports = { publicUploadUrl };

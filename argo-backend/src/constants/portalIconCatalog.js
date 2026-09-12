/** Merge de iconografía personalizada del portal (galería de iconos ERP). */

const PORTAL_ICON_KINDS = new Set(['builtin', 'emoji', 'alias', 'image']);

const PORTAL_ICONOGRAFIA_DEFAULTS = {
  custom: [],
  hiddenBuiltin: [],
};

function trim(value) {
  return String(value ?? '').trim();
}

function mergePortalIconografia(raw) {
  const d = PORTAL_ICONOGRAFIA_DEFAULTS;
  const src = raw && typeof raw === 'object' ? raw : {};
  const hiddenBuiltin = Array.isArray(src.hiddenBuiltin)
    ? src.hiddenBuiltin.map((s) => trim(s)).filter(Boolean)
    : d.hiddenBuiltin;
  const custom = [];
  for (const item of src.custom || []) {
    const slug = trim(item?.slug);
    const value = trim(item?.value);
    if (!slug || !value) continue;
    const kind = PORTAL_ICON_KINDS.has(item?.kind) ? item.kind : 'emoji';
    custom.push({
      id: trim(item?.id) || `custom:${slug}`,
      slug,
      label: trim(item?.label) || slug,
      category: trim(item?.category) || 'general',
      kind,
      value,
      activo: item?.activo !== false,
    });
  }
  return { custom, hiddenBuiltin };
}

module.exports = {
  PORTAL_ICONOGRAFIA_DEFAULTS,
  mergePortalIconografia,
};

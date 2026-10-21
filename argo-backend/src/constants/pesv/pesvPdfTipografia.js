const FUENTES_PDF = [
  { id: 'helvetica', label: 'Helvetica / Arial' },
  { id: 'times', label: 'Times New Roman' },
  { id: 'courier', label: 'Courier' },
  { id: 'calibri', label: 'Calibri' },
];

const DEFAULT_TIPOGRAFIA_BLOQUE = {
  familia: 'helvetica',
  tamanoPt: 8,
};

const DEFAULT_TIPOGRAFIA_DOCUMENTO = {
  familia: 'helvetica',
  tamanoNombrePt: 7,
  tamanoTituloPt: 14,
  tamanoSubtituloPt: 10,
  tamanoVersionPt: 8,
  tamanoVigenciaPt: 8,
  /** @deprecated use tamanoVersionPt / tamanoVigenciaPt */
  tamanoMetaPt: 8,
};

const DEFAULT_LOGO_CAPA = {
  anchoMm: 12,
  altoMm: 10,
  ancla: 'left',
  opacidad: 1,
};

/** Logo en el cuerpo (marca de agua), independiente del encabezado. */
const DEFAULT_MARCA_AGUA_LOGO = {
  anchoMm: 48,
  altoMm: 42,
};

function clampNum(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function normalizarFamilia(f) {
  const id = String(f || DEFAULT_TIPOGRAFIA_BLOQUE.familia).trim().toLowerCase();
  return FUENTES_PDF.some((x) => x.id === id) ? id : DEFAULT_TIPOGRAFIA_BLOQUE.familia;
}

function normalizarTipografiaBloque(raw, fallbackPt = 8) {
  const t = raw && typeof raw === 'object' ? raw : {};
  return {
    familia: normalizarFamilia(t.familia),
    tamanoPt: clampNum(t.tamanoPt, 6, 18, fallbackPt),
  };
}

function normalizarTipografiaDocumento(raw) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_TIPOGRAFIA_DOCUMENTO;
  const metaFallback = clampNum(t.tamanoMetaPt, 6, 14, d.tamanoMetaPt);
  return {
    familia: normalizarFamilia(t.familia),
    tamanoNombrePt: clampNum(t.tamanoNombrePt, 6, 14, d.tamanoNombrePt),
    tamanoTituloPt: clampNum(t.tamanoTituloPt, 8, 24, d.tamanoTituloPt),
    tamanoSubtituloPt: clampNum(t.tamanoSubtituloPt, 7, 18, d.tamanoSubtituloPt),
    tamanoVersionPt: clampNum(t.tamanoVersionPt, 6, 14, metaFallback),
    tamanoVigenciaPt: clampNum(t.tamanoVigenciaPt, 6, 14, metaFallback),
    tamanoMetaPt: metaFallback,
  };
}

function normalizarLogoCapa(raw) {
  const l = raw && typeof raw === 'object' ? raw : {};
  const ancla = ['left', 'center', 'right'].includes(String(l.ancla)) ? String(l.ancla) : DEFAULT_LOGO_CAPA.ancla;
  return {
    anchoMm: clampNum(l.anchoMm, 4, 40, DEFAULT_LOGO_CAPA.anchoMm),
    altoMm: clampNum(l.altoMm, 4, 35, DEFAULT_LOGO_CAPA.altoMm),
    ancla,
    opacidad: clampNum(l.opacidad, 0.15, 1, DEFAULT_LOGO_CAPA.opacidad),
  };
}

function normalizarMarcaAguaLogo(raw) {
  const l = raw && typeof raw === 'object' ? raw : {};
  return {
    anchoMm: clampNum(l.anchoMm, 15, 120, DEFAULT_MARCA_AGUA_LOGO.anchoMm),
    altoMm: clampNum(l.altoMm, 15, 100, DEFAULT_MARCA_AGUA_LOGO.altoMm),
  };
}

function cssFamiliaPdf(familiaId) {
  switch (familiaId) {
    case 'times':
      return 'Times New Roman, Times, serif';
    case 'courier':
      return 'Courier New, Courier, monospace';
    case 'calibri':
      return 'Calibri, Segoe UI, sans-serif';
    default:
      return 'Helvetica, Arial, sans-serif';
  }
}

module.exports = {
  FUENTES_PDF,
  DEFAULT_TIPOGRAFIA_BLOQUE,
  DEFAULT_TIPOGRAFIA_DOCUMENTO,
  DEFAULT_LOGO_CAPA,
  DEFAULT_MARCA_AGUA_LOGO,
  normalizarTipografiaBloque,
  normalizarTipografiaDocumento,
  normalizarLogoCapa,
  normalizarMarcaAguaLogo,
  cssFamiliaPdf,
};

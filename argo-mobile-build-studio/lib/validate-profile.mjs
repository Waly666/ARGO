const REQUIRED = [
  { key: 'appName', label: 'Nombre en el teléfono' },
  { key: 'slug', label: 'Slug EAS' },
  { key: 'androidPackage', label: 'Package Android' },
  { key: 'scheme', label: 'Deep link scheme' },
  { key: 'apiBaseUrl', label: 'Servidor API por defecto' },
  { key: 'tituloApp', label: 'Título interno' },
  { key: 'nombreEmpresaFallback', label: 'Nombre empresa' },
];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

export function validateProfile(profile) {
  const missing = REQUIRED.filter((f) => isBlank(profile?.[f.key])).map((f) => f.label);
  const api = String(profile?.apiBaseUrl ?? '').trim();
  if (api && !/^https?:\/\/.+/i.test(api)) {
    missing.push('Servidor API (debe empezar con http:// o https://)');
  }
  if (profile?.versionCode !== undefined && Number(profile.versionCode) < 1) {
    missing.push('versionCode (mínimo 1)');
  }
  return missing;
}

export function assertProfile(profile) {
  const missing = validateProfile(profile);
  if (missing.length) {
    throw new Error(`Completa estos campos antes de aplicar o compilar:\n• ${missing.join('\n• ')}`);
  }
}

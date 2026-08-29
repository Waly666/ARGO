/** Dígitos del teléfono (solo números). */
export function phoneDigits(raw: string | null | undefined): string {
  return String(raw || '').replace(/\D/g, '');
}

/** Celular Colombia con prefijo 57 (sin +). */
export function phoneDigitsWithCountryCo(raw: string | null | undefined): string | null {
  const digits = phoneDigits(raw);
  if (!digits) return null;
  return digits.startsWith('57') ? digits : `57${digits}`;
}

/** Enlace wa.me para abrir chat de WhatsApp. */
export function whatsappHrefFromPhone(raw: string | null | undefined): string | null {
  const withCountry = phoneDigitsWithCountryCo(raw);
  return withCountry ? `https://wa.me/${withCountry}` : null;
}

/**
 * Normaliza enlace de contacto del ERP: URL, tel:, solo dígitos o vacío (usa teléfono empresa → WhatsApp).
 */
export function contactHrefFromInput(
  raw: string | null | undefined,
  fallbackPhone?: string | null,
): string | null {
  const custom = String(raw || '').trim();
  if (!custom) return whatsappHrefFromPhone(fallbackPhone);

  if (/^https?:\/\//i.test(custom)) return custom;
  if (/^wa\.me\//i.test(custom)) return `https://${custom.replace(/^https?:\/\//i, '')}`;

  if (/^tel:/i.test(custom)) {
    return whatsappHrefFromPhone(custom.replace(/^tel:/i, ''));
  }

  if (/^\+?[\d\s().-]+$/.test(custom)) {
    return whatsappHrefFromPhone(custom);
  }

  return custom;
}

export function contactHrefEsExterno(raw: string | null | undefined, fallbackPhone?: string | null): boolean {
  const custom = String(raw || '').trim();
  if (!custom) return true;
  if (/^https?:\/\//i.test(custom)) return true;
  if (/^wa\.me\//i.test(custom)) return true;
  if (/^tel:/i.test(custom)) return true;
  if (/^\+?[\d\s().-]+$/.test(custom)) return true;
  return false;
}

export function contactHrefAbreNuevaPestana(raw: string | null | undefined, fallbackPhone?: string | null): boolean {
  const custom = String(raw || '').trim();
  if (!custom) return true;
  if (/^https?:\/\//i.test(custom)) return true;
  if (/^wa\.me\//i.test(custom)) return true;
  if (/^tel:/i.test(custom)) return true;
  if (/^\+?[\d\s().-]+$/.test(custom)) return true;
  return false;
}

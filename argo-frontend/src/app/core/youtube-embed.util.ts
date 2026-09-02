/** Extrae el ID de video de URLs comunes de YouTube. */
export function youtubeVideoId(url: string): string | null {
  const raw = String(url || '').trim();
  if (!raw) return null;

  try {
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname.startsWith('/watch')) {
        const id = parsed.searchParams.get('v');
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      const embedKinds = ['embed', 'shorts', 'live'];
      if (parts.length >= 2 && embedKinds.includes(parts[0])) {
        const id = parts[1];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

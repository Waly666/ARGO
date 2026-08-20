const CHROMA_LUMINANCE = 220;
const CHROMA_SOFTNESS = 36;

function isBackgroundPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const saturation = max === 0 ? 0 : (max - min) / max;
  return luminance >= CHROMA_LUMINANCE && saturation <= 0.14;
}

function applyBackgroundKey(frame: ImageData): ImageData {
  const data = frame.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const saturation = max === 0 ? 0 : (max - min) / max;

    if (isBackgroundPixel(r, g, b)) {
      data[i + 3] = 0;
      continue;
    }

    if (luminance >= CHROMA_LUMINANCE - CHROMA_SOFTNESS && saturation <= 0.18) {
      const edge = Math.min(1, (CHROMA_LUMINANCE - luminance) / CHROMA_SOFTNESS);
      data[i + 3] = Math.min(data[i + 3], Math.max(0, Math.floor(edge * 255)));
    }
  }

  return frame;
}

/** Renderiza el video del asistente con fondo blanco removido (estilo Educarte / Clippy). */
export function startAssistantChromaLoop(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onFrame?: () => void,
): () => void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return () => undefined;

  let raf = 0;

  const render = () => {
    raf = requestAnimationFrame(render);
    onFrame?.();

    if (!video.isConnected) {
      cancelAnimationFrame(raf);
      return;
    }

    if (video.readyState < 2) return;

    const sourceWidth = video.videoWidth || 480;
    const sourceHeight = video.videoHeight || 480;
    const maxSide = 540;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const frame = ctx.getImageData(0, 0, targetWidth, targetHeight);
    ctx.putImageData(applyBackgroundKey(frame), 0, 0);
  };

  render();

  return () => {
    if (raf) cancelAnimationFrame(raf);
  };
}

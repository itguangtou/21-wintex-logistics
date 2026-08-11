/** 浏览器端轻量压缩：缩边 + WebP（不支持则 JPEG），避免 Vercel 413（约 4.5MB 请求体上限） */

const MAX_EDGE = 1920;
const MAX_OUTPUT_BYTES = 3.5 * 1024 * 1024;
const QUALITIES = [0.82, 0.72, 0.62, 0.5];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

function supportsWebP(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * 压缩后用于上传。已足够小且本身是 webp/jpeg 时可原样返回。
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  // 过小的图不必压
  if (file.size <= 900 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
    return file;
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('浏览器无法处理图片');
  ctx.drawImage(img, 0, 0, w, h);

  const preferWebp = supportsWebP();
  const mime = preferWebp ? 'image/webp' : 'image/jpeg';
  const ext = preferWebp ? '.webp' : '.jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';

  let best: Blob | null = null;
  for (const q of QUALITIES) {
    const blob = await canvasToBlob(canvas, mime, q);
    if (!blob) continue;
    best = blob;
    if (blob.size <= MAX_OUTPUT_BYTES) break;
  }

  if (!best) throw new Error('图片压缩失败');

  // 压缩后反而更大则用原图（且原图需在上传上限内）
  if (best.size >= file.size && file.size <= MAX_OUTPUT_BYTES) {
    return file;
  }

  if (best.size > MAX_OUTPUT_BYTES) {
    throw new Error('压缩后仍过大，请换一张更小的图（建议长边 ≤ 2000px）');
  }

  return new File([best], `${baseName}${ext}`, { type: mime, lastModified: Date.now() });
}

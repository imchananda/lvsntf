/**
 * Image Upload & Compression Helper for NamtanFilm x Levi's
 * Uploads images via /api/upload-image (Catbox Cloud)
 */

/**
 * Resizes and compresses an image on the client side before uploading.
 * Reduces file size dramatically (< 250KB) while maintaining excellent visual fidelity.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            base64: e.target?.result as string,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }

        // Draw image onto canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer image/webp if supported, otherwise image/jpeg
        const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(targetType, quality);
        resolve({
          base64: compressedBase64,
          mimeType: targetType,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to Catbox CDN via the /api/upload-image proxy.
 */
export async function uploadImageToCatbox(file: File): Promise<string> {
  // 1. Compress image client-side first
  const { base64, mimeType } = await compressImage(file);

  // 2. Send to backend proxy
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      filename: file.name,
      mimeType,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !json?.url) {
    throw new Error(json?.error || `Upload failed with status ${res.status}`);
  }

  return json.url;
}

/**
 * Normalizes any image URL (e.g. extracts Google Drive IDs if given a share link)
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If Google Drive link, extract ID and return direct image stream
  const gdriveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`;
  }

  // Dropbox link conversion
  if (trimmed.includes('dropbox.com')) {
    return trimmed
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace(/[?&]dl=\d/g, '')
      .replace(/[?&]st=[^&]*/g, '');
  }

  return trimmed;
}

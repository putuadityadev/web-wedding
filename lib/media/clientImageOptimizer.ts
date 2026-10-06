/**
 * Client-Side Image Optimizer
 *
 * Mengoptimalkan foto langsung di browser (client-side) sebelum diunggah ke server / Supabase.
 * - Mengonversi format apapun (AVIF, HEIC, JPEG, PNG, dsb.) ke WebP modern yang ringan & cepat.
 * - Mengurangi resolusi foto kamera berukuran besar (misal 48MP/20MB) menjadi resolusi ramah web
 *   (maks 2560px) dengan visual sharpness tinggi (Retina/4K ready).
 * - Ukuran file berkurang drastis dari 10-30MB menjadi ~200KB-800KB dalam hitungan milidetik.
 * - Sat-set sat-set, menghemat kuota tamu undangan, dan mencegah error timeout/payload too large.
 * - Fallback aman: jika format tertentu tidak dapat didecode browser (misal GIF animasi/SVG atau
 *   browser lawas), file asli tetap digunakan tanpa pernah menggagalkan proses upload.
 */

export interface OptimizeOptions {
  /** Resolusi maksimal sisi terpanjang (default: 2560px untuk tampilan Retina/4K tajam) */
  maxDimension?: number;
  /** Kualitas kompresi WebP (0.1 - 1.0, default: 0.85) */
  quality?: number;
}

export interface OptimizeResult {
  file: File;
  optimized: boolean;
  originalSize: number;
  newSize: number;
  dimensions?: { width: number; height: number };
  savedPercent?: number;
}

/**
 * Format bytes ke string yang mudah dibaca (misal "1.5 MB", "340 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Optimasi file gambar di sisi browser sebelum dikirim ke server / Supabase.
 */
export async function optimizeImageForUpload(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizeResult> {
  const { maxDimension = 2560, quality = 0.85 } = options;
  const originalSize = file.size;

  // Jangan sentuh file non-gambar (video, audio, dsb.)
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name);
  const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name);
  if (isVideo || isAudio) {
    return { file, optimized: false, originalSize, newSize: originalSize };
  }

  // Jika dijalankan di luar browser (SSR / Node), kembalikan file asli
  if (typeof window === 'undefined') {
    return { file, optimized: false, originalSize, newSize: originalSize };
  }

  // Pertahankan GIF animasi & SVG asli tanpa di-rasterize
  if (
    file.type === 'image/gif' ||
    /\.gif$/i.test(file.name) ||
    file.type === 'image/svg+xml' ||
    /\.svg$/i.test(file.name)
  ) {
    return { file, optimized: false, originalSize, newSize: originalSize };
  }

  // Coba proses gambar melalui Canvas
  try {
    const objectUrl = URL.createObjectURL(file);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(new Error('Gagal membaca format gambar di browser'));
      el.src = objectUrl;
    }).finally(() => {
      URL.revokeObjectURL(objectUrl);
    });

    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    if (!origWidth || !origHeight) {
      // Tidak dapat membaca dimensi, gunakan file asli
      return { file, optimized: false, originalSize, newSize: originalSize };
    }

    // Hitung dimensi target berskala
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (origWidth > maxDimension || origHeight > maxDimension) {
      if (origWidth >= origHeight) {
        targetWidth = maxDimension;
        targetHeight = Math.round((origHeight * maxDimension) / origWidth);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((origWidth * maxDimension) / origHeight);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) {
      return { file, optimized: false, originalSize, newSize: originalSize };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Konversi ke Blob WebP (didukung oleh semua browser modern)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });

    if (!blob) {
      return { file, optimized: false, originalSize, newSize: originalSize };
    }

    // Tentukan nama file baru dengan ekstensi .webp
    const baseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'image';
    const optimizedFileName = `${baseName}.webp`;

    const optimizedFile = new File([blob], optimizedFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    const newSize = optimizedFile.size;
    const savedPercent =
      originalSize > 0
        ? Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100))
        : 0;

    return {
      file: optimizedFile,
      optimized: true,
      originalSize,
      newSize,
      dimensions: { width: targetWidth, height: targetHeight },
      savedPercent,
    };
  } catch (err) {
    // Fallback ramah: jika decode gagal (misal HEIC tertentu), gunakan file asli tanpa error
    console.warn('[ImageOptimizer] Browser decode fallback to original file:', err);
    return { file, optimized: false, originalSize, newSize: originalSize };
  }
}

import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function renderPDFPage(pdf, pageNum, scale = 2) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function loadPdf(fileOrBuffer) {
  let data;
  if (fileOrBuffer instanceof File) {
    const ab = await fileOrBuffer.arrayBuffer();
    data = new Uint8Array(ab);
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    data = new Uint8Array(fileOrBuffer);
  } else {
    data = fileOrBuffer;
  }
  return pdfjsLib.getDocument({ data }).promise;
}

export function parsePageRange(s, total) {
  if (!s || s.trim() === '' || s.trim().toLowerCase() === 'all') {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result = new Set();
  s.split(',').forEach(p => {
    const pts = p.trim().split('-');
    if (pts.length === 2) {
      const a = parseInt(pts[0]), b = parseInt(pts[1]);
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = a; i <= Math.min(b, total); i++) {
          if (i >= 1) result.add(i);
        }
      }
    } else {
      const n = parseInt(pts[0]);
      if (!isNaN(n) && n >= 1 && n <= total) result.add(n);
    }
  });
  return Array.from(result).sort((a, b) => a - b);
}

export function hexToRgb01(hex) {
  hex = hex || '#000000';
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

export { pdfjsLib };

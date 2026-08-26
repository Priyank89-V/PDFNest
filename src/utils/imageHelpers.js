import { fileToImage } from './fileHelpers';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export async function processConvert(file, targetFmt = 'png', quality = 0.92) {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');

  if (targetFmt === 'jpg' || targetFmt === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  const mime = targetFmt === 'jpg' || targetFmt === 'jpeg' ? 'image/jpeg' : targetFmt === 'webp' ? 'image/webp' : 'image/png';
  const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
  return { blob, canvas, width: canvas.width, height: canvas.height };
}

export async function processCompress(file, quality = 0.70, targetFmt = 'jpg') {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');

  if (targetFmt === 'jpg' || targetFmt === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  const mime = targetFmt === 'png' ? 'image/png' : targetFmt === 'webp' ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
  return { blob, origSize: file.size, compSize: blob.size, width: canvas.width, height: canvas.height };
}

export async function processResize(file, targetW, targetH, maintainAspect = true, percent = 0) {
  const img = await fileToImage(file);
  let w = img.naturalWidth, h = img.naturalHeight;

  if (percent > 0) {
    w = Math.round(w * (percent / 100));
    h = Math.round(h * (percent / 100));
  } else {
    if (targetW && targetH && !maintainAspect) {
      w = targetW; h = targetH;
    } else if (targetW && !targetH) {
      h = Math.round((targetW / w) * h);
      w = targetW;
    } else if (targetH && !targetW) {
      w = Math.round((targetH / h) * w);
      h = targetH;
    } else if (targetW && targetH && maintainAspect) {
      const ratio = Math.min(targetW / w, targetH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(w, 1);
  canvas.height = Math.max(h, 1);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const isJpg = /jpe?g$/i.test(file.name);
  const mime = isJpg ? 'image/jpeg' : 'image/png';
  const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function processCrop(file, cropMode = '1:1', customRect = null) {
  const img = await fileToImage(file);
  const origW = img.naturalWidth, origH = img.naturalHeight;

  let sx = 0, sy = 0, sw = origW, sh = origH;

  if (customRect) {
    sx = customRect.x; sy = customRect.y; sw = customRect.w; sh = customRect.h;
  } else if (cropMode === '1:1') {
    const minSide = Math.min(origW, origH);
    sx = (origW - minSide) / 2; sy = (origH - minSide) / 2; sw = minSide; sh = minSide;
  } else if (cropMode === '16:9') {
    let targetH = origW * (9 / 16);
    if (targetH <= origH) {
      sx = 0; sy = (origH - targetH) / 2; sw = origW; sh = targetH;
    } else {
      let targetW = origH * (16 / 9);
      sx = (origW - targetW) / 2; sy = 0; sw = targetW; sh = origH;
    }
  } else if (cropMode === '9:16') {
    let targetW = origH * (9 / 16);
    if (targetW <= origW) {
      sx = (origW - targetW) / 2; sy = 0; sw = targetW; sh = origH;
    } else {
      let targetH = origW * (16 / 9);
      sx = 0; sy = (origH - targetH) / 2; sw = targetH; sh = origH;
    }
  } else if (cropMode === '4:3') {
    let targetH = origW * (3 / 4);
    if (targetH <= origH) {
      sx = 0; sy = (origH - targetH) / 2; sw = origW; sh = targetH;
    } else {
      let targetW = origH * (4 / 3);
      sx = (origW - targetW) / 2; sy = 0; sw = targetW; sh = origH;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(Math.round(sw), 1);
  canvas.height = Math.max(Math.round(sh), 1);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function processRotate(file, angle = 90, flipH = false, flipV = false) {
  const img = await fileToImage(file);
  const origW = img.naturalWidth, origH = img.naturalHeight;

  const rad = (angle * Math.PI) / 180;
  const isQuarter = angle % 180 !== 0;

  const canvas = document.createElement('canvas');
  canvas.width = isQuarter ? origH : origW;
  canvas.height = isQuarter ? origW : origH;

  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -origW / 2, -origH / 2);

  const isJpg = /jpe?g$/i.test(file.name);
  const mime = isJpg ? 'image/jpeg' : 'image/png';
  const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function processFilters(file, options = {}) {
  const {
    brightness = 100, contrast = 100, saturation = 100, blur = 0, sepia = 0, grayscale = 0, invert = 0, hue = 0
  } = options;

  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%) hue-rotate(${hue}deg)`;
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function processWatermark(file, text = 'PDFNest/ImageNest', color = '#ffffff', opacity = 0.7, size = 48, pos = 'center', angle = -30) {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  ctx.save();
  ctx.font = `bold ${size}px Outfit, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;

  const metrics = ctx.measureText(text);
  let x = canvas.width / 2;
  let y = canvas.height / 2;

  if (pos === 'top-left') { x = metrics.width / 2 + 30; y = size + 30; }
  else if (pos === 'top-right') { x = canvas.width - metrics.width / 2 - 30; y = size + 30; }
  else if (pos === 'bottom-left') { x = metrics.width / 2 + 30; y = canvas.height - 30; }
  else if (pos === 'bottom-right') { x = canvas.width - metrics.width / 2 - 30; y = canvas.height - 30; }

  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = Math.max(2, size / 16);
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function extractColorPalette(file, count = 6) {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 150, 150);

  const imgData = ctx.getImageData(0, 0, 150, 150).data;
  const colorMap = {};

  for (let i = 0; i < imgData.length; i += 16) {
    const r = Math.round(imgData[i] / 32) * 32;
    const g = Math.round(imgData[i + 1] / 32) * 32;
    const b = Math.round(imgData[i + 2] / 32) * 32;
    const a = imgData[i + 3];
    if (a < 128) continue;
    const hex = '#' + [r, g, b].map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('');
    colorMap[hex] = (colorMap[hex] || 0) + 1;
  }

  const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, count).map(e => e[0]);
  return sorted;
}

export async function processGridSplit(file, rows = 3, cols = 3) {
  const img = await fileToImage(file);
  const w = img.naturalWidth, h = img.naturalHeight;
  const tileW = Math.floor(w / cols), tileH = Math.floor(h / rows);

  const zip = new JSZip();
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      count++;
      const canvas = document.createElement('canvas');
      canvas.width = tileW;
      canvas.height = tileH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      zip.file(`tile_${r + 1}_${c + 1}.png`, await blob.arrayBuffer());
    }
  }

  const zblob = await zip.generateAsync({ type: 'blob' });
  return { blob: zblob, count, tileW, tileH };
}

export async function processJoinImages(files, direction = 'horizontal', spacing = 10, background = '#ffffff') {
  if (!files || !files.length) return null;
  const images = await Promise.all(files.map(f => fileToImage(f)));

  let totalW = 0, totalH = 0;

  if (direction === 'horizontal') {
    totalW = images.reduce((acc, img) => acc + img.naturalWidth, 0) + spacing * (images.length - 1);
    totalH = Math.max(...images.map(img => img.naturalHeight));
  } else {
    totalW = Math.max(...images.map(img => img.naturalWidth));
    totalH = images.reduce((acc, img) => acc + img.naturalHeight, 0) + spacing * (images.length - 1);
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, totalW, totalH);

  let curX = 0, curY = 0;
  images.forEach(img => {
    if (direction === 'horizontal') {
      const y = (totalH - img.naturalHeight) / 2;
      ctx.drawImage(img, curX, y);
      curX += img.naturalWidth + spacing;
    } else {
      const x = (totalW - img.naturalWidth) / 2;
      ctx.drawImage(img, x, curY);
      curY += img.naturalHeight + spacing;
    }
  });

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  return { blob, width: totalW, height: totalH };
}

export async function processMeme(file, topText = '', bottomText = '', fontSize = 48) {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(3, fontSize / 12);
  ctx.textAlign = 'center';

  if (topText.trim()) {
    ctx.textBaseline = 'top';
    ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 20);
    ctx.fillText(topText.toUpperCase(), canvas.width / 2, 20);
  }

  if (bottomText.trim()) {
    ctx.textBaseline = 'bottom';
    ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
    ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 20);
  }

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  return { blob, width: canvas.width, height: canvas.height };
}

export async function processImagesToPdf(files) {
  const doc = await PDFDocument.create();

  for (let file of files) {
    const img = await fileToImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpgBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
    const jpgBytes = await jpgBlob.arrayBuffer();
    const embeddedImg = await doc.embedJpg(jpgBytes);

    const page = doc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return { blob, count: files.length };
}

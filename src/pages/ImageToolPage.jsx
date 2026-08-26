import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getImageToolById } from '../utils/imageConstants';
import { downloadBlob, fileToBase64, fmtSz } from '../utils/fileHelpers';
import {
  processConvert, processCompress, processResize, processCrop,
  processRotate, processFilters, processWatermark, extractColorPalette,
  processGridSplit, processJoinImages, processMeme, processImagesToPdf
} from '../utils/imageHelpers';
import { useToast } from '../context/ToastContext';
import { addHistoryItem } from '../utils/historyHelpers';

import ImageToolLayout from '../components/tool/ImageToolLayout';
import DropZone from '../components/tool/DropZone';
import ProgressBar from '../components/tool/ProgressBar';
import OutputBox from '../components/tool/OutputBox';

export default function ImageToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const tool = getImageToolById(toolId);

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressActive, setProgressActive] = useState(false);
  const [result, setRawResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Tool parameter states
  const [quality, setQuality] = useState(80);
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [resizePercent, setResizePercent] = useState(0);
  const [cropAspect, setCropAspect] = useState('1:1');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Filter states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [invert, setInvert] = useState(0);
  const [hue, setHue] = useState(0);
  const [colorMode, setColorMode] = useState('grayscale');

  // Watermark states
  const [watermarkText, setWatermarkText] = useState('ImageNest');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [watermarkOpacity, setWatermarkOpacity] = useState(70);
  const [watermarkSize, setWatermarkSize] = useState(48);
  const [watermarkPos, setWatermarkPos] = useState('center');

  // Meme states
  const [memeTop, setMemeTop] = useState('WHEN YOU WRITE CLEAN CODE');
  const [memeBottom, setMemeBottom] = useState('AND IT WORKS FIRST TRY');

  // Grid & Join states
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(3);
  const [joinDirection, setJoinDirection] = useState('horizontal');
  const [joinSpacing, setJoinSpacing] = useState(10);
  const [convertTargetFmt, setConvertTargetFmt] = useState('jpg');

  // Base64 output
  const [base64Str, setBase64Str] = useState('');

  const setResult = useCallback((res) => {
    if (res && res.fileName) {
      const sourceFile = file || (files && files[0]);
      if (sourceFile && sourceFile.name) {
        const baseName = sourceFile.name.replace(/\.[^/.]+$/, "");
        if (!res.fileName.toLowerCase().startsWith(baseName.toLowerCase())) {
          res = { ...res, fileName: `${baseName}_${res.fileName}` };
        }
      }
    }
    setRawResult(res);
    if (res && tool) {
      addHistoryItem({
        toolId: tool.id,
        toolName: tool.name,
        fileName: (res && res.fileName) || 'Image.png',
        suite: 'image'
      });
    }
  }, [file, files, tool]);

  const prog = useCallback((pct, label) => {
    setProgress(pct);
    setProgressLabel(label || 'Processing…');
    if (pct > 0 && pct < 100) setProgressActive(true);
    if (pct >= 100) setTimeout(() => setProgressActive(false), 800);
  }, []);

  useEffect(() => {
    setFile(null);
    setFiles([]);
    setRawResult(null);
    setProcessing(false);
    setProgress(0);
    setProgressLabel('');
    setProgressActive(false);
    setBase64Str('');
  }, [toolId]);

  // Auto-download when result is ready
  useEffect(() => {
    if (result && result.blob && result.fileName) {
      downloadBlob(result.blob, result.fileName);
    }
  }, [result]);

  const handleFile = useCallback((fileList) => {
    if (!fileList || fileList.length === 0) {
      setFile(null);
      setFiles([]);
    } else {
      setFile(fileList[0]);
      setFiles(Array.from(fileList));
    }
  }, []);

  if (!tool) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Tool Not Found</h2>
        <button className="action-btn" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => navigate('/image')}>← Back to ImageNest</button>
      </div>
    );
  }

  // TOOL HANDLERS
  async function runConvert(targetFmt) {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(20, 'Reading image…');
    try {
      prog(60, 'Converting image format…');
      const res = await processConvert(file, targetFmt, quality / 100);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: `Converted to ${targetFmt.toUpperCase()}!`,
        info: `Dimensions: ${res.width}×${res.height} px — Size: ${fmtSz(res.blob.size)}`,
        blob: res.blob,
        fileName: `converted.${targetFmt}`,
        previewUrl
      });
      toast(`Converted to ${targetFmt.toUpperCase()}!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runCompress() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(20, 'Analyzing image…');
    try {
      prog(70, 'Compressing pixel data…');
      const ext = file.name.split('.').pop() || 'jpg';
      const res = await processCompress(file, quality / 100, ext);
      prog(100, 'Done!');
      const savedPct = ((res.origSize - res.compSize) / res.origSize * 100).toFixed(1);
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: 'Image Compressed!',
        info: `Original: ${fmtSz(res.origSize)} → Compressed: ${fmtSz(res.compSize)} (${savedPct > 0 ? savedPct + '% smaller' : 'Optimized'})`,
        blob: res.blob,
        fileName: `compressed.${ext}`,
        previewUrl
      });
      toast(`Compressed! ${savedPct > 0 ? savedPct + '% smaller' : ''}`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runResize() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(20, 'Loading canvas…');
    try {
      prog(70, 'Resizing image…');
      const ext = file.name.split('.').pop() || 'png';
      const res = await processResize(file, targetWidth, targetHeight, maintainAspect, resizePercent);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: `Resized to ${res.width}×${res.height} px!`,
        info: `File size: ${fmtSz(res.blob.size)}`,
        blob: res.blob,
        fileName: `resized.${ext}`,
        previewUrl
      });
      toast('Image resized!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runCrop() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(30, 'Cropping image…');
    try {
      const res = await processCrop(file, cropAspect);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: `Cropped (${cropAspect})!`,
        info: `New Dimensions: ${res.width}×${res.height} px — ${fmtSz(res.blob.size)}`,
        blob: res.blob,
        fileName: 'cropped.png',
        previewUrl
      });
      toast('Image cropped!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runRotate() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(30, 'Transforming canvas…');
    try {
      const res = await processRotate(file, rotateAngle, flipH, flipV);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: `Rotated ${rotateAngle}° ${flipH ? '(Flipped H)' : ''} ${flipV ? '(Flipped V)' : ''}!`,
        info: `Dimensions: ${res.width}×${res.height} px`,
        blob: res.blob,
        fileName: 'transformed.png',
        previewUrl
      });
      toast('Image transformed!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runFilters(preset = null) {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(30, 'Applying color filters…');
    try {
      const filterOpts = preset === 'gray' ? { grayscale: 100 } : preset === 'sepia' ? { sepia: 100 } : {
        brightness, contrast, saturation, blur, sepia, grayscale, invert, hue
      };
      const res = await processFilters(file, filterOpts);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: 'Filter Applied!',
        info: `Dimensions: ${res.width}×${res.height} px`,
        blob: res.blob,
        fileName: 'filtered.png',
        previewUrl
      });
      toast('Filter applied!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runWatermark() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(30, 'Rendering watermark…');
    try {
      const res = await processWatermark(file, watermarkText, watermarkColor, watermarkOpacity / 100, watermarkSize, watermarkPos);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: 'Watermark Added!',
        info: `Text: "${watermarkText}" • Position: ${watermarkPos}`,
        blob: res.blob,
        fileName: 'watermarked.png',
        previewUrl
      });
      toast('Watermark added!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runPalette() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(40, 'Extracting colors…');
    try {
      const colors = await extractColorPalette(file, 6);
      prog(100, 'Done!');
      setResult({
        success: true,
        title: 'Dominant Color Palette Extracted!',
        info: 'Click any color hex code below to copy it to your clipboard.',
        colors
      });
      toast('Colors extracted!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runGrid() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(20, 'Slicing grid tiles…');
    try {
      const res = await processGridSplit(file, gridRows, gridCols);
      prog(100, 'Done!');
      setResult({
        success: true,
        title: `Sliced into ${res.count} (${gridRows}×${gridCols}) tiles!`,
        info: `Each tile: ${res.tileW}×${res.tileH} px packed in ZIP archive.`,
        blob: res.blob,
        fileName: `grid_${gridRows}x${gridCols}.zip`
      });
      toast('Grid sliced!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runJoin() {
    if (files.length < 2) { toast('Select at least 2 images to join', 'err'); return; }
    setProcessing(true); prog(30, 'Stitching images…');
    try {
      const res = await processJoinImages(files, joinDirection, joinSpacing);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: `Joined ${files.length} images (${joinDirection})!`,
        info: `Total Dimensions: ${res.width}×${res.height} px — ${fmtSz(res.blob.size)}`,
        blob: res.blob,
        fileName: 'joined_collage.png',
        previewUrl
      });
      toast('Images joined!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runMeme() {
    if (!file) { toast('Please select an image', 'err'); return; }
    setProcessing(true); prog(30, 'Creating meme…');
    try {
      const res = await processMeme(file, memeTop, memeBottom, 52);
      prog(100, 'Done!');
      const previewUrl = URL.createObjectURL(res.blob);
      setResult({
        success: true,
        title: 'Meme Generated!',
        info: 'High quality meme ready with Impact font & stroke outline.',
        blob: res.blob,
        fileName: 'meme.png',
        previewUrl
      });
      toast('Meme created!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runImg2Pdf() {
    if (!files.length) { toast('Select image(s)', 'err'); return; }
    setProcessing(true); prog(20, 'Generating PDF…');
    try {
      const res = await processImagesToPdf(files);
      prog(100, 'Done!');
      setResult({
        success: true,
        title: `Converted ${res.count} image(s) to PDF!`,
        info: `Size: ${fmtSz(res.blob.size)}`,
        blob: res.blob,
        fileName: 'converted.pdf'
      });
      toast('Images → PDF done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  async function runBase64() {
    if (!file) { toast('Please select an image', 'err'); return; }
    try {
      const b64 = await fileToBase64(file);
      setBase64Str(b64);
      setResult({
        success: true,
        title: 'Image Converted to Base64!',
        info: `Data URL length: ${b64.length.toLocaleString()} characters`
      });
      toast('Base64 generated!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  async function runExif() {
    if (!file) { toast('Please select an image file', 'err'); return; }
    setProcessing(true); prog(30, 'Analyzing image metadata…');
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const mp = ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2);
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(img.naturalWidth, img.naturalHeight);
      const aspect = `${Math.round(img.naturalWidth / g)}:${Math.round(img.naturalHeight / g)}`;

      prog(100, 'Done!');
      setResult({
        success: true,
        title: '📋 Image Metadata & EXIF Info',
        info: `File Name: ${file.name}\nFile Size: ${fmtSz(file.size)}\nDimensions: ${img.naturalWidth} × ${img.naturalHeight} px\nResolution: ${mp} Megapixels\nAspect Ratio: ${aspect}\nMIME Type: ${file.type || 'image/png'}\nLast Modified: ${new Date(file.lastModified).toLocaleString()}`,
        previewUrl: url
      });
      toast('Metadata loaded!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <ImageToolLayout tool={tool}>
        <DropZone
          accept={tool.accept || 'image/*'}
          multiple={tool.multiple || false}
          onFiles={handleFile}
        />

        {/* PARAMETER OPTIONS */}
        {toolId === 'compress' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Compression Quality ({quality}%)</label>
              <div className="range-row">
                <input type="range" min="10" max="95" value={quality} onChange={e => setQuality(parseInt(e.target.value))} />
                <span>{quality}%</span>
              </div>
            </div>
          </div>
        )}

        {toolId === 'resize' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Width (px)</label>
              <input className="opt-input" type="number" value={targetWidth} onChange={e => setTargetWidth(parseInt(e.target.value))} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Height (px)</label>
              <input className="opt-input" type="number" value={targetHeight} onChange={e => setTargetHeight(parseInt(e.target.value))} />
            </div>
          </div>
        )}

        {toolId === 'crop' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Crop Aspect Ratio</label>
              <select className="opt-select" value={cropAspect} onChange={e => setCropAspect(e.target.value)}>
                <option value="1:1">1:1 Square (Instagram Post / Avatar)</option>
                <option value="16:9">16:9 Widescreen (YouTube/Desktop Header)</option>
                <option value="9:16">9:16 Story / Reel / TikTok Vertical</option>
                <option value="4:3">4:3 Standard Photo</option>
              </select>
            </div>
          </div>
        )}

        {toolId === 'rotate' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Rotation Angle</label>
              <select className="opt-select" value={rotateAngle} onChange={e => setRotateAngle(parseInt(e.target.value))}>
                <option value={90}>Rotate 90° Clockwise</option>
                <option value={180}>Rotate 180° Upside Down</option>
                <option value={270}>Rotate 270° Counter-Clockwise</option>
              </select>
            </div>
            <div className="opt-group">
              <label className="opt-label">Flip Actions</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={flipH} onChange={e => setFlipH(e.target.checked)} /> Flip Horizontal
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={flipV} onChange={e => setFlipV(e.target.checked)} /> Flip Vertical
                </label>
              </div>
            </div>
          </div>
        )}

        {toolId === 'watermark' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Watermark Text</label>
              <input className="opt-input" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Text Color</label>
              <input className="opt-input" type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Font Size ({watermarkSize}px)</label>
              <input className="opt-input" type="number" min="12" max="200" value={watermarkSize} onChange={e => setWatermarkSize(parseInt(e.target.value))} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Opacity ({watermarkOpacity}%)</label>
              <input type="range" min="10" max="100" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseInt(e.target.value))} />
            </div>
          </div>
        )}

        {toolId === 'filters' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Brightness ({brightness}%)</label>
              <input type="range" min="20" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Contrast ({contrast}%)</label>
              <input type="range" min="20" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Saturation ({saturation}%)</label>
              <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(parseInt(e.target.value))} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Blur ({blur}px)</label>
              <input type="range" min="0" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} />
            </div>
          </div>
        )}

        {toolId === 'grayscale' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Color Filter Effect</label>
              <select className="opt-select" value={colorMode} onChange={e => setColorMode(e.target.value)}>
                <option value="grayscale">Classic Black & White (Grayscale)</option>
                <option value="sepia">Vintage Sepia Warm Tone</option>
              </select>
            </div>
          </div>
        )}

        {toolId === 'grid' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Rows</label>
              <input className="opt-input" type="number" min="1" max="6" value={gridRows} onChange={e => setGridRows(parseInt(e.target.value) || 1)} />
            </div>
            <div className="opt-group">
              <label className="opt-label">Columns</label>
              <input className="opt-input" type="number" min="1" max="6" value={gridCols} onChange={e => setGridCols(parseInt(e.target.value) || 1)} />
            </div>
          </div>
        )}

        {toolId === 'join' && (
          <div className="options-panel">
            <div className="opt-group">
              <label className="opt-label">Stitch Direction</label>
              <select className="opt-select" value={joinDirection} onChange={e => setJoinDirection(e.target.value)}>
                <option value="horizontal">Horizontal (Side-by-Side)</option>
                <option value="vertical">Vertical (Stacked)</option>
              </select>
            </div>
            <div className="opt-group">
              <label className="opt-label">Spacing ({joinSpacing}px)</label>
              <input className="opt-input" type="number" min="0" max="100" value={joinSpacing} onChange={e => setJoinSpacing(parseInt(e.target.value) || 0)} />
            </div>
          </div>
        )}

        {toolId === 'webp2jpg' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Target Format</label>
              <select className="opt-select" value={convertTargetFmt} onChange={e => setConvertTargetFmt(e.target.value)}>
                <option value="jpg">Convert to JPG Format</option>
                <option value="png">Convert to PNG Format</option>
              </select>
            </div>
          </div>
        )}

        {toolId === 'svg2png' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Rasterize Format</label>
              <select className="opt-select" value={convertTargetFmt} onChange={e => setConvertTargetFmt(e.target.value)}>
                <option value="png">Rasterize to PNG (Transparent)</option>
                <option value="jpg">Rasterize to JPG (White BG)</option>
              </select>
            </div>
          </div>
        )}

        {toolId === 'meme' && (
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Top Text</label>
              <input className="opt-input" value={memeTop} onChange={e => setMemeTop(e.target.value)} />
            </div>
            <div className="opt-group full">
              <label className="opt-label">Bottom Text</label>
              <input className="opt-input" value={memeBottom} onChange={e => setMemeBottom(e.target.value)} />
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button
          className="action-btn"
          disabled={processing}
          onClick={() => {
            if (toolId === 'jpg2png') runConvert('png');
            else if (toolId === 'png2jpg') runConvert('jpg');
            else if (toolId === 'img2webp') runConvert('webp');
            else if (toolId === 'webp2jpg') runConvert(convertTargetFmt);
            else if (toolId === 'svg2png') runConvert(convertTargetFmt);
            else if (toolId === 'compress') runCompress();
            else if (toolId === 'resize') runResize();
            else if (toolId === 'crop') runCrop();
            else if (toolId === 'rotate') runRotate();
            else if (toolId === 'filters') runFilters();
            else if (toolId === 'grayscale') runFilters(colorMode === 'sepia' ? 'sepia' : 'gray');
            else if (toolId === 'watermark') runWatermark();
            else if (toolId === 'palette') runPalette();
            else if (toolId === 'grid') runGrid();
            else if (toolId === 'join') runJoin();
            else if (toolId === 'meme') runMeme();
            else if (toolId === 'img2pdf') runImg2Pdf();
            else if (toolId === 'img2base64') runBase64();
            else if (toolId === 'exif') runExif();
          }}
        >
          ⚡ Process {tool.name}
        </button>

        <ProgressBar progress={progress} label={progressLabel} active={progressActive} />

        {base64Str && (
          <div style={{ marginTop: '1.5rem' }}>
            <textarea
              className="opt-input"
              readOnly
              value={base64Str}
              style={{ height: 160, fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            <button
              className="action-btn"
              style={{ marginTop: '0.8rem', background: '#00f2fe', color: '#0b0f19' }}
              onClick={() => { navigator.clipboard.writeText(base64Str); toast('Base64 copied!'); }}
            >
              📋 Copy Base64 to Clipboard
            </button>
          </div>
        )}

        <OutputBox result={result} />
      </ImageToolLayout>
    </motion.div>
  );
}

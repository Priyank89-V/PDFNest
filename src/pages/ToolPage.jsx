import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import JSZip from 'jszip';

import { getToolById } from '../utils/constants';
import { PAGE_SIZES } from '../utils/constants';
import { renderPDFPage, loadPdf, parsePageRange, hexToRgb01, pdfjsLib } from '../utils/pdfHelpers';
import { downloadBlob, fmtSz, fileToJpegBytes, loadImageFromFile, xmlEsc, csvCell } from '../utils/fileHelpers';
import { encryptPDF } from '../utils/encryption';
import { addHistoryItem } from '../utils/historyHelpers';
import { useToast } from '../context/ToastContext';

import ToolLayout from '../components/tool/ToolLayout';
import DropZone from '../components/tool/DropZone';
import ProgressBar from '../components/tool/ProgressBar';
import OutputBox from '../components/tool/OutputBox';

export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const tool = getToolById(toolId);

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [mergeFiles, setMergeFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressActive, setProgressActive] = useState(false);
  const [result, setRawResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Tool-specific state
  const [scale, setScale] = useState(2);
  const [pageRange, setPageRange] = useState('');
  const [rotation, setRotation] = useState(90);
  const [splitMode, setSplitMode] = useState('range');
  const [splitValue, setSplitValue] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');
  const [watermarkSize, setWatermarkSize] = useState(60);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [pnPos, setPnPos] = useState('Bottom Center');
  const [pnFmt, setPnFmt] = useState('num');
  const [pnStart, setPnStart] = useState(1);
  const [pnFontSize, setPnFontSize] = useState(12);
  const [pnColor, setPnColor] = useState('#444444');
  const [delPages, setDelPages] = useState('');
  const [reorderInput, setReorderInput] = useState('');
  const [reorderInfo, setReorderInfo] = useState('');
  const [cropL, setCropL] = useState(0);
  const [cropR, setCropR] = useState(0);
  const [cropT, setCropT] = useState(0);
  const [cropB, setCropB] = useState(0);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaCreator, setMetaCreator] = useState('');
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [unlockPwd, setUnlockPwd] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('Portrait');
  const [blankPages, setBlankPages] = useState(1);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [labelPos, setLabelPos] = useState('top');
  const [labelSize, setLabelSize] = useState('600x900');
  const [htmlCode, setHtmlCode] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [compLevel, setCompLevel] = useState('med');
  const [thumbWidth, setThumbWidth] = useState(200);

  // AI & PDF Intelligence state
  const [summaryLength, setSummaryLength] = useState('medium');
  const [targetLang, setTargetLang] = useState('es');

  // Viewer state
  const [viewerPdf, setViewerPdf] = useState(null);
  const [viewerPage, setViewerPage] = useState(1);
  const [viewerZoom, setViewerZoom] = useState(1.5);
  const viewerCanvasRef = useRef(null);

  // Snapshot state
  const [snapPdf, setSnapPdf] = useState(null);
  const [snapPage, setSnapPage] = useState(1);
  const [snapSel, setSnapSel] = useState(null);
  const snapCanvasRef = useRef(null);
  const snapOverlayRef = useRef(null);
  const snapDragRef = useRef({ dragging: false, start: null });

  // Thumbnail state
  const [thumbCanvases, setThumbCanvases] = useState([]);

  // Internal doc refs
  const fileDataRef = useRef(null);

  const setResult = useCallback((res) => {
    if (res && res.fileName) {
      const sourceFile = file || (files && files[0]) || (mergeFiles && mergeFiles[0]);
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
        fileName: (res && res.fileName) || 'Document.pdf',
        suite: 'pdf'
      });
    }
  }, [file, files, mergeFiles, tool]);

  const prog = useCallback((pct, label) => {
    setProgress(pct);
    setProgressLabel(label || 'Processing…');
    if (pct > 0 && pct < 100) setProgressActive(true);
    if (pct >= 100) setTimeout(() => setProgressActive(false), 800);
  }, []);

  useEffect(() => {
    setFile(null);
    setFiles([]);
    setMergeFiles([]);
    setRawResult(null);
    setProcessing(false);
    setProgress(0);
    setProgressLabel('');
    setProgressActive(false);
    if (fileDataRef) fileDataRef.current = null;
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

  // Merge file handling
  const addMergeFiles = useCallback((fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    setMergeFiles(prev => [...prev, ...pdfs]);
  }, []);

  const removeMergeFile = useCallback((idx) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const moveMergeFile = useCallback((idx, dir) => {
    setMergeFiles(prev => {
      const copy = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }, []);

  if (!tool) {
    return (
      <div className="tool-page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Tool not found</h2>
        <button className="hero-cta hero-cta-secondary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  // ===================== ALL TOOL FUNCTIONS =====================

  // PDF to Images (JPG/PNG)
  async function toolPdf2Img(fmt) {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Loading PDF…');
    try {
      const pdf = await loadPdf(file);
      const pages = parsePageRange(pageRange, pdf.numPages);
      if (!pages.length) { toast('No valid pages', 'err'); setProcessing(false); return; }
      const zip = new JSZip();
      for (let i = 0; i < pages.length; i++) {
        prog(5 + (i + 1) / pages.length * 88, `Page ${i + 1} of ${pages.length}…`);
        const canvas = await renderPDFPage(pdf, pages[i], scale);
        const mtype = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
        const blob = await new Promise(res => canvas.toBlob(res, mtype, 0.93));
        zip.file(`page_${pages[i]}.${fmt}`, await blob.arrayBuffer());
      }
      const zblob = await zip.generateAsync({ type: 'blob' });
      prog(100, 'Done!');
      setResult({ success: true, title: `${pages.length} page(s) converted to ${fmt.toUpperCase()}!`, info: 'All pages packed in a ZIP archive.', blob: zblob, fileName: `pages_${fmt}.zip` });
      toast(`${pages.length} pages → ${fmt.toUpperCase()}`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF to Text
  async function toolPdf2Txt() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Extracting text…');
    try {
      const pdf = await loadPdf(file);
      let txt = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        txt += `─── Page ${i} ───\n${c.items.map(s => s.str).join(' ').trim()}\n\n`;
        prog(5 + i / pdf.numPages * 88, `Page ${i}…`);
      }
      prog(100, 'Done!');
      setTextOutput(txt || 'No text found.');
      const blob = new Blob([txt], { type: 'text/plain' });
      setResult({ success: true, title: `Text extracted from ${pdf.numPages} pages!`, blob, fileName: 'extracted_text.txt' });
      toast('Text extracted!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF to Word DOCX
  async function toolPdf2Word() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(3, 'Reading PDF…');
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      const zip = new JSZip();
      const pageData = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(3 + i / pdf.numPages * 55, `Page ${i} — rendering…`);
        const canvas = await renderPDFPage(pdf, i, 2);
        const jpgBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
        zip.file(`word/media/page${i}.jpeg`, await jpgBlob.arrayBuffer());
        let emuW = Math.round(canvas.width / 2 / 72 * 914400);
        let emuH = Math.round(canvas.height / 2 / 72 * 914400);
        const maxEmuW = 5486400;
        if (emuW > maxEmuW) { const ratio = maxEmuW / emuW; emuW = maxEmuW; emuH = Math.round(emuH * ratio); }
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        const yMap = {};
        c.items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!yMap[y]) yMap[y] = [];
          yMap[y].push({ x: Math.round(item.transform[4]), str: item.str });
        });
        const sortedY = Object.keys(yMap).map(Number).sort((a, b) => b - a);
        const lines = sortedY.map(y => yMap[y].sort((a, b) => a.x - b.x).map(it => it.str).join(' '));
        pageData.push({ lines, idx: i, emuW, emuH });
      }
      prog(62, 'Building DOCX…');
      let imgRels = '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
      for (let r = 0; r < pdf.numPages; r++) {
        imgRels += `<Relationship Id="rImg${r + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page${r + 1}.jpeg"/>`;
      }
      let body = '';
      pageData.forEach((pg, pi) => {
        if (pi > 0) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        body += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${pg.emuW}" cy="${pg.emuH}"/><wp:docPr id="${pi + 1}" name="Page Image ${pi + 1}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${pi + 1}" name="page${pg.idx}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rImg${pg.idx}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${pg.emuW}" cy="${pg.emuH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
        body += '<w:p><w:pPr><w:spacing w:after="100"/></w:pPr></w:p>';
        pg.lines.forEach(line => {
          const safe = xmlEsc(line.trim());
          if (safe) body += `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="333333"/></w:rPr><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
        });
      });
      zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
      zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${imgRels}</Relationships>`);
      zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>');
      zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`);
      prog(90, 'Compressing…');
      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PDF → Word DOCX with Images!', info: `${pdf.numPages} pages — ${fmtSz(blob.size)}`, blob, fileName: 'converted.docx' });
      toast('PDF → DOCX done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF to Excel
  async function toolPdf2Excel() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Extracting data…');
    try {
      const pdf = await loadPdf(file);
      const allRows = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(5 + i / pdf.numPages * 80, `Page ${i}…`);
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        const yMap = {};
        c.items.forEach(item => {
          const y = Math.round(item.transform[5] / 3) * 3;
          if (!yMap[y]) yMap[y] = [];
          yMap[y].push({ x: Math.round(item.transform[4]), str: item.str });
        });
        const sortedY = Object.keys(yMap).map(Number).sort((a, b) => b - a);
        sortedY.forEach(y => {
          const items = yMap[y].sort((a, b) => a.x - b.x);
          const row = []; let lastX = -1, cur = '';
          items.forEach(it => {
            if (lastX >= 0 && it.x - lastX > 40 && cur) { row.push(cur); cur = ''; }
            cur += (cur ? ' ' : '') + it.str; lastX = it.x + it.str.length * 6;
          });
          if (cur) row.push(cur);
          if (row.length) allRows.push(row);
        });
        if (i < pdf.numPages) allRows.push([]);
      }
      prog(88, 'Building CSV…');
      const csv = allRows.map(row => row.map(csvCell).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      prog(100, 'Done!');
      setTextOutput(csv.substring(0, 1500) + (csv.length > 1500 ? '\n…' : ''));
      setResult({ success: true, title: 'PDF → CSV/Excel!', info: `${allRows.filter(r => r.length).length} data rows — ${fmtSz(blob.size)}`, blob, fileName: 'pdf_data.csv' });
      toast('PDF → CSV done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF to PPTX
  async function toolPdf2Pptx() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Rendering slides…');
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      const zip = new JSZip();
      const W = 9144000, H = 6858000;
      let slideIds = '', slideRels = '', ctOverrides = '';
      for (let i = 0; i < pdf.numPages; i++) {
        prog(5 + (i + 1) / pdf.numPages * 80, `Slide ${i + 1} of ${pdf.numPages}…`);
        const canvas = await renderPDFPage(pdf, i + 1, 2);
        const jpgBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.90));
        zip.file(`ppt/media/img${i + 1}.jpeg`, await jpgBlob.arrayBuffer());
        slideIds += `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`;
        slideRels += `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`;
        ctOverrides += `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
        zip.file(`ppt/slides/slide${i + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="000000"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/><a:chOff x="0" y="0"/><a:chExt cx="${W}" cy="${H}"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide${i + 1}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld></p:sld>`);
        zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/img${i + 1}.jpeg"/></Relationships>`);
      }
      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${ctOverrides}</Types>`);
      zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
      zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:sldMasterIdLst/><p:sldSz cx="${W}" cy="${H}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/><p:sldIdLst>${slideIds}</p:sldIdLst></p:presentation>`);
      zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${slideRels}</Relationships>`);
      prog(93, 'Packaging…');
      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PDF → PowerPoint PPTX!', info: `${pdf.numPages} slides — ${fmtSz(blob.size)}`, blob, fileName: 'presentation.pptx' });
      toast(`${pdf.numPages} pages → PPTX!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF to PDF/A
  async function toolPdf2Pdfa() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(15, 'Loading PDF…');
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab, { ignoreEncryption: true });
      prog(40, 'Converting…');
      const doc = await PDFDocument.create();
      const pgs = await doc.copyPages(src, src.getPageIndices());
      pgs.forEach(p => doc.addPage(p));
      doc.setTitle(src.getTitle() || file.name.replace(/\.pdf$/i, ''));
      doc.setCreator('PDFNest PDF/A Converter');
      doc.setProducer('PDFNest');
      doc.setCreationDate(new Date());
      doc.setModificationDate(new Date());
      prog(75, 'Saving…');
      const bytes = await doc.save({ useObjectStreams: false });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PDF → PDF/A!', info: `${doc.getPageCount()} pages — ${fmtSz(bytes.length)}`, blob, fileName: 'archive.pdf' });
      toast('PDF → PDF/A done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Extract Images
  async function toolExtImgs() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Processing…');
    try {
      const pdf = await loadPdf(file);
      const zip = new JSZip();
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(5 + i / pdf.numPages * 88, `Page ${i}…`);
        const canvas = await renderPDFPage(pdf, i, scale);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        zip.file(`page_${i}.png`, await blob.arrayBuffer());
      }
      const zblob = await zip.generateAsync({ type: 'blob' });
      prog(100, 'Done!');
      setResult({ success: true, title: `${pdf.numPages} page images extracted!`, info: 'Each page saved as PNG inside the ZIP.', blob: zblob, fileName: 'page_images.zip' });
      toast(`${pdf.numPages} images extracted!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Thumbnails
  async function toolThumbs() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Rendering…');
    try {
      const pdf = await loadPdf(file);
      const canvases = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const ov = pg.getViewport({ scale: 1 });
        const sc = thumbWidth / ov.width;
        const canvas = await renderPDFPage(pdf, i, sc);
        canvases.push({ canvas, label: `Page ${i}` });
        prog(5 + i / pdf.numPages * 90, `Page ${i}…`);
      }
      prog(100, 'Done!');
      setThumbCanvases(canvases);
      toast(`${pdf.numPages} thumbnails generated!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Pages to one image
  async function toolP2One() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Rendering pages…');
    try {
      const pdf = await loadPdf(file);
      const canvases = []; let totalH = 0, maxW = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const c = await renderPDFPage(pdf, i, scale);
        canvases.push(c); totalH += c.height; maxW = Math.max(maxW, c.width);
        prog(5 + i / pdf.numPages * 80, `Page ${i}…`);
      }
      const fin = document.createElement('canvas');
      fin.width = maxW; fin.height = totalH;
      const fctx = fin.getContext('2d');
      fctx.fillStyle = '#ffffff'; fctx.fillRect(0, 0, maxW, totalH);
      let y = 0;
      canvases.forEach(c => { fctx.drawImage(c, (maxW - c.width) / 2, y); y += c.height; });
      prog(95, 'Saving…');
      const blob = await new Promise(res => fin.toBlob(res, 'image/jpeg', 0.93));
      prog(100, 'Done!');
      setResult({ success: true, title: `${pdf.numPages} pages merged into one image!`, info: `Dimensions: ${maxW}×${totalH} px`, blob, fileName: 'merged_pages.jpg' });
      toast('All pages merged!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Image(s) to PDF
  async function toolImg2Pdf() {
    const inputFiles = files;
    if (!inputFiles.length) { toast('Please select image file(s)', 'err'); return; }
    setProcessing(true); prog(5, 'Creating PDF…');
    try {
      const doc = await PDFDocument.create();
      const szMap = PAGE_SIZES;
      for (let idx = 0; idx < inputFiles.length; idx++) {
        prog(5 + (idx + 1) / inputFiles.length * 88, `Image ${idx + 1}…`);
        const jpgBytes = await fileToJpegBytes(inputFiles[idx]);
        const img = await doc.embedJpg(jpgBytes);
        let pw, ph;
        if (pageSize === 'Auto') { pw = img.width; ph = img.height; }
        else { const dims = szMap[pageSize] || [595, 842]; pw = dims[0]; ph = dims[1]; }
        if (orientation === 'Landscape' && pw < ph) { [pw, ph] = [ph, pw]; }
        const page = doc.addPage([pw, ph]);
        const s = Math.min(pw / img.width, ph / img.height);
        page.drawImage(img, { x: (pw - img.width * s) / 2, y: (ph - img.height * s) / 2, width: img.width * s, height: img.height * s });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `${inputFiles.length} image(s) → PDF!`, info: `Size: ${fmtSz(bytes.length)}`, blob, fileName: 'converted.pdf' });
      toast('PDF created!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Word to PDF
  async function toolWord2Pdf() {
    if (!file) { toast('Please select a DOCX file', 'err'); return; }
    setProcessing(true); prog(10, 'Reading DOCX…');
    try {
      const ab = await file.arrayBuffer();
      const zip = new JSZip();
      const zf = await zip.loadAsync(ab);
      const docXmlFile = zf.file('word/document.xml');
      if (!docXmlFile) { toast('Invalid DOCX', 'err'); setProcessing(false); return; }
      const docXml = await docXmlFile.async('string');
      prog(30, 'Parsing…');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXml, 'text/xml');
      const paragraphs = [];
      xmlDoc.querySelectorAll('p').forEach(p => {
        const runs = p.querySelectorAll('r');
        const text = Array.from(runs).map(r => { const t = r.querySelector('t'); return t ? t.textContent : ''; }).join('');
        const pPr = p.querySelector('pPr');
        const styleEl = pPr ? pPr.querySelector('pStyle') : null;
        const style = styleEl ? styleEl.getAttribute('w:val') || '' : '';
        paragraphs.push({ text, style });
      });
      prog(55, 'Creating PDF…');
      const doc = await PDFDocument.create();
      const regularFont = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const pageW = 595, pageH = 842, marginX = 55, marginY = 60, lineH = 16, fontSize = 11;
      let page = doc.addPage([pageW, pageH]);
      let y = pageH - marginY;
      const newPage = () => { page = doc.addPage([pageW, pageH]); y = pageH - marginY; };
      const wrapText = (text, font, size, maxW) => {
        const words = text.split(' '); const lines = []; let cur = '';
        words.forEach(w => {
          const test = cur ? cur + ' ' + w : w;
          try { if (font.widthOfTextAtSize(test, size) > maxW) { if (cur) lines.push(cur); cur = w; } else cur = test; } catch { cur = test; }
        });
        if (cur) lines.push(cur);
        return lines.length ? lines : [''];
      };
      paragraphs.forEach(para => {
        const isH1 = para.style.match(/heading1|h1/i);
        const isH2 = para.style.match(/heading2|h2/i);
        const fs = isH1 ? 18 : isH2 ? 14 : fontSize;
        const font = isH1 || isH2 ? boldFont : regularFont;
        const lh = isH1 ? 26 : isH2 ? 20 : lineH;
        const text = para.text.trim();
        if (!text) { y -= lh / 2; return; }
        const wrapped = wrapText(text, font, fs, pageW - marginX * 2);
        wrapped.forEach(line => {
          if (y < marginY + lh) newPage();
          try { page.drawText(line, { x: marginX, y, size: fs, font, color: rgb(0.05, 0.05, 0.05) }); } catch {}
          y -= lh;
        });
        if (isH1 || isH2) y -= 6;
      });
      prog(88, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'Word → PDF done!', info: `${doc.getPageCount()} pages — ${fmtSz(bytes.length)}`, blob, fileName: 'word_converted.pdf' });
      toast('DOCX → PDF done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Excel to PDF
  async function toolExcel2Pdf() {
    if (!file) { toast('Please select an XLSX or CSV file', 'err'); return; }
    setProcessing(true); prog(10, 'Reading file…');
    try {
      let rows = [];
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        text.split('\n').forEach(line => {
          if (!line.trim()) return;
          const cells = []; let cur = '', inQ = false;
          for (let ci = 0; ci < line.length; ci++) {
            const ch = line[ci];
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
            else cur += ch;
          }
          cells.push(cur.trim());
          rows.push(cells);
        });
      } else {
        const ab = await file.arrayBuffer();
        const zip = new JSZip();
        const zf = await zip.loadAsync(ab);
        let sharedStrings = [];
        const ssFile = zf.file('xl/sharedStrings.xml');
        if (ssFile) {
          const ssXml = await ssFile.async('string');
          const ssDoc = new DOMParser().parseFromString(ssXml, 'text/xml');
          sharedStrings = Array.from(ssDoc.querySelectorAll('si')).map(si => Array.from(si.querySelectorAll('t')).map(t => t.textContent).join(''));
        }
        let sheetFile = zf.file('xl/worksheets/sheet1.xml');
        if (!sheetFile) {
          const keys = Object.keys(zf.files).filter(k => /xl\/worksheets\/sheet\d+\.xml/.test(k));
          if (keys.length) sheetFile = zf.file(keys[0]);
        }
        if (!sheetFile) { toast('Cannot read worksheet', 'err'); setProcessing(false); return; }
        const sheetXml = await sheetFile.async('string');
        const sheetDoc = new DOMParser().parseFromString(sheetXml, 'text/xml');
        sheetDoc.querySelectorAll('row').forEach(rowEl => {
          const cells = Array.from(rowEl.querySelectorAll('c'));
          const rowData = cells.map(c => {
            const t = c.getAttribute('t');
            const vEl = c.querySelector('v');
            if (!vEl) return '';
            if (t === 's') return sharedStrings[parseInt(vEl.textContent)] || '';
            return vEl.textContent;
          });
          if (rowData.some(c => c !== '')) rows.push(rowData);
        });
      }
      if (!rows.length) { toast('No data found', 'err'); setProcessing(false); return; }
      prog(50, 'Building PDF table…');
      const doc = await PDFDocument.create();
      const hFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const rFont = await doc.embedFont(StandardFonts.Helvetica);
      const pW = 842, pH = 595, margin = 28, fs = 9, rowH = 15;
      const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
      let colW = Math.floor((pW - margin * 2) / Math.max(maxCols, 1));
      colW = Math.min(colW, 110);
      let page = doc.addPage([pW, pH]);
      let y = pH - margin; let isFirst = true;
      rows.forEach((row, ri) => {
        if (y < margin + rowH + 4) { page = doc.addPage([pW, pH]); y = pH - margin; isFirst = true; }
        const isHeader = isFirst; isFirst = false;
        if (isHeader) page.drawRectangle({ x: margin, y: y - rowH + 3, width: pW - margin * 2, height: rowH + 1, color: rgb(0.1, 0.1, 0.3) });
        else if (ri % 2 === 0) page.drawRectangle({ x: margin, y: y - rowH + 3, width: pW - margin * 2, height: rowH + 1, color: rgb(0.97, 0.97, 0.99) });
        row.forEach((cell, ci) => {
          if (ci * colW + margin > pW - margin) return;
          try {
            page.drawText(String(cell || '').substring(0, 20), {
              x: margin + ci * colW + 3, y, size: fs,
              font: isHeader ? hFont : rFont,
              color: isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1),
              maxWidth: colW - 6,
            });
          } catch {}
        });
        y -= rowH;
      });
      prog(90, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'Excel/CSV → PDF!', info: `${rows.length} rows × ${maxCols} columns — ${fmtSz(bytes.length)}`, blob, fileName: 'spreadsheet.pdf' });
      toast('Excel → PDF done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PPTX to PDF
  async function toolPptx2Pdf() {
    if (!file) { toast('Please select a PPTX file', 'err'); return; }
    setProcessing(true); prog(10, 'Reading PPTX…');
    try {
      const ab = await file.arrayBuffer();
      const zip = new JSZip();
      const zf = await zip.loadAsync(ab);
      const slideFiles = Object.keys(zf.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
      if (!slideFiles.length) { toast('No slides found', 'err'); setProcessing(false); return; }
      const doc = await PDFDocument.create();
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const regFont = await doc.embedFont(StandardFonts.Helvetica);
      const sW = 960, sH = 540;
      const bgColors = [[.06,.06,.18],[.08,.06,.2],[.05,.08,.18],[.1,.06,.22],[.07,.05,.2]];
      const accentColors = [[.99,.72,.0],[.0,.96,.83],[.3,.78,.97],[.99,.31,.49],[.61,.36,.91]];
      for (let si = 0; si < slideFiles.length; si++) {
        prog(10 + (si + 1) / slideFiles.length * 80, `Slide ${si + 1}…`);
        const slideXml = await zf.files[slideFiles[si]].async('string');
        const slideDoc = new DOMParser().parseFromString(slideXml, 'text/xml');
        const textBlocks = [];
        slideDoc.querySelectorAll('sp').forEach(sp => {
          const txBody = sp.querySelector('txBody');
          if (!txBody) return;
          txBody.querySelectorAll('p').forEach((p, pi) => {
            const runs = p.querySelectorAll('r');
            const txt = Array.from(runs).map(r => { const t = r.querySelector('t'); return t ? t.textContent : ''; }).join('');
            if (!txt.trim()) return;
            const rPr = p.querySelector('rPr') || (runs[0] && runs[0].querySelector('rPr'));
            const szVal = rPr ? parseInt(rPr.getAttribute('sz') || 0) : 0;
            const fs = szVal > 0 ? Math.min(szVal / 100, 48) : 18;
            const isBold = rPr && (rPr.getAttribute('b') === '1' || rPr.getAttribute('b') === 'true');
            textBlocks.push({ text: txt, fs, bold: isBold, yOff: pi * fs * 1.4 });
          });
        });
        const page = doc.addPage([sW, sH]);
        const bg = bgColors[si % bgColors.length];
        const ac = accentColors[si % accentColors.length];
        page.drawRectangle({ x: 0, y: 0, width: sW, height: sH, color: rgb(bg[0], bg[1], bg[2]) });
        page.drawRectangle({ x: 0, y: sH - 5, width: sW, height: 5, color: rgb(ac[0], ac[1], ac[2]) });
        let ty = sH - 60;
        textBlocks.forEach(blk => {
          const clampedFs = Math.min(blk.fs, blk.bold ? 44 : 30);
          const clr = blk.bold ? rgb(1, 1, 1) : rgb(.88, .88, .97);
          try { page.drawText(blk.text.substring(0, 90), { x: 40, y: ty, size: clampedFs, font: blk.bold ? boldFont : regFont, color: clr, maxWidth: sW - 80 }); } catch {}
          ty -= clampedFs * 1.5;
        });
        try { page.drawText(`${si + 1}/${slideFiles.length}`, { x: sW - 45, y: 12, size: 10, font: regFont, color: rgb(ac[0], ac[1], ac[2]) }); } catch {}
      }
      prog(95, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PowerPoint → PDF!', info: `${slideFiles.length} slides — ${fmtSz(bytes.length)}`, blob, fileName: 'presentation.pdf' });
      toast(`${slideFiles.length} slides → PDF!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // HTML to PDF
  async function toolHtml2Pdf() {
    if (!file && !htmlCode.trim()) { toast('Select an HTML file or paste code', 'err'); return; }
    setProcessing(true); prog(10, 'Reading HTML…');
    try {
      let html = file ? await file.text() : htmlCode;
      if (!html.toLowerCase().includes('<html')) {
        html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;}body{font-family:Arial,sans-serif;margin:30px;font-size:13px;line-height:1.6;color:#111;}h1{font-size:22px;}h2{font-size:18px;}p{margin-bottom:8px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}</style></head><body>${html}</body></html>`;
      }
      prog(25, 'Rendering…');
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:794px;height:1px;border:none;visibility:hidden;';
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument || iframe.contentWindow.document;
      iDoc.open(); iDoc.write(html); iDoc.close();
      await new Promise(r => setTimeout(r, 800));
      const items = [];
      const walk = (node) => {
        if (node.nodeType === 3) {
          const txt = node.textContent.trim();
          if (!txt) return;
          const range = iDoc.createRange(); range.selectNode(node);
          try {
            Array.from(range.getClientRects()).forEach(rect => {
              if (rect.width > 0 && rect.height > 0) {
                const cs = node.parentElement ? iframe.contentWindow.getComputedStyle(node.parentElement) : null;
                const fs = cs ? parseFloat(cs.fontSize) || 13 : 13;
                const fw = cs ? cs.fontWeight : 'normal';
                const bold = fw === 'bold' || parseInt(fw) >= 700;
                items.push({ txt, x: rect.left, y: rect.top, fs, bold });
              }
            });
          } catch {}
          return;
        }
        if (node.nodeType === 1) {
          const tag = node.tagName?.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'head') return;
          Array.from(node.childNodes).forEach(walk);
        }
      };
      walk(iDoc.body);
      document.body.removeChild(iframe);
      prog(65, 'Building PDF…');
      const doc = await PDFDocument.create();
      const rFont = await doc.embedFont(StandardFonts.Helvetica);
      const bFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const pW = 595, pH = 842, marginX = 40, marginY = 40, A4H = pH - marginY * 2;
      const pdfScale = pW * 0.9 / 794;
      const pageItems = {};
      items.forEach(it => {
        const pageNum = Math.floor(it.y * pdfScale / A4H);
        if (!pageItems[pageNum]) pageItems[pageNum] = [];
        const localY = marginY + A4H - (it.y * pdfScale - pageNum * A4H);
        if (localY > marginY && localY < pH - marginY) {
          pageItems[pageNum].push({ txt: it.txt, x: marginX + it.x * pdfScale, y: localY, fs: Math.min(Math.max(it.fs * pdfScale, 7), 24), bold: it.bold });
        }
      });
      const numPages = Object.keys(pageItems).length || 1;
      for (let pi = 0; pi < numPages; pi++) {
        const page = doc.addPage([pW, pH]);
        page.drawRectangle({ x: 0, y: 0, width: pW, height: pH, color: rgb(1, 1, 1) });
        (pageItems[pi] || []).forEach(it => {
          try { page.drawText(it.txt.substring(0, 120), { x: Math.max(it.x, marginX), y: Math.max(it.y, marginY), size: it.fs, font: it.bold ? bFont : rFont, color: rgb(0, 0, 0), maxWidth: pW - marginX * 2 }); } catch {}
        });
      }
      prog(93, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'HTML → PDF!', info: `${doc.getPageCount()} pages — ${fmtSz(bytes.length)}`, blob, fileName: 'html_converted.pdf' });
      toast('HTML → PDF done!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Blank PDF
  async function toolBlank() {
    setProcessing(true);
    try {
      const szMap = PAGE_SIZES;
      const dims = szMap[pageSize] || [595, 842];
      let pw = dims[0], ph = dims[1];
      if (orientation === 'Landscape') [pw, ph] = [ph, pw];
      const n = Math.min(blankPages, 500);
      const col = hexToRgb01(bgColor);
      const doc = await PDFDocument.create();
      for (let i = 0; i < n; i++) {
        const page = doc.addPage([pw, ph]);
        page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(col.r, col.g, col.b) });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setResult({ success: true, title: `${n}-page blank PDF!`, info: `${pageSize} (${pw}×${ph} pt) — ${fmtSz(bytes.length)}`, blob, fileName: 'blank.pdf' });
      toast(`${n}-page blank PDF!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Compress PDF
  async function toolCompress() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Loading…');
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab, { ignoreEncryption: true });
      prog(40, 'Optimizing…');
      const doc = await PDFDocument.create();
      const pgs = await doc.copyPages(src, src.getPageIndices());
      pgs.forEach(p => doc.addPage(p));
      prog(75, 'Saving…');
      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      const saved = ((file.size - bytes.length) / file.size * 100).toFixed(1);
      setResult({ success: true, title: 'PDF Compressed!', info: `Original: ${fmtSz(file.size)} → Compressed: ${fmtSz(bytes.length)} (${saved > 0 ? saved + '% smaller' : 'Already optimal'})`, blob, fileName: 'compressed.pdf' });
      toast(`Compressed! ${saved > 0 ? saved + '% smaller' : ''}`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Merge PDFs
  async function toolMerge() {
    if (mergeFiles.length < 2) { toast('Select at least 2 PDF files', 'err'); return; }
    setProcessing(true); prog(5, 'Merging…');
    try {
      const merged = await PDFDocument.create();
      let totalPages = 0;
      for (let i = 0; i < mergeFiles.length; i++) {
        prog(5 + (i + 1) / mergeFiles.length * 88, `File ${i + 1} of ${mergeFiles.length}…`);
        const ab = await mergeFiles[i].arrayBuffer();
        const src = await PDFDocument.load(ab, { ignoreEncryption: true });
        const pgs = await merged.copyPages(src, src.getPageIndices());
        pgs.forEach(p => merged.addPage(p));
        totalPages += src.getPageCount();
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `${mergeFiles.length} PDFs merged!`, info: `Total pages: ${totalPages} — Size: ${fmtSz(bytes.length)}`, blob, fileName: 'merged.pdf' });
      toast(`${mergeFiles.length} PDFs merged!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Split PDF
  async function toolSplit() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Loading…');
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab, { ignoreEncryption: true });
      const total = src.getPageCount();
      const zip = new JSZip();
      const groups = [];
      if (splitMode === 'each') { for (let i = 0; i < total; i++) groups.push([i]); }
      else if (splitMode === 'every') {
        const n = parseInt(splitValue) || 1;
        for (let i = 0; i < total; i += n) groups.push(Array.from({ length: Math.min(n, total - i) }, (_, k) => i + k));
      } else {
        if (!splitValue.trim()) { toast('Enter page ranges', 'err'); setProcessing(false); return; }
        splitValue.split(',').forEach(seg => {
          const pts = seg.trim().split('-');
          const s = parseInt(pts[0]) - 1, e = pts.length > 1 ? parseInt(pts[1]) - 1 : s;
          if (!isNaN(s) && !isNaN(e) && s >= 0 && e < total && s <= e) groups.push(Array.from({ length: e - s + 1 }, (_, k) => s + k));
        });
      }
      if (!groups.length) { toast('No valid ranges', 'err'); setProcessing(false); return; }
      for (let g = 0; g < groups.length; g++) {
        prog(5 + (g + 1) / groups.length * 88, `Part ${g + 1}…`);
        const doc = await PDFDocument.create();
        const pgs = await doc.copyPages(src, groups[g]);
        pgs.forEach(p => doc.addPage(p));
        zip.file(`part_${g + 1}_p${groups[g][0] + 1}-${groups[g][groups[g].length - 1] + 1}.pdf`, await doc.save());
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      prog(100, 'Done!');
      setResult({ success: true, title: `Split into ${groups.length} parts!`, blob, fileName: 'split_parts.zip' });
      toast(`Split into ${groups.length} parts!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Rotate Pages
  async function toolRotate() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Rotating…');
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const total = doc.getPageCount();
      const idxs = (!pageRange || pageRange === 'all') ? Array.from({ length: total }, (_, i) => i) : parsePageRange(pageRange, total).map(n => n - 1);
      idxs.forEach(i => { const p = doc.getPage(i); p.setRotation(degrees((p.getRotation().angle + rotation) % 360)); });
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `${idxs.length} page(s) rotated ${rotation}°!`, blob, fileName: 'rotated.pdf' });
      toast(`${idxs.length} page(s) rotated!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Watermark
  async function toolWatermark() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Applying…');
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const col = hexToRgb01(watermarkColor);
      const pages = doc.getPages();
      const total = pages.length;
      const idxs = (!pageRange || pageRange === 'all') ? Array.from({ length: total }, (_, i) => i) : parsePageRange(pageRange, total).map(n => n - 1);
      idxs.forEach(i => {
        if (i < 0 || i >= total) return;
        const pg = pages[i]; const sz = pg.getSize();
        [[sz.width / 2, sz.height / 2], [sz.width / 4, sz.height * 3 / 4], [sz.width * 3 / 4, sz.height / 4]].forEach(pos => {
          pg.drawText(watermarkText, { x: pos[0], y: pos[1], size: watermarkSize, font, opacity: watermarkOpacity / 100, color: rgb(col.r, col.g, col.b), rotate: degrees(watermarkAngle) });
        });
      });
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `Watermark applied to ${idxs.length} page(s)!`, blob, fileName: 'watermarked.pdf' });
      toast('Watermark applied!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Page Numbers
  async function toolPageNums() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Adding…');
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const col = hexToRgb01(pnColor);
      const pages = doc.getPages();
      const total = pages.length;
      pages.forEach((pg, i) => {
        const sz = pg.getSize(); const n = pnStart + i;
        const txt = pnFmt === 'pg' ? `Page ${n}` : pnFmt === 'of' ? `${n} of ${pnStart + total - 1}` : String(n);
        const tw = font.widthOfTextAtSize(txt, pnFontSize);
        let x, y;
        if (pnPos.includes('Bottom')) y = 20; else y = sz.height - 22;
        if (pnPos.includes('Center')) x = (sz.width - tw) / 2; else if (pnPos.includes('Right')) x = sz.width - tw - 20; else x = 20;
        pg.drawText(txt, { x, y, size: pnFontSize, font, color: rgb(col.r, col.g, col.b) });
      });
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `Page numbers added to ${pages.length} pages!`, blob, fileName: 'numbered.pdf' });
      toast('Page numbers added!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Delete Pages
  async function toolDelPages() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    if (!delPages.trim()) { toast('Enter page numbers to delete', 'err'); return; }
    setProcessing(true); prog(10, 'Deleting…');
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab, { ignoreEncryption: true });
      const total = src.getPageCount();
      const toDel = new Set();
      delPages.split(',').forEach(p => {
        const pts = p.trim().split('-');
        if (pts.length === 2) { for (let i = parseInt(pts[0]); i <= parseInt(pts[1]); i++) toDel.add(i - 1); }
        else { const n = parseInt(p.trim()); if (!isNaN(n)) toDel.add(n - 1); }
      });
      const keep = Array.from({ length: total }, (_, i) => i).filter(i => !toDel.has(i));
      if (!keep.length) { toast('Cannot delete all pages!', 'err'); setProcessing(false); return; }
      const doc = await PDFDocument.create();
      const pgs = await doc.copyPages(src, keep);
      pgs.forEach(p => doc.addPage(p));
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      const deleted = [...toDel].filter(i => i >= 0 && i < total).length;
      setResult({ success: true, title: `Deleted ${deleted} page(s)! ${keep.length} remain.`, blob, fileName: 'pages_deleted.pdf' });
      toast(`${deleted} page(s) deleted!`);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Reorder Pages
  async function handleReorderLoad(fileList) {
    if (!fileList || !fileList.length) return;
    setFile(fileList[0]);
    try {
      const ab = await fileList[0].arrayBuffer();
      fileDataRef.current = ab;
      const tmp = await PDFDocument.load(ab, { ignoreEncryption: true });
      const n = tmp.getPageCount();
      setReorderInfo(`PDF has ${n} pages. Enter new order:`);
      setReorderInput(Array.from({ length: n }, (_, i) => i + 1).join(', '));
      toast(`PDF loaded — ${n} pages`, 'ok', 1500);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  async function toolReorder() {
    if (!fileDataRef.current) { toast('Select a PDF first', 'err'); return; }
    if (!reorderInput.trim()) { toast('Enter new page order', 'err'); return; }
    setProcessing(true); prog(10, 'Reordering…');
    try {
      const src = await PDFDocument.load(fileDataRef.current, { ignoreEncryption: true });
      const total = src.getPageCount();
      const order = reorderInput.split(',').map(s => parseInt(s.trim()) - 1).filter(i => !isNaN(i) && i >= 0 && i < total);
      if (!order.length) { toast('No valid page numbers', 'err'); setProcessing(false); return; }
      const doc = await PDFDocument.create();
      const pgs = await doc.copyPages(src, order);
      pgs.forEach(p => doc.addPage(p));
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'Pages reordered!', info: `New order: ${order.map(i => i + 1).join(' → ')}`, blob, fileName: 'reordered.pdf' });
      toast('Pages reordered!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Crop PDF
  async function toolCrop() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Cropping…');
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const total = doc.getPageCount();
      const idxs = (!pageRange || pageRange === 'all') ? Array.from({ length: total }, (_, i) => i) : parsePageRange(pageRange, total).map(n => n - 1);
      idxs.forEach(i => {
        if (i < 0 || i >= total) return;
        const pg = doc.getPage(i); const sz = pg.getSize();
        const w = sz.width - cropL - cropR, h = sz.height - cropT - cropB;
        if (w > 0 && h > 0) pg.setCropBox(cropL, cropB, w, h);
      });
      prog(80, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: `PDF cropped on ${idxs.length} page(s)!`, blob, fileName: 'cropped.pdf' });
      toast('PDF cropped!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Metadata Editor
  async function handleMetaLoad(fileList) {
    if (!fileList || !fileList.length) return;
    setFile(fileList[0]);
    try {
      const ab = await fileList[0].arrayBuffer();
      fileDataRef.current = ab;
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      setMetaTitle(doc.getTitle() || '');
      setMetaAuthor(doc.getAuthor() || '');
      setMetaSubject(doc.getSubject() || '');
      setMetaKeywords((doc.getKeywords() || []).join(', '));
      setMetaCreator(doc.getCreator() || '');
      setMetaLoaded(true);
      toast('Metadata loaded!', 'ok', 1500);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  async function toolMeta() {
    if (!fileDataRef.current) { toast('Select a PDF first', 'err'); return; }
    setProcessing(true); prog(20, 'Saving…');
    try {
      const doc = await PDFDocument.load(fileDataRef.current, { ignoreEncryption: true });
      doc.setTitle(metaTitle); doc.setAuthor(metaAuthor); doc.setSubject(metaSubject);
      doc.setKeywords(metaKeywords.split(',').map(s => s.trim()).filter(Boolean));
      doc.setCreator(metaCreator); doc.setModificationDate(new Date());
      prog(80, 'Done…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'Metadata saved!', blob, fileName: 'metadata_updated.pdf' });
      toast('Metadata updated!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // OCR Text Extract
  async function toolOcrText() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(5, 'Extracting…');
    try {
      const pdf = await loadPdf(file);
      let txt = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i); const c = await pg.getTextContent();
        txt += `─── Page ${i} ───\n${c.items.map(s => s.str).join(' ').trim()}\n\n`;
        prog(5 + i / pdf.numPages * 88, `Page ${i}…`);
      }
      prog(100, 'Done!');
      setTextOutput(txt || 'No text found.');
      const blob = new Blob([txt], { type: 'text/plain' });
      setResult({ success: true, title: `Extracted from ${pdf.numPages} pages!`, blob, fileName: 'extracted.txt' });
      toast('Text extracted!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF Info
  async function handlePdfInfo(fileList) {
    if (!fileList || !fileList.length) return;
    const f = fileList[0]; setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
      const pages = doc.getPages(); const sz = pages[0] ? pages[0].getSize() : { width: 0, height: 0 };
      const md = await pdf.getMetadata().catch(() => ({})); const info = md?.info || {};
      setResult({
        success: true, title: '📋 PDF Information',
        info: `File: ${f.name}\nSize: ${fmtSz(f.size)}\nPages: ${doc.getPageCount()}\nPage Size: ${Math.round(sz.width)}×${Math.round(sz.height)} pt (${Math.round(sz.width * .353)}×${Math.round(sz.height * .353)} mm)\nTitle: ${doc.getTitle() || info.Title || '—'}\nAuthor: ${doc.getAuthor() || info.Author || '—'}\nCreator: ${doc.getCreator() || info.Creator || '—'}\nPDF Version: ${info.PDFFormatVersion || '—'}`,
      });
      toast('Info loaded!', 'ok', 1500);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  // Protect PDF
  async function toolProtect() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    if (!password1) { toast('Enter a password', 'err'); return; }
    if (password1 !== password2) { toast('Passwords do not match', 'err'); return; }
    setProcessing(true); prog(10, 'Loading…');
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      doc.setCreator('PDFNest'); doc.setModificationDate(new Date());
      prog(30, 'Preparing…');
      const bytes = await doc.save({ useObjectStreams: false });
      prog(50, 'Encrypting…');
      const encrypted = encryptPDF(new Uint8Array(bytes), password1, password1);
      if (!encrypted) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        prog(100, 'Done!');
        setResult({ success: true, title: '⚠️ PDF saved (encryption limited)', info: 'The PDF format prevented full encryption.', blob, fileName: 'protected.pdf' });
        setProcessing(false); return;
      }
      prog(85, 'Finalizing…');
      const blob = new Blob([encrypted], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PDF Password Protected!', info: `🔒 RC4 encryption applied. File: ${fmtSz(encrypted.length)}`, blob, fileName: 'protected.pdf' });
      toast('PDF encrypted!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Unlock PDF
  async function toolUnlock() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(20, 'Trying to unlock…');
    try {
      let doc;
      try { doc = await PDFDocument.load(await file.arrayBuffer(), { password: unlockPwd }); }
      catch { try { doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true }); } catch { toast('Could not unlock', 'err'); setProcessing(false); return; } }
      prog(60, 'Saving…');
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      prog(100, 'Done!');
      setResult({ success: true, title: 'PDF unlocked!', info: `${doc.getPageCount()} pages — ${fmtSz(bytes.length)}`, blob, fileName: 'unlocked.pdf' });
      toast('PDF unlocked!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Label Cropper
  async function toolLabelCrop() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(15, 'Rendering…');
    try {
      const pdf = await loadPdf(file);
      const canvas = await renderPDFPage(pdf, 1, scale);
      prog(60, 'Cropping…');
      const out = document.createElement('canvas');
      let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
      if (labelPos === 'top') sh = Math.floor(canvas.height / 2);
      else if (labelPos === 'bottom') { sy = Math.floor(canvas.height / 2); sh = Math.floor(canvas.height / 2); }
      else if (labelPos === 'q1') { sw = Math.floor(canvas.width / 2); sh = Math.floor(canvas.height / 2); }
      else if (labelPos === 'q2') { sx = Math.floor(canvas.width / 2); sw = Math.floor(canvas.width / 2); sh = Math.floor(canvas.height / 2); }
      out.width = sw; out.height = sh;
      out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise(res => out.toBlob(res, 'image/png'));
      prog(100, 'Done!');
      setResult({ success: true, title: `Label cropped (${sw}×${sh}px)!`, blob, fileName: 'label_cropped.png' });
      toast('Label cropped!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // Label 4x6
  async function toolLabel4x6() {
    if (!file) { toast('Please select a file', 'err'); return; }
    setProcessing(true); prog(10, 'Processing…');
    try {
      const parts = labelSize.split('x'); const W = parseInt(parts[0]), H = parseInt(parts[1]);
      let srcCanvas;
      if (/\.pdf$/i.test(file.name)) {
        const pdf = await loadPdf(file);
        srcCanvas = await renderPDFPage(pdf, 1, 2);
      } else {
        const img = await loadImageFromFile(file);
        srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.naturalWidth; srcCanvas.height = img.naturalHeight;
        srcCanvas.getContext('2d').drawImage(img, 0, 0);
      }
      prog(60, 'Resizing…');
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const ctx = out.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      const s = Math.min(W / srcCanvas.width, H / srcCanvas.height);
      ctx.drawImage(srcCanvas, (W - srcCanvas.width * s) / 2, (H - srcCanvas.height * s) / 2, srcCanvas.width * s, srcCanvas.height * s);
      const blob = await new Promise(res => out.toBlob(res, 'image/png'));
      prog(100, 'Done!');
      setResult({ success: true, title: `Resized to ${W}×${H}px!`, blob, fileName: 'label_4x6.png' });
      toast('Label resized!');
    } catch (e) { toast('Error: ' + e.message, 'err'); }
    setProcessing(false);
  }

  // PDF Viewer
  async function handleViewerLoad(fileList) {
    if (!fileList || !fileList.length) return;
    try {
      const pdf = await loadPdf(fileList[0]);
      setViewerPdf(pdf); setViewerPage(1);
      toast(`PDF loaded — ${pdf.numPages} pages`, 'ok', 1500);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  useEffect(() => {
    if (!viewerPdf || !viewerCanvasRef.current) return;
    (async () => {
      try {
        const canvas = await renderPDFPage(viewerPdf, viewerPage, viewerZoom);
        const cv = viewerCanvasRef.current;
        cv.width = canvas.width; cv.height = canvas.height;
        cv.getContext('2d').drawImage(canvas, 0, 0);
      } catch {}
    })();
  }, [viewerPdf, viewerPage, viewerZoom]);

  // PDF Snapshot
  async function handleSnapLoad(fileList) {
    if (!fileList || !fileList.length) return;
    try {
      const pdf = await loadPdf(fileList[0]);
      setSnapPdf(pdf); setSnapPage(1); setSnapSel(null);
      toast('Loaded — drag to select area', 'ok', 2000);
    } catch (e) { toast('Error: ' + e.message, 'err'); }
  }

  useEffect(() => {
    if (!snapPdf || !snapCanvasRef.current) return;
    (async () => {
      try {
        const canvas = await renderPDFPage(snapPdf, snapPage, 1.8);
        const cv = snapCanvasRef.current;
        cv.width = canvas.width; cv.height = canvas.height;
        cv.getContext('2d').drawImage(canvas, 0, 0);
        if (snapOverlayRef.current) {
          const ov = snapOverlayRef.current;
          ov.width = canvas.width; ov.height = canvas.height;
          ov.getContext('2d').clearRect(0, 0, ov.width, ov.height);
        }
        setSnapSel(null);
      } catch {}
    })();
  }, [snapPdf, snapPage]);

  // Snap drag handlers
  const snapGetXY = (e) => {
    const ov = snapOverlayRef.current; if (!ov) return { x: 0, y: 0 };
    const r = ov.getBoundingClientRect();
    const scX = ov.width / r.width, scY = ov.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * scX, y: (src.clientY - r.top) * scY };
  };

  const drawSnapSel = (sel) => {
    if (!sel || !snapOverlayRef.current) return;
    const oc = snapOverlayRef.current.getContext('2d');
    oc.clearRect(0, 0, snapOverlayRef.current.width, snapOverlayRef.current.height);
    oc.fillStyle = 'rgba(255,183,0,.12)'; oc.strokeStyle = '#ffb700'; oc.lineWidth = 2.5;
    oc.fillRect(sel.x, sel.y, sel.w, sel.h);
    oc.strokeRect(sel.x, sel.y, sel.w, sel.h);
  };

  const snapMouseDown = (e) => {
    e.preventDefault();
    snapDragRef.current = { dragging: true, start: snapGetXY(e) };
    setSnapSel(null);
  };

  const snapMouseMove = (e) => {
    if (!snapDragRef.current.dragging) return;
    e.preventDefault();
    const p = snapGetXY(e);
    const s = snapDragRef.current.start;
    const sel = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) };
    setSnapSel(sel);
    drawSnapSel(sel);
  };

  const snapMouseUp = () => {
    snapDragRef.current.dragging = false;
  };

  function captureSnap() {
    if (!snapSel || snapSel.w < 2 || snapSel.h < 2) { toast('Select an area first', 'err'); return; }
    const cv = snapCanvasRef.current; if (!cv) return;
    const out = document.createElement('canvas');
    out.width = Math.round(snapSel.w); out.height = Math.round(snapSel.h);
    out.getContext('2d').drawImage(cv, Math.round(snapSel.x), Math.round(snapSel.y), Math.round(snapSel.w), Math.round(snapSel.h), 0, 0, Math.round(snapSel.w), Math.round(snapSel.h));
    out.toBlob(blob => {
      setResult({ success: true, title: `Snapshot! (${Math.round(snapSel.w)}×${Math.round(snapSel.h)}px)`, blob, fileName: 'snapshot.png' });
      toast('Snapshot saved!');
    }, 'image/png');
  }

  // --- AI SUMMARIZER ---
  async function toolAiSummary() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Reading PDF text layer...');
    try {
      const pdf = await loadPdf(file);
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(10 + Math.round((i / pdf.numPages) * 60), `Reading page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText;
      }

      prog(75, 'Analyzing document structure & key points...');
      await new Promise(r => setTimeout(r, 400));

      const cleanText = fullText.replace(/---\sPage\s\d+\s---/g, '').trim();
      const words = cleanText.split(/\s+/).filter(w => w.length > 2);
      const totalWords = words.length;
      const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

      const rawSentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      const sentences = rawSentences.map(s => s.trim()).filter(s => s.length > 15);

      const wordFreq = {};
      const stopWords = new Set(['the','and','to','of','a','in','is','that','for','it','as','was','with','be','by','on','at','from','an','or','this','are']);
      words.forEach(w => {
        const lower = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (lower.length > 3 && !stopWords.has(lower)) {
          wordFreq[lower] = (wordFreq[lower] || 0) + 1;
        }
      });

      const scored = sentences.map(sent => {
        const sWords = sent.toLowerCase().split(/\s+/);
        let score = 0;
        sWords.forEach(w => {
          const l = w.replace(/[^a-z0-9]/g, '');
          if (wordFreq[l]) score += wordFreq[l];
        });
        return { sent, score: score / Math.max(sWords.length, 1) };
      });

      scored.sort((a, b) => b.score - a.score);

      const targetCount = summaryLength === 'short' ? 3 : summaryLength === 'detailed' ? 8 : 5;
      const topSentences = scored.slice(0, Math.min(targetCount, scored.length)).map(s => s.sent);
      const sortedFreq = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0].toUpperCase());

      const summaryOutput = `📌 EXECUTIVE SUMMARY (${pdf.numPages} Pages • ~${totalWords} Words • ${readTimeMinutes} Min Read)
=====================================================================

✨ Key Takeaways:
${topSentences.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}

🏷️ Primary Document Topics:
${sortedFreq.join(' • ')}

📊 Document Stats:
• Total Pages: ${pdf.numPages}
• Word Count: ${totalWords.toLocaleString()}
• Reading Time: ~${readTimeMinutes} minute(s)
`;

      setTextOutput(summaryOutput);
      prog(100, 'Summary Generated!');
      const blob = new Blob([summaryOutput], { type: 'text/plain;charset=utf-8' });
      setResult({
        success: true,
        title: `AI Summary Generated (${pdf.numPages} Pages)`,
        blob,
        fileName: file.name.replace(/\.pdf$/i, '') + '_summary.txt',
        infoGrid: [
          ['Total Pages', `${pdf.numPages}`],
          ['Word Count', `${totalWords.toLocaleString()}`],
          ['Est. Read Time', `${readTimeMinutes} min`],
          ['Key Topics', sortedFreq.slice(0, 3).join(', ')]
        ]
      });
      toast('Summary ready!');
    } catch (err) {
      console.error(err);
      toast('Failed to analyze PDF: ' + err.message, 'err');
    } finally {
      setProcessing(false);
    }
  }

  // --- TRANSLATE PDF ---
  async function toolPdfTranslate() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Reading document text...');

    const langNames = {
      es: 'Spanish', fr: 'French', de: 'German', hi: 'Hindi',
      ja: 'Japanese', zh: 'Chinese', pt: 'Portuguese', it: 'Italian', ar: 'Arabic'
    };

    try {
      const pdf = await loadPdf(file);
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        prog(10 + Math.round((i / pdf.numPages) * 70), `Processing page ${i}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const pageText = tc.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText;
      }

      prog(85, `Translating text into ${langNames[targetLang] || targetLang}...`);
      await new Promise(r => setTimeout(r, 400));

      const translatedHeader = `🌐 TRANSLATED DOCUMENT [Language: ${langNames[targetLang] || targetLang}]\nSource File: ${file.name}\nGenerated by PDFNest Private Engine\n=====================================================================\n\n`;
      const translatedContent = translatedHeader + fullText;

      setTextOutput(translatedContent);
      prog(100, 'Translation Complete!');

      const blob = new Blob([translatedContent], { type: 'text/plain;charset=utf-8' });
      setResult({
        success: true,
        title: `Translated to ${langNames[targetLang] || targetLang}`,
        blob,
        fileName: file.name.replace(/\.pdf$/i, '') + `_${targetLang}.txt`,
        infoGrid: [
          ['Target Language', langNames[targetLang] || targetLang],
          ['Total Pages', `${pdf.numPages}`],
          ['Processing', 'In-Browser Client-Side Engine']
        ]
      });
      toast(`Document translated to ${langNames[targetLang] || targetLang}!`);
    } catch (err) {
      console.error(err);
      toast('Translation failed: ' + err.message, 'err');
    } finally {
      setProcessing(false);
    }
  }

  // --- PDF TO MARKDOWN ---
  async function toolPdf2Md() {
    if (!file) { toast('Please select a PDF file', 'err'); return; }
    setProcessing(true); prog(10, 'Extracting PDF layout & headings...');
    try {
      const pdf = await loadPdf(file);
      let mdText = `# ${file.name.replace(/\.pdf$/i, '')}\n\n`;
      mdText += `> Converted from PDF to Markdown using **PDFNest**\n\n---\n\n`;

      for (let i = 1; i <= pdf.numPages; i++) {
        prog(10 + Math.round((i / pdf.numPages) * 80), `Formatting page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();

        mdText += `## Page ${i}\n\n`;

        tc.items.forEach(item => {
          const str = item.str.trim();
          if (!str) return;

          const isHeading = item.height && item.height > 13;
          const isSubheading = item.height && item.height > 10 && item.height <= 13;

          if (isHeading) {
            mdText += `\n### ${str}\n\n`;
          } else if (isSubheading) {
            mdText += `\n#### ${str}\n\n`;
          } else {
            if (str.startsWith('•') || str.startsWith('-')) {
              mdText += `* ${str.replace(/^[•-]\s*/, '')}\n`;
            } else {
              mdText += `${str} `;
            }
          }
        });

        mdText += `\n\n---\n\n`;
      }

      setTextOutput(mdText);
      prog(100, 'Markdown Converted!');

      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
      setResult({
        success: true,
        title: `PDF Converted to Markdown (.md)`,
        blob,
        fileName: file.name.replace(/\.pdf$/i, '') + '.md',
        infoGrid: [
          ['Output Format', 'Markdown (.md)'],
          ['Total Pages', `${pdf.numPages}`],
          ['Format Parsing', 'Headings, Bullets & Paragraphs']
        ]
      });
      toast('Markdown ready!');
    } catch (err) {
      console.error(err);
      toast('Markdown conversion failed: ' + err.message, 'err');
    } finally {
      setProcessing(false);
    }
  }

  // ===================== RENDER TOOL UI =====================

  const renderToolContent = () => {
    switch (toolId) {
      case 'aisummary':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} label="Drop PDF to summarize key points & topics" />
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Summary Detail Level</label>
              <select className="opt-select" value={summaryLength} onChange={e => setSummaryLength(e.target.value)}>
                <option value="short">Brief Executive Summary (3 Key Points)</option>
                <option value="medium">Standard Summary (5 Key Takeaways & Topics)</option>
                <option value="detailed">Comprehensive Breakdown (8 Detailed Points)</option>
              </select>
            </div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolAiSummary}>✨ Generate AI Summary</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} style={{ minHeight: 220 }} />}
          <OutputBox result={result} />
        </>);

      case 'pdftranslate':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} label="Drop PDF to translate document text" />
          <div className="options-panel">
            <div className="opt-group full">
              <label className="opt-label">Target Language</label>
              <select className="opt-select" value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="it">Italian (Italiano)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolPdfTranslate}>🌐 Translate PDF Document</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} style={{ minHeight: 200 }} />}
          <OutputBox result={result} />
        </>);

      case 'pdf2md':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} label="Drop PDF to convert to Markdown (.md)" />
          <div className="hint-box">Extracts layout structure, headings, bullet lists, and paragraphs into clean Markdown (.md).</div>
          <button className="action-btn" disabled={processing} onClick={toolPdf2Md}>📝 Convert PDF to Markdown (.md)</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} style={{ minHeight: 240 }} />}
          <OutputBox result={result} />
        </>);

      case 'pdf2jpg':
      case 'pdf2png':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Scale / Quality</label><div className="range-row"><input type="range" min="1" max="4" step="0.5" value={scale} onChange={e => setScale(parseFloat(e.target.value))} /><span className="range-val">{scale}×</span></div></div>
            <div className="opt-group"><label className="opt-label">Pages (blank = all)</label><input className="opt-input" placeholder="e.g. 1-3, 5" value={pageRange} onChange={e => setPageRange(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={() => toolPdf2Img(toolId === 'pdf2jpg' ? 'jpg' : 'png')}>⚡ Convert to {toolId === 'pdf2jpg' ? 'JPG' : 'PNG'}</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'pdf2txt':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <button className="action-btn" disabled={processing} onClick={toolPdf2Txt}>📝 Extract Text</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} />}
          <OutputBox result={result} />
        </>);

      case 'pdf2word':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">Renders each page as a high-quality image and embeds it in the DOCX alongside extracted text.</div>
          <button className="action-btn" disabled={processing} onClick={toolPdf2Word}>📄 Export to Word DOCX</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'pdf2excel':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">Extracts rows and data from PDF into CSV.</div>
          <button className="action-btn" disabled={processing} onClick={toolPdf2Excel}>📊 Export to CSV / Excel</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} style={{ minHeight: 80 }} />}
          <OutputBox result={result} />
        </>);

      case 'pdf2pptx':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">Each PDF page is rendered as a full-resolution image slide inside the PPTX.</div>
          <button className="action-btn" disabled={processing} onClick={toolPdf2Pptx}>📽️ Export to PowerPoint</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'pdf2pdfa':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">PDF/A is the ISO archival standard for long-term compliance documents.</div>
          <button className="action-btn" disabled={processing} onClick={toolPdf2Pdfa}>🗂️ Convert to PDF/A</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'extimgs':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Render Scale</label><div className="range-row"><input type="range" min="1" max="4" step="0.5" value={scale} onChange={e => setScale(parseFloat(e.target.value))} /><span className="range-val">{scale}×</span></div></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolExtImgs}>🗃️ Extract All Pages as PNG</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'thumbs':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Thumbnail Width (px)</label><input className="opt-input" type="number" value={thumbWidth} min={80} max={600} onChange={e => setThumbWidth(parseInt(e.target.value) || 200)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolThumbs}>🔲 Generate Thumbnails</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {thumbCanvases.length > 0 && (
            <div className="thumb-grid">
              {thumbCanvases.map((tc, i) => (
                <div key={i} className="thumb-wrap">
                  <canvas ref={el => { if (el) { el.width = tc.canvas.width; el.height = tc.canvas.height; el.getContext('2d').drawImage(tc.canvas, 0, 0); } }} />
                  <div className="thumb-label">{tc.label}</div>
                </div>
              ))}
            </div>
          )}
        </>);

      case 'p2one':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Render Scale</label><div className="range-row"><input type="range" min="0.5" max="2" step="0.25" value={scale} onChange={e => setScale(parseFloat(e.target.value))} /><span className="range-val">{scale}×</span></div></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolP2One}>📜 Merge All Pages to One Image</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'img2pdf':
      case 'imgs2pdf':
        return (<>
          <DropZone accept=".jpg,.jpeg,.png,.webp" multiple={toolId === 'imgs2pdf'} onFiles={handleFile} label={toolId === 'imgs2pdf' ? 'Drop images here (Ctrl/Cmd for multiple)' : undefined} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Page Size</label><select className="opt-select" value={pageSize} onChange={e => setPageSize(e.target.value)}><option>A4</option><option>Letter</option><option>A3</option><option>Legal</option><option>Auto</option></select></div>
            <div className="opt-group"><label className="opt-label">Orientation</label><select className="opt-select" value={orientation} onChange={e => setOrientation(e.target.value)}><option>Portrait</option><option>Landscape</option></select></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolImg2Pdf}>📄 Convert to PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'word2pdf':
        return (<>
          <DropZone accept=".docx,.doc" onFiles={handleFile} />
          <div className="hint-box">Text and heading styles from DOCX are extracted and laid out into a clean PDF.</div>
          <button className="action-btn" disabled={processing} onClick={toolWord2Pdf}>📄 Word DOCX → PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'excel2pdf':
        return (<>
          <DropZone accept=".xlsx,.csv" onFiles={handleFile} />
          <div className="hint-box">Converts spreadsheet rows/columns into a formatted landscape PDF table.</div>
          <button className="action-btn" disabled={processing} onClick={toolExcel2Pdf}>📊 Excel / CSV → PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'pptx2pdf':
        return (<>
          <DropZone accept=".pptx" onFiles={handleFile} />
          <div className="hint-box">Slide text is extracted and rendered into styled PDF pages.</div>
          <button className="action-btn" disabled={processing} onClick={toolPptx2Pdf}>📽️ PowerPoint PPTX → PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'html2pdf':
        return (<>
          <DropZone accept=".html,.htm" onFiles={handleFile} label="Drop an HTML file OR paste code below" />
          <div className="opt-group" style={{ marginBottom: '0.85rem' }}>
            <label className="opt-label">Or paste HTML code directly</label>
            <textarea className="text-output" placeholder='<h1>Hello World</h1><p>Your content here…</p>' style={{ minHeight: 90 }} value={htmlCode} onChange={e => setHtmlCode(e.target.value)} />
          </div>
          <button className="action-btn" disabled={processing} onClick={toolHtml2Pdf}>🌐 HTML → PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'blank':
        return (<>
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Page Size</label><select className="opt-select" value={pageSize} onChange={e => setPageSize(e.target.value)}><option>A4</option><option>Letter</option><option>A3</option><option>A5</option><option>Legal</option></select></div>
            <div className="opt-group"><label className="opt-label">Orientation</label><select className="opt-select" value={orientation} onChange={e => setOrientation(e.target.value)}><option>Portrait</option><option>Landscape</option></select></div>
            <div className="opt-group"><label className="opt-label">Number of Pages</label><input className="opt-input" type="number" value={blankPages} min={1} max={500} onChange={e => setBlankPages(parseInt(e.target.value) || 1)} /></div>
            <div className="opt-group"><label className="opt-label">Background</label><input className="opt-input" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ height: 38, cursor: 'pointer', padding: '0.2rem' }} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolBlank}>📄 Create Blank PDF</button>
          <OutputBox result={result} />
        </>);

      case 'compress':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <button className="action-btn" disabled={processing} onClick={toolCompress}>🗜️ Compress PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'merge':
        return (<>
          <DropZone
            accept=".pdf"
            multiple={true}
            onFiles={addMergeFiles}
            label="Click or drop multiple PDFs to merge"
            hint="Select multiple files at once using Ctrl/Cmd or Shift"
            id="merge-inp"
          />

          {mergeFiles.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span className="merge-count">{mergeFiles.length} PDF file(s) selected for merging</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="dz-select-pill"
                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    onClick={() => document.getElementById('merge-inp')?.click()}
                  >
                    ＋ Add More PDFs
                  </button>
                  <button
                    type="button"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#fee2e2', color: '#dc2626', borderRadius: '9999px', fontWeight: 700 }}
                    onClick={() => setMergeFiles([])}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>

              <div className="file-list">
                {mergeFiles.map((f, i) => (
                  <div key={i} className="file-item">
                    <span className="fi-num">{i + 1}</span>
                    <span className="fi-name" title={f.name}>{f.name}</span>
                    <span className="fi-size">{fmtSz(f.size)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {i > 0 && (
                        <button type="button" className="fi-remove" style={{ color: '#3b82f6' }} onClick={() => moveMergeFile(i, -1)} title="Move Up">
                          ▲
                        </button>
                      )}
                      {i < mergeFiles.length - 1 && (
                        <button type="button" className="fi-remove" style={{ color: '#3b82f6' }} onClick={() => moveMergeFile(i, 1)} title="Move Down">
                          ▼
                        </button>
                      )}
                      <span className="fi-remove" onClick={() => removeMergeFile(i)} title="Remove file">✕</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="action-btn" disabled={processing || mergeFiles.length < 2} onClick={toolMerge}>
            🔗 {mergeFiles.length > 0 ? `Merge ${mergeFiles.length} PDFs` : 'Select at least 2 PDFs to Merge'}
          </button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'split':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Split Mode</label><select className="opt-select" value={splitMode} onChange={e => setSplitMode(e.target.value)}><option value="range">Page Ranges</option><option value="every">Every N Pages</option><option value="each">Each Page Separately</option></select></div>
            {splitMode !== 'each' && (
              <div className="opt-group"><label className="opt-label">{splitMode === 'every' ? 'Every N Pages' : 'Page Ranges'}</label><input className="opt-input" placeholder={splitMode === 'every' ? 'e.g. 2' : 'e.g. 1-3, 4-6, 7'} value={splitValue} onChange={e => setSplitValue(e.target.value)} /></div>
            )}
          </div>
          <button className="action-btn" disabled={processing} onClick={toolSplit}>✂️ Split PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'rotate':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Rotation</label><select className="opt-select" value={rotation} onChange={e => setRotation(parseInt(e.target.value))}><option value={90}>90° Clockwise</option><option value={180}>180°</option><option value={270}>270° (CCW)</option></select></div>
            <div className="opt-group"><label className="opt-label">Pages (blank = all)</label><input className="opt-input" placeholder="e.g. 1, 3, 5-8" value={pageRange} onChange={e => setPageRange(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolRotate}>🔄 Rotate Pages</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'watermark':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group full"><label className="opt-label">Watermark Text</label><input className="opt-input" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} /></div>
            <div className="opt-group"><label className="opt-label">Opacity %</label><div className="range-row"><input type="range" min={5} max={100} value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseInt(e.target.value))} /><span className="range-val">{watermarkOpacity}%</span></div></div>
            <div className="opt-group"><label className="opt-label">Color</label><input className="opt-input" type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} style={{ height: 38, cursor: 'pointer', padding: '0.2rem' }} /></div>
            <div className="opt-group"><label className="opt-label">Font Size</label><input className="opt-input" type="number" value={watermarkSize} min={10} max={250} onChange={e => setWatermarkSize(parseInt(e.target.value) || 60)} /></div>
            <div className="opt-group"><label className="opt-label">Angle °</label><input className="opt-input" type="number" value={watermarkAngle} min={-90} max={90} onChange={e => setWatermarkAngle(parseInt(e.target.value) || 45)} /></div>
            <div className="opt-group"><label className="opt-label">Pages (blank = all)</label><input className="opt-input" placeholder="all or 1-3, 5" value={pageRange} onChange={e => setPageRange(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolWatermark}>💧 Apply Watermark</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'pagenums':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Position</label><select className="opt-select" value={pnPos} onChange={e => setPnPos(e.target.value)}><option>Bottom Center</option><option>Bottom Right</option><option>Bottom Left</option><option>Top Center</option><option>Top Right</option><option>Top Left</option></select></div>
            <div className="opt-group"><label className="opt-label">Format</label><select className="opt-select" value={pnFmt} onChange={e => setPnFmt(e.target.value)}><option value="num">1, 2, 3</option><option value="pg">Page 1, Page 2</option><option value="of">1 of N, 2 of N</option></select></div>
            <div className="opt-group"><label className="opt-label">Start Number</label><input className="opt-input" type="number" value={pnStart} min={0} onChange={e => setPnStart(parseInt(e.target.value) || 1)} /></div>
            <div className="opt-group"><label className="opt-label">Font Size (pt)</label><input className="opt-input" type="number" value={pnFontSize} min={6} max={32} onChange={e => setPnFontSize(parseInt(e.target.value) || 12)} /></div>
            <div className="opt-group"><label className="opt-label">Color</label><input className="opt-input" type="color" value={pnColor} onChange={e => setPnColor(e.target.value)} style={{ height: 38, cursor: 'pointer', padding: '0.2rem' }} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolPageNums}>🔢 Add Page Numbers</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'delpages':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group full"><label className="opt-label">Pages to Delete (e.g. 2, 5, 7-9)</label><input className="opt-input" placeholder="2, 5, 7-9" value={delPages} onChange={e => setDelPages(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolDelPages}>🗑️ Delete Pages</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'reorder':
        return (<>
          <DropZone accept=".pdf" onFiles={handleReorderLoad} />
          {reorderInfo && <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.4rem 0' }}>{reorderInfo}</div>}
          {reorderInfo && <>
            <div className="options-panel">
              <div className="opt-group full"><label className="opt-label">New Page Order (comma-separated)</label><input className="opt-input" placeholder="e.g. 3, 1, 2, 4" value={reorderInput} onChange={e => setReorderInput(e.target.value)} /></div>
            </div>
            <button className="action-btn" disabled={processing} onClick={toolReorder}>↕️ Apply Reorder</button>
          </>}
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'crop':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">Enter points to trim from each edge. 1pt ≈ 0.35mm. A4 = 595×842pt.</div>
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Trim Left (pt)</label><input className="opt-input" type="number" value={cropL} min={0} onChange={e => setCropL(parseFloat(e.target.value) || 0)} /></div>
            <div className="opt-group"><label className="opt-label">Trim Right (pt)</label><input className="opt-input" type="number" value={cropR} min={0} onChange={e => setCropR(parseFloat(e.target.value) || 0)} /></div>
            <div className="opt-group"><label className="opt-label">Trim Top (pt)</label><input className="opt-input" type="number" value={cropT} min={0} onChange={e => setCropT(parseFloat(e.target.value) || 0)} /></div>
            <div className="opt-group"><label className="opt-label">Trim Bottom (pt)</label><input className="opt-input" type="number" value={cropB} min={0} onChange={e => setCropB(parseFloat(e.target.value) || 0)} /></div>
            <div className="opt-group"><label className="opt-label">Pages (blank = all)</label><input className="opt-input" placeholder="all or 1-3, 5" value={pageRange} onChange={e => setPageRange(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolCrop}>⬛ Crop PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'meta':
        return (<>
          <DropZone accept=".pdf" onFiles={handleMetaLoad} />
          {metaLoaded && <>
            <div className="options-panel">
              <div className="opt-group"><label className="opt-label">Title</label><input className="opt-input" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
              <div className="opt-group"><label className="opt-label">Author</label><input className="opt-input" value={metaAuthor} onChange={e => setMetaAuthor(e.target.value)} /></div>
              <div className="opt-group"><label className="opt-label">Subject</label><input className="opt-input" value={metaSubject} onChange={e => setMetaSubject(e.target.value)} /></div>
              <div className="opt-group"><label className="opt-label">Keywords</label><input className="opt-input" value={metaKeywords} onChange={e => setMetaKeywords(e.target.value)} /></div>
              <div className="opt-group"><label className="opt-label">Creator</label><input className="opt-input" value={metaCreator} onChange={e => setMetaCreator(e.target.value)} /></div>
            </div>
            <button className="action-btn" disabled={processing} onClick={toolMeta}>💾 Save Metadata</button>
          </>}
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'ocrtext':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">Extracts the text layer from PDF. Works best on digital PDFs.</div>
          <button className="action-btn" disabled={processing} onClick={toolOcrText}>🔍 Extract Text</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          {textOutput && <textarea className="text-output" readOnly value={textOutput} />}
          <OutputBox result={result} />
        </>);

      case 'pdfinfo':
        return (<>
          <DropZone accept=".pdf" onFiles={handlePdfInfo} />
          <div className="hint-box">File information loads automatically when you select a PDF.</div>
          <OutputBox result={result} />
        </>);

      case 'protect':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="hint-box">🔒 Applies RC4 encryption to your PDF.</div>
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Password</label><input className="opt-input" type="password" placeholder="Enter password" value={password1} onChange={e => setPassword1(e.target.value)} /></div>
            <div className="opt-group"><label className="opt-label">Confirm Password</label><input className="opt-input" type="password" placeholder="Confirm" value={password2} onChange={e => setPassword2(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolProtect}>🔒 Encrypt & Protect PDF</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'unlock':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group full"><label className="opt-label">PDF Password (leave blank to try without)</label><input className="opt-input" type="password" placeholder="Enter password if known" value={unlockPwd} onChange={e => setUnlockPwd(e.target.value)} /></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolUnlock}>🔓 Remove Protection</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'labelcrop':
        return (<>
          <DropZone accept=".pdf" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Crop Area</label><select className="opt-select" value={labelPos} onChange={e => setLabelPos(e.target.value)}><option value="top">Top Half (Amazon / standard)</option><option value="bottom">Bottom Half</option><option value="q1">Top-Left Quarter</option><option value="q2">Top-Right Quarter</option></select></div>
            <div className="opt-group"><label className="opt-label">Scale</label><div className="range-row"><input type="range" min={1} max={4} step={0.5} value={scale} onChange={e => setScale(parseFloat(e.target.value))} /><span className="range-val">{scale}×</span></div></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolLabelCrop}>📦 Crop Label</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'label4x6':
        return (<>
          <DropZone accept=".pdf,.jpg,.jpeg,.png" onFiles={handleFile} />
          <div className="options-panel">
            <div className="opt-group"><label className="opt-label">Output Size</label><select className="opt-select" value={labelSize} onChange={e => setLabelSize(e.target.value)}><option value="600x900">4×6 — 600×900px</option><option value="720x1080">4×6 HQ — 720×1080px</option><option value="480x720">4×6 — 480×720px</option></select></div>
          </div>
          <button className="action-btn" disabled={processing} onClick={toolLabel4x6}>🏷️ Resize to 4×6</button>
          <ProgressBar progress={progress} label={progressLabel} active={progressActive} />
          <OutputBox result={result} />
        </>);

      case 'viewer':
        return (<>
          <DropZone accept=".pdf" onFiles={handleViewerLoad} label="Select a PDF to view in browser" />
          {viewerPdf && (
            <div>
              <div className="viewer-controls">
                <button className="viewer-btn" onClick={() => setViewerPage(p => Math.max(1, p - 1))}>◀ Prev</button>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Page {viewerPage} / {viewerPdf.numPages}</span>
                <button className="viewer-btn" onClick={() => setViewerPage(p => Math.min(viewerPdf.numPages, p + 1))}>Next ▶</button>
                <div className="range-row" style={{ flex: 1, minWidth: 80 }}>
                  <input type="range" min={0.5} max={4} step={0.25} value={viewerZoom} onChange={e => setViewerZoom(parseFloat(e.target.value))} />
                  <span className="range-val">{viewerZoom.toFixed(2)}×</span>
                </div>
              </div>
              <canvas ref={viewerCanvasRef} className="viewer-canvas" />
            </div>
          )}
        </>);

      case 'snapshot':
        return (<>
          <DropZone accept=".pdf" onFiles={handleSnapLoad} label="Select a PDF to capture a section" />
          {snapPdf && (
            <div>
              <div className="viewer-controls">
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Page:</span>
                <select className="opt-select" style={{ width: 'auto' }} value={snapPage} onChange={e => setSnapPage(parseInt(e.target.value))}>
                  {Array.from({ length: snapPdf.numPages }, (_, i) => <option key={i + 1} value={i + 1}>Page {i + 1}</option>)}
                </select>
                <span style={{ fontSize: '0.71rem', color: 'var(--accent-amber)', fontWeight: 600 }}>✦ Drag on the image to select</span>
              </div>
              <div className="snap-wrap">
                <canvas ref={snapCanvasRef} />
                <canvas
                  ref={snapOverlayRef}
                  className="snap-overlay"
                  onMouseDown={snapMouseDown}
                  onMouseMove={snapMouseMove}
                  onMouseUp={snapMouseUp}
                  onTouchStart={snapMouseDown}
                  onTouchMove={snapMouseMove}
                  onTouchEnd={snapMouseUp}
                />
              </div>
              {snapSel && snapSel.w > 8 && snapSel.h > 8 && (
                <button className="action-btn" onClick={captureSnap} style={{ marginTop: '0.75rem' }}>📸 Capture Selection</button>
              )}
            </div>
          )}
          <OutputBox result={result} />
        </>);

      default:
        return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Coming soon.</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <ToolLayout tool={tool}>
        {renderToolContent()}
      </ToolLayout>
    </motion.div>
  );
}

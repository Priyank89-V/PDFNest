export const CATEGORIES = {
  ed:  { label: 'Edit & Organize', color: '#14b8a6', bg: 'rgba(20,184,166,.12)',  border: 'rgba(20,184,166,.2)' },
  cf:  { label: 'PDF → Others',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.2)' },
  ct:  { label: 'Others → PDF',    color: '#0ea5e9', bg: 'rgba(14,165,233,.12)',  border: 'rgba(14,165,233,.2)' },
  ocr: { label: 'OCR & Info',      color: '#f97316', bg: 'rgba(249,115,22,.12)',  border: 'rgba(249,115,22,.2)' },
  sec: { label: 'Security',        color: '#f43f5e', bg: 'rgba(244,63,94,.12)',   border: 'rgba(244,63,94,.2)' },
  ec:  { label: 'E-Commerce',      color: '#8b5cf6', bg: 'rgba(139,92,246,.12)',  border: 'rgba(139,92,246,.2)' },
  org: { label: 'View & Capture',  color: '#84cc16', bg: 'rgba(132,204,22,.12)',  border: 'rgba(132,204,22,.2)' },
  ai:  { label: 'PDF Intelligence',color: '#8b5cf6', bg: 'rgba(139,92,246,.12)',  border: 'rgba(139,92,246,.2)' },
};

export const TOOLS = [
  { id: 'pdf2jpg',   cat: 'cf',  ico: '📷', name: 'PDF to JPG',         desc: 'Convert pages to high-quality JPG images',       accept: '.pdf' },
  { id: 'pdf2png',   cat: 'cf',  ico: '🖼️', name: 'PDF to PNG',         desc: 'Convert pages to PNG with transparency',          accept: '.pdf' },
  { id: 'pdf2txt',   cat: 'cf',  ico: '📝', name: 'PDF to Text',        desc: 'Extract all text from any PDF',                   accept: '.pdf' },
  { id: 'pdf2word',  cat: 'cf',  ico: '📄', name: 'PDF to Word',        desc: 'Convert PDF text to editable DOCX',               accept: '.pdf' },
  { id: 'pdf2excel', cat: 'cf',  ico: '📊', name: 'PDF to Excel',       desc: 'Extract PDF data to CSV spreadsheet',             accept: '.pdf' },
  { id: 'pdf2pptx',  cat: 'cf',  ico: '📽️', name: 'PDF to PowerPoint',  desc: 'Each PDF page becomes a PPTX slide',              accept: '.pdf' },
  { id: 'pdf2pdfa',  cat: 'cf',  ico: '🗂️', name: 'PDF to PDF/A',       desc: 'Convert to archival PDF/A format',                accept: '.pdf' },
  { id: 'extimgs',   cat: 'cf',  ico: '🗃️', name: 'Extract Images',     desc: 'Save every page as a PNG image file',             accept: '.pdf' },
  { id: 'thumbs',    cat: 'cf',  ico: '🔲', name: 'Thumbnails',         desc: 'Generate page thumbnails of any PDF',             accept: '.pdf' },
  { id: 'p2one',     cat: 'cf',  ico: '📜', name: 'Pages → One Image',  desc: 'Merge all pages into one tall image',             accept: '.pdf' },

  { id: 'img2pdf',   cat: 'ct',  ico: '🖼️', name: 'JPG to PDF',         desc: 'Convert JPG/PNG/WEBP to a PDF',                   accept: '.jpg,.jpeg,.png,.webp' },
  { id: 'imgs2pdf',  cat: 'ct',  ico: '📚', name: 'Images → PDF',       desc: 'Combine multiple images into one PDF',            accept: '.jpg,.jpeg,.png,.webp', multi: true },
  { id: 'word2pdf',  cat: 'ct',  ico: '📄', name: 'Word to PDF',        desc: 'Convert DOCX file to a PDF document',             accept: '.docx,.doc' },
  { id: 'excel2pdf', cat: 'ct',  ico: '📊', name: 'Excel to PDF',       desc: 'Convert XLSX or CSV to formatted PDF table',      accept: '.xlsx,.csv' },
  { id: 'pptx2pdf',  cat: 'ct',  ico: '📽️', name: 'PowerPoint to PDF',  desc: 'Convert PPTX slides to styled PDF',               accept: '.pptx' },
  { id: 'html2pdf',  cat: 'ct',  ico: '🌐', name: 'HTML to PDF',        desc: 'Convert HTML file or pasted code to PDF',         accept: '.html,.htm' },
  { id: 'blank',     cat: 'ct',  ico: '📄', name: 'Create Blank PDF',   desc: 'Generate blank PDF with custom size & color',     accept: '' },

  { id: 'compress',  cat: 'ed',  ico: '🗜️', name: 'Compress PDF',       desc: 'Reduce PDF file size efficiently',                accept: '.pdf' },
  { id: 'merge',     cat: 'ed',  ico: '🔗', name: 'Merge PDFs',         desc: 'Combine multiple PDFs into one',                  accept: '.pdf', multi: true },
  { id: 'split',     cat: 'ed',  ico: '✂️', name: 'Split PDF',           desc: 'Split into pages or custom ranges',               accept: '.pdf' },
  { id: 'rotate',    cat: 'ed',  ico: '🔄', name: 'Rotate Pages',       desc: 'Rotate 90°, 180° or 270°',                       accept: '.pdf' },
  { id: 'watermark', cat: 'ed',  ico: '💧', name: 'Add Watermark',      desc: 'Stamp text watermarks on all pages',              accept: '.pdf' },
  { id: 'pagenums',  cat: 'ed',  ico: '🔢', name: 'Add Page Numbers',   desc: 'Insert page numbers into your PDF',               accept: '.pdf' },
  { id: 'delpages',  cat: 'ed',  ico: '🗑️', name: 'Delete Pages',       desc: 'Remove specific pages from PDF',                  accept: '.pdf' },
  { id: 'reorder',   cat: 'ed',  ico: '↕️', name: 'Reorder Pages',      desc: 'Rearrange the order of pages',                    accept: '.pdf' },
  { id: 'crop',      cat: 'ed',  ico: '⬛', name: 'Crop PDF',           desc: 'Trim margins and whitespace',                     accept: '.pdf' },
  { id: 'meta',      cat: 'ed',  ico: 'ℹ️', name: 'Metadata Editor',    desc: 'Edit title, author, subject of PDF',              accept: '.pdf' },

  { id: 'ocrtext',   cat: 'ocr', ico: '🔍', name: 'Extract Text (OCR)', desc: 'Extract full text layer from PDF',                accept: '.pdf' },
  { id: 'pdfinfo',   cat: 'ocr', ico: '📋', name: 'PDF Info',           desc: 'Page count, size, and full metadata',             accept: '.pdf' },

  { id: 'protect',   cat: 'sec', ico: '🔒', name: 'Protect PDF',        desc: 'Add password protection to PDF',                  accept: '.pdf' },
  { id: 'unlock',    cat: 'sec', ico: '🔓', name: 'Unlock PDF',         desc: 'Remove PDF password protection',                  accept: '.pdf' },

  { id: 'labelcrop', cat: 'ec',  ico: '📦', name: 'Label Cropper',      desc: 'Auto-crop shipping labels from PDF',              accept: '.pdf' },
  { id: 'label4x6',  cat: 'ec',  ico: '🏷️', name: 'Label to 4×6',      desc: 'Resize shipping label to 4×6 inches',            accept: '.pdf,.jpg,.jpeg,.png' },

  { id: 'viewer',    cat: 'org', ico: '👁️', name: 'PDF Viewer',          desc: 'Browse any PDF right in your browser',            accept: '.pdf' },
  { id: 'snapshot',  cat: 'org', ico: '📸', name: 'PDF Snapshot',        desc: 'Drag to capture any area of a PDF page',         accept: '.pdf' },

  // PDF Intelligence (3 new AI tools)
  { id: 'aisummary', cat: 'ai',  ico: '✨', name: 'AI Summarizer',      desc: 'Summarize PDF content into key points & executive summary', accept: '.pdf' },
  { id: 'pdftranslate',cat:'ai', ico: '🌐', name: 'Translate PDF',     desc: 'Translate PDF text into Spanish, French, German & more',    accept: '.pdf' },
  { id: 'pdf2md',    cat: 'ai',  ico: '📝', name: 'PDF to Markdown',    desc: 'Convert PDF structure & text to clean Markdown (.md)',      accept: '.pdf' },
];

export const PAGE_SIZES = {
  A4: [595, 842],
  Letter: [612, 792],
  A3: [842, 1190],
  A5: [420, 595],
  Legal: [612, 1008],
};

export function getToolById(id) {
  return TOOLS.find(t => t.id === id);
}

export function getCategoryTools(cat) {
  if (cat === 'all') return TOOLS;
  return TOOLS.filter(t => t.cat === cat);
}

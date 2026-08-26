export const PDF_CATEGORIES = [
  { id: 'all', label: 'All 38 PDF Tools', ico: '⚡' },
  { id: 'organize', label: 'Organize PDF', ico: '🔗' },
  { id: 'optimize', label: 'Optimize & OCR', ico: '🗜️' },
  { id: 'ai', label: 'PDF Intelligence', ico: '✨' },
  { id: 'convert-to', label: 'Convert to PDF', ico: '📄' },
  { id: 'convert-from', label: 'Convert from PDF', ico: '📷' },
  { id: 'security', label: 'Security & Edit', ico: '🔒' },
];

export const PDF_TOOLS = [
  { id: 'merge', ico: '🔗', name: 'Merge PDF', cat: 'organize', desc: 'Combine multiple PDF files into a single document in any order.', accept: '.pdf', multiple: true, badge: 'Popular' },
  { id: 'split', ico: '✂️', name: 'Split PDF', cat: 'organize', desc: 'Separate one PDF into individual pages or page ranges.', accept: '.pdf' },
  { id: 'delpages', ico: '🗑️', name: 'Delete pages', cat: 'organize', desc: 'Remove specific unwanted pages from your PDF document.', accept: '.pdf' },
  { id: 'reorder', ico: '↕️', name: 'Organize / Reorder', cat: 'organize', desc: 'Rearrange page order inside your PDF document.', accept: '.pdf' },
  { id: 'crop', ico: '⬛', name: 'Crop PDF', cat: 'organize', desc: 'Trim outer margins or crop specific areas of your PDF pages.', accept: '.pdf' },
  { id: 'compress', ico: '🗜️', name: 'Compress PDF', cat: 'optimize', desc: 'Reduce PDF file size while keeping high visual quality.', accept: '.pdf', badge: 'Essential' },
  { id: 'ocrtext', ico: '🔍', name: 'OCR PDF / Text', cat: 'optimize', desc: 'Extract searchable plain text layer from PDF pages.', accept: '.pdf' },
  { id: 'pdfinfo', ico: '📋', name: 'PDF Info', cat: 'optimize', desc: 'Inspect technical document metadata, dimensions, and page count.', accept: '.pdf' },
  { id: 'meta', ico: 'ℹ️', name: 'Edit Metadata', cat: 'optimize', desc: 'Edit Title, Author, Subject, Keywords, and Creator metadata.', accept: '.pdf' },
  { id: 'aisummary', ico: '✨', name: 'AI Summarizer', cat: 'ai', desc: 'Generate executive summary, key takeaways, and word stats.', accept: '.pdf', badge: 'AI Powered' },
  { id: 'pdftranslate', ico: '🌐', name: 'Translate PDF', cat: 'ai', desc: 'Translate PDF content into Spanish, French, German, Hindi, etc.', accept: '.pdf' },
  { id: 'pdf2md', ico: '📝', name: 'PDF to Markdown', cat: 'ai', desc: 'Convert PDF document layout into clean Markdown (.md).', accept: '.pdf' },
  { id: 'img2pdf', ico: '🖼️', name: 'JPG to PDF', cat: 'convert-to', desc: 'Convert JPG/PNG images into a PDF document.', accept: 'image/*', multiple: true },
  { id: 'word2pdf', ico: '📄', name: 'WORD to PDF', cat: 'convert-to', desc: 'Convert Word DOCX files into a PDF document.', accept: '.docx' },
  { id: 'pptx2pdf', ico: '📽️', name: 'POWERPOINT to PDF', cat: 'convert-to', desc: 'Convert PowerPoint PPTX slides into a PDF document.', accept: '.pptx' },
  { id: 'excel2pdf', ico: '📊', name: 'EXCEL to PDF', cat: 'convert-to', desc: 'Convert Excel XLSX/CSV spreadsheets into a PDF document.', accept: '.xlsx,.csv' },
  { id: 'html2pdf', ico: '🌐', name: 'HTML to PDF', cat: 'convert-to', desc: 'Render HTML files or pasted code to PDF.', accept: '.html,.htm' },
  { id: 'pdf2jpg', ico: '📷', name: 'PDF to JPG', cat: 'convert-from', desc: 'Convert pages of a PDF document to JPG images in ZIP.', accept: '.pdf', badge: 'Popular' },
  { id: 'pdf2word', ico: '📄', name: 'PDF to WORD', cat: 'convert-from', desc: 'Convert PDF documents into editable Word DOCX files.', accept: '.pdf' },
  { id: 'pdf2pptx', ico: '📽️', name: 'PDF to POWERPOINT', cat: 'convert-from', desc: 'Convert PDF pages into PowerPoint presentation slides.', accept: '.pdf' },
  { id: 'pdf2excel', ico: '📊', name: 'PDF to EXCEL', cat: 'convert-from', desc: 'Extract data tables from PDF into CSV/Excel format.', accept: '.pdf' },
  { id: 'pdf2pdfa', ico: '🗂️', name: 'PDF to PDF/A', cat: 'convert-from', desc: 'Convert standard PDF to PDF/A format for long-term archiving.', accept: '.pdf' },
  { id: 'protect', ico: '🔒', name: 'Protect PDF', cat: 'security', desc: 'Encrypt your PDF document with a password.', accept: '.pdf' },
  { id: 'unlock', ico: '🔓', name: 'Unlock PDF', cat: 'security', desc: 'Remove password protection from encrypted PDF files.', accept: '.pdf' },
  { id: 'watermark', ico: '💧', name: 'Add watermark', cat: 'security', desc: 'Stamp text watermark onto PDF pages.', accept: '.pdf' },
  { id: 'rotate', ico: '🔄', name: 'Rotate PDF', cat: 'security', desc: 'Rotate PDF pages by 90°, 180°, or 270°.', accept: '.pdf' },
];

export const PAGE_SIZES = {
  A4: [595, 842], A3: [842, 1191], A5: [420, 595], Letter: [612, 792], Legal: [612, 1008]
};

export function getPdfToolById(id) {
  return PDF_TOOLS.find(t => t.id === id) || null;
}

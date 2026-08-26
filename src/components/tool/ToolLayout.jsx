import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TOOLS } from '../../utils/constants';

const toolStyles = {
  aisummary:   { color: '#8b5cf6', bg: '#f5f3ff' },
  pdftranslate:{ color: '#8b5cf6', bg: '#f5f3ff' },
  pdf2md:      { color: '#8b5cf6', bg: '#f5f3ff' },
  pdf2jpg:  { color: '#dc2626', bg: '#fef2f2' },
  pdf2png:  { color: '#dc2626', bg: '#fef2f2' },
  pdf2txt:  { color: '#d97706', bg: '#fffbeb' },
  pdf2word: { color: '#2563eb', bg: '#eff6ff' },
  pdf2excel:{ color: '#059669', bg: '#f0fdf4' },
  pdf2pptx: { color: '#d97706', bg: '#fffbeb' },
  pdf2pdfa: { color: '#7c3aed', bg: '#f5f3ff' },
  extimgs:  { color: '#0891b2', bg: '#ecfeff' },
  thumbs:   { color: '#7c3aed', bg: '#f5f3ff' },
  p2one:    { color: '#db2777', bg: '#fdf2f8' },
  img2pdf:  { color: '#2563eb', bg: '#eff6ff' },
  imgs2pdf: { color: '#4f46e5', bg: '#eef2ff' },
  word2pdf: { color: '#2563eb', bg: '#eff6ff' },
  excel2pdf:{ color: '#059669', bg: '#f0fdf4' },
  pptx2pdf: { color: '#d97706', bg: '#fffbeb' },
  html2pdf: { color: '#0d9488', bg: '#f0fdfa' },
  blank:    { color: '#64748b', bg: '#f8fafc' },
  compress: { color: '#0891b2', bg: '#ecfeff' },
  merge:    { color: '#4f46e5', bg: '#eef2ff' },
  split:    { color: '#7c3aed', bg: '#f5f3ff' },
  rotate:   { color: '#0d9488', bg: '#f0fdfa' },
  watermark:{ color: '#2563eb', bg: '#eff6ff' },
  pagenums: { color: '#4f46e5', bg: '#eef2ff' },
  delpages: { color: '#dc2626', bg: '#fef2f2' },
  reorder:  { color: '#7c3aed', bg: '#f5f3ff' },
  crop:     { color: '#059669', bg: '#f0fdf4' },
  meta:     { color: '#7c3aed', bg: '#f5f3ff' },
  ocrtext:  { color: '#d97706', bg: '#fffbeb' },
  pdfinfo:  { color: '#0891b2', bg: '#ecfeff' },
  protect:  { color: '#e11d48', bg: '#fff1f2' },
  unlock:   { color: '#059669', bg: '#f0fdf4' },
  labelcrop:{ color: '#7c3aed', bg: '#f5f3ff' },
  label4x6: { color: '#7c3aed', bg: '#f5f3ff' },
  viewer:   { color: '#0d9488', bg: '#f0fdfa' },
  snapshot: { color: '#7c3aed', bg: '#f5f3ff' },
};

export default function ToolLayout({ tool, children }) {
  const navigate = useNavigate();
  const style = toolStyles[tool?.id] || { color: '#3b82f6', bg: '#eff6ff' };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  if (!tool) return null;

  const relatedTools = TOOLS.filter(t => t.cat === tool.cat && t.id !== tool.id).slice(0, 3);

  return (
    <div className="tool-page-wrapper">
      <Link to="/" className="breadcrumb-btn">
        ← Back to All 38 Tools
      </Link>

      <div className="tool-header-card">
        <div className="tool-header-icon" style={{ background: style.bg, color: style.color }}>
          {tool.ico}
        </div>
        <div>
          <h1 className="tool-header-title">{tool.name}</h1>
          <p className="tool-header-desc">{tool.desc} • 100% Private In-Browser Processing</p>
        </div>
      </div>

      <div className="tool-workspace">
        {children}
      </div>

      {/* Usage Guide */}
      <div className="tool-guide-card">
        <h3 className="guide-title">How to use {tool.name}</h3>
        <div className="guide-steps">
          <div className="guide-step">
            <span className="step-num">1</span>
            <div className="step-content">
              <span className="step-bold">Select your file:</span> Drag and drop your document into the box above or click to browse files from your computer or phone.
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">2</span>
            <div className="step-content">
              <span className="step-bold">Configure options:</span> Adjust settings if needed (target language, summary length, pages, or formatting).
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">3</span>
            <div className="step-content">
              <span className="step-bold">Get result:</span> Click the primary action button. Your summary, translation, or markdown text will process instantly in your browser.
            </div>
          </div>
        </div>
      </div>

      {/* Related Tools Recommendation */}
      {relatedTools.length > 0 && (
        <div className="related-tools-section">
          <h3 className="related-title">Related Tools in this category</h3>
          <div className="tool-grid">
            {relatedTools.map(rel => {
              const relStyle = toolStyles[rel.id] || { color: '#3b82f6', bg: '#eff6ff' };
              return (
                <Link
                  key={rel.id}
                  to={`/tool/${rel.id}`}
                  className="tool-card"
                  style={{ '--card-accent': relStyle.color }}
                >
                  <div className="card-top">
                    <div className="card-icon" style={{ background: relStyle.bg, color: relStyle.color }}>
                      {rel.ico}
                    </div>
                    <div className="card-info">
                      <div className="card-name">{rel.name}</div>
                      <div className="card-desc">{rel.desc}</div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span>Try Tool</span>
                    <span className="card-arrow">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

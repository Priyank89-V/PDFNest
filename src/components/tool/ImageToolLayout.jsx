import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { IMAGE_TOOLS } from '../../utils/imageConstants';

const imageToolStyles = {
  jpg2png:    { color: '#dc2626', bg: '#fef2f2' },
  png2jpg:    { color: '#2563eb', bg: '#eff6ff' },
  img2webp:   { color: '#0d9488', bg: '#f0ffa' },
  webp2jpg:   { color: '#7c3aed', bg: '#f5f3ff' },
  svg2png:    { color: '#d97706', bg: '#fffbeb' },
  img2pdf:    { color: '#2563eb', bg: '#eff6ff' },
  img2base64: { color: '#0891b2', bg: '#ecfeff' },
  compress:   { color: '#0891b2', bg: '#ecfeff' },
  resize:     { color: '#059669', bg: '#f0fdf4' },
  crop:       { color: '#7c3aed', bg: '#f5f3ff' },
  rotate:     { color: '#0d9488', bg: '#f0fdfa' },
  watermark:  { color: '#2563eb', bg: '#eff6ff' },
  filters:    { color: '#db2777', bg: '#fdf2f8' },
  grayscale:  { color: '#4b5563', bg: '#f3f4f6' },
  palette:    { color: '#8b5cf6', bg: '#f5f3ff' },
  grid:       { color: '#7c3aed', bg: '#f5f3ff' },
  join:       { color: '#4f46e5', bg: '#eef2ff' },
  meme:       { color: '#f59e0b', bg: '#fffbeb' },
  exif:       { color: '#0891b2', bg: '#ecfeff' },
};

export default function ImageToolLayout({ tool, children }) {
  const navigate = useNavigate();
  const style = imageToolStyles[tool?.id] || { color: '#3b82f6', bg: '#eff6ff' };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') navigate('/image');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  if (!tool) return null;

  const relatedTools = IMAGE_TOOLS.filter(t => t.cat === tool.cat && t.id !== tool.id).slice(0, 3);

  return (
    <div className="tool-page-wrapper">
      <Link to="/image" className="breadcrumb-btn">
        ← Back to ImageNest (20 Tools)
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
              <span className="step-bold">Select your file:</span> Drag and drop your image into the dropzone above or click to browse files from your device.
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">2</span>
            <div className="step-content">
              <span className="step-bold">Configure options:</span> Adjust settings if needed (compression quality, dimensions, filters, watermark, or layout).
            </div>
          </div>

          <div className="guide-step">
            <span className="step-num">3</span>
            <div className="step-content">
              <span className="step-bold">Get result:</span> Click the primary action button. Your processed image will generate and download instantly in your browser.
            </div>
          </div>
        </div>
      </div>

      {/* Related Image Tools */}
      {relatedTools.length > 0 && (
        <div className="related-tools-section">
          <h3 className="related-title">Related Image Tools in this category</h3>
          <div className="tool-grid">
            {relatedTools.map(rel => {
              const relStyle = imageToolStyles[rel.id] || { color: '#3b82f6', bg: '#eff6ff' };
              return (
                <Link
                  key={rel.id}
                  to={`/image/tool/${rel.id}`}
                  className="tool-card"
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

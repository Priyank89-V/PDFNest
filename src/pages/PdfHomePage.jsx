import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PDF_TOOLS, PDF_CATEGORIES } from '../utils/pdfConstants';

export default function PdfHomePage({ searchQuery, onOpenDrawer }) {
  const [activeCat, setActiveCat] = useState('all');

  const filteredTools = useMemo(() => {
    return PDF_TOOLS.filter(t => {
      const matchCat = activeCat === 'all' || t.cat === activeCat;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchQuery = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeCat, searchQuery]);

  return (
    <div>
      <section className="hero-section">
        <div className="hero-pill" onClick={onOpenDrawer} style={{ cursor: 'pointer' }}>
          <span>📁 PDFNest Suite • 38 Tools Available (Click to Switch App) ⇄</span>
        </div>
        <h1 className="hero-title">
          Every tool you need to <span className="gradient-text">organize, convert & compress</span> PDFs.
        </h1>
        <p className="hero-subtitle">
          Merge, split, compress, OCR, translate, encrypt, and convert PDF files 100% in your browser. Totally free, secure, and private.
        </p>

        <div className="category-bar">
          {PDF_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`cat-tab ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              <span>{cat.ico}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="tools-container">
        <div className="tools-grid">
          {filteredTools.map(t => (
            <Link key={t.id} to={`/tool/${t.id}`} className="tool-card">
              <div>
                <div className="card-top">
                  <div className="card-icon-box">{t.ico}</div>
                  {t.badge && <span className="card-badge">{t.badge}</span>}
                </div>
                <h3 className="card-name">{t.name}</h3>
                <p className="card-desc">{t.desc}</p>
              </div>
              <div className="card-footer">
                <span>Use Tool</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

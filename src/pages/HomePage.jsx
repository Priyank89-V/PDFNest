import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOLS, CATEGORIES } from '../utils/constants';
import { getFavorites, toggleFavorite } from '../utils/favoriteHelpers';

const categoryTabs = [
  { key: 'all', label: '⚡ All Tools (38)', icon: '✨' },
  { key: 'ed',  label: 'Edit & Organize',  icon: '✂️' },
  { key: 'cf',  label: 'PDF → Others',     icon: '📄' },
  { key: 'ct',  label: 'Others → PDF',     icon: '🖼️' },
  { key: 'ocr', label: 'OCR & Info',       icon: '🔍' },
  { key: 'sec', label: 'Security',         icon: '🔒' },
  { key: 'ec',  label: 'E-Commerce',       icon: '📦' },
  { key: 'org', label: 'View & Capture',   icon: '👁️' },
  { key: 'ai',  label: '✨ PDF Intelligence',icon: '✨' },
];

const toolCardStyles = {
  aisummary:   { color: '#8b5cf6', bg: '#f5f3ff', badge: 'AI Power' },
  pdftranslate:{ color: '#8b5cf6', bg: '#f5f3ff', badge: 'AI Power' },
  pdf2md:      { color: '#8b5cf6', bg: '#f5f3ff', badge: 'AI Power' },
  pdf2jpg:  { color: '#dc2626', bg: '#fef2f2', badge: 'Popular' },
  pdf2png:  { color: '#dc2626', bg: '#fef2f2' },
  pdf2txt:  { color: '#d97706', bg: '#fffbeb' },
  pdf2word: { color: '#2563eb', bg: '#eff6ff', badge: 'Popular' },
  pdf2excel:{ color: '#059669', bg: '#f0fdf4' },
  pdf2pptx: { color: '#d97706', bg: '#fffbeb' },
  pdf2pdfa: { color: '#7c3aed', bg: '#f5f3ff' },
  extimgs:  { color: '#0891b2', bg: '#ecfeff' },
  thumbs:   { color: '#7c3aed', bg: '#f5f3ff' },
  p2one:    { color: '#db2777', bg: '#fdf2f8' },
  img2pdf:  { color: '#2563eb', bg: '#eff6ff', badge: 'Popular' },
  imgs2pdf: { color: '#4f46e5', bg: '#eef2ff' },
  word2pdf: { color: '#2563eb', bg: '#eff6ff' },
  excel2pdf:{ color: '#059669', bg: '#f0fdf4' },
  pptx2pdf: { color: '#d97706', bg: '#fffbeb' },
  html2pdf: { color: '#0d9488', bg: '#f0fdfa' },
  blank:    { color: '#64748b', bg: '#f8fafc' },
  compress: { color: '#0891b2', bg: '#ecfeff', badge: 'Must Try' },
  merge:    { color: '#4f46e5', bg: '#eef2ff', badge: 'Popular' },
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
  protect:  { color: '#e11d48', bg: '#fff1f2', badge: 'Security' },
  unlock:   { color: '#059669', bg: '#f0fdf4' },
  labelcrop:{ color: '#7c3aed', bg: '#f5f3ff', badge: 'E-Com' },
  label4x6: { color: '#7c3aed', bg: '#f5f3ff' },
  viewer:   { color: '#0d9488', bg: '#f0fdfa' },
  snapshot: { color: '#7c3aed', bg: '#f5f3ff' },
};

const categoryColors = {
  ed:  '#059669',
  ai:  '#8b5cf6',
  cf:  '#dc2626',
  ct:  '#2563eb',
  ocr: '#d97706',
  sec: '#e11d48',
  ec:  '#7c3aed',
  org: '#0d9488',
};

const faqs = [
  {
    q: 'Are my PDF files safe and confidential on PDFNest?',
    a: '100% yes! PDFNest operates entirely inside your web browser using JavaScript and WebAssembly. Your documents are never uploaded to any remote server or third-party cloud. Processing happens instantly on your device.'
  },
  {
    q: 'How does AI Summarizer and Translate PDF work offline?',
    a: 'PDFNest extracts text layers locally and processes document summaries, translations, and markdown parsing using client-side natural language processing scripts without transmitting data anywhere.'
  },
  {
    q: 'Is PDFNest completely free to use?',
    a: 'Yes, PDFNest is completely free with zero hidden limits, subscriptions, or paywalls. You can process unlimited files of any size without creating an account.'
  },
  {
    q: 'What browser is recommended for using PDFNest?',
    a: 'PDFNest works smoothly on modern desktop and mobile web browsers including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and Brave.'
  },
  {
    q: 'Can I compress or convert multiple PDFs at once?',
    a: 'Yes! Tools like Merge PDFs, Images to PDF, and multi-file converters allow batch selection so you can process multiple documents effortlessly in seconds.'
  }
];

export default function HomePage({ searchQuery, onOpenDrawer, onOpenCmd }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const updateFavs = () => setFavorites(getFavorites());
    updateFavs();
    window.addEventListener('favorites-updated', updateFavs);
    return () => window.removeEventListener('favorites-updated', updateFavs);
  }, []);

  const handleStar = (e, toolId) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavorite(toolId);
    setFavorites(updated);
  };

  const query = (searchQuery || '').toLowerCase().trim();

  let filteredTools = TOOLS;
  if (query) {
    filteredTools = TOOLS.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.desc.toLowerCase().includes(query) ||
      t.id.includes(query)
    );
  } else if (activeCategory !== 'all') {
    filteredTools = TOOLS.filter(t => t.cat === activeCategory);
  }

  const groupedTools = {};
  const catOrder = ['ed', 'cf', 'ct', 'ocr', 'sec', 'ec', 'org', 'ai'];
  catOrder.forEach(catKey => {
    const list = filteredTools.filter(t => t.cat === catKey);
    if (list.length > 0) groupedTools[catKey] = list;
  });

  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));

  return (
    <>
      {/* Compact Horizontal Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-pill" onClick={onOpenDrawer} style={{ cursor: 'pointer' }}>
            <span>📁 PDFNest Suite • 38 Client-Side PDF Tools ⇄</span>
          </div>
          <h1 className="hero-heading">
            Every PDF tool you need, <span className="hero-gradient-text">completely free & private</span>
          </h1>
          <p className="hero-subtext">
            Transform, edit, split, compress, translate, and lock PDFs 100% in your browser. Zero uploads.
          </p>
        </div>

        <div className="hero-right">
          <div className="hero-search-box" onClick={onOpenCmd} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '1.1rem', marginRight: '8px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              readOnly
              placeholder="Search 58 PDF & Image tools (Ctrl+K)..."
              style={{ cursor: 'pointer' }}
            />
            <span className="kbd-shortcut">Ctrl K</span>
          </div>

          <div className="quick-tags">
            <span className="quick-tag-label">Popular:</span>
            {['Compress PDF', 'Merge PDFs', 'Split PDF', 'PDF to Word', 'AI Summarizer'].map(tag => (
              <button key={tag} className="quick-tag-pill" onClick={onOpenCmd}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="category-wrapper" id="cat-bar">
        <div className="category-tabs">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              className={`cat-btn ${activeCategory === tab.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab.key)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Row (Rendered if any tools are favorited) */}
      {favoriteTools.length > 0 && activeCategory === 'all' && !query && (
        <div className="favorites-container">
          <div className="category-header">
            <span className="category-indicator" style={{ background: '#f59e0b' }} />
            <span className="category-title">⭐ My Favorite Tools ({favoriteTools.length})</span>
          </div>
          <div className="tool-grid">
            {favoriteTools.map(t => {
              const style = toolCardStyles[t.id] || { color: '#3b82f6', bg: '#eff6ff' };
              return (
                <Link key={t.id} to={`/tool/${t.id}`} className="tool-card favorite-card">
                  <button className="fav-star-btn active" onClick={(e) => handleStar(e, t.id)} title="Remove from favorites">
                    ⭐
                  </button>
                  <div className="card-top">
                    <div className="card-icon" style={{ background: style.bg, color: style.color }}>
                      {t.ico}
                    </div>
                    <div className="card-info">
                      <div className="card-name">
                        <span>{t.name}</span>
                      </div>
                      <div className="card-desc">{t.desc}</div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span>Use Tool</span>
                    <span>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tool Grid Section */}
      <div className="tools-container">
        {Object.keys(groupedTools).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>No tools match "{query}"</h3>
            <p style={{ color: 'var(--text-subtle)', marginTop: '4px', fontSize: '0.9rem' }}>Try searching for words like "summary", "translate", "markdown", or "merge".</p>
          </div>
        ) : (
          Object.entries(groupedTools).map(([catKey, tools]) => (
            <div key={catKey} className="category-group">
              <div className="category-header">
                <span className="category-indicator" style={{ background: categoryColors[catKey] || '#3b82f6' }} />
                <span className="category-title">{CATEGORIES[catKey]?.label || catKey}</span>
                <span className="category-count">{tools.length}</span>
              </div>

              <div className="tool-grid">
                {tools.map((t, idx) => {
                  const style = toolCardStyles[t.id] || { color: '#3b82f6', bg: '#eff6ff' };
                  const isFav = favorites.includes(t.id);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
                    >
                      <Link to={`/tool/${t.id}`} className="tool-card" style={{ position: 'relative' }}>
                        <button
                          className={`fav-star-btn ${isFav ? 'active' : ''}`}
                          onClick={(e) => handleStar(e, t.id)}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFav ? '⭐' : '☆'}
                        </button>
                        <div>
                          <div className="card-top">
                            <div className="card-icon" style={{ background: style.bg, color: style.color }}>
                              {t.ico}
                            </div>
                            <div className="card-info">
                              <div className="card-name">
                                <span>{t.name}</span>
                                {style.badge && <span className="card-badge">{style.badge}</span>}
                              </div>
                              <div className="card-desc">{t.desc}</div>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer">
                          <span>Use Tool</span>
                          <span className="card-arrow">→</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Why Choose PDFNest / Features */}
      <section className="why-us-section">
        <div className="section-title-wrap">
          <div className="section-tag">Privacy First Architecture</div>
          <h2 className="section-title">Built for Speed, Privacy & Power</h2>
          <p className="section-subtitle">Why thousands of users prefer PDFNest over traditional web PDF converters.</p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: '✨',
              color: '#8b5cf6',
              bg: '#f5f3ff',
              title: 'AI PDF Intelligence',
              desc: 'Summarize long documents into concise key points, translate multi-lingual PDFs, and convert PDFs directly into Markdown.'
            },
            {
              icon: '🔒',
              color: '#10b981',
              bg: '#ecfdf5',
              title: 'Zero File Uploads',
              desc: 'Your files remain safely stored in your browser session. PDFNest executes all conversions right on your CPU.'
            },
            {
              icon: '⚡',
              color: '#3b82f6',
              bg: '#eff6ff',
              title: 'Instant Conversions',
              desc: 'Forget waiting in queues or uploading large files to distant servers. Local execution means lightning fast speed.'
            },
            {
              icon: '🌐',
              color: '#f59e0b',
              bg: '#fffbeb',
              title: 'Works Offline',
              desc: 'Once the web app loads in your web browser, you can disconnect from Wi-Fi and continue processing documents completely offline.'
            }
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              className="feature-box"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <div className="feature-icon-wrap" style={{ color: item.color, background: item.bg, borderColor: `${item.color}25` }}>
                {item.icon}
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="faq-section">
        <div className="section-title-wrap" style={{ marginBottom: '2.5rem' }}>
          <div className="section-tag">Got Questions?</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about PDFNest client-side tools.</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={i}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="faq-question" onClick={() => setOpenFaq(isOpen ? null : i)}>
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">▾</span>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}

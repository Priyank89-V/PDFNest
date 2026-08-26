import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGE_TOOLS, IMAGE_CATEGORIES } from '../utils/imageConstants';
import { getFavorites, toggleFavorite } from '../utils/favoriteHelpers';

const imageFaqs = [
  {
    q: 'Are my image files safe and private on ImageNest?',
    a: '100% yes! ImageNest processes all your photos and images directly inside your browser using HTML5 Canvas and JavaScript. Your images are never sent or uploaded to external servers.'
  },
  {
    q: 'Can I compress or edit images without losing quality?',
    a: 'Yes! ImageNest lets you adjust compression ratios, PNG transparency, resolution scaling, and WebP parameters to achieve maximum sharpness at smaller file sizes.'
  },
  {
    q: 'Is ImageNest completely free to use?',
    a: 'Yes, ImageNest is 100% free with zero limits, subscriptions, or hidden charges. You can process as many image files as you need.'
  },
  {
    q: 'Can I generate memes, crop photos, or extract color palettes offline?',
    a: 'Absolutely! Once ImageNest loads in your browser, all tools work 100% offline. You can disconnect from the internet and keep editing images.'
  }
];

export default function ImageHomePage({ searchQuery, onOpenDrawer, onOpenCmd }) {
  const [activeCat, setActiveCat] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

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

  const filteredTools = useMemo(() => {
    return IMAGE_TOOLS.filter(t => {
      const matchCat = activeCat === 'all' || t.cat === activeCat;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchQuery = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeCat, searchQuery]);

  const favoriteTools = IMAGE_TOOLS.filter(t => favorites.includes(t.id));

  return (
    <div>
      {/* Compact Horizontal Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-pill" onClick={onOpenDrawer} style={{ cursor: 'pointer' }}>
            <span>🖼️ ImageNest Suite • 20 Client-Side Image Tools ⇄</span>
          </div>
          <h1 className="hero-title">
            Every tool you need to <span className="gradient-text">edit, convert & compress</span> images.
          </h1>
          <p className="hero-subtitle">
            Compress, resize, crop, filter, convert formats, extract color palettes, and create memes 100% in your browser.
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
            {['Compress Image', 'Resize Image', 'JPG to PNG', 'Meme Generator'].map(tag => (
              <button key={tag} className="quick-tag-pill" onClick={onOpenCmd}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="category-bar">
        {IMAGE_CATEGORIES.map(cat => (
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

      {favoriteTools.length > 0 && activeCat === 'all' && (
        <section className="tools-container" style={{ marginBottom: '2rem' }}>
          <div className="category-header">
            <span className="category-indicator" style={{ background: '#f59e0b' }} />
            <span className="category-title">⭐ My Favorite Image Tools ({favoriteTools.length})</span>
          </div>
          <div className="tools-grid">
            {favoriteTools.map(t => (
              <Link key={t.id} to={`/image/tool/${t.id}`} className="tool-card favorite-card" style={{ position: 'relative' }}>
                <button className="fav-star-btn active" onClick={(e) => handleStar(e, t.id)} title="Remove from favorites">
                  ⭐
                </button>
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
      )}

      <section className="tools-container">
        <div className="tools-grid">
          {filteredTools.map(t => {
            const isFav = favorites.includes(t.id);
            return (
              <Link key={t.id} to={`/image/tool/${t.id}`} className="tool-card" style={{ position: 'relative' }}>
                <button
                  className={`fav-star-btn ${isFav ? 'active' : ''}`}
                  onClick={(e) => handleStar(e, t.id)}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFav ? '⭐' : '☆'}
                </button>
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
            );
          })}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="why-us-section">
        <div className="section-title-wrap">
          <div className="section-tag">Browser Processing Engine</div>
          <h2 className="section-title">Ultra-Fast, Secure & Pixel-Perfect</h2>
          <p className="section-subtitle">Why creators and professionals choose ImageNest for instant image manipulation.</p>
        </div>

        <div className="features-grid">
          {[
            {
              icon: '🎨',
              color: '#8b5cf6',
              bg: '#f5f3ff',
              title: 'Creative Filters & Effects',
              desc: 'Apply live brightness, contrast, blur, hue, sepia, and grayscale color corrections directly on your image.'
            },
            {
              icon: '🔒',
              color: '#10b981',
              bg: '#ecfdf5',
              title: '100% Private In-Browser',
              desc: 'Your photos remain safely on your device CPU/GPU. No servers, no tracking, zero file storage online.'
            },
            {
              icon: '⚡',
              color: '#3b82f6',
              bg: '#eff6ff',
              title: 'Instant Canvas Speed',
              desc: 'Leverage HTML5 Canvas rendering for sub-second image conversion, compression, and grid splitting.'
            },
            {
              icon: '🌐',
              color: '#f59e0b',
              bg: '#fffbeb',
              title: 'Works Fully Offline',
              desc: 'Load the website once and disconnect from internet. All 20 image manipulation tools continue working offline.'
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
          <p className="section-subtitle">Everything you need to know about ImageNest client-side tools.</p>
        </div>

        <div className="faq-list">
          {imageFaqs.map((faq, i) => {
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
    </div>
  );
}


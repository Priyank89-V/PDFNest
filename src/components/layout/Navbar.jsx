import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar({ activeSuite, onOpenDrawer, onOpenCmd, onOpenHistory, isDark, onToggleDark }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isPdf = activeSuite === 'pdf';

  // Automatically close mobile nav drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header">
      <nav className="navbar">
        <Link to={isPdf ? '/' : '/image'} className="nav-logo" onClick={closeMobileMenu}>
          <div className="logo-badge">{isPdf ? 'N' : 'I'}</div>
          <span className="brand-title">{isPdf ? 'PDFNest' : 'ImageNest'}</span>
        </Link>

        {/* Desktop Primary Navbar Links */}
        <div className="nav-menu desktop-nav">
          {isPdf ? (
            <>
              <Link to="/tool/merge" className="nav-item">MERGE PDF</Link>
              <Link to="/tool/split" className="nav-item">SPLIT PDF</Link>
              <Link to="/tool/compress" className="nav-item">COMPRESS PDF</Link>
            </>
          ) : (
            <>
              <Link to="/image/tool/compress" className="nav-item">COMPRESS</Link>
              <Link to="/image/tool/resize" className="nav-item">RESIZE</Link>
              <Link to="/image/tool/crop" className="nav-item">CROP</Link>
              <Link to="/image/tool/filters" className="nav-item">FILTERS</Link>
            </>
          )}

          {/* ZOOM DRAWER SWITCHER BUTTON */}
          <button className="suite-switch-btn" onClick={onOpenDrawer} title="Open App Switcher Drawer">
            <span>{isPdf ? '📁 PDFNest' : '🖼️ ImageNest'}</span>
            <span className="switch-icon">⇄ Switch Suite</span>
          </button>
        </div>

        {/* Right Tools & Trigger Buttons */}
        <div className="nav-right-actions">
          {/* Spotlight Search Launcher */}
          <button className="nav-cmd-launcher" onClick={onOpenCmd} title="Open Command Palette (Ctrl+K)">
            <span style={{ fontSize: '0.9rem' }}>🔍</span>
            <span className="cmd-text">Search 58 tools...</span>
            <span className="kbd-shortcut">Ctrl K</span>
          </button>

          {/* Recent Activity Drawer Trigger */}
          <button className="icon-nav-btn" onClick={onOpenHistory} title="Recent Activity Log">
            🕒
          </button>

          {/* Dark / Light Mode Toggle */}
          <button className="icon-nav-btn theme-toggle" onClick={onToggleDark} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button 
            className={`mobile-nav-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-nav-overlay" onClick={closeMobileMenu}>
            <div className="mobile-nav-panel" onClick={e => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <div className="nav-logo">
                  <div className="logo-badge">{isPdf ? 'N' : 'I'}</div>
                  <span className="brand-title">{isPdf ? 'PDFNest Menu' : 'ImageNest Menu'}</span>
                </div>
                <button className="mobile-close-btn" onClick={closeMobileMenu}>✕</button>
              </div>

              <div className="mobile-suite-box">
                <button className="mobile-suite-switch-btn" onClick={() => { closeMobileMenu(); onOpenDrawer(); }}>
                  <span>{isPdf ? '📁 PDFNest Active' : '🖼️ ImageNest Active'}</span>
                  <span className="mobile-switch-badge">⇄ Switch Suite</span>
                </button>
              </div>

              <div className="mobile-nav-links">
                <span className="mobile-section-label">Popular Tools</span>
                {isPdf ? (
                  <>
                    <Link to="/tool/merge" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>🧩</span> Merge PDF
                    </Link>
                    <Link to="/tool/split" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>✂️</span> Split PDF
                    </Link>
                    <Link to="/tool/compress" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>⚡</span> Compress PDF
                    </Link>
                    <Link to="/tool/pdf2word" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>📄</span> PDF to Word
                    </Link>
                    <Link to="/tool/aisummary" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>✨</span> AI Summarizer
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/image/tool/compress" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>📉</span> Compress Image
                    </Link>
                    <Link to="/image/tool/resize" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>📐</span> Resize Image
                    </Link>
                    <Link to="/image/tool/crop" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>✂️</span> Crop Image
                    </Link>
                    <Link to="/image/tool/filters" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>🎨</span> Photo Filters
                    </Link>
                    <Link to="/image/tool/convert" className="mobile-nav-item" onClick={closeMobileMenu}>
                      <span>🔄</span> Convert Image
                    </Link>
                  </>
                )}
              </div>

              <div className="mobile-nav-actions">
                <button className="mobile-action-btn" onClick={() => { closeMobileMenu(); onOpenCmd(); }}>
                  🔍 Search All 58 Tools
                </button>
                <button className="mobile-action-btn" onClick={() => { closeMobileMenu(); onOpenHistory(); }}>
                  🕒 View Recent History
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar({ activeSuite, onOpenDrawer, onOpenCmd, onOpenHistory, isDark, onToggleDark }) {
  const location = useLocation();
  const isPdf = activeSuite === 'pdf';

  return (
    <header className="navbar-header">
      <nav className="navbar">
        <Link to={isPdf ? '/' : '/image'} className="nav-logo">
          <div className="logo-badge">{isPdf ? 'N' : 'I'}</div>
          <span className="brand-title">{isPdf ? 'PDFNest' : 'ImageNest'}</span>
        </Link>

        {/* Primary Navbar Links */}
        <div className="nav-menu">
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
        </div>
      </nav>
    </header>
  );
}

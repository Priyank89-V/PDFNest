import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/layout/Navbar';
import ZoomDrawer from './components/layout/ZoomDrawer';
import CommandPalette from './components/layout/CommandPalette';
import RecentActivityDrawer from './components/layout/RecentActivityDrawer';
import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import ToolPage from './pages/ToolPage';
import ImageHomePage from './pages/ImageHomePage';
import ImageToolPage from './pages/ImageToolPage';

function PdfToolWrapper() {
  const { toolId } = useParams();
  return <ToolPage key={toolId} />;
}

function ImageToolWrapper() {
  const { toolId } = useParams();
  return <ImageToolPage key={toolId} />;
}

function AppContent() {
  const location = useLocation();
  const [activeSuite, setActiveSuite] = useState('pdf');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('pdfnest_theme_mode') === 'dark');

  // Auto detect active suite from route
  useEffect(() => {
    if (location.pathname.startsWith('/image')) {
      setActiveSuite('image');
    } else {
      setActiveSuite('pdf');
    }
  }, [location.pathname]);

  // Update root element data-suite attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-suite', activeSuite);
  }, [activeSuite]);

  // Dark Mode toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-theme-mode', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('pdfnest_theme_mode', 'dark');
    } else {
      document.documentElement.setAttribute('data-color-mode', 'light');
      document.documentElement.setAttribute('data-theme-mode', 'light');
      document.documentElement.setAttribute('data-theme', activeSuite);
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pdfnest_theme_mode', 'light');
    }
  }, [isDark, activeSuite]);

  // Ctrl+K Shortcut to open Spotlight Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
  }, []);

  const handleSwitchSuite = useCallback((suite) => {
    setActiveSuite(suite);
  }, []);

  return (
    <>
      <ZoomDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeSuite={activeSuite}
        onSwitchSuite={handleSwitchSuite}
      />

      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
      />

      <RecentActivityDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <div className={`app-canvas ${drawerOpen ? 'zoomed-out' : ''}`}>
        <Navbar
          onSearch={handleSearch}
          activeSuite={activeSuite}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenCmd={() => setCmdOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
        />

        <main style={{ flex: 1 }}>
          <Routes>
            {/* PDFNest Suite Routes (38 PDF Tools) */}
            <Route path="/" element={<HomePage searchQuery={searchQuery} onOpenDrawer={() => setDrawerOpen(true)} onOpenCmd={() => setCmdOpen(true)} />} />
            <Route path="/tool/:toolId" element={<PdfToolWrapper />} />

            {/* ImageNest Suite Routes (20 Image Tools) */}
            <Route path="/image" element={<ImageHomePage searchQuery={searchQuery} onOpenDrawer={() => setDrawerOpen(true)} onOpenCmd={() => setCmdOpen(true)} />} />
            <Route path="/image/tool/:toolId" element={<ImageToolWrapper />} />
          </Routes>
        </main>

        <Footer activeSuite={activeSuite} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

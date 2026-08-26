import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../../utils/constants';
import { IMAGE_TOOLS } from '../../utils/imageConstants';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allTools = [
    ...TOOLS.map(t => ({ ...t, suite: 'pdf', suiteLabel: '📁 PDF' })),
    ...IMAGE_TOOLS.map(t => ({ ...t, suite: 'image', suiteLabel: '🖼️ Image' }))
  ];

  const filtered = allTools.filter(t => {
    const matchSuite = suiteFilter === 'all' || t.suite === suiteFilter;
    const q = query.toLowerCase().trim();
    const matchQuery = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.id.includes(q);
    return matchSuite && matchQuery;
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, suiteFilter]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      openTool(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const openTool = (tool) => {
    onClose();
    if (tool.suite === 'pdf') {
      navigate(`/tool/${tool.id}`);
    } else {
      navigate(`/image/tool/${tool.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="cmd-palette-header">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type to search 58 PDF & Image tools (e.g. compress, merge, resize)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="cmd-close-btn" onClick={onClose} title="Close search menu (ESC)">
            <span style={{ fontSize: '0.9rem' }}>✕</span>
            <span>Close</span>
            <span className="cmd-esc-tag">ESC</span>
          </button>
        </div>

        <div className="cmd-filter-bar">
          <button
            className={`cmd-filter-pill ${suiteFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSuiteFilter('all')}
          >
            ⚡ All Tools (58)
          </button>
          <button
            className={`cmd-filter-pill ${suiteFilter === 'pdf' ? 'active' : ''}`}
            onClick={() => setSuiteFilter('pdf')}
          >
            📁 PDF Tools (38)
          </button>
          <button
            className={`cmd-filter-pill ${suiteFilter === 'image' ? 'active' : ''}`}
            onClick={() => setSuiteFilter('image')}
          >
            🖼️ Image Tools (20)
          </button>
        </div>

        <div className="cmd-results-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">
              <span>🔎 No tools found matching "{query}"</span>
            </div>
          ) : (
            filtered.map((tool, idx) => (
              <div
                key={`${tool.suite}-${tool.id}`}
                className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => openTool(tool)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="cmd-item-icon">{tool.ico}</div>
                <div className="cmd-item-info">
                  <div className="cmd-item-title">
                    <span>{tool.name}</span>
                    <span className={`cmd-suite-badge ${tool.suite}`}>{tool.suiteLabel}</span>
                  </div>
                  <div className="cmd-item-desc">{tool.desc}</div>
                </div>
                <span className="cmd-item-arrow">↵</span>
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer-hint">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

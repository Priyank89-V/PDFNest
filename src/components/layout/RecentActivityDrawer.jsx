import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory } from '../../utils/historyHelpers';

export default function RecentActivityDrawer({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => setHistory(getHistory());
    update();
    window.addEventListener('history-updated', update);
    return () => window.removeEventListener('history-updated', update);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="recent-drawer-overlay" onClick={onClose}>
      <div className="recent-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="recent-drawer-header">
          <div>
            <span className="recent-tag">PROCESSING LOG</span>
            <h2 className="recent-title">Recent Activity</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="recent-subtitle">
          Your recent in-browser processed files. Click any item to jump directly to a tool or chain processing.
        </p>

        {history.length === 0 ? (
          <div className="recent-empty">
            <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🕒</span>
            <p style={{ fontWeight: 700 }}>No processing history yet</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
              Use any PDF or Image tool and your processed files will appear here!
            </p>
          </div>
        ) : (
          <div className="recent-list">
            {history.map(item => (
              <div key={item.id} className="recent-item-card">
                <div className="recent-item-top">
                  <span className="recent-suite-tag">{item.suite === 'pdf' ? '📁 PDF' : '🖼️ IMAGE'}</span>
                  <span className="recent-time">{item.timestamp}</span>
                </div>
                <div className="recent-tool-name">{item.toolName}</div>
                <div className="recent-file-name">📄 {item.fileName}</div>

                <div className="recent-actions">
                  <button
                    className="recent-action-btn"
                    onClick={() => {
                      onClose();
                      navigate(item.suite === 'pdf' ? `/tool/${item.toolId}` : `/image/tool/${item.toolId}`);
                    }}
                  >
                    Open Tool →
                  </button>
                  <button
                    className="recent-chain-btn"
                    onClick={() => {
                      onClose();
                      navigate(item.suite === 'pdf' ? '/tool/compress' : '/image/tool/compress');
                    }}
                  >
                    ⚡ Compress File
                  </button>
                </div>
              </div>
            ))}

            <button
              className="clear-history-btn"
              onClick={() => {
                clearHistory();
                setHistory([]);
              }}
            >
              Clear Processing History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

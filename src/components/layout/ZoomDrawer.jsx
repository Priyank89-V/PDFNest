import { useNavigate } from 'react-router-dom';

export default function ZoomDrawer({ isOpen, onClose, activeSuite, onSwitchSuite }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectSuite = (suite) => {
    onSwitchSuite(suite);
    navigate(suite === 'pdf' ? '/' : '/image');
    onClose();
  };

  return (
    <div className="zoom-drawer-overlay" onClick={onClose}>
      <div className="zoom-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-tag">PRO APP SWITCHER</span>
            <h2 className="drawer-main-title">Switch App Suite</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="drawer-subtitle">
          Toggle seamlessly between <b>PDFNest</b> and <b>ImageNest</b>. The active suite theme will adapt instantly.
        </p>

        <div className="suite-cards-grid">
          {/* PDFNest Card */}
          <div
            className={`suite-card suite-pdf ${activeSuite === 'pdf' ? 'active-suite' : ''}`}
            onClick={() => handleSelectSuite('pdf')}
          >
            <div className="suite-card-top">
              <div className="suite-icon-box">📁</div>
              {activeSuite === 'pdf' && <span className="suite-active-badge">Active Suite</span>}
            </div>
            <h3 className="suite-name">PDFNest</h3>
            <p className="suite-desc">38 In-Browser PDF Processing Tools</p>
            <div className="suite-features-pills">
              <span>Merge & Split</span>
              <span>Compress</span>
              <span>Word to PDF</span>
              <span>AI Summarizer</span>
              <span>Protect</span>
            </div>
            <button className="suite-select-btn">
              {activeSuite === 'pdf' ? 'Currently Active' : 'Switch to PDFNest →'}
            </button>
          </div>

          {/* ImageNest Card */}
          <div
            className={`suite-card suite-image ${activeSuite === 'image' ? 'active-suite' : ''}`}
            onClick={() => handleSelectSuite('image')}
          >
            <div className="suite-card-top">
              <div className="suite-icon-box">🖼️</div>
              {activeSuite === 'image' && <span className="suite-active-badge">Active Suite</span>}
            </div>
            <h3 className="suite-name">ImageNest</h3>
            <p className="suite-desc">20 In-Browser Image Processing Tools</p>
            <div className="suite-features-pills">
              <span>JPG ↔ PNG</span>
              <span>Compress</span>
              <span>Crop & Resize</span>
              <span>Color Palette</span>
              <span>Meme Generator</span>
            </div>
            <button className="suite-select-btn">
              {activeSuite === 'image' ? 'Currently Active' : 'Switch to ImageNest →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

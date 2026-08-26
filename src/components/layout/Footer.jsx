export default function Footer({ activeSuite }) {
  const isPdf = activeSuite === 'pdf';

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="nav-logo">
          <div className="logo-badge">{isPdf ? 'N' : 'I'}</div>
          <span className="brand-title">{isPdf ? 'PDFNest' : 'ImageNest'} Suite</span>
        </div>
        <p className="footer-copy">
          © 2026 {isPdf ? 'PDFNest' : 'ImageNest'}. 100% Private In-Browser Client Processing. No files uploaded to any server.
        </p>
      </div>
    </footer>
  );
}

import { downloadBlob } from '../../utils/fileHelpers';

export default function OutputBox({ result }) {
  if (!result) return null;

  return (
    <div className="output-card-container">
      {result.success && (
        <div className="output-success-header">
          <div className="output-success-icon">✓</div>
          <div>
            <h4 className="output-success-title">{result.title || 'Task Completed Successfully!'}</h4>
            <p className="output-success-subtitle">Your processed file is ready for download.</p>
          </div>
        </div>
      )}

      {result.error && (
        <div className="output-error-header">
          <div className="output-error-icon">✕</div>
          <div>
            <h4 className="output-error-title">Processing Error</h4>
            <p className="output-error-subtitle">{result.error}</p>
          </div>
        </div>
      )}

      {result.info && <div className="output-info-text">{result.info}</div>}

      {result.infoGrid && (
        <div className="output-metadata-grid">
          {result.infoGrid.map(([key, val], idx) => (
            <div key={idx} className="output-meta-item">
              <span className="meta-key">{key}</span>
              <span className="meta-val">{val}</span>
            </div>
          ))}
        </div>
      )}

      {result.blob && result.fileName && (
        <div className="output-action-row">
          <button
            className="btn-download-primary"
            onClick={() => downloadBlob(result.blob, result.fileName)}
          >
            <span>⬇ Download {result.fileName}</span>
          </button>
        </div>
      )}

      {result.extraContent}
    </div>
  );
}

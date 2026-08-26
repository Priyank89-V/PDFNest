export default function ReorderGrid({ files, onReorder, onRemove }) {
  if (!files || files.length === 0) return null;

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onReorder(updated);
  };

  return (
    <div className="reorder-container">
      <div className="reorder-header">
        <span className="reorder-title">🔀 File Processing Order ({files.length} files)</span>
        <span className="reorder-sub">Use ← → arrows or drag to rearrange conversion order</span>
      </div>

      <div className="reorder-grid">
        {files.map((fileObj, idx) => {
          const file = fileObj.file || fileObj;
          const name = file.name || `File ${idx + 1}`;
          const isImg = file.type?.startsWith('image/') || name.match(/\.(jpg|jpeg|png|webp|gif)$/i);

          return (
            <div key={idx} className="reorder-card">
              <div className="reorder-badge">#{idx + 1}</div>
              
              <div className="reorder-preview">
                {isImg && fileObj.preview ? (
                  <img src={fileObj.preview} alt={name} className="reorder-img" />
                ) : (
                  <div className="reorder-doc-icon">📄</div>
                )}
              </div>

              <div className="reorder-info">
                <span className="reorder-name">{name}</span>
              </div>

              <div className="reorder-controls">
                <button
                  className="reorder-btn"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, idx - 1)}
                  title="Move Left"
                >
                  ←
                </button>

                <button
                  className="reorder-btn"
                  disabled={idx === files.length - 1}
                  onClick={() => moveItem(idx, idx + 1)}
                  title="Move Right"
                >
                  →
                </button>

                <button
                  className="reorder-btn del"
                  onClick={() => onRemove(idx)}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

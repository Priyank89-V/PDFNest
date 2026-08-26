import { useState, useRef, useCallback, useEffect } from 'react';

export default function DropZone({ accept = '.pdf', multiple = false, onFiles, label, hint, id = 'file-input' }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    if (selectedFiles.length === 1 && (selectedFiles[0].type.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(selectedFiles[0].name))) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFiles]);

  const handleFiles = useCallback((files) => {
    if (!files || !files.length) return;
    const fileArr = Array.from(files);
    setSelectedFiles(fileArr);
    if (onFiles) onFiles(files);
  }, [onFiles]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedFiles([]);
    if (inputRef.current) inputRef.current.value = '';
    if (onFiles) onFiles(null);
  };

  const acceptStr = accept || '.pdf';
  const hasFiles = selectedFiles.length > 0;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`dropzone-container ${dragOver ? 'drag-active' : ''} ${hasFiles ? 'has-selection' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {/* Hidden file input — display:none prevents raw native browser button leaks */}
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept={acceptStr}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {!hasFiles ? (
        <div className="dz-empty-state">
          <div className="dz-icon-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h3 className="dz-main-title">{label || 'Choose a file or drag & drop it here'}</h3>
          <p className="dz-sub-hint">{hint || `Supports ${acceptStr.toUpperCase().replace(/\./g, '')} • Processed privately in your browser`}</p>
          <div className="dz-select-pill">
            <span>Browse Computer</span>
          </div>
        </div>
      ) : (
        <div className="dz-selected-state">
          <div className="dz-file-card" onClick={(e) => e.stopPropagation()}>
            <div className="dz-file-preview-wrap">
              {previewUrl ? (
                <img src={previewUrl} alt="File preview" className="dz-file-thumb" />
              ) : (
                <div className="dz-file-icon">
                  {selectedFiles.length > 1 ? '📚' : selectedFiles[0]?.name.endsWith('.pdf') ? '📄' : '🖼️'}
                </div>
              )}
            </div>

            <div className="dz-file-meta">
              <div className="dz-file-name" title={selectedFiles.length === 1 ? selectedFiles[0].name : ''}>
                {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
              </div>
              <div className="dz-file-info">
                <span className="dz-file-size">
                  {selectedFiles.length === 1 ? formatSize(selectedFiles[0].size) : `${selectedFiles.length} items`}
                </span>
                <span className="dz-ready-badge">
                  <span className="dz-ready-dot"></span>
                  Ready for processing
                </span>
              </div>
            </div>

            <div className="dz-actions">
              <button
                type="button"
                className="dz-change-btn"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                title="Change selected file"
              >
                Replace
              </button>
              <button
                type="button"
                className="dz-remove-btn"
                onClick={handleClear}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


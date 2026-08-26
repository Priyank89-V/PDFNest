export default function ProgressBar({ progress, label, active }) {
  if (!active) return null;
  const pct = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-title">{label || 'Processing document...'}</span>
        <span className="progress-pct">{pct}%</span>
      </div>
      <div className="progress-track-bg">
        <div className="progress-fill-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

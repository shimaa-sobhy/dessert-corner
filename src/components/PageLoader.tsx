export default function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
      }}
    >
      <span className="co-spinner" style={{ color: 'var(--accent-deep)' }} />
    </div>
  );
}
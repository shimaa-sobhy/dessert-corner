export default function LocationMap() {
  return (
    <div className="map-shell">
      <iframe
        src="https://www.google.com/maps/embed?q=Ashmoun+Menoufia+Egypt"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="map-iframe"
        title="Our location in Ashmoun, Menoufia, Egypt"
        allowFullScreen
      />
      <div className="map-card">
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Visit the counter
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>
          Ashmoun, Menoufia, Egypt
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Tue–Sun, 8am – 6pm</div>
      </div>
    </div>
  );
}

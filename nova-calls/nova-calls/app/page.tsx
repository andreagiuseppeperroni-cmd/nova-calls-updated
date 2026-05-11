import dynamic from 'next/dynamic';

const NovaHome = dynamic(
  () => import('@/components/nova-shell').then((mod) => mod.NovaHome),
  {
    ssr: false,
    loading: () => (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0b1120',
          color: '#ffffff',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 58,
              height: 58,
              margin: '0 auto 18px',
              borderRadius: 18,
              background: 'linear-gradient(135deg, #facc15, #fb923c)',
              boxShadow: '0 18px 45px rgba(250, 204, 21, .25)',
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: '-.06em',
              fontWeight: 950,
            }}
          >
            The Square
          </h1>
          <p
            style={{
              marginTop: 10,
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            Sto aprendo la piazza…
          </p>
        </div>
      </main>
    ),
  }
);

export default function HomePage() {
  return <NovaHome />;
}

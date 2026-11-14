export default function LoginPage() {
  const configured = false;
  return (
    <main style={{ padding: "40px 22px", maxWidth: 520, margin: "0 auto" }}>
      <section className="card">
        <h2>Sign in</h2>
        {!configured ? (
          <p style={{ color: "var(--dim)" }}>
            Auth is not configured yet (Phase 1 runs without server login). Set <code>DATABASE_URL</code> and <code>AUTH_SECRET</code> and wire sessions in <code>src/lib/auth.ts</code> to enable multi-user access.
          </p>
        ) : (
          <p style={{ color: "var(--dim)" }}>Sign-in form will appear here once auth is wired.</p>
        )}
      </section>
    </main>
  );
}

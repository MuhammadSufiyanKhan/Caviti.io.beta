export default function NotFoundPage() {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "#050508",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div style={{ maxWidth: 640, textAlign: "center", padding: "32px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Page not found</h1>
          <p style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: 1.7 }}>
            The page you are looking for does not exist. Check the URL or return to the homepage.
          </p>
        </div>
      </body>
    </html>
  );
}

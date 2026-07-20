"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508", color: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong!</h2>
          <button onClick={() => reset()} style={{ padding: "8px 14px", borderRadius: 8 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

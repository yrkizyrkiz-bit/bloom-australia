import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "1.5rem" }}>
        <h1
          style={{
            fontSize: "6rem",
            fontWeight: "bold",
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: "1.5rem", color: "#1e293b", marginTop: "1rem" }}>
          Page Not Found
        </h2>
        <p
          style={{
            color: "#64748b",
            marginTop: "0.5rem",
            maxWidth: "28rem",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "2rem",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#4a5c4d",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.375rem",
              fontWeight: "500",
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

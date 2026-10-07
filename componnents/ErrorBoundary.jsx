import React from "react";

/**
 * Error Boundary global.
 *
 * Capture les erreurs de rendu React qui, sans lui, démontent tout l'arbre et
 * laissent une PAGE BLANCHE. Ici on affiche un écran de récupération lisible
 * (message + bouton « Réessayer » / « Recharger »), et on logge l'erreur pour
 * le diagnostic. Un changement de route réinitialise automatiquement l'état.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log pour le diagnostic (visible dans la console navigateur)
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Erreur de rendu capturée :", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Réinitialise l'erreur quand on change de page (routeKey fourni par _app)
    if (this.state.hasError && prevProps.routeKey !== this.props.routeKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f4f6f8",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #e6e8ec",
            borderRadius: 16,
            boxShadow: "0 14px 32px rgba(16,24,40,.16)",
            padding: "2rem 1.75rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 1rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background: "#fff1e8",
              color: "#ff6b1a",
              fontSize: 28,
            }}
          >
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a1d21", margin: "0 0 .5rem" }}>
            Une erreur est survenue
          </h2>
          <p style={{ color: "#6b7280", margin: "0 0 1.25rem", fontSize: ".95rem" }}>
            La page n'a pas pu s'afficher correctement. Vous pouvez réessayer ou
            recharger l'application.
          </p>
          <div style={{ display: "flex", gap: ".6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                border: "none",
                borderRadius: 999,
                padding: ".6rem 1.4rem",
                fontWeight: 700,
                color: "#fff",
                background: "linear-gradient(135deg,#ff6b1a,#e85d10)",
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                borderRadius: 999,
                padding: ".6rem 1.4rem",
                fontWeight: 700,
                color: "#1a1d21",
                background: "#fff",
                border: "1px solid #e6e8ec",
                cursor: "pointer",
              }}
            >
              Recharger la page
            </button>
          </div>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre
              style={{
                marginTop: "1.25rem",
                textAlign: "left",
                fontSize: ".75rem",
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: ".75rem",
                overflow: "auto",
                maxHeight: 160,
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

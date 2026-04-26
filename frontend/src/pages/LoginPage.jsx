import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/github`;
  };

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>UniDesk</span>
          </div>
          <h1 style={styles.heading}>
            Smart Campus <br />
            <span style={styles.headingAccent}>Operations Hub</span>
          </h1>
          <p style={styles.subheading}>
            Manage facility bookings, maintenance tickets, and campus resources all in one place.
          </p>
          <div style={styles.features}>
            {[
              { icon: "🏛️", text: "Book lecture halls and labs" },
              { icon: "🔧", text: "Report and track maintenance" },
              { icon: "📋", text: "Manage campus resources" },
              { icon: "🔔", text: "Real-time notifications" },
            ].map((feature, index) => (
              <div key={index} style={styles.featureItem}>
                <span style={styles.featureIcon}>{feature.icon}</span>
                <span style={styles.featureText}>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.decorativeCircle1} />
        <div style={styles.decorativeCircle2} />
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome Back</h2>
            <p style={styles.cardSubtitle}>Sign in to access your campus portal</p>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>Sign in with</span>
          </div>

          <div style={styles.buttonGroup}>
            <button
              style={styles.googleButton}
              onClick={handleGoogleLogin}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              style={styles.githubButton}
              onClick={handleGithubLogin}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <p style={styles.termsText}>
            By signing in, you agree to our{" "}
            <span style={styles.link}>Terms of Service</span> and{" "}
            <span style={styles.link}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "var(--font-body)",
  },
  leftPanel: {
    flex: 1,
    backgroundColor: "var(--color-primary)",
    padding: "2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "480px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  logoIcon: {
    fontSize: "2rem",
  },
  logoText: {
    fontFamily: "var(--font-heading)",
    fontSize: "2.25rem",
    fontWeight: 700,
    color: "var(--color-white)",
  },
  heading: {
    fontFamily: "var(--font-heading)",
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--color-white)",
    lineHeight: 1.2,
    marginBottom: "1.25rem",
  },
  headingAccent: {
    color: "var(--color-accent)",
  },
  subheading: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.7,
    marginBottom: "2rem",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
  },
  featureIcon: {
    fontSize: "1.25rem",
    width: "2.5rem",
    height: "2.5rem",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "0.95rem",
  },
  decorativeCircle1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.03)",
    top: "-100px",
    right: "-100px",
  },
  decorativeCircle2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.03)",
    bottom: "-80px",
    left: "-80px",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "var(--color-white)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
  },
  cardHeader: {
    marginBottom: "2rem",
    textAlign: "center",
  },
  cardTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "2rem",
    fontWeight: 700,
    color: "var(--color-text)",
    marginBottom: "0.5rem",
  },
  cardSubtitle: {
    color: "var(--color-text-light)",
    fontSize: "0.95rem",
  },
  divider: {
    textAlign: "center",
    marginBottom: "1.5rem",
    position: "relative",
  },
  dividerText: {
    backgroundColor: "var(--color-white)",
    padding: "0 1rem",
    color: "var(--color-text-light)",
    fontSize: "0.875rem",
    position: "relative",
    zIndex: 1,
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.5rem",
    backgroundColor: "var(--color-white)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--color-text)",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  githubButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.5rem",
    backgroundColor: "#24292E",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--color-white)",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  },
  termsText: {
    textAlign: "center",
    fontSize: "0.8rem",
    color: "var(--color-text-light)",
    lineHeight: 1.6,
  },
  link: {
    color: "var(--color-primary)",
    cursor: "pointer",
    fontWeight: 500,
  },
};
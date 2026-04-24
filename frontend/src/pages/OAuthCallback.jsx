import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
            navigate("/login");
            return;
        }

        // ✅ Only this is needed
        login(token);

        // ⏳ Give AuthContext time to fetch user
        setTimeout(() => {
            navigate("/dashboard");
        }, 500);

    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.spinner} />
            <p style={styles.text}>Signing you in...</p>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
        fontFamily: "var(--font-body)",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "3px solid var(--color-light-gray)",
        borderTop: "3px solid var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    text: {
        color: "var(--color-text-light)",
        fontSize: "0.95rem",
    },
};
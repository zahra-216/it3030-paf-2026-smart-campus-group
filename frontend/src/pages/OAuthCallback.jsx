import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

        // Save token to localStorage directly
        localStorage.setItem("token", token);
        login(token);

        // Fetch user with token directly
        axios.get("http://localhost:8081/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
            const user = response.data;
            if (!user.isProfileComplete) {
                navigate("/complete-profile");
            } else {
                navigate("/dashboard");
            }
        })
        .catch((error) => {
            console.error("Error fetching user:", error);
            localStorage.removeItem("token");
            navigate("/login");
        });

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
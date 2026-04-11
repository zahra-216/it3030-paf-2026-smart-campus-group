import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function CompleteProfile() {
    const { user, token, fetchCurrentUser } = useAuth();
    const navigate = useNavigate();
    const [userType, setUserType] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!userType) { setError("Please select your role"); return; }
        setLoading(true);
        try {
            await axios.put(
                "http://localhost:8081/api/auth/me/profile",
                { userType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchCurrentUser(); // ← refresh user in context immediately
            navigate("/dashboard");
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <span style={styles.logoText}>🎓 UniDesk</span>
                    <h2 style={styles.title}>Complete Your Profile</h2>
                    <p style={styles.subtitle}>Welcome, {user?.name}! Please tell us who you are.</p>
                </div>
                <div style={styles.options}>
                    {[
                        { value: "STUDENT", label: "Student", icon: "🎒", desc: "I am a student at this university" },
                        { value: "STAFF", label: "Staff", icon: "💼", desc: "I am a staff member" },
                        { value: "LECTURER", label: "Lecturer", icon: "📚", desc: "I am a lecturer or professor" },
                    ].map((option) => (
                        <div
                            key={option.value}
                            style={{
                                ...styles.option,
                                ...(userType === option.value ? styles.optionSelected : {}),
                            }}
                            onClick={() => setUserType(option.value)}
                        >
                            <span style={styles.optionIcon}>{option.icon}</span>
                            <div>
                                <p style={styles.optionLabel}>{option.label}</p>
                                <p style={styles.optionDesc}>{option.desc}</p>
                            </div>
                            {userType === option.value && <span style={styles.checkmark}>✓</span>}
                        </div>
                    ))}
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Continue to Dashboard"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: "100vh", backgroundColor: "var(--color-off-white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-body)" },
    card: { backgroundColor: "var(--color-white)", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "480px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
    header: { textAlign: "center", marginBottom: "2rem" },
    logoText: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--color-primary)", display: "block", marginBottom: "1rem", fontWeight: 700 },
    title: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: "var(--color-text)", marginBottom: "0.5rem" },
    subtitle: { color: "var(--color-text-light)", fontSize: "0.95rem" },
    options: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" },
    option: { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderWidth: "1.5px", borderStyle: "solid", borderColor: "var(--color-border)", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s ease", position: "relative" },
    optionSelected: { borderColor: "var(--color-primary)", backgroundColor: "rgba(27, 67, 50, 0.04)" },
    optionIcon: { fontSize: "1.5rem" },
    optionLabel: { fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text)" },
    optionDesc: { fontSize: "0.8rem", color: "var(--color-text-light)", marginTop: "0.15rem" },
    checkmark: { position: "absolute", right: "1rem", color: "var(--color-primary)", fontWeight: 700, fontSize: "1.1rem" },
    error: { color: "var(--color-error)", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" },
    button: { width: "100%", padding: "0.9rem", backgroundColor: "var(--color-primary)", color: "var(--color-white)", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
};
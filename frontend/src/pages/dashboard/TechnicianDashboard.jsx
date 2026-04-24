import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import axios from "axios";
import TechnicianDashboardTickets from "../TechnicianDashboardTickets";

export default function TechnicianDashboard() {
    const { user, token } = useAuth();

    const [myTickets, setMyTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            axios.get(`http://localhost:8081/api/tickets/my-assigned/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setMyTickets(res.data))
            .catch(() => setMyTickets([]))
            .finally(() => setLoading(false));
        }
    }, [user, token]);

    const [time, setTime] = useState(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleResolve = async (ticketId) => {
        try {
            await axios.put(
                `http://localhost:8081/api/tickets/${ticketId}/technician-update/${user.id}`,
                { status: "RESOLVED", resolutionNotes: "Issue resolved" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMyTickets(prev =>
                prev.map(t => t.id === ticketId ? { ...t, status: "RESOLVED" } : t)
            );
        } catch (err) {
            console.error("Failed to resolve ticket");
        }
    };

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    })();

    const open = myTickets.filter(t => t.status === "OPEN").length;
    const inProgress = myTickets.filter(t => t.status === "IN_PROGRESS").length;
    const high = myTickets.filter(t => t.priority === "HIGH").length;

    return (
        <div style={styles.page}>
            {/* Hero Banner */}
            <div style={styles.hero}>
                <div style={styles.heroOverlay} />
                <div style={styles.heroContent}>
                    <div style={styles.heroInner}>
                        <div>
                            <p style={styles.heroSub}>{greeting}, {user?.name?.split(" ")[0]}</p>
                            <h1 style={styles.heroTitle}>Technician Portal</h1>
                            <p style={styles.heroDesc}>View and resolve your assigned maintenance tickets.</p>
                        </div>
                        <div style={styles.heroRight}>
                            <p style={styles.heroTime}>{time}</p>
                            <p style={styles.heroDate}>
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
                <StatCard label="Assigned Tickets" value={String(myTickets.length)} icon="🔧" sub="Total assigned to you" subColor="var(--color-primary)" />
                <StatCard label="Open" value={String(open)} icon="📬" sub="Needs attention" subColor="#1D4ED8" />
                <StatCard label="In Progress" value={String(inProgress)} icon="⚙️" sub="Currently working on" subColor="#D97706" />
                <StatCard label="High Priority" value={String(high)} icon="🚨" sub="Urgent tickets" subColor="#DC2626" />
            </div>

            {/* Priority Alert */}
            {high > 0 && (
                <div style={styles.alert}>
                    <span style={styles.alertIcon}>⚠️</span>
                    <p style={styles.alertText}>
                        You have <strong>{high} high priority</strong> ticket{high > 1 ? "s" : ""} that need immediate attention.
                    </p>
                </div>
            )}

            {/* Tickets Table */}
             <TechnicianDashboardTickets />

            {/* Quick Guide */}
            <div style={styles.guideCard}>
                <h2 style={styles.cardTitle}>Your Workflow</h2>
                <div style={styles.guideRow}>
                    {[
                        { step: "1", label: "Review Ticket", desc: "Read the issue details and visit the location", color: "#1D4ED8", bg: "#EFF6FF" },
                        { step: "2", label: "Start Working", desc: "Status updates to IN PROGRESS automatically", color: "#D97706", bg: "#FEF3C7" },
                        { step: "3", label: "Fix the Issue", desc: "Resolve the problem at the reported location", color: "var(--color-primary)", bg: "#E8F5E9" },
                        { step: "4", label: "Mark Resolved", desc: "Click Mark Resolved and add resolution notes", color: "#059669", bg: "#D1FAE5" },
                    ].map((g, i) => (
                        <div key={i} style={{ ...styles.guideStep, backgroundColor: g.bg }}>
                            <div style={{ ...styles.stepNumber, backgroundColor: g.color }}>
                                {g.step}
                            </div>
                            <h3 style={{ ...styles.stepLabel, color: g.color }}>{g.label}</h3>
                            <p style={styles.stepDesc}>{g.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "var(--font-body)" },

    // Hero
    hero: {
        borderRadius: 14, overflow: "hidden", position: "relative",
        height: 200, background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
    },
    heroOverlay: {
        position: "absolute", inset: 0,
        backgroundImage: "url('https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80')",
        backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2,
    },
    heroContent: { position: "relative", zIndex: 1, padding: "1.75rem 2.5rem", height: "100%", display: "flex", alignItems: "center" },
    heroInner: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" },
    heroSub: { fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 },
    heroTitle: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-white)", marginBottom: 8 },
    heroDesc: { fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", maxWidth: 400 },
    heroRight: { textAlign: "right" },
    heroTime: { fontSize: "2rem", fontWeight: 700, color: "var(--color-white)", fontFamily: "var(--font-heading)", lineHeight: 1 },
    heroDate: { fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", marginTop: 4 },

    // Stats
    statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },

    // Alert
    alert: {
        display: "flex", alignItems: "center", gap: 10,
        backgroundColor: "#FEF2F2", border: "1px solid #FECACA",
        borderRadius: 10, padding: "0.875rem 1.25rem",
    },
    alertIcon: { fontSize: "1.1rem", flexShrink: 0 },
    alertText: { fontSize: "0.875rem", color: "#991B1B" },

    // Card
    card: {
        backgroundColor: "var(--color-white)", borderRadius: 14,
        border: "1px solid var(--color-border)", overflow: "hidden",
    },
    cardHead: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)",
    },
    cardTitle: { fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" },
    cardSub: { fontSize: "0.78rem", color: "var(--color-text-light)", marginTop: 2 },

    // Table
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
        textAlign: "left", fontSize: "0.68rem", fontWeight: 700,
        color: "var(--color-text-light)", letterSpacing: "0.07em",
        padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-off-white)",
    },
    tr: { borderBottom: "1px solid var(--color-light-gray)" },
    td: { padding: "0.875rem 1rem", fontSize: "0.85rem" },

    categoryPill: {
        fontSize: "0.68rem", fontWeight: 600,
        backgroundColor: "var(--color-off-white)",
        color: "var(--color-text-light)",
        padding: "2px 8px", borderRadius: 6,
        textTransform: "uppercase", letterSpacing: "0.04em",
    },
    resolveBtn: {
        padding: "0.35rem 0.875rem",
        backgroundColor: "var(--color-primary)",
        color: "var(--color-white)",
        border: "none", borderRadius: 6,
        fontSize: "0.75rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    resolvedText: {
        fontSize: "0.78rem", color: "#059669", fontWeight: 600,
    },

    // Guide
    guideCard: {
        backgroundColor: "var(--color-white)", borderRadius: 14,
        border: "1px solid var(--color-border)", padding: "1.25rem 1.5rem",
    },
    guideRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: "1rem" },
    guideStep: { borderRadius: 12, padding: "1.1rem" },
    stepNumber: {
        width: 28, height: 28, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--color-white)", fontSize: "0.78rem", fontWeight: 700,
        marginBottom: 8,
    },
    stepLabel: { fontSize: "0.875rem", fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-heading)" },
    stepDesc: { fontSize: "0.75rem", color: "var(--color-text-light)", lineHeight: 1.5 },
};
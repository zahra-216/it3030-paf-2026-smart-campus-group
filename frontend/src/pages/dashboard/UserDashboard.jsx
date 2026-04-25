import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import axios from "axios";

const myBookings = [
    { id: 1, resource: "Computer Lab B", date: "Apr 11, 2026", time: "13:00 - 15:00", status: "PENDING" },
    { id: 2, resource: "Meeting Room 204", date: "Apr 12, 2026", time: "10:00 - 11:30", status: "APPROVED" },
    { id: 3, resource: "Lecture Hall A", date: "Apr 14, 2026", time: "09:00 - 11:00", status: "APPROVED" },
];

const myTickets = [
    { id: "TK-012", issue: "Broken chair in Lab 201", priority: "LOW", status: "OPEN" },
    { id: "TK-008", issue: "AC not cooling in Room 305", priority: "MEDIUM", status: "IN_PROGRESS" },
];

export default function UserDashboard() {
    const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const { user, token } = useAuth();

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (token) {
            axios.get("http://localhost:8081/api/notifications/unread/count", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setUnreadCount(res.data.unreadCount))
            .catch(() => {});
        }
    }, [token]);

    const [myTickets, setMyTickets] = useState([]);
    const [resourceCount, setResourceCount] = useState(0);

    useEffect(() => {
        if (user?.id) {
            // fetch my tickets
            axios.get(`http://localhost:8081/api/tickets/my?userId=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setMyTickets(res.data))
            .catch(() => setMyTickets([]));

            // fetch resources count
            axios.get("http://localhost:8081/api/resources", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setResourceCount(res.data.length))
            .catch(() => {});
        }
    }, [user, token]);

    useEffect(() => {
        if (user?.id) {
            axios.get(`http://localhost:8081/api/tickets/my?userId=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setMyTickets(res.data))
            .catch(() => setMyTickets([]));
        }
    }, [user, token]);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    })();

    return (
        <div style={styles.page}>
            {/* Greeting */}
        <div style={styles.hero}>
            <div style={styles.heroOverlay} />
            <div style={styles.heroContent}>
                <div style={styles.heroTop}>
                    <div>
                        <p style={styles.heroSub}>
                            {greeting}, {user?.name?.split(" ")[0]}
                        </p>
                        <h1 style={styles.heroTitle}>Smart Campus Operations Hub</h1>
                        <p style={styles.heroDesc}>
                            Manage your bookings, report issues, and explore campus facilities.
                        </p>
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
                <StatCard
                    label="My Bookings"
                    value="0"
                    icon="📅"
                    sub="Coming soon"
                    subColor="#059669"
                />
                <StatCard
                    label="My Tickets"
                    value={String(myTickets.length)}
                    icon="🔧"
                    sub={`${myTickets.filter(t => t.status === "IN_PROGRESS").length} in progress`}
                    subColor="#D97706"
                />
                <StatCard
                    label="Available Resources"
                    value={String(resourceCount)}
                    icon="🏛️"
                    sub="Explore now"
                    subColor="var(--color-primary)"
                />
                <StatCard
                    label="Notifications"
                    value={String(unreadCount)}
                    icon="🔔"
                    sub={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                    subColor="#6B7280"
                />
            </div>

            {/* Quick Actions */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Quick Actions</h2>
                <div style={styles.actionsRow}>
                    {[
                        { icon: "📅", label: "New Booking", desc: "Book a room or equipment", color: "#1B4332" },
                        { icon: "🔧", label: "Report Issue", desc: "Submit a maintenance request", color: "#D97706" },
                        { icon: "🏛️", label: "Browse Resources", desc: "View available facilities", color: "#1D4ED8" },
                        { icon: "📋", label: "My Requests", desc: "Track your submissions", color: "#7C3AED" },
                    ].map((a, i) => (
                        <div key={i} style={styles.actionCard}>
                            <div style={{ ...styles.actionIcon, backgroundColor: a.color + "15" }}>
                                <span style={{ fontSize: "1.5rem" }}>{a.icon}</span>
                            </div>
                            <p style={styles.actionLabel}>{a.label}</p>
                            <p style={styles.actionDesc}>{a.desc}</p>
                            <span style={{ ...styles.actionArrow, color: a.color }}>→</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Bookings + My Tickets */}
            <div style={styles.grid}>
                <div style={styles.card}>
                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>My Bookings</h2>
                        <button style={styles.viewAll}>View All</button>
                    </div>
                    {myBookings.map(b => (
                        <div key={b.id} style={styles.row}>
                            <div style={styles.rowIcon}>📅</div>
                            <div style={styles.rowInfo}>
                                <p style={styles.rowName}>{b.resource}</p>
                                <p style={styles.rowMeta}>{b.date} · {b.time}</p>
                            </div>
                            <Badge status={b.status} />
                        </div>
                    ))}
                </div>

                <div style={styles.card}>
                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>My Tickets</h2>
                        <button style={styles.viewAll}>View All</button>
                    </div>
                    {myTickets.map(t => (
                        <div key={t.id} style={styles.row}>
                            <div style={styles.rowIcon}>🔧</div>
                            <div style={styles.rowInfo}>
                                <p style={styles.rowName}>{t.issue}</p>
                                <p style={styles.rowMeta}>{t.id}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                                <Badge status={t.priority} />
                                <Badge status={t.status} />
                            </div>
                        </div>
                    ))}
                    {myTickets.length === 0 && (
                        <div style={styles.empty}>
                            <p>No tickets yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    hero: {
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        height: 200,
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
    },
    heroOverlay: {
        position: "absolute", inset: 0,
        backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.25,
    },
    heroContent: { position: "relative", zIndex: 1, padding: "1.75rem 2.5rem", height: "100%", display: "flex", alignItems: "center" },
    heroTop: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" },
    heroSub: { fontSize: "1.2rem", color: "rgba(241, 241, 241, 0.7)", marginBottom: 6, fontWeight: 500 },
    heroTitle: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: 8 },
    heroDesc: { fontSize: "0.875rem", color: "rgba(241, 241, 241, 0.7)", maxWidth: 500 },
    heroRight: { textAlign: "right", flexShrink: 0 },
    rolePill: {
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.15)", color: "#fff",
        padding: "6px 14px", borderRadius: 50,
        fontSize: "0.78rem", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.04em",
        marginBottom: 8,
    },
    roleDot: { width: 6, height: 6, borderRadius: "50%", background: "#D4A843", flexShrink: 0 },
    heroTime: { fontSize: "2rem", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)", lineHeight: 1 },
    heroDate: { fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", marginTop: 4 },
    page: { display: "flex", flexDirection: "column", gap: "1.25rem" },

    greetRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
    greetDate: { fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
    greetTitle: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 },
    greetHint: { fontSize: "0.85rem", color: "#6B7280" },

    statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },

    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: "1px solid #E5E7EB",
    },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
    cardTitle: { fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "#111827" },
    viewAll: { fontSize: "0.78rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },

    actionsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 10 },
    actionCard: {
        backgroundColor: "#F9FAFB", borderRadius: 12,
        padding: "1.1rem", border: "1px solid #E5E7EB",
        cursor: "pointer",
    },
    actionIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 },
    actionLabel: { fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: 3, fontFamily: "var(--font-heading)" },
    actionDesc: { fontSize: "0.72rem", color: "#6B7280", lineHeight: 1.5, marginBottom: 8 },
    actionArrow: { fontSize: "1rem", fontWeight: 700 },

    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

    row: {
        display: "flex", alignItems: "center", gap: 12,
        padding: "0.75rem 0",
        borderBottom: "1px solid #F3F4F6",
    },
    rowIcon: {
        width: 34, height: 34, borderRadius: 8,
        backgroundColor: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.9rem", flexShrink: 0,
    },
    rowInfo: { flex: 1, minWidth: 0 },
    rowName: { fontSize: "0.85rem", fontWeight: 600, color: "#111827", marginBottom: 2 },
    rowMeta: { fontSize: "0.72rem", color: "#6B7280" },
    empty: { padding: "1.5rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.85rem" },
};
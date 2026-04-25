import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const recentBookings = [
    { id: 1, resource: "Lecture Hall A", user: "Dr. Sarah Chen", date: "Apr 10, 2026", time: "09:00 - 11:00", status: "APPROVED" },
    { id: 2, resource: "Lab Equipment - Projector #3", user: "James Wilson", date: "Apr 10, 2026", time: "14:00 - 16:00", status: "PENDING" },
    { id: 3, resource: "Meeting Room 204", user: "Prof. Kumar", date: "Apr 11, 2026", time: "10:00 - 11:30", status: "APPROVED" },
    { id: 4, resource: "Computer Lab B", user: "Lisa Anderson", date: "Apr 11, 2026", time: "13:00 - 15:00", status: "PENDING" },
    { id: 5, resource: "Auditorium", user: "Student Council", date: "Apr 12, 2026", time: "18:00 - 21:00", status: "REJECTED" },
];

export default function AdminDashboard() {
    const { user } = useAuth(); 

    const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [ticketLoading, setTicketLoading] = useState(true);

    const [resourceCount, setResourceCount] = useState(0);

    useEffect(() => {
        axios.get("http://localhost:8081/api/resources", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setResourceCount(res.data.length))
        .catch(() => {});
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        axios.get("http://localhost:8081/api/tickets/filter", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setTickets(Array.isArray(res.data) ? res.data : res.data.content ?? []))
        .catch(() => setTickets([]))
        .finally(() => setTicketLoading(false));
    }, [token]);

    return (
        <div style={styles.page}>
            {/* Hero Banner */}
            <div style={styles.hero}>
                <div style={styles.heroOverlay} />
            <div style={styles.heroContent}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div>
                        <p style={styles.heroSub}>Welcome back, {user?.name?.split(" ")[0]}</p>
                        <h1 style={styles.heroTitle}>Smart Campus Operations Hub</h1>
                        <p style={styles.heroDesc}>Manage facility bookings, maintenance tickets, and campus operations all in one place.</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)", lineHeight: 1 }}>{time}</p>
                        <p style={{ fontSize: "0.9rem", color: "rgba(241, 241, 241, 0.7)", marginTop: 4 }}>
                            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </p>
                    </div>
                </div>
            </div>
            </div>

            {/* Stat Cards */}
            <div style={styles.statsRow}>
                <StatCard
                    label="Total Facilities"
                    value={String(resourceCount)}
                    icon="🏛️"
                    sub="Available resources"
                    subColor="#059669"
                />
                <StatCard label="Active Bookings" value="124" icon="📅" sub="+12 today" subColor="#059669" />
                <StatCard
                    label="Open Tickets"
                    value={String(tickets.filter(t => t.status === "OPEN").length)}
                    icon="🔧"
                    sub={`${tickets.filter(t => t.priority === "HIGH").length} high priority`}
                    subColor="#DC2626"
                />
                <StatCard label="Pending Approvals" value="14" icon="⏳" sub="Awaiting review" subColor="#D97706" />
            </div>

            {/* Bottom grid */}
            <div style={styles.grid}>
                {/* Recent bookings */}
                <div style={styles.card}>
                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>Recent Bookings</h2>
                        <button style={styles.viewAll}>View All</button>
                    </div>
                    <div>
                        {recentBookings.map(b => (
                            <div key={b.id} style={styles.bookingRow}>
                                <div style={styles.bookingIcon}>📅</div>
                                <div style={styles.bookingInfo}>
                                    <p style={styles.bookingName}>{b.resource}</p>
                                    <p style={styles.bookingMeta}>{b.user} · {b.date} · {b.time}</p>
                                </div>
                                <Badge status={b.status} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column */}
                <div style={styles.rightCol}>
                    {/* Quick Actions */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Quick Actions</h2>
                        <div style={styles.actionsGrid}>
                            {[
                                { icon: "🏛️", label: "Add Facility" },
                                { icon: "📅", label: "New Booking" },
                                { icon: "🔧", label: "Report Issue" },
                                { icon: "👥", label: "Manage Users" },
                            ].map((a, i) => (
                                <button key={i} style={styles.actionBtn}>
                                    <span style={styles.actionBtnIcon}>{a.icon}</span>
                                    <span style={styles.actionBtnLabel}>{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* At a Glance */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>At a Glance</h2>
                        <div style={styles.glanceList}>
                            {[
                                { icon: "✅", color: "#059669", title: "32 Approved", sub: "Bookings this week" },
                                { icon: "⏳", color: "#D97706", title: "14 Pending", sub: "Awaiting approval" },
                                { icon: "⚠️", color: "#DC2626", title: "5 Critical", sub: "High priority tickets" },
                            ].map((g, i) => (
                                <div key={i} style={styles.glanceItem}>
                                    <div style={{ ...styles.glanceDot, backgroundColor: g.color + "20" }}>
                                        <span style={{ fontSize: "0.9rem" }}>{g.icon}</span>
                                    </div>
                                    <div>
                                        <p style={{ ...styles.glanceTitle, color: g.color }}>{g.title}</p>
                                        <p style={styles.glanceSub}>{g.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div style={{ ...styles.card, marginTop: 0 }}>
                <div style={styles.cardHead}>
                    <h2 style={styles.cardTitle}>Active Maintenance Tickets</h2>
                    <button style={styles.viewAll}>View All</button>
                </div>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {["ID", "ISSUE", "PRIORITY", "STATUS", "ASSIGNEE"].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(t => (
                            <tr key={t.id} style={styles.tr}>
                                <td style={{ ...styles.td, color: "#6B7280", fontFamily: "monospace", fontSize: "0.82rem" }}>{t.id}</td>
                                <td style={{ ...styles.td, color: "#111827", fontWeight: 500 }}>{t.issue}</td>
                                <td style={styles.td}><Badge status={t.priority} /></td>
                                <td style={styles.td}><Badge status={t.status} /></td>
                                <td style={{ ...styles.td, color: "#6B7280" }}>{t.assignee}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    page: { display: "flex", flexDirection: "column", gap: "1.25rem" },

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
    heroContent: { position: "relative", zIndex: 1, padding: "2rem 2.5rem" },
    heroSub: { fontSize: "1.2rem", color: "rgba(241, 241, 241, 0.7)", marginBottom: 6, fontWeight: 500 },
    heroTitle: { fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: 8 },
    heroDesc: { fontSize: "0.875rem", color: "rgba(241, 241, 241, 0.7)", maxWidth: 500 },

    statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 },

    grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 },

    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: "1px solid #E5E7EB",
    },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
    cardTitle: { fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "#111827" },
    viewAll: { fontSize: "0.78rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },

    bookingRow: {
        display: "flex", alignItems: "center", gap: 12,
        padding: "0.75rem 0",
        borderBottom: "1px solid #F3F4F6",
    },
    bookingIcon: {
        width: 36, height: 36, borderRadius: 8,
        backgroundColor: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", flexShrink: 0,
    },
    bookingInfo: { flex: 1, minWidth: 0 },
    bookingName: { fontSize: "0.875rem", fontWeight: 600, color: "#111827", marginBottom: 2 },
    bookingMeta: { fontSize: "0.75rem", color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

    rightCol: { display: "flex", flexDirection: "column", gap: 14 },

    actionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 },
    actionBtn: {
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "1rem 0.5rem",
        backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB",
        borderRadius: 10, cursor: "pointer", transition: "all 0.15s ease",
        fontFamily: "var(--font-body)",
    },
    actionBtnIcon: { fontSize: "1.3rem" },
    actionBtnLabel: { fontSize: "0.72rem", fontWeight: 600, color: "#374151" },

    glanceList: { display: "flex", flexDirection: "column", gap: 12, marginTop: 10 },
    glanceItem: { display: "flex", alignItems: "center", gap: 10 },
    glanceDot: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    glanceTitle: { fontSize: "0.875rem", fontWeight: 700 },
    glanceSub: { fontSize: "0.72rem", color: "#6B7280" },

    table: { width: "100%", borderCollapse: "collapse" },
    th: {
        textAlign: "left", fontSize: "0.68rem", fontWeight: 700,
        color: "#9CA3AF", letterSpacing: "0.07em",
        padding: "0 0.75rem 0.75rem",
        borderBottom: "1px solid #E5E7EB",
    },
    tr: { borderBottom: "1px solid #F3F4F6" },
    td: { padding: "0.875rem 0.75rem", fontSize: "0.85rem" },
};
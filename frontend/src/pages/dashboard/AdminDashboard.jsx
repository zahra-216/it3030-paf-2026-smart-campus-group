import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import AdminDashboardTickets from "../AdminDashboardTickets";

export default function AdminDashboard({ onPageChange }) {
    const { user } = useAuth(); 
    const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    const { token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [ticketLoading, setTicketLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    const [resources, setResources] = useState([]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/resources`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setResources(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }, [token]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/bookings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setBookings(res.data))
        .catch(() => setBookings([]));
    }, [token]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/tickets/filter`, {
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
                    value={String(resources.length)}
                    icon="🏛️"
                    sub="Available resources"
                    subColor="#059669"
                />
                <StatCard
                    label="Active Bookings"
                    value={String(bookings.filter(b => b.status === "APPROVED").length)}
                    icon="📅"
                    sub="Total approved"
                    subColor="#059669"
                />
                <StatCard
                    label="Open Tickets"
                    value={String(tickets.filter(t => t.status === "OPEN").length)}
                    icon="🔧"
                    sub={`${tickets.filter(t => t.priority === "HIGH").length} high priority`}
                    subColor="#DC2626"
                />
                <StatCard
                    label="Pending Approvals"
                    value={String(bookings.filter(b => b.status === "PENDING").length)}
                    icon="⏳"
                    sub="Awaiting review"
                    subColor="#D97706"
                />
            </div>

            {/* Bottom grid */}
            <div style={styles.grid}>
                {/* Recent bookings */}
                <div style={styles.card}>
                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>Recent Bookings</h2>
                    </div>
                    <div>
                        <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: "0.75rem" }}>
                            {bookings.length === 0 ? (
                                <div style={styles.emptyBookings}>
                                    <span style={{ fontSize: "2rem" }}>📭</span>
                                    <p style={styles.emptyBookingsTitle}>No recent bookings</p>
                                    <p style={styles.emptyBookingsHint}>Bookings will appear here once created</p>
                                </div>
                            ) : (
                                bookings.slice(0, 10).map(b => (
                                    <div key={b.id} style={styles.bookingRow}>
                                        <div style={styles.bookingIcon}>📅</div>
                                        <div style={styles.bookingInfo}>
                                            <p style={styles.bookingName}>{b.resource?.name || "Resource"}</p>
                                            <p style={styles.bookingMeta}>
                                                {b.user?.name} · {b.date} · {b.startTime} - {b.endTime}
                                            </p>
                                        </div>
                                        <Badge status={b.status} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={styles.rightCol}>
                    {/* Quick Actions */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Quick Actions</h2>
                        <div style={styles.actionsGrid}>
                            {[
                                { icon: "🏛️", label: "Add Facility", desc: "Add a new resource", color: "#1B4332", page: "resources" },
                                { icon: "📅", label: "New Booking", desc: "Book a room or equipment", color: "#D97706", page: "bookings" },
                                { icon: "🔧", label: "Report Issue", desc: "Submit a maintenance ticket", color: "#2D6A4F", page: "tickets" },
                                { icon: "👥", label: "Manage Users", desc: "View and manage users", color: "#495057", page: "users" },
                            ].map((a, i) => (
                                <button
                                    key={i}
                                    style={styles.actionBtn}
                                    onClick={() => onPageChange(a.page)}
                                >
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
                                {
                                    icon: "✅",
                                    color: "#059669",
                                    title: `${bookings.filter(b => b.status === "APPROVED").length} Approved`,
                                    sub: "Total approved bookings"
                                },
                                {
                                    icon: "⏳",
                                    color: "#D97706",
                                    title: `${bookings.filter(b => b.status === "PENDING").length} Pending`,
                                    sub: "Awaiting approval"
                                },
                                {
                                    icon: "⚠️",
                                    color: "#DC2626",
                                    title: `${tickets.filter(t => t.priority === "HIGH").length} Critical`,
                                    sub: "High priority tickets"
                                },
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
                                <td style={{ ...styles.td, color: "#111827", fontWeight: 500 }}>{t.title || t.issue || "—"}</td>
                                <td style={styles.td}><Badge status={t.priority} /></td>
                                <td style={styles.td}><Badge status={t.status} /></td>
                                <td style={{ ...styles.td, color: "#6B7280" }}>{t.assignedToName || "Unassigned"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <AnalyticsSection bookings={bookings} tickets={tickets} resources={resources} />
        </div>
    );
}

function AnalyticsSection({ bookings, tickets, resources }) {
    // ── Top Resources by Bookings ─────────────────────────────
    const resourceBookingCount = bookings.reduce((acc, b) => {
        const name = b.resource?.name || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});

    const topResources = Object.entries(resourceBookingCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxBookings = topResources[0]?.[1] || 1;

    // ── Booking Status Breakdown ──────────────────────────────
    const bookingStats = [
        { label: "Approved",  value: bookings.filter(b => b.status === "APPROVED").length,  color: "var(--color-primary)", bg: "#E8F5E9" },
        { label: "Pending",   value: bookings.filter(b => b.status === "PENDING").length,   color: "#D97706",              bg: "#FEF3C7" },
        { label: "Rejected",  value: bookings.filter(b => b.status === "REJECTED").length,  color: "#DC2626",              bg: "#FEE2E2" },
        { label: "Cancelled", value: bookings.filter(b => b.status === "CANCELLED").length, color: "#6B7280",              bg: "#F3F4F6" },
    ];

    // ── Ticket Category Breakdown ─────────────────────────────
    const categoryCount = tickets.reduce((acc, t) => {
        const cat = t.category || "OTHER";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoryStats = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1]);

    const maxCat = categoryStats[0]?.[1] || 1;

    // ── Peak Booking Days ─────────────────────────────────────
    const dayCount = bookings.reduce((acc, b) => {
        if (!b.date) return acc;
        const day = new Date(b.date).toLocaleDateString("en-US", { weekday: "short" });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayStats = days.map(d => ({ day: d, count: dayCount[d] || 0 }));
    const maxDay = Math.max(...dayStats.map(d => d.count), 1);

    const totalBookings = bookings.length;
    const totalTickets = tickets.length;

    if (totalBookings === 0 && totalTickets === 0) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: "var(--color-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem",
                }}>📊</div>
                <div>
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                        Usage Analytics
                    </h2>
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-light)", margin: 0 }}>
                        Overview of campus activity
                    </p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                {/* Top Resources */}
                <div style={analyticsCard}>
                    <h3 style={analyticsTitle}>🏛️ Top Booked Resources</h3>
                    {topResources.length === 0 ? (
                        <p style={emptyText}>No booking data yet</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                            {topResources.map(([name, count], i) => (
                                <div key={name}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>
                                            {i + 1}. {name}
                                        </span>
                                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-light)", fontWeight: 600 }}>
                                            {count} booking{count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div style={{ height: 8, backgroundColor: "var(--color-light-gray)", borderRadius: 999, overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${(count / maxBookings) * 100}%`,
                                            backgroundColor: i === 0 ? "var(--color-primary)" : i === 1 ? "var(--color-primary-light)" : "#A8C5A8",
                                            borderRadius: 999,
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Booking Status Breakdown */}
                <div style={analyticsCard}>
                    <h3 style={analyticsTitle}>📅 Booking Status Breakdown</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {bookingStats.map(s => (
                            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    backgroundColor: s.color, flexShrink: 0,
                                }} />
                                <span style={{ fontSize: "0.8rem", color: "var(--color-text)", flex: 1 }}>{s.label}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 2 }}>
                                    <div style={{ flex: 1, height: 8, backgroundColor: "var(--color-light-gray)", borderRadius: 999, overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: totalBookings > 0 ? `${(s.value / totalBookings) * 100}%` : "0%",
                                            backgroundColor: s.color,
                                            borderRadius: 999,
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color, minWidth: 24, textAlign: "right" }}>
                                        {s.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalBookings > 0 && (
                        <p style={{ fontSize: "0.72rem", color: "var(--color-text-light)", marginTop: 10, textAlign: "right" }}>
                            Total: {totalBookings} bookings
                        </p>
                    )}
                </div>

                {/* Peak Booking Days */}
                <div style={analyticsCard}>
                    <h3 style={analyticsTitle}>📆 Peak Booking Days</h3>
                    {totalBookings === 0 ? (
                        <p style={emptyText}>No booking data yet</p>
                    ) : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginTop: 12 }}>
                            {dayStats.map(({ day, count }) => (
                                <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: "0.65rem", color: "var(--color-text-light)", fontWeight: 600 }}>
                                        {count > 0 ? count : ""}
                                    </span>
                                    <div style={{
                                        width: "100%",
                                        height: `${Math.max((count / maxDay) * 80, count > 0 ? 8 : 0)}px`,
                                        backgroundColor: count > 0 ? "var(--color-primary)" : "var(--color-light-gray)",
                                        borderRadius: "4px 4px 0 0",
                                        opacity: count > 0 ? 1 : 0.3,
                                        transition: "height 0.5s ease",
                                    }} />
                                    <span style={{ fontSize: "0.65rem", color: "var(--color-text-light)", fontWeight: 600 }}>{day}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ticket Category Breakdown */}
                <div style={analyticsCard}>
                    <h3 style={analyticsTitle}>🔧 Ticket Categories</h3>
                    {categoryStats.length === 0 ? (
                        <p style={emptyText}>No ticket data yet</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                            {categoryStats.map(([cat, count], i) => {
                                const colors = ["var(--color-primary)", "#D97706", "#1D4ED8", "#DC2626", "#6B7280"];
                                return (
                                    <div key={cat}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)" }}>
                                                {cat.replace(/_/g, " ")}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
                                                {count} ticket{count !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div style={{ height: 7, backgroundColor: "var(--color-light-gray)", borderRadius: 999, overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${(count / maxCat) * 100}%`,
                                                backgroundColor: colors[i % colors.length],
                                                borderRadius: 999,
                                                transition: "width 0.5s ease",
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {totalTickets > 0 && (
                        <p style={{ fontSize: "0.72rem", color: "var(--color-text-light)", marginTop: 10, textAlign: "right" }}>
                            Total: {totalTickets} tickets
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

const analyticsCard = {
    backgroundColor: "var(--color-white)",
    borderRadius: 14,
    padding: "1.25rem 1.5rem",
    border: "1px solid var(--color-border)",
};
const analyticsTitle = {
    fontFamily: "var(--font-heading)",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "var(--color-text)",
    margin: 0,
};
const emptyText = {
    fontSize: "0.82rem",
    color: "var(--color-text-light)",
    textAlign: "center",
    padding: "1.5rem 0",
};

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
    emptyBookings: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem",
        gap: "0.5rem",
        textAlign: "center",
    },
    emptyBookingsTitle: {
        fontSize: "0.9rem",
        fontWeight: 600,
        color: "var(--color-text)",
        fontFamily: "var(--font-heading)",
    },
    emptyBookingsHint: {
        fontSize: "0.78rem",
        color: "var(--color-text-light)",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: "1px solid #E5E7EB",
    },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
    cardTitle: { fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "#111827" },
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
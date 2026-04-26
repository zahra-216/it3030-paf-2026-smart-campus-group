import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const TYPE_CONFIG = {
    BOOKING: { icon: "📅", label: "Booking", color: "var(--color-primary)", bg: "#E8F5E9" },
    TICKET:  { icon: "🔧", label: "Ticket",  color: "#D97706",              bg: "#FEF3C7" },
    COMMENT: { icon: "💬", label: "Comment", color: "#1D4ED8",              bg: "#EFF6FF" },
};

function NotifCard({ notif, onMarkRead, onDelete }) {
    const type = TYPE_CONFIG[notif.type] || TYPE_CONFIG.BOOKING;
    const timeAgo = getTimeAgo(notif.createdAt);

    return (
        <div style={{
            ...styles.card,
            backgroundColor: notif.isRead ? "var(--color-white)" : "#F0FAF4",
            borderLeft: notif.isRead ? "3px solid transparent" : `3px solid var(--color-primary)`,
        }}>
            <div style={{ ...styles.iconWrap, backgroundColor: type.bg }}>
                <span style={{ fontSize: "1.1rem" }}>{type.icon}</span>
            </div>

            <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                    <span style={{ ...styles.typeBadge, backgroundColor: type.bg, color: type.color }}>
                        {type.label}
                    </span>
                    <span style={styles.timeAgo}>{timeAgo}</span>
                </div>
                <p style={{
                    ...styles.message,
                    fontWeight: notif.isRead ? 400 : 600,
                    color: notif.isRead ? "var(--color-text-light)" : "var(--color-text)",
                }}>
                    {notif.message}
                </p>
            </div>

            <div style={styles.cardActions}>
                {!notif.isRead && (
                    <button
                        style={styles.markBtn}
                        title="Mark as read"
                        onClick={() => onMarkRead(notif.id)}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                )}
                <button
                    style={styles.deleteBtn}
                    title="Delete notification"
                    onClick={() => onDelete(notif.id)}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={styles.empty}>
            <div style={styles.emptyIconWrap}>
                <span style={{ fontSize: "2.5rem" }}>🔔</span>
            </div>
            <h3 style={styles.emptyTitle}>All caught up!</h3>
            <p style={styles.emptyDesc}>You have no notifications right now. Check back later.</p>
        </div>
    );
}

export default function NotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        // Update UI immediately
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        window.dispatchEvent(new Event("notif-updated"));
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            fetchNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        // Update UI immediately
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        window.dispatchEvent(new Event("notif-updated"));
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            fetchNotifications();
        }
    };
    
    const handleDelete = async (id) => {
        // Remove from UI immediately (optimistic)
        setNotifications(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new Event("notif-updated"));
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            // If it fails, re-fetch to restore correct state
            fetchNotifications();
        }
    };

    const filters = ["ALL", "BOOKING", "TICKET", "COMMENT"];

    const filtered = notifications.filter(n =>
        filter === "ALL" ? true : n.type === filter
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={styles.page}>

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>Notifications</h1>
                    <p style={styles.headerSub}>
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                            : "All notifications read"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button style={styles.markAllBtn} onClick={handleMarkAllRead}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div style={styles.statsRow}>
                {[
                    { label: "Total", value: notifications.length, icon: "🔔", bg: "#E8F5E9", color: "var(--color-primary)" },
                    { label: "Unread", value: unreadCount, icon: "📬", bg: "#FEF3C7", color: "#D97706" },
                    { label: "Bookings", value: notifications.filter(n => n.type === "BOOKING").length, icon: "📅", bg: "#EFF6FF", color: "#1D4ED8" },
                    { label: "Tickets", value: notifications.filter(n => n.type === "TICKET").length, icon: "🔧", bg: "#FFF1F2", color: "#DC2626" },
                ].map((s, i) => (
                    <div key={i} style={{ ...styles.statCard, backgroundColor: s.bg }}>
                        <div style={styles.statLeft}>
                            <p style={{ ...styles.statLabel, color: s.color }}>{s.label}</p>
                            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
                        </div>
                        <span style={{ fontSize: "1.75rem" }}>{s.icon}</span>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={styles.filterRow}>
                {filters.map(f => (
                    <button
                        key={f}
                        style={{
                            ...styles.filterBtn,
                            ...(filter === f ? styles.filterBtnActive : {})
                        }}
                        onClick={() => setFilter(f)}
                    >
                        {f === "ALL" ? "All" : TYPE_CONFIG[f]?.icon + " " + TYPE_CONFIG[f]?.label}
                        {f === "ALL" && (
                            <span style={{
                                ...styles.filterCount,
                                backgroundColor: filter === "ALL" ? "var(--color-primary)" : "var(--color-light-gray)",
                                color: filter === "ALL" ? "var(--color-white)" : "var(--color-text-light)",
                            }}>
                                {notifications.length}
                            </span>
                        )}
                        {f !== "ALL" && (
                            <span style={{
                                ...styles.filterCount,
                                backgroundColor: filter === f ? "var(--color-primary)" : "var(--color-light-gray)",
                                color: filter === f ? "var(--color-white)" : "var(--color-text-light)",
                            }}>
                                {notifications.filter(n => n.type === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div style={styles.listWrap}>
                {loading ? (
                    <div style={styles.loadingWrap}>
                        <div style={styles.spinner} />
                        <p style={styles.loadingText}>Loading notifications...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Unread section */}
                        {filtered.some(n => !n.isRead) && (
                            <div style={styles.section}>
                                <p style={styles.sectionLabel}>
                                    <span style={styles.sectionDot} />
                                    Unread
                                </p>
                                {filtered.filter(n => !n.isRead).map(n => (
                                    <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}

                        {/* Read section */}
                        {filtered.some(n => n.isRead) && (
                            <div style={styles.section}>
                                <p style={styles.sectionLabel}>
                                    <span style={{ ...styles.sectionDot, backgroundColor: "var(--color-text-light)" }} />
                                    Earlier
                                </p>
                                {filtered.filter(n => n.isRead).map(n => (
                                    <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function getTimeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z").getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

const styles = {
    page: {
        display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "var(--font-body)",
    },

    // Header
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem",
    },
    headerTitle: {
        fontFamily: "var(--font-heading)",
        fontSize: "1.4rem",
        fontWeight: 700,
        color: "var(--color-black)",
        marginBottom: 2,
    },
    headerSub: {
        fontSize: "0.82rem",
        color: "var(--color-black)",
    },
    markAllBtn: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0.6rem 1.1rem",
        backgroundColor: "var(--color-primary)",
        color: "var(--color-white)",
        border: "none",
        borderRadius: 8,
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "background 0.15s",
    },
    cardActions: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0,
    },
    deleteBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1px solid #FEE2E2",
        backgroundColor: "#FFF5F5",
        color: "#DC2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    },

    // Stats
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
    },
    statCard: {
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "1px solid rgba(0,0,0,0.05)",
    },
    statLeft: {},
    statLabel: {
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 2,
    },
    statValue: {
        fontSize: "1.75rem",
        fontWeight: 700,
        fontFamily: "var(--font-heading)",
        lineHeight: 1,
    },

    // Filters
    filterRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "var(--color-white)",
        borderRadius: 12,
        padding: "0.5rem",
        border: "1px solid var(--color-border)",
    },
    filterBtn: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0.5rem 1rem",
        borderRadius: 8,
        border: "none",
        backgroundColor: "transparent",
        color: "var(--color-text-light)",
        fontSize: "0.82rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "all 0.15s ease",
    },
    filterBtnActive: {
        backgroundColor: "#E8F5E9",
        color: "var(--color-primary)",
        fontWeight: 700,
    },
    filterCount: {
        fontSize: "0.65rem",
        fontWeight: 700,
        padding: "1px 6px",
        borderRadius: 10,
        minWidth: 18,
        textAlign: "center",
    },

    // List
    listWrap: {
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    sectionLabel: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "var(--color-text-light)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 4,
    },
    sectionDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        backgroundColor: "var(--color-primary)",
        flexShrink: 0,
    },

    // Card
    card: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "1rem 1.25rem",
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        transition: "all 0.15s ease",
        cursor: "default",
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    cardBody: {
        flex: 1,
        minWidth: 0,
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    typeBadge: {
        fontSize: "0.65rem",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 6,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    timeAgo: {
        fontSize: "0.72rem",
        color: "var(--color-text-light)",
        marginLeft: "auto",
    },
    message: {
        fontSize: "0.875rem",
        lineHeight: 1.55,
        color: "var(--color-text)",
    },
    markBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-white)",
        color: "var(--color-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s",
    },
    readDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "var(--color-light-gray)",
        flexShrink: 0,
        marginTop: 6,
    },

    // Empty
    empty: {
        backgroundColor: "var(--color-white)",
        borderRadius: 14,
        padding: "4rem",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        textAlign: "center",
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: "50%",
        backgroundColor: "#E8F5E9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    emptyTitle: {
        fontFamily: "var(--font-heading)",
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "var(--color-text)",
    },
    emptyDesc: {
        fontSize: "0.85rem",
        color: "var(--color-text-light)",
        maxWidth: 300,
        lineHeight: 1.6,
    },

    // Loading
    loadingWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem",
        gap: "1rem",
    },
    spinner: {
        width: 32,
        height: 32,
        border: "3px solid var(--color-light-gray)",
        borderTop: "3px solid var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    loadingText: {
        fontSize: "0.85rem",
        color: "var(--color-text-light)",
    },
};
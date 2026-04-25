import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

function getTimeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function Topbar() {
    function getTimeAgo(dateStr) {
        if (!dateStr) return "";
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    const { user, token } = useAuth();
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const notifRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (token) {
            axios.get("http://localhost:8081/api/notifications/unread", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setUnreadCount(res.data.length);
                setNotifications(res.data);
            })
            .catch(() => {});
        }
    }, [token]);

    useEffect(() => {
        const fetchNotifData = () => {
            if (!token) return;
            axios.get("http://localhost:8081/api/notifications/unread/count", {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});

            axios.get("http://localhost:8081/api/notifications/unread", {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setNotifications(res.data)).catch(() => {});
        };

        fetchNotifData();
        window.addEventListener("notif-updated", fetchNotifData);
        return () => window.removeEventListener("notif-updated", fetchNotifData);
    }, [token]);

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkAllRead = async () => {
        setUnreadCount(0);
        setNotifications([]);
        window.dispatchEvent(new Event("notif-updated"));
        try {
            await axios.put("http://localhost:8081/api/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put("http://localhost:8081/api/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifications([]);
        } catch {}
    };

    return (
        <header style={styles.topbar}>
            <div style={styles.searchWrap}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input style={styles.searchInput} placeholder="Search resources, bookings..." />
            </div>

            <div style={styles.right}>
                <div ref={notifRef} style={{ position: "relative" }}>
                    <button style={styles.iconBtn} onClick={() => setNotifOpen(o => !o)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text)" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                    </button>

                   {notifOpen && (
                        <div style={styles.dropdown}>
                            <div style={styles.dropHead}>
                                <span style={styles.dropTitle}>Notifications</span>
                                <button style={styles.markAll} onClick={handleMarkAllRead}>Mark all read</button>
                            </div>
                            {notifications.length === 0 ? (
                                <div style={styles.dropEmpty}>
                                    <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>🔔</p>
                                    <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text)" }}>All caught up!</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)", marginTop: 2 }}>No new notifications</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                                    {notifications.slice(0, 5).map(n => (
                                        <div key={n.id} style={styles.notifItem}>
                                            <span style={styles.notifDot} />
                                            <div>
                                                <p style={styles.notifMsg}>{n.message}</p>
                                                <p style={styles.notifTime}>{getTimeAgo(n.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={styles.userSection}>
                    <div style={styles.avatarWrap}>
                        <img
                            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4E7D5B&color=fff&size=64`}
                            alt=""
                            style={styles.avatar}
                            referrerPolicy="no-referrer"
                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=4E7D5B&color=fff&size=64`; }}
                        />
                    </div>
                    {user?.role && (
                        <span style={{
                            backgroundColor: user?.role === "ADMIN" ? "var(--color-accent)" : "var(--color-primary)",
                            color: "var(--color-white)",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.05em",
                        }}>
                            {user?.role}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}

const styles = {
    notifItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
    },
    notifDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "var(--color-primary)",
        flexShrink: 0,
        marginTop: 5,
    },
    notifMsg: {
        fontSize: "0.78rem",
        color: "var(--color-text)",
        lineHeight: 1.4,
        fontWeight: 500,
    },
    notifTime: {
        fontSize: "0.68rem",
        color: "var(--color-text-light)",
        marginTop: 2,
    },

    topbar: {
        height: 56,
        backgroundColor: "var(--color-white)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
    },
    searchWrap: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "var(--color-off-white)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "0.45rem 0.875rem",
        width: 280,
    },
    searchInput: {
        border: "none",
        background: "transparent",
        fontSize: "0.85rem",
        color: "var(--color-text)",
        width: "100%",
        fontFamily: "var(--font-body)",
        outline: "none",
    },
    right: { display: "flex", alignItems: "center", gap: 8 },
    iconBtn: {
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-white)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#EF4444",
        color: "var(--color-white)",
        fontSize: "0.6rem",
        fontWeight: 700,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 3px",
    },
    dropdown: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 300,
        backgroundColor: "var(--color-white)",
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
        zIndex: 200,
        overflow: "hidden",
    },
    dropHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-border)",
    },
    dropTitle: { fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text)" },
    markAll: { fontSize: "0.72rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },
    dropEmpty: { padding: "2rem", textAlign: "center", color: "var(--color-text-light)" },
    notifItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
    },
    notifDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "var(--color-primary)",
        flexShrink: 0,
        marginTop: 5,
    },
    notifMsg: {
        fontSize: "0.78rem",
        color: "var(--color-text)",
        lineHeight: 1.4,
        fontWeight: 500,
    },
    notifTime: {
        fontSize: "0.68rem",
        color: "var(--color-text-light)",
        marginTop: 2,
    },
    userSection: { display: "flex", alignItems: "center", gap: 8 },
    avatarWrap: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid var(--color-border)",
        flexShrink: 0,
    },
    avatar: { width: "100%", height: "100%", objectFit: "cover" },
};
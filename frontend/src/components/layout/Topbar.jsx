import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

export default function Topbar() {
    const { user, token } = useAuth();
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notifRef = useRef(null);

    useEffect(() => {
        if (token) {
            axios.get("http://localhost:8081/api/notifications/unread/count", {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});
        }
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [token]);

    return (
        <header style={styles.topbar}>
            {/* Search */}
            <div style={styles.searchWrap}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                    style={styles.searchInput}
                    placeholder="Search resources, bookings..."
                />
            </div>

            <div style={styles.right}>
                {/* Notif bell */}
                <div ref={notifRef} style={{ position: "relative" }}>
                    <button style={styles.iconBtn} onClick={() => setNotifOpen(o => !o)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                    </button>

                    {notifOpen && (
                        <div style={styles.dropdown}>
                            <div style={styles.dropHead}>
                                <span style={styles.dropTitle}>Notifications</span>
                                <button style={styles.markAll}>Mark all read</button>
                            </div>
                            <div style={styles.dropEmpty}>
                                <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>🔔</p>
                                <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#111827" }}>All caught up!</p>
                                <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: 2 }}>No new notifications</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div style={styles.userSection}>
                    <div style={styles.avatarWrap}>
                        <img
                            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=1B4332&color=fff&size=64`}
                            alt=""
                            style={styles.avatar}
                            referrerPolicy="no-referrer"
                            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=1B4332&color=fff&size=64`; }}
                        />
                    </div>
                    {user?.role && (
                        <span style={{
                            backgroundColor: user?.role === "ADMIN" ? "#D4A843" : "#4E7D5B",
                            color: "#fff",
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
    topbar: {
        height: 56,
        backgroundColor: "#fff",
        borderBottom: "1px solid #E5E7EB",
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
        backgroundColor: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        padding: "0.45rem 0.875rem",
        width: 280,
    },
    searchInput: {
        border: "none",
        background: "transparent",
        fontSize: "0.85rem",
        color: "#374151",
        width: "100%",
        fontFamily: "var(--font-body)",
    },
    right: { display: "flex", alignItems: "center", gap: 8 },
    iconBtn: {
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        backgroundColor: "#fff",
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
        color: "#fff",
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
        backgroundColor: "#fff",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        boxShadow: "0 10px 32px rgba(0,0,0,0.12)",
        zIndex: 200,
        overflow: "hidden",
    },
    dropHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid #E5E7EB",
    },
    dropTitle: { fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text)" },
    markAll: { fontSize: "0.72rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 },
    dropEmpty: { padding: "2rem", textAlign: "center", color: "#6B7280" },
    avatarWrap: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid #E5E7EB",
        flexShrink: 0,
    },
    userSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    },
    avatar: { width: "100%", height: "100%", objectFit: "cover" },
};
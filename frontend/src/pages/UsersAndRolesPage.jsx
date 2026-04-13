import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const ROLES = ["USER", "TECHNICIAN", "ADMIN"];

const ROLE_CONFIG = {
    USER:       { bg: "#EFF6FF", color: "#1D4ED8", icon: "👤" },
    TECHNICIAN: { bg: "#FEF3C7", color: "#D97706", icon: "🔧" },
    ADMIN:      { bg: "#F0FDF4", color: "var(--color-primary)", icon: "⚙️" },
};

function UserRow({ user, currentUser, onRoleChange, loading }) {
    const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER;
    const isCurrentUser = user.id === currentUser?.id;

    return (
        <div style={{
            ...styles.row,
            backgroundColor: isCurrentUser ? "#F0FAF4" : "var(--color-white)",
            borderLeft: isCurrentUser ? "3px solid var(--color-primary)" : "3px solid transparent",
        }}>
            {/* Avatar + Info */}
            <div style={styles.userInfo}>
                <img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=4E7D5B&color=fff&size=64`}
                    alt=""
                    style={styles.avatar}
                    referrerPolicy="no-referrer"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=4E7D5B&color=fff&size=64`; }}
                />
                <div style={styles.userDetails}>
                    <div style={styles.nameRow}>
                        <p style={styles.userName}>{user.name}</p>
                        {isCurrentUser && <span style={styles.youBadge}>You</span>}
                    </div>
                    <p style={styles.userEmail}>{user.email}</p>
                </div>
            </div>

            {/* Provider */}
            <div style={styles.cell}>
                <span style={styles.providerPill}>
                    {user.oauthProvider === "GOOGLE" ? "🔵 Google" : "⚫ GitHub"}
                </span>
            </div>

            {/* Role */}
            <div style={styles.cell}>
                <span style={{ ...styles.rolePill, backgroundColor: roleConf.bg, color: roleConf.color }}>
                    {roleConf.icon} {user.role}
                </span>
            </div>

            {/* Role Selector */}
            <div style={styles.cell}>
                {isCurrentUser ? (
                    <span style={styles.cantChange}>Cannot change own role</span>
                ) : (
                    <select
                        style={styles.select}
                        value={user.role}
                        disabled={loading === user.id}
                        onChange={e => onRoleChange(user.id, e.target.value)}
                    >
                        {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}

export default function UsersAndRolesPage() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changingRole, setChangingRole] = useState(null);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:8081/api/auth/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setChangingRole(userId);
        try {
            await axios.put(
                `http://localhost:8081/api/auth/users/${userId}/role?role=${newRole}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast(`Role updated to ${newRole} successfully`, "success");
        } catch {
            showToast("Failed to update role. Please try again.", "error");
        } finally {
            setChangingRole(null);
        }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = users.filter(u => {
        const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                           u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === "ALL" || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const stats = [
        { label: "Total Users", value: users.length, icon: "👥", bg: "#E8F5E9", color: "var(--color-primary)" },
        { label: "Admins", value: users.filter(u => u.role === "ADMIN").length, icon: "⚙️", bg: "#F0FDF4", color: "var(--color-primary)" },
        { label: "Technicians", value: users.filter(u => u.role === "TECHNICIAN").length, icon: "🔧", bg: "#FEF3C7", color: "#D97706" },
        { label: "Users", value: users.filter(u => u.role === "USER").length, icon: "👤", bg: "#EFF6FF", color: "#1D4ED8" },
    ];

    return (
        <div style={styles.page}>
            {toast && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: toast.type === "success" ? "var(--color-primary)" : "#DC2626",
                }}>
                    <span>{toast.type === "success" ? "✅" : "❌"}</span>
                    {toast.message}
                </div>
            )}

            <div style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Users & Roles</h1>
                    <p style={styles.headerSub}>Manage user accounts and assign roles</p>
                </div>
                <button style={styles.refreshBtn} onClick={fetchUsers}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh
                </button>
            </div>

            <div style={styles.statsRow}>
                {stats.map((s, i) => (
                    <div key={i} style={{ ...styles.statCard, backgroundColor: s.bg }}>
                        <div>
                            <p style={{ ...styles.statLabel, color: s.color }}>{s.label}</p>
                            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
                        </div>
                        <span style={{ fontSize: "1.75rem" }}>{s.icon}</span>
                    </div>
                ))}
            </div>

            <div style={styles.tableCard}>
                <div style={styles.toolbar}>
                    <div style={styles.searchWrap}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input
                            style={styles.searchInput}
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={styles.filterRow}>
                        {["ALL", ...ROLES].map(r => (
                            <button
                                key={r}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterRole === r ? styles.filterBtnActive : {})
                                }}
                                onClick={() => setFilterRole(r)}
                            >
                                {r === "ALL"
                                    ? `All (${users.length})`
                                    : `${ROLE_CONFIG[r]?.icon} ${r} (${users.filter(u => u.role === r).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header — userType column removed */}
                <div style={styles.tableHead}>
                    {["User", "Login Provider", "Current Role", "Change Role"].map(h => (
                        <p key={h} style={styles.th}>{h}</p>
                    ))}
                </div>

                {loading ? (
                    <div style={styles.loadingWrap}>
                        <div style={styles.spinner} />
                        <p style={styles.loadingText}>Loading users...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={styles.emptyWrap}>
                        <span style={{ fontSize: "2rem" }}>👥</span>
                        <p style={styles.emptyTitle}>No users found</p>
                        <p style={styles.emptyDesc}>Try adjusting your search or filter</p>
                    </div>
                ) : (
                    filtered.map(u => (
                        <UserRow
                            key={u.id}
                            user={u}
                            currentUser={currentUser}
                            onRoleChange={handleRoleChange}
                            loading={changingRole}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

const styles = {
    page: {
        display: "flex", flexDirection: "column",
        gap: "1.25rem", fontFamily: "var(--font-body)", position: "relative",
    },
    toast: {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        color: "var(--color-white)", padding: "1rem 2rem",
        borderRadius: 12, fontSize: "0.95rem", fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8,
        zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        minWidth: 300, justifyContent: "center",
    },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerTitle: {
        fontFamily: "var(--font-heading)", fontSize: "1.4rem",
        fontWeight: 700, color: "var(--color-text)", marginBottom: 2,
    },
    headerSub: { fontSize: "0.82rem", color: "var(--color-text-light)" },
    refreshBtn: {
        display: "flex", alignItems: "center", gap: 6,
        padding: "0.6rem 1.1rem", backgroundColor: "var(--color-white)",
        color: "var(--color-text)", border: "1px solid var(--color-border)",
        borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
    statCard: {
        borderRadius: 12, padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: "1px solid rgba(0,0,0,0.05)",
    },
    statLabel: { fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 },
    statValue: { fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-heading)", lineHeight: 1 },
    tableCard: {
        backgroundColor: "var(--color-white)", borderRadius: 14,
        border: "1px solid var(--color-border)", overflow: "hidden",
    },
    toolbar: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)",
        gap: 12, flexWrap: "wrap",
    },
    searchWrap: {
        display: "flex", alignItems: "center", gap: 8,
        backgroundColor: "var(--color-off-white)", border: "1px solid var(--color-border)",
        borderRadius: 8, padding: "0.45rem 0.875rem", width: 260,
    },
    searchInput: {
        border: "none", background: "transparent", fontSize: "0.82rem",
        color: "var(--color-text)", width: "100%", fontFamily: "var(--font-body)",
    },
    filterRow: { display: "flex", alignItems: "center", gap: 6 },
    filterBtn: {
        padding: "0.4rem 0.875rem", borderRadius: 8,
        border: "1px solid var(--color-border)", backgroundColor: "var(--color-white)",
        color: "var(--color-text-light)", fontSize: "0.78rem", fontWeight: 500,
        cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s ease",
        whiteSpace: "nowrap",
    },
    filterBtnActive: {
        backgroundColor: "#E8F5E9", color: "var(--color-primary)",
        borderColor: "var(--color-primary)", fontWeight: 700,
    },
    // Table — 4 columns instead of 5
    tableHead: {
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
        padding: "0.75rem 1.25rem", backgroundColor: "var(--color-off-white)",
        borderBottom: "1px solid var(--color-border)", gap: 12,
    },
    th: {
        fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-light)",
        textTransform: "uppercase", letterSpacing: "0.07em",
    },
    // Row — 4 columns instead of 5
    row: {
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
        padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-light-gray)",
        alignItems: "center", gap: 12, transition: "background 0.15s",
    },
    userInfo: { display: "flex", alignItems: "center", gap: 10 },
    avatar: {
        width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
        border: "2px solid var(--color-border)", flexShrink: 0,
    },
    userDetails: { minWidth: 0 },
    nameRow: { display: "flex", alignItems: "center", gap: 6 },
    userName: {
        fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    },
    youBadge: {
        fontSize: "0.6rem", fontWeight: 700, backgroundColor: "var(--color-primary)",
        color: "var(--color-white)", padding: "1px 6px", borderRadius: 4, flexShrink: 0,
    },
    userEmail: {
        fontSize: "0.72rem", color: "var(--color-text-light)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    },
    cell: { display: "flex", alignItems: "center" },
    providerPill: { fontSize: "0.72rem", fontWeight: 500, color: "var(--color-text-light)" },
    rolePill: {
        fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
        borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.04em",
    },
    cantChange: { fontSize: "0.72rem", color: "var(--color-text-light)", fontStyle: "italic" },
    select: {
        padding: "0.4rem 0.75rem", borderRadius: 8,
        border: "1px solid var(--color-border)", backgroundColor: "var(--color-white)",
        fontSize: "0.82rem", color: "var(--color-text)",
        fontFamily: "var(--font-body)", cursor: "pointer", width: "100%",
    },
    loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", gap: "1rem" },
    spinner: {
        width: 32, height: 32, border: "3px solid var(--color-light-gray)",
        borderTop: "3px solid var(--color-primary)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    loadingText: { fontSize: "0.85rem", color: "var(--color-text-light)" },
    emptyWrap: { display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", gap: "0.5rem", textAlign: "center" },
    emptyTitle: { fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" },
    emptyDesc: { fontSize: "0.82rem", color: "var(--color-text-light)" },
};
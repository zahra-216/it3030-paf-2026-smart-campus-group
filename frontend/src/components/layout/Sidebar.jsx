import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const adminMenu = [
    {
        group: "MAIN MENU",
        items: [
            { id: "dashboard", label: "Dashboard", icon: DashIcon },
            { id: "resources", label: "Facilities", icon: FacilIcon },
            { id: "bookings", label: "Bookings", icon: BookIcon },
            { id: "tickets", label: "Maintenance", icon: MaintIcon },
        ]
    },
    {
        group: "ADMINISTRATION",
        items: [
            { id: "users", label: "Users & Roles", icon: UsersIcon },
            { id: "settings", label: "Settings", icon: SettingsIcon },
        ]
    }
];

const userMenu = [
    {
        group: "MAIN MENU",
        items: [
            { id: "dashboard", label: "Dashboard", icon: DashIcon },
            { id: "resources", label: "Facilities", icon: FacilIcon },
            { id: "bookings", label: "Bookings", icon: BookIcon },
            { id: "tickets", label: "Maintenance", icon: MaintIcon },
            { id: "notifications", label: "Notifications", icon: NotifIcon },
        ]
    }
];

export default function Sidebar({ activePage, setActivePage }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const menu = user?.role === "ADMIN" ? adminMenu : userMenu;

    return (
        <aside style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoWrap}>
                <div style={styles.logoIconWrap}>
                    <span style={{ fontSize: "1.2rem" }}>🎓</span>
                </div>
                <div>
                    <p style={styles.logoTitle}>UniDesk</p>
                    <p style={styles.logoSub}>Smart Campus Operations Hub</p>
                </div>
            </div>

            {/* Nav */}
            <nav style={styles.nav}>
                {menu.map((group) => (
                    <div key={group.group} style={styles.group}>
                        <p style={styles.groupLabel}>{group.group}</p>
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    style={{
                                        ...styles.navItem,
                                        ...(isActive ? styles.navItemActive : {}),
                                    }}
                                    onClick={() => setActivePage(item.id)}
                                >
                                    <Icon active={isActive} />
                                    <span style={styles.navLabel}>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Sign Out */}
            <button
                style={styles.signOut}
                onClick={() => { logout(); navigate("/login"); }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
            </button>
        </aside>
    );
}

/* ── Icon components ── */
function DashIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
    );
}
function FacilIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    );
}
function BookIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    );
}
function MaintIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
    );
}
function NotifIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
    );
}
function UsersIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    );
}
function SettingsIcon({ active }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    );
}

const styles = {
    sidebar: {
        width: 260,
        minWidth: 260,
        height: "100vh",
        backgroundColor: "var(--color-primary)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        overflow: "hidden",
    },
    logoWrap: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "1.25rem 1.25rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
    },
    logoIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#D4A843",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    logoTitle: {
        fontFamily: "var(--font-heading)",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "#fff",
        lineHeight: 1.2,
    },
    logoSub: {
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.5)",
        lineHeight: 1.2,
    },
    nav: {
        flex: 1,
        padding: "0.75rem 0.75rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
    },
    group: {},
    groupLabel: {
        fontSize: "0.7rem",
        fontWeight: 800,
        color: "rgba(0, 0, 0, 0.6)",
        letterSpacing: "0.1em",
        padding: "0 0.5rem",
        marginBottom: "0.4rem",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "0.6rem 0.75rem",
        borderRadius: 8,
        border: "none",
        backgroundColor: "transparent",
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "all 0.15s ease",
        textAlign: "left",
    },
    navItemActive: {
        backgroundColor: "rgba(255,255,255,0.12)",
        color: "#fff",
    },
    navLabel: { flex: 1 },
    signOut: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "0.75rem",
        padding: "0.65rem 0.75rem",
        borderRadius: 8,
        border: "none",
        backgroundColor: "transparent",
        color: "rgba(255,255,255,0.5)",
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingTop: "1rem",
        marginTop: 0,
        transition: "color 0.15s",
    },
};
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const PREF_KEY = "unidesk_notif_prefs";

const PREFERENCE_OPTIONS = [
    {
        id: "BOOKING",
        icon: "📅",
        label: "Booking Notifications",
        description: "Get notified when your bookings are approved, rejected or cancelled",
        color: "var(--color-primary)",
        bg: "#E8F5E9",
    },
    {
        id: "TICKET",
        icon: "🔧",
        label: "Ticket Notifications",
        description: "Get notified about updates to your maintenance tickets",
        color: "#D97706",
        bg: "#FEF3C7",
    },
    {
        id: "COMMENT",
        icon: "💬",
        label: "Comment Notifications",
        description: "Get notified when someone comments on your tickets",
        color: "#1D4ED8",
        bg: "#EFF6FF",
    },
];

const FREQUENCY_OPTIONS = [
    { id: "instant", label: "Instant", description: "Get notified immediately" },
    { id: "daily",   label: "Daily Digest", description: "One summary per day" },
    { id: "none",    label: "Muted", description: "No notifications" },
];

export default function NotificationPreferencesPage() {
    const { user } = useAuth();

    const [prefs, setPrefs] = useState(() => {
        try {
            const saved = localStorage.getItem(`${PREF_KEY}_${user?.id}`);
            return saved ? JSON.parse(saved) : {
                BOOKING: true,
                TICKET: true,
                COMMENT: true,
                frequency: "instant",
                emailNotifs: false,
            };
        } catch {
            return { BOOKING: true, TICKET: true, COMMENT: true, frequency: "instant", emailNotifs: false };
        }
    });

    const [saved, setSaved] = useState(false);

    const savePrefs = () => {
        localStorage.setItem(`${PREF_KEY}_${user?.id}`, JSON.stringify(prefs));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const togglePref = (id) => {
        setPrefs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const enabledCount = PREFERENCE_OPTIONS.filter(o => prefs[o.id]).length;

    return (
        <div style={styles.page}>

            {/* Toast */}
            {saved && (
                <div style={styles.toast}>
                    ✅ Preferences saved successfully
                </div>
            )}

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Notification Preferences</h1>
                    <p style={styles.headerSub}>
                        Choose what you want to be notified about
                    </p>
                </div>
                <button style={styles.saveBtn} onClick={savePrefs}>
                    Save Preferences
                </button>
            </div>

            {/* Summary Card */}
            <div style={styles.summaryCard}>
                <div style={styles.summaryLeft}>
                    <div style={styles.summaryIconWrap}>
                        <span style={{ fontSize: "1.5rem" }}>🔔</span>
                    </div>
                    <div>
                        <p style={styles.summaryTitle}>
                            {enabledCount === 0
                                ? "All notifications muted"
                                : `${enabledCount} of ${PREFERENCE_OPTIONS.length} categories enabled`}
                        </p>
                        <p style={styles.summarySub}>
                            {enabledCount === 0
                                ? "You won't receive any in-app notifications"
                                : "You'll be notified for the selected categories"}
                        </p>
                    </div>
                </div>
                <div style={{
                    ...styles.summaryBadge,
                    backgroundColor: enabledCount === 0 ? "#FEE2E2" : "#E8F5E9",
                    color: enabledCount === 0 ? "#DC2626" : "var(--color-primary)",
                }}>
                    {enabledCount === 0 ? "Muted" : "Active"}
                </div>
            </div>

            {/* Notification Types */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Notification Types</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {PREFERENCE_OPTIONS.map(opt => (
                        <div
                            key={opt.id}
                            style={{
                                ...styles.prefCard,
                                borderColor: prefs[opt.id] ? opt.color + "40" : "var(--color-border)",
                                backgroundColor: prefs[opt.id] ? opt.bg + "60" : "var(--color-white)",
                            }}
                        >
                            <div style={{ ...styles.prefIcon, backgroundColor: opt.bg }}>
                                <span style={{ fontSize: "1.2rem" }}>{opt.icon}</span>
                            </div>
                            <div style={styles.prefInfo}>
                                <p style={{ ...styles.prefLabel, color: prefs[opt.id] ? opt.color : "var(--color-text)" }}>
                                    {opt.label}
                                </p>
                                <p style={styles.prefDesc}>{opt.description}</p>
                            </div>
                            {/* Toggle Switch */}
                            <div
                                style={{
                                    ...styles.toggle,
                                    backgroundColor: prefs[opt.id] ? opt.color : "var(--color-light-gray)",
                                }}
                                onClick={() => togglePref(opt.id)}
                            >
                                <div style={{
                                    ...styles.toggleThumb,
                                    transform: prefs[opt.id] ? "translateX(20px)" : "translateX(2px)",
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Frequency */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Notification Frequency</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {FREQUENCY_OPTIONS.map(f => (
                        <div
                            key={f.id}
                            style={{
                                ...styles.freqCard,
                                borderColor: prefs.frequency === f.id ? "var(--color-primary)" : "var(--color-border)",
                                backgroundColor: prefs.frequency === f.id ? "#E8F5E9" : "var(--color-white)",
                            }}
                            onClick={() => setPrefs(prev => ({ ...prev, frequency: f.id }))}
                        >
                            <div style={styles.freqRadio}>
                                <div style={{
                                    ...styles.freqRadioInner,
                                    backgroundColor: prefs.frequency === f.id ? "var(--color-primary)" : "transparent",
                                    borderColor: prefs.frequency === f.id ? "var(--color-primary)" : "var(--color-border)",
                                }} />
                            </div>
                            <div>
                                <p style={{
                                    ...styles.freqLabel,
                                    color: prefs.frequency === f.id ? "var(--color-primary)" : "var(--color-text)",
                                }}>
                                    {f.label}
                                </p>
                                <p style={styles.freqDesc}>{f.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={styles.quickBtn}
                        onClick={() => setPrefs(prev => ({
                            ...prev,
                            BOOKING: true, TICKET: true, COMMENT: true
                        }))}
                    >
                        ✅ Enable All
                    </button>
                    <button
                        style={{ ...styles.quickBtn, ...styles.quickBtnDanger }}
                        onClick={() => setPrefs(prev => ({
                            ...prev,
                            BOOKING: false, TICKET: false, COMMENT: false
                        }))}
                    >
                        🔕 Disable All
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        display: "flex", flexDirection: "column", gap: "1.25rem",
        fontFamily: "var(--font-body)", position: "relative",
    },
    toast: {
        position: "fixed", top: "1.5rem", left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--color-primary)", color: "var(--color-white)",
        padding: "0.75rem 1.5rem", borderRadius: 10,
        fontSize: "0.875rem", fontWeight: 600,
        zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        backdropFilter: "blur(8px)",
    },
    header: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    headerTitle: {
        fontFamily: "var(--font-heading)", fontSize: "1.4rem",
        fontWeight: 700, color: "var(--color-text)", marginBottom: 2,
    },
    headerSub: { fontSize: "0.82rem", color: "var(--color-text-light)" },
    saveBtn: {
        padding: "0.6rem 1.25rem",
        backgroundColor: "var(--color-primary)", color: "var(--color-white)",
        border: "none", borderRadius: 8, fontSize: "0.875rem",
        fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
    },
    summaryCard: {
        backgroundColor: "var(--color-white)", borderRadius: 14,
        border: "1px solid var(--color-border)", padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    summaryLeft: { display: "flex", alignItems: "center", gap: 14 },
    summaryIconWrap: {
        width: 52, height: 52, borderRadius: 12,
        backgroundColor: "#E8F5E9",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    summaryTitle: {
        fontSize: "0.95rem", fontWeight: 700,
        color: "var(--color-text)", margin: 0, marginBottom: 2,
        fontFamily: "var(--font-heading)",
    },
    summarySub: { fontSize: "0.8rem", color: "var(--color-text-light)", margin: 0 },
    summaryBadge: {
        padding: "4px 14px", borderRadius: 50,
        fontSize: "0.78rem", fontWeight: 700,
    },
    section: {
        backgroundColor: "var(--color-white)", borderRadius: 14,
        border: "1px solid var(--color-border)", padding: "1.25rem 1.5rem",
        display: "flex", flexDirection: "column", gap: "1rem",
    },
    sectionTitle: {
        fontFamily: "var(--font-heading)", fontSize: "0.95rem",
        fontWeight: 700, color: "var(--color-text)", margin: 0,
    },
    prefCard: {
        display: "flex", alignItems: "center", gap: 14,
        padding: "1rem 1.25rem", borderRadius: 12,
        border: "1.5px solid", transition: "all 0.2s ease",
        cursor: "pointer",
    },
    prefIcon: {
        width: 44, height: 44, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    prefInfo: { flex: 1 },
    prefLabel: {
        fontSize: "0.875rem", fontWeight: 700, margin: 0, marginBottom: 2,
        fontFamily: "var(--font-heading)",
    },
    prefDesc: { fontSize: "0.78rem", color: "var(--color-text-light)", margin: 0 },
    toggle: {
        width: 44, height: 24, borderRadius: 12,
        position: "relative", cursor: "pointer",
        transition: "background-color 0.2s ease", flexShrink: 0,
    },
    toggleThumb: {
        position: "absolute", top: 2,
        width: 20, height: 20, borderRadius: "50%",
        backgroundColor: "var(--color-white)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "transform 0.2s ease",
    },
    freqCard: {
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "1rem", borderRadius: 12,
        border: "1.5px solid", cursor: "pointer",
        transition: "all 0.15s ease",
    },
    freqRadio: {
        width: 18, height: 18, borderRadius: "50%",
        border: "2px solid", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2,
    },
    freqRadioInner: {
        width: 10, height: 10, borderRadius: "50%",
        border: "2px solid", transition: "all 0.15s",
    },
    freqLabel: {
        fontSize: "0.875rem", fontWeight: 700,
        margin: 0, marginBottom: 2, fontFamily: "var(--font-heading)",
    },
    freqDesc: { fontSize: "0.75rem", color: "var(--color-text-light)", margin: 0 },
    quickBtn: {
        padding: "0.6rem 1.1rem",
        backgroundColor: "var(--color-off-white)",
        color: "var(--color-text)", border: "1px solid var(--color-border)",
        borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    quickBtnDanger: {
        backgroundColor: "#FEE2E2", color: "#DC2626",
        borderColor: "#FCA5A5",
    },
};
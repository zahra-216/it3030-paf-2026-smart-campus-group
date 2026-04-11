export default function StatCard({ label, value, icon, sub, subColor }) {
    return (
        <div style={styles.card}>
            <div style={styles.top}>
                <p style={styles.label}>{label}</p>
                <div style={styles.iconWrap}>{icon}</div>
            </div>
            <p style={styles.value}>{value}</p>
            {sub && (
                <p style={{ ...styles.sub, color: subColor || "var(--color-text-light)" }}>{sub}</p>
            )}
        </div>
    );
}

const styles = {
    card: {
        background: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.4rem",
        border: "1px solid #E5E7EB",
        flex: 1,
    },
    top: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
    },
    label: {
        fontSize: "0.82rem",
        color: "var(--color-text-light)",
        fontWeight: 500,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        background: "#F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.1rem",
    },
    value: {
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--color-text)",
        fontFamily: "var(--font-heading)",
        lineHeight: 1,
        marginBottom: "0.4rem",
    },
    sub: {
        fontSize: "0.78rem",
        fontWeight: 500,
    },
};
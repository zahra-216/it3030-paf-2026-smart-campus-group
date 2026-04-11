export default function Badge({ status }) {
    const config = {
        APPROVED:    { bg: "#D1FAE5", color: "#065F46", label: "APPROVED" },
        PENDING:     { bg: "#FEF3C7", color: "#92400E", label: "PENDING" },
        REJECTED:    { bg: "#FEE2E2", color: "#991B1B", label: "REJECTED" },
        CANCELLED:   { bg: "#F3F4F6", color: "#374151", label: "CANCELLED" },
        OPEN:        { bg: "#DBEAFE", color: "#1E40AF", label: "OPEN" },
        IN_PROGRESS: { bg: "#FEF3C7", color: "#92400E", label: "IN PROGRESS" },
        RESOLVED:    { bg: "#D1FAE5", color: "#065F46", label: "RESOLVED" },
        CLOSED:      { bg: "#F3F4F6", color: "#374151", label: "CLOSED" },
        HIGH:        { bg: "#FEE2E2", color: "#991B1B", label: "HIGH" },
        MEDIUM:      { bg: "#FEF3C7", color: "#92400E", label: "MEDIUM" },
        LOW:         { bg: "#D1FAE5", color: "#065F46", label: "LOW" },
    };

    const c = config[status] || { bg: "#F3F4F6", color: "#374151", label: status };

    return (
        <span style={{
            backgroundColor: c.bg,
            color: c.color,
            padding: "3px 10px",
            borderRadius: 50,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-body)",
        }}>
            {c.label}
        </span>
    );
}
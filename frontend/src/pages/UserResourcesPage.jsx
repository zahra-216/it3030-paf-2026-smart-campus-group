import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import { ResourceType, ResourceStatus } from "../constants/enums";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/resources`;

export default function UserResourcesPage() {
    const { token } = useAuth();

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCapacity, setFilterCapacity] = useState("");

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterType) params.append("type", filterType);
            if (filterStatus) params.append("status", filterStatus);
            if (filterLocation) params.append("location", filterLocation);
            if (filterCapacity) params.append("minCapacity", filterCapacity);

            const res = await fetch(`${API_BASE}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch resources");
            const data = await res.json();
            setResources(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(); }, [filterType, filterStatus, filterLocation, filterCapacity]);

    return (
        <div style={styles.page}>

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Facilities & Assets</h1>
                    <p style={styles.subtitle}>Browse and search available campus resources.</p>
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersCard}>
                <select style={styles.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    {Object.values(ResourceType).map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                </select>
                <select style={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    {Object.values(ResourceStatus).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                </select>
                <input
                    style={styles.input}
                    placeholder="Search by location..."
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                />
                <input
                    style={styles.input}
                    placeholder="Min capacity..."
                    type="number"
                    value={filterCapacity}
                    onChange={e => setFilterCapacity(e.target.value)}
                />
                <button style={styles.clearBtn} onClick={() => { setFilterType(""); setFilterStatus(""); setFilterLocation(""); setFilterCapacity(""); }}>
                    Clear
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={styles.center}><p style={styles.hint}>Loading resources...</p></div>
            ) : error ? (
                <div style={styles.center}><p style={{ color: "#DC2626" }}>{error}</p></div>
            ) : resources.length === 0 ? (
                <div style={styles.emptyCard}>
                    <p style={{ fontSize: "2rem" }}>🏛️</p>
                    <p style={styles.emptyTitle}>No resources found</p>
                    <p style={styles.hint}>Try adjusting your filters.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {resources.map(r => (
                        <div key={r.id} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.iconWrap}>
                                    <span style={{ fontSize: "1.4rem" }}>{typeIcon(r.type)}</span>
                                </div>
                                <Badge status={r.status} />
                            </div>
                            <p style={styles.resourceName}>{r.name}</p>
                            <p style={styles.resourceType}>{r.type?.replace(/_/g, " ")}</p>
                            <div style={styles.metaList}>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaIcon}>📍</span>
                                    <span style={styles.metaText}>{r.location}</span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaIcon}>👥</span>
                                    <span style={styles.metaText}>Capacity: {r.capacity}</span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaIcon}>🕐</span>
                                    <span style={{
                                        ...styles.metaText,
                                        color: r.status === ResourceStatus.OUT_OF_SERVICE ? "#DC2626" : "#6B7280"
                                    }}>
                                        {r.status === ResourceStatus.OUT_OF_SERVICE ? "Unavailable" : `${r.availableFrom} – ${r.availableUntil}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function typeIcon(type) {
    switch (type) {
        case ResourceType.LAB: return "🔬";
        case ResourceType.LECTURE_HALL: return "🏛️";
        case ResourceType.MEETING_ROOM: return "🤝";
        case ResourceType.EQUIPMENT: return "📷";
        default: return "🏢";
    }
}

const styles = {
    page: { display: "flex", flexDirection: "column", gap: "1.25rem" },
    header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
    title: { fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: 4 },
    subtitle: { fontSize: "0.875rem", color: "#6B7280" },
    filtersCard: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: "1rem 1.25rem", border: "1px solid #E5E7EB",
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
    },
    select: {
        padding: "0.5rem 0.75rem", borderRadius: 8,
        border: "1px solid #D1D5DB", fontSize: "0.85rem",
        fontFamily: "var(--font-body)", color: "#374151",
        backgroundColor: "#F9FAFB", cursor: "pointer",
    },
    input: {
        padding: "0.5rem 0.75rem", borderRadius: 8,
        border: "1px solid #D1D5DB", fontSize: "0.85rem",
        fontFamily: "var(--font-body)", color: "#374151",
        backgroundColor: "#F9FAFB", outline: "none",
    },
    clearBtn: {
        padding: "0.5rem 1rem", borderRadius: 8,
        border: "1px solid #D1D5DB", fontSize: "0.85rem",
        fontFamily: "var(--font-body)", color: "#6B7280",
        backgroundColor: "#fff", cursor: "pointer",
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
    card: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: "1.25rem", border: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column", gap: 8,
    },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    iconWrap: {
        width: 44, height: 44, borderRadius: 10,
        backgroundColor: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    resourceName: { fontSize: "0.95rem", fontWeight: 700, color: "#111827", fontFamily: "var(--font-heading)" },
    resourceType: { fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" },
    metaList: { display: "flex", flexDirection: "column", gap: 5, marginTop: 4 },
    metaRow: { display: "flex", alignItems: "center", gap: 6 },
    metaIcon: { fontSize: "0.8rem" },
    metaText: { fontSize: "0.8rem", color: "#6B7280" },
    center: { display: "flex", justifyContent: "center", padding: "3rem" },
    emptyCard: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: "4rem", border: "1px solid #E5E7EB",
        textAlign: "center",
    },
    emptyTitle: { fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: 4, fontFamily: "var(--font-heading)" },
    hint: { fontSize: "0.85rem", color: "#6B7280" },
};
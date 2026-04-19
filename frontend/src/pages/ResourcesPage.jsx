import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge";
import { ResourceType, ResourceStatus } from "../constants/enums";

const API_BASE = "http://localhost:8081/api/resources";

export default function ResourcesPage() {
    const { token } = useAuth();
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCapacity, setFilterCapacity] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [form, setForm] = useState({
        name: "", type: ResourceType.LAB, capacity: "", location: "",
        status: ResourceStatus.ACTIVE, availableFrom: "08:00", availableUntil: "18:00",
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

    const openCreateModal = () => {
        setEditingResource(null);
        setForm({ name: "", type: ResourceType.LAB, capacity: "", location: "", status: ResourceStatus.ACTIVE, availableFrom: "08:00", availableUntil: "18:00" });
        setShowModal(true);
    };

    const openEditModal = (resource) => {
        setEditingResource(resource);
        setForm({
            name: resource.name,
            type: resource.type,
            capacity: resource.capacity,
            location: resource.location,
            status: resource.status,
            availableFrom: resource.availableFrom,
            availableUntil: resource.availableUntil,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.location || !form.capacity) {
            alert("Please fill in all required fields.");
            return;
        }
        setSubmitting(true);
        try {
            const url = editingResource ? `${API_BASE}/${editingResource.id}` : API_BASE;
            const method = editingResource ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) }),
            });
            if (!res.ok) throw new Error("Failed to save resource");
            setShowModal(false);
            fetchResources();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete resource");
            setDeleteConfirmId(null);
            fetchResources();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div style={styles.page}>

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Facilities & Assets</h1>
                    <p style={styles.subtitle}>
                        {isAdmin ? "Manage campus resources, rooms, and equipment." : "Browse and search available campus resources."}
                    </p>
                </div>
                {isAdmin && (
                    <button style={styles.addBtn} onClick={openCreateModal}>
                        + Add Resource
                    </button>
                )}
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
                    <p style={styles.hint}>Try adjusting your filters{isAdmin ? " or add a new resource." : "."}</p>
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

                            {isAdmin && (
                                <div style={styles.cardActions}>
                                    <button style={styles.editBtn} onClick={() => openEditModal(r)}>Edit</button>
                                    <button style={styles.deleteBtn} onClick={() => setDeleteConfirmId(r.id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{editingResource ? "Edit Resource" : "Add New Resource"}</h2>
                            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Name *</label>
                                <input style={styles.formInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lab 101" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Type *</label>
                                <select style={styles.formInput} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {Object.values(ResourceType).map(t => (
                                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Capacity *</label>
                                <input style={styles.formInput} type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 30" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Location *</label>
                                <input style={styles.formInput} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Block A, Floor 2" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Status *</label>
                                <select style={styles.formInput} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    {Object.values(ResourceStatus).map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                    ))}
                                </select>
                            </div>
                            {form.status !== ResourceStatus.OUT_OF_SERVICE && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Available From</label>
                                        <input style={styles.formInput} type="time" value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Available Until</label>
                                        <input style={styles.formInput} type="time" value={form.availableUntil} onChange={e => setForm({ ...form, availableUntil: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                            <button style={styles.saveBtn} onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Saving..." : editingResource ? "Update Resource" : "Create Resource"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirmId && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, maxWidth: 420 }}>
                        <h2 style={styles.modalTitle}>Delete Resource?</h2>
                        <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: "1rem 0 1.5rem" }}>
                            This action cannot be undone. The resource will be permanently removed.
                        </p>
                        <div style={styles.modalFooter}>
                            <button style={styles.cancelBtn} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            <button style={{ ...styles.saveBtn, backgroundColor: "#DC2626" }} onClick={() => handleDelete(deleteConfirmId)}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
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
    addBtn: {
        backgroundColor: "var(--color-primary)", color: "#fff",
        border: "none", borderRadius: 8, padding: "0.6rem 1.2rem",
        fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        fontFamily: "var(--font-body)",
    },
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
    cardActions: { display: "flex", gap: 8, marginTop: 8 },
    editBtn: {
        flex: 1, padding: "0.45rem", borderRadius: 7,
        border: "1px solid #D1D5DB", backgroundColor: "#fff",
        fontSize: "0.8rem", fontWeight: 600, color: "#374151",
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    deleteBtn: {
        flex: 1, padding: "0.45rem", borderRadius: 7,
        border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2",
        fontSize: "0.8rem", fontWeight: 600, color: "#DC2626",
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    center: { display: "flex", justifyContent: "center", padding: "3rem" },
    emptyCard: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: "4rem", border: "1px solid #E5E7EB",
        textAlign: "center",
    },
    emptyTitle: { fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: 4, fontFamily: "var(--font-heading)" },
    hint: { fontSize: "0.85rem", color: "#6B7280" },
    overlay: {
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "#fff", borderRadius: 16,
        padding: "1.75rem", width: "100%", maxWidth: 620,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
    modalTitle: { fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: "#111827" },
    closeBtn: { background: "none", border: "none", fontSize: "1rem", color: "#9CA3AF", cursor: "pointer" },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
    formGroup: { display: "flex", flexDirection: "column", gap: 5 },
    label: { fontSize: "0.78rem", fontWeight: 600, color: "#374151" },
    formInput: {
        padding: "0.55rem 0.75rem", borderRadius: 8,
        border: "1px solid #D1D5DB", fontSize: "0.875rem",
        fontFamily: "var(--font-body)", color: "#111827",
        outline: "none", backgroundColor: "#F9FAFB",
    },
    modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "1.5rem" },
    cancelBtn: {
        padding: "0.6rem 1.25rem", borderRadius: 8,
        border: "1px solid #D1D5DB", backgroundColor: "#fff",
        fontSize: "0.875rem", fontWeight: 600, color: "#374151",
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
    saveBtn: {
        padding: "0.6rem 1.25rem", borderRadius: 8,
        border: "none", backgroundColor: "var(--color-primary)",
        fontSize: "0.875rem", fontWeight: 600, color: "#fff",
        cursor: "pointer", fontFamily: "var(--font-body)",
    },
};
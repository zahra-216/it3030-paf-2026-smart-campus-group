import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
<<<<<<< HEAD

const OPEN_HOUR  = 8;
const CLOSE_HOUR = 20;

const STATUS_COLORS = {
    APPROVED:  { color: "#059669", bg: "#E8F5E9" },
    PENDING:   { color: "#D97706", bg: "#FEF3C7" },
    REJECTED:  { color: "#DC2626", bg: "#FEE2E2" },
    CANCELLED: { color: "#6B7280", bg: "#F3F4F6" },
};

// ── Reusable Components ────────────────────────────────────────

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{
            position: "fixed", top: "1.5rem", left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toast.type === "success" ? "var(--color-primary)" : toast.type === "error" ? "#DC2626" : "#D97706",
            color: "var(--color-white)", padding: "0.75rem 1.5rem",
            borderRadius: 10, fontSize: "0.875rem", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            zIndex: 2000, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            minWidth: 280, justifyContent: "center", fontFamily: "var(--font-body)",
        }}>
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "⚠️"} {toast.message}
        </div>
    );
}

function StatCards({ bookings, isAdmin }) {
    if (!isAdmin) return null;
    const stats = [
        { label: "Total",     value: bookings.length,                                          icon: "📋", bg: "#EFF6FF", color: "#1D4ED8" },
        { label: "Pending",   value: bookings.filter(b => b.status === "PENDING").length,   icon: "⏳", bg: "#FEF3C7", color: "#D97706" },
        { label: "Approved",  value: bookings.filter(b => b.status === "APPROVED").length,  icon: "✅", bg: "#E8F5E9", color: "var(--color-primary)" },
        { label: "Rejected",  value: bookings.filter(b => b.status === "REJECTED").length,  icon: "❌", bg: "#FEE2E2", color: "#DC2626" },
        { label: "Cancelled", value: bookings.filter(b => b.status === "CANCELLED").length, icon: "🚫", bg: "#F3F4F6", color: "#6B7280" },
    ];
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {stats.map(s => (
                <div key={s.label} style={{
                    borderRadius: 12, padding: "1rem",
                    backgroundColor: s.bg, border: "1px solid rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                    <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
                    <p style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: s.color, margin: 0 }}>{s.label}</p>
                </div>
            ))}
        </div>
    );
}

function FilterBar({ search, setSearch, statusFilter, setStatusFilter, isAdmin, count }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                backgroundColor: "var(--color-white)", border: "1px solid var(--color-border)",
                borderRadius: 8, padding: "0.5rem 0.875rem", flex: 1, minWidth: 200,
            }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                    style={{ border: "none", background: "transparent", fontSize: "0.85rem", color: "var(--color-text)", width: "100%", fontFamily: "var(--font-body)", outline: "none" }}
                    placeholder="Search by resource name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <select
                style={{ padding: "0.5rem 0.875rem", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text)", backgroundColor: "var(--color-white)", cursor: "pointer", fontFamily: "var(--font-body)", outline: "none" }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
            >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
                {isAdmin && <option value="REJECTED">Rejected</option>}
            </select>
            {(search || statusFilter !== "ALL") && (
                <button
                    style={{ padding: "0.5rem 0.875rem", borderRadius: 8, border: "1px solid #FCA5A5", backgroundColor: "#FFF5F5", color: "#DC2626", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-body)" }}
                    onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                >✕ Clear</button>
            )}
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-light)", whiteSpace: "nowrap" }}>
                {count} booking{count !== 1 ? "s" : ""}
            </span>
        </div>
    );
}

function BookingCard({ booking, isAdmin, onApprove, onReject, onCancel, onAdminCancel }) {
    const status = booking.status?.toUpperCase();
    const sc = STATUS_COLORS[status] || { color: "#9CA3AF", bg: "#F9FAFB" };

    const formatTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        let hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${m} ${ampm}`;
    };

    return (
        <div style={{
            backgroundColor: "var(--color-white)", borderRadius: 14,
            border: "1px solid var(--color-border)", padding: "1.25rem",
            display: "flex", flexDirection: "column", gap: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            borderTop: `3px solid ${sc.color}`,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)", margin: 0, flex: 1 }}>
                    {booking.resource?.name || "Resource"}
                </h3>
                <span style={{
                    padding: "3px 10px", borderRadius: 50,
                    fontSize: "0.68rem", fontWeight: 700,
                    backgroundColor: sc.bg, color: sc.color,
                    border: `1px solid ${sc.color}30`,
                    textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>
                    {status}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)", margin: 0 }}>📅 {booking.date}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)", margin: 0 }}>⏰ {formatTime(booking.startTime)} – {formatTime(booking.endTime)}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)", margin: 0 }}>👥 {booking.attendees} attendee{booking.attendees !== 1 ? "s" : ""}</p>
                {booking.purpose && <p style={{ fontSize: "0.78rem", color: "var(--color-text-light)", fontStyle: "italic", margin: 0 }}>{booking.purpose}</p>}
                {isAdmin && booking.user && <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)", margin: 0 }}>👤 {booking.user.name || booking.user.email}</p>}
                {booking.rejectionReason && (
                    <p style={{ fontSize: "0.75rem", color: "#DC2626", backgroundColor: "#FEE2E2", padding: "4px 8px", borderRadius: 6, margin: 0 }}>
                        ⚠️ {booking.rejectionReason}
                    </p>
                )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isAdmin ? (
                    <>
                        {status === "PENDING" && (
                            <>
                                <button onClick={() => onApprove(booking.id)} style={btnStyles.approve}>✅ Approve</button>
                                <button onClick={() => onReject(booking.id)} style={btnStyles.reject}>❌ Reject</button>
                            </>
                        )}
                        {(status === "APPROVED" || status === "PENDING") && (
                            <button onClick={() => onAdminCancel(booking.id)} style={btnStyles.cancel}>🚫 Cancel</button>
                        )}
                    </>
                ) : (
                    status === "PENDING" && (
                        <button onClick={() => onCancel(booking.id)} style={btnStyles.cancel}>Cancel Booking</button>
                    )
                )}
            </div>
        </div>
    );
}

function EmptyState({ hasFilters }) {
    return (
        <div style={{
            textAlign: "center", padding: "4rem",
            backgroundColor: "var(--color-white)", borderRadius: 14,
            border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
        }}>
            <span style={{ fontSize: "2.5rem" }}>📭</span>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                No bookings found
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-light)" }}>
                {hasFilters ? "Try adjusting your filters" : "Create your first booking to get started"}
            </p>
        </div>
    );
}

function ReasonModal({ title, placeholder, onConfirm, onCancel, confirmStyle }) {
    const [reason, setReason] = useState("");
    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
            <div style={{ width: 440, backgroundColor: "var(--color-white)", borderRadius: 16, padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{title}</h2>
                <textarea
                    placeholder={placeholder}
                    style={{
                        padding: "0.75rem", borderRadius: 8, border: "1px solid var(--color-border)",
                        fontSize: "0.875rem", color: "var(--color-text)", fontFamily: "var(--font-body)",
                        outline: "none", resize: "vertical", minHeight: 100, width: "100%", boxSizing: "border-box",
                    }}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    maxLength={300}
                />
                <p style={{ fontSize: "0.72rem", color: "var(--color-text-light)", alignSelf: "flex-end", margin: 0 }}>{reason.length}/300</p>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={{
                            flex: 1, padding: "0.7rem", borderRadius: 8, border: "none",
                            fontWeight: 600, fontSize: "0.875rem", cursor: reason.trim() ? "pointer" : "not-allowed",
                            opacity: reason.trim() ? 1 : 0.5, fontFamily: "var(--font-body)",
                            ...confirmStyle,
                        }}
                        disabled={!reason.trim()}
                        onClick={() => onConfirm(reason)}
                    >
                        Confirm
                    </button>
                    <button
                        style={{ flex: 1, padding: "0.7rem", borderRadius: 8, border: "1px solid var(--color-border)", backgroundColor: "var(--color-off-white)", color: "var(--color-text)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }}
                        onClick={onCancel}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

function BookingForm({ resources, onSubmit, onClose }) {
    const OPEN_H = 8, CLOSE_H = 20;
    const [form, setForm] = useState({ resourceId: "", date: "", startTime: "", endTime: "", purpose: "", attendees: 1 });

    const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    })();

    const toMins = t => { if (!t) return 0; const [h,m] = t.split(":").map(Number); return h*60+m; };
    const selectedRes = resources.find(r => r.id === Number(form.resourceId));
    const capacityPct = selectedRes ? Math.min((form.attendees / selectedRes.capacity) * 100, 100) : 0;
    const capacityOver = selectedRes ? form.attendees > selectedRes.capacity : false;
    const capacityColor = capacityOver ? "#DC2626" : capacityPct > 80 ? "#D97706" : "var(--color-primary)";
    const startMins = toMins(form.startTime);
    const endMins = toMins(form.endTime);
    const startOOH = form.startTime !== "" && (startMins < OPEN_H*60 || startMins >= CLOSE_H*60);
    const endOOH = form.endTime !== "" && (endMins > CLOSE_H*60 || endMins <= OPEN_H*60);
    const pastDate = form.date !== "" && form.date < todayStr;

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
            <div style={{ width: 560, backgroundColor: "var(--color-white)", padding: "2rem", borderRadius: 16, display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>New Booking</h2>
                    <button style={{ backgroundColor: "var(--color-off-white)", border: "1px solid var(--color-border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" }} onClick={onClose}>✕</button>
                </div>

                <div style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#1D4ED8" }}>
                    🕐 Resources available <strong>8:00 AM – 8:00 PM</strong> only.
                </div>

                <FormGroup label="Resource">
                    <select style={inputStyle} value={form.resourceId} onChange={e => setForm({...form, resourceId: Number(e.target.value) || ""})}>
                        <option value="">Select a resource...</option>
                        {resources.map(r => <option key={r.id} value={r.id}>{r.name} — Capacity: {r.capacity}</option>)}
                    </select>
                </FormGroup>

                {selectedRes && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.78rem", color: "var(--color-text-light)" }}>
                                Capacity: <strong style={{ color: capacityColor }}>{form.attendees}</strong> / {selectedRes.capacity}
                            </span>
                            {capacityOver && <span style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: 700 }}>⚠️ Exceeds limit!</span>}
                        </div>
                        <div style={{ height: 6, borderRadius: 999, backgroundColor: "var(--color-light-gray)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${capacityPct}%`, backgroundColor: capacityColor, borderRadius: 999, transition: "width 0.3s" }} />
                        </div>
                    </div>
                )}

                <FormGroup label="Date">
                    <input type="date" style={{ ...inputStyle, borderColor: pastDate ? "#DC2626" : "var(--color-border)" }} value={form.date} min={todayStr} onChange={e => setForm({...form, date: e.target.value})} />
                    {pastDate && <p style={errorText}>Cannot book for a past date</p>}
                </FormGroup>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <FormGroup label="Start Time">
                        <input type="time" style={{ ...inputStyle, borderColor: startOOH ? "#DC2626" : "var(--color-border)" }} min="08:00" max="20:00" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                        {startOOH && <p style={errorText}>Must be 8 AM – 8 PM</p>}
                    </FormGroup>
                    <FormGroup label="End Time">
                        <input type="time" style={{ ...inputStyle, borderColor: endOOH ? "#DC2626" : "var(--color-border)" }} min="08:00" max="20:00" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                        {endOOH && <p style={errorText}>Must be 8 AM – 8 PM</p>}
                    </FormGroup>
                </div>

                <FormGroup label={`Attendees${selectedRes ? ` (max ${selectedRes.capacity})` : ""}`}>
                    <input type="number" style={{ ...inputStyle, borderColor: capacityOver ? "#DC2626" : "var(--color-border)" }} min={1} max={selectedRes?.capacity} value={form.attendees} onChange={e => setForm({...form, attendees: parseInt(e.target.value)||1})} />
                    {capacityOver && <p style={errorText}>Exceeds resource capacity of {selectedRes.capacity}</p>}
                </FormGroup>

                <FormGroup label="Purpose">
                    <textarea placeholder="Purpose of booking..." style={{ ...inputStyle, borderRadius: 10, minHeight: 80, resize: "vertical" }} value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                </FormGroup>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button style={{ backgroundColor: "var(--color-primary)", color: "var(--color-white)", border: "none", padding: "0.7rem 1.5rem", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }} onClick={() => onSubmit(form)}>
                        Book Now
                    </button>
                    <button style={{ backgroundColor: "var(--color-off-white)", color: "var(--color-text)", border: "1px solid var(--color-border)", padding: "0.7rem 1.5rem", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-light)", fontFamily: "var(--font-body)" }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle = {
    padding: "0.7rem 0.875rem", borderRadius: 8,
    border: "1px solid var(--color-border)", fontSize: "0.875rem",
    color: "var(--color-text)", fontFamily: "var(--font-body)",
    outline: "none", width: "100%", boxSizing: "border-box",
    backgroundColor: "var(--color-white)",
};

const errorText = {
    fontSize: "0.72rem", color: "#DC2626", margin: "2px 0 0", fontFamily: "var(--font-body)",
};

const btnStyles = {
    approve: { backgroundColor: "var(--color-primary)", color: "var(--color-white)", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-body)" },
    reject:  { backgroundColor: "#DC2626", color: "var(--color-white)", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-body)" },
    cancel:  { backgroundColor: "#6B7280", color: "var(--color-white)", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-body)" },
};

// ── Main Component ─────────────────────────────────────────────

export default function BookingsPage() {
    const { user, token } = useAuth();
    const isAdmin = user?.role?.toUpperCase() === "ADMIN";

    const [toast, setToast]           = useState(null);
    const [showForm, setShowForm]     = useState(false);
    const [resources, setResources]   = useState([]);
    const [bookings, setBookings]     = useState([]);
    const [filtered, setFiltered]     = useState([]);
    const [search, setSearch]         = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [rejectModal, setRejectModal]   = useState({ open: false, bookingId: null });
    const [cancelModal, setCancelModal]   = useState({ open: false, bookingId: null });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!user || !token) return;
        fetchResources();
        fetchBookings();
    }, [user, token]);

    const fetchResources = async () => {
        try {
            const res = await axios.get("http://localhost:8081/api/resources", { headers: { Authorization: `Bearer ${token}` } });
            setResources(Array.isArray(res.data) ? res.data : []);
        } catch { showToast("Failed to load resources", "error"); }
    };

    const fetchBookings = async () => {
        try {
            const res = await axios.get("http://localhost:8081/api/bookings", { headers: { Authorization: `Bearer ${token}` } });
            const data = Array.isArray(res.data) ? res.data : [];
            const userFiltered = isAdmin ? data : data.filter(b => String(b.user?.id) === String(user?.id));
            const reversed = [...userFiltered].reverse();
            setBookings(reversed);
            setFiltered(reversed);
        } catch { showToast("Failed to load bookings", "error"); }
    };

    useEffect(() => {
        let data = [...bookings];
        if (search.trim()) data = data.filter(b => (b.resource?.name || "").toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== "ALL") data = data.filter(b => b.status?.toUpperCase() === statusFilter);
        setFiltered(data);
    }, [search, statusFilter, bookings]);

    const toMins = t => { if (!t) return 0; const [h,m] = t.split(":").map(Number); return h*60+m; };

    const handleSubmit = async (form) => {
        if (!form.resourceId) { showToast("Please select a resource", "error"); return; }
        if (!form.date)        { showToast("Please select a date", "error"); return; }
        if (!form.startTime || !form.endTime) { showToast("Please select start and end times", "error"); return; }
        const s = toMins(form.startTime), e = toMins(form.endTime);
        if (s < OPEN_HOUR*60 || e > CLOSE_HOUR*60) { showToast("Bookings only allowed 8AM – 8PM", "error"); return; }
        if (s >= e) { showToast("End time must be after start time", "error"); return; }
        const res = resources.find(r => r.id === Number(form.resourceId));
        if (form.attendees > res?.capacity) { showToast(`Exceeds capacity (${res.capacity})`, "error"); return; }
        try {
            await axios.post("http://localhost:8081/api/bookings", {
                resource: { id: Number(form.resourceId) }, user: { id: user?.id },
                date: form.date, startTime: form.startTime, endTime: form.endTime,
                purpose: form.purpose, attendees: form.attendees,
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking created successfully");
            setShowForm(false);
            fetchBookings();
        } catch (err) { showToast(err.response?.data || "Failed to create booking", "error"); }
    };

    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:8081/api/bookings/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking approved");
            fetchBookings();
        } catch { showToast("Approval failed", "error"); }
    };

    const handleReject = async (reason) => {
        try {
            await axios.put(`http://localhost:8081/api/bookings/${rejectModal.bookingId}/reject?reason=${encodeURIComponent(reason)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking rejected", "warning");
            setRejectModal({ open: false, bookingId: null });
            fetchBookings();
        } catch { showToast("Reject failed", "error"); }
    };

    const handleCancel = async (id) => {
        try {
            await axios.put(`http://localhost:8081/api/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking cancelled", "warning");
            fetchBookings();
        } catch { showToast("Cancel failed", "error"); }
    };

    const handleAdminCancel = async (reason) => {
        try {
            await axios.put(`http://localhost:8081/api/bookings/${cancelModal.bookingId}/cancel?reason=${encodeURIComponent(reason)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking cancelled", "warning");
            setCancelModal({ open: false, bookingId: null });
            fetchBookings();
        } catch { showToast("Cancel failed", "error"); }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "var(--font-body)" }}>
            <Toast toast={toast} />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 700, color: "var(--color-text)", margin: 0, marginBottom: 2 }}>Bookings</h1>
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-light)" }}>{isAdmin ? "Manage all campus bookings" : "Your booking history"}</p>
                </div>
                <button
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-white)", padding: "0.6rem 1.25rem", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", fontFamily: "var(--font-body)", boxShadow: "0 4px 12px rgba(78,125,91,0.3)" }}
                    onClick={() => setShowForm(true)}
                >
                    + New Booking
                </button>
            </div>

            <StatCards bookings={bookings} isAdmin={isAdmin} />

            <FilterBar
                search={search} setSearch={setSearch}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                isAdmin={isAdmin} count={filtered.length}
            />

            {filtered.length === 0 ? (
                <EmptyState hasFilters={search || statusFilter !== "ALL"} />
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {filtered.map(b => (
                        <BookingCard
                            key={b.id}
                            booking={b}
                            isAdmin={isAdmin}
                            onApprove={handleApprove}
                            onReject={(id) => setRejectModal({ open: true, bookingId: id })}
                            onCancel={handleCancel}
                            onAdminCancel={(id) => setCancelModal({ open: true, bookingId: id })}
                        />
                    ))}
                </div>
            )}

            {showForm && (
                <BookingForm resources={resources} onSubmit={handleSubmit} onClose={() => setShowForm(false)} />
            )}

            {rejectModal.open && (
                <ReasonModal
                    title="Reject Booking"
                    placeholder="Enter rejection reason..."
                    onConfirm={handleReject}
                    onCancel={() => setRejectModal({ open: false, bookingId: null })}
                    confirmStyle={{ backgroundColor: "#DC2626", color: "var(--color-white)" }}
                />
            )}

            {cancelModal.open && (
                <ReasonModal
                    title="Cancel Booking"
                    placeholder="e.g. Facility under emergency maintenance..."
                    onConfirm={handleAdminCancel}
                    onCancel={() => setCancelModal({ open: false, bookingId: null })}
                    confirmStyle={{ backgroundColor: "#6B7280", color: "var(--color-white)" }}
                />
            )}
        </div>
    );
}
=======
import { toast } from "react-toastify";

// Operating hours: 8:00 AM – 8:00 PM
const OPEN_HOUR  = 8;   // 08:00
const CLOSE_HOUR = 20;  // 20:00

export default function BookingsPage() {
  const { user, token } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null });
  const [cancelReason, setCancelReason] = useState("");

  const [form, setForm] = useState({
    resourceId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  // ── Data fetching ─────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    fetchResources();
    fetchBookings();
  }, [user, token]);

  const fetchResources = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load resources ❌");
    }
  };

  const fetchBookings = async () => {
    try {
      const url = isAdmin
        ? "http://localhost:8081/api/bookings"
        : `http://localhost:8081/api/bookings/user/${user?.id}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = res.data;
      const data = Array.isArray(responseData)
        ? responseData
        : responseData?.content || [];

      const reversed = [...data].reverse();
      setBookings(reversed);
      setFiltered(reversed);
    } catch {
      toast.error("Failed to load bookings ❌");
    }
  };

  // ── Filter logic ──────────────────────────────────────────
  useEffect(() => {
    let data = [...safeBookings];
    if (search.trim()) {
      data = data.filter((b) =>
        (b.resource?.name || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "ALL") {
      data = data.filter((b) => b.status?.toUpperCase() === statusFilter);
    }
    setFiltered(data);
  }, [search, statusFilter, bookings]);

  // ── Helpers ───────────────────────────────────────────────
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  // Convert "HH:MM" → total minutes
  const toMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();

  const isTimeConflict = () => {
    return safeBookings.some((b) => {
      if (b.resource?.id !== Number(form.resourceId)) return false;
      if (b.date !== form.date) return false;
      if (["CANCELLED", "REJECTED"].includes(b.status?.toUpperCase())) return false;
      return form.startTime < b.endTime && form.endTime > b.startTime;
    });
  };

  // ── All validation in one place ───────────────────────────
  const validate = () => {
    if (!form.resourceId) {
      toast.error("Please select a resource ❌");
      return false;
    }
    if (!form.date) {
      toast.error("Please select a date ❌");
      return false;
    }
    if (form.date < todayStr) {
      toast.error("Cannot book for a past date ❌");
      return false;
    }
    if (!form.startTime || !form.endTime) {
      toast.error("Please select start and end times ❌");
      return false;
    }
    const startMins = toMinutes(form.startTime);
    const endMins   = toMinutes(form.endTime);
    const openMins  = OPEN_HOUR * 60;   // 480
    const closeMins = CLOSE_HOUR * 60;  // 1200
    if (startMins < openMins || endMins > closeMins) {
      toast.error("Bookings only allowed between 8:00 AM and 8:00 PM ❌");
      return false;
    }
    if (startMins >= endMins) {
      toast.error("End time must be after start time ❌");
      return false;
    }
    const selectedResource = resources.find((r) => r.id === Number(form.resourceId));
    if (form.attendees > selectedResource?.capacity) {
      toast.error(`Attendees exceed capacity (${selectedResource.capacity}) ❌`);
      return false;
    }
    if (isTimeConflict()) {
      toast.error("Resource already booked for this time slot ❌");
      return false;
    }
    return true;
  };

  // ── Actions ───────────────────────────────────────────────
  const handleSubmit = async () => {
    // BUG FIX: validate() was never called before — all checks are now here
    if (!validate()) return;

    try {
      await axios.post(
        "http://localhost:8081/api/bookings",
        {
          // BUG FIX: send Number id, not the string from the select
          resource:   { id: Number(form.resourceId) },
          user:       { id: user?.id },
          date:       form.date,
          startTime:  form.startTime,
          endTime:    form.endTime,
          purpose:    form.purpose,
          attendees:  form.attendees,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Booking created successfully 🎉");
      setShowForm(false);
      setForm({ resourceId: "", date: "", startTime: "", endTime: "", purpose: "", attendees: 1 });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data || "Failed to create booking ❌");
    }
  };

  const approveBooking = async (id) => {
    try {
      await axios.put(`http://localhost:8081/api/bookings/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Booking approved ✅");
      fetchBookings();
    } catch {
      toast.error("Approval failed ❌");
    }
  };

  const rejectBooking = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason?.trim()) return;
    try {
      await axios.put(`http://localhost:8081/api/bookings/${id}/reject?reason=${encodeURIComponent(reason)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.warn("Booking rejected ⚠️");
      fetchBookings();
    } catch {
      toast.error("Reject failed ❌");
    }
  };

  const cancelBooking = async (id) => {
    try {
      await axios.put(`http://localhost:8081/api/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.warn("Booking cancelled ⚠️");
      fetchBookings();
    } catch {
      toast.error("Cancel failed ❌");
    }
  };

  const openAdminCancelModal = (id) => {
    setCancelReason("");
    setCancelModal({ open: true, bookingId: id });
  };

  const confirmAdminCancel = async () => {
    if (!cancelReason.trim()) { toast.error("Please enter a cancellation reason ❌"); return; }
    try {
      await axios.put(
        `http://localhost:8081/api/bookings/${cancelModal.bookingId}/cancel?reason=${encodeURIComponent(cancelReason)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.warn("Booking cancelled by admin ⚠️");
      setCancelModal({ open: false, bookingId: null });
      setCancelReason("");
      fetchBookings();
    } catch {
      toast.error("Cancel failed ❌");
    }
  };

  // ── Derived values for live UI feedback ──────────────────
  const selectedRes   = resources.find((r) => r.id === Number(form.resourceId));
  const capacityPct   = selectedRes ? Math.min((form.attendees / selectedRes.capacity) * 100, 100) : 0;
  const capacityOver  = selectedRes ? form.attendees > selectedRes.capacity : false;
  const capacityColor = capacityOver ? "#ef4444" : capacityPct > 80 ? "#f59e0b" : "#16a34a";

  const startMins       = toMinutes(form.startTime);
  const endMins         = toMinutes(form.endTime);
  const startOutOfHours = form.startTime !== "" && (startMins < OPEN_HOUR * 60 || startMins >= CLOSE_HOUR * 60);
  const endOutOfHours   = form.endTime   !== "" && (endMins > CLOSE_HOUR * 60 || endMins <= OPEN_HOUR * 60);
  const pastDate        = form.date !== "" && form.date < todayStr;

  // ── JSX ───────────────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Bookings</h1>
          <p style={styles.pageSubtitle}>
            {isAdmin ? "Manage all campus bookings" : "Your booking history"}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={styles.createBtn}>
          + Create Booking
        </button>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div style={styles.adminDashboard}>
          {[
            { label: "Total",     value: safeBookings.length,                                              color: "#3b82f6", icon: "📋" },
            { label: "Pending",   value: safeBookings.filter((b) => b.status === "PENDING").length,   color: "#f59e0b", icon: "⏳" },
            { label: "Approved",  value: safeBookings.filter((b) => b.status === "APPROVED").length,  color: "#16a34a", icon: "✅" },
            { label: "Rejected",  value: safeBookings.filter((b) => b.status === "REJECTED").length,  color: "#ef4444", icon: "❌" },
            { label: "Cancelled", value: safeBookings.filter((b) => b.status === "CANCELLED").length, color: "#6b7280", icon: "🚫" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statBox, borderTop: `4px solid ${s.color}` }}>
              <span style={styles.statIcon}>{s.icon}</span>
              <h2 style={{ ...styles.statValue, color: s.color }}>{s.value}</h2>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            placeholder="Search by resource name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">✅ Approved</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="CANCELLED">🚫 Cancelled</option>
          {isAdmin && <option value="REJECTED">❌ Rejected</option>}
        </select>
        {(search || statusFilter !== "ALL") && (
          <button style={styles.clearBtn} onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>✕ Clear</button>
        )}
        <span style={styles.resultCount}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Booking cards */}
      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: "2rem" }}>📭</p>
          <p style={{ color: "#6b7280", marginTop: 8 }}>No bookings found</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((b) => {
            const status = b.status?.toUpperCase();
            return (
              <div key={b.id} style={{ ...styles.card, borderTop: `3px solid ${getColor(status)}` }}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.resourceName}>{b.resource?.name}</h3>
                  <span style={{ ...styles.badge, background: getColor(status) + "20", color: getColor(status), border: `1px solid ${getColor(status)}40` }}>
                    {status}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.cardMeta}>📅 {b.date}</p>
                  <p style={styles.cardMeta}>⏰ {formatTime(b.startTime)} – {formatTime(b.endTime)}</p>
                  <p style={styles.cardMeta}>👥 {b.attendees} attendee{b.attendees !== 1 ? "s" : ""}</p>
                  {b.purpose && <p style={styles.cardPurpose}>{b.purpose}</p>}
                  {isAdmin && b.user && <p style={styles.cardMeta}>👤 {b.user.name || b.user.email}</p>}
                  {b.rejectionReason   && <p style={styles.reasonText}>⚠️ {b.rejectionReason}</p>}
                  {b.cancellationReason && <p style={styles.reasonText}>🚫 {b.cancellationReason}</p>}
                </div>
                <div style={styles.adminBtns}>
                  {isAdmin ? (
                    <>
                      {status === "PENDING" && (
                        <>
                          <button onClick={() => approveBooking(b.id)} style={styles.approveBtn}>✅ Approve</button>
                          <button onClick={() => rejectBooking(b.id)} style={styles.rejectBtn}>❌ Reject</button>
                        </>
                      )}
                      {(status === "APPROVED" || status === "PENDING") && (
                        <button onClick={() => openAdminCancelModal(b.id)} style={styles.cancelBtnSmall}>🚫 Cancel</button>
                      )}
                    </>
                  ) : (
                    status === "PENDING" && (
                      <button onClick={() => cancelBooking(b.id)} style={styles.cancelBtnSmall}>Cancel Booking</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Booking Modal ── */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📅 New Booking</h2>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>

            {/* Operating hours banner */}
            <div style={styles.hoursNotice}>
              🕐 Resources available <strong>8:00 AM – 8:00 PM</strong> only. Outside this window bookings are not accepted.
            </div>

            {/* Resource */}
            <div>
              <label style={styles.inputLabel}>Resource</label>
              <select
                style={styles.select}
                value={form.resourceId}
                onChange={(e) => setForm({ ...form, resourceId: Number(e.target.value) || "" })}
              >
                <option value="">Select a resource...</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — Capacity: {r.capacity}</option>
                ))}
              </select>
            </div>

            {/* Capacity bar — only when resource picked */}
            {selectedRes && (
              <div style={styles.capacityWrap}>
                <div style={styles.capacityRow}>
                  <span style={styles.capacityLabel}>
                    Capacity: <strong style={{ color: capacityColor }}>{form.attendees}</strong> / {selectedRes.capacity}
                  </span>
                  {capacityOver && <span style={styles.capacityOver}>⚠️ Exceeds limit!</span>}
                </div>
                <div style={styles.capacityTrack}>
                  <div style={{ ...styles.capacityFill, width: `${capacityPct}%`, background: capacityColor }} />
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label style={styles.inputLabel}>Date</label>
              <input
                type="date"
                style={{ ...styles.input, borderColor: pastDate ? "#ef4444" : "#d1d5db" }}
                value={form.date}
                min={todayStr}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {pastDate && <p style={styles.fieldError}>⚠️ Cannot book for a past date</p>}
            </div>

            {/* Times */}
            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.inputLabel}>
                  Start Time <span style={styles.timeHint}>(08:00 – 20:00)</span>
                </label>
                <input
                  type="time"
                  style={{ ...styles.input, borderColor: startOutOfHours ? "#ef4444" : "#d1d5db" }}
                  min="08:00" max="20:00"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
                {startOutOfHours && <p style={styles.fieldError}>⚠️ Must be 8 AM – 8 PM</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.inputLabel}>
                  End Time <span style={styles.timeHint}>(08:00 – 20:00)</span>
                </label>
                <input
                  type="time"
                  style={{ ...styles.input, borderColor: endOutOfHours ? "#ef4444" : "#d1d5db" }}
                  min="08:00" max="20:00"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
                {endOutOfHours && <p style={styles.fieldError}>⚠️ Must be 8 AM – 8 PM</p>}
              </div>
            </div>

            {/* Attendees */}
            <div>
              <label style={styles.inputLabel}>
                Attendees
                {selectedRes && <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>(max {selectedRes.capacity})</span>}
              </label>
              <input
                type="number"
                placeholder="Number of attendees"
                style={{ ...styles.input, borderColor: capacityOver ? "#ef4444" : "#d1d5db" }}
                min={1}
                max={selectedRes?.capacity}
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: parseInt(e.target.value) || 1 })}
              />
              {capacityOver && <p style={styles.fieldError}>⚠️ Exceeds resource capacity of {selectedRes.capacity}</p>}
            </div>

            {/* Purpose */}
            <div>
              <label style={styles.inputLabel}>Purpose</label>
              <textarea
                placeholder="Purpose of booking..."
                style={{ ...styles.input, borderRadius: 12, minHeight: 80, resize: "vertical" }}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>

            {/* Buttons */}
            <div style={styles.buttonRow}>
              <button onClick={handleSubmit} style={styles.bookBtn}>📅 Book Now</button>
              <button onClick={() => setShowForm(false)} style={styles.backBtn}>← Back</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Admin Cancel Reason Modal ── */}
      {cancelModal.open && (
        <div style={styles.modal}>
          <div style={styles.cancelModalBox}>
            <div style={styles.cancelIconWrap}>
              <span style={{ fontSize: "2rem" }}>🚫</span>
            </div>
            <h2 style={styles.cancelModalTitle}>Cancel Booking</h2>
            <p style={styles.cancelModalSubtitle}>
              Please provide a reason for cancellation. This will be visible to the user.
            </p>
            <textarea
              placeholder="e.g. Facility under emergency maintenance..."
              style={styles.cancelReasonInput}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              maxLength={300}
            />
            <div style={styles.charCount}>{cancelReason.length}/300</div>
            <div style={styles.cancelModalBtns}>
              <button
                style={{
                  ...styles.cancelModalConfirm,
                  opacity: cancelReason.trim() ? 1 : 0.5,
                  cursor: cancelReason.trim() ? "pointer" : "not-allowed",
                }}
                onClick={confirmAdminCancel}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </button>
              <button style={styles.cancelModalDismiss} onClick={() => setCancelModal({ open: false, bookingId: null })}>
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Color helper ──────────────────────────────────────────────
const getColor = (s) => {
  if (s === "APPROVED")  return "#16a34a";
  if (s === "PENDING")   return "#f59e0b";
  if (s === "REJECTED")  return "#ef4444";
  if (s === "CANCELLED") return "#6b7280";
  return "#9ca3af";
};

// ── Styles ────────────────────────────────────────────────────
const styles = {
  page: { padding: 24, display: "flex", flexDirection: "column", gap: 20 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  pageTitle: { fontSize: "1.6rem", fontWeight: 700, color: "#111827", margin: 0 },
  pageSubtitle: { fontSize: "0.85rem", color: "#6b7280", marginTop: 4 },

  createBtn: {
    background: "#16a34a", color: "#fff",
    padding: "10px 20px", borderRadius: 12,
    border: "none", cursor: "pointer", fontWeight: 600,
    fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
  },

  adminDashboard: { display: "flex", gap: 14 },
  statBox: {
    flex: 1, padding: "16px 20px", borderRadius: 14,
    background: "#fff", border: "1px solid #E5E7EB",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  statIcon: { fontSize: "1.2rem" },
  statValue: { fontSize: "1.8rem", fontWeight: 800, margin: 0, lineHeight: 1 },
  statLabel: { fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },

  filters: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  searchWrapper: { position: "relative", flex: 1, minWidth: 200 },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem" },
  searchInput: {
    width: "100%", padding: "11px 16px 11px 38px",
    borderRadius: 999, border: "1px solid #d1d5db",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box", background: "#f9fafb",
  },
  filterSelect: { padding: "11px 16px", borderRadius: 999, border: "1px solid #d1d5db", fontSize: "0.875rem", background: "#f9fafb", cursor: "pointer", outline: "none" },
  clearBtn: { padding: "10px 16px", borderRadius: 999, border: "1px solid #fca5a5", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  resultCount: { fontSize: "0.8rem", color: "#9ca3af", whiteSpace: "nowrap" },

  emptyState: { textAlign: "center", padding: "60px 0", background: "#f9fafb", borderRadius: 14, border: "2px dashed #e5e7eb" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 },
  card: { padding: 18, borderRadius: 14, background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 10, border: "1px solid #f3f4f6" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  resourceName: { fontSize: "0.95rem", fontWeight: 700, color: "#111827", margin: 0, flex: 1 },
  badge: { padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" },
  cardBody: { display: "flex", flexDirection: "column", gap: 4 },
  cardMeta: { fontSize: "0.8rem", color: "#4b5563", margin: 0 },
  cardPurpose: { fontSize: "0.78rem", color: "#9ca3af", fontStyle: "italic", margin: 0 },
  reasonText: { fontSize: "0.75rem", color: "#ef4444", background: "#fef2f2", padding: "4px 8px", borderRadius: 6, margin: 0 },

  adminBtns: { display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" },
  approveBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 },
  rejectBtn:  { background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 },
  cancelBtnSmall: { background: "#6b7280", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 },

  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalBox: { width: 620, background: "#fff", padding: 36, borderRadius: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#111827", margin: 0 },
  modalClose: { background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem" },

  hoursNotice: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#1d4ed8" },

  inputLabel: { fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 },
  timeHint: { fontWeight: 400, color: "#9ca3af", fontSize: "0.72rem" },
  input: { padding: 13, borderRadius: 999, border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem", outline: "none" },
  select: { padding: 13, borderRadius: 999, border: "1px solid #d1d5db", width: "100%", fontSize: "0.9rem", background: "#fff", outline: "none" },
  row: { display: "flex", gap: 12 },
  fieldError: { fontSize: "0.72rem", color: "#ef4444", margin: "4px 0 0 12px" },

  capacityWrap: { display: "flex", flexDirection: "column", gap: 6 },
  capacityRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  capacityLabel: { fontSize: "0.78rem", color: "#6b7280" },
  capacityOver: { fontSize: "0.78rem", color: "#ef4444", fontWeight: 700 },
  capacityTrack: { height: 6, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" },
  capacityFill: { height: "100%", borderRadius: 999, transition: "width 0.3s, background 0.3s" },

  buttonRow: { display: "flex", justifyContent: "center", gap: 16, marginTop: 4 },
  bookBtn: { background: "#16a34a", color: "#fff", padding: "12px 32px", borderRadius: 999, border: "none", width: 160, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" },
  backBtn: { background: "#fff", color: "#374151", padding: "12px 32px", borderRadius: 999, border: "1.5px solid #d1d5db", width: 160, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },

  cancelModalBox: { width: 460, background: "#fff", borderRadius: 20, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, boxShadow: "0 25px 60px rgba(0,0,0,0.25)" },
  cancelIconWrap: { width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center" },
  cancelModalTitle: { fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: 0 },
  cancelModalSubtitle: { fontSize: "0.85rem", color: "#6b7280", textAlign: "center", margin: 0 },
  cancelReasonInput: { width: "100%", boxSizing: "border-box", padding: 14, borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: "0.875rem", resize: "vertical", outline: "none", fontFamily: "inherit", background: "#f9fafb", lineHeight: 1.6 },
  charCount: { alignSelf: "flex-end", fontSize: "0.72rem", color: "#9ca3af", marginTop: -8 },
  cancelModalBtns: { display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 },
  cancelModalConfirm: { background: "#ef4444", color: "#fff", border: "none", padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", width: "100%" },
  cancelModalDismiss: { background: "#f3f4f6", color: "#374151", border: "none", padding: "13px 0", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", width: "100%" },
};
>>>>>>> 373f9c85a23d5bcf0b20c280459dfb3845b8a035

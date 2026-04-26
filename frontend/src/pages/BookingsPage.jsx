import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } });
            setResources(Array.isArray(res.data) ? res.data : []);
        } catch { showToast("Failed to load resources", "error"); }
    };

    const fetchBookings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } });
            const data = Array.isArray(res.data) ? res.data : [];
            const userFiltered = isAdmin ? data : data.filter(b => String(b.user?.id) === String(user?.id));
            const reversed = [...userFiltered].reverse();
            setBookings(reversed);
        } catch { showToast("Failed to load bookings", "error"); }
    };

    const filtered = useMemo(() => {
        let data = bookings;
        if (search.trim()) data = data.filter(b => (b.resource?.name || "").toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== "ALL") data = data.filter(b => b.status?.toUpperCase() === statusFilter);
        return data;
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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings`, {
                resource: { id: Number(form.resourceId) }, user: { id: user?.id },
                date: form.date, startTime: form.startTime, endTime: form.endTime,
                purpose: form.purpose, attendees: form.attendees,
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking created successfully");
            setShowForm(false);
            fetchBookings();
        } catch (err) { showToast(err.response?.data?.message || "Failed to create booking", "error"); }
    };

    const handleApprove = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking approved");
            fetchBookings();
        } catch { showToast("Approval failed", "error"); }
    };

    const handleReject = async (reason) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bookings/${rejectModal.bookingId}/reject?reason=${encodeURIComponent(reason)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking rejected", "warning");
            setRejectModal({ open: false, bookingId: null });
            fetchBookings();
        } catch { showToast("Reject failed", "error"); }
    };

    const handleCancel = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Booking cancelled", "warning");
            fetchBookings();
        } catch { showToast("Cancel failed", "error"); }
    };

    const handleAdminCancel = async (reason) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/bookings/${cancelModal.bookingId}/cancel?reason=${encodeURIComponent(reason)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
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

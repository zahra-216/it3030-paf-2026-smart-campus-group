import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
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
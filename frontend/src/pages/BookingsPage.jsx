import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function BookingsPage() {
  const { user, token } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ── Admin cancel modal state ──────────────────────────────
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

  const isTimeConflict = () => {
    const selected = resources.find((r) => r.id === form.resourceId);
    if (!selected) return false;

    return safeBookings.some((b) => {
      if (b.resource?.id !== form.resourceId) return false;
      if (b.date !== form.date) return false;
      if (["CANCELLED", "REJECTED"].includes(b.status?.toUpperCase())) return false;
      return form.startTime < b.endTime && form.endTime > b.startTime;
    });
  };

  // ── Actions ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.resourceId) {
      toast.error("Please select a resource ❌");
      return;
    }

    const selectedResource = resources.find((r) => r.id === form.resourceId);

    if (form.attendees > selectedResource?.capacity) {
      toast.error(`Attendees exceed capacity (${selectedResource.capacity}) ❌`);
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time ❌");
      return;
    }

    if (isTimeConflict()) {
      toast.error("Resource already booked for this time slot ❌");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8081/api/bookings",
        { resource: { id: form.resourceId }, user: { id: user?.id }, ...form },
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
      await axios.put(
        `http://localhost:8081/api/bookings/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      await axios.put(
        `http://localhost:8081/api/bookings/${id}/reject?reason=${encodeURIComponent(reason)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.warn("Booking rejected ⚠️");
      fetchBookings();
    } catch {
      toast.error("Reject failed ❌");
    }
  };

  // User cancel — no reason needed
  const cancelBooking = async (id) => {
    try {
      await axios.put(
        `http://localhost:8081/api/bookings/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.warn("Booking cancelled ⚠️");
      fetchBookings();
    } catch {
      toast.error("Cancel failed ❌");
    }
  };

  // Admin cancel — opens modal
  const openAdminCancelModal = (id) => {
    setCancelReason("");
    setCancelModal({ open: true, bookingId: id });
  };

  const confirmAdminCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason ❌");
      return;
    }
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

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
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

      {/* ── Admin Stats ── */}
      {isAdmin && (
        <div style={styles.adminDashboard}>
          {[
            { label: "Total", value: safeBookings.length, color: "#3b82f6", icon: "📋" },
            { label: "Pending", value: safeBookings.filter((b) => b.status === "PENDING").length, color: "#f59e0b", icon: "⏳" },
            { label: "Approved", value: safeBookings.filter((b) => b.status === "APPROVED").length, color: "#16a34a", icon: "✅" },
            { label: "Rejected", value: safeBookings.filter((b) => b.status === "REJECTED").length, color: "#ef4444", icon: "❌" },
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

      {/* ── Filters ── */}
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">✅ Approved</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="CANCELLED">🚫 Cancelled</option>
          {isAdmin && <option value="REJECTED">❌ Rejected</option>}
        </select>
        {(search || statusFilter !== "ALL") && (
          <button
            style={styles.clearBtn}
            onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
          >
            ✕ Clear
          </button>
        )}
        <span style={styles.resultCount}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Booking Cards ── */}
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
                  {isAdmin && b.user && (
                    <p style={styles.cardMeta}>👤 {b.user.name || b.user.email}</p>
                  )}
                  {b.rejectionReason && (
                    <p style={styles.reasonText}>⚠️ Reason: {b.rejectionReason}</p>
                  )}
                  {b.cancellationReason && (
                    <p style={styles.reasonText}>🚫 Reason: {b.cancellationReason}</p>
                  )}
                </div>

                {/* ── Action Buttons ── */}
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

            <select
              style={styles.select}
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
            >
              <option value="">Select Resource</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Capacity: {r.capacity})
                </option>
              ))}
            </select>

            <input
              type="date"
              style={styles.input}
              value={form.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                <label style={styles.inputLabel}>Start Time</label>
                <input
                  type="time"
                  style={styles.input}
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.inputLabel}>End Time</label>
                <input
                  type="time"
                  style={styles.input}
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>

            <input
              type="number"
              placeholder="Number of Attendees"
              style={styles.input}
              min={1}
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: parseInt(e.target.value) || 1 })}
            />

            <textarea
              placeholder="Purpose of booking..."
              style={{ ...styles.input, borderRadius: 12, minHeight: 80, resize: "vertical" }}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />

            <div style={styles.buttonRow}>
              <button onClick={handleSubmit} style={styles.bookBtn}>Book Now</button>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Cancel Reason Modal ── */}
      {cancelModal.open && (
        <div style={styles.modal}>
          <div style={styles.cancelModalBox}>
            {/* Icon */}
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
                style={styles.cancelModalConfirm}
                onClick={confirmAdminCancel}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </button>
              <button
                style={styles.cancelModalDismiss}
                onClick={() => setCancelModal({ open: false, bookingId: null })}
              >
                Go Back
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
  if (s === "APPROVED") return "#16a34a";
  if (s === "PENDING") return "#f59e0b";
  if (s === "REJECTED") return "#ef4444";
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
    transition: "all 0.2s",
  },

  // Admin stats
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

  // Filters
  filters: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  searchWrapper: { position: "relative", flex: 1, minWidth: 200 },
  searchIcon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem" },
  searchInput: {
    width: "100%", padding: "11px 16px 11px 38px",
    borderRadius: 999, border: "1px solid #d1d5db",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
    background: "#f9fafb",
  },
  filterSelect: {
    padding: "11px 16px", borderRadius: 999,
    border: "1px solid #d1d5db", fontSize: "0.875rem",
    background: "#f9fafb", cursor: "pointer", outline: "none",
  },
  clearBtn: {
    padding: "10px 16px", borderRadius: 999,
    border: "1px solid #fca5a5", background: "#fef2f2",
    color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
  },
  resultCount: { fontSize: "0.8rem", color: "#9ca3af", whiteSpace: "nowrap" },

  // Empty state
  emptyState: {
    textAlign: "center", padding: "60px 0",
    background: "#f9fafb", borderRadius: 14,
    border: "2px dashed #e5e7eb",
  },

  // Cards
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 },
  card: {
    padding: 18, borderRadius: 14, background: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
    display: "flex", flexDirection: "column", gap: 10,
    border: "1px solid #f3f4f6",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  resourceName: { fontSize: "0.95rem", fontWeight: 700, color: "#111827", margin: 0, flex: 1 },
  badge: {
    padding: "3px 10px", borderRadius: 999,
    fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
  },
  cardBody: { display: "flex", flexDirection: "column", gap: 4 },
  cardMeta: { fontSize: "0.8rem", color: "#4b5563", margin: 0 },
  cardPurpose: { fontSize: "0.78rem", color: "#9ca3af", fontStyle: "italic", margin: 0 },
  reasonText: { fontSize: "0.75rem", color: "#ef4444", background: "#fef2f2", padding: "4px 8px", borderRadius: 6, margin: 0 },

  adminBtns: { display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" },
  approveBtn: {
    background: "#16a34a", color: "#fff", border: "none",
    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
    fontSize: "0.78rem", fontWeight: 600,
  },
  rejectBtn: {
    background: "#ef4444", color: "#fff", border: "none",
    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
    fontSize: "0.78rem", fontWeight: 600,
  },
  cancelBtnSmall: {
    background: "#6b7280", color: "#fff", border: "none",
    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
    fontSize: "0.78rem", fontWeight: 600,
  },

  // Create booking modal
  modal: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modalBox: {
    width: 680, background: "#fff", padding: 36,
    borderRadius: 20, display: "flex", flexDirection: "column", gap: 16,
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: "1.2rem", fontWeight: 700, color: "#111827", margin: 0 },
  modalClose: {
    background: "#f3f4f6", border: "none", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer", fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  inputLabel: { fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 },
  input: { padding: 13, borderRadius: 999, border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem", outline: "none" },
  select: { padding: 13, borderRadius: 999, border: "1px solid #d1d5db", width: "100%", fontSize: "0.9rem", background: "#fff", outline: "none" },
  row: { display: "flex", gap: 12 },
  buttonRow: { display: "flex", justifyContent: "center", gap: 16, marginTop: 4 },
  bookBtn: {
    background: "#16a34a", color: "#fff", padding: "12px 32px",
    borderRadius: 999, border: "none", width: 160, cursor: "pointer",
    fontWeight: 700, fontSize: "0.9rem",
  },
  cancelBtn: {
    background: "#ef4444", color: "#fff", padding: "12px 32px",
    borderRadius: 999, border: "none", width: 160, cursor: "pointer",
    fontWeight: 700, fontSize: "0.9rem",
  },

  // Admin cancel reason modal
  cancelModalBox: {
    width: 460, background: "#fff", borderRadius: 20, padding: 36,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  cancelIconWrap: {
    width: 64, height: 64, borderRadius: "50%",
    background: "#fef2f2", border: "2px solid #fca5a5",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cancelModalTitle: { fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: 0 },
  cancelModalSubtitle: { fontSize: "0.85rem", color: "#6b7280", textAlign: "center", margin: 0 },
  cancelReasonInput: {
    width: "100%", boxSizing: "border-box",
    padding: 14, borderRadius: 12,
    border: "1.5px solid #e5e7eb", fontSize: "0.875rem",
    resize: "vertical", outline: "none", fontFamily: "inherit",
    background: "#f9fafb", lineHeight: 1.6,
  },
  charCount: { alignSelf: "flex-end", fontSize: "0.72rem", color: "#9ca3af", marginTop: -8 },
  cancelModalBtns: { display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 },
  cancelModalConfirm: {
    background: "#ef4444", color: "#fff", border: "none",
    padding: "13px 0", borderRadius: 12, cursor: "pointer",
    fontWeight: 700, fontSize: "0.95rem", width: "100%",
    opacity: 1, transition: "opacity 0.2s",
  },
  cancelModalDismiss: {
    background: "#f3f4f6", color: "#374151", border: "none",
    padding: "13px 0", borderRadius: 12, cursor: "pointer",
    fontWeight: 600, fontSize: "0.9rem", width: "100%",
  },
};
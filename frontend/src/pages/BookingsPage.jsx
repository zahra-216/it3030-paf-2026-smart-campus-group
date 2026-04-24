import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function BookingsPage() {

  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    resourceId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1
  });

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, [user]);

  const fetchResources = async () => {
    const res = await axios.get("http://localhost:8081/api/resources");
    setResources(res.data);
  };

  const fetchBookings = async () => {
    const url =
      user?.role?.toUpperCase() === "ADMIN"
        ? "http://localhost:8081/api/bookings"
        : "http://localhost:8081/api/bookings/user/1";

    const res = await axios.get(url);
    const data = res.data.reverse();
    setBookings(data);
    setFiltered(data);
  };

  useEffect(() => {
    let data = [...bookings];

    if (search.trim()) {
      data = data.filter(b =>
        (b.resource?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter(b => b.status === statusFilter);
    }

    setFiltered(data);
  }, [search, statusFilter, bookings]);

  const formatTime = (t) => {
    const [h, m] = t.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  // ✅ FIXED FUNCTION
  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:8081/api/bookings", {
        resource: { id: form.resourceId },
        user: { id: 1 },
        ...form
      });

      toast.success("Booking created successfully 🎉");

      setShowForm(false);
      fetchBookings();

    } catch (err) {
      toast.error(err.response?.data || "Failed to create booking ❌");
    }
  };

  const approveBooking = async (id) => {
    try {
      await axios.put(`http://localhost:8081/api/bookings/${id}/approve`);
      toast.success("Booking approved ✅");
      fetchBookings();
    } catch {
      toast.error("Approval failed ❌");
    }
  };

  const rejectBooking = async (id) => {
    const reason = prompt("Enter rejection reason");
    if (!reason) return;

    try {
      await axios.put(
        `http://localhost:8081/api/bookings/${id}/reject?reason=${reason}`
      );
      toast.warn("Booking rejected ⚠️");
      fetchBookings();
    } catch {
      toast.error("Reject failed ❌");
    }
  };

  const cancelBooking = async (id) => {
    try {
      await axios.put(`http://localhost:8081/api/bookings/${id}/cancel`);
      toast.info("Booking cancelled 🛑");
      fetchBookings();
    } catch {
      toast.error("Cancel failed ❌");
    }
  };

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <h1>Bookings</h1>
        <button onClick={() => setShowForm(true)} style={styles.createBtn}>
          + Create Booking
        </button>
      </div>

      {isAdmin && (
        <div style={styles.adminDashboard}>
          <div style={{ ...styles.statBox, background: "#3b82f6" }}>
            <span>Total</span>
            <h2>{bookings.length}</h2>
          </div>

          <div style={{ ...styles.statBox, background: "#f59e0b" }}>
            <span>Pending</span>
            <h2>{bookings.filter(b => b.status === "PENDING").length}</h2>
          </div>

          <div style={{ ...styles.statBox, background: "#16a34a" }}>
            <span>Approved</span>
            <h2>{bookings.filter(b => b.status === "APPROVED").length}</h2>
          </div>

          <div style={{ ...styles.statBox, background: "#ef4444" }}>
            <span>Rejected</span>
            <h2>{bookings.filter(b => b.status === "REJECTED").length}</h2>
          </div>
        </div>
      )}

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="Search by resource..."
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.filterSelect}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
          <option>CANCELLED</option>
        </select>
      </div>

      <div style={styles.grid}>
        {filtered.map(b => {
          const status = b.status?.toUpperCase();

          return (
            <div key={b.id} style={styles.card}>
              <h3>{b.resource?.name}</h3>
              <p>📅 {b.date}</p>
              <p>⏰ {formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
              <p>👥 {b.attendees}</p>
              <p>{b.purpose}</p>

              <span style={{ ...styles.badge, background: getColor(status) }}>
                {status}
              </span>

              {status === "REJECTED" && (
                <p style={styles.rejectText}>
                  Reason: {b.rejectionReason}
                </p>
              )}

              {!isAdmin && (status === "APPROVED" || status === "PENDING") && (
                <button
                  style={styles.cancelBtnSmall}
                  onClick={() => cancelBooking(b.id)}
                >
                  Cancel
                </button>
              )}

              {isAdmin && status === "PENDING" && (
                <div style={styles.adminBtns}>
                  <button style={styles.approveBtn}
                    onClick={() => approveBooking(b.id)}>
                    Approve
                  </button>

                  <button style={styles.rejectBtn}
                    onClick={() => rejectBooking(b.id)}>
                    Reject
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <button onClick={() => setShowForm(false)}>
              ← Back
            </button>

            <h2>Create Booking</h2>

            <select style={styles.select}
              onChange={(e) => setForm({ ...form, resourceId: Number(e.target.value) })}>
              <option>Select Resource</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <input style={styles.input} type="date"
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <div style={styles.row}>
              <input style={styles.input} type="time"
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
              <input style={styles.input} type="time"
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>

            <input style={styles.input} placeholder="Purpose"
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />

            <input type="number" min="1" style={styles.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            />

            <div style={styles.buttonRow}>
              <button onClick={handleSubmit} style={styles.bookBtn}>
                Book Now
              </button>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const getColor = (s) => {
  if (s === "APPROVED") return "#16a34a";
  if (s === "PENDING") return "#f59e0b";
  if (s === "REJECTED") return "#ef4444";
  if (s === "CANCELLED") return "#6b7280";
};

/* STYLES */
const styles = {
  page: { padding: 20 },

  header: { display: "flex", justifyContent: "space-between", marginBottom: 25 },

  createBtn: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600
  },

  /* 🔥 ADMIN DASHBOARD */
  adminDashboard: {
    display: "flex",
    gap: 20,
    marginBottom: 25
  },

  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    color: "#fff",
    textAlign: "center",
    fontWeight: 600,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
  },

  filters: { display: "flex", gap: 12, marginBottom: 25 },

  searchInput: {
    width: "320px",
    padding: "12px 16px",
    borderRadius: 999,
    border: "1px solid #d1d5db"
  },

  filterSelect: {
    width: "160px",
    padding: "12px",
    borderRadius: 999,
    border: "1px solid #d1d5db"
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 },

  card: {
    padding: 16,
    borderRadius: 14,
    background: "#fff",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
  },

  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 12
  },

  rejectText: {
    color: "red",
    fontSize: 12,
    marginTop: 5
  },

  adminBtns: {
    display: "flex",
    gap: 10,
    marginTop: 10
  },

  approveBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer"
  },

  rejectBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer"
  },

  cancelBtnSmall: {
    marginTop: 10,
    marginLeft: 8,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer"
  },

  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  modalBox: {
    width: "750px",
    background: "#fff",
    padding: 40,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20
  },

  input: {
    padding: 14,
    borderRadius: 999,
    border: "1px solid #ccc"
  },

  select: {
    padding: 14,
    borderRadius: 999,
    border: "1px solid #ccc"
  },

  row: { display: "flex", gap: 10 },

  attendees: {
    padding: 14,
    borderRadius: 999,
    border: "1px solid #16a34a"
  },

  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: 20
  },

  bookBtn: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    width: 150
  },

  cancelBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 999,
    border: "none",
    width: 150
  }

};
import { useState, useEffect } from "react";
import axios from "axios";

export default function BookingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [resources, setResources] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  const [form, setForm] = useState({
    resourceId: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    attendees: 1,
  });

  // ✅ LOAD RESOURCES
  useEffect(() => {
    axios.get("http://localhost:8081/api/resources")
      .then(res => {
        setResources(res.data);
      })
      .catch(() => console.log("Failed to load resources"));
  }, []);

  // ✅ CHECK AVAILABILITY
  const checkAvailability = async () => {
    if (!form.resourceId || !form.date || !form.startTime || !form.endTime) return;

    try {
      const res = await axios.post("http://localhost:8081/api/bookings/check", {
        resource: { id: form.resourceId },
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      });

      setStatusMsg(res.data);
    } catch {
      setStatusMsg("Error checking availability");
    }
  };

  // ✅ CREATE BOOKING
  const handleSubmit = async () => {
    if (form.attendees <= 0) {
      alert("Attendees must be greater than 0");
      return;
    }

    try {
      await axios.post("http://localhost:8081/api/bookings", {
        resource: { id: form.resourceId },
        user: { id: 1 }, // TODO: replace with logged user
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        attendees: form.attendees,
      });

      alert("Booking created successfully");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create booking");
    }
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Bookings</h1>
        <button style={styles.createBtn} onClick={() => setShowForm(true)}>
          + Create Booking
        </button>
      </div>

      {/* EMPTY */}
      <div style={styles.empty}>No bookings yet</div>

      {/* MODAL */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            {/* BACK BUTTON */}
            <button style={styles.backBtn} onClick={() => setShowForm(false)}>
              ← Back
            </button>

            <h2 style={styles.formTitle}>Create Booking</h2>

            {/* RESOURCE */}
            <select
              style={styles.input}
              value={form.resourceId}
              onChange={(e) =>
                setForm({ ...form, resourceId: Number(e.target.value) })
              }
            >
              <option value="">Select Resource</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>

            {/* DATE */}
            <input
              type="date"
              style={styles.input}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            {/* TIME */}
            <div style={styles.row}>
              <input
                type="time"
                style={styles.input}
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <input
                type="time"
                style={styles.input}
                value={form.endTime}
                onChange={(e) =>
                  setForm({ ...form, endTime: e.target.value })
                }
              />
            </div>

            {/* PURPOSE */}
            <input
              placeholder="Purpose"
              style={styles.input}
              value={form.purpose}
              onChange={(e) =>
                setForm({ ...form, purpose: e.target.value })
              }
            />

            {/* ATTENDEES */}
            <input
              type="number"
              min="1"
              style={styles.input}
              value={form.attendees}
              onChange={(e) =>
                setForm({
                  ...form,
                  attendees: Math.max(1, Number(e.target.value))
                })
              }
            />

            {/* CHECK */}
            <button style={styles.checkBtn} onClick={checkAvailability}>
              Check Availability
            </button>

            {/* STATUS */}
            {statusMsg && (
              <p style={{
                color: statusMsg.includes("ACTIVE") ? "green" : "red",
                marginTop: 5
              }}>
                {statusMsg}
              </p>
            )}

            {/* BUTTONS */}
            <div style={styles.buttonRow}>
              <button style={styles.bookBtn} onClick={handleSubmit}>
                Book Now
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 20 },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
  },

  createBtn: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#6b7280",
  },

  modal: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalBox: {
    width: "500px",
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  formTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },

  row: {
    display: "flex",
    gap: "10px",
  },

  checkBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },

  bookBtn: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelBtn: {
    background: "#ef4444",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

  backBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#374151",
    fontWeight: "600",
    marginBottom: "5px",
  }
};
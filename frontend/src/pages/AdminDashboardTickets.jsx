import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/ui/Badge"; // ← import your Badge component

const BASE_URL = "http://localhost:8081/api";

async function apiFetch(path, options = {}) {
  const { headers = {}, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── Colors synced exactly with Badge.jsx ──────────────────────────────────
const STATUS_CFG = {
  ALL:         { color: "#374151", light: "#F3F4F6", border: "#D1D5DB", label: "All",         dot: "#9CA3AF" },
  OPEN:        { color: "#1E40AF", light: "#DBEAFE", border: "#93C5FD", label: "Open",        dot: "#3B82F6" },
  IN_PROGRESS: { color: "#92400E", light: "#FEF3C7", border: "#FCD34D", label: "In Progress", dot: "#F59E0B" },
  RESOLVED:    { color: "#065F46", light: "#D1FAE5", border: "#6EE7B7", label: "Resolved",    dot: "#10B981" },
  CLOSED:      { color: "#374151", light: "#F3F4F6", border: "#D1D5DB", label: "Closed",      dot: "#9CA3AF" },
  REJECTED:    { color: "#991B1B", light: "#FEE2E2", border: "#FCA5A5", label: "Rejected",    dot: "#EF4444" },
};
const PRIORITY_CFG = {
  HIGH:   { color: "#991B1B", light: "#FEE2E2", bar: "#EF4444", label: "High",   icon: "🔴" },
  MEDIUM: { color: "#92400E", light: "#FEF3C7", bar: "#F59E0B", label: "Medium", icon: "🟡" },
  LOW:    { color: "#065F46", light: "#D1FAE5", bar: "#10B981", label: "Low",    icon: "🟢" },
};

const normStatus   = s => s ? String(s).toUpperCase().replace(/ /g, "_") : "OPEN";
const normPriority = p => p ? String(p).toUpperCase() : "LOW";
const fmtCategory  = c => c ? c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "";

const STATUS_TABS   = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const PRIORITY_TABS = ["ALL", "HIGH", "MEDIUM", "LOW"];

function relTime(raw) {
  if (!raw) return "";
  const d = new Date(raw), now = new Date(), ms = now - d;
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), dy = Math.floor(ms / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return String(raw).slice(0, 10);
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3400);
  }, []);
  return { toast, show };
}

function Avatar({ name, size = 26 }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "U";
  const palette  = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];
  const bg       = palette[(name || "U").charCodeAt(0) % palette.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 800, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const INP = { padding: "0.625rem 0.875rem", border: "1.5px solid #e8edf3", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-text)", background: "var(--color-white)", outline: "none", width: "100%", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" };
const SEL = { ...INP };
const TA  = { ...INP, resize: "vertical", minHeight: 80, lineHeight: 1.65 };

function Field({ label: lbl, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</label>
      {children}
      {hint && <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{hint}</span>}
    </div>
  );
}

function PrimaryBtn({ onClick, loading, disabled, children, style: s = {} }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ flex: 1, padding: "0.72rem", background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, color: "#fff", cursor: (loading || disabled) ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: (loading || disabled) ? 0.7 : 1, boxShadow: "0 4px 14px rgba(59,130,246,0.3)", ...s }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, danger = false }) {
  return (
    <button onClick={onClick}
      style={{ padding: "0.72rem 1.25rem", background: "transparent", border: `1.5px solid ${danger ? "#fecaca" : "#e8edf3"}`, borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, color: danger ? "#dc2626" : "#64748b", cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function Modal({ title, sub, onClose, children, wide = false, zIndex = 99 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex, padding: 20, backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: wide ? 740 : 580, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease" }}>
        <div style={{ padding: "1.375rem 1.625rem 1.125rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "#fff", zIndex: 2, borderRadius: "20px 20px 0 0" }}>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>{title}</div>
            {sub && <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e8edf3", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ padding: "1.375rem 1.625rem" }}>{children}</div>
      </div>
    </div>
  );
}

function SecLabel({ children }) {
  return <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 0 10px" }}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminDashboardTickets() {
  const { token, user: adminUser } = useAuth();

  const authHeaders = { Authorization: `Bearer ${token}` };

  const [resources, setResources] = useState([]);

  useEffect(() => {
      if (!token) return;
      fetch(`http://localhost:8081/api/resources`, {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  const api = {
    getAllTickets: () =>
      apiFetch("/tickets/filter", { headers: authHeaders }),

    getAllUsers: () =>
      apiFetch("/auth/users", { headers: authHeaders }),

    updateTicket: (id, body) =>
      apiFetch(`/tickets/${id}`, { method: "PUT", headers: authHeaders, body: JSON.stringify(body) }),

    deleteTicket: id =>
      apiFetch(`/tickets/${id}`, { method: "DELETE", headers: authHeaders }),

    changeStatus: (id, status) =>
      apiFetch(`/tickets/${id}/status?status=${status}`, { method: "PUT", headers: authHeaders }),

    changePriority: (id, priority, currentTicket) =>
      apiFetch(`/tickets/${id}`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({
          title: currentTicket.title,
          location: currentTicket.location,
          category: currentTicket.category,
          contactDetails: currentTicket.contactDetails,
          description: currentTicket.description,
          resourceId: currentTicket.resourceId,
          status: currentTicket.status,
          priority,
        }),
      }),

    assignTechnician: (ticketId, technicianId, adminId) =>
      apiFetch(`/tickets/${ticketId}/assign/${technicianId}/${adminId}`, { method: "PUT", headers: authHeaders }),

    rejectTicket: (ticketId, adminId, reason) =>
      apiFetch(`/tickets/${ticketId}/reject/${adminId}`, {
        method: "PUT", headers: authHeaders,
        body: JSON.stringify({ rejectionReason: reason }),
      }),

    resolveTicket: id =>
      apiFetch(`/tickets/${id}/status?status=RESOLVED`, { method: "PUT", headers: authHeaders }),

    closeTicket: id =>
      apiFetch(`/tickets/${id}/status?status=CLOSED`, { method: "PUT", headers: authHeaders }),

    getComments: tid =>
      apiFetch(`/tickets/${tid}/comments`, { headers: authHeaders }),

    addComment: (tid, uid, content) =>
      apiFetch(`/tickets/${tid}/comments/${uid}`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),

    deleteComment: (cid, userId) =>
      apiFetch(`/tickets/comments/${cid}/user/${userId}`, { method: "DELETE", headers: authHeaders }),

    getAttachments: tid =>
      apiFetch(`/tickets/${tid}/attachments`, { headers: authHeaders }),

    deleteAttachment: id =>
      apiFetch(`/tickets/attachments/${id}`, { method: "DELETE", headers: authHeaders }),
  };

  // ── state ──────────────────────────────────────────────────────────────────
  const [tickets,       setTickets]       = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [priFilter,     setPriFilter]     = useState("ALL");
  const [showDetail,    setShowDetail]    = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [showReject,    setShowReject]    = useState(false);
  const [showResolve,   setShowResolve]   = useState(false);
  const [showAssign,    setShowAssign]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [comments,      setComments]      = useState([]);
  const [attachments,   setAttachments]   = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText,   setCommentText]   = useState("");
  const [previewImage,  setPreviewImage]  = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const EMPTY_EDIT = { title: "", location: "", category: "ELECTRICAL", priority: "LOW", contactDetails: "", description: "", resourceId: "" };
  const [editForm,     setEditForm]     = useState(EMPTY_EDIT);
  const [rejectReason, setRejectReason] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  const { toast, show: showToast } = useToast();

  // ── load all tickets + users ───────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, uData] = await Promise.all([
        api.getAllTickets(),
        api.getAllUsers().catch(() => []),
      ]);
      setTickets(Array.isArray(tData) ? tData : []);
      setUsers(Array.isArray(uData) ? uData : []);
    } catch (e) {
      showToast("Failed to load tickets: " + e.message, true);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const countFor = st => st === "ALL" ? tickets.length : tickets.filter(t => normStatus(t.status) === st).length;

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (
      (!search ||
        String(t.id).includes(q) ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.location || "").toLowerCase().includes(q) ||
        (t.assignedToName || "").toLowerCase().includes(q) ||
        fmtCategory(t.category).toLowerCase().includes(q)) &&
      (statusFilter === "ALL" || normStatus(t.status) === statusFilter) &&
      (priFilter === "ALL" || normPriority(t.priority) === priFilter)
    );
  });

  const refreshSelected = async id => {
    try {
      const fresh = await api.getAllTickets();
      const list = Array.isArray(fresh) ? fresh : [];
      setTickets(list);
      const updated = list.find(t => t.id === id);
      if (updated) setSelected(updated);
    } catch { /* silent */ }
  };

  // ── open detail ────────────────────────────────────────────────────────────
  const openDetail = async t => {
    setSelected(t);
    setCommentText("");
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const [cmts, atts] = await Promise.all([
        api.getComments(t.id),
        api.getAttachments(t.id),
      ]);
      setComments(Array.isArray(cmts) ? cmts : []);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch (e) { showToast("Could not load details: " + e.message, true); }
    finally     { setDetailLoading(false); }
  };

  // ── edit ticket ────────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!selected) return;
    setEditForm({
      title: selected.title || "",
      location: selected.location || "",
      category: selected.category || "ELECTRICAL",
      priority: selected.priority || "LOW",
      contactDetails: selected.contactDetails || "",
      description: selected.description || "",
      resourceId: selected.resourceId ? String(selected.resourceId) : "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editForm.title || !editForm.location) {
      showToast("Title and Location are required.", true);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        title: editForm.title,
        location: editForm.location,
        category: editForm.category,
        priority: editForm.priority,
        contactDetails: editForm.contactDetails,
        description: editForm.description,
        resourceId: editForm.resourceId ? Number(editForm.resourceId) : null,
      };
      const updated = await api.updateTicket(selected.id, body);
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setShowEdit(false);
      showToast("Ticket updated successfully!");
    } catch (e) { showToast("Failed to update: " + e.message, true); }
    finally     { setSubmitting(false); }
  };

  // ── change status ─────────────────────────────────────────────────────────
  const changeStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await api.changeStatus(id, status);
      await refreshSelected(id);
      showToast(`Status changed to ${status.replace(/_/g, " ").toLowerCase()}`);
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setActionLoading(false); }
  };

  // ── change priority ────────────────────────────────────────────────────────
  const changePriority = async (id, priority) => {
    setActionLoading(true);
    try {
      const current = tickets.find(t => t.id === id) || selected;
      await api.changePriority(id, priority, current);
      await refreshSelected(id);
      showToast(`Priority changed to ${priority.toLowerCase()}`);
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setActionLoading(false); }
  };

  // ── assign technician ──────────────────────────────────────────────────────
  const doAssign = async () => {
    if (!assignUserId) { showToast("Please select a user.", true); return; }
    setSubmitting(true);
    try {
      await api.assignTechnician(selected.id, assignUserId, adminUser?.id);
      await refreshSelected(selected.id);
      setShowAssign(false);
      showToast("Technician assigned successfully!");
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setSubmitting(false); }
  };

  // ── reject ticket ──────────────────────────────────────────────────────────
  const doReject = async () => {
    if (!rejectReason.trim()) { showToast("Please provide a rejection reason.", true); return; }
    setSubmitting(true);
    try {
      await api.rejectTicket(selected.id, adminUser?.id, rejectReason);
      await refreshSelected(selected.id);
      setShowReject(false);
      setRejectReason("");
      showToast("Ticket rejected successfully.");
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setSubmitting(false); }
  };

  // ── resolve ticket ─────────────────────────────────────────────────────────
  const doResolve = async () => {
    setSubmitting(true);
    try {
      await api.resolveTicket(selected.id);
      await refreshSelected(selected.id);
      setShowResolve(false);
      setResolveNotes("");
      showToast("Ticket marked as resolved!");
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setSubmitting(false); }
  };

  // ── close ticket ───────────────────────────────────────────────────────────
  const doClose = async id => {
    if (!window.confirm("Are you sure you want to close this ticket?")) return;
    setActionLoading(true);
    try {
      await api.closeTicket(id);
      await refreshSelected(id);
      showToast("Ticket closed successfully.");
    } catch (e) { showToast("Failed: " + e.message, true); }
    finally     { setActionLoading(false); }
  };

  // ── delete ticket ──────────────────────────────────────────────────────────
  const doDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.deleteTicket(id);
      setShowDetail(false);
      showToast("Ticket deleted successfully.");
      await loadAll();
    } catch (e) { showToast("Failed: " + e.message, true); }
  };

  // ── add comment ────────────────────────────────────────────────────────────
  const addComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.addComment(selected.id, adminUser?.id, commentText);
      setComments(prev => [...prev, c]);
      setCommentText("");
    } catch (e) { showToast("Failed to post: " + e.message, true); }
    finally     { setSubmitting(false); }
  };

  // ── delete comment ─────────────────────────────────────────────────────────
  const deleteCmt = async cid => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.deleteComment(cid, adminUser?.id);
      setComments(prev => prev.filter(c => c.id !== cid));
      showToast("Comment deleted.");
    } catch (e) { showToast("Failed: " + e.message, true); }
  };

  // ── delete attachment ──────────────────────────────────────────────────────
  const deleteAtt = async id => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await api.deleteAttachment(id);
      setAttachments(prev => prev.filter(a => a.id !== id));
      showToast("Attachment deleted successfully.");
    } catch (e) { showToast("Failed: " + e.message, true); }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "var(--font-body)", color: "#1e293b" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .tkrow:hover  { background: var(--color-off-white) !important; }
        .xbtn:hover   { background: var(--color-off-white) !important; }
        * { font-family: var(--font-body); }
    `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.isError ? "#dc2626" : "#0f172a", color: "#fff", padding: "0.875rem 1.375rem", borderRadius: 14, fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxWidth: 360, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.25s ease" }}>
          <span style={{ fontSize: 16 }}>{toast.isError ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0 }}>All Tickets</h2>
          <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "2px 0 0" }}>
            {tickets.length} total · manage, assign and resolve maintenance requests
          </p>
        </div>
       
      </div>

      {/* STATUS STRIP */}
      <div style={{ display: "flex", gap: 5, background: "#fff", borderRadius: 14, padding: "6px", border: "1.5px solid #e8edf3", overflowX: "auto" }}>
        {STATUS_TABS.map(st => {
          const cfg    = STATUS_CFG[st];
          const active = statusFilter === st;
          const cnt    = countFor(st);
          return (
            <button key={st} onClick={() => setStatusFilter(st)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "0.46rem 1rem", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: active ? 700 : 500, whiteSpace: "nowrap", transition: "all 0.15s", background: active ? cfg.light : "transparent", color: active ? cfg.color : "#94a3b8", boxShadow: active ? `0 0 0 1.5px ${cfg.border}` : "none" }}>
              {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />}
              {cfg.label}
              <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "1px 7px", borderRadius: 20, background: active ? cfg.dot + "22" : "#f1f5f9", color: active ? cfg.color : "#94a3b8" }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input style={{ ...INP, paddingLeft: 36, border: "1.5px solid #e8edf3" }}
            placeholder="Search by ID, title, location, assignee…"
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
            onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PRIORITY_TABS.map(p => {
            const active   = priFilter === p;
            const colorMap = {
              ALL:    ["#F3F4F6", "#374151"],
              HIGH:   ["#FEE2E2", "#991B1B"],
              MEDIUM: ["#FEF3C7", "#92400E"],
              LOW:    ["#D1FAE5", "#065F46"],
            };
            const [bg, color] = active ? colorMap[p] : ["#fff", "#94a3b8"];
            return (
              <button key={p} onClick={() => setPriFilter(p)}
                style={{ padding: "0 0.9rem", height: 40, borderRadius: 10, border: "1.5px solid #e8edf3", background: bg, color, fontFamily: "inherit", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* TICKET TABLE */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        {/* header row */}
        <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 140px 110px 110px 150px 140px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
          {["ID", "ISSUE", "LOCATION", "STATUS", "PRIORITY", "ASSIGNEE", "ACTIONS"].map(h => (
            <div key={h} style={{ padding: "0.65rem 0.875rem", fontSize: "0.67rem", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
            <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>No tickets found</div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Try adjusting your filters</div>
          </div>
        ) : filtered.map(t => {
          const sc = STATUS_CFG[normStatus(t.status)]       || STATUS_CFG.OPEN;
          const pc = PRIORITY_CFG[normPriority(t.priority)] || PRIORITY_CFG.LOW;
          return (
            <div key={t.id} className="tkrow"
              style={{ display: "grid", gridTemplateColumns: "64px 1fr 140px 110px 110px 150px 140px", borderBottom: "1px solid #F3F4F6", transition: "all 0.18s", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              {/* priority bar */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: pc.bar }} />

              {/* ID */}
              <div onClick={() => openDetail(t)} style={{ padding: "0.875rem 0.75rem 0.875rem 1rem", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "0.69rem", fontWeight: 800, color: "#94a3b8", fontFamily: "monospace" }}>#{t.id}</span>
              </div>

              {/* Title + category */}
              <div onClick={() => openDetail(t)} style={{ padding: "0.875rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#111827", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title || fmtCategory(t.category)}</div>
                <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{fmtCategory(t.category)}</div>
              </div>

              {/* Location */}
              <div onClick={() => openDetail(t)} style={{ padding: "0.875rem 0.75rem", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {t.location || "—"}</span>
              </div>

              {/* Status — Badge-styled select overlay */}
              <div style={{ padding: "0.875rem 0.5rem", display: "flex", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <Badge status={normStatus(t.status)} />
                  <select value={normStatus(t.status)} onChange={e => changeStatus(t.id, e.target.value)} disabled={actionLoading}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: actionLoading ? "not-allowed" : "pointer", width: "100%", height: "100%" }}>
                    {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"].map(s => (
                      <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority — Badge-styled select overlay */}
              <div style={{ padding: "0.875rem 0.5rem", display: "flex", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <Badge status={normPriority(t.priority)} />
                  <select value={normPriority(t.priority)} onChange={e => changePriority(t.id, e.target.value)} disabled={actionLoading}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: actionLoading ? "not-allowed" : "pointer", width: "100%", height: "100%" }}>
                    {["HIGH", "MEDIUM", "LOW"].map(p => (
                      <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>
                    ))}
                </select>
              </div>
              </div>

              {/* Assignee */}
              <div onClick={() => openDetail(t)} style={{ padding: "0.875rem 0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
                {t.assignedToName
                  ? <><Avatar name={t.assignedToName} size={22} /><span style={{ fontSize: "0.75rem", color: "#374151", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.assignedToName}</span></>
                  : <span style={{ fontSize: "0.75rem", color: "#9CA3AF", fontStyle: "italic" }}>Unassigned</span>
                }
              </div>

              {/* Actions */}
              <div style={{ padding: "0.875rem 0.75rem", display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>
                
                <button title="Edit" onClick={() => {
                  setSelected(t);
                  setEditForm({ title: t.title || "", location: t.location || "", category: t.category || "ELECTRICAL", priority: t.priority || "LOW", contactDetails: t.contactDetails || "", description: t.description || "", resourceId: t.resourceId ? String(t.resourceId) : "" });
                  setShowEdit(true);
                }} className="act-btn"
                  style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e8edf3", background: "#f8fafc", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>✎</button>
                <button title="Delete" onClick={() => doDelete(t.id)} className="act-btn"
                  style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", transition: "all 0.15s" }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {showDetail && selected && (() => {
        const sc = STATUS_CFG[normStatus(selected.status)]       || STATUS_CFG.OPEN;
        const pc = PRIORITY_CFG[normPriority(selected.priority)] || PRIORITY_CFG.LOW;
        const st = normStatus(selected.status);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 20, backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
            <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 780, maxHeight: "93vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease" }}>

              {/* header */}
              <div style={{ padding: "1.375rem 1.625rem 1.125rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "#fff", zIndex: 2, borderRadius: "20px 20px 0 0" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{selected.title || fmtCategory(selected.category)}</span>
                    
                    <Badge status={normStatus(selected.status)} />
                    <Badge status={normPriority(selected.priority)} />
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>#{selected.id} · 📍 {selected.location || "—"} · {fmtCategory(selected.category)}</div>
                </div>
                <button className="xbtn" onClick={() => setShowDetail(false)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e8edf3", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>✕</button>
              </div>

              <div style={{ padding: "1.375rem 1.625rem", display: "flex", flexDirection: "column", gap: 18 }}>

               {/* ADMIN ACTION BAR */}
                <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "0.875rem 1rem",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                }}
                >
                {/* Title */}
                <span
                    style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    }}
                >
                    Admin Actions
                </span>

                {/* Buttons Row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                    onClick={() => {
                        setAssignUserId(
                        selected.assignedToId ? String(selected.assignedToId) : ""
                        );
                        setShowAssign(true);
                    }}
                    style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    👷 Assign
                    </button>

                    {st === "OPEN" && (
                    <button
                        onClick={() => changeStatus(selected.id, "IN_PROGRESS")}
                        disabled={actionLoading}
                        style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        }}
                    >
                        🔧 Mark In Progress
                    </button>
                    )}

                    {(st === "OPEN" || st === "IN_PROGRESS") && (
                    <button
                        onClick={() => {
                        setResolveNotes("");
                        setShowResolve(true);
                        }}
                        style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#16a34a",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        }}
                    >
                        ✅ Mark Resolved
                    </button>
                    )}

                    {(st === "RESOLVED" || st === "OPEN" || st === "IN_PROGRESS") && (
                    <button
                        onClick={() => doClose(selected.id)}
                        disabled={actionLoading}
                        style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        background: "#f8fafc",
                        color: "#475569",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        }}
                    >
                        🔒 Close
                    </button>
                    )}

                    {(st === "OPEN" || st === "IN_PROGRESS") && (
                    <button
                        onClick={() => {
                        setRejectReason("");
                        setShowReject(true);
                        }}
                        style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #fed7aa",
                        background: "#fff7ed",
                        color: "#ea580c",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        }}
                    >
                        ✕ Reject
                    </button>
                    )}

                    <button
                    onClick={openEdit}
                    style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #e8edf3",
                        background: "#fff",
                        color: "#374151",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    ✎ Edit
                    </button>

                    <button
                    onClick={() => doDelete(selected.id)}
                    style={{
                        padding: "0.42rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontFamily: "inherit",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    🗑 Delete
                    </button>
                </div>
                </div>

                {detailLoading ? (
                  <div style={{ textAlign: "center", padding: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
                    <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Loading…
                  </div>
                ) : <>
                  {/* meta grid */}
            
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
                    {[
                      { lbl: "Submitted by", val: selected.submittedByName || selected.userId || "—" },
                      { lbl: "Assigned To",  val: selected.assignedToName  || "Not yet assigned"     },
                      { lbl: "Contact",      val: selected.contactDetails  || "—"                    },
                      { lbl: "Submitted",    val: selected.createdAt ? String(selected.createdAt).slice(0, 10) : "—" },
                      { lbl: "Last Updated", val: selected.updatedAt ? relTime(selected.updatedAt) : "—"             },
                      { lbl: "Resource ID",  val: selected.resourceId || "—"                         },
                    ].map(({ lbl, val }) => (
                      <div key={lbl} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "0.7rem 0.875rem" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{lbl}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* inline status + priority — Badge-styled select overlays */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Change Status">
                      <div style={{ position: "relative", display: "inline-flex" }}>
                        <select value={normStatus(selected.status)} onChange={e => changeStatus(selected.id, e.target.value)} disabled={actionLoading}
                          style={{ ...SEL, background: sc.light, color: sc.color, border: `1.5px solid ${sc.border}`, fontWeight: 700, borderRadius: 10, appearance: "auto" }}>
                          {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"].map(s => (
                            <option key={s} value={s}>{STATUS_CFG[s]?.label}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                    <Field label="Change Priority">
                      <div style={{ position: "relative", display: "inline-flex" }}>
                        <select value={normPriority(selected.priority)} onChange={e => changePriority(selected.id, e.target.value)} disabled={actionLoading}
                          style={{ ...SEL, background: pc.light, color: pc.color, border: `1.5px solid ${pc.border || pc.bar + "66"}`, fontWeight: 700, borderRadius: 10, appearance: "auto" }}>
                          {["HIGH", "MEDIUM", "LOW"].map(p => (
                            <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>
                          ))}
                        </select>
                      </div>
                    
                    </Field>
                  </div>

                  {/* description */}
                  <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "0.875rem 1rem" }}>
                    <SecLabel>Description</SecLabel>
                    <div style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.7 }}>{selected.description || "No description provided."}</div>
                  </div>

                  {/* resolution note */}
                  {selected.resolutionNotes && (
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "0.875rem 1rem" }}>
                      <SecLabel>✅ Resolution Notes</SecLabel>
                      <div style={{ fontSize: "0.83rem", color: "#166534", lineHeight: 1.65 }}>{selected.resolutionNotes}</div>
                    </div>
                  )}

                  {/* rejection reason */}
                  {selected.rejectionReason && (
                    <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10, padding: "0.875rem 1rem" }}>
                      <SecLabel>❌ Rejection Reason</SecLabel>
                      <div style={{ fontSize: "0.83rem", color: "#9a3412", lineHeight: 1.65 }}>{selected.rejectionReason}</div>
                    </div>
                  )}

                  {/* attachments */}
                  <div>
                    <SecLabel>Attachments ({attachments.length})</SecLabel>
                    {attachments.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10 }}>
                        {attachments.map(a => (
                          <div key={a.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e8edf3" }}>
                            <img src={`http://localhost:8081/uploads/${a.fileUrl}`} alt="att"
                              style={{ width: "100%", height: 90, objectFit: "cover", cursor: "pointer", display: "block" }}
                              onClick={() => setPreviewImage(`http://localhost:8081/uploads/${a.fileUrl}`)} />
                            <button onClick={() => deleteAtt(a.id)}
                              style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No attachments.</div>
                    )}
                  </div>

                  {/* comments */}
                  <div>
                    <SecLabel>Comments ({comments.length})</SecLabel>
                    {comments.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                        {comments.map(c => (
                          <div key={c.id} style={{ background: "#f8fafc", borderRadius: 10, padding: "0.75rem 0.875rem", border: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar name={c.user?.name || c.user?.email} size={24} />
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6366f1" }}>{c.user?.name || c.user?.email || "User"}</span>
                              </div>
                              <button onClick={() => deleteCmt(c.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", fontFamily: "inherit", padding: "2px 6px" }}>✕ Delete</button>
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.55 }}>{c.content}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No comments yet.</div>
                    )}
                  </div>

                  {/* add comment */}
                  <Field label="Add Admin Comment">
                    <textarea style={{ ...TA, minHeight: 76 }} rows={3}
                      placeholder="Leave a note for the technician or user…"
                      value={commentText} onChange={e => setCommentText(e.target.value)}
                      onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                      onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
                  </Field>
                </>}
              </div>

              {/* footer */}
              <div style={{ padding: "0.875rem 1.625rem 1.375rem", display: "flex", gap: 9, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                <PrimaryBtn onClick={addComment} loading={submitting} disabled={detailLoading || !commentText.trim()}>
                  {submitting ? "Posting…" : "💬 Post Comment"}
                </PrimaryBtn>
                <GhostBtn onClick={() => setShowDetail(false)}>Close</GhostBtn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ EDIT MODAL ══ */}
      {showEdit && selected && (
        <Modal title={`Edit Ticket #${selected.id}`} sub="Update ticket information" onClose={() => setShowEdit(false)} zIndex={110}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Title *">
                <input style={INP} value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Short description"
                  onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
              </Field>
              <Field label="Location *">
                <input style={INP} value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="e.g. Lab A401"
                  onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Category">
                <select style={SEL} value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                  {["ELECTRICAL", "PLUMBING", "EQUIPMENT", "FURNITURE", "OTHER"].map(c => <option key={c} value={c}>{fmtCategory(c)}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select style={SEL} value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Resource ID">
                <input style={INP} type="number" value={editForm.resourceId} onChange={e => setEditForm({ ...editForm, resourceId: e.target.value })} placeholder="Optional"
                  onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
              </Field>
              <Field label="Contact">
                <input style={INP} value={editForm.contactDetails} onChange={e => setEditForm({ ...editForm, contactDetails: e.target.value })} placeholder="07X XXX XXXX"
                  onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
              </Field>
            </div>
            <Field label="Description">
              <textarea style={TA} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Describe the issue…"
                onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <PrimaryBtn onClick={saveEdit} loading={submitting}>{submitting ? "Saving…" : "Save Changes"}</PrimaryBtn>
            <GhostBtn onClick={() => setShowEdit(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ REJECT MODAL ══ */}
      {showReject && selected && (
        <Modal title="Reject Ticket" sub={`Ticket #${selected.id} — ${selected.title || fmtCategory(selected.category)}`} onClose={() => setShowReject(false)} zIndex={110}>
          <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: 16 }}>
            <div style={{ fontSize: "0.82rem", color: "#9a3412", fontWeight: 600 }}>⚠️ The submitter will be notified of the rejection along with the reason provided below.</div>
          </div>
          <Field label="Rejection Reason *" hint="Be specific so the user understands and can resubmit if needed.">
            <textarea style={{ ...TA, minHeight: 100, border: "1.5px solid #fed7aa" }}
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate ticket — see #42. / Outside scope. / Insufficient information."
              onFocus={e => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#fed7aa";  e.target.style.boxShadow = "none"; }} />
          </Field>
          <div style={{ display: "flex", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={doReject} disabled={submitting || !rejectReason.trim()}
              style={{ flex: 1, padding: "0.72rem", background: "linear-gradient(135deg,#ea580c,#dc2626)", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, color: "#fff", cursor: submitting || !rejectReason.trim() ? "not-allowed" : "pointer", opacity: submitting || !rejectReason.trim() ? 0.7 : 1 }}>
              {submitting ? "Rejecting…" : "✕ Confirm Rejection"}
            </button>
            <GhostBtn onClick={() => setShowReject(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ RESOLVE MODAL ══ */}
      {showResolve && selected && (
        <Modal title="Mark as Resolved" sub={`Ticket #${selected.id} — ${selected.title || fmtCategory(selected.category)}`} onClose={() => setShowResolve(false)} zIndex={110}>
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: 16 }}>
            <div style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 600 }}>✅ This will mark the ticket as resolved and notify the submitter.</div>
          </div>
          <Field label="Resolution Notes (optional)" hint="Describe what was done to fix the issue.">
            <textarea style={{ ...TA, minHeight: 100 }}
              value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
              placeholder="e.g. Replaced faulty circuit breaker in panel B."
              onFocus={e => { e.target.style.borderColor = "#22c55e"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
          </Field>
          <div style={{ display: "flex", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={doResolve} disabled={submitting}
              style={{ flex: 1, padding: "0.72rem", background: "linear-gradient(135deg,#16a34a,#22c55e)", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Resolving…" : "✅ Confirm Resolved"}
            </button>
            <GhostBtn onClick={() => setShowResolve(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ ASSIGN MODAL ══ */}
      {showAssign && selected && (
        <Modal title="Assign Technician" sub={`Ticket #${selected.id} — ${selected.title || fmtCategory(selected.category)}`} onClose={() => setShowAssign(false)} zIndex={110}>
          {selected.assignedToName && (
            <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 16, fontSize: "0.82rem", color: "#1e40af", fontWeight: 600 }}>
              Currently assigned to: <strong>{selected.assignedToName}</strong>
            </div>
          )}
          <Field label="Select Technician / Staff Member *">
            <select style={SEL} value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
              <option value="">— Select a user —</option>
              {users
                  .filter(u => u.role === "TECHNICIAN")
                  .map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))
              }
            </select>
          </Field>
          <div style={{ display: "flex", gap: 9, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <PrimaryBtn onClick={doAssign} loading={submitting} disabled={!assignUserId}>
              {submitting ? "Assigning…" : "👷 Assign Technician"}
            </PrimaryBtn>
            <GhostBtn onClick={() => setShowAssign(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ IMAGE PREVIEW ══ */}
      {previewImage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20, backdropFilter: "blur(6px)" }}
          onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setPreviewImage(null)}
            style={{ position: "absolute", top: 22, right: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, color: "#fff", backdropFilter: "blur(4px)", fontFamily: "inherit" }}>
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
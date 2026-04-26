import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  ALL:         { color:"#64748b", light:"#f8fafc", border:"#e2e8f0", label:"All",         dot:"#94a3b8" },
  OPEN:        { color:"#dc2626", light:"#fef2f2", border:"#fecaca", label:"Open",        dot:"#ef4444" },
  IN_PROGRESS: { color:"#2563eb", light:"#eff6ff", border:"#bfdbfe", label:"In Progress", dot:"#3b82f6" },
  RESOLVED:    { color:"#16a34a", light:"#f0fdf4", border:"#bbf7d0", label:"Resolved",    dot:"#22c55e" },
  CLOSED:      { color:"#475569", light:"#f8fafc", border:"#e2e8f0", label:"Closed",      dot:"#94a3b8" },
  REJECTED:    { color:"#ea580c", light:"#fff7ed", border:"#fed7aa", label:"Rejected",    dot:"#f97316" },
};
const PRIORITY_CFG = {
  HIGH:   { color:"#dc2626", light:"#fef2f2", bar:"#ef4444", label:"High" },
  MEDIUM: { color:"#d97706", light:"#fffbeb", bar:"#f59e0b", label:"Medium" },
  LOW:    { color:"#16a34a", light:"#f0fdf4", bar:"#22c55e", label:"Low" },
};

const normStatus   = s => s ? String(s).toUpperCase().replace(/ /g,"_") : "OPEN";
const normPriority = p => p ? String(p).toUpperCase() : "LOW";
const fmtCategory  = c => c ? c.replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase()) : "";

const TICKET_CATEGORIES = ["ELECTRICAL","PLUMBING","EQUIPMENT","FURNITURE","OTHER"];
const STATUS_TABS   = ["ALL","OPEN","IN_PROGRESS","RESOLVED","CLOSED","REJECTED"];
const PRIORITY_TABS = ["ALL","HIGH","MEDIUM","LOW"];

const QUICK_ACTIONS = [
  { icon:"⚡", label:"Electrical Fault", sub:"Power / wiring",    category:"ELECTRICAL", priority:"HIGH"   },
  { icon:"❄️",  label:"AC / Cooling",     sub:"HVAC / ventilation", category:"PLUMBING",   priority:"MEDIUM" },
  { icon:"🖥️",  label:"AV / Projector",   sub:"Display / audio",   category:"EQUIPMENT",  priority:"MEDIUM" },
  { icon:"🌐", label:"Network Issue",    sub:"WiFi / LAN",         category:"OTHER",      priority:"HIGH"   },
];

// ── relative time ──────────────────────────────────────────────────────────
function relTime(raw) {
  if (!raw) return "";
  const d = new Date(raw), now = new Date(), ms = now - d;
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), dy = Math.floor(ms / 86400000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (dy < 7)  return `${dy}d ago`;
  return String(raw).slice(0, 10);
}

// ── rich activity message per ticket ──────────────────────────────────────
function buildActivity(t) {
  const st   = normStatus(t.status);
  const cat  = fmtCategory(t.category);
  const loc  = t.location || "unknown location";
  const tech = t.assignedToName;
  const pr   = normPriority(t.priority);

  if (st === "RESOLVED") return {
    icon:"✅", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0",
    headline:"Your ticket has been resolved!",
    detail: tech
      ? `Great news — ${tech} fixed the issue and marked it resolved.`
      : "The issue has been marked as resolved.",
  };
  if (st === "IN_PROGRESS") return {
    icon:"🔧", color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe",
    headline:"Someone is working on it",
    detail: tech
      ? `${tech} has picked up your ticket and is on the way.`
      : "A technician has been assigned and is working on this.",
  };
  if (st === "REJECTED") return {
    icon:"❌", color:"#ea580c", bg:"#fff7ed", border:"#fed7aa",
    headline:"Ticket could not be approved",
    detail: t.resolutionNotes
      ? t.resolutionNotes.slice(0, 70) + (t.resolutionNotes.length > 70 ? "…" : "")
      : "Please review and resubmit if the issue persists.",
  };
  if (st === "CLOSED") return {
    icon:"🔒", color:"#475569", bg:"#f8fafc", border:"#e2e8f0",
    headline:"Ticket has been closed",
    detail:`The ${cat.toLowerCase()} issue at ${loc} is now closed.`,
  };
  // OPEN
  if (pr === "HIGH") return {
    icon:"🚨", color:"#dc2626", bg:"#fef2f2", border:"#fecaca",
    headline:"High-priority ticket submitted",
    detail:`You reported a ${cat.toLowerCase()} issue at ${loc}. Our team will respond shortly.`,
  };
  return {
    icon:"📋", color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe",
    headline:"New ticket submitted",
    detail:`Your ${cat.toLowerCase()} report at ${loc} is in the queue.`,
  };
}

// ─── TOAST HOOK ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3400);
  }, []);
  return { toast, show };
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 26 }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "U";
  const palette  = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#3b82f6"];
  const bg       = palette[(name || "U").charCodeAt(0) % palette.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.37, fontWeight:800, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function Field({ label: lbl, hint, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>{lbl}</label>
      {children}
      {hint && <span style={{ fontSize:"0.7rem", color:"#94a3b8" }}>{hint}</span>}
    </div>
  );
}

// ─── BUTTON PRIMITIVES ────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, loading, disabled, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ flex:1, padding:"0.72rem", background:"linear-gradient(135deg,#3b82f6,#6366f1)", border:"none", borderRadius:10, fontFamily:"inherit", fontSize:"0.875rem", fontWeight:700, color:"#fff", cursor:(loading||disabled)?"not-allowed":"pointer", transition:"all 0.15s", opacity:(loading||disabled)?0.7:1, boxShadow:"0 4px 14px rgba(59,130,246,0.3)", ...style }}>
      {children}
    </button>
  );
}
function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding:"0.72rem 1.25rem", background:"transparent", border:"1.5px solid #e8edf3", borderRadius:10, fontFamily:"inherit", fontSize:"0.875rem", fontWeight:600, color:"#64748b", cursor:"pointer", transition:"all 0.15s" }}>
      {children}
    </button>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ title, sub, onClose, children, wide = false, zIndex = 99 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,15,30,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex, padding:20, backdropFilter:"blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth: wide ? 700 : 560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 40px 100px rgba(0,0,0,0.2)", animation:"fadeUp 0.2s ease" }}>
        {/* header */}
        <div style={{ padding:"1.375rem 1.625rem 1.125rem", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, position:"sticky", top:0, background:"#fff", zIndex:2, borderRadius:"20px 20px 0 0" }}>
          <div>
            <div style={{ fontSize:"1.05rem", fontWeight:800, color:"#0f172a", letterSpacing:"-0.3px" }}>{title}</div>
            {sub && <div style={{ fontSize:"0.75rem", color:"#94a3b8", marginTop:3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:"1px solid #e8edf3", background:"transparent", color:"#94a3b8", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>
        {/* body */}
        <div style={{ padding:"1.375rem 1.625rem" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── INP / SEL / TA BASE STYLES ───────────────────────────────────────────────
const INP = { padding:"0.625rem 0.875rem", border:"1.5px solid #e8edf3", borderRadius:10, fontFamily: "var(--font-body)", fontSize:"0.85rem", color: "var(--color-text)", background:"#fff", outline:"none", width:"100%", transition:"border-color 0.15s, box-shadow 0.15s", boxSizing:"border-box" };
const SEL = { ...INP };
const TA  = { ...INP, resize:"vertical", minHeight:88, lineHeight:1.65 };
const pill = (bg, color, border) => ({ padding:"3px 10px", borderRadius:20, fontSize:"0.7rem", fontWeight:700, background:bg, color, border:`1px solid ${border||"transparent"}`, letterSpacing:"0.02em", display:"inline-block" });

// ─── TICKET FORM FIELDS (reused in create + edit) ─────────────────────────────
function TicketFormFields({ form, setForm, resources = [] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Title *">
          <input style={INP} placeholder="Short description of issue"
            value={form.title} onChange={e => setForm({ ...form, title:e.target.value })}
            onFocus={e => { e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.1)"; }}
            onBlur={e  => { e.target.style.borderColor="#e8edf3"; e.target.style.boxShadow="none"; }} />
        </Field>
        <Field label="Location (Resource) *">
          {resources.length > 0 ? (
              <select style={SEL}
                  value={form.resourceId}
                  onChange={e => {
                      const selected = resources.find(r => r.id === Number(e.target.value));
                      setForm({
                          ...form,
                          resourceId: e.target.value,
                          location: selected?.location || form.location,
                      });
                  }}>
                  <option value="">Select a resource / location...</option>
                  {resources.map(r => (
                      <option key={r.id} value={r.id}>
                          {r.name} — {r.location} (Capacity: {r.capacity})
                      </option>
                  ))}
              </select>
          ) : (
              <input style={INP} placeholder="e.g. Lab A401"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} />
          )}
      </Field>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Issue Category *">
          <select style={SEL} value={form.category} onChange={e => setForm({ ...form, category:e.target.value })}>
            {TICKET_CATEGORIES.map(c => <option key={c} value={c}>{fmtCategory(c)}</option>)}
          </select>
        </Field>
        <Field label="Priority Level">
          <select style={SEL} value={form.priority} onChange={e => setForm({ ...form, priority:e.target.value })}>
            <option value="LOW">Low — Minor inconvenience</option>
            <option value="MEDIUM">Medium — Affects comfort</option>
            <option value="HIGH">High — Blocking / Safety</option>
          </select>
        </Field>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field label="Contact Number">
          <input style={INP} placeholder="07X XXX XXXX"
              value={form.contactDetails}
              maxLength={10}
              onChange={e => {
                  const val = e.target.value.replace(/\D/g, ""); // only digits
                  setForm({ ...form, contactDetails: val });
              }}
              onFocus={e => { e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor="#e8edf3"; e.target.style.boxShadow="none"; }} />
      </Field>
      </div>
      <Field label="Describe the Issue">
        <textarea style={TA} placeholder="What's happening? Include details that help the technician…"
          value={form.description} onChange={e => setForm({ ...form, description:e.target.value })}
          onFocus={e => { e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.1)"; }}
          onBlur={e  => { e.target.style.borderColor="#e8edf3"; e.target.style.boxShadow="none"; }} />
      </Field>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function TicketsPage() {
  const { user, token } = useAuth();
  const CURRENT_USER_ID = user?.id;

  const [resources, setResources] = useState([]);

  useEffect(() => {
      if (!token) return;
      fetch(`${import.meta.env.VITE_API_URL}/api/resources`, {
          headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => setResources(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  const authH = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const api = {
      getMyTickets:     ()        => apiFetch(`/tickets/my?userId=${CURRENT_USER_ID}`, { headers: authH }),
      createTicket:     body      => apiFetch(`/tickets?userId=${CURRENT_USER_ID}`, { method:"POST", body:JSON.stringify(body), headers: authH }),
      updateTicket:     (id,body) => apiFetch(`/tickets/${id}`, { method:"PUT", body:JSON.stringify(body), headers: authH }),
      deleteTicket:     id        => apiFetch(`/tickets/${id}`, { method:"DELETE", headers: authH }),
      getComments:      tid       => apiFetch(`/tickets/${tid}/comments`, { headers: authH }),
      addComment:       (tid,c)   => apiFetch(`/tickets/${tid}/comments/${CURRENT_USER_ID}`, { method:"POST", body:JSON.stringify({content:c}), headers: authH }),
      updateComment:    (cid,c)   => apiFetch(`/tickets/comments/${cid}/user/${CURRENT_USER_ID}`, { method:"PUT", body:JSON.stringify({content:c}), headers: authH }),
      deleteComment:    cid       => apiFetch(`/tickets/comments/${cid}/user/${CURRENT_USER_ID}`, { method:"DELETE", headers: authH }),
      getAttachments:   tid       => apiFetch(`/tickets/${tid}/attachments`, { headers: authH }),
      uploadAttachment: (tid,f)   => { const fd=new FormData(); fd.append("file",f); return fetch(`${BASE_URL}/tickets/${tid}/attachments`,{method:"POST",body:fd, headers: { Authorization: `Bearer ${token}` }}).then(r=>r.text()); },
      deleteAttachment: id        => apiFetch(`/tickets/attachments/${id}`, { method:"DELETE", headers: authH }),
  };

  // ── state ──────────────────────────────────────────────────────────────────
  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("ALL");
  const [priFilter,     setPriFilter]     = useState("ALL");
  const [showCreate,    setShowCreate]    = useState(false);
  const [showDetail,    setShowDetail]    = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [comments,      setComments]      = useState([]);
  const [attachments,   setAttachments]   = useState([]);
  const [commentText,   setCommentText]   = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewImage,  setPreviewImage]  = useState(null);
  const [editingCid,    setEditingCid]    = useState(null);
  const [editingCtext,  setEditingCtext]  = useState("");
  const [savingCmt,     setSavingCmt]     = useState(false);
  const [editSaving,    setEditSaving]    = useState(false);
  const { toast, show: showToast } = useToast();

  const EMPTY_FORM = { resourceId:"", location:"", title:"", category:"ELECTRICAL", priority:"LOW", contactDetails:"", description:"", files:[] };
  const EMPTY_EDIT = { resourceId:"", location:"", title:"", category:"ELECTRICAL", priority:"LOW", contactDetails:"", description:"" };
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  // ── load ───────────────────────────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    if (!CURRENT_USER_ID || !token) return;
    setLoading(true);
    try {
      const data = await api.getMyTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch(e) { showToast("Failed to load tickets: " + e.message, true); }
    finally    { setLoading(false); }
  }, [CURRENT_USER_ID, token]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const countFor = st => st === "ALL" ? tickets.length : tickets.filter(t => normStatus(t.status) === st).length;

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (
      (!search || String(t.id).includes(q) || (t.title||"").toLowerCase().includes(q) ||
       (t.location||"").toLowerCase().includes(q) || fmtCategory(t.category).toLowerCase().includes(q)) &&
      (statusFilter === "ALL" || normStatus(t.status)   === statusFilter) &&
      (priFilter    === "ALL" || normPriority(t.priority) === priFilter)
    );
  });

  // ── detail ─────────────────────────────────────────────────────────────────
  const openDetail = async t => {
    setSelected(t); setCommentText(""); setEditingCid(null);
    setShowDetail(true); setDetailLoading(true);
    try {
      const [cmts, atts] = await Promise.all([api.getComments(t.id), api.getAttachments(t.id)]);
      setComments(Array.isArray(cmts) ? cmts : []);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch(e) { showToast("Could not load details: " + e.message, true); }
    finally    { setDetailLoading(false); }
  };

  // ── edit ticket ────────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!selected) return;
    setEditForm({ resourceId:selected.resourceId?String(selected.resourceId):"", location:selected.location||"", title:selected.title||"", category:selected.category||"ELECTRICAL", priority:selected.priority||"LOW", contactDetails:selected.contactDetails||"", description:selected.description||"" });
    setShowEdit(true);
  };
  const saveEdit = async () => {
    if (!editForm.location || !editForm.title) { showToast("Location and Title are required.", true); return; }
    
    if (editForm.contactDetails && editForm.contactDetails.trim().length !== 10) {
        showToast("Contact number must be exactly 10 digits.", true);
        return;
    }
    
    setEditSaving(true);
    try {
      const body = { resourceId:editForm.resourceId?Number(editForm.resourceId):null, location:editForm.location, title:editForm.title, description:editForm.description, category:editForm.category, priority:editForm.priority, contactDetails:editForm.contactDetails };
      const updated = await api.updateTicket(selected.id, body);
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setShowEdit(false); showToast("Ticket updated successfully!");
    } catch(e) { showToast("Failed to update: " + e.message, true); }
    finally    { setEditSaving(false); }
  };

  // ── create ─────────────────────────────────────────────────────────────────
  const createTicket = async () => {
    if (!form.location || !form.title) { showToast("Location and Title are required.", true); return; }
    
    if (form.contactDetails && form.contactDetails.trim().length !== 10) {
        showToast("Contact number must be exactly 10 digits.", true);
        return;
    }

    setSubmitting(true);
    try {
      const body = { resourceId:form.resourceId?Number(form.resourceId):null, location:form.location, title:form.title, description:form.description, category:form.category, priority:form.priority, contactDetails:form.contactDetails };
      const created = await api.createTicket(body);
      if (form.files.length > 0 && created?.id) {
        for (const f of form.files.slice(0, 3)) await api.uploadAttachment(created.id, f).catch(() => {});
      }
      showToast("Ticket submitted successfully!");
      setShowCreate(false); setForm(EMPTY_FORM);
      await loadTickets();
    } catch(e) { showToast("Failed to create: " + e.message, true); }
    finally    { setSubmitting(false); }
  };

  // ── delete ticket ──────────────────────────────────────────────────────────
  const deleteTicket = async id => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.deleteTicket(id);
      setShowDetail(false); showToast("Ticket deleted successfully.");
      await loadTickets();
    } catch(e) { showToast("Failed to delete: " + e.message, true); }
  };

  // ── comments ───────────────────────────────────────────────────────────────
  const addComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const c = await api.addComment(selected.id, commentText);
      setComments(prev => [...prev, c]); setCommentText("");
    } catch(e) { showToast("Failed to post: " + e.message, true); }
    finally    { setSubmitting(false); }
  };
  const saveEditCmt = async cid => {
    if (!editingCtext.trim()) return;
    setSavingCmt(true);
    try {
      const updated = await api.updateComment(cid, editingCtext);
      setComments(prev => prev.map(c => c.id === cid ? {...c, content:updated.content ?? editingCtext} : c));
      setEditingCid(null); showToast("Comment updated successfully!");
    } catch(e) { showToast("Failed to update: " + e.message, true); }
    finally    { setSavingCmt(false); }
  };
  const deleteCmt = async cid => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try { await api.deleteComment(cid); setComments(prev => prev.filter(c => c.id !== cid)); showToast("Comment deleted successfully."); }
    catch(e) { showToast("Failed to delete: " + e.message, true); }
  };

  // ── attachments ────────────────────────────────────────────────────────────
  const deleteAtt = async id => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try { await api.deleteAttachment(id); setAttachments(prev => prev.filter(a => a.id !== id)); showToast("Attachment deleted successfully."); }
    catch(e) { showToast("Failed to delete: " + e.message, true); }
  };

  const prefill = qa => { setForm(f => ({...f, category:qa.category, priority:qa.priority})); setShowCreate(true); };

  // ── parse date string to timestamp ─────────────────────────────────────────
  const parseDate = (raw) => {
  if (!raw) return null;

  // handle different backend formats safely
  const cleaned = String(raw)
    .replace("T", " ")
    .split(".")[0];

  const date = new Date(cleaned);

  return isNaN(date.getTime()) ? null : date.getTime();
};

  // ── activity feed ──────────────────────────────────────────────────────────
  const actFeed = [...tickets]
    .sort((a,b) => (b.updatedAt||b.createdAt||"").localeCompare(a.updatedAt||a.createdAt||""))
    .slice(0, 10)
    .map(t => ({ t, act:buildActivity(t), time:relTime(t.updatedAt || t.createdAt) }));


  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem", fontFamily:"var(--font-body)", color:"#1e293b" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .tkrow:hover  { background:#f8faff !important; transform:translateX(2px); }
        .qcard:hover  { background:#f8faff !important; box-shadow:0 6px 24px rgba(37,99,235,0.1) !important; transform:translateY(-2px); }
        .actrow:hover { background:#f8faff !important; }
        .xbtn:hover   { background:#f1f5f9 !important; color:#475569 !important; }
        .sbtn:hover   { background:#f1f5f9; }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background:toast.isError?"#dc2626":"#0f172a", color:"#fff", padding:"0.875rem 1.375rem", borderRadius:14, fontSize:"0.82rem", fontWeight:600, boxShadow:"0 20px 60px rgba(0,0,0,0.25)", maxWidth:360, lineHeight:1.5, display:"flex", alignItems:"center", gap:10, animation:"fadeUp 0.25s ease" }}>
          <span style={{ fontSize:16 }}>{toast.isError ? "⚠️" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"0.25rem", flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-heading)", fontSize:"1.4rem", fontWeight:700, color:"var(--color-black)", margin:0, marginBottom:2 }}>
            My Tickets
          </h1>
          <p style={{ fontSize:"0.82rem", color:"var(--color-text-light)", margin:0 }}>
            Track and manage your maintenance requests
          </p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          
          <button onClick={() => setShowCreate(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"0.6rem 1.1rem", backgroundColor:"var(--color-primary)", color:"var(--color-white)", border:"none", borderRadius:8, fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", transition:"all 0.15s ease", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:"1rem", fontWeight:700 }}>+</span> New Ticket
          </button>
        </div>
      </div>
 
      {/* ══ STATUS STRIP ════════════════════════════════════════════════════ */}
      <div style={{ display:"flex", gap:5, background:"#fff", borderRadius:14, padding:"6px", border:"1.5px solid #e8edf3", overflowX:"auto" }}>
        {STATUS_TABS.map(st => {
          const cfg = STATUS_CFG[st];
          const active = statusFilter === st;
          const cnt = countFor(st);
          return (
            <button key={st} onClick={() => setStatusFilter(st)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"0.46rem 1rem", borderRadius:9, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"0.8rem", fontWeight:active?700:500, whiteSpace:"nowrap", transition:"all 0.15s", background:active?cfg.light:"transparent", color:active?cfg.color:"#94a3b8", boxShadow:active?`0 0 0 1.5px ${cfg.border}`:"none" }}>
              {active && <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />}
              {cfg.label}
              <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"1px 7px", borderRadius:20, background:active?cfg.dot+"22":"#f1f5f9", color:active?cfg.color:"#94a3b8" }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ BODY GRID ═══════════════════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 304px", gap:20, alignItems:"start" }}>

        {/* LEFT COLUMN ─────────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Quick Report */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:"0.65rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.09em" }}>Quick Report</span>
              <span style={{ fontSize:"0.72rem", color:"#94a3b8" }}>Tap a card to pre-fill</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {QUICK_ACTIONS.map((qa, i) => {
                const pc = PRIORITY_CFG[qa.priority];
                return (
                  <button key={i} className="qcard" onClick={() => prefill(qa)}
                    style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:14, padding:"1rem 0.9rem", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:10, fontFamily:"inherit", transition:"all 0.18s" }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:pc.light, border:`1.5px solid ${pc.bar}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                      {qa.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#0f172a", marginBottom:3 }}>{qa.label}</div>
                      <div style={{ fontSize:"0.7rem", color:"#94a3b8" }}>{qa.sub}</div>
                    </div>
                    <span style={{ ...pill(pc.light, pc.color, pc.bar+"44"), fontSize:"0.68rem", padding:"2px 8px" }}>
                      {pc.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:14, pointerEvents:"none" }}>🔍</span>
              <input style={{ ...INP, paddingLeft:36, border:"1.5px solid #e8edf3" }}
                placeholder="Search by ID, title, location or category…"
                value={search} onChange={e => setSearch(e.target.value)}
                onFocus={e => { e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor="#e8edf3";  e.target.style.boxShadow="none"; }} />
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {PRIORITY_TABS.map(p => {
                const active = priFilter === p;
                const colorMap = { ALL:["#f1f5f9","#475569"], HIGH:["#fef2f2","#dc2626"], MEDIUM:["#fffbeb","#d97706"], LOW:["#f0fdf4","#16a34a"] };
                const [bg, color] = active ? colorMap[p] : ["#fff","#94a3b8"];
                return (
                  <button key={p} onClick={() => setPriFilter(p)}
                    style={{ padding:"0 0.9rem", height:40, borderRadius:10, border:"1.5px solid #e8edf3", background:bg, color, fontFamily:"inherit", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
                    {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket list */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:"0.65rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.09em" }}>
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </span>
              {search && (
                <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.74rem", color:"#94a3b8", fontFamily:"inherit" }}>
                  ✕ Clear search
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:14, padding:"3rem", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"#94a3b8" }}>
                <div style={{ width:18, height:18, border:"2px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                Loading your tickets…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:14, padding:"3.5rem 1.5rem", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                <div style={{ fontSize:"0.875rem", fontWeight:700, color:"#475569", marginBottom:4 }}>No tickets found</div>
                <div style={{ fontSize:"0.78rem", color:"#94a3b8" }}>Try adjusting your filters or submit a new ticket</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {filtered.map(t => {
                  const sc = STATUS_CFG[normStatus(t.status)]       || STATUS_CFG.OPEN;
                  const pc = PRIORITY_CFG[normPriority(t.priority)] || PRIORITY_CFG.LOW;
                  const dateStr = t.createdAt ? String(t.createdAt).slice(5, 10) : "";
                  return (
                    <div key={t.id} className="tkrow" onClick={() => openDetail(t)}
                      style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:13, padding:"0.9rem 1.1rem 0.9rem 1.3rem", display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"all 0.18s", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3.5, background:pc.bar, borderRadius:"4px 0 0 4px" }} />
                      <div style={{ fontSize:"0.69rem", fontWeight:800, color:"#94a3b8", letterSpacing:"0.05em", width:50, flexShrink:0 }}>#{t.id}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.875rem", fontWeight:700, color:"#0f172a", marginBottom:3 }}>
                          {t.title || fmtCategory(t.category)}
                        </div>
                        <div style={{ fontSize:"0.73rem", color:"#94a3b8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          📍 {t.location||"—"} · {fmtCategory(t.category)} · {t.assignedToName ? `👷 ${t.assignedToName}` : "Unassigned"}
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
                        <span style={pill(sc.light, sc.color, sc.border)}>{sc.label}</span>
                        <span style={pill(pc.light, pc.color, pc.bar+"44")}>{pc.icon} {pc.label}</span>
                        <span style={{ fontSize:"0.69rem", color:"#94a3b8", fontWeight:600, minWidth:38, textAlign:"right" }}>{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR ───────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Recent Activity */}
          <div style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:16, padding:"1.125rem 1.25rem", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>⚡</div>
                <span style={{ fontSize:"0.8rem", fontWeight:800, color:"#0f172a" }}>Recent Activity</span>
              </div>
              <span style={{ fontSize:"0.65rem", fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#f1f5f9", color:"#64748b" }}>
              {Math.min(actFeed.length, 5)} shown
              </span>
            </div>

            {actFeed.length === 0 ? (
              <div style={{ textAlign:"center", padding:"2rem 0.5rem" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🌱</div>
                <div style={{ fontSize:"0.78rem", color:"#94a3b8", lineHeight:1.6 }}>No activity yet.<br/>Submit your first ticket to get started!</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" }}>
                {actFeed.slice(0, 5).map(({ t, act, time }, i) => (
                  <div key={t.id} className="actrow" onClick={() => openDetail(t)}
                    style={{ display:"flex", gap:10, padding:"9px 6px", borderRadius:10, cursor:"pointer", transition:"background 0.13s", borderBottom: i < actFeed.length-1 ? "1px solid #f8fafc" : "none" }}>

                    {/* icon + connector line */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:act.bg, border:`1.5px solid ${act.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
                        {act.icon}
                      </div>
                      {i < actFeed.length-1 && <div style={{ width:1.5, flex:1, background:"#f1f5f9", minHeight:10, marginTop:3 }} />}
                    </div>

                    {/* text */}
                    <div style={{ flex:1, minWidth:0, paddingBottom: i < actFeed.length-1 ? 6 : 0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                        <span style={{ fontSize:"0.64rem", fontWeight:800, color:"#6366f1" }}>#{t.id}</span>
                        <span style={{ ...pill(STATUS_CFG[normStatus(t.status)]?.light||"#f8fafc", STATUS_CFG[normStatus(t.status)]?.color||"#475569", STATUS_CFG[normStatus(t.status)]?.border||"#e2e8f0"), fontSize:"0.59rem", padding:"1px 6px" }}>
                          {STATUS_CFG[normStatus(t.status)]?.label}
                        </span>
                      </div>
                      {/* human-friendly headline */}
                      <div style={{ fontSize:"0.77rem", fontWeight:700, color:"#0f172a", lineHeight:1.35, marginBottom:2 }}>
                        {act.headline}
                      </div>
                      {/* ticket title */}
                      <div style={{ fontSize:"0.71rem", color:"#475569", fontWeight:500, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {t.title || fmtCategory(t.category)}
                      </div>
                      {/* detail sentence */}
                      <div style={{ fontSize:"0.69rem", color:"#94a3b8", lineHeight:1.5 }}>
                        {act.detail}
                      </div>
                      {/* timestamp */}
                      <div style={{ fontSize:"0.63rem", color:"#cbd5e1", marginTop:4, fontWeight:600 }}>
                        🕐 {time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips 
          <div style={{ background:"#fff", border:"1.5px solid #e8edf3", borderRadius:16, padding:"1.125rem 1.25rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>💡</div>
              <span style={{ fontSize:"0.8rem", fontWeight:800, color:"#0f172a" }}>Pro Tips</span>
            </div>
            {[
              { icon:"📸", head:"Attach photos",       body:"Tickets with photos get resolved 2× faster." },
              { icon:"⏰", head:"Use priority wisely", body:"Mark HIGH only for safety or class-blocking issues." },
              { icon:"💬", head:"Add comments",        body:"Update your ticket if the issue changes — the technician will be notified." },
            ].map((tip, i) => (
              <div key={i} style={{ background:"#f8fafc", borderRadius:10, padding:"0.7rem 0.875rem", marginBottom:i<2?8:0, border:"1px solid #f1f5f9" }}>
                <div style={{ fontSize:"0.73rem", fontWeight:700, color:"#334155", marginBottom:2 }}>{tip.icon} {tip.head}</div>
                <div style={{ fontSize:"0.7rem", color:"#94a3b8", lineHeight:1.55 }}>{tip.body}</div>
              </div>
            ))}
          </div>*/}
        </div>
      </div>

      {/* ══ CREATE MODAL ════════════════════════════════════════════════════ */}
      {showCreate && (
        <Modal title="Report an Issue" sub="Fill in the details to submit a maintenance request" onClose={() => setShowCreate(false)}>
          <TicketFormFields form={form} setForm={setForm} resources={resources} />
          {/* file upload */}
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:14 }}>
            <label style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em" }}>Attach Photos</label>
            <input style={{ ...INP, paddingTop:"0.45rem" }} type="file" multiple accept="image/*"
              onChange={e => setForm({ ...form, files:Array.from(e.target.files).slice(0, 3) })} />
            <span style={{ fontSize:"0.7rem", color:"#94a3b8" }}>Max 3 images · JPG / PNG</span>
          </div>
          {form.files.length > 0 && (
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              {form.files.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt="preview"
                  style={{ width:72, height:72, objectFit:"cover", borderRadius:10, border:"1.5px solid #e8edf3" }} />
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:9, marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <PrimaryBtn onClick={createTicket} loading={submitting}>{submitting ? "Submitting…" : "Submit Ticket"}</PrimaryBtn>
            <GhostBtn onClick={() => setShowCreate(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ EDIT TICKET MODAL ═══════════════════════════════════════════════ */}
      {showEdit && selected && (
        <Modal title={`Edit Ticket #${selected.id}`} sub="Update the details of your request" onClose={() => setShowEdit(false)} zIndex={110}>
          <TicketFormFields form={editForm} setForm={setEditForm} resources={resources} />
          <div style={{ display:"flex", gap:9, marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <PrimaryBtn onClick={saveEdit} loading={editSaving}>{editSaving ? "Saving…" : "Save Changes"}</PrimaryBtn>
            <GhostBtn onClick={() => setShowEdit(false)}>Cancel</GhostBtn>
          </div>
        </Modal>
      )}

      {/* ══ DETAIL MODAL ════════════════════════════════════════════════════ */}
      {showDetail && selected && (() => {
        const sc = STATUS_CFG[normStatus(selected.status)]       || STATUS_CFG.OPEN;
        const pc = PRIORITY_CFG[normPriority(selected.priority)] || PRIORITY_CFG.LOW;
        const canEdit = normStatus(selected.status) === "OPEN";

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(10,15,30,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99, padding:20, backdropFilter:"blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
            <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:700, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 40px 100px rgba(0,0,0,0.2)", animation:"fadeUp 0.2s ease" }}>

              {/* modal header */}
              <div style={{ padding:"1.375rem 1.625rem 1.125rem", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, position:"sticky", top:0, background:"#fff", zIndex:2, borderRadius:"20px 20px 0 0" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:"1.05rem", fontWeight:800, color:"#0f172a", letterSpacing:"-0.3px" }}>
                      {selected.title || fmtCategory(selected.category)}
                    </span>
                    <span style={pill(sc.light, sc.color, sc.border)}>{sc.label}</span>
                    <span style={pill(pc.light, pc.color, pc.bar+"44")}>{pc.icon} {pc.label}</span>
                  </div>
                  <div style={{ fontSize:"0.74rem", color:"#94a3b8" }}>
                    #{selected.id} · 📍 {selected.location||"—"} · {fmtCategory(selected.category)}
                  </div>
                </div>
                <button className="xbtn" onClick={() => setShowDetail(false)}
                  style={{ width:30, height:30, borderRadius:8, border:"1px solid #e8edf3", background:"transparent", color:"#94a3b8", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>✕</button>
              </div>

              <div style={{ padding:"1.375rem 1.625rem", display:"flex", flexDirection:"column", gap:16 }}>
                {detailLoading ? (
                  <div style={{ textAlign:"center", padding:"2.5rem", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"#94a3b8" }}>
                    <div style={{ width:18, height:18, border:"2px solid #e2e8f0", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                    Loading details…
                  </div>
                ) : <>

                  {/* meta grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                    {[
                      { lbl:"Technician",  val: selected.assignedToName || "Not yet assigned" },
                      { lbl:"Contact",     val: selected.contactDetails  || "—"               },
                      { lbl:"Submitted",   val: selected.createdAt ? String(selected.createdAt).slice(0,10) : "—" },
                      { lbl:"Resource ID", val: selected.resourceId      || "—"               },
                    ].map(({ lbl, val }) => (
                      <div key={lbl} style={{ background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:10, padding:"0.7rem 0.875rem" }}>
                        <div style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5 }}>{lbl}</div>
                        <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#0f172a" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* description */}
                  <div style={{ background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:10, padding:"0.875rem 1rem" }}>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Description</div>
                    <div style={{ fontSize:"0.83rem", color:"#334155", lineHeight:1.7 }}>
                      {selected.description || "No description provided."}
                    </div>
                  </div>

                  {/* resolution note */}
                  {selected.resolutionNotes && (
                    <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:10, padding:"0.875rem 1rem" }}>
                      <div style={{ fontSize:"0.62rem", fontWeight:800, color:"#16a34a", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>✅ Resolution Note</div>
                      <div style={{ fontSize:"0.83rem", color:"#166534", lineHeight:1.65 }}>{selected.resolutionNotes}</div>
                    </div>
                  )}

                  {/* attachments */}
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 0 10px" }}>
                      Attachments ({attachments.length})
                    </div>
                    {attachments.length > 0 ? (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
                        {attachments.map(a => (
                          <div key={a.id} style={{ position:"relative", borderRadius:12, overflow:"hidden", border:"1.5px solid #e8edf3" }}>
                            <img src={`${import.meta.env.VITE_API_URL}/uploads/${a.fileUrl}`} alt="att"
                              style={{ width:"100%", height:90, objectFit:"cover", cursor:"pointer", display:"block" }}
                              onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL}/uploads/${a.fileUrl}`)} />
                            <button onClick={() => deleteAtt(a.id)}
                              style={{ position:"absolute", top:5, right:5, width:22, height:22, borderRadius:6, background:"rgba(0,0,0,0.65)", color:"#fff", border:"none", cursor:"pointer", fontSize:11, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:"0.8rem", color:"#94a3b8" }}>No attachments yet.</div>
                    )}
                    {attachments.length < 3 && (
                      <div style={{ marginTop:10 }}>
                        <input type="file" accept="image/*" style={{ fontSize:"0.78rem", color:"#64748b" }}
                          onChange={async e => {
                            const file = e.target.files[0]; if (!file) return;
                            try {
                              await api.uploadAttachment(selected.id, file);
                              const updated = await api.getAttachments(selected.id);
                              setAttachments(updated); showToast("Attachment uploaded!");
                            } catch(err) { showToast("Upload failed: " + err.message, true); }
                            e.target.value = "";
                          }} />
                      </div>
                    )}
                  </div>

                  {/* comments */}
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 0 10px" }}>
                      Comments ({comments.length})
                    </div>
                    {comments.length > 0 ? (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:240, overflowY:"auto" }}>
                        {comments.map(c => (
                          <div key={c.id} style={{ background:"#f8fafc", borderRadius:10, padding:"0.75rem 0.875rem", border:"1px solid #f1f5f9" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                              <Avatar name={c.user?.name || c.user?.email} size={24} />
                              <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#6366f1" }}>
                                {c.user?.name || c.user?.email || "User"}
                              </span>
                            </div>
                            {editingCid === c.id ? (
                              <>
                                <textarea style={{ ...INP, minHeight:60, border:"1.5px solid #bfdbfe", background:"#f8faff", marginBottom:6 }}
                                  value={editingCtext} onChange={e => setEditingCtext(e.target.value)} autoFocus />
                                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                  <button onClick={() => setEditingCid(null)} style={{ padding:"4px 12px", borderRadius:7, border:"1px solid #e8edf3", background:"transparent", cursor:"pointer", fontSize:"0.74rem", fontWeight:600, color:"#64748b", fontFamily:"inherit" }}>Cancel</button>
                                  <button onClick={() => saveEditCmt(c.id)} disabled={savingCmt}
                                    style={{ padding:"4px 14px", borderRadius:7, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"#fff", cursor:"pointer", fontSize:"0.74rem", fontWeight:700, fontFamily:"inherit", opacity:savingCmt?0.7:1 }}>
                                    {savingCmt ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize:"0.82rem", color:"#334155", lineHeight:1.55 }}>{c.content}</div>
                                {c.user?.id === CURRENT_USER_ID && (
                                  <div style={{ display:"flex", gap:6, marginTop:8, justifyContent:"flex-end" }}>
                                    <button onClick={() => { setEditingCid(c.id); setEditingCtext(c.content); }}
                                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", fontWeight:700, color:"#6366f1", fontFamily:"inherit", padding:"2px 6px" }}>✎ Edit</button>
                                    <button onClick={() => deleteCmt(c.id)}
                                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", fontWeight:700, color:"#dc2626", fontFamily:"inherit", padding:"2px 6px" }}>✕ Delete</button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:"0.8rem", color:"#94a3b8" }}>No comments yet. Be the first!</div>
                    )}
                  </div>

                  {/* add comment */}
                  <Field label="Add a Comment">
                    <textarea style={{ ...TA, minHeight:76 }} rows={3}
                      placeholder="Write an update or question for the technician…"
                      value={commentText} onChange={e => setCommentText(e.target.value)}
                      onFocus={e => { e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,0.1)"; }}
                      onBlur={e  => { e.target.style.borderColor="#e8edf3";  e.target.style.boxShadow="none"; }} />
                  </Field>
                </>}
              </div>

              {/* modal footer */}
              <div style={{ padding:"0.875rem 1.625rem 1.375rem", display:"flex", gap:9, borderTop:"1px solid #f1f5f9", flexWrap:"wrap" }}>
                <PrimaryBtn onClick={addComment} loading={submitting} disabled={detailLoading}>
                  {submitting ? "Posting…" : "💬 Post Comment"}
                </PrimaryBtn>
                {canEdit && (
                  <button onClick={openEdit}
                    style={{ padding:"0.7rem 1.1rem", background:"transparent", border:"1.5px solid #bfdbfe", borderRadius:10, fontFamily:"inherit", fontSize:"0.82rem", fontWeight:700, color:"#2563eb", cursor:"pointer", transition:"all 0.15s" }}>
                    ✎ Edit Ticket
                  </button>
                )}
                <button onClick={() => deleteTicket(selected.id)}
                  style={{ padding:"0.7rem 1.1rem", background:"transparent", border:"1.5px solid #fecaca", borderRadius:10, fontFamily:"inherit", fontSize:"0.82rem", fontWeight:700, color:"#dc2626", cursor:"pointer", transition:"all 0.15s" }}>
                  🗑 Delete
                </button>
                <button onClick={() => setShowDetail(false)}
                  style={{ padding:"0.7rem 1.1rem", background:"transparent", border:"1.5px solid #e8edf3", borderRadius:10, fontFamily:"inherit", fontSize:"0.82rem", fontWeight:600, color:"#64748b", cursor:"pointer", transition:"all 0.15s" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ IMAGE PREVIEW ═══════════════════════════════════════════════════ */}
      {previewImage && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:9999, display:"flex", justifyContent:"center", alignItems:"center", padding:20, backdropFilter:"blur(6px)" }}
          onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview"
            style={{ maxWidth:"90%", maxHeight:"90%", borderRadius:14, boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setPreviewImage(null)}
            style={{ position:"absolute", top:22, right:22, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:700, color:"#fff", backdropFilter:"blur(4px)", fontFamily:"inherit" }}>
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}

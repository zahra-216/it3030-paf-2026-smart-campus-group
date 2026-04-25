import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:8081/api";

async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
    OPEN:        { color: "#dc2626", light: "#fef2f2", border: "#fecaca", label: "Open",        dot: "#ef4444" },
    IN_PROGRESS: { color: "#2563eb", light: "#eff6ff", border: "#bfdbfe", label: "In Progress", dot: "#3b82f6" },
    RESOLVED:    { color: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", label: "Resolved",    dot: "#22c55e" },
    CLOSED:      { color: "#475569", light: "#f8fafc", border: "#e2e8f0", label: "Closed",      dot: "#94a3b8" },
    REJECTED:    { color: "#ea580c", light: "#fff7ed", border: "#fed7aa", label: "Rejected",    dot: "#f97316" },
};
const PRIORITY_CFG = {
    HIGH:   { color: "#dc2626", light: "#fef2f2", bar: "#ef4444", label: "High",   icon: "🔴" },
    MEDIUM: { color: "#d97706", light: "#fffbeb", bar: "#f59e0b", label: "Medium", icon: "🟡" },
    LOW:    { color: "#16a34a", light: "#f0fdf4", bar: "#22c55e", label: "Low",    icon: "🟢" },
};

const normStatus   = s => s ? String(s).toUpperCase().replace(/ /g, "_") : "OPEN";
const normPriority = p => p ? String(p).toUpperCase() : "LOW";
const fmtCategory  = c => c ? c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "";

const pill = (bg, color, border) => ({
    padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
    background: bg, color, border: `1px solid ${border || "transparent"}`,
    letterSpacing: "0.02em", display: "inline-block",
});

const INP = {
    padding: "0.625rem 0.875rem", border: "1.5px solid #e8edf3", borderRadius: 10,
    fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-text)", background: "var(--color-white)",
    outline: "none", width: "100%", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
};
const TA = { ...INP, resize: "vertical", minHeight: 88, lineHeight: 1.65 };

// ─── SHARED MODAL STYLES ──────────────────────────────────────────────────────
const overlayStyle = {
    position: "fixed", inset: 0, background: "rgba(10,15,30,0.55)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 99, padding: 20, backdropFilter: "blur(4px)",
};
const modalBox     = { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,  maxHeight: "92vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease" };
const modalBoxWide = { ...modalBox, maxWidth: 700 };
const modalHeader  = { padding: "1.375rem 1.625rem 1.125rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "#fff", zIndex: 2, borderRadius: "20px 20px 0 0" };
const closeBtn     = { width: 30, height: 30, borderRadius: 8, border: "1px solid #e8edf3", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" };

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
    const palette  = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];
    const bg       = palette[(name || "U").charCodeAt(0) % palette.length];
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.37, fontWeight: 800, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function Field({ label: lbl, hint, children }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</label>
            {children}
            {hint && <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{hint}</span>}
        </div>
    );
}

// ─── BUTTON PRIMITIVES ────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, loading, disabled, children, style = {} }) {
    return (
        <button onClick={onClick} disabled={loading || disabled}
            style={{ flex: 1, padding: "0.72rem", background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, color: "#fff", cursor: (loading || disabled) ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: (loading || disabled) ? 0.7 : 1, boxShadow: "0 4px 14px rgba(59,130,246,0.3)", ...style }}>
            {children}
        </button>
    );
}
function GhostBtn({ onClick, children }) {
    return (
        <button onClick={onClick}
            style={{ padding: "0.72rem 1.25rem", background: "transparent", border: "1.5px solid #e8edf3", borderRadius: 10, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", cursor: "pointer", transition: "all 0.15s" }}>
            {children}
        </button>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function TechnicianDashboardTickets() {
    const { user, token } = useAuth();
    const { toast, show: showToast } = useToast();

    // ── core state ─────────────────────────────────────────────────────────
    const [myTickets,     setMyTickets]     = useState([]);
    const [loading,       setLoading]       = useState(true);

    // ── detail modal state ─────────────────────────────────────────────────
    const [showDetail,    setShowDetail]    = useState(false);
    const [selected,      setSelected]      = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [comments,      setComments]      = useState([]);
    const [attachments,   setAttachments]   = useState([]);
    const [commentText,   setCommentText]   = useState("");
    const [submitting,    setSubmitting]    = useState(false);
    const [previewImage,  setPreviewImage]  = useState(null);
    const [editingCid,    setEditingCid]    = useState(null);
    const [editingCtext,  setEditingCtext]  = useState("");
    const [savingCmt,     setSavingCmt]     = useState(false);

    // ── status modal state ─────────────────────────────────────────────────
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus,   setPendingStatus]   = useState("");
    const [statusTicket,    setStatusTicket]    = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [statusSaving,    setStatusSaving]    = useState(false);

    // ── API helpers ────────────────────────────────────────────────────────
    const authH = { Authorization: `Bearer ${token}` };
    const api = {
        getAssigned:      ()         => apiFetch(`/tickets/my-assigned/${user?.id}`, { headers: authH }),
        updateStatus:     (id, body) => apiFetch(`/tickets/${id}/technician-update/${user?.id}`, { method: "PUT", body: JSON.stringify(body), headers: authH }),
        getComments:      tid        => apiFetch(`/tickets/${tid}/comments`, { headers: authH }),
        addComment:       (tid, c)   => apiFetch(`/tickets/${tid}/comments/${user?.id}`, { method: "POST", body: JSON.stringify({ content: c }), headers: authH }),
        updateComment:    (cid, c)   => apiFetch(`/tickets/comments/${cid}/user/${user?.id}`, { method: "PUT", body: JSON.stringify({ content: c }), headers: authH }),
        deleteComment:    cid        => apiFetch(`/tickets/comments/${cid}/user/${user?.id}`, { method: "DELETE", headers: authH }),
        getAttachments:   tid        => apiFetch(`/tickets/${tid}/attachments`, { headers: authH }),
        uploadAttachment: (tid, f)   => { const fd = new FormData(); fd.append("file", f); return fetch(`${BASE_URL}/tickets/${tid}/attachments`, { method: "POST", body: fd, headers: { Authorization: `Bearer ${token}` } }).then(r => r.text()); },
        deleteAttachment: id         => apiFetch(`/tickets/attachments/${id}`, { method: "DELETE", headers: authH }),
    };

    // ── load tickets ───────────────────────────────────────────────────────
    const loadTickets = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await api.getAssigned();
            setMyTickets(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast("Failed to load tickets: " + e.message, true);
            setMyTickets([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, token]);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    // ── open detail ────────────────────────────────────────────────────────
    const openDetail = async (t) => {
        setSelected(t);
        setCommentText("");
        setEditingCid(null);
        setShowDetail(true);
        setDetailLoading(true);
        try {
            const [cmts, atts] = await Promise.all([api.getComments(t.id), api.getAttachments(t.id)]);
            setComments(Array.isArray(cmts) ? cmts : []);
            setAttachments(Array.isArray(atts) ? atts : []);
        } catch (e) {
            showToast("Could not load details: " + e.message, true);
        } finally {
            setDetailLoading(false);
        }
    };

    // ── open status modal — enforces strict one-step sequence ──────────────
    const openStatusModal = (ticket, targetStatus) => {
        const current = normStatus(ticket.status);
        if (targetStatus === "IN_PROGRESS" && current !== "OPEN")        return;
        if (targetStatus === "RESOLVED"    && current !== "IN_PROGRESS") return;
        setStatusTicket(ticket);
        setPendingStatus(targetStatus);
        setResolutionNotes("");
        setShowStatusModal(true);
    };

    // ── confirm and save status change ─────────────────────────────────────
    const confirmStatusChange = async () => {
        if (!statusTicket) return;
        if (pendingStatus === "RESOLVED" && !resolutionNotes.trim()) {
            showToast("Resolution notes are required before marking as resolved.", true);
            return;
        }
        setStatusSaving(true);
        try {
            const body = {
                status: pendingStatus,
                ...(pendingStatus === "RESOLVED" && { resolutionNotes: resolutionNotes.trim() }),
            };
            await api.updateStatus(statusTicket.id, body);
            const updated = {
                ...statusTicket,
                status: pendingStatus,
                ...(body.resolutionNotes && { resolutionNotes: body.resolutionNotes }),
            };
            setMyTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
            if (showDetail && selected?.id === updated.id) setSelected(updated);
            setShowStatusModal(false);
            showToast(`Ticket #${statusTicket.id} → ${pendingStatus === "IN_PROGRESS" ? "In Progress" : "Resolved"} ✓`);
        } catch (e) {
            showToast("Failed to update: " + e.message, true);
        } finally {
            setStatusSaving(false);
        }
    };

    // ── render action button (strict sequence) ─────────────────────────────
    const renderActionBtn = (ticket) => {
        const st = normStatus(ticket.status);
        if (st === "OPEN") {
            return (
                <button className="action-btn"
                    onClick={e => { e.stopPropagation(); openStatusModal(ticket, "IN_PROGRESS"); }}
                    style={{ padding: "0.32rem 0.85rem", background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#2563eb", borderRadius: 7, fontSize: "0.73rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                    ▶ Start
                </button>
            );
        }
        if (st === "IN_PROGRESS") {
            return (
                <button className="action-btn"
                    onClick={e => { e.stopPropagation(); openStatusModal(ticket, "RESOLVED"); }}
                    style={{ padding: "0.32rem 0.85rem", background: "linear-gradient(135deg,#16a34a,#059669)", border: "none", color: "#fff", borderRadius: 7, fontSize: "0.73rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap", boxShadow: "0 3px 10px rgba(22,163,74,0.25)" }}>
                    Mark Resolved
                </button>
            );
        }
        if (st === "RESOLVED") {
            return <span style={{ fontSize: "0.73rem", color: "#059669", fontWeight: 700 }}>✓ Resolved</span>;
        }
        return <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>{STATUS_CFG[st]?.label || st}</span>;
    };

    // ── comments ───────────────────────────────────────────────────────────
    const addComment = async () => {
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const c = await api.addComment(selected.id, commentText);
            setComments(prev => [...prev, c]);
            setCommentText("");
        } catch (e) { showToast("Failed to post: " + e.message, true); }
        finally     { setSubmitting(false); }
    };

    const saveEditCmt = async (cid) => {
        if (!editingCtext.trim()) return;
        setSavingCmt(true);
        try {
            const updated = await api.updateComment(cid, editingCtext);
            setComments(prev => prev.map(c => c.id === cid ? { ...c, content: updated.content ?? editingCtext } : c));
            setEditingCid(null);
            showToast("Comment updated successfully!");
        } catch (e) { showToast("Failed to update: " + e.message, true); }
        finally     { setSavingCmt(false); }
    };

    const deleteCmt = async (cid) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await api.deleteComment(cid);
            setComments(prev => prev.filter(c => c.id !== cid));
            showToast("Comment deleted successfully.");
        } catch (e) { showToast("Failed to delete: " + e.message, true); }
    };

    // ── attachments ────────────────────────────────────────────────────────
    const deleteAtt = async (id) => {
        if (!window.confirm("Are you sure you want to delete this attachment?")) return;
        try {
            await api.deleteAttachment(id);
            setAttachments(prev => prev.filter(a => a.id !== id));
            showToast("Attachment deleted.");
        } catch (e) { showToast("Failed to delete: " + e.message, true); }
    };

    // ══════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════
    return (
        <div style={styles.page}>
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .tkrow:hover  { background: #f8faff !important; }
                .xbtn:hover   { background: #f1f5f9 !important; color: #475569 !important; }
                .action-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
            `}</style>

            {/* ── TOAST ─────────────────────────────────────────────────────── */}
            {toast && (
                <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.isError ? "#dc2626" : "#0f172a", color: "#fff", padding: "0.875rem 1.375rem", borderRadius: 14, fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxWidth: 360, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.25s ease" }}>
                    <span>{toast.isError ? "⚠️" : "✓"}</span>
                    {toast.msg}
                </div>
            )}

            {/* ── TICKETS TABLE ─────────────────────────────────────────────── */}
            <div style={styles.card}>
                <div style={styles.cardHead}>
                    <div>
                        <h2 style={styles.cardTitle}>My Assigned Tickets</h2>
                        <p style={styles.cardSub}>Click a row for full details · Use the action button to progress each ticket step by step</p>
                    </div>
                    <button onClick={loadTickets}
                        style={{ padding: "0.45rem 0.875rem", background: "var(--color-off-white)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-light)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        ↻ Refresh
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
                        <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Loading tickets…
                    </div>
                ) : myTickets.length === 0 ? (
                    <div style={{ padding: "3.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: 4 }}>No tickets assigned yet</div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Check back later or ask your admin to assign tickets.</div>
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {["ID", "ISSUE", "LOCATION", "CATEGORY", "PRIORITY", "STATUS", "ACTION"].map(h => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {myTickets.map(t => {
                                const sc = STATUS_CFG[normStatus(t.status)]       || STATUS_CFG.OPEN;
                                const pc = PRIORITY_CFG[normPriority(t.priority)] || PRIORITY_CFG.LOW;
                                return (
                                    <tr key={t.id} className="tkrow"
                                        style={{ ...styles.tr, cursor: "pointer" }}
                                        onClick={() => openDetail(t)}>
                                        <td style={{ ...styles.td, color: "var(--color-text-light)", fontFamily: "monospace", fontSize: "0.8rem" }}>#{t.id}</td>
                                        <td style={{ ...styles.td, fontWeight: 600, color: "var(--color-text)", maxWidth: 200 }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {t.title || t.issue || fmtCategory(t.category)}
                                            </div>
                                        </td>
                                        <td style={{ ...styles.td, color: "var(--color-text-light)" }}>{t.location}</td>
                                        <td style={styles.td}><span style={styles.categoryPill}>{t.category}</span></td>
                                        <td style={styles.td}><span style={pill(pc.light, pc.color, pc.bar + "44")}>{pc.icon} {pc.label}</span></td>
                                        <td style={styles.td}><span style={pill(sc.light, sc.color, sc.border)}>{sc.label}</span></td>
                                        <td style={styles.td} onClick={e => e.stopPropagation()}>
                                            {renderActionBtn(t)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                STATUS CHANGE MODAL
            ══════════════════════════════════════════════════════════════════ */}
            {showStatusModal && statusTicket && (
                <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setShowStatusModal(false)}>
                    <div style={modalBox}>
                        <div style={modalHeader}>
                            <div>
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                    {pendingStatus === "IN_PROGRESS" ? "▶ Start Working on Ticket" : "✅ Mark Ticket as Resolved"}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3 }}>
                                    #{statusTicket.id} · {statusTicket.title || fmtCategory(statusTicket.category)} · 📍 {statusTicket.location}
                                </div>
                            </div>
                            <button className="xbtn" onClick={() => setShowStatusModal(false)} style={closeBtn}>✕</button>
                        </div>

                        <div style={{ padding: "1.375rem 1.625rem", display: "flex", flexDirection: "column", gap: 16 }}>
                            {pendingStatus === "IN_PROGRESS" && (
                                <>
                                    <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "1rem 1.125rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>
                                            Confirm you're starting this ticket
                                        </div>
                                        <p style={{ fontSize: "0.82rem", color: "#3b82f6", margin: 0, lineHeight: 1.65 }}>
                                            Status will change from <strong>Open → In Progress</strong>. The requester will be notified that work has begun.
                                        </p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                                        {[
                                            { lbl: "Location",  val: statusTicket.location              || "—" },
                                            { lbl: "Category",  val: fmtCategory(statusTicket.category)       },
                                            { lbl: "Priority",  val: normPriority(statusTicket.priority)       },
                                            { lbl: "Submitted", val: statusTicket.createdAt ? String(statusTicket.createdAt).slice(0, 10) : "—" },
                                        ].map(({ lbl, val }) => (
                                            <div key={lbl} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "0.65rem 0.875rem" }}>
                                                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{lbl}</div>
                                                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {pendingStatus === "RESOLVED" && (
                                <>
                                    <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "1rem 1.125rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534", marginBottom: 6 }}>
                                            Marking ticket as Resolved
                                        </div>
                                        <p style={{ fontSize: "0.82rem", color: "#16a34a", margin: 0, lineHeight: 1.65 }}>
                                            Status will change from <strong>In Progress → Resolved</strong>. Please describe what you did so the requester and admin can see your work.
                                        </p>
                                    </div>
                                    <Field label="Resolution Notes *" hint="Required — describe what was done to fix the issue">
                                        <textarea
                                            style={{ ...TA, minHeight: 110 }}
                                            placeholder="e.g. Replaced the faulty projector bulb. Tested display — now working correctly. Cleaned lens and updated firmware."
                                            value={resolutionNotes}
                                            onChange={e => setResolutionNotes(e.target.value)}
                                            onFocus={e => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.1)"; }}
                                            onBlur={e  => { e.target.style.borderColor = "#e8edf3"; e.target.style.boxShadow = "none"; }}
                                            autoFocus
                                        />
                                    </Field>
                                </>
                            )}

                            <div style={{ display: "flex", gap: 9, paddingTop: 4 }}>
                                <PrimaryBtn
                                    onClick={confirmStatusChange}
                                    loading={statusSaving}
                                    style={pendingStatus === "RESOLVED"
                                        ? { background: "linear-gradient(135deg,#16a34a,#059669)", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }
                                        : {}}>
                                    {statusSaving
                                        ? "Saving…"
                                        : pendingStatus === "IN_PROGRESS"
                                            ? "▶ Confirm — Start Working"
                                            : "✅ Confirm — Mark Resolved"}
                                </PrimaryBtn>
                                <GhostBtn onClick={() => setShowStatusModal(false)}>Cancel</GhostBtn>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TICKET DETAIL MODAL
            ══════════════════════════════════════════════════════════════════ */}
            {showDetail && selected && (() => {
                const sc = STATUS_CFG[normStatus(selected.status)] || STATUS_CFG.OPEN;
                const pc = PRIORITY_CFG[normPriority(selected.priority)] || PRIORITY_CFG.LOW;
                const st = normStatus(selected.status);
                return (
                    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
                        <div style={modalBoxWide}>
                            <div style={modalHeader}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                                            {selected.title || fmtCategory(selected.category)}
                                        </span>
                                        <span style={pill(sc.light, sc.color, sc.border)}>{sc.label}</span>
                                        <span style={pill(pc.light, pc.color, pc.bar + "44")}>{pc.icon} {pc.label}</span>
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                                        #{selected.id} · 📍 {selected.location || "—"} · {fmtCategory(selected.category)}
                                    </div>
                                </div>
                                <button className="xbtn" onClick={() => setShowDetail(false)} style={closeBtn}>✕</button>
                            </div>

                            <div style={{ padding: "1.375rem 1.625rem", display: "flex", flexDirection: "column", gap: 16 }}>
                                {detailLoading ? (
                                    <div style={{ textAlign: "center", padding: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
                                        <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                        Loading details…
                                    </div>
                                ) : <>
                                    {(st === "OPEN" || st === "IN_PROGRESS") && (
                                        <div style={{
                                            background: st === "OPEN" ? "#eff6ff" : "#f0fdf4",
                                            border: `1.5px solid ${st === "OPEN" ? "#bfdbfe" : "#bbf7d0"}`,
                                            borderRadius: 12, padding: "0.875rem 1.125rem",
                                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                                        }}>
                                            <div>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: st === "OPEN" ? "#1e40af" : "#166534", marginBottom: 2 }}>
                                                    {st === "OPEN" ? "Ready to start working?" : "Issue fixed? Mark it resolved."}
                                                </div>
                                                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                                                    {st === "OPEN"
                                                        ? "Move this ticket to In Progress to notify the requester you're on it."
                                                        : "Add your resolution notes and complete this ticket."}
                                                </div>
                                            </div>
                                            <button
                                                style={{
                                                    padding: "0.5rem 1.125rem",
                                                    background: st === "OPEN" ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "linear-gradient(135deg,#16a34a,#059669)",
                                                    border: "none", borderRadius: 9, color: "#fff",
                                                    fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                                                    fontFamily: "inherit", whiteSpace: "nowrap",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)", flexShrink: 0,
                                                }}
                                                onClick={() => { setShowDetail(false); openStatusModal(selected, st === "OPEN" ? "IN_PROGRESS" : "RESOLVED"); }}>
                                                {st === "OPEN" ? "▶ In Progress →" : "✅ Mark Resolved →"}
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                                        {[
                                            { lbl: "Reported By",  val: selected.reportedByName || selected.createdByName || "—" },
                                            { lbl: "Contact",      val: selected.contactDetails  || "—" },
                                            { lbl: "Submitted",    val: selected.createdAt ? String(selected.createdAt).slice(0, 10) : "—" },
                                            { lbl: "Resource ID",  val: selected.resourceId      || "—" },
                                        ].map(({ lbl, val }) => (
                                            <div key={lbl} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "0.7rem 0.875rem" }}>
                                                <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{lbl}</div>
                                                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "0.875rem 1rem" }}>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Description</div>
                                        <div style={{ fontSize: "0.83rem", color: "#334155", lineHeight: 1.7 }}>
                                            {selected.description || "No description provided."}
                                        </div>
                                    </div>

                                    {selected.resolutionNotes && (
                                        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "0.875rem 1rem" }}>
                                            <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>✅ Resolution Notes</div>
                                            <div style={{ fontSize: "0.83rem", color: "#166534", lineHeight: 1.65 }}>{selected.resolutionNotes}</div>
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 0 10px" }}>
                                            Attachments ({attachments.length})
                                        </div>
                                        {attachments.length > 0 ? (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10 }}>
                                                {attachments.map(a => (
                                                    <div key={a.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid #e8edf3" }}>
                                                        <img
                                                            src={`http://localhost:8081/uploads/${a.fileUrl}`}
                                                            alt="attachment"
                                                            style={{ width: "100%", height: 90, objectFit: "cover", cursor: "pointer", display: "block" }}
                                                            onClick={() => setPreviewImage(`http://localhost:8081/uploads/${a.fileUrl}`)}
                                                        />
                                                        <button onClick={() => deleteAtt(a.id)}
                                                            style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No attachments on this ticket.</div>
                                        )}
                                        {attachments.length < 5 && (
                                            <div style={{ marginTop: 10 }}>
                                                <label style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Add a photo:</label>
                                                <input type="file" accept="image/*"
                                                    style={{ display: "block", marginTop: 4, fontSize: "0.78rem", color: "#64748b" }}
                                                    onChange={async e => {
                                                        const file = e.target.files[0]; if (!file) return;
                                                        try {
                                                            await api.uploadAttachment(selected.id, file);
                                                            const updated = await api.getAttachments(selected.id);
                                                            setAttachments(updated);
                                                            showToast("Attachment uploaded successfully!");
                                                        } catch (err) {
                                                            showToast("Upload failed: " + err.message, true);
                                                        }
                                                        e.target.value = "";
                                                    }} />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 0 10px" }}>
                                            Comments ({comments.length})
                                        </div>
                                        {comments.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                                                {comments.map(c => (
                                                    <div key={c.id} style={{ background: "#f8fafc", borderRadius: 10, padding: "0.75rem 0.875rem", border: "1px solid #f1f5f9" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                                                            <Avatar name={c.user?.name || c.user?.email} size={24} />
                                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6366f1" }}>
                                                                {c.user?.name || c.user?.email || "User"}
                                                            </span>
                                                        </div>
                                                        {editingCid === c.id ? (
                                                            <>
                                                                <textarea style={{ ...INP, minHeight: 60, border: "1.5px solid #bfdbfe", background: "#f8faff", marginBottom: 6 }}
                                                                    value={editingCtext} onChange={e => setEditingCtext(e.target.value)} autoFocus />
                                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                    <button onClick={() => setEditingCid(null)} style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid #e8edf3", background: "transparent", cursor: "pointer", fontSize: "0.74rem", fontWeight: 600, color: "#64748b", fontFamily: "inherit" }}>Cancel</button>
                                                                    <button onClick={() => saveEditCmt(c.id)} disabled={savingCmt}
                                                                        style={{ padding: "4px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", cursor: "pointer", fontSize: "0.74rem", fontWeight: 700, fontFamily: "inherit", opacity: savingCmt ? 0.7 : 1 }}>
                                                                        {savingCmt ? "Saving…" : "Save"}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.55 }}>{c.content}</div>
                                                                {c.user?.id === user?.id && (
                                                                    <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                                                                        <button onClick={() => { setEditingCid(c.id); setEditingCtext(c.content); }}
                                                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, color: "#6366f1", fontFamily: "inherit", padding: "2px 6px" }}>✎ Edit</button>
                                                                        <button onClick={() => deleteCmt(c.id)}
                                                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", fontFamily: "inherit", padding: "2px 6px" }}>✕ Delete</button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No comments yet.</div>
                                        )}
                                    </div>

                                    <Field label="Add a Comment">
                                        <textarea style={{ ...TA, minHeight: 76 }} rows={3}
                                            placeholder="Write an update or note for the requester…"
                                            value={commentText} onChange={e => setCommentText(e.target.value)}
                                            onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                                            onBlur={e  => { e.target.style.borderColor = "#e8edf3";  e.target.style.boxShadow = "none"; }} />
                                    </Field>
                                </>}
                            </div>

                            <div style={{ padding: "0.875rem 1.625rem 1.375rem", display: "flex", gap: 9, borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                                <PrimaryBtn onClick={addComment} loading={submitting} disabled={detailLoading || !commentText.trim()}>
                                    {submitting ? "Posting…" : "💬 Post Comment"}
                                </PrimaryBtn>
                                {(st === "OPEN" || st === "IN_PROGRESS") && (
                                    <button
                                        style={{
                                            padding: "0.7rem 1.1rem", background: "transparent",
                                            border: `1.5px solid ${st === "OPEN" ? "#bfdbfe" : "#bbf7d0"}`,
                                            borderRadius: 10, fontFamily: "inherit", fontSize: "0.82rem",
                                            fontWeight: 700, color: st === "OPEN" ? "#2563eb" : "#16a34a",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}
                                        onClick={() => { setShowDetail(false); openStatusModal(selected, st === "OPEN" ? "IN_PROGRESS" : "RESOLVED"); }}>
                                        {st === "OPEN" ? "▶ In Progress →" : "✅ Mark Resolved →"}
                                    </button>
                                )}
                                <button onClick={() => setShowDetail(false)}
                                    style={{ padding: "0.7rem 1.1rem", background: "transparent", border: "1.5px solid #e8edf3", borderRadius: 10, fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── IMAGE PREVIEW ─────────────────────────────────────────────── */}
            {previewImage && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20, backdropFilter: "blur(6px)" }}
                    onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="preview"
                        style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
                    <button onClick={() => setPreviewImage(null)}
                        style={{ position: "absolute", top: 22, right: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontWeight: 700, color: "#fff", backdropFilter: "blur(4px)", fontFamily: "inherit" }}>
                        ✕ Close
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── PAGE STYLES ──────────────────────────────────────────────────────────────
const styles = {
    page: { display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "var(--font-body)" },

    card:     { backgroundColor: "var(--color-white)", borderRadius: 14, border: "1px solid var(--color-border)", overflow: "hidden" },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" },
    cardTitle:{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" },
    cardSub:  { fontSize: "0.78rem", color: "var(--color-text-light)", marginTop: 2 },

    table: { width: "100%", borderCollapse: "collapse" },
    th:    { textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-light)", letterSpacing: "0.07em", padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-off-white)" },
    tr:    { borderBottom: "1px solid var(--color-light-gray)" },
    td:    { padding: "0.875rem 1rem", fontSize: "0.85rem" },

    categoryPill: { fontSize: "0.68rem", fontWeight: 600, backgroundColor: "var(--color-off-white)", color: "var(--color-text-light)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
};
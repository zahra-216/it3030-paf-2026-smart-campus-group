import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function TicketsDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    const [comment, setComment] = useState("");

    useEffect(() => {
        fetchTicket();
    }, []);

    const fetchTicket = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const res = await axios.get(
                `http://localhost:8080/api/tickets/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTicket(res.data);
        } catch (error) {
            console.log(error);
            alert("Failed to load ticket");
        } finally {
            setLoading(false);
        }
    };

    const addComment = async () => {
        if (!comment.trim()) return;

        try {
            const token = localStorage.getItem("token");

            await axios.post(
                `http://localhost:8080/api/comments/ticket/${id}`,
                { content: comment },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setComment("");
            fetchTicket();
        } catch (error) {
            console.log(error);
            alert("Failed to add comment");
        }
    };

    const styles = {
        page: {
            minHeight: "100vh",
            background: "#f5f7fb",
            padding: "30px"
        },

        topBar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
        },

        title: {
            fontSize: "30px",
            fontWeight: "700",
            color: "#111827"
        },

        backBtn: {
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: "600"
        },

        card: {
            background: "#ffffff",
            borderRadius: "18px",
            padding: "25px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: "20px"
        },

        label: {
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "4px"
        },

        value: {
            fontSize: "16px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "16px"
        },

        desc: {
            lineHeight: "1.6",
            color: "#374151"
        },

        status: {
            display: "inline-block",
            padding: "7px 14px",
            borderRadius: "999px",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600"
        },

        commentBox: {
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: "15px",
            boxSizing: "border-box",
            marginBottom: "12px"
        },

        button: {
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            padding: "12px 18px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600"
        },

        commentCard: {
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "14px",
            marginBottom: "12px"
        },

        small: {
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "6px"
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "OPEN":
                return "#ef4444";
            case "IN_PROGRESS":
                return "#f59e0b";
            case "RESOLVED":
                return "#22c55e";
            case "CLOSED":
                return "#6b7280";
            case "REJECTED":
                return "#111827";
            default:
                return "#2563eb";
        }
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <p>Loading ticket...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div style={styles.page}>
                <p>Ticket not found</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            {/* Top */}
            <div style={styles.topBar}>
                <h1 style={styles.title}>
                    Ticket #{ticket.id}
                </h1>

                <button
                    style={styles.backBtn}
                    onClick={() => navigate("/tickets")}
                >
                    Back
                </button>
            </div>

            {/* Ticket Details */}
            <div style={styles.card}>

                <div style={styles.label}>Status</div>
                <div style={styles.value}>
                    <span
                        style={{
                            ...styles.status,
                            background: getStatusColor(ticket.status)
                        }}
                    >
                        {ticket.status}
                    </span>
                </div>

                <div style={styles.label}>Category</div>
                <div style={styles.value}>
                    {ticket.category}
                </div>

                <div style={styles.label}>Priority</div>
                <div style={styles.value}>
                    {ticket.priority}
                </div>

                <div style={styles.label}>Preferred Contact</div>
                <div style={styles.value}>
                    {ticket.preferredContact}
                </div>

                <div style={styles.label}>Description</div>
                <div style={styles.desc}>
                    {ticket.description}
                </div>

            </div>

            {/* Comments */}
            <div style={styles.card}>
                <h2 style={{ marginBottom: "18px" }}>
                    Comments
                </h2>

                <textarea
                    rows="3"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) =>
                        setComment(e.target.value)
                    }
                    style={styles.commentBox}
                />

                <button
                    style={styles.button}
                    onClick={addComment}
                >
                    Add Comment
                </button>

                <div style={{ marginTop: "20px" }}>

                    {ticket.comments &&
                    ticket.comments.length > 0 ? (
                        ticket.comments.map((item) => (
                            <div
                                key={item.id}
                                style={styles.commentCard}
                            >
                                <div style={styles.small}>
                                    {item.userName ||
                                        "User"}
                                </div>

                                <div>
                                    {item.content}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p
                            style={{
                                color: "#6b7280"
                            }}
                        >
                            No comments yet
                        </p>
                    )}

                </div>
            </div>

        </div>
    );
}

export default TicketsDetailsPage;
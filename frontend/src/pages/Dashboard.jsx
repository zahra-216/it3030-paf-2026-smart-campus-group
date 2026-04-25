import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";
import AdminDashboard from "./dashboard/AdminDashboard";
import UserDashboard from "./dashboard/UserDashboard";
import NotificationsPage from "./NotificationsPage";
import UsersAndRolesPage from "./UsersAndRolesPage";
import AdminResourcesPage from "./AdminResourcesPage";
import UserResourcesPage from "./UserResourcesPage";
import TechnicianDashboard from "./dashboard/TechnicianDashboard";
import TicketsPage from "./TicketsPage";


export default function Dashboard() {
    const { user } = useAuth();
    const [activePage, setActivePage] = useState("dashboard");

    const isAdmin = user?.role === "ADMIN";

    const renderPage = () => {
        switch (activePage) {
            case "dashboard":
                if (user?.role === "ADMIN") return <AdminDashboard />;
                if (user?.role === "TECHNICIAN") return <TechnicianDashboard />;
                return <UserDashboard />;
            case "resources":
                return isAdmin ? <AdminResourcesPage /> : <UserResourcesPage />;
            case "notifications":
                return <NotificationsPage />;
            case "users":
                return <UsersAndRolesPage />;
            case "tickets":
                return <TicketsPage />;    
            default:
                return (
                    <div style={styles.empty}>
                        <p style={styles.emptyIcon}>🚧</p>
                        <p style={styles.emptyTitle}>Coming Soon</p>
                        <p style={styles.emptyHint}>This module is under development</p>
                    </div>
                );
        }
    };

    return (
        <PageLayout activePage={activePage} setActivePage={setActivePage}>
            {renderPage()}
        </PageLayout>
    );
}

const styles = {
    empty: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: "4rem",
        border: "1px solid #E5E7EB",
        textAlign: "center",
    },
    emptyIcon: { fontSize: "2.5rem", marginBottom: 12 },
    emptyTitle: { fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: 4, fontFamily: "var(--font-body)" },
    emptyHint: { fontSize: "0.85rem", color: "#6B7280" },
};
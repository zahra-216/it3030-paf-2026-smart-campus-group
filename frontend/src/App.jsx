import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import OAuthCallback from "./pages/OAuthCallback";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <Router>
        <ToastContainer position="top-right" autoClose={3000} />
      <Routes>

        {/* LOGIN */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* OAUTH CALLBACK */}
        <Route path="/oauth2/callback" element={<OAuthCallback />} />

        {/* DEFAULT FIXED */}
        <Route path="*" element={<Navigate to="/dashboard" />} />

      </Routes>
    </Router>
  );
}

export default App;
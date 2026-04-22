import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import OAuthCallback from "./pages/OAuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth2/callback" element={<OAuthCallback />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route path="/" element={<Navigate to="/login" />} />
	        <Route path="*" element={<Navigate to="/login" />} />            
        </Routes>
    );
}

export default App;
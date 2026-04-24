import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({
      id: 1,
      name: "Admin",
      role: "admin"
    });
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            axios.get("http://localhost:8081/api/auth/me", {
                headers: { Authorization: `Bearer ${storedToken}` }
            })
            .then((response) => { setUser(response.data); })
            .catch(() => { localStorage.removeItem("token"); setToken(null); setUser(null); })
            .finally(() => { setLoading(false); });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (newToken) => { localStorage.setItem("token", newToken); setToken(newToken); };
    const logout = () => { localStorage.removeItem("token"); setToken(null); setUser(null); };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
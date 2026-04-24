import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = "http://localhost:8081";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {

            axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

            axios.get(`${API}/api/auth/me`)
                .then((response) => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });

        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
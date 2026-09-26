import { createContext, useContext, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        try {
            const t = localStorage.getItem("token");
            if (!t) return null;
            const payload = JSON.parse(atob(t.split(".")[1]));
            return { id: payload.sub };
        } catch {
            return null;
        }
    });

    const login = useCallback(async (login_id, password) => {
        try {
            const { data } = await api.post("/auth/login", { login_id, password });
            localStorage.setItem("token", data.access_token);
            setToken(data.access_token);
            const payload = JSON.parse(atob(data.access_token.split(".")[1]));
            setUser({ id: payload.sub });
            return { success: true, data };
        } catch (error) {
            console.error("Login error:", error.response?.data);
            throw new Error(error.response?.data?.detail || "Login failed");
        }
    }, []);

    const signup = useCallback(async (login_id, email, password) => {
        try {
            const { data } = await api.post("/auth/signup", { login_id, email, password });
            return { success: true, data };
        } catch (error) {
            console.error("Signup error:", error.response?.data);
            throw new Error(error.response?.data?.detail || "Signup failed");
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

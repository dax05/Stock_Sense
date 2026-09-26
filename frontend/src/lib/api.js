import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - automatically add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);

// Response interceptor - global error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Log detailed error information
        if (error.response) {
            // Server responded with error status
            console.error("API Error Response:", {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url,
                method: error.config?.method,
            });
        } else if (error.request) {
            // Request was made but no response received
            console.error("API Network Error:", {
                message: error.message,
                url: error.config?.url,
                method: error.config?.method,
            });
        } else {
            // Something else happened
            console.error("API Setup Error:", error.message);
        }

        // Auto-logout on 401 (authentication failed)
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

// Connectivity test function
export const testConnectivity = async () => {
    try {
        const response = await api.get("/ping");
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.detail || error.message || "Connection failed"
        };
    }
};

export default api;
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const successMsg = location.state?.message || "";

    const [form, setForm] = useState({ login_id: "", password: "" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    function validate() {
        const e = {};
        if (!form.login_id) e.login_id = "Login ID is required";
        if (!form.password) e.password = "Password is required";
        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const e2 = validate();
        if (Object.keys(e2).length) { setErrors(e2); return; }
        setErrors({});
        setApiError("");
        setLoading(true);
        try {
            await login(form.login_id, form.password);
            navigate("/dashboard");
        } catch (err) {
            console.error("Login error:", err);
            setApiError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-sm text-slate-600 mb-6">Sign in to your CoreInventory account</p>

            {successMsg && (
                <div className="alert-success mb-4">
                    <span>{successMsg}</span>
                </div>
            )}

            {apiError && (
                <div className="alert-error mb-4">
                    <span>{apiError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Login ID" error={errors.login_id}>
                    <input
                        className="input-field"
                        placeholder="e.g. admin1"
                        value={form.login_id}
                        onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <div className="relative">
                        <input
                            type={showPw ? "text" : "password"}
                            className="input-field pr-10"
                            placeholder="••••••••"
                            maxLength={70}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </Field>

                <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                    Sign up
                </Link>
            </p>
        </AuthShell>
    );
}

// ── Shared Components ──────────────────────────────────────────────────

export function AuthShell({ children }) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-card mb-4">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="4" width="10" height="10" rx="3" fill="white" fillOpacity="0.95" />
                            <rect x="18" y="4" width="10" height="10" rx="3" fill="white" fillOpacity="0.7" />
                            <rect x="4" y="18" width="10" height="10" rx="3" fill="white" fillOpacity="0.7" />
                            <rect x="18" y="18" width="10" height="10" rx="3" fill="white" fillOpacity="0.95" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">CoreInventory</h1>
                        <p className="text-sm text-slate-600 mt-1">Professional Inventory Management</p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="card p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">{label}</label>
            {children}
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
    );
}

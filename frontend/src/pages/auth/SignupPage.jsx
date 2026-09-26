import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AuthShell, Field } from "./LoginPage";

export default function SignupPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ login_id: "", email: "", password: "", confirm: "" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    function validate() {
        const e = {};
        if (!form.login_id) {
            e.login_id = "Login ID is required";
        } else if (form.login_id.length < 6 || form.login_id.length > 12) {
            e.login_id = "Login ID must be 6–12 characters";
        }
        if (!form.email) {
            e.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            e.email = "Enter a valid email address";
        }
        if (!form.password) {
            e.password = "Password is required";
        } else if (form.password.length < 8) {
            e.password = "Password must be 8+ characters";
        } else if (form.password.length > 70) {
            e.password = "Password must be 70 characters or less";
        }
        if (!form.confirm) {
            e.confirm = "Please confirm your password";
        } else if (form.password !== form.confirm) {
            e.confirm = "Passwords do not match";
        }
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
            await signup(form.login_id, form.email, form.password);
            navigate("/login", { state: { message: "Account created successfully! Please sign in." } });
        } catch (err) {
            console.error("Signup error:", err);
            setApiError(err.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <AuthShell>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Create an account</h2>
            <p className="text-sm text-slate-600 mb-6">Get started with CoreInventory</p>

            {apiError && (
                <div className="alert-error mb-4">
                    <span>{apiError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Login ID" error={errors.login_id}>
                    <input
                        className="input-field"
                        placeholder="6–12 characters (e.g. john01)"
                        value={form.login_id}
                        onChange={set("login_id")}
                    />
                </Field>

                <Field label="Email" error={errors.email}>
                    <input
                        type="email"
                        className="input-field"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={set("email")}
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <div className="relative">
                        <input
                            type={showPw ? "text" : "password"}
                            className="input-field pr-10"
                            placeholder="Min. 8 characters"
                            maxLength={70}
                            value={form.password}
                            onChange={set("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </Field>

                <Field label="Re-enter Password" error={errors.confirm}>
                    <input
                        type="password"
                        className="input-field"
                        placeholder="Repeat your password"
                        maxLength={70}
                        value={form.confirm}
                        onChange={set("confirm")}
                    />
                </Field>

                <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthShell>
    );
}

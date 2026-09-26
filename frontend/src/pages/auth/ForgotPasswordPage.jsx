import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { AuthShell, Field } from "./LoginPage";
import api from "../../lib/api";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [form, setForm] = useState({
        email: "",
        otp_code: "",
        new_password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Request OTP
    function validateEmail() {
        const e = {};
        if (!form.email) {
            e.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            e.email = "Invalid email format";
        }
        return e;
    }

    async function handleRequestOTP(e) {
        e.preventDefault();
        const e2 = validateEmail();
        if (Object.keys(e2).length) {
            setErrors(e2);
            return;
        }
        setErrors({});
        setApiError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/forgot-password", {
                email: form.email,
            });
            setStep(2);
        } catch (err) {
            console.error("Forgot password error:", err);
            setApiError(
                err.response?.data?.detail || "Failed to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // Step 2: Verify OTP
    function validateOTP() {
        const e = {};
        if (!form.otp_code) {
            e.otp_code = "OTP is required";
        } else if (!/^\d{6}$/.test(form.otp_code)) {
            e.otp_code = "OTP must be 6 digits";
        }
        return e;
    }

    async function handleVerifyOTP(e) {
        e.preventDefault();
        const e2 = validateOTP();
        if (Object.keys(e2).length) {
            setErrors(e2);
            return;
        }
        setErrors({});
        setApiError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/verify-otp", {
                email: form.email,
                otp_code: form.otp_code,
            });
            setStep(3);
        } catch (err) {
            console.error("Verify OTP error:", err);
            setApiError(
                err.response?.data?.detail || "Invalid or expired OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // Step 3: Reset Password
    function validatePassword() {
        const e = {};
        if (!form.new_password) {
            e.new_password = "Password is required";
        } else if (form.new_password.length < 6) {
            e.new_password = "Password must be at least 6 characters";
        }
        if (!form.confirm_password) {
            e.confirm_password = "Please confirm your password";
        } else if (form.new_password !== form.confirm_password) {
            e.confirm_password = "Passwords do not match";
        }
        return e;
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        const e2 = validatePassword();
        if (Object.keys(e2).length) {
            setErrors(e2);
            return;
        }
        setErrors({});
        setApiError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/reset-password", {
                email: form.email,
                otp_code: form.otp_code,
                new_password: form.new_password,
            });
            // Success - redirect to login with success message
            navigate("/login", {
                state: {
                    message: "Password reset successfully! Please login with your new password.",
                },
            });
        } catch (err) {
            console.error("Reset password error:", err);
            setApiError(
                err.response?.data?.detail || "Failed to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    // Resend OTP
    async function handleResendOTP() {
        setApiError("");
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", {
                email: form.email,
            });
            setApiError(""); // Clear any previous errors
            // Show success feedback (you could add a success message state)
        } catch (err) {
            setApiError("Failed to resend OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell>
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to login
                </Link>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {step === 1 && "Forgot Password?"}
                    {step === 2 && "Verify OTP"}
                    {step === 3 && "Set New Password"}
                </h2>
                <p className="text-sm text-slate-600">
                    {step === 1 && "Enter your email to receive a verification code"}
                    {step === 2 && "Enter the 6-digit code sent to your email"}
                    {step === 3 && "Create a strong password for your account"}
                </p>
            </div>

            {/* Error Message */}
            {apiError && (
                <div className="alert-error mb-4">
                    <span>{apiError}</span>
                </div>
            )}

            {/* Step 1: Email Input */}
            {step === 1 && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                    <Field label="Email Address" error={errors.email}>
                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="email"
                                className="input-field pl-10"
                                placeholder="your.email@example.com"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                autoFocus
                            />
                        </div>
                    </Field>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            "Send OTP"
                        )}
                    </button>
                </form>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg mb-4">
                        <p className="text-xs text-slate-600">
                            Code sent to:{" "}
                            <span className="font-medium text-slate-900">
                                {form.email}
                            </span>
                        </p>
                    </div>

                    <Field label="Enter OTP Code" error={errors.otp_code}>
                        <input
                            type="text"
                            className="input-field text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                            maxLength={6}
                            value={form.otp_code}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    otp_code: e.target.value.replace(/\D/g, ""),
                                })
                            }
                            autoFocus
                        />
                    </Field>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            "Verify OTP"
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-sm text-primary hover:underline"
                            disabled={loading}
                        >
                            Didn't receive code? Resend
                        </button>
                    </div>
                </form>
            )}

            {/* Step 3: New Password Input */}
            {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-lg mb-4 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <p className="text-xs text-green-700">
                            OTP verified successfully
                        </p>
                    </div>

                    <Field label="New Password" error={errors.new_password}>
                        <div className="relative">
                            <Lock
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field pl-10 pr-10"
                                placeholder="••••••••"
                                value={form.new_password}
                                onChange={(e) =>
                                    setForm({ ...form, new_password: e.target.value })
                                }
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </Field>

                    <Field label="Confirm Password" error={errors.confirm_password}>
                        <div className="relative">
                            <Lock
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input-field pl-10"
                                placeholder="••••••••"
                                value={form.confirm_password}
                                onChange={(e) =>
                                    setForm({ ...form, confirm_password: e.target.value })
                                }
                            />
                        </div>
                    </Field>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>
            )}

            {/* Footer - only show on email step */}
            {step === 1 && (
                <p className="mt-6 text-center text-sm text-slate-600">
                    Remember your password?{" "}
                    <Link
                        to="/login"
                        className="text-primary font-medium hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            )}
        </AuthShell>
    );
}

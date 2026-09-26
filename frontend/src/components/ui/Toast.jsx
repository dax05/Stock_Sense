import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
    error: <XCircle size={16} className="text-red-500 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
    info: <Info size={16} className="text-blue-500 shrink-0" />,
};

const STYLES = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);

    function dismiss(id) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm animate-slideUp",
                            STYLES[t.type]
                        )}
                    >
                        {ICONS[t.type]}
                        <span className="flex-1 leading-snug">{t.message}</span>
                        <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx.toast;
}

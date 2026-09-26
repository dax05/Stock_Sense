import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Modal({ open, onClose, title, children, size = "md" }) {
    if (!open) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                "modal-panel relative bg-white/95 backdrop-blur-sm w-full flex flex-col max-h-[90vh]",
                "rounded-[1rem] border border-slate-200/80",
                sizes[size]
            )}
                style={{ boxShadow: "0 20px 60px -10px rgb(0 0 0 / 0.18), 0 8px 20px -6px rgb(0 0 0 / 0.10)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <h2 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-150"
                        aria-label="Close"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

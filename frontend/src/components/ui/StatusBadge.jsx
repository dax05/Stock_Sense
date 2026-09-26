import { cn } from "../../lib/utils";

const STYLES = {
    Draft: "bg-slate-100 text-slate-600",
    Waiting: "bg-amber-100 text-amber-700",
    Ready: "bg-blue-100 text-blue-700",
    Done: "bg-emerald-100 text-emerald-700",
    Canceled: "bg-red-100 text-red-600",
};

export default function StatusBadge({ status }) {
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STYLES[status] || STYLES.Draft)}>
            {status}
        </span>
    );
}

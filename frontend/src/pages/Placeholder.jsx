import { Construction } from "lucide-react";

export default function Placeholder({ title }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <Construction size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">{title} — coming soon</p>
        </div>
    );
}

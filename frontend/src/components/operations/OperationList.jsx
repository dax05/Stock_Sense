import { useState } from "react";
import { Search, Plus, List, LayoutGrid, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import StatusBadge from "../ui/StatusBadge";
import Modal from "../ui/Modal";
import OperationForm from "./OperationForm";

const STATUSES = ["Draft", "Waiting", "Ready", "Done", "Canceled"];

const STATUS_KANBAN_COLOR = {
    Draft: "border-slate-300 bg-slate-50",
    Waiting: "border-amber-300 bg-amber-50",
    Ready: "border-blue-300 bg-blue-50",
    Done: "border-emerald-300 bg-emerald-50",
    Canceled: "border-red-200 bg-red-50",
};

export default function OperationList({ title, opType, operations, loading, products, onRefetch }) {
    const [view, setView] = useState("list");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null); // existing op
    const [creating, setCreating] = useState(false);

    const filtered = operations.filter((op) => {
        const q = search.toLowerCase();
        return (
            op.reference?.toLowerCase().includes(q) ||
            op.partner_name?.toLowerCase().includes(q)
        );
    });

    function handleSaved(op) {
        setCreating(false);
        setSelected(null);
        onRefetch();
    }

    const srcLabel = opType === "IN" ? "Virtual/Vendor" : "WH/Stock";
    const dstLabel = opType === "IN" ? "WH/Stock" : "Virtual/Customer";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{filtered.length} operations</p>
                </div>
                <button onClick={() => setCreating(true)} className="btn-primary">
                    <Plus size={14} /> New {title.replace("s", "")}
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="input-field pl-9"
                        placeholder="Search by reference or contact…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setView("list")}
                        className={cn("p-2 transition-colors", view === "list" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100")}
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setView("kanban")}
                        className={cn("p-2 transition-colors", view === "kanban" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100")}
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
                    <Loader2 size={20} className="animate-spin" /> Loading…
                </div>
            ) : view === "list" ? (
                <ListView ops={filtered} srcLabel={srcLabel} dstLabel={dstLabel} onSelect={setSelected} />
            ) : (
                <KanbanView ops={filtered} srcLabel={srcLabel} dstLabel={dstLabel} onSelect={setSelected} />
            )}

            {/* Create modal */}
            <Modal open={creating} onClose={() => setCreating(false)} title={`New ${title.replace("s", "")}`} size="xl">
                <OperationForm
                    operation={null}
                    products={products}
                    opType={opType}
                    onSaved={handleSaved}
                    onClose={() => setCreating(false)}
                />
            </Modal>

            {/* Edit / view modal */}
            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.reference || "Operation"}
                size="xl"
            >
                {selected && (
                    <OperationForm
                        operation={selected}
                        products={products}
                        opType={opType}
                        onSaved={handleSaved}
                        onClose={() => setSelected(null)}
                    />
                )}
            </Modal>
        </div>
    );
}

// ── List View ─────────────────────────────────────────────────────────────

function ListView({ ops, srcLabel, dstLabel, onSelect }) {
    if (!ops.length) return <EmptyState />;

    return (
        <div className="card overflow-hidden">
            <table className="data-table">
                <thead>
                    <tr>
                        {["Reference", "From", "To", "Contact", "Scheduled Date", "Status"].map((h) => (
                            <th key={h}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ops.map((op) => (
                        <tr
                            key={op.id}
                            onClick={() => onSelect(op)}
                            className="cursor-pointer"
                        >
                            <td className="font-mono text-xs font-semibold text-primary">{op.reference}</td>
                            <td>{srcLabel}</td>
                            <td>{dstLabel}</td>
                            <td>{op.partner_name || "—"}</td>
                            <td className="text-slate-500">{formatDate(op.scheduled_date)}</td>
                            <td><StatusBadge status={op.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Kanban View ───────────────────────────────────────────────────────────

function KanbanView({ ops, onSelect }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {STATUSES.map((status) => {
                const group = ops.filter((op) => op.status === status);
                return (
                    <div key={status} className={cn("rounded-xl border-2 p-3", STATUS_KANBAN_COLOR[status])}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{status}</span>
                            <span className="text-xs bg-white border border-slate-200 text-slate-500 rounded-full px-2 py-0.5 font-medium">
                                {group.length}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {group.map((op) => (
                                <div
                                    key={op.id}
                                    onClick={() => onSelect(op)}
                                    className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <p className="text-xs font-mono font-semibold text-primary mb-1">{op.reference}</p>
                                    <p className="text-xs text-slate-600 truncate">{op.partner_name || "—"}</p>
                                    <p className="text-xs text-slate-400 mt-1">{formatDate(op.scheduled_date)}</p>
                                </div>
                            ))}
                            {!group.length && (
                                <p className="text-xs text-slate-400 text-center py-4">Empty</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="card flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <p className="text-sm">No operations found</p>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

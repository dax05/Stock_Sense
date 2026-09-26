import { useState, useEffect } from "react";
import { Search, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

// ── Type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    IN: { label: "Receipt", icon: ArrowDownToLine, row: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    OUT: { label: "Delivery", icon: ArrowUpFromLine, row: "text-red-600", badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
    INT: { label: "Transfer", icon: ArrowLeftRight, row: "text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    ADJ: { label: "Adjustment", icon: SlidersHorizontal, row: "text-amber-700", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
};

// ── Demo data ─────────────────────────────────────────────────────────────

const DEMO_MOVES = [
    { id: 1, reference: "WH/IN/0001", type: "IN", product: "Widget A", sku: "SKU-001", qty: 50, source: "Virtual/Vendor", dest: "WH/Stock", date: "2026-03-05T10:00:00Z", partner: "Acme Supplies" },
    { id: 2, reference: "WH/IN/0001", type: "IN", product: "Gadget B", sku: "SKU-002", qty: 30, source: "Virtual/Vendor", dest: "WH/Stock", date: "2026-03-05T10:00:00Z", partner: "Acme Supplies" },
    { id: 3, reference: "WH/OUT/0001", type: "OUT", product: "Widget A", sku: "SKU-001", qty: 10, source: "WH/Stock", dest: "Virtual/Customer", date: "2026-03-08T14:30:00Z", partner: "Client Alpha" },
    { id: 4, reference: "WH/IN/0002", type: "IN", product: "Part C", sku: "SKU-003", qty: 100, source: "Virtual/Vendor", dest: "WH/Stock", date: "2026-03-10T09:00:00Z", partner: "Global Parts" },
    { id: 5, reference: "WH/OUT/0002", type: "OUT", product: "Gadget B", sku: "SKU-002", qty: 5, source: "WH/Stock", dest: "Virtual/Customer", date: "2026-03-11T16:00:00Z", partner: "Client Beta" },
    { id: 6, reference: "WH/INT/0001", type: "INT", product: "Part C", sku: "SKU-003", qty: 20, source: "WH/Stock", dest: "WH/Shelf-B", date: "2026-03-12T11:00:00Z", partner: "—" },
    { id: 7, reference: "WH/OUT/0003", type: "OUT", product: "Widget A", sku: "SKU-001", qty: 15, source: "WH/Stock", dest: "Virtual/Customer", date: "2026-03-13T08:00:00Z", partner: "Client Gamma" },
    { id: 8, reference: "WH/IN/0003", type: "IN", product: "Widget A", sku: "SKU-001", qty: 200, source: "Virtual/Vendor", dest: "WH/Stock", date: "2026-03-14T07:00:00Z", partner: "FastShip Co" },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function MoveHistoryPage() {
    const [moves, setMoves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");

    useEffect(() => {
        api.get("/stock-moves/")
            .then(({ data }) => setMoves(data))
            .catch(() => setMoves(DEMO_MOVES))
            .finally(() => setLoading(false));
    }, []);

    const filtered = moves.filter((m) => {
        const q = search.toLowerCase();
        const matchSearch =
            m.reference?.toLowerCase().includes(q) ||
            m.product?.toLowerCase().includes(q) ||
            m.sku?.toLowerCase().includes(q) ||
            m.partner?.toLowerCase().includes(q);
        const matchType = typeFilter === "ALL" || m.type === typeFilter;
        return matchSearch && matchType;
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-800">Move History</h1>
                <p className="text-sm text-slate-500 mt-0.5">Complete audit trail of every stock movement</p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                        <span className="text-xs text-slate-500">{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="input-field pl-9"
                        placeholder="Search reference, product, contact…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                    {["ALL", "IN", "OUT", "INT", "ADJ"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                                "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                                typeFilter === t
                                    ? "bg-primary text-white"
                                    : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
                    <Loader2 size={20} className="animate-spin" /> Loading…
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {["Reference", "Type", "Product", "SKU", "Qty", "From", "To", "Contact", "Date"].map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                                        No movements found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((move, i) => {
                                    const cfg = TYPE_CONFIG[move.type] || TYPE_CONFIG.IN;
                                    const Icon = cfg.icon;
                                    const sameRef = i > 0 && filtered[i - 1].reference === move.reference;

                                    return (
                                        <tr key={move.id} className={cfg.row}>
                                            <td className="font-mono text-xs font-semibold">
                                                {sameRef ? (
                                                    <span className="text-slate-300 pl-3">↳</span>
                                                ) : (
                                                    move.reference
                                                )}
                                            </td>
                                            <td>
                                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.badge)}>
                                                    <Icon size={11} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="font-medium">{move.product}</td>
                                            <td className="font-mono text-xs opacity-70">{move.sku}</td>
                                            <td className="font-semibold">{move.qty}</td>
                                            <td className="text-xs opacity-80">{move.source}</td>
                                            <td className="text-xs opacity-80">{move.dest}</td>
                                            <td className="opacity-80">{move.partner}</td>
                                            <td className="text-xs opacity-70 whitespace-nowrap">{formatDate(move.date)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary footer */}
            {!loading && filtered.length > 0 && (
                <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
                    <span>{filtered.length} movements</span>
                    {["IN", "OUT", "INT", "ADJ"].map((t) => {
                        const count = filtered.filter((m) => m.type === t).length;
                        if (!count) return null;
                        const cfg = TYPE_CONFIG[t];
                        return (
                            <span key={t} className={cn("font-medium", cfg.row)}>
                                {count} {cfg.label}{count > 1 ? "s" : ""}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

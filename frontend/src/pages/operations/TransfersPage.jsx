import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, AlertTriangle, ArrowRight, CheckCircle2, List, LayoutGrid } from "lucide-react";
import { cn } from "../../lib/utils";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";

const DEMO_TRANSFERS = [
    { id: 1, reference: "WH/INT/0001", status: "Done", partner_name: "Move to Rack A", scheduled_date: "2026-03-10T00:00:00Z", stock_moves: [] },
    { id: 2, reference: "WH/INT/0002", status: "Ready", partner_name: "Production restock", scheduled_date: "2026-03-15T00:00:00Z", stock_moves: [] },
    { id: 3, reference: "WH/INT/0003", status: "Draft", partner_name: "Shelf reorganisation", scheduled_date: "2026-03-20T00:00:00Z", stock_moves: [] },
];
const DEMO_PRODUCTS = [
    { id: 1, sku: "SKU-001", name: "Widget A", uom: "Units", on_hand: 50 },
    { id: 2, sku: "SKU-002", name: "Gadget B", uom: "Units", on_hand: 0 },
    { id: 3, sku: "SKU-003", name: "Part C", uom: "kg", on_hand: 20 },
];
const DEMO_LOCS = [
    { id: 1, name: "WH/Stock", short_code: "WH/STOCK", location_type: "Internal" },
    { id: 2, name: "WH/Shelf-A", short_code: "WH/SHELF-A", location_type: "Internal" },
    { id: 3, name: "WH/Rack-B", short_code: "WH/RACK-B", location_type: "Internal" },
];

const STATUSES = ["Draft", "Waiting", "Ready", "Done", "Canceled"];
const KANBAN_COLOR = {
    Draft: "border-slate-300 bg-slate-50", Waiting: "border-amber-300 bg-amber-50",
    Ready: "border-blue-300 bg-blue-50", Done: "border-emerald-300 bg-emerald-50", Canceled: "border-red-200 bg-red-50",
};

export default function TransfersPage() {
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [view, setView] = useState("list");
    const [modal, setModal] = useState(false);
    const [selected, setSelected] = useState(null);

    function load() {
        Promise.all([api.get("/operations/?type=INT"), api.get("/products/"), api.get("/locations/")])
            .then(([t, p, l]) => { setTransfers(t.data); setProducts(p.data); setLocations(l.data.filter(x => x.location_type === "Internal")); })
            .catch(() => { setTransfers(DEMO_TRANSFERS); setProducts(DEMO_PRODUCTS); setLocations(DEMO_LOCS); })
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    const filtered = transfers.filter((t) => {
        const q = search.toLowerCase();
        return t.reference?.toLowerCase().includes(q) || t.partner_name?.toLowerCase().includes(q);
    });

    function handleSaved() { setModal(false); setSelected(null); load(); }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Internal Transfers</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Move stock between internal locations</p>
                </div>
                <button onClick={() => setModal(true)} className="btn-primary">
                    <Plus size={14} /> New Transfer
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input-field pl-9" placeholder="Search by reference or note…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100")}><List size={16} /></button>
                    <button onClick={() => setView("kanban")} className={cn("p-2 transition-colors", view === "kanban" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100")}><LayoutGrid size={16} /></button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</div>
            ) : view === "list" ? (
                <div className="card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {["Reference", "Note", "Scheduled Date", "Status"].map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-12 text-slate-400 text-sm">No transfers found</td></tr>
                            ) : filtered.map((t) => (
                                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer">
                                    <td className="font-mono text-xs font-semibold text-blue-600">{t.reference}</td>
                                    <td>{t.partner_name || "—"}</td>
                                    <td className="text-slate-500">{formatDate(t.scheduled_date)}</td>
                                    <td><StatusBadge status={t.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {STATUSES.map((status) => {
                        const group = filtered.filter((t) => t.status === status);
                        return (
                            <div key={status} className={cn("rounded-xl border-2 p-3", KANBAN_COLOR[status])}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{status}</span>
                                    <span className="text-xs bg-white border border-slate-200 text-slate-500 rounded-full px-2 py-0.5 font-medium">{group.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {group.map((t) => (
                                        <div key={t.id} onClick={() => setSelected(t)} className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow">
                                            <p className="text-xs font-mono font-semibold text-blue-600 mb-1">{t.reference}</p>
                                            <p className="text-xs text-slate-600 truncate">{t.partner_name || "—"}</p>
                                            <p className="text-xs text-slate-400 mt-1">{formatDate(t.scheduled_date)}</p>
                                        </div>
                                    ))}
                                    {!group.length && <p className="text-xs text-slate-400 text-center py-4">Empty</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
            <Modal open={modal} onClose={() => setModal(false)} title="New Internal Transfer" size="xl">
                <TransferForm products={products} locations={locations} onSaved={handleSaved} onClose={() => setModal(false)} />
            </Modal>

            {/* View/edit modal */}
            <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.reference || "Transfer"} size="xl">
                {selected && <TransferDetail transfer={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
            </Modal>
        </div>
    );
}

// ── Transfer creation form ────────────────────────────────────────────────

function TransferForm({ products, locations, onSaved, onClose }) {
    const [note, setNote] = useState("");
    const [date, setDate] = useState("");
    const [lines, setLines] = useState([{ product_id: "", qty: 1, source_location_id: "", dest_location_id: "" }]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function addLine() { setLines([...lines, { product_id: "", qty: 1, source_location_id: "", dest_location_id: "" }]); }
    function removeLine(i) { setLines(lines.filter((_, idx) => idx !== i)); }
    function update(i, k, v) { setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l)); }

    function validate() {
        for (const l of lines) {
            if (!l.product_id || !l.qty || !l.source_location_id || !l.dest_location_id) return "All fields in every line are required";
            if (l.source_location_id === l.dest_location_id) return "Source and destination must be different locations";
            const prod = products.find((p) => p.id === Number(l.product_id));
            if (prod && prod.on_hand < Number(l.qty)) return `Insufficient stock at source for "${prod.name}". On hand: ${prod.on_hand}`;
        }
        return null;
    }

    async function handleSave() {
        const err = validate();
        if (err) { setError(err); return; }
        setError(""); setSaving(true);
        try {
            await api.post("/operations/", {
                warehouse_id: 1,
                type: "INT",
                partner_name: note || null,
                scheduled_date: date ? new Date(date).toISOString() : null,
                moves: lines.map((l) => ({
                    product_id: Number(l.product_id),
                    qty: Number(l.qty),
                    source_location_id: Number(l.source_location_id),
                    dest_location_id: Number(l.dest_location_id),
                })),
            });
            onSaved();
        } catch (e) { setError(e.response?.data?.detail || "Failed to create transfer"); }
        finally { setSaving(false); }
    }

    return (
        <div className="space-y-5">
            {error && <ErrorBanner msg={error} />}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Note / Reason (optional)</label>
                    <input className="input-field" placeholder="e.g. Move to Production Rack" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled Date</label>
                    <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
            </div>

            {/* Lines */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock Lines</span>
                    <button onClick={addLine} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"><Plus size={13} /> Add Line</button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-24">Qty</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">From</th>
                                <th className="px-1 py-2 w-6" />
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">To</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => {
                                const prod = products.find((p) => p.id === Number(line.product_id));
                                const insufficient = prod && prod.on_hand < Number(line.qty);
                                return (
                                    <tr key={i} className={cn("border-b border-slate-100 last:border-0", insufficient && "bg-red-50")}>
                                        <td className="px-3 py-2">
                                            <select className="input-field py-1" value={line.product_id} onChange={(e) => update(i, "product_id", e.target.value)}>
                                                <option value="">Select…</option>
                                                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                            </select>
                                            {prod && <p className="text-xs text-slate-400 mt-0.5">On hand: {prod.on_hand}</p>}
                                            {insufficient && <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertTriangle size={11} /> Insufficient stock</p>}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" min="0.01" step="0.01" className={cn("input-field py-1 w-20", insufficient && "border-red-300")}
                                                value={line.qty} onChange={(e) => update(i, "qty", e.target.value)} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <select className="input-field py-1" value={line.source_location_id} onChange={(e) => update(i, "source_location_id", e.target.value)}>
                                                <option value="">From…</option>
                                                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-1 py-2 text-slate-400"><ArrowRight size={14} /></td>
                                        <td className="px-3 py-2">
                                            <select className="input-field py-1" value={line.dest_location_id} onChange={(e) => update(i, "dest_location_id", e.target.value)}>
                                                <option value="">To…</option>
                                                {locations.filter((l) => String(l.id) !== String(line.source_location_id)).map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <button onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={onClose} className="btn-ghost">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-6">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Draft"}
                </button>
            </div>
        </div>
    );
}

// ── Transfer detail / state machine ──────────────────────────────────────

function TransferDetail({ transfer, onClose, onSaved }) {
    const [error, setError] = useState("");
    const [advancing, setAdvancing] = useState(false);
    const [validating, setValidating] = useState(false);

    const isDone = transfer.status === "Done" || transfer.status === "Canceled";
    const isReady = transfer.status === "Ready";
    const canAdvance = transfer.status === "Draft" || transfer.status === "Waiting";

    async function advance() {
        setError(""); setAdvancing(true);
        try { await api.patch(`/operations/${transfer.id}/status`); onSaved(); }
        catch (e) { setError(e.response?.data?.detail || "Failed"); }
        finally { setAdvancing(false); }
    }

    async function validate() {
        setError(""); setValidating(true);
        try { await api.post(`/operations/${transfer.id}/validate`); onSaved(); window.print(); }
        catch (e) { setError(e.response?.data?.detail || "Validation failed"); }
        finally { setValidating(false); }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-mono text-sm font-semibold text-slate-700">{transfer.reference}</span>
                <StatusBadge status={transfer.status} />
            </div>
            {transfer.partner_name && <p className="text-sm text-slate-600">Note: {transfer.partner_name}</p>}
            {error && <ErrorBanner msg={error} />}
            {!isDone && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="btn-ghost">Close</button>
                    {canAdvance && (
                        <button onClick={advance} disabled={advancing} className="btn-primary w-auto px-5 bg-amber-500 hover:bg-amber-600">
                            {advancing ? <Loader2 size={14} className="animate-spin" /> : transfer.status === "Waiting" ? "Mark Ready" : "Confirm"}
                        </button>
                    )}
                    {isReady && (
                        <button onClick={validate} disabled={validating} className="btn-primary w-auto px-5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                            {validating ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Validate</>}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function ErrorBanner({ msg }) {
    return (
        <div className="alert-error">
            <AlertTriangle size={14} /><span>{msg}</span>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

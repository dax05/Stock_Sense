import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, AlertTriangle, CheckCircle2, SlidersHorizontal } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";

export default function AdjustmentsPage() {
    const [adjustments, setAdjustments] = useState([]);
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(false);

    // Form state
    const [reason, setReason] = useState("");
    const [date, setDate] = useState("");
    const [warehouseId, setWarehouseId] = useState("");
    const [sourceLocationId, setSourceLocationId] = useState("");
    const [lines, setLines] = useState([{ product_id: "", qty: 1 }]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        Promise.all([
            api.get("/operations/?type=ADJ"),
            api.get("/products/"),
            api.get("/locations/"),
            api.get("/warehouses/"),
        ])
            .then(([a, p, l, w]) => {
                setAdjustments(a.data);
                setProducts(p.data);
                setLocations(l.data);
                setWarehouses(w.data);
                // Auto-select if only one warehouse
                if (w.data.length === 1) setWarehouseId(String(w.data[0].id));
            })
            .catch(() => {
                setAdjustments([]);
                setProducts([]);
                setLocations([]);
                setWarehouses([]);
            })
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    // Virtual Adjustment location (no warehouse_id)
    const adjLocation = locations.find((l) => l.location_type === "Adjustment");

    // Internal locations for the selected warehouse
    const internalLocations = locations.filter(
        (l) => l.location_type === "Internal" && l.warehouse_id === Number(warehouseId)
    );

    // Reset source location when warehouse changes
    function handleWarehouseChange(wid) {
        setWarehouseId(wid);
        setSourceLocationId("");
    }

    function addLine() { setLines([...lines, { product_id: "", qty: 1 }]); }
    function removeLine(i) { setLines(lines.filter((_, idx) => idx !== i)); }
    function updateLine(i, k, v) { setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l)); }

    function resetForm() {
        setReason("");
        setDate("");
        setSourceLocationId("");
        setLines([{ product_id: "", qty: 1 }]);
        setError("");
        // Keep warehouse selection if only one warehouse
        if (warehouses.length !== 1) setWarehouseId("");
    }

    async function handleSave() {
        if (!reason.trim()) { setError("Reason / note is required"); return; }
        if (!warehouseId) { setError("Please select a warehouse"); return; }
        if (!sourceLocationId) { setError("Please select the source (stock) location"); return; }
        if (!adjLocation) { setError("Virtual/Adjustment location not found. Please contact your administrator."); return; }
        if (lines.some((l) => !l.product_id || !l.qty)) { setError("All lines must have a product and quantity"); return; }
        setError(""); setSaving(true);
        try {
            const payload = {
                warehouse_id: Number(warehouseId),
                type: "ADJ",
                partner_name: reason,
                scheduled_date: date ? new Date(date).toISOString() : null,
                moves: lines.map((l) => ({
                    product_id: Number(l.product_id),
                    qty: Number(l.qty),
                    source_location_id: Number(sourceLocationId),
                    dest_location_id: adjLocation.id,
                })),
            };
            await api.post("/operations/", payload);
            setModal(false);
            resetForm();
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to create adjustment");
        } finally {
            setSaving(false);
        }
    }

    const filtered = adjustments.filter((a) => {
        const q = search.toLowerCase();
        return a.reference?.toLowerCase().includes(q) || a.partner_name?.toLowerCase().includes(q);
    });

    const locMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Stock Adjustments</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Correct discrepancies between physical and system stock</p>
                </div>
                <button onClick={() => { resetForm(); setModal(true); }} className="btn-primary">
                    <Plus size={14} /> New Adjustment
                </button>
            </div>

            {/* Info banner */}
            <div className="alert-warning">
                <SlidersHorizontal size={15} className="mt-0.5 shrink-0" />
                <span>Adjustments move stock from a selected internal location to <span className="font-mono font-semibold">Virtual/Adjustment</span>. They reduce on-hand quantities and are fully logged in the ledger.</span>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9" placeholder="Search adjustments…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400 gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {["Reference", "Reason / Note", "Source", "Destination", "Scheduled Date", "Status"].map((h) => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No adjustments found</td></tr>
                            ) : filtered.map((a) => {
                                const firstMove = a.stock_moves?.[0];
                                return (
                                    <tr key={a.id}>
                                        <td className="font-mono text-xs font-semibold text-amber-600">{a.reference}</td>
                                        <td>{a.partner_name || "—"}</td>
                                        <td className="text-xs">{firstMove ? (locMap[firstMove.source_location_id] || `Loc #${firstMove.source_location_id}`) : "—"}</td>
                                        <td className="text-xs">{firstMove ? (locMap[firstMove.dest_location_id] || "Virtual/Adjustment") : "—"}</td>
                                        <td className="text-slate-500">{formatDate(a.scheduled_date)}</td>
                                        <td><StatusBadge status={a.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Adjustment Modal */}
            <Modal open={modal} onClose={() => setModal(false)} title="New Stock Adjustment" size="lg">
                <div className="space-y-5">
                    {error && (
                        <div className="alert-error">
                            <AlertTriangle size={14} /><span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Reason / Note</label>
                            <input className="input-field" placeholder="e.g. Damaged goods, cycle count correction…" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Date (optional)</label>
                            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        {/* Warehouse */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                            <select className="input-field" value={warehouseId} onChange={(e) => handleWarehouseChange(e.target.value)}>
                                <option value="">— Select warehouse —</option>
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.short_code})</option>)}
                            </select>
                        </div>

                        {/* Source location within the selected warehouse */}
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Source Location (where stock is removed from)</label>
                            <select
                                className="input-field"
                                value={sourceLocationId}
                                disabled={!warehouseId}
                                onChange={(e) => setSourceLocationId(e.target.value)}
                            >
                                <option value="">— Select source location —</option>
                                {internalLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                            {warehouseId && internalLocations.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">⚠ No internal locations in this warehouse.</p>
                            )}
                        </div>

                        {/* Destination is always Virtual/Adjustment */}
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                            <input
                                className="input-field bg-slate-50 text-slate-500"
                                value={adjLocation ? adjLocation.name : "Virtual/Adjustment (not seeded yet)"}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Lines */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Products to Adjust</span>
                            <button onClick={addLine} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                                <Plus size={13} /> Add Line
                            </button>
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-28">Qty to Remove</th>
                                        <th className="w-10" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, i) => {
                                        const prod = products.find((p) => p.id === Number(line.product_id));
                                        return (
                                            <tr key={i} className="border-b border-slate-100 last:border-0">
                                                <td className="px-3 py-2">
                                                    <select className="input-field py-1" value={line.product_id} onChange={(e) => updateLine(i, "product_id", e.target.value)}>
                                                        <option value="">Select product…</option>
                                                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                    </select>
                                                    {prod && <p className="text-xs text-slate-400 mt-0.5">On hand: {prod.on_hand} {prod.uom}</p>}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="number" min="0.01" step="0.01" className="input-field py-1 w-24" value={line.qty}
                                                        onChange={(e) => updateLine(i, "qty", e.target.value)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <button onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-6 flex items-center gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Create Adjustment</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Printer, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import StatusBadge from "../ui/StatusBadge";
import api from "../../lib/api";

const EMPTY_LINE = { product_id: "", qty: 1, source_location_id: "", dest_location_id: "" };

export default function OperationForm({ operation, products, opType, onSaved, onClose }) {
    const isNew = !operation;
    const [form, setForm] = useState({
        partner_name: operation?.partner_name || "",
        scheduled_date: operation?.scheduled_date?.slice(0, 10) || "",
        warehouse_id: 1, // default warehouse
    });
    const [lines, setLines] = useState(
        operation?.stock_moves?.length
            ? operation.stock_moves.map((m) => ({
                product_id: m.product_id,
                qty: m.qty,
                source_location_id: m.source_location_id,
                dest_location_id: m.dest_location_id,
            }))
            : [{ ...EMPTY_LINE }]
    );
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState("");

    // Default locations per type (IDs match seeded data)
    const defaultSrc = opType === "IN" ? 1 : 3;  // 1=WH/Stock, 3=Virtual/Vendor
    const defaultDst = opType === "OUT" ? 2 : 3;  // 2=Virtual/Customer, 3=WH/Stock

    function addLine() {
        setLines([...lines, { ...EMPTY_LINE, source_location_id: defaultSrc, dest_location_id: defaultDst }]);
    }

    function removeLine(i) {
        setLines(lines.filter((_, idx) => idx !== i));
    }

    function updateLine(i, key, val) {
        setLines(lines.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
    }

    function getProduct(id) {
        return products.find((p) => p.id === Number(id));
    }

    function isOutOfStock(line) {
        if (opType !== "OUT") return false;
        const p = getProduct(line.product_id);
        return p && p.free_to_use < Number(line.qty);
    }

    async function handleSave() {
        if (!form.partner_name.trim()) { setError("Contact / partner name is required"); return; }
        if (lines.some((l) => !l.product_id || !l.qty)) { setError("All product lines must be filled"); return; }
        setError(""); setSaving(true);
        try {
            const payload = {
                warehouse_id: form.warehouse_id,
                type: opType,
                partner_name: form.partner_name,
                scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
                moves: lines.map((l) => ({
                    product_id: Number(l.product_id),
                    qty: Number(l.qty),
                    source_location_id: Number(l.source_location_id) || defaultSrc,
                    dest_location_id: Number(l.dest_location_id) || defaultDst,
                })),
            };
            const { data } = await api.post("/operations/", payload);
            onSaved(data);
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to save operation");
        } finally {
            setSaving(false);
        }
    }

    async function handleAdvance() {
        setError(""); setSaving(true);
        try {
            const { data } = await api.patch(`/operations/${operation.id}/status`);
            onSaved(data);
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to advance status");
        } finally {
            setSaving(false);
        }
    }

    async function handleValidate() {
        setError(""); setValidating(true);
        try {
            const { data } = await api.post(`/operations/${operation.id}/validate`);
            onSaved(data);
            window.print();
        } catch (e) {
            setError(e.response?.data?.detail || "Validation failed");
        } finally {
            setValidating(false);
        }
    }

    const isDone = operation?.status === "Done" || operation?.status === "Canceled";
    const isReady = operation?.status === "Ready";
    const isDraft = operation?.status === "Draft" || isNew;
    const isWaiting = operation?.status === "Waiting";

    return (
        <div className="space-y-5">
            {/* Reference + Status */}
            {!isNew && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-mono font-semibold text-slate-700">{operation.reference}</span>
                    <StatusBadge status={operation.status} />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="alert-error">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        {opType === "IN" ? "Receive From" : "Deliver To"}
                    </label>
                    <input
                        className="input-field"
                        placeholder="Vendor / Customer name"
                        value={form.partner_name}
                        disabled={isDone}
                        onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled Date</label>
                    <input
                        type="date"
                        className="input-field"
                        value={form.scheduled_date}
                        disabled={isDone}
                        onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    />
                </div>
            </div>

            {/* Product lines */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Products</span>
                    {!isDone && (
                        <button onClick={addLine} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                            <Plus size={13} /> Add Line
                        </button>
                    )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-24">Qty</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-24">On Hand</th>
                                {!isDone && <th className="w-10" />}
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => {
                                const prod = getProduct(line.product_id);
                                const oos = isOutOfStock(line);
                                return (
                                    <tr key={i} className={cn("border-b border-slate-100 last:border-0", oos && "bg-red-50")}>
                                        <td className="px-3 py-2">
                                            <select
                                                className={cn("input-field py-1", oos && "border-red-300 text-red-700")}
                                                value={line.product_id}
                                                disabled={isDone}
                                                onChange={(e) => updateLine(i, "product_id", e.target.value)}
                                            >
                                                <option value="">Select product…</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                ))}
                                            </select>
                                            {oos && (
                                                <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                                    <AlertTriangle size={11} /> Not in Stock
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                className={cn("input-field py-1 w-20", oos && "border-red-300")}
                                                value={line.qty}
                                                disabled={isDone}
                                                onChange={(e) => updateLine(i, "qty", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-slate-500 text-xs">
                                            {prod ? (
                                                <span className={cn(prod.free_to_use === 0 && "text-red-500 font-medium")}>
                                                    {prod.free_to_use} {prod.uom}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        {!isDone && (
                                            <td className="px-2 py-2">
                                                <button onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            {!isDone && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="btn-ghost">Cancel</button>

                    {isNew && (
                        <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-5">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Draft"}
                        </button>
                    )}

                    {(isDraft || isWaiting) && !isNew && (
                        <button onClick={handleAdvance} disabled={saving} className="btn-primary w-auto px-5 bg-amber-500 hover:bg-amber-600">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : isWaiting ? "Mark Ready" : "Confirm"}
                        </button>
                    )}

                    {isReady && (
                        <button
                            onClick={handleValidate}
                            disabled={validating || lines.some(isOutOfStock)}
                            className="btn-primary w-auto px-5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                        >
                            {validating
                                ? <Loader2 size={14} className="animate-spin" />
                                : <><CheckCircle2 size={14} /> Validate</>}
                        </button>
                    )}
                </div>
            )}

            {isDone && (
                <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2">
                        <Printer size={14} /> Print
                    </button>
                </div>
            )}
        </div>
    );
}

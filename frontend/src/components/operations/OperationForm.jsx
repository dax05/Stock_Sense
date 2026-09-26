import { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, Printer, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import StatusBadge from "../ui/StatusBadge";
import api from "../../lib/api";

const EMPTY_LINE = { product_id: "", qty: 1, warehouse_id: "", location_id: "" };

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * For a given operation type, which location types are valid sources?
 * IN  → source must be Vendor (virtual)
 * OUT → source must be Internal
 * INT → source must be Internal
 * ADJ → source must be Internal
 */
function isValidSourceLocation(loc, opType) {
    if (opType === "IN") return loc.location_type === "Vendor";
    return loc.location_type === "Internal";
}

/**
 * For a given operation type, which location types are valid destinations?
 * IN  → dest must be Internal
 * OUT → dest must be Customer (virtual)
 * INT → dest must be Internal
 * ADJ → dest must be Adjustment (virtual)
 */
function isValidDestLocation(loc, opType) {
    if (opType === "IN") return loc.location_type === "Internal";
    if (opType === "OUT") return loc.location_type === "Customer";
    if (opType === "INT") return loc.location_type === "Internal";
    if (opType === "ADJ") return loc.location_type === "Adjustment";
    return false;
}

/**
 * For IN / OUT operations, one side is a fixed virtual location (Vendor / Customer).
 * Returns the fixed virtual location for that side, or null if the side is user-selectable.
 */
function getFixedSourceLocation(locations, opType) {
    if (opType === "IN") return locations.find((l) => l.location_type === "Vendor") || null;
    return null; // OUT / INT / ADJ: source is user-selectable (internal)
}

function getFixedDestLocation(locations, opType) {
    if (opType === "OUT") return locations.find((l) => l.location_type === "Customer") || null;
    if (opType === "ADJ") return locations.find((l) => l.location_type === "Adjustment") || null;
    return null; // IN / INT: destination is user-selectable (internal)
}

// ── Main Component ────────────────────────────────────────────────────────

export default function OperationForm({ operation, products, opType, locations, warehouses, onSaved, onClose }) {
    const isNew = !operation;

    // Derive the virtual (fixed) locations for this operation type
    const fixedSrc = getFixedSourceLocation(locations, opType);
    const fixedDst = getFixedDestLocation(locations, opType);

    // Internal locations grouped by warehouse for user selection
    const internalLocations = locations.filter((l) => l.location_type === "Internal");

    const [form, setForm] = useState({
        partner_name: operation?.partner_name || "",
        scheduled_date: operation?.scheduled_date?.slice(0, 10) || "",
        warehouse_id: "",   // selected warehouse for the whole operation
    });

    // Each line: { product_id, qty, location_id }
    // location_id is the user-chosen internal location (source for OUT/INT/ADJ, dest for IN)
    const [lines, setLines] = useState(() => {
        if (operation?.stock_moves?.length) {
            return operation.stock_moves.map((m) => {
                // Determine which side is user-selectable
                const userSideLocationId = opType === "IN" ? m.dest_location_id : m.source_location_id;
                const userLoc = locations.find((l) => l.id === userSideLocationId);
                return {
                    product_id: m.product_id,
                    qty: m.qty,
                    warehouse_id: userLoc?.warehouse_id ? String(userLoc.warehouse_id) : "",
                    location_id: String(userSideLocationId),
                };
            });
        }
        return [{ ...EMPTY_LINE }];
    });

    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState("");

    // Auto-select warehouse if only one exists
    useEffect(() => {
        if (warehouses.length === 1 && !form.warehouse_id) {
            setForm((f) => ({ ...f, warehouse_id: String(warehouses[0].id) }));
        }
    }, [warehouses]);

    // ── Line helpers ──────────────────────────────────────────────────────
    function addLine() {
        setLines([...lines, { ...EMPTY_LINE, warehouse_id: form.warehouse_id }]);
    }
    function removeLine(i) {
        setLines(lines.filter((_, idx) => idx !== i));
    }
    function updateLine(i, key, val) {
        setLines(lines.map((l, idx) => {
            if (idx !== i) return l;
            const updated = { ...l, [key]: val };
            // Reset location when warehouse changes
            if (key === "warehouse_id") updated.location_id = "";
            return updated;
        }));
    }
    function getProduct(id) {
        return products.find((p) => p.id === Number(id));
    }
    function isOutOfStock(line) {
        if (opType !== "OUT") return false;
        const p = getProduct(line.product_id);
        return p && p.free_to_use < Number(line.qty);
    }

    // Locations available for a specific line (filtered by warehouse + valid type)
    function getSelectableLocations(line) {
        const wid = Number(line.warehouse_id);
        return internalLocations.filter((l) => l.warehouse_id === wid);
    }

    // ── Build the API payload ─────────────────────────────────────────────
    function buildPayload() {
        const whId = Number(form.warehouse_id);
        const moves = lines.map((l) => {
            const locationId = Number(l.location_id);
            if (opType === "IN") {
                return {
                    product_id: Number(l.product_id),
                    qty: Number(l.qty),
                    source_location_id: fixedSrc?.id,    // Virtual/Vendor
                    dest_location_id: locationId,          // user-chosen internal location
                };
            }
            if (opType === "OUT") {
                return {
                    product_id: Number(l.product_id),
                    qty: Number(l.qty),
                    source_location_id: locationId,        // user-chosen internal location
                    dest_location_id: fixedDst?.id,        // Virtual/Customer
                };
            }
            // INT handled by TransfersPage, but kept here for completeness
            return {
                product_id: Number(l.product_id),
                qty: Number(l.qty),
                source_location_id: locationId,
                dest_location_id: Number(l.dest_location_id || 0),
            };
        });
        return {
            warehouse_id: whId,
            type: opType,
            partner_name: form.partner_name || null,
            scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
            moves,
        };
    }

    // ── Validation ────────────────────────────────────────────────────────
    function validateForm() {
        if (!form.partner_name.trim()) return "Contact / partner name is required";
        if (!form.warehouse_id) return "Please select a warehouse";
        for (const l of lines) {
            if (!l.product_id) return "All product lines must have a product selected";
            if (!l.qty || Number(l.qty) <= 0) return "All quantities must be greater than 0";
            if (!l.location_id) return "Please select a location for every product line";
        }
        if (!fixedSrc && opType !== "INT") return "No virtual source location found (Virtual/Vendor)";
        if (!fixedDst && (opType === "OUT" || opType === "ADJ")) return "No virtual destination location found";
        return null;
    }

    // ── Actions ───────────────────────────────────────────────────────────
    async function handleSave() {
        const err = validateForm();
        if (err) { setError(err); return; }
        setError(""); setSaving(true);
        try {
            const { data } = await api.post("/operations/", buildPayload());
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

    // Labels per operation type
    const locationLabel = opType === "IN" ? "Destination Location" : "Source Location";
    const partnerLabel = opType === "IN" ? "Receive From" : "Deliver To";

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

            {/* Header fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{partnerLabel}</label>
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

                {/* Warehouse selector for the whole operation */}
                {isNew && (
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                        <select
                            className="input-field"
                            value={form.warehouse_id}
                            onChange={(e) => {
                                const newWh = e.target.value;
                                setForm({ ...form, warehouse_id: newWh });
                                // Reset all line locations when warehouse changes
                                setLines(lines.map((l) => ({ ...l, warehouse_id: newWh, location_id: "" })));
                            }}
                        >
                            <option value="">— Select warehouse —</option>
                            {warehouses.map((wh) => (
                                <option key={wh.id} value={wh.id}>{wh.name} ({wh.short_code})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Virtual location info banner */}
            {opType === "IN" && fixedSrc && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-medium">Source:</span>{" "}
                    <span className="font-mono">{fixedSrc.name}</span>
                    {" → "}<span className="font-medium">Destination:</span> selected warehouse location below
                </div>
            )}
            {opType === "OUT" && fixedDst && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-medium">Source:</span> selected warehouse location below
                    {" → "}<span className="font-medium">Destination:</span>{" "}
                    <span className="font-mono">{fixedDst.name}</span>
                </div>
            )}

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
                                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{locationLabel}</th>
                                {!isDone && <th className="w-10" />}
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => {
                                const prod = getProduct(line.product_id);
                                const oos = isOutOfStock(line);
                                const selectableLocs = getSelectableLocations(line);

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
                                        <td className="px-3 py-2">
                                            {isDone ? (
                                                <span className="text-xs text-slate-500">
                                                    {locations.find((l) => {
                                                        const m = operation?.stock_moves?.[i];
                                                        return l.id === (opType === "IN" ? m?.dest_location_id : m?.source_location_id);
                                                    })?.name || "—"}
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {/* Per-line warehouse override (only shown when no global warehouse selected) */}
                                                    {!form.warehouse_id && (
                                                        <select
                                                            className="input-field py-1 text-xs"
                                                            value={line.warehouse_id}
                                                            onChange={(e) => updateLine(i, "warehouse_id", e.target.value)}
                                                        >
                                                            <option value="">— Warehouse —</option>
                                                            {warehouses.map((wh) => (
                                                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <select
                                                        className="input-field py-1"
                                                        value={line.location_id}
                                                        disabled={!line.warehouse_id && !form.warehouse_id}
                                                        onChange={(e) => updateLine(i, "location_id", e.target.value)}
                                                    >
                                                        <option value="">— Location —</option>
                                                        {selectableLocs.map((l) => (
                                                            <option key={l.id} value={l.id}>{l.name}</option>
                                                        ))}
                                                    </select>
                                                    {(line.warehouse_id || form.warehouse_id) && selectableLocs.length === 0 && (
                                                        <p className="text-xs text-amber-500">No internal locations in this warehouse</p>
                                                    )}
                                                </div>
                                            )}
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

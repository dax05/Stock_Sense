import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Loader2, AlertTriangle, MapPin, Download } from "lucide-react";
import { cn } from "../../lib/utils";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

const EMPTY_FORM = { name: "", sku: "", category_id: "", uom: "Units", cost: "0", min_stock_level: "0", reorder_qty: "0" };

export default function ProductsPage() {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("");
    const [formModal, setFormModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErr, setFormErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [stockProd, setStockProd] = useState(null);
    const [stockData, setStockData] = useState([]);
    const [stockLoad, setStockLoad] = useState(false);

    function load() {
        setLoading(true);
        Promise.all([api.get("/products/"), api.get("/categories/")])
            .then(([p, c]) => {
                setProducts(p.data);
                setCategories(c.data);
                console.log("✅ Products and categories loaded successfully");
            })
            .catch((e) => {
                console.error("❌ Failed to load products/categories:", e.response?.data);
                toast(e.response?.data?.detail || "Failed to load products", "error");
            })
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    function openAdd() { setEditing(null); setForm(EMPTY_FORM); setFormErr(""); setFormModal(true); }
    function openEdit(p) {
        setEditing(p);
        setForm({ name: p.name, sku: p.sku, category_id: p.category_id || "", uom: p.uom, cost: String(p.cost), min_stock_level: String(p.min_stock_level ?? 0), reorder_qty: String(p.reorder_qty ?? 0) });
        setFormErr(""); setFormModal(true);
    }

    async function openStock(p) {
        setStockProd(p); setStockLoad(true); setStockData([]);
        try {
            const { data } = await api.get(`/stock-moves/by-product/${p.id}`);
            setStockData(data);
        } catch {
            setStockData([{ location_id: 1, location_name: "WH/Stock", short_code: "WH/STOCK", qty_in: p.on_hand, qty_out: 0, net: p.on_hand }]);
        } finally { setStockLoad(false); }
    }

    async function handleSave() {
        if (!form.name.trim() || !form.sku.trim()) { setFormErr("Name and SKU are required"); return; }
        setFormErr(""); setSaving(true);
        try {
            const payload = {
                ...form,
                category_id: form.category_id ? Number(form.category_id) : null,
                cost: parseFloat(form.cost) || 0,
                min_stock_level: parseInt(form.min_stock_level) || 0,
                reorder_qty: parseInt(form.reorder_qty) || 0,
            };
            if (editing) {
                await api.put(`/products/${editing.id}`, payload);
                toast("Product updated successfully", "success");
            } else {
                await api.post("/products/", payload);
                toast("Product created successfully", "success");
            }
            setFormModal(false);
            load();
        } catch (e) {
            const msg = e.response?.data?.detail || "Save failed";
            setFormErr(msg);
            toast(msg, "error");
        } finally { setSaving(false); }
    }

    async function handleExport() {
        try {
            const response = await api.get("/reports/products/export", { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url; a.download = "coreinventory_products.csv"; a.click();
            URL.revokeObjectURL(url);
        } catch {
            // fallback: client-side CSV from current data
            const headers = ["ID", "Name", "SKU", "Category", "UoM", "Cost", "On Hand", "Free to Use", "Min Stock", "Reorder Qty"];
            const rows = products.map((p) => [p.id, p.name, p.sku, p.category_name || "", p.uom, p.cost, p.on_hand, p.free_to_use, p.min_stock_level, p.reorder_qty]);
            const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
            const a = document.createElement("a");
            a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
            a.download = "coreinventory_products.csv"; a.click();
        }
    }

    async function handleDelete(p) {
        if (!confirm(`Delete product "${p.name}"?`)) return;
        try {
            await api.delete(`/products/${p.id}`);
            toast(`"${p.name}" deleted`, "success");
            load();
        } catch (e) { toast(e.response?.data?.detail || "Delete failed", "error"); }
    }

    const filtered = products.filter((p) => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category_name || "").toLowerCase().includes(q);
        const matchCat = !catFilter || String(p.category_id) === catFilter;
        return matchSearch && matchCat;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Products</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{products.length} products in catalog</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="btn-outline">
                        <Download size={14} /> Export CSV
                    </button>
                    <button onClick={openAdd} className="btn-primary">
                        <Plus size={14} /> New Product
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input-field pl-9" placeholder="Search by name, SKU, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="input-field w-48" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {
                loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {["Name", "SKU", "Category", "UoM", "Cost", "On Hand", "Free to Use", ""].map((h) => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No products found</td></tr>
                                ) : filtered.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-medium text-slate-800">{p.name}</td>
                                        <td className="font-mono text-xs text-slate-500">{p.sku}</td>
                                        <td>
                                            {p.category_name
                                                ? <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.category_name}</span>
                                                : <span className="text-slate-400 text-xs">—</span>}
                                        </td>
                                        <td className="text-slate-500">{p.uom}</td>
                                        <td>${Number(p.cost).toFixed(2)}</td>
                                        <td><span className={cn("font-semibold", p.on_hand === 0 ? "text-red-500" : "text-slate-800")}>{p.on_hand}</span></td>
                                        <td><span className={cn("font-semibold", p.free_to_use === 0 ? "text-red-500" : "text-emerald-600")}>{p.free_to_use}</span></td>
                                        <td>
                                            <div className="flex items-center gap-1 justify-end">
                                                <button onClick={() => openStock(p)} title="Stock by location" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><MapPin size={13} /></button>
                                                <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                                                <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* Product form modal */}
            <Modal open={formModal} onClose={() => setFormModal(false)} title={editing ? "Edit Product" : "New Product"}>
                <div className="space-y-4">
                    {formErr && (
                        <div className="alert-error">
                            <AlertTriangle size={14} /><span>{formErr}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
                            <input className="input-field" placeholder="Widget A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
                            <input className="input-field" placeholder="SKU-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                            <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">— No category —</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.parent_name ? ` (${c.parent_name})` : ""}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Unit of Measure</label>
                            <input className="input-field" placeholder="Units" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Cost ($)</label>
                            <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Min Stock Level</label>
                            <input type="number" min="0" step="1" className="input-field" placeholder="0" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Reorder Qty</label>
                            <input type="number" min="0" step="1" className="input-field" placeholder="0" value={form.reorder_qty} onChange={(e) => setForm({ ...form, reorder_qty: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => setFormModal(false)} className="btn-ghost">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-6">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Stock by location modal */}
            <Modal open={!!stockProd} onClose={() => setStockProd(null)} title={`Stock Levels — ${stockProd?.name}`} size="lg">
                <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">On Hand: <span className="font-semibold text-slate-800">{stockProd?.on_hand}</span></span>
                        <span className="text-slate-500">Free to Use: <span className={cn("font-semibold", stockProd?.free_to_use === 0 ? "text-red-500" : "text-emerald-600")}>{stockProd?.free_to_use}</span></span>
                    </div>
                    {stockLoad ? (
                        <div className="flex items-center justify-center h-24 text-slate-400 gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {["Location", "Short Code", "In", "Out", "Net Stock"].map((h) => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockData.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No movements recorded yet</td></tr>
                                    ) : stockData.map((row) => (
                                        <tr key={row.location_id}>
                                            <td className="font-medium">{row.location_name}</td>
                                            <td className="font-mono text-xs text-slate-500">{row.short_code}</td>
                                            <td className="text-emerald-600 font-medium">+{row.qty_in}</td>
                                            <td className="text-red-500 font-medium">-{row.qty_out}</td>
                                            <td><span className={cn("font-bold", row.net > 0 ? "text-slate-800" : "text-red-500")}>{row.net}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </div >
    );
}

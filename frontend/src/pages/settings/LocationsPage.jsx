import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import SettingsTable from "../../components/ui/SettingsTable";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";

const LOCATION_TYPES = ["Internal", "View", "Customer", "Vendor", "Adjustment"];
const TYPE_COLORS = {
    Internal: "bg-blue-100 text-blue-700",
    View: "bg-slate-100 text-slate-600",
    Customer: "bg-violet-100 text-violet-700",
    Vendor: "bg-emerald-100 text-emerald-700",
    Adjustment: "bg-amber-100 text-amber-700",
};

const EMPTY = { warehouse_id: "", name: "", short_code: "", location_type: "Internal" };

const DEMO_LOCS = [
    { id: 1, warehouse_id: 1, name: "WH/Stock", short_code: "WH/STOCK", location_type: "Internal" },
    { id: 2, warehouse_id: 1, name: "WH/Shelf-A", short_code: "WH/SHELF-A", location_type: "Internal" },
    { id: 3, warehouse_id: null, name: "Virtual/Vendor", short_code: "VIRTUAL/VENDOR", location_type: "Vendor" },
    { id: 4, warehouse_id: null, name: "Virtual/Customer", short_code: "VIRTUAL/CUSTOMER", location_type: "Customer" },
    { id: 5, warehouse_id: null, name: "Virtual/Adjustment", short_code: "VIRTUAL/ADJUSTMENT", location_type: "Adjustment" },
];
const DEMO_WH = [
    { id: 1, name: "Main Warehouse", short_code: "WH" },
];

export default function LocationsPage() {
    const [locations, setLocations] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        Promise.all([api.get("/locations/"), api.get("/warehouses/")])
            .then(([l, w]) => { setLocations(l.data); setWarehouses(w.data); })
            .catch(() => { setLocations(DEMO_LOCS); setWarehouses(DEMO_WH); })
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setModal(true); }
    function openEdit(l) { setEditing(l); setForm({ warehouse_id: l.warehouse_id || "", name: l.name, short_code: l.short_code, location_type: l.location_type }); setError(""); setModal(true); }

    async function handleSave() {
        if (!form.name.trim() || !form.short_code.trim()) { setError("Name and Short Code are required"); return; }
        setError(""); setSaving(true);
        try {
            const payload = { ...form, warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null };
            if (editing) {
                await api.put(`/locations/${editing.id}`, payload);
            } else {
                await api.post("/locations/", payload);
            }
            setModal(false);
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(loc) {
        if (!confirm(`Delete location "${loc.name}"?`)) return;
        try {
            await api.delete(`/locations/${loc.id}`);
            load();
        } catch (e) {
            alert(e.response?.data?.detail || "Delete failed");
        }
    }

    const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w.name]));

    const filtered = locations.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.short_code.toLowerCase().includes(search.toLowerCase())
    );

    const rows = filtered.map((l) => ({
        id: l.id,
        raw: l,
        cells: [
            l.name,
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold">{l.short_code}</span>,
            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[l.location_type] || "bg-slate-100 text-slate-600")}>
                {l.location_type}
            </span>,
            whMap[l.warehouse_id] || <span className="text-slate-400 text-xs">Virtual</span>,
        ],
    }));

    if (loading) return <div className="flex items-center justify-center h-48 text-slate-400 gap-2"><Loader2 size={20} className="animate-spin" /> Loading…</div>;

    return (
        <>
            <SettingsTable
                title="Locations"
                subtitle="Define storage locations and their types"
                columns={["Name", "Short Code", "Type", "Warehouse"]}
                rows={rows}
                search={search}
                onSearch={setSearch}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Location" : "New Location"}>
                <div className="space-y-4">
                    {error && (
                        <div className="alert-error">
                            <AlertTriangle size={14} /><span>{error}</span>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse (leave blank for virtual)</label>
                        <select className="input-field" value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
                            <option value="">— Virtual / No Warehouse —</option>
                            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.short_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                        <input className="input-field" placeholder="WH/Stock" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Short Code</label>
                        <input className="input-field uppercase" placeholder="WH/STOCK" value={form.short_code}
                            onChange={(e) => setForm({ ...form, short_code: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Location Type</label>
                        <select className="input-field" value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })}>
                            {LOCATION_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-6">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

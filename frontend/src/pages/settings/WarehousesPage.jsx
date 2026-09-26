import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import SettingsTable from "../../components/ui/SettingsTable";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";

const EMPTY = { name: "", short_code: "", address: "" };

const DEMO = [
    { id: 1, name: "Main Warehouse", short_code: "WH", address: "123 Industrial Ave" },
    { id: 2, name: "North Depot", short_code: "NDW", address: "456 North Road" },
];

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        api.get("/warehouses/")
            .then(({ data }) => setWarehouses(data))
            .catch(() => setWarehouses(DEMO))
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setModal(true); }
    function openEdit(wh) { setEditing(wh); setForm({ name: wh.name, short_code: wh.short_code, address: wh.address || "" }); setError(""); setModal(true); }

    async function handleSave() {
        if (!form.name.trim() || !form.short_code.trim()) { setError("Name and Short Code are required"); return; }
        setError(""); setSaving(true);
        try {
            if (editing) {
                await api.put(`/warehouses/${editing.id}`, form);
            } else {
                await api.post("/warehouses/", form);
            }
            setModal(false);
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(wh) {
        if (!confirm(`Delete warehouse "${wh.name}"?`)) return;
        try {
            await api.delete(`/warehouses/${wh.id}`);
            load();
        } catch (e) {
            alert(e.response?.data?.detail || "Delete failed");
        }
    }

    const filtered = warehouses.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.short_code.toLowerCase().includes(search.toLowerCase())
    );

    const rows = filtered.map((w) => ({
        id: w.id,
        raw: w,
        cells: [
            w.name,
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold">{w.short_code}</span>,
            w.address || "—",
        ],
    }));

    if (loading) return <Spinner />;

    return (
        <>
            <SettingsTable
                title="Warehouses"
                subtitle="Manage your warehouse locations and short codes"
                columns={["Name", "Short Code", "Address"]}
                rows={rows}
                search={search}
                onSearch={setSearch}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Warehouse" : "New Warehouse"}>
                <div className="space-y-4">
                    {error && <ErrorBanner msg={error} />}
                    <Field label="Name">
                        <input className="input-field" placeholder="Main Warehouse" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="Short Code" hint="Used in reference numbers (e.g. WH → WH/IN/0001)">
                        <input className="input-field uppercase" placeholder="WH" value={form.short_code}
                            onChange={(e) => setForm({ ...form, short_code: e.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="Address (optional)">
                        <input className="input-field" placeholder="123 Industrial Ave" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </Field>
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

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            {children}
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
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
function Spinner() {
    return (
        <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading…
        </div>
    );
}

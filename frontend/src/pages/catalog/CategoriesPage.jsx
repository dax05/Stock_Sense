import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Tag } from "lucide-react";
import SettingsTable from "../../components/ui/SettingsTable";
import Modal from "../../components/ui/Modal";
import api from "../../lib/api";

const EMPTY = { name: "", parent_id: "" };

const DEMO = [
    { id: 1, name: "Electronics", parent_id: null, parent_name: null },
    { id: 2, name: "Components", parent_id: null, parent_name: null },
    { id: 3, name: "Raw Material", parent_id: null, parent_name: null },
    { id: 4, name: "Resistors", parent_id: 1, parent_name: "Electronics" },
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function load() {
        api.get("/categories/")
            .then(({ data }) => setCategories(data))
            .catch(() => setCategories(DEMO))
            .finally(() => setLoading(false));
    }
    useEffect(load, []);

    function openAdd() { setEditing(null); setForm(EMPTY); setError(""); setModal(true); }
    function openEdit(c) { setEditing(c); setForm({ name: c.name, parent_id: c.parent_id || "" }); setError(""); setModal(true); }

    async function handleSave() {
        if (!form.name.trim()) { setError("Name is required"); return; }
        setError(""); setSaving(true);
        try {
            const payload = { name: form.name, parent_id: form.parent_id ? Number(form.parent_id) : null };
            if (editing) {
                await api.put(`/categories/${editing.id}`, payload);
            } else {
                await api.post("/categories/", payload);
            }
            setModal(false);
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(c) {
        if (!confirm(`Delete category "${c.name}"?`)) return;
        try {
            await api.delete(`/categories/${c.id}`);
            load();
        } catch (e) {
            alert(e.response?.data?.detail || "Delete failed");
        }
    }

    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const rows = filtered.map((c) => ({
        id: c.id,
        raw: c,
        cells: [
            <span className="flex items-center gap-2">
                <Tag size={13} className="text-slate-400" />
                {c.name}
            </span>,
            c.parent_name
                ? <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{c.parent_name}</span>
                : <span className="text-slate-400 text-xs">—</span>,
            <span className="text-xs text-slate-400">
                {categories.filter((x) => x.parent_id === c.id).length} sub-categories
            </span>,
        ],
    }));

    if (loading) return (
        <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading…
        </div>
    );

    return (
        <>
            <SettingsTable
                title="Categories"
                subtitle="Organise products into categories and sub-categories"
                columns={["Name", "Parent", "Sub-categories"]}
                rows={rows}
                search={search}
                onSearch={setSearch}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
            />

            <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Category" : "New Category"}>
                <div className="space-y-4">
                    {error && (
                        <div className="alert-error">
                            <AlertTriangle size={14} /><span>{error}</span>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Category Name</label>
                        <input className="input-field" placeholder="e.g. Electronics" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Parent Category (optional)</label>
                        <select className="input-field" value={form.parent_id}
                            onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                            <option value="">— Top-level category —</option>
                            {categories
                                .filter((c) => !editing || c.id !== editing.id)
                                .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

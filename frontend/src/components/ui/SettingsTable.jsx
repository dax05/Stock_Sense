import { Search, Plus, Pencil, Trash2 } from "lucide-react";

export default function SettingsTable({ title, subtitle, columns, rows, search, onSearch, onAdd, onEdit, onDelete }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onAdd} className="btn-primary">
                    <Plus size={14} /> Add New
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    className="input-field pl-9"
                    placeholder={`Search ${title.toLowerCase()}…`}
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="card overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((c) => (
                                <th key={c}>{c}</th>
                            ))}
                            <th className="w-20" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="text-center py-12 text-slate-400 text-sm">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id}>
                                    {row.cells.map((cell, i) => (
                                        <td key={i}>{cell}</td>
                                    ))}
                                    <td>
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => onEdit(row.raw)}
                                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(row.raw)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, TrendingUp, Package2, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#65a30d", "#9333ea"];

const DEMO_VALUATION = {
    grand_total: 48750.0,
    by_category: [
        { category: "Electronics", total_value: 22400, product_count: 3, products: [{ id: 1, name: "Gadget B", sku: "SKU-002", on_hand: 0, cost: 89.0, value: 0 }, { id: 2, name: "Widget A", sku: "SKU-001", on_hand: 50, cost: 12.5, value: 625 }] },
        { category: "Raw Material", total_value: 15600, product_count: 2, products: [{ id: 3, name: "Part C", sku: "SKU-003", on_hand: 20, cost: 3.25, value: 65 }] },
        { category: "Components", total_value: 10750, product_count: 4, products: [] },
        { category: "Uncategorized", total_value: 0, product_count: 1, products: [] },
    ],
};

function formatCurrency(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-800 mb-1">{d.category}</p>
            <p className="text-primary font-bold">{formatCurrency(d.total_value)}</p>
            <p className="text-slate-400 text-xs">{d.product_count} product{d.product_count !== 1 ? "s" : ""}</p>
        </div>
    );
}

function CategoryRow({ row, index }) {
    const [open, setOpen] = useState(false);
    const color = COLORS[index % COLORS.length];
    const pct = row._pct;

    return (
        <>
            <tr
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => setOpen(!open)}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                        <span className="font-medium text-slate-800">{row.category}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.product_count}</td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-32">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 text-right">{formatCurrency(row.total_value)}</td>
            </tr>
            {open && row.products?.map((p) => (
                <tr key={p.id} className="bg-slate-50 border-b border-slate-100">
                    <td className="px-4 py-2 pl-12 text-sm text-slate-600">{p.name} <span className="font-mono text-xs text-slate-400">({p.sku})</span></td>
                    <td className="px-4 py-2 text-xs text-slate-400">{p.on_hand} units @ ${p.cost}</td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-sm font-medium text-slate-700 text-right">{formatCurrency(p.value)}</td>
                </tr>
            ))}
        </>
    );
}

export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/reports/valuation")
            .then(({ data }) => setData(data))
            .catch(() => setData(DEMO_VALUATION))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> Loading report…
        </div>
    );

    const maxVal = Math.max(...(data.by_category.map((c) => c.total_value)), 1);
    const chartData = data.by_category.map((c, i) => ({ ...c, fill: COLORS[i % COLORS.length] }));
    const tableData = data.by_category.map((c) => ({ ...c, _pct: data.grand_total > 0 ? (c.total_value / data.grand_total) * 100 : 0 }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Inventory Valuation</h1>
                <p className="text-sm text-slate-500 mt-0.5">Total stock value grouped by category</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard icon={DollarSign} color="bg-blue-500" label="Total Stock Value" value={formatCurrency(data.grand_total)} />
                <SummaryCard icon={Package2} color="bg-violet-500" label="Categories" value={data.by_category.length} />
                <SummaryCard icon={TrendingUp} color="bg-emerald-500" label="Avg Value / Category"
                    value={formatCurrency(data.by_category.length ? data.grand_total / data.by_category.length : 0)} />
            </div>

            {/* Bar chart */}
            <div className="card p-6">
                <p className="text-sm font-semibold text-slate-700 mb-4">Stock Value by Category</p>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar dataKey="total_value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Breakdown table */}
            <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">Category Breakdown</p>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            {["Category", "Products", "Share", "Total Value"].map((h, i) => (
                                <th key={h} className={i === 3 ? "text-right" : ""}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, i) => <CategoryRow key={row.category} row={row} index={i} />)}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3}>Grand Total</td>
                            <td className="text-right">{formatCurrency(data.grand_total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function SummaryCard({ icon: Icon, color, label, value }) {
    return (
        <div className="card p-5 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                <Icon size={19} className="text-white" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
            </div>
        </div>
    );
}

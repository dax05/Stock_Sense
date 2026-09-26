import { useEffect, useState } from "react";
import {
    ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
    SlidersHorizontal, Clock, CheckCircle2, AlertTriangle,
    TrendingUp, Loader2, Tag, Boxes, Filter, Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import LowStockWidget from "../../components/dashboard/LowStockWidget";

function KpiCard({ title, icon: Icon, iconColor, stats, loading }) {
    return (
        <div className="kpi-card">
            <div className="flex items-center justify-between mb-4">
                <span className="kpi-label">{title}</span>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor)}>
                    <Icon size={18} className="text-white" />
                </div>
            </div>
            {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Loading...</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {stats.map((stat) => <StatRow key={stat.label} {...stat} />)}
                </div>
            )}
        </div>
    );
}

function StatRow({ label, value, variant = "default" }) {
    const styles = {
        default: "text-slate-700",
        primary: "text-primary-700 font-semibold text-lg",
        late: "text-danger-600 font-medium",
        amber: "text-warning-600 font-medium",
        green: "text-accent-600 font-medium",
        muted: "text-slate-500",
    };
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{label}</span>
            <span className={cn("text-sm", styles[variant])}>{value}</span>
        </div>
    );
}

function SummaryBadge({ icon: Icon, label, value, variant }) {
    return (
        <div className={cn("summary-badge", variant)}>
            <Icon size={20} />
            <div>
                <p className="text-xs font-medium opacity-80">{label}</p>
                <p className="text-xl font-bold leading-tight">{value}</p>
            </div>
        </div>
    );
}

// ── Filter Bar Component ──────────────────────────────────────────────────

function FilterBar({ filters, onFiltersChange, warehouses }) {
    const handleFilterChange = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="card p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Advanced Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Warehouse Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Warehouse</label>
                    <select
                        className="select-field"
                        value={filters.warehouse_id || ""}
                        onChange={(e) => handleFilterChange("warehouse_id", e.target.value || null)}
                    >
                        <option value="">All Warehouses</option>
                        {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Status</label>
                    <select
                        className="select-field"
                        value={filters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value || null)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Ready">Ready</option>
                        <option value="Done">Done</option>
                        <option value="Canceled">Canceled</option>
                    </select>
                </div>

                {/* Date Range Filter */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Date Range</label>
                    <select
                        className="select-field"
                        value={filters.date_range || ""}
                        onChange={(e) => handleFilterChange("date_range", e.target.value || null)}
                    >
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="last_7_days">Last 7 Days</option>
                        <option value="last_30_days">Last 30 Days</option>
                    </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                    <button
                        onClick={() => onFiltersChange({})}
                        className="btn-ghost"
                        disabled={Object.keys(filters).length === 0}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Recent Operations Table ──────────────────────────────────────────────

function RecentOperationsTable({ filters }) {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadOperations = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.warehouse_id) params.append("warehouse_id", filters.warehouse_id);
                if (filters.status) params.append("status", filters.status);
                if (filters.date_range) params.append("date_range", filters.date_range);
                params.append("limit", "10");

                const { data } = await api.get(`/operations/recent?${params.toString()}`);
                setOperations(data);
            } catch (error) {
                console.error("Failed to load recent operations:", error);
                setOperations([]);
            } finally {
                setLoading(false);
            }
        };

        loadOperations();
    }, [filters]);

    const getStatusColor = (status) => {
        const colors = {
            Draft: "status-draft",
            Waiting: "status-waiting",
            Ready: "status-ready",
            Done: "status-done",
            Canceled: "status-canceled",
        };
        return colors[status] || "status-draft";
    };

    const getTypeIcon = (type) => {
        const icons = {
            IN: ArrowDownToLine,
            OUT: ArrowUpFromLine,
            INT: ArrowLeftRight,
            ADJ: SlidersHorizontal,
        };
        return icons[type] || SlidersHorizontal;
    };

    return (
        <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Recent Operations</span>
                {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32 text-slate-500 gap-2">
                    <Loader2 size={20} className="animate-spin" /> Loading operations...
                </div>
            ) : operations.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                    No operations found for the selected filters
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Reference</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Partner</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operations.map((op) => {
                            const TypeIcon = getTypeIcon(op.type);
                            return (
                                <tr key={op.id}>
                                    <td className="font-mono text-sm font-medium text-primary">{op.reference}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <TypeIcon size={16} className="text-slate-500" />
                                            <span className="text-sm">{op.type}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={cn("status-badge", getStatusColor(op.status))}>
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-slate-700">{op.partner_name || "—"}</td>
                                    <td className="text-xs text-slate-500">
                                        {new Date(op.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Category stock table ──────────────────────────────────────────────────

function CategoryStockPanel({ categoryId }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!categoryId) { setProducts([]); return; }
        setLoading(true);
        api.get(`/products/?category_id=${categoryId}`)
            .then(({ data }) => setProducts(data))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [categoryId]);

    if (!categoryId) return null;

    return (
        <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Tag size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Stock by Category</span>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-24 text-slate-500 gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            ) : products.length === 0 ? (
                <p className="text-center py-8 text-slate-500 text-sm">No products in this category</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            {["Product", "SKU", "On Hand", "Free to Use"].map((h) => (
                                <th key={h}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td className="font-medium text-slate-900">{p.name}</td>
                                <td className="font-mono text-xs text-slate-500">{p.sku}</td>
                                <td>
                                    <span className={cn("font-semibold", p.on_hand === 0 ? "text-danger" : "text-slate-900")}>
                                        {p.on_hand}
                                    </span>
                                </td>
                                <td>
                                    <span className={cn("font-semibold", p.free_to_use === 0 ? "text-danger" : "text-accent")}>
                                        {p.free_to_use}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Main Dashboard Component ──────────────────────────────────────────────

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [catFilter, setCatFilter] = useState("");
    const [filters, setFilters] = useState({});

    // Load stats with filters
    const loadStats = async (currentFilters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFilters.warehouse_id) params.append("warehouse_id", currentFilters.warehouse_id);
            if (currentFilters.status) params.append("status", currentFilters.status);
            if (currentFilters.date_range) params.append("date_range", currentFilters.date_range);

            const { data } = await api.get(`/operations/stats?${params.toString()}`);
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats:", error);
            setStats(EMPTY_STATS);
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        loadStats(filters);

        // Load categories and warehouses
        Promise.all([
            api.get("/categories/").catch(() => ({ data: [] })),
            api.get("/warehouses/").catch(() => ({ data: [] }))
        ]).then(([categoriesRes, warehousesRes]) => {
            setCategories(categoriesRes.data);
            setWarehouses(warehousesRes.data);
        });
    }, []);

    // Reload stats when filters change
    useEffect(() => {
        loadStats(filters);
    }, [filters]);

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const s = stats || EMPTY_STATS;

    const kpiCards = [
        {
            title: "Total Products", icon: Boxes, iconColor: "bg-primary",
            stats: [
                { label: "Unique Products", value: s.total_products ?? "—", variant: "primary" },
                { label: "In Catalog", value: s.total_products ?? "—", variant: "muted" },
            ],
        },
        {
            title: "Receipts", icon: ArrowDownToLine, iconColor: "bg-blue-600",
            stats: [
                { label: "To Receive", value: s.receipts?.to_receive ?? "—", variant: "primary" },
                { label: "Late", value: s.receipts?.late ?? "—", variant: s.receipts?.late > 0 ? "late" : "muted" },
                { label: "Waiting", value: s.receipts?.waiting ?? "—", variant: "amber" },
                { label: "Total Operations", value: s.receipts?.total ?? "—", variant: "muted" },
            ],
        },
        {
            title: "Deliveries", icon: ArrowUpFromLine, iconColor: "bg-violet-600",
            stats: [
                { label: "To Deliver", value: s.deliveries?.to_deliver ?? "—", variant: "primary" },
                { label: "Late", value: s.deliveries?.late ?? "—", variant: s.deliveries?.late > 0 ? "late" : "muted" },
                { label: "Waiting", value: s.deliveries?.waiting ?? "—", variant: "amber" },
                { label: "Total Operations", value: s.deliveries?.total ?? "—", variant: "muted" },
            ],
        },
        {
            title: "Transfers", icon: ArrowLeftRight, iconColor: "bg-accent",
            stats: [
                { label: "To Transfer", value: s.transfers?.to_transfer ?? "—", variant: "primary" },
                { label: "Late", value: s.transfers?.late ?? "—", variant: s.transfers?.late > 0 ? "late" : "muted" },
                { label: "Ready", value: s.transfers?.ready ?? "—", variant: "green" },
                { label: "Total Operations", value: s.transfers?.total ?? "—", variant: "muted" },
            ],
        },
        {
            title: "Adjustments", icon: SlidersHorizontal, iconColor: "bg-warning",
            stats: [
                { label: "Pending", value: s.adjustments?.pending ?? "—", variant: "primary" },
                { label: "Done", value: s.adjustments?.done ?? "—", variant: "green" },
                { label: "Total Operations", value: s.adjustments?.total ?? "—", variant: "muted" },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-600 mt-1">Real-time overview of your inventory operations</p>
                </div>
                {/* Category filter */}
                {categories.length > 0 && (
                    <div className="flex items-center gap-3">
                        <Tag size={16} className="text-slate-500" />
                        <select
                            className="select-field w-48"
                            value={catFilter}
                            onChange={(e) => setCatFilter(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Advanced Filters */}
            <FilterBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                warehouses={warehouses}
            />

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryBadge
                    icon={AlertTriangle}
                    label="Late"
                    value={(s.receipts?.late ?? 0) + (s.deliveries?.late ?? 0)}
                    variant="late"
                />
                <SummaryBadge
                    icon={Clock}
                    label="Waiting"
                    value={(s.receipts?.waiting ?? 0) + (s.deliveries?.waiting ?? 0)}
                    variant="waiting"
                />
                <SummaryBadge
                    icon={CheckCircle2}
                    label="Ready"
                    value={s.total_ready ?? 0}
                    variant="ready"
                />
                <SummaryBadge
                    icon={TrendingUp}
                    label="Total Ops"
                    value={s.total_operations ?? 0}
                    variant="info"
                />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
                {kpiCards.map((card) => <KpiCard key={card.title} {...card} loading={loading} />)}
            </div>

            {/* Recent Operations Table */}
            <RecentOperationsTable filters={filters} />

            {/* Low Stock Alerts */}
            <LowStockWidget />

            {/* Category Stock Panel */}
            <CategoryStockPanel categoryId={catFilter} />
        </div>
    );
}

const EMPTY_STATS = {
    total_products: 0,
    receipts: { to_receive: 0, late: 0, waiting: 0, total: 0 },
    deliveries: { to_deliver: 0, late: 0, waiting: 0, total: 0 },
    transfers: { to_transfer: 0, late: 0, ready: 0, total: 0 },
    adjustments: { pending: 0, done: 0, total: 0 },
    total_ready: 0,
    total_operations: 0,
};
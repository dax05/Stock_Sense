import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Bell } from "lucide-react";
import { useLowStock } from "../../hooks/useLowStock";

const BREADCRUMBS = {
    "/dashboard": ["Dashboard"],
    "/history": ["Move History"],
    "/operations/receipts": ["Operations", "Receipts"],
    "/operations/deliveries": ["Operations", "Deliveries"],
    "/operations/transfers": ["Operations", "Transfers"],
    "/operations/adjustments": ["Operations", "Adjustments"],
    "/products": ["Catalog", "Products"],
    "/categories": ["Catalog", "Categories"],
    "/settings/warehouses": ["System", "Warehouses"],
    "/settings/locations": ["System", "Locations"],
    "/reports": ["Reports"],
};

export default function Topbar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const crumbs = BREADCRUMBS[pathname] || [pathname.replace("/", "")];
    const { count, items } = useLowStock();
    const [showPanel, setShowPanel] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-30">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm">
                {crumbs.map((crumb, i) => (
                    <div key={crumb} className="flex items-center gap-2">
                        {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
                        <span className={i === crumbs.length - 1
                            ? "font-semibold text-slate-900"
                            : "text-slate-500"
                        }>
                            {crumb}
                        </span>
                    </div>
                ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowPanel(!showPanel)}
                        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                        {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {count > 9 ? "9+" : count}
                            </span>
                        )}
                    </button>

                    {showPanel && (
                        <>
                            <div className="fixed inset-0" onClick={() => setShowPanel(false)} />
                            <div className="absolute right-0 top-12 w-80 card overflow-hidden z-50 shadow-card-hover">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                    <span className="text-sm font-semibold text-slate-900">Low Stock Alerts</span>
                                    {count > 0 && (
                                        <span className="text-xs bg-danger-100 text-danger-700 font-semibold px-2 py-1 rounded-full">
                                            {count} items
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto">
                                    {count === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                                            <Bell size={20} strokeWidth={1.5} />
                                            <p className="text-xs">All stock levels are healthy</p>
                                        </div>
                                    ) : (
                                        items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-danger-600">{item.free_to_use} {item.uom}</p>
                                                    <p className="text-xs text-slate-500">min: {item.min_stock_level}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {count > 0 && (
                                    <div className="px-4 py-3 border-t border-slate-200">
                                        <button
                                            onClick={() => { setShowPanel(false); navigate("/dashboard"); }}
                                            className="w-full text-xs text-primary font-semibold hover:underline"
                                        >
                                            View all alerts on Dashboard →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* User Avatar */}
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold select-none shadow-subtle">
                    A
                </div>
            </div>
        </header>
    );
}

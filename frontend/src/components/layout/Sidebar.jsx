import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, History, ChevronDown,
    ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
    SlidersHorizontal, Boxes, Tag, Warehouse, MapPin, LogOut, BarChart2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

const NAV = [
    {
        group: "Main",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
            { label: "Move History", icon: History, to: "/history" },
            { label: "Reports", icon: BarChart2, to: "/reports" },
        ],
    },
    {
        group: "Operations",
        collapsible: true,
        items: [
            { label: "Receipts", icon: ArrowDownToLine, to: "/operations/receipts" },
            { label: "Deliveries", icon: ArrowUpFromLine, to: "/operations/deliveries" },
            { label: "Transfers", icon: ArrowLeftRight, to: "/operations/transfers" },
            { label: "Adjustments", icon: SlidersHorizontal, to: "/operations/adjustments" },
        ],
    },
    {
        group: "Catalog",
        items: [
            { label: "Products", icon: Boxes, to: "/products" },
            { label: "Categories", icon: Tag, to: "/categories" },
        ],
    },
    {
        group: "System",
        items: [
            { label: "Warehouses", icon: Warehouse, to: "/settings/warehouses" },
            { label: "Locations", icon: MapPin, to: "/settings/locations" },
        ],
    },
];

export default function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [opsOpen, setOpsOpen] = useState(true);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <aside className="w-64 shrink-0 h-screen bg-white border-r border-slate-200 flex flex-col">
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
                {/* Logo */}
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-subtle">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.95" />
                        <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.7" />
                        <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.7" />
                        <rect x="11" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.95" />
                    </svg>
                </div>
                {/* Brand Name */}
                <div className="leading-tight">
                    <div className="text-base font-bold text-slate-900 tracking-tight">CoreInventory</div>
                    <div className="text-xs text-slate-500 font-medium">Professional Management</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {NAV.map((section) => (
                    <div key={section.group}>
                        {section.collapsible ? (
                            <>
                                <button
                                    onClick={() => setOpsOpen(!opsOpen)}
                                    className="flex items-center justify-between w-full px-3 mb-2 group"
                                >
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
                                        {section.group}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={cn("text-slate-400 transition-transform duration-200", opsOpen && "rotate-180")}
                                    />
                                </button>
                                {opsOpen && (
                                    <div className="space-y-1">
                                        {section.items.map((item) => (
                                            <SidebarItem key={item.to} {...item} />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                                    {section.group}
                                </div>
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <SidebarItem key={item.to} {...item} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className="px-4 py-4 border-t border-slate-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

function SidebarItem({ label, icon: Icon, to }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn("sidebar-link", isActive && "active")}
        >
            <Icon size={18} />
            <span>{label}</span>
        </NavLink>
    );
}

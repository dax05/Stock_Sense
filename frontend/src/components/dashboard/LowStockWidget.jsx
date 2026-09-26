import { AlertTriangle, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useLowStock } from "../../hooks/useLowStock";

export default function LowStockWidget() {
    const { count, items } = useLowStock();
    const navigate = useNavigate();

    // Pre-fill a receipt draft for this product
    function handleCreatePR(item) {
        // Store intent in sessionStorage — ReceiptsPage picks it up
        sessionStorage.setItem("prefill_receipt", JSON.stringify({
            partner_name: `Reorder: ${item.name}`,
            product_id: item.id,
            qty: item.reorder_qty || item.min_stock_level,
        }));
        navigate("/operations/receipts");
    }

    if (count === 0) return null;

    return (
        <div className="card overflow-hidden border-danger-200">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-danger-50 border-b border-danger-200">
                <AlertTriangle size={18} className="text-danger" />
                <span className="text-sm font-semibold text-danger-900">Low Stock Alerts</span>
                <span className="ml-auto text-xs bg-danger text-white font-bold px-2.5 py-1 rounded-full">{count}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            {["Product", "SKU", "Category", "Free to Use", "Min Level", "Shortage", ""].map((h) => (
                                <th key={h}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-danger-50/40">
                                <td className="font-medium text-slate-900">{item.name}</td>
                                <td className="font-mono text-xs text-slate-500">{item.sku}</td>
                                <td className="text-slate-600 text-xs">{item.category_name || "—"}</td>
                                <td>
                                    <span className="font-bold text-danger">{item.free_to_use} {item.uom}</span>
                                </td>
                                <td className="text-slate-700">{item.min_stock_level} {item.uom}</td>
                                <td>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                                        item.shortage > item.min_stock_level * 0.5
                                            ? "bg-danger-100 text-danger-700 border border-danger-200"
                                            : "bg-warning-100 text-warning-700 border border-warning-200"
                                    )}>
                                        <AlertTriangle size={12} />
                                        -{item.shortage} {item.uom}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleCreatePR(item)}
                                        className="btn-secondary text-xs"
                                    >
                                        <ShoppingCart size={14} />
                                        {item.reorder_qty > 0 ? `Order ${item.reorder_qty}` : "Create PR"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

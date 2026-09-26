import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { testConnectivity } from "./lib/api";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ReceiptsPage from "./pages/operations/ReceiptsPage";
import DeliveriesPage from "./pages/operations/DeliveriesPage";
import AdjustmentsPage from "./pages/operations/AdjustmentsPage";
import TransfersPage from "./pages/operations/TransfersPage";
import MoveHistoryPage from "./pages/history/MoveHistoryPage";
import ProductsPage from "./pages/catalog/ProductsPage";
import CategoriesPage from "./pages/catalog/CategoriesPage";
import WarehousesPage from "./pages/settings/WarehousesPage";
import ReportsPage from "./pages/reports/ReportsPage";
import LocationsPage from "./pages/settings/LocationsPage";

export default function App() {
  // Test backend connectivity on app mount
  useEffect(() => {
    const checkConnectivity = async () => {
      const result = await testConnectivity();
      if (result.success) {
        console.log("✅ Backend connectivity verified:", result.data);
      } else {
        console.error("❌ Backend connectivity failed:", result.error);
      }
    };

    checkConnectivity();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<MoveHistoryPage />} />
            <Route path="/operations/receipts" element={<ReceiptsPage />} />
            <Route path="/operations/deliveries" element={<DeliveriesPage />} />
            <Route path="/operations/transfers" element={<TransfersPage />} />
            <Route path="/operations/adjustments" element={<AdjustmentsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/settings/warehouses" element={<WarehousesPage />} />
            <Route path="/settings/locations" element={<LocationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

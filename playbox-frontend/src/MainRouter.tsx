import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./pages/OwnerDashboard";
import { isAdminLoggedIn } from "./utils/auth";

export default function MainRouter() {
  return (
    <HashRouter>
      <Routes>

        {/* Login Page */}
        <Route
          path="/login"
          element={
            isAdminLoggedIn() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={() => window.location.reload()} />
            )
          }
        />

        {/* Staff / RFID Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* Owner Dashboard */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </HashRouter>
  );
}

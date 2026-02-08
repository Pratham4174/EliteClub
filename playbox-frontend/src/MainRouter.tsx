import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./pages/OwnerDashboard";

import PlayerProtectedRoute from "./components/PlayerProtectedRoute";
import MyBookings from "./pages/MyBookings";
import PlayerHome from "./pages/PlayerHome";
import ProfilePage from "./pages/ProfilePage";
import SlotPage from "./pages/SlotPage";
import SportPage from "./pages/SportPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import UsersListPage from "./pages/UsersListPage";

export default function MainRouter() {
  return (
    <HashRouter>
      <Routes>

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <UserDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Player Routes */}
        <Route
          path="/player-dashboard"
          element={
            <PlayerProtectedRoute>
              <PlayerHome />
            </PlayerProtectedRoute>
          }
        />

        <Route
          path="/book-slot/:sportId"
          element={
            <PlayerProtectedRoute>
              <SlotPage />
            </PlayerProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <PlayerProtectedRoute>
              <MyBookings />
            </PlayerProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PlayerProtectedRoute>
              <ProfilePage />
            </PlayerProtectedRoute>
          }
        />
        <Route
  path="/sports"
  element={
    <PlayerProtectedRoute>
      <SportPage />
    </PlayerProtectedRoute>
  }
/>

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </HashRouter>
  );
}

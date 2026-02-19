import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../utils/auth";
import { isPlayerLoggedIn } from "../utils/playerAuth";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  if (isPlayerLoggedIn() && !isAdminLoggedIn()) {
    return <Navigate to="/player-dashboard" replace />;
  }

  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

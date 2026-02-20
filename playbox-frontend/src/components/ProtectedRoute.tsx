import type { JSX } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../utils/auth";
import { isPlayerLoggedIn } from "../utils/playerAuth";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const adminLoggedIn = isAdminLoggedIn();
  const playerLoggedIn = isPlayerLoggedIn();

  useEffect(() => {
    if (adminLoggedIn) {
      document.body.classList.add("admin-theme");
    } else {
      document.body.classList.remove("admin-theme");
    }

    return () => {
      document.body.classList.remove("admin-theme");
    };
  }, [adminLoggedIn]);

  if (playerLoggedIn && !adminLoggedIn) {
    return <Navigate to="/player-dashboard" replace />;
  }

  if (!adminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../utils/auth";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

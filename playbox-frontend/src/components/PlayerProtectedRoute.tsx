import { Navigate } from "react-router-dom";
import { useEffect } from "react";

export default function PlayerProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = localStorage.getItem("player");

  useEffect(() => {
    document.body.classList.remove("admin-theme");
  }, []);

  if (!player) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

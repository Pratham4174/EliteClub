import { Navigate } from "react-router-dom";

export default function PlayerProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = localStorage.getItem("player");

  if (!player) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

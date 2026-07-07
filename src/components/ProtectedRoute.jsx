import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

function ProtectedRoute({
  children,
  allowedRoles
})
{
  const { role } = useAuth();

  if (!role)
  {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!allowedRoles.includes(role))
  {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
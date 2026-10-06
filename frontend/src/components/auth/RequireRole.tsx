import { Outlet } from "react-router-dom";

import ResourceNotFound from "../ui/ResourceNotFound";
import { useAuth } from "../../auth/useAuth";
import type { UserRole } from "../../types/api/user";

interface RequireRoleProps {
  allowedRoles: NonNullable<UserRole>[];
}

function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user || user.role === null || !allowedRoles.includes(user.role)) {
    return (
      <ResourceNotFound
        title="Access denied"
        message="You don't have permission to view this page."
        backTo="/"
        backLabel="Back to home"
      />
    );
  }

  return <Outlet />;
}

export default RequireRole;

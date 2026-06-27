/**
 * Super Admin Restaurant Management — useSuperAdmin hook
 * PR 2: Server Functions + Hook
 */

import { useQuery } from "@tanstack/react-query";
import { checkSuperAdminRole } from "../admin.functions";

interface UseSuperAdminResult {
  isSuperAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Returns whether the current authenticated user has the super_admin role.
 * Calls the checkSuperAdminRole server function (which uses the auth token
 * from the request to identify the user).
 */
export function useSuperAdmin(): UseSuperAdminResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin", "role-check"],
    queryFn: () => checkSuperAdminRole(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  return {
    isSuperAdmin: data ?? false,
    isLoading,
    isError,
  };
}

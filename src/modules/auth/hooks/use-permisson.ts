"use client";

import { useMemo } from "react";

import type { Select } from "@convex/api";

import { authClient } from "@/lib/convex/auth-client";

export type UserRole = Select<"user">["role"];

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const satisfies Record<string, UserRole>;

export const PERMISSIONS = {
  META_READ: "meta:read",
  META_WRITE: "meta:write",
  EMPLOYEE_MANAGE: "employee:manage",
  REWARD_MANAGE: "reward:manage",
  TRANSACTION_MANAGE: "transaction:manage",
  EVENT_MANAGE: "event:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    PERMISSIONS.META_READ,
    PERMISSIONS.META_WRITE,
    PERMISSIONS.EMPLOYEE_MANAGE,
    PERMISSIONS.REWARD_MANAGE,
    PERMISSIONS.TRANSACTION_MANAGE,
    PERMISSIONS.EVENT_MANAGE,
  ],
  user: [],
};

function resolveRole(
  userRole: string | undefined,
): UserRole | undefined {
  const role = userRole

  if (role === ROLES.ADMIN || role === ROLES.USER) {
    return role;
  }

  return undefined;
}

export function canShowByRole(
  item: { isAdmin?: boolean },
  isAdmin: boolean,
) {
  return !item.isAdmin || isAdmin;
}

export function usePermission() {
  const { data: session, isPending, isRefetching } = authClient.useSession();

  const role = resolveRole(session?.user?.role);

  return useMemo(() => {
    const isAuthenticated = !!session;
    const isAdmin = role === ROLES.ADMIN;
    const isUser = role === ROLES.USER;

    const hasRole = (required: UserRole | readonly UserRole[]) => {
      if (!role) return false;

      const roles = Array.isArray(required) ? required : [required];
      return roles.includes(role);
    };

    const can = (permission: Permission) => {
      if (!role) return false;
      return ROLE_PERMISSIONS[role].includes(permission);
    };

    return {
      role,
      session,
      isLoading: isPending || isRefetching,
      isAuthenticated,
      isAdmin,
      isUser,
      hasRole,
      can,
    };
  }, [role, session, isPending, isRefetching]);
}

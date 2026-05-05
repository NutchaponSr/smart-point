"use client";

import { Loader2 } from "lucide-react";

import {
  Authenticated,
  AuthLoading,
} from "convex/react";

interface Props {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </AuthLoading>
      <Authenticated>
        {children}
      </Authenticated>
    </>
  );

}
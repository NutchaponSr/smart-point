"use client";

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
        Loading
      </AuthLoading>
      <Authenticated>
        {children}
      </Authenticated>
    </>
  );

}
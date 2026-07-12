"use client";

import {
  Authenticated,
  AuthLoading,
} from "convex/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

interface Props {
  children: React.ReactNode;
}

const DailyLoginClaimer = () => {
  const crpc = useCRPC();
  const queryClient = useQueryClient();

  const { mutate: claim } = useMutation(crpc.wallet.dailyLogin.mutationOptions());

  useEffect(() => {
    claim({}, {
      onSuccess: (data) => {
        if (!data.claimed) return;

        toast.success("ได้รับ +1 Special Point จากการเข้าสู่ระบบวันนี้!");
      },
    });
  }, [claim]);

  return null;
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
        <DailyLoginClaimer />
        {children}
      </Authenticated>
    </>
  );
}
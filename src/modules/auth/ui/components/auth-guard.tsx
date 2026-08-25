"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Authenticated, AuthLoading } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";

interface Props {
  children: React.ReactNode;
}

const DailyLoginClaimer = () => {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("auth.bonus");

  const { mutate: claim } = useMutation(
    crpc.wallet.dailyLogin.mutationOptions(),
  );

  useEffect(() => {
    claim(
      {},
      {
        onSuccess: (data) => {
          if (!data.checkedIn) return;

          if (data.firstLoginAwarded) {
            toast.success(t("first-login"));
          }
          if (data.loginStreakAwarded) {
            toast.success(t("login-streak"));
          }

          if (data.firstLoginAwarded || data.loginStreakAwarded) {
            void queryClient.invalidateQueries({
              queryKey: crpc.wallet.getOne.queryKey(),
            });
            void queryClient.invalidateQueries({
              queryKey: crpc.activityLog.getLatest.queryKey(),
            });
          }
        },
      },
    );
  }, [claim, crpc.activityLog.getLatest, crpc.wallet.getOne, queryClient, t]);

  return null;
};

export const AuthGuard = ({ children }: Props) => {
  return (
    <>
      <AuthLoading>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </AuthLoading>
      <Authenticated>
        <DailyLoginClaimer />
        {children}
      </Authenticated>
    </>
  );
};

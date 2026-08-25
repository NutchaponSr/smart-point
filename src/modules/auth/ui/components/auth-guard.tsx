"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Authenticated, AuthLoading } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";

interface Props {
  children: React.ReactNode;
}

/** Asia/Bangkok date key — matches convex/lib/program-rules.thaiDateKey */
function thaiDateKey(nowMs = Date.now()): string {
  const thai = new Date(nowMs + 7 * 60 * 60 * 1000);
  return `${thai.getUTCFullYear()}-${String(thai.getUTCMonth() + 1).padStart(2, "0")}-${String(thai.getUTCDate()).padStart(2, "0")}`;
}

const DailyLoginClaimer = () => {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("auth.bonus");
  const inFlightRef = useRef(false);

  const { mutate: claim } = useMutation(
    crpc.wallet.dailyLogin.mutationOptions(),
  );

  useEffect(() => {
    const storageKey = `dailyLoginClaimed:${thaiDateKey()}`;

    try {
      if (sessionStorage.getItem(storageKey) === "1") return;
    } catch {
      // private mode / blocked storage — fall through to ref guard
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    claim(
      {},
      {
        onSuccess: (data) => {
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch {
            // ignore
          }

          if (!data.checkedIn) return;

          if (data.firstLoginAwarded) {
            toast.success(t("first-login"));
          }
          if (data.loginStreakAwarded) {
            toast.success(t("login-streak"));
          }

          void queryClient.invalidateQueries({
            queryKey: crpc.wallet.getOne.queryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: crpc.activityLog.getLatest.queryKey({ limit: 10 }),
          });
        },
        onError: () => {
          inFlightRef.current = false;
        },
      },
    );
  }, [claim]);

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

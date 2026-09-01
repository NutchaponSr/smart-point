"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Authenticated, AuthLoading } from "convex/react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { FIRST_LOGIN_POINTS } from "../../../../../convex/lib/bonuses";
import { authClient } from "@/lib/convex/auth-client";
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
  const { data: session } = authClient.useSession();
  const claimedKeyRef = useRef<string | null>(null);

  const userKey =
    session?.user?.employeeId ?? session?.user?.id ?? null;

  const { mutate: claim } = useMutation(
    crpc.wallet.dailyLogin.mutationOptions(),
  );

  useEffect(() => {
    if (!userKey) return;

    const storageKey = `dailyLoginClaimed:${userKey}:${thaiDateKey()}`;

    try {
      if (sessionStorage.getItem(storageKey) === "1") return;
    } catch {
      // private mode / blocked storage — fall through to ref guard
    }

    if (claimedKeyRef.current === storageKey) return;
    claimedKeyRef.current = storageKey;

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

          const awarded = data.firstLoginAwarded || data.loginStreakAwarded;

          if (data.firstLoginAwarded) {
            toast.success(t("first-login", { amount: FIRST_LOGIN_POINTS }));
          }
          if (data.loginStreakAwarded) {
            toast.success(t("login-streak"));
          }

          if (!awarded) return;

          void queryClient.invalidateQueries({
            queryKey: crpc.wallet.getOne.queryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: crpc.activityLog.getLatest.queryKey(),
          });
        },
        onError: () => {
          if (claimedKeyRef.current === storageKey) {
            claimedKeyRef.current = null;
          }
        },
      },
    );
  }, [claim, userKey, queryClient, crpc, t]);

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

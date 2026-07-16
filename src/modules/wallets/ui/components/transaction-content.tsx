"use client";

import Image from "next/image";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SendStep } from "@/modules/wallets/ui/components/send-step";
import { CompleteStep } from "@/modules/wallets/ui/components/complete-step";
import { SendPointHelpPopover } from "@/modules/wallets/ui/components/send-point-help-popover";

import {
  sendTransactionSchema,
  SendTransactionSchema,
  stepFields,
} from "@/modules/wallets/schema";

import brickCorner from "../../../../../public/brick_high_slope_inverted_left_2.svg";

type Step = "send" | "complete";
type Direction = "forward" | "backward";

interface Props {
  showHeader?: boolean;
  givingBudget: number;
  receivingBudget: number;
  className?: string;
}

const stepTitles: Record<Step, string> = {
  send: "เพื่อนพนักงานที่คุณต้องการชื่นชม",
  complete: "ส่งคำชมสำเร็จ!",
};

export const TransactionContent = ({
  showHeader = true,
  givingBudget,
  className,
}: Props) => {
  const crpc = useCRPC();

  const { data: user } = useSuspenseQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  const transaction = useMutation(crpc.transaction.send.mutationOptions());

  const [step, setStep] = useState<Step>("send");
  const [direction, setDirection] = useState<Direction>("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = (nextStep: Step, dir: Direction) => {
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsAnimating(false);
    }, 200);
  };

  const form = useForm<SendTransactionSchema>({
    resolver: zodResolver(sendTransactionSchema),
    mode: "onChange",
    defaultValues: {
      employee: {
        id: "",
        name: "",
        email: "",
        department: "",
      },
      amount: 5,
      message: "",
      tags: "",
    },
  });

  const selectedReceiverId = useWatch({
    control: form.control,
    name: "employee.id",
  });
  const selectedAmount = useWatch({
    control: form.control,
    name: "amount",
  });

  const { data: monthlyQuota } = useQuery({
    ...crpc.transaction.getMonthlyTransferQuota.queryOptions({
      receiverId: selectedReceiverId?.trim() || "_",
    }),
    enabled: Boolean(selectedReceiverId?.trim()) && step === "send",
  });

  const quotaBlocksSend =
    monthlyQuota?.enabled === true &&
    step === "send" &&
    monthlyQuota != null &&
    (monthlyQuota.remaining === 0 || selectedAmount > monthlyQuota.remaining);

  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-md border-2 border-[#e5e5e5] bg-white",
        className,
      )}
    >
      <header
        data-show={showHeader}
        className="relative grid content-start overflow-hidden rounded-t-md border-b-2 border-[#e5e5e5] bg-[#1cb0f6] px-4 py-4 data-[show=false]:hidden"
      >
        <Image
          src={brickCorner}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-px -bottom-px size-12"
        />
        <div className="relative z-1 flex items-center gap-2">
          <h2 className="text-base font-bold leading-snug text-white">
            {stepTitles[step]}
          </h2>
        </div>
      </header>

      <FormProvider {...form}>
        <div
          className={cn(
            "w-full bg-white p-4 transition-all duration-200",
            isAnimating && direction === "forward" && "translate-x-8 opacity-0",
            isAnimating &&
              direction === "backward" &&
              "-translate-x-8 opacity-0",
            !isAnimating && "translate-x-0 opacity-100",
          )}
        >
          {step === "send" && <SendStep points={givingBudget} user={user} />}
          {step === "complete" && <CompleteStep />}
        </div>
      </FormProvider>

      <footer className="rounded-b-md bg-white px-4 pb-4">
        <Button
          size="lg"
          variant="secondary"
          className="w-full rounded-md font-bold tracking-wide uppercase"
          disabled={transaction.isPending || quotaBlocksSend}
          onClick={async () => {
            if (step === "complete") {
              animate("send", "backward");
              form.reset();
              return;
            }

            const fieldsToValidate =
              stepFields[step as keyof typeof stepFields];
            const isValid = await form.trigger(fieldsToValidate);

            if (!isValid) {
              return;
            }

            const values = form.getValues();

            try {
              await transaction.mutateAsync({
                receiverId: values.employee.id,
                amount: values.amount,
                message: values.message,
                tags: values.tags ?? "",
              });
              animate("complete", "forward");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "ส่งพอยต์ไม่สำเร็จ",
              );
            }
          }}
        >
          {transaction.isPending
            ? "กำลังส่ง..."
            : step === "send"
              ? "ส่ง"
              : "ส่งอีกครั้ง"}
        </Button>
      </footer>
    </section>
  );
};

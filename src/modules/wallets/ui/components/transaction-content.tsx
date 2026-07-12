"use client";

import Image from "next/image";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SendStep } from "@/modules/wallets/ui/components/send-step";
import { CompleteStep } from "@/modules/wallets/ui/components/complete-step";
import { SendPointHelpPopover } from "@/modules/wallets/ui/components/send-point-help-popover";

import {
  sendTransactionSchema,
  SendTransactionSchema,
  stepFields
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

export const TransactionContent = ({ showHeader = true, givingBudget, className }: Props) => {
  const crpc = useCRPC();

  const { data: user } = useSuspenseQuery(crpc.user.getCurrentUser.queryOptions());

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

  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-md border-2 border-[#e5e5e5] bg-white",
        className,
      )}
    >
      <header
        data-show={showHeader}
        className="relative grid content-start overflow-hidden rounded-t-md bg-[#1cb0f6] border-b-2 border-[#e5e5e5] px-4 py-4 data-[show=false]:hidden"
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
          {step === "send" && <SendPointHelpPopover variant="light" />}
        </div>
      </header>

      <FormProvider {...form}>
        <div
          className={cn(
            "w-full bg-white p-4 transition-all duration-200",
            isAnimating && direction === "forward" && "translate-x-8 opacity-0",
            isAnimating && direction === "backward" && "-translate-x-8 opacity-0",
            !isAnimating && "translate-x-0 opacity-100",
          )}
        >
          {step === "send" && (
            <SendStep
              points={givingBudget}
              user={user}
            />
          )}
          {step === "complete" && (
            <CompleteStep />
          )}
        </div>
      </FormProvider>

      <footer className="rounded-b-md bg-white pb-4 px-4">
        <Button
          variant="secondary"
          className="w-full rounded-md font-bold uppercase tracking-wide"
          disabled={transaction.isPending}
          onClick={async () => {
            if (step === "complete") {
              animate("send", "backward");
              form.reset();
              return;
            }

            const fieldsToValidate = stepFields[step as keyof typeof stepFields];
            const isValid = await form.trigger(fieldsToValidate);

            if (!isValid) {
              return;
            }

            const values = form.getValues();

            await transaction.mutateAsync({
              receiverId: values.employee.id,
              amount: values.amount,
              message: values.message,
              tags: values.tags ?? "",
            });

            animate("complete", "forward");
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

"use client";

import { useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SendStep } from "@/modules/wallets/ui/components/send-step";
import { OptionsStep } from "@/modules/wallets/ui/components/options-step";
import { CompleteStep } from "@/modules/wallets/ui/components/complete-step";

import {
  sendTransactionSchema,
  SendTransactionSchema,
  stepFields
} from "@/modules/wallets/schema";

type Step = "send" | "options" | "complete";
type Direction = "forward" | "backward";

interface Props {
  showHeader?: boolean;
  givingBudget: number;
  receivingBudget: number;
  className?: string;
}

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
    <section className={cn("grid rounded-xs grid-cols-1 border-2 border-border", className)}>
      <header data-show={showHeader} className="data-[show=false]:hidden grid content-start border-b-2 p-4 border-border">
        <div className="flex items-center gap-2 h-8">
          {step === "options" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => animate("send", "backward")}
              aria-label="ย้อนกลับ"
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
          )}
          <h2 className="text-[20px] font-normal leading-[1.3]">
            {step === "send" ? "เพื่อนพนักงานที่คุณต้องการชื่นชม" : step === "options" ? "ตรวจสอบข้อมูล" : "การส่งเงินสำเร็จ"}
          </h2>
        </div>
      </header>

      <FormProvider {...form}>
        <div className={cn(
          "w-full transition-all duration-200 p-4 bg-background",
          isAnimating && direction === "forward" && "translate-x-8 opacity-0",
          isAnimating && direction === "backward" && "-translate-x-8 opacity-0",
          !isAnimating && "translate-x-0 opacity-100",
        )}>
          <div className="grid gap-8">
            {step === "send" && (
              <SendStep
                points={givingBudget}
                user={user}
              />
            )}
            {step === "options" && (
              <OptionsStep user={user} />
            )}
            {step === "complete" && (
              <CompleteStep />
            )}
          </div>
        </div>
      </FormProvider>

      <footer className="p-4 border-t-2 border-dashed border-border">
        <Button
          className="w-full"
          disabled={transaction.isPending}
          onClick={async () => {
            if (step === "complete") {
              animate("send", "backward");
              return;
            }

            const fieldsToValidate = stepFields[step as keyof typeof stepFields];
            const isValid = await form.trigger(fieldsToValidate);

            if (!isValid) {
              console.log("Invalid form", form.formState.errors);
              return;
            };

            if (step === "send") {
              animate("options", "forward");
            } else if (step === "options") {
              const values = form.getValues();

              transaction.mutate({
                receiverId: values.employee.id,
                amount: values.amount,
                message: values.message,
                tags: values.tags ?? "",
              }, {
                onSuccess: () => {
                  form.reset();
                  animate("complete", "forward");
                },
                onError: (error) => {
                  console.error("Transaction failed:", error);
                }
              });
            }
          }}
        >
          {transaction.isPending ? "กำลังส่ง..." : step === "send" ? "ต่อไป" : step === "options" ? "ยืนยันการส่ง" : "ย้อนกลับ"}
        </Button>
      </footer>
    </section>
  );
};
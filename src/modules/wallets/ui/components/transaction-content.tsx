"use client";

import { useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { SendStep } from "@/modules/wallets/ui/components/send-step";
import { OptionsStep } from "@/modules/wallets/ui/components/options-step";

import { 
  sendTransactionSchema, 
  SendTransactionSchema, 
  stepFields 
} from "@/modules/wallets/schema";
import { cn } from "@/lib/utils";
import { CompleteStep } from "./complete-step";

type Step = "send" | "options" | "complete";
type Direction = "forward" | "backward";

interface Props {
  givingBudget: number;
  receivingBudget: number;
}

export const TransactionContent = ({ givingBudget }: Props) => {
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
      amount: 0,
      message: "",
      tags: [],
    },
  });

  return (
    <section className="grid gap-4 border-t-2 border-border py-4 grid-cols-1 first:border-t-0 lg:gap-x-16 lg:gap-y-4">
      <header className="grid content-start gap-3 pb-3 mb-3 border-b-2 border-border">
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
          <h2 className="text-lg font-normal leading-[1.3]">
            {step === "send" ? "ธุรกรรม" : step === "options" ? "ตรวจสอบข้อมูล" : "การส่งเงินสำเร็จ"}
          </h2>
        </div>
      </header>
      
      <FormProvider {...form}>
        <div className={cn(
          "w-full transition-all duration-200",
          isAnimating && direction === "forward" && "translate-x-8 opacity-0",
          isAnimating && direction === "backward" && "-translate-x-8 opacity-0",
          !isAnimating && "translate-x-0 opacity-100",
        )}>
          <div className="grid gap-8 lg:mb-8">
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

      <Button
        disabled={transaction.isPending} 
        onClick={async () => {
          if (step === "complete") {
            animate("send", "backward");
            return;
          }

          const fieldsToValidate = stepFields[step as keyof typeof stepFields];
          const isValid = await form.trigger(fieldsToValidate);

          if (!isValid) return;

          if (step === "send") {
            animate("options", "forward");
          } else if (step === "options") {
            const values = form.getValues();
            
            transaction.mutate({
              receiverId: values.employee.id,
              amount: values.amount,
              message: values.message,
              tags: values.tags,
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
    </section>
  );
};
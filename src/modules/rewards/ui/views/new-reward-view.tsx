"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { FormHeader } from "@/components/form-header";

import {
  type RewardFormInput,
  type RewardSchema,
  rewardSchema,
  toApiDescription,
} from "@/modules/rewards/schema";

import { RewardForm } from "@/modules/rewards/ui/components/reward-form";
import { RewardPreview } from "@/modules/rewards/ui/components/reward-preview";

export const NewRewardView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.reward.create.mutationOptions());

  const form = useForm<RewardFormInput>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: { th: "", en: "" },
      description: { th: "", en: "" },
      pointCost: 0,
      stock: 1,
      onePerOrder: false,
      isActive: true,
      image: null,
    },
  });

  const onSubmit = (data: RewardSchema) => {
    create.mutate({
      name: data.name,
      description: toApiDescription(data.description),
      pointCost: data.pointCost,
      stock: data.stock,
      onePerOrder: data.onePerOrder,
      isActive: data.isActive,
      image: data.image,
    }, {
      onSuccess: () => {
        form.reset();
      }
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader title="เพิ่มรางวัล" backHref="/meta/rewards" />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <RewardForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto border-l-2 border-[#e5e5e5] bg-[#f7f7f7] p-6 lg:flex">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <h2 className="text-xl font-extrabold text-[#4b4b4b]">
                  Preview
                </h2>
                <p className="text-sm font-medium text-[#777]">
                  ดูตัวอย่างรางวัลแบบเรียลไทม์
                </p>
              </div>
            </div>
            <RewardPreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};

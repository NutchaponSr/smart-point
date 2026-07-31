"use client";

import type { ApiOutputs } from "@convex/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormHeader } from "@/components/form-header";
import { isLocalizedString, pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";
import {
  type RewardFormInput,
  type RewardSchema,
  rewardSchema,
  toApiDescription,
} from "@/modules/rewards/schema";
import { RewardForm } from "@/modules/rewards/ui/components/reward-form";
import { RewardPreview } from "@/modules/rewards/ui/components/reward-preview";

type RewardGetOne = ApiOutputs["reward"]["getOne"];

function toFormInput(r: RewardGetOne): RewardFormInput {
  const name = isLocalizedString(r.name)
    ? r.name
    : { th: String(r.name ?? ""), en: String(r.name ?? "") };
  const description = isLocalizedString(r.description)
    ? r.description
    : r.description
      ? { th: String(r.description), en: String(r.description) }
      : { th: "", en: "" };

  return {
    name,
    description,
    pointCost: r.pointCost,
    stock: r.stock,
    onePerOrder: r.onePerOrder ?? false,
    isActive: r.isActive,
    image: r.image ?? null,
  };
}

interface Props {
  rewardId: string;
}

export const EditRewardView = ({ rewardId }: Props) => {
  const locale = useLocale();
  const crpc = useCRPC();

  const { data: reward } = useSuspenseQuery(
    crpc.reward.getOne.queryOptions({ rewardId }),
  );

  const initial = useMemo(() => toFormInput(reward), [reward]);

  const form = useForm<RewardFormInput>({
    resolver: zodResolver(rewardSchema),
    defaultValues: initial,
  });

  const update = useMutation(crpc.reward.update.mutationOptions());

  const onSubmit = (data: RewardSchema) => {
    update.mutate(
      {
        rewardId,
        name: data.name,
        description: toApiDescription(data.description),
        pointCost: data.pointCost,
        stock: data.stock,
        onePerOrder: data.onePerOrder,
        isActive: data.isActive,
        image: data.image,
      },
      {
        onSuccess: () => {
          form.reset({
            ...data,
            description: data.description ?? { th: "", en: "" },
          });
          toast.success("บันทึกรางวัลแล้ว");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
          );
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader
          title={pickLocalized(reward.name, locale)}
          backHref="/meta/rewards"
        />
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

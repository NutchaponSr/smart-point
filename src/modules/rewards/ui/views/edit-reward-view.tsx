"use client";

import type { ApiOutputs } from "@convex/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useCRPC } from "@/lib/convex/crpc";
import {
  type RewardFormInput,
  type RewardSchema,
  rewardSchema,
} from "@/modules/rewards/schema";
import { RewardForm } from "@/modules/rewards/ui/components/reward-form";
import { RewardPreview } from "@/modules/rewards/ui/components/reward-preview";

type RewardGetOne = ApiOutputs["reward"]["getOne"];

function toFormInput(r: RewardGetOne): RewardFormInput {
  return {
    name: r.name,
    description: r.description ?? null,
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
        description: data.description,
        pointCost: data.pointCost,
        stock: data.stock,
        onePerOrder: data.onePerOrder,
        isActive: data.isActive,
        image: data.image,
      },
      {
        onSuccess: () => {
          form.reset(data);
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <header className="flex h-[82px] flex-col justify-center gap-4 border-b-2 border-border p-4 md:p-8">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 hidden! text-2xl! sm:block!">
              แก้ไขรางวัล
            </h1>
            <div className="grid! flex-1! grid-cols-2! gap-2! has-[>*:only-child]:grid-cols-1! sm:flex! sm:flex-none! md:-my-2!">
              <Link href="/dashboard/reward">
                <Button variant="elevated" type="button">
                  ยกเลิก
                </Button>
              </Link>
              <Button
                variant="elevated"
                className="bg-pink"
                type="submit"
                disabled={update.isPending}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <RewardForm />
          </div>
          <aside className="sticky! top-0! hidden! h-screen! min-w-0! flex-col! gap-4! self-start! overflow-y-auto! bg-black! p-6! lg:flex! lg:border-l-2! lg:border-border!">
            <h2 className="text-xl leading-snug text-white">ภาพรวม</h2>
            <RewardPreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};

"use client";

import Link from "next/link";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import {
  type RewardFormInput,
  type RewardSchema,
  rewardSchema,
} from "@/modules/rewards/schema";

import { RewardForm } from "@/modules/rewards/ui/components/reward-form";
import { RewardPreview } from "@/modules/rewards/ui/components/reward-preview";

export const NewRewardView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.reward.create.mutationOptions());

  const form = useForm<RewardFormInput>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: "",
      description: "",
      pointCost: 0,
      stock: 0,
      onePerOrder: false,
      isActive: true,
      image: null,
    },
  });

  const onSubmit = (data: RewardSchema) => {
    create.mutate({
      name: data.name,
      description: data.description,
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
        <header className="flex flex-col gap-4 border-b-2 border-border justify-center p-4 md:p-8 h-[82px]">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 text-2xl hidden! sm:block!">
              เพิ่มรางวัล
            </h1>
            <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
              <Link href={`/dashboard/reward`}>
                <Button variant="elevated" type="button">
                  ยกเลิก
                </Button>
              </Link>
              <Button variant="elevated" className="bg-pink" type="submit">
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <RewardForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto bg-black p-6 lg:flex lg:border-l-2 lg:border-border">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl leading-snug text-white">ภาพรวม</h2>
            </div>
            <RewardPreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};

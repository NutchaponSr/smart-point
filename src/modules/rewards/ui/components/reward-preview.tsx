"use client";

 
import Coin from "../../../../../public/coin.svg";
import placeholder from "../../../../../public/placeholder.png";

import { useQuery } from "@tanstack/react-query";
import { useFormContext, useWatch } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";
import type { RewardFormInput } from "@/modules/rewards/schema";

import { StarRating } from "@/components/star-rating";

function stockLabel(stock: unknown) {
  if (stock === -1) return "คงเหลือ: ไม่จำกัด";
  const n = typeof stock === "number" ? stock : Number(stock);
  if (stock === undefined || stock === null || Number.isNaN(n))
    return "คงเหลือ: —";
  return `คงเหลือ: ${n}`;
}

export const RewardPreview = () => {
  const { control } = useFormContext<RewardFormInput>();
  const name = useWatch({ control, name: "name" });
  const image = useWatch({ control, name: "image" });
  const pointCost = useWatch({ control, name: "pointCost" });
  const description = useWatch({ control, name: "description" });

  const crpc = useCRPC();
  const storageId =
    image != null && String(image).trim() !== "" ? String(image) : "";

  const { data: fileUrl } = useQuery({
    ...crpc.upload.getFileUrl.queryOptions({ storageId }),
    enabled: Boolean(storageId),
  });

  const title = typeof name === "string" && name.trim();
  const src = fileUrl ?? placeholder.src;
  const cost =
    pointCost === undefined ||
    pointCost === null ||
    Number.isNaN(Number(pointCost))
      ? "—"
      : String(pointCost);
  const des = typeof description === "string" && description.trim();

  return (
    <article className="relative grid rounded-md border-2 bg-background lg:grid-cols-[2fr_1fr]">
      <figure className="relative col-span-full aspect-4/3 overflow-hidden border-b-2 border-border bg-(image:--product-cover-placeholder) bg-cover rounded-t-md">
        <div style={{ aspectRatio: "1.7/1" }} className="flex h-full snap-x snap-mandatory items-center overflow-x-scroll overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"> 
          <div className="mt-0! flex min-h-px flex-[1_0_100%] snap-start justify-center border-0! p-0!">
            <img src={src} alt="Image" className="w-full" />
          </div>
        </div>
      </figure>
      <section className="lg:border-r-2">
        <header className="grid gap-4 p-3 not-first:border-t">
          <h1 className="text-lg font-normal leading-[1.2]">
            {title}
          </h1>
        </header>
        <section className="grid grid-cols-[auto_1fr] gap-px border-t-2 border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
          <div className="p-3 outline-2outline-offset-0 outline-border border-r-2">
            <div className="flex items-center gap-1 text-base font-medium text-[#1cb0f6]">
              <img src={Coin.src} alt="Coin" className="size-6" />
              {cost}
            </div>
          </div>
          <div className="flex items-center px-4 py-3 max-sm:col-span-full">
            <StarRating rating={5} text={String(1)} />
          </div>
        </section>
        <section className="border-t-2 border-border p-3">
          <p className="text-xs">
            {des}
          </p>
        </section>
      </section>
      <section>
        <section className="grid gap-4 p-3 not-first:border-t">
          <div className="flex items-center justify-center gap-2 p-2 border-2 rounded-md text-[10px] text-center w-full bg-[#58cc02] text-primary-foreground border-[#0003] border-b-4">
            Add to checkout
          </div>  
        </section>
      </section>
    </article>
  );
};

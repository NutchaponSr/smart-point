"use client";

import { GoPersonFill } from "react-icons/go";
import { useFormContext, useWatch } from "react-hook-form";

import type { EventSchema } from "@/modules/events/schema";
import { categories } from "../../constants";

export const EventPreview = () => {
  const { control } = useFormContext<EventSchema>();

  const name = useWatch({ control, name: "name" });
  const point = useWatch({ control, name: "point" });
  const description = useWatch({ control, name: "description" });
  const maxParticipants = useWatch({ control, name: "maxParticipants" });
  const category = useWatch({ control, name: "category" });

  const title = typeof name === "string" && name.trim();
  const cost = point === undefined || point === null || Number.isNaN(Number(point)) ? "—" : String(point);
  const des = typeof description === "string" && description.trim();
  const categoryName = categories[category]?.th;
  
  return (
    <article className="relative grid rounded-xs border-[1.5px] border-border bg-background lg:grid-cols-[2fr_1fr]">
      <section className="lg:border-r-[1.5px]">
        <header className="grid gap-4 p-3 not-first:border-t">
          <h1 className="text-lg font-normal leading-[1.2]">
            {title}
          </h1>
        </header>
        <section className="grid grid-cols-[auto_1fr] gap-px border-t-[1.5px] border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,full)]">
          <div className="p-3 outline-[1.5px] outline-offset-0 outline-border">
            <div className="relative grid w-fit border-[1.5px] border-border">
              <div
                className="bg-pink px-2 py-1 text-sm"
                itemProp="point"
                content={String(cost)}
              >
                {cost}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between w-full grow px-4 py-3 max-sm:col-span-full">
            <div className="flex items-center gap-1 grow">
              <GoPersonFill className="size-4 stroke-[0.25]" />
              <span className="text-sm font-normal">{maxParticipants}</span>
            </div>
            <u className="text-xs">{categoryName}</u>
          </div>
        </section>
        <section className="border-t-[1.5px] border-border p-3">
          <p className="text-xs">
            {des}
          </p>
        </section>
      </section>
      <section>
        <section className="grid gap-4 p-3 not-first:border-t">
          <div className="flex items-center justify-center gap-2 p-2 bg-pink border-[1.5px] border-border rounded-xs text-[10px] text-center w-full">
            Join
          </div>  
        </section>
      </section>
    </article>
  );
};

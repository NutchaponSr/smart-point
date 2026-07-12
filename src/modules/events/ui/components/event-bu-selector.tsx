"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldSet } from "@/components/fieldset";

import { divisions } from "@/modules/employee/constants";
import { buRestrictedCategories } from "@/modules/events/constants";
import type { EventSchema } from "@/modules/events/schema";

function toggleSlug(list: string[], slug: string, checked: boolean) {
  if (checked) {
    return list.includes(slug) ? list : [...list, slug];
  }
  return list.filter((item) => item !== slug);
}

export const EventBuSelector = () => {
  const { control } = useFormContext<EventSchema>();
  const category = useWatch({ control, name: "category" });

  const showSelector = buRestrictedCategories.includes(
    category as (typeof buRestrictedCategories)[number],
  );

  if (!showSelector) return null;

  return (
    <section className="grid gap-4 border-t-2 border-border p-4! md:p-8!">
      <div className="grid gap-1">
        <h2 className="text-xl leading-snug">BU / สังกัดที่เข้าร่วมได้</h2>
        <p className="text-sm text-muted-foreground">
          เลือก BU ที่อนุญาตให้เข้าร่วมกิจกรรม — ไม่เลือก = เปิดให้ทุก BU เข้าร่วมได้
        </p>
      </div>

      <Controller
        control={control}
        name="allowedDivisions"
        render={({ field, fieldState }) => (
          <FieldSet label="BU / สังกัด" errorMessage={fieldState.error?.message}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {divisions.map((division) => {
                const checked = (field.value ?? []).includes(division.slug);
                return (
                  <label
                    key={division.slug}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border-2 px-3 py-2.5 transition-colors",
                      checked
                        ? "border-pink/40 bg-pink/5"
                        : "border-border bg-background",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        field.onChange(
                          toggleSlug(field.value ?? [], division.slug, !!value),
                        )
                      }
                    />
                    <span className="text-sm font-semibold">
                      {division.name.th}
                    </span>
                  </label>
                );
              })}
            </div>
          </FieldSet>
        )}
      />
    </section>
  );
};

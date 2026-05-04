"use client";

import { useFormContext, useWatch } from "react-hook-form";

import type { EmployeeSchema } from "@/modules/employee/schema";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { departments, divisions, positions, ranks } from "../../constants";

export const EmployeePreview = () => {
  const { control } = useFormContext<EmployeeSchema>();
  const name = useWatch({ control, name: "name" });
  const email = useWatch({ control, name: "email" });
  const department = useWatch({ control, name: "department" });
  const position = useWatch({ control, name: "position" });
  const rank = useWatch({ control, name: "rank" });
  const division = useWatch({ control, name: "division" });

  return (
    <article className="relative grid rounded-xs border-[1.5px] border-border bg-background">
      <section>
        <header className="grid gap-4 p-3 not-first:border-t">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <UserAvatar 
              name={name}
              className={{
                container: "size-8 after:border-[1.5px]",
                fallback: "text-sm font-medium",
              }}
            />
            <h1 className="text-lg font-normal leading-[1.2] truncate">
              {name}
            </h1>
          </div>
        </header>
        <section className="grid grid-cols-[auto_1fr] gap-px border-t-[1.5px] border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
          <div className="p-3 outline-[1.5px] outline-offset-0 outline-border">
            <div className="relative grid w-fit border-[1.5px] border-border">
              <div
                className="bg-pink px-2 py-1 text-sm"
                itemProp="point"
                content={String(department)}
              >
                {departments.find((d) => d.slug === department)?.name.th}
              </div>
            </div>
          </div>
          <div className="flex items-center px-4 py-3 max-sm:col-span-full">
            {email}
          </div>
        </section>
        <section className="border-t-[1.5px] border-border p-3">
          <p className="text-xs">
            {positions.find((p) => p.slug === position)?.name.th}
          </p>
        </section>
        <section className="border-t-[1.5px] border-border p-3">
          <p className="text-xs">
            {ranks.find((r) => r.slug === rank)?.name.th}
          </p>
        </section>
        <section className="border-t-[1.5px] border-border p-3">
          <p className="text-xs">
            {divisions.find((d) => d.slug === division)?.name.th}
          </p>
        </section>
      </section>
    </article>
  );
};

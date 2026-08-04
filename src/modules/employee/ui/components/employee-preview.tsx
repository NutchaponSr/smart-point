"use client";

import Image from "next/image";
import { useFormContext, useWatch } from "react-hook-form";

import type { EmployeeSchema } from "@/modules/employee/schema";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { divisions } from "../../constants";

import BrickCorner from "../../../../../public/brick_high_slope_inverted_left_yellow_2.svg";

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 border-t-2 border-[#e5e5e5] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#afafaf]">
        {label}
      </p>
      <p className="text-sm font-bold text-[#4b4b4b]">
        {value || "—"}
      </p>
    </div>
  );
}

function localizedTh(
  value: { th: string; en: string } | string | undefined,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value.th || value.en || "";
}

export const EmployeePreview = () => {
  const { control } = useFormContext<EmployeeSchema>();
  const name = useWatch({ control, name: "name" });
  const displayName =
    (typeof name === "string" ? name : name?.th || name?.en) || "";
  const email = useWatch({ control, name: "email" });
  const department = useWatch({ control, name: "department" });
  const position = useWatch({ control, name: "position" });
  const rank = useWatch({ control, name: "rank" });
  const division = useWatch({ control, name: "division" });

  const departmentLabel = localizedTh(department);
  const positionLabel = localizedTh(position);
  const rankLabel = typeof rank === "string" ? rank : "";
  const divisionLabel = divisions.find((d) => d.slug === division)?.name.th;

  return (
    <article className="relative overflow-hidden rounded-md border-2 border-[#e5e5e5] bg-white">
      <header className="relative border-b-2 border-[#e5e5e5] bg-[#fff4d9] px-4 py-3">
        <Image
          src={BrickCorner}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-px -bottom-px size-10"
        />
        <p className="relative z-1 text-base font-semibold text-[#ff9600]">
          บัตรพนักงาน
        </p>
      </header>

      <section className="grid gap-3 p-4">
        <div className="flex items-center gap-3 overflow-hidden min-h-14">
          <UserAvatar
            name={displayName || "?"}
            className={{
              container:
                "size-12 ring-[#58a700]! shadow-[0_3px_0_#58a700]!",
              fallback: "bg-[#58cc02]! text-xl font-bold text-white",
            }}
          />
          <div className="min-w-0 grid gap-0.5">
            <h1 className="truncate text-lg font-extrabold leading-tight text-[#4b4b4b]">
              {displayName || "ชื่อพนักงาน"}
            </h1>
            <p className="truncate text-sm font-medium text-[#777]">
              {email || "email@example.com"}
            </p>
          </div>
        </div>

        {departmentLabel ? (
          <span className="inline-flex w-fit items-center rounded-xl border-2 border-[#0003] bg-[#58cc02] px-3 py-1 text-sm font-bold text-white">
            {departmentLabel}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center rounded-xl border-2 border-dashed border-[#e5e5e5] px-3 py-1 text-sm font-bold text-[#afafaf]">
            แผนก
          </span>
        )}
      </section>

      <DetailRow label="ตำแหน่ง" value={positionLabel} />
      <DetailRow label="ระดับ" value={rankLabel} />
      <DetailRow label="BU / สังกัด" value={divisionLabel} />
    </article>
  );
};

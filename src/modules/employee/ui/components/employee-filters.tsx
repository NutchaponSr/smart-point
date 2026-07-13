"use client";

import { CheckIcon, ListFilterIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Accordion } from "@/components/accordion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  departments,
  divisions,
  ranks,
} from "@/modules/employee/constants";
import { useEmployeeFilters } from "@/modules/employee/stores/use-employee-filters";

const checkboxClassName =
  "appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-[#58cc02] rounded-xs peer";

const labelClassName =
  "inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center";

type FilterKey = "division" | "department" | "rank";

type Props =
  | { variant?: "default" }
  | {
      variant: "popover";
      align?: ComponentProps<typeof PopoverContent>["align"];
      sideOffset?: ComponentProps<typeof PopoverContent>["sideOffset"];
      popoverContentClassName?: string;
    };

type FilterOptionCheckboxProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const FilterOptionCheckbox = ({
  label,
  checked,
  onCheckedChange,
}: FilterOptionCheckboxProps) => (
  <label className={labelClassName}>
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className={checkboxClassName}
      />
      <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-white peer-checked:block" />
    </span>
    {label}
  </label>
);

export const EmployeeFilters = (props: Props) => {
  const [filters, setFilters] = useEmployeeFilters();

  const toggleFilterValue = (
    key: FilterKey,
    value: string,
    checked: boolean,
  ) => {
    const current = filters[key] ?? [];
    const next = checked
      ? [...current, value]
      : current.filter((item) => item !== value);

    void setFilters({
      ...filters,
      [key]: next,
      page: 1,
    });
  };

  const onClear = () => {
    void setFilters({
      ...filters,
      division: [],
      department: [],
      rank: [],
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.division.length > 0 ||
    filters.department.length > 0 ||
    filters.rank.length > 0;

  const body = (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="relative z-1 text-base font-bold leading-snug">
          ตัวกรอง
        </h2>
        {hasActiveFilters && (
          <div className="grow text-right">
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={onClear}
            >
              รีเซ็ต
            </button>
          </div>
        )}
      </header>

      <Accordion title="BU / สังกัด">
        {divisions.map((division) => (
          <FilterOptionCheckbox
            key={division.slug}
            label={division.name.th}
            checked={filters.division.includes(division.slug)}
            onCheckedChange={(checked) =>
              toggleFilterValue("division", division.slug, checked)
            }
          />
        ))}
      </Accordion>

      <Accordion title="แผนก">
        {departments.map((department) => (
          <FilterOptionCheckbox
            key={department.slug}
            label={department.name.th}
            checked={filters.department.includes(department.slug)}
            onCheckedChange={(checked) =>
              toggleFilterValue("department", department.slug, checked)
            }
          />
        ))}
      </Accordion>

      <Accordion title="ระดับ">
        {ranks.map((rank) => (
          <FilterOptionCheckbox
            key={rank.slug}
            label={rank.name.th}
            checked={filters.rank.includes(rank.slug)}
            onCheckedChange={(checked) =>
              toggleFilterValue("rank", rank.slug, checked)
            }
          />
        ))}
      </Accordion>
    </>
  );

  if (props.variant === "popover") {
    const { align, sideOffset, popoverContentClassName } = props;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="iconLg" aria-label="ตัวกรองพนักงาน" className={cn(hasActiveFilters && "text-[#1cb0f6]")}>
            <ListFilterIcon className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "max-h-[min(70vh,32rem)] divide-y-2 divide-solid divide-border overflow-y-auto p-0",
            popoverContentClassName,
          )}
        >
          {body}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <section
      aria-label="ตัวกรอง"
      className="grid max-h-[calc(100vh-2rem)] divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background lg:sticky lg:inset-y-4"
    >
      {body}
    </section>
  );
};

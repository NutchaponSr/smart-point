import { CheckIcon, FilterIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";

import { categories, statuses } from "@/modules/events/constants";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";
import { SearchInput } from "@/components/search-input";

type EventView = keyof typeof categories;
const filterContainerClassName =
  "grid divide-y-2 divide-solid divide-border rounded-md border-2 bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)] select-none";

const checkboxClassName =
  "appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-pink rounded-xs peer";

const labelClassName =
  "inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center";

type FilterState = ReturnType<typeof useEventFilters>[0];
type SetFilters = ReturnType<typeof useEventFilters>[1];
type EventStatus = NonNullable<FilterState["status"]>[number];

const updateFilter = (
  filters: FilterState,
  setFilters: SetFilters,
  key: keyof FilterState,
  value: unknown
) => {
  void setFilters({ ...filters, [key]: value });
};

const toggleMultiSelectFilter = <T extends string>(
  filters: FilterState,
  setFilters: SetFilters,
  key: "view" | "status",
  value: T,
  checked: boolean
) => {
  const currentValues = (filters[key] as T[] | null | undefined) ?? [];
  const nextValues = checked
    ? [...currentValues, value]
    : currentValues.filter((item) => item !== value);

  void setFilters({
    ...filters,
    [key]: nextValues.length > 0 ? nextValues : null,
    page: 0,
  });
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
      <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block group-open" />
    </span>
    {label}
  </label>
);

export const EventFiltersPopover = () => {
  const [filters, setFilters] = useEventFilters();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="iconLg">
          <FilterIcon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={filterContainerClassName}>
        <Accordion title="จำนวนผู้เข้าร่วม">
          <CostFilter
            decimalScale={0}
            minCost={filters.minParticipants}
            maxCost={filters.maxParticipants}
            onMinCostChange={(minParticipants) =>
              updateFilter(filters, setFilters, "minParticipants", minParticipants)
            }
            onMaxCostChange={(maxParticipants) =>
              updateFilter(filters, setFilters, "maxParticipants", maxParticipants)
            }
          />
        </Accordion>
        <Accordion title="ประเภท">
          {Object.entries(categories).map(([key, value]) => (
            <FilterOptionCheckbox
              key={key}
              label={value.th}
              checked={filters.view?.includes(key as EventView) ?? false}
              onCheckedChange={(checked) =>
                toggleMultiSelectFilter(
                  filters,
                  setFilters,
                  "view",
                  key as EventView,
                  checked
                )
              }
            />
          ))}
        </Accordion>
      </PopoverContent>
    </Popover>
  );
};

export const EventFilters = () => {
  const [filters, setFilters] = useEventFilters();

  const hasActiveFilters =
    (filters.view?.length ?? 0) > 0 ||
    (filters.status?.length ?? 0) > 0 ||
    filters.q.length > 0;

  const onClear = () => {
    setFilters({
      ...filters,
      view: null,
      status: null,
      q: "",
      page: 0,
    });
  };

  return (
    <div className={filterContainerClassName}>
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput
          value={filters.q}
          placeholder="ค้นหากิจกรรม"
          onChange={(q) => updateFilter(filters, setFilters, "q", q)}
        />
      </div>
      <Accordion title="ประเภท">
        {Object.entries(categories).map(([key, value]) => (
          <FilterOptionCheckbox
            key={key}
            label={value.th}
            checked={filters.view?.includes(key as EventView) ?? false}
            onCheckedChange={(checked) =>
              toggleMultiSelectFilter(
                filters,
                setFilters,
                "view",
                key as EventView,
                checked
              )
            }
          />
        ))}
      </Accordion>
      <Accordion title="สถานะ">
        {Object.entries(statuses).map(([key, value]) => (
          <FilterOptionCheckbox
            key={key}
            label={value.th}
            checked={filters.status?.includes(key as EventStatus) ?? false}
            onCheckedChange={(checked) =>
              toggleMultiSelectFilter(
                filters,
                setFilters,
                "status",
                key as EventStatus,
                checked
              )
            }
          />
        ))}
      </Accordion>
    </div>
  );
};
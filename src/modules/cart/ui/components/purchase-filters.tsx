import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/accordion";
import { SearchInput } from "@/components/search-input";

import { usePurchaseFilters } from "../../stores/use-purchase-filters";

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;

const SORT_OPTIONS = [
  { value: "purchase-date", labelKey: "filters.purchase-date" },
  { value: "recently-updated", labelKey: "filters.recently-updated" },
] as const;

interface Props {
  total: number;
}

export const PurchaseFilters = ({ total }: Props) => {
  const t = useTranslations("purchases");

  const [filters, setFilters] = usePurchaseFilters();

  return (
    <section
      aria-label={t("filters.limit")}
      className="grid divide-y-2 divide-solid divide-border overflow-y-auto rounded-md border-2 bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-base font-bold leading-snug">
          {t("filters.show")} {total} {t("filters.from")} {total}
        </h2>
      </header>

      <div className="p-4">
        <SearchInput
          value={filters.q}
          placeholder={t("filters.search")}
          onChange={(q) => setFilters({ ...filters, q })}
        />
      </div>

      <Accordion title={t("filters.sort-by")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {filters.sort === "recently-updated"
                ? t("filters.recently-updated")
                : t("filters.purchase-date")}
              <ChevronDownIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={filters.sort}
                onValueChange={(sort) => {
                  if (
                    sort !== "recently-updated" &&
                    sort !== "purchase-date"
                  ) {
                    return;
                  }
                  setFilters({ ...filters, sort });
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion>

      <Accordion title={t("filters.limit")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="w-full justify-between">
              {filters.limit}
              <ChevronDownIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={filters.limit.toString()}
                onValueChange={(limit) => {
                  setFilters({ ...filters, limit: parseInt(limit) });
                }}
              >
                {LIMIT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Accordion>
    </section>
  );
};

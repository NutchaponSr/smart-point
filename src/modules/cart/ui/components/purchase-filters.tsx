import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { SearchInput } from "@/components/search-input";

import { usePurchaseFilters } from "../../stores/use-purchase-filters";

const LIMIT_OPTIONS = ["10", "25", "50", "100"] as const;

interface Props {
  total: number;
}

export const PurchaseFilters = ({ total }: Props) => {
  const t = useTranslations("purchases");

  const [filters, setFilters] = usePurchaseFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="grow">
          {t("filters.show")} {total} {t("filters.from")} {total}
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput 
          value={filters.q}
          placeholder={t("filters.search")}
          onChange={(q) => onChange("q", q)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 filter-header">
              {t("filters.sort-by")}
            </label>
          </legend>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="justify-between">
                {filters.sort === "recently-updated" ? t("filters.recently-updated") : t("filters.purchase-date")}
                <ChevronDownIcon className="size-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={filters.sort}
                  onValueChange={(sort) => {
                    if (sort !== "recently-updated" && sort !== "purchase-date") {
                      return;
                    }
                    setFilters({ ...filters, sort });
                  }}
                >
                  <DropdownMenuRadioItem value="recently-updated">{t("filters.recently-updated")}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="purchase-date">{t("filters.purchase-date")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 filter-header">
              {t("filters.limit")}
            </label>
          </legend>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="justify-between">
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
        </fieldset>
      </div>
    </>
  );
};
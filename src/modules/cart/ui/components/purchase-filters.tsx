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

export const PurchaseFilters = () => {
  const [filters, setFilters] = usePurchaseFilters();

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="grow">
          Showing 1-10 of 10 products
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <SearchInput 
          value={filters.q}
          placeholder="Search rewards"
          onChange={(q) => onChange("q", q)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <fieldset className="flex flex-col border-none gap-2 grow basis-0">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 filter-header">
              Sort by
            </label>
          </legend>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="justify-between">
                {filters.sort === "recently-updated" ? "Recently Updated" : "Purchase Date"}
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
                  <DropdownMenuRadioItem value="recently-updated">Recently Updated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="purchase-date">Purchase Date</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </fieldset>
      </div>
    </>
  );
};
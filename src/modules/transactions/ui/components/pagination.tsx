import { TbNumber } from "react-icons/tb";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  limit: number;
  setLimit: (value: number | null) => Promise<URLSearchParams>;
  setPage: (value: number | null) => Promise<URLSearchParams>;
};

const pageSizeOptions = [10, 50, 100];

export const Pagination = ({ limit, setLimit, setPage }: PaginationProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="elevated" size="iconLg">
          <TbNumber className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12}>
        {pageSizeOptions.map((size) => (
          <DropdownMenuItem
            key={size}
            onSelect={() => {
              void setLimit(size);
              void setPage(0);
            }}
            className={cn(size === limit && "text-foreground font-medium bg-accent")}
          >
            {size}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
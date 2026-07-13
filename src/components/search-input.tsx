"use client";

import type { ComponentProps } from "react";
import { GoSearch } from "react-icons/go";
import { BsFillXCircleFill } from "react-icons/bs";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

const SearchField = ({ value, placeholder, onChange }: SearchFieldProps) => (
  <div className="relative flex-1">
    <div className="inline-flex items-center w-full gap-2 relative py-0 px-4 h-12 min-h-12 border-2 border-border rounded-md bg-background text-foreground focus-within:border-[#49c0f8] focus-within:outline-0 focus-within:outline-[#49c0f8] focus-within:outline-offset-0 [&>.icon]:text-primary">
      <GoSearch className="size-5 shrink-0 stroke-[0.3]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-[inherit] py-3 px-4 text-base leading-snug text-foreground border border-border rounded block w-full placeholder:text-muted-foreground focus:outline-2 focus:outline-[#49c0f8] focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-30 border-none flex-1 bg-transparent shadow-none outline-none -mx-4 max-w-none cursor-text!"
      />
      <div
        role="button"
        data-show={!!value}
        className="items-center justify-center gap-0 size-7 rounded-full text-sm font-medium whitespace-nowrap leading-[1.2] text-primary shrink-0 grow-0 -me-1 hover:bg-muted data-[show=true]:inline-flex hidden"
        onClick={(e) => {
          e.stopPropagation();
          onChange("");
        }}
      >
        <BsFillXCircleFill className="size-5 block text-icon-primary shrink-0" />
      </div>
    </div>
  </div>
);

type SearchInputBase = SearchFieldProps;

type SearchInputProps =
  | (SearchInputBase & { variant?: "default" })
  | (SearchInputBase & {
      variant: "popover";
      popoverContentClassName?: string;
      align?: ComponentProps<typeof PopoverContent>["align"];
      sideOffset?: ComponentProps<typeof PopoverContent>["sideOffset"];
    });

export const SearchInput = (props: SearchInputProps) => {
  if (props.variant === "popover") {
    const {
      variant: _v,
      popoverContentClassName,
      align,
      sideOffset,
      ...fieldProps
    } = props;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="iconLg">
            <GoSearch className="size-5 stroke-[0.25]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={sideOffset}
          className={cn("p-4", popoverContentClassName)}
        >
          <SearchField {...fieldProps} />
        </PopoverContent>
      </Popover>
    );
  }

  const { variant: _omitVariant, ...fieldProps } = props;
  return (
    <div className="min-w-0 w-full">
      <SearchField {...fieldProps} />
    </div>
  );
};

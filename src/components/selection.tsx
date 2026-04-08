import { ChevronDownIcon } from "lucide-react";
import { CommandGroup, Command as CommandPrimitive } from "cmdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { 
  Command, 
  CommandEmpty, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";
import { useDebounce } from "@uidotdev/usehooks";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { BsFillXCircleFill } from "react-icons/bs";

interface Option {
  image?: string;
  label: string;
  value: string;
}

interface GroupOption {
  [key: string]: Array<Option>;
}

interface Props {
  options: Array<Option>;
  disabled?: boolean;
  triggerSearchOnFocus?: boolean;
  emptyIndicator?: React.ReactNode;
  placeholder?: string;
  loadingIndicator?: React.ReactNode;
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>;
  inputProps?: Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, "value" | "placeholder" | "disabled">;
  onSearch?: (value: string) => Promise<Array<Option>>;
  onSelect?: (option: Option) => void;
  /** Sync selection from form state (e.g. after step remount). */
  selectedValue?: string;
  selectedLabel?: string;
  onClear?: () => void;
}

function removePickedOption(groupOption: GroupOption | Option[], picked: Option | null) {
  const normalizedGroupOption: GroupOption = Array.isArray(groupOption)
    ? { options: groupOption }
    : groupOption;
  const cloneOption = JSON.parse(JSON.stringify(normalizedGroupOption)) as GroupOption

  for (const [key, value] of Object.entries(cloneOption)) {
    cloneOption[key] = picked
      ? value.filter((val) => val.value !== picked.value)
      : value;
  }

  return cloneOption
}

export const Selection = ({ 
  options, 
  disabled, 
  loadingIndicator,
  emptyIndicator,
  triggerSearchOnFocus,
  commandProps, 
  inputProps,
  placeholder,
  onSearch,
  onSelect,
  selectedValue,
  selectedLabel,
  onClear,
}: Props) => {

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onScrollbar, setOnScrollbar] = useState(false);
  const [selected, setSelected] = useState<Option | null>(() =>
    selectedValue
      ? { value: selectedValue, label: selectedLabel ?? selectedValue }
      : null
  );
  
  const debouncedSearch = useDebounce(inputValue, 300);

  useEffect(() => {
    if (!onSearch) return;

    const runSearch = async () => {
      setIsLoading(true);
      try {
        await onSearch(debouncedSearch);
      } finally {
        setIsLoading(false);
      }
    };

    void runSearch();
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    if (selectedValue) {
      setSelected({
        value: selectedValue,
        label: selectedLabel ?? selectedValue,
      });
      return;
    }
    setSelected(null);
    setInputValue("");
  }, [selectedValue, selectedLabel]);

  const handleUnSelect = useCallback(() => {
    setSelected(null);
    setInputValue("");
    setOpen(false);
    onClear?.();
  }, [onClear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;

    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected) {
          handleUnSelect();
        }
      }

      if (e.key === "Escape") {
        input.blur();
      }
    }
  }, [handleUnSelect, selected]);

  const selectables = useMemo<GroupOption>(() => removePickedOption(options, selected), [options, selected])

  const commandFilter = useCallback(() => {
    if (commandProps?.filter) return commandProps.filter;

    return undefined;
  }, [commandProps?.filter]);

  return (
    <Command
      {...commandProps}
      ref={dropdownRef}
      onKeyDown={(e) => {
        handleKeyDown(e);
        commandProps?.onKeyDown?.(e);
      }}
      className={cn("h-auto overflow-visible bg-transparent p-0", commandProps?.className)}
      shouldFilter={commandProps?.shouldFilter !== undefined ? commandProps.shouldFilter : !onSearch}
      filter={commandFilter()}
    >
      <div
        className={cn(
          "border-2 border-border min-h-10 w-full rounded-xs bg-background flex items-center px-4 gap-2 focus-within::outline-1 focus-within:outline-purple focus-within:border-purple focus-within:border-2",
        )}
        onClick={() => {
          if (disabled) return;
          inputRef?.current?.focus();
        }}
      >
        {selected ? (
          <div className="flex items-center gap-2 grow shrink">
            <UserAvatar 
              name={selected.label}
              src={selected.image || null}
              className={{
                container: "size-6 after:border-[1.5px]",
                fallback: "text-xs font-normal",
              }}
            />
            <span className="truncate text-sm">{selected.label}</span>
          </div>
        ) : (
          <CommandPrimitive.Input 
            {...inputProps}
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            onValueChange={(value) => {
              setInputValue(value);
              inputProps?.onValueChange?.(value);
            }}
            onBlur={(e) => {
              if (!onScrollbar) {
                setOpen(false);
              }

              inputProps?.onBlur?.(e);
            }}
            onFocus={(e) => {
              setOpen(true);

              if (triggerSearchOnFocus) {
                onSearch?.(debouncedSearch);
              }

              inputProps?.onFocus?.(e);
            }}
            placeholder={placeholder}
            className="placeholder:text-muted-foreground focus:outline-none focus:border-none focus:ring-0 shrink grow"
          />
        )}
        {selected ? (
          <div 
            role="button" 
            className="inline-flex items-center justify-center gap-0 size-6 rounded-full text-sm font-medium whitespace-nowrap leading-[1.2] text-tertiary shrink-0 grow-0 -me-1 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              handleUnSelect();
            }}
          >
          <BsFillXCircleFill className="size-4 block text-icon-tertiary shrink-0" />
        </div>
        ) : (
          <ChevronDownIcon className="size-4.5 shrink-0" />
        )}
      </div>
      <div className="relative">
        <div 
          data-state={open ? "open" : "closed"}
          className={cn(
            "border-2 border-border absolute top-2 z-9999 w-full overflow-hidden rounded-xs duration-100 bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            !open && "hidden",
          )}
        >
          <CommandList
            className="bg-popover outline-hidden py-2"
            onMouseLeave={() => {
              setOnScrollbar(false);
            }}
            onMouseEnter={() => {
              setOnScrollbar(true);
            }}
            onMouseUp={() => {
              inputRef.current?.focus();
            }}
          >
            {isLoading ? (
              <>{loadingIndicator}</>
            ) : (
              <>
                <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>
                {Object.entries(selectables).map(([key, value]) => (
                  <CommandGroup key={key}>
                    {value.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          setSelected(option);
                          setInputValue(option.label);
                          setOpen(false);
                          onSelect?.(option);
                        }}
                      >
                        <UserAvatar 
                          name={option.label}
                          src={option.image || null}
                          className={{
                            container: "size-6 after:border-[1.5px]",
                            fallback: "text-xs font-normal",
                          }}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </div>
      </div>
    </Command>
  );
}
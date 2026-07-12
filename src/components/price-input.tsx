import { useEffect, useState } from "react";
import { CurrencyInput } from "react-currency-input-field";

import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  id: string;
  name: string;
  placeholder: string;
  decimalScale: number;
  value: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
}

export const PriceInput = (props: Props) => {
  const [inputValue, setInputValue] = useState<string>(props.value?.toString() ?? "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(props.value?.toString() ?? "");
    }
  }, [props.value, isFocused]);

  useEffect(() => {
    if (!isFocused) return;

    const timeoutId = setTimeout(() => {
      if (!inputValue) {
        props.onValueChange(null);
        return;
      }

      if (inputValue.endsWith(".")) return;

      const parsed = parseFloat(inputValue);
      if (!Number.isNaN(parsed)) {
        props.onValueChange(parsed);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, isFocused, props]);

  return (
    <fieldset className="flex flex-col border-none gap-2">
      <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
        <label className="inline-flex cursor-pointer text-sm gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">
          {props.label}
        </label>
      </legend>
      <CurrencyInput
        {...props}
        allowNegativeValue={false}
        value={inputValue}
        onFocus={() => setIsFocused(true)}
        onValueChange={(value) => {
          const nextValue = value ?? "";
          setInputValue(nextValue);
        }}
        onBlur={() => {
          setIsFocused(false);
          const parsed = parseFloat(inputValue);
          if (Number.isNaN(parsed)) {
            props.onValueChange(null);
            setInputValue("");
            return;
          }
          props.onValueChange(parsed);
        }}
        className={cn("font-[inherit] min-h-12 px-4 text-sm leading-snug border-2 border-border rounded-md block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-[#1cb0f6] focus:border-[#1cb0f6] focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3", props.className)}
      />
    </fieldset>
  );
}
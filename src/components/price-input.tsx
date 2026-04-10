import { useEffect, useState } from "react";
import { CurrencyInput } from "react-currency-input-field";


interface Props {
  label: string;
  id: string;
  name: string;
  placeholder: string;
  decimalScale: number;
  value: number | null;
  onValueChange: (value: number) => void;
  className?: string;
}

export const PriceInput = (props: Props) => {
  const [inputValue, setInputValue] = useState<string>(props.value?.toString() ?? "");

  useEffect(() => {
    setInputValue(props.value?.toString() ?? "");
  }, [props.value]);

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
        onValueChange={(value) => {
          const nextValue = value ?? "";
          setInputValue(nextValue);

          if (!nextValue) {
            props.onValueChange(0);
            return;
          }

          if (nextValue.endsWith(".")) return;

          const parsed = parseFloat(nextValue);
          if (!Number.isNaN(parsed)) {
            props.onValueChange(parsed);
          }
        }}
        onBlur={() => {
          const parsed = parseFloat(inputValue);
          if (Number.isNaN(parsed)) {
            props.onValueChange(0);
            setInputValue("");
            return;
          }
          props.onValueChange(parsed);
        }}
        className="font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-xs block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-purple focus:border-purple focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3"
      />
    </fieldset>
  );
}
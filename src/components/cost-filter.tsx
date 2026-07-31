import { useTranslations } from "next-intl";

import { PriceInput } from "@/components/price-input";

interface Props {
  minCost?: number | null;
  maxCost?: number | null;
  decimalScale?: number;
  onMinCostChange: (value: number | null) => void;
  onMaxCostChange: (value: number | null) => void;
}

export const CostFilter = ({ minCost, maxCost, decimalScale = 2, onMinCostChange, onMaxCostChange }: Props) => {
  const t = useTranslations("filter");

  return (
    <div className="grid gap-3">
      <PriceInput 
        label={t("min")} 
        id="min-amount" 
        name="min-amount" 
        placeholder="0.00" 
        decimalScale={decimalScale} 
        value={minCost ?? null}
        onValueChange={(value) => onMinCostChange(value)}
      />
      <PriceInput 
        label={t("max")} 
        id="max-amount" 
        name="max-amount" 
        placeholder="0.00" 
        decimalScale={decimalScale} 
        value={maxCost ?? null} 
        onValueChange={(value) => onMaxCostChange(value)} 
      />
    </div>
  );
};
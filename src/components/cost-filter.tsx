import { PriceInput } from "@/components/price-input";

interface Props {
  minCost?: number | null;
  maxCost?: number | null;
  decimalScale?: number;
  onMinCostChange: (value: number | null) => void;
  onMaxCostChange: (value: number | null) => void;
}

export const CostFilter = ({ minCost, maxCost, decimalScale = 2, onMinCostChange, onMaxCostChange }: Props) => {
  return (
    <div className="grid gap-3">
      <PriceInput 
        label="ขั้นต่ำ" 
        id="min-amount" 
        name="min-amount" 
        placeholder="0.00" 
        decimalScale={decimalScale} 
        value={minCost ?? null}
        onValueChange={(value) => onMinCostChange(value)}
      />
      <PriceInput 
        label="สูงสุด" 
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
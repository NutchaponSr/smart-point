import { PriceInput } from "@/components/price-input";

interface Props {
  minCost?: number | null;
  maxCost?: number | null;
  onMinCostChange: (value: number | null) => void;
  onMaxCostChange: (value: number | null) => void;
}

export const CostFilter = ({ minCost, maxCost, onMinCostChange, onMaxCostChange }: Props) => {
  return (
    <div className="grid gap-3">
      <PriceInput 
        label="ขั้นต่ำ" 
        id="min-amount" 
        name="min-amount" 
        placeholder="0.00" 
        decimalScale={2} 
        value={minCost ?? null}
        onValueChange={(value) => onMinCostChange(value)}
      />
      <PriceInput 
        label="สูงสุด" 
        id="max-amount" 
        name="max-amount" 
        placeholder="0.00" 
        decimalScale={2} 
        value={maxCost ?? null} 
        onValueChange={(value) => onMaxCostChange(value)} 
      />
    </div>
  );
};
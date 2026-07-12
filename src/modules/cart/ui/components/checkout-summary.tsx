import Coin from "../../../../../public/coin.svg";

import { cn } from "@/lib/utils";

interface Props {
  totalPoints: number;
  itemCount: number;
  className?: string;
}

export const CheckoutSummary = ({
  totalPoints,
  itemCount,
  className,
}: Props) => {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-md border-2 bg-background p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>จำนวนรายการ</span>
        <span className="font-medium text-foreground">{itemCount} รายการ</span>
      </div>

      <div className="h-0.5 bg-border" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold sm:text-lg">รวมทั้งหมด</span>
        <div className="flex items-center gap-2">
          <img src={Coin.src} alt="" className="size-6" aria-hidden />
          <span className="text-xl font-bold text-[#1cb0f6] tabular-nums sm:text-2xl">
            {totalPoints}
          </span>
        </div>
      </div>
    </div>
  );
};

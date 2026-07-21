import { cn } from "@/lib/utils";

import { CombinedPointsBadge } from "@/modules/cart/ui/components/currency";

interface Props {
  totalPoints: number;
  itemCount: number;
  fromReceiving?: number;
  fromSpecial?: number;
  className?: string;
}

export const CheckoutSummary = ({
  totalPoints,
  itemCount,
  fromReceiving,
  fromSpecial,
  className,
}: Props) => {
  const showSplit =
    fromReceiving != null &&
    fromSpecial != null &&
    (fromReceiving > 0 || fromSpecial > 0);

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
        <CombinedPointsBadge amount={totalPoints} />
      </div>

      {showSplit ? (
        <p className="text-xs text-muted-foreground">
          หัก{" "}
          <span className="font-semibold tabular-nums text-[#1cb0f6]">
            {fromReceiving.toLocaleString("th-TH")}
          </span>{" "}
          จากคะแนนที่ได้รับ
          {fromSpecial > 0 ? (
            <>
              {" + "}
              <span className="font-semibold tabular-nums text-[#cc348d]">
                {fromSpecial.toLocaleString("th-TH")}
              </span>{" "}
              จากคะแนนพิเศษ
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
};

import { differenceInCalendarDays, endOfMonth } from "date-fns";
import { BsExclamationTriangleFill } from "react-icons/bs";

const isInLastSevenDaysOfMonth = (date = new Date()) => {
  const monthEnd = endOfMonth(date);
  return differenceInCalendarDays(monthEnd, date) <= 6;
};

interface Props {
  givingBudget: number;
}

export const GivingPointExpiryWarning = ({ givingBudget }: Props) => {
  if (!isInLastSevenDaysOfMonth() || givingBudget <= 0) {
    return null;
  }

  return (
    <article className="relative flex flex-col rounded-xs border-2 border-orange bg-orange/10 transition-all duration-150">
      <header className="flex flex-1 flex-row items-start gap-3 p-4">
        <BsExclamationTriangleFill className="mt-0.5 size-5 shrink-0 text-orange" />
        <div className="flex flex-col gap-1">
          <h3 className="leading-snug text-base font-medium">
            สิ้นเดือนใกล้เข้ามาแล้ว!
          </h3>
          <p className="text-sm leading-snug text-muted-foreground">
            คุณยังมีคะแนนคงเหลือ{" "}
            <span className="font-bold text-foreground underline">{givingBudget}</span>{" "}
            แต้ม อย่าลืมมอบให้เพื่อนร่วมงานก่อนหมดเดือน
          </p>
        </div>
      </header>
    </article>
  );
};

import { cn } from "@/lib/utils";

interface Props {
  rank: number;
  name: string;
  points: number;
  className?: string;
}

export const CurrentUserRankBar = ({ rank, name, points, className }: Props) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-4 py-2 rounded-xs border-2 border-border bg-background",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xs bg-purple border-2 border-dashed border-border text-xl font-bold backdrop-blur-sm"
          aria-hidden
        >
          {rank}
        </div>
        <div className="min-w-0">
          <p className="text-sm">อันดับปัจจุบันของคุณ</p>
          <p className="truncate text-base font-medium text-muted-foreground" title={name}>
            {name}
            <span className="font-medium"> (คุณ)</span>
          </p>
        </div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="text-sm">คะแนนรวม</p>
        <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {points.toLocaleString("th-TH")}
        </p>
      </div>
    </div>
  );
};

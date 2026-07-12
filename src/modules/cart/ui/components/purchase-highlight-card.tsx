import placeholder from "../../../../../public/placeholder.png";

import { RiMedalFill } from "react-icons/ri";

import { cn } from "@/lib/utils";

const podiumStyles = {
  1: {
    medal: "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]",
    border:
      "border-amber-400/45 ring-1 ring-amber-400/25 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_20px_50px_-18px_rgba(245,158,11,0.35)]",
    surface:
      "bg-linear-to-br from-amber-500/[0.12] via-card to-card dark:from-amber-400/[0.08]",
    label: "text-amber-700/90 dark:text-amber-400/90",
    medalSize: "size-10",
  },
  2: {
    medal: "text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.45)]",
    border:
      "border-slate-300/50 ring-1 ring-slate-300/20 shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_16px_40px_-20px_rgba(100,116,139,0.35)]",
    surface:
      "bg-linear-to-br from-slate-400/[0.1] via-card to-card dark:from-slate-300/[0.06]",
    label: "text-slate-600 dark:text-slate-300",
    medalSize: "size-8",
  },
  3: {
    medal: "text-amber-800 drop-shadow-[0_0_8px_rgba(146,64,14,0.4)]",
    border:
      "border-orange-900/40 ring-1 ring-orange-800/20 shadow-[0_0_0_1px_rgba(124,45,18,0.12),0_14px_36px_-18px_rgba(154,52,18,0.35)]",
    surface:
      "bg-linear-to-br from-orange-900/[0.12] via-card to-card dark:from-orange-700/[0.08]",
    label: "text-orange-900/90 dark:text-orange-300/90",
    medalSize: "size-8",
  },
} as const;

type PodiumPlace = keyof typeof podiumStyles;

interface Props {
  rank: number;
  podiumPlace: PodiumPlace;
  rewardName: string;
  rewardImage: string;
  pointSpent: number;
  quantity: number;
  createdAt: number;
}

export const PurchaseHighlightCard = ({
  rank,
  podiumPlace,
  rewardName,
  rewardImage,
  pointSpent,
  quantity,
  createdAt,
}: Props) => {
  const theme = podiumStyles[podiumPlace];
  const date = new Date(createdAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section
      className={cn(
        "group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-xs border-2 p-5 transition duration-300",
        theme.border,
        theme.surface,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "mb-1 text-xs font-medium tracking-wider uppercase",
              theme.label,
            )}
          >
            อันดับที่ {rank}
          </p>
          <div className="flex min-w-0 items-center gap-3">
            <figure className="size-10 shrink-0 overflow-hidden rounded-xs border-2 border-border">
              <img
                src={rewardImage || placeholder.src}
                alt={rewardName}
                className="size-full object-cover"
              />
            </figure>
            <h2
              className="truncate text-base font-semibold leading-snug"
              title={rewardName}
            >
              {rewardName}
            </h2>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 transition duration-300 group-hover:scale-110",
            theme.medal,
          )}
          aria-hidden
        >
          <RiMedalFill className={theme.medalSize} />
        </span>
      </div>

      <div className="mt-4 space-y-1 border-t-2 border-dashed border-border pt-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">พอยต์ที่ใช้</p>
            <p className="font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
              {pointSpent.toLocaleString("th-TH")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">x{quantity}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

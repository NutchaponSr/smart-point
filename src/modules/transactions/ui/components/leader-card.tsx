import { RiMedalFill } from "react-icons/ri";

import { cn } from "@/lib/utils";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

const podiumStyles = {
  1: {
    medal: "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]",
    border:
      "border-amber-400/45 ring-1 ring-amber-400/25 shadow-[0_0_0_1px_rgba(251,191,36,0.12),0_20px_50px_-18px_rgba(245,158,11,0.35)]",
    surface:
      "bg-linear-to-br from-amber-500/[0.12] via-card to-card dark:from-amber-400/[0.08]",
    bar: "from-amber-500 to-amber-600",
    label: "text-amber-700/90 dark:text-amber-400/90",
    medalSize: "size-10",
    avatar: "size-10 after:border-2",
  },
  2: {
    medal: "text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.45)]",
    border:
      "border-slate-300/50 ring-1 ring-slate-300/20 shadow-[0_0_0_1px_rgba(148,163,184,0.1),0_16px_40px_-20px_rgba(100,116,139,0.35)]",
    surface:
      "bg-linear-to-br from-slate-400/[0.1] via-card to-card dark:from-slate-300/[0.06]",
    bar: "from-slate-400 to-slate-500",
    label: "text-slate-600 dark:text-slate-300",
    medalSize: "size-8",
    avatar: "size-8 after:border-2",
  },
  3: {
    medal: "text-amber-800 drop-shadow-[0_0_8px_rgba(146,64,14,0.4)]",
    border:
      "border-orange-900/40 ring-1 ring-orange-800/20 shadow-[0_0_0_1px_rgba(124,45,18,0.12),0_14px_36px_-18px_rgba(154,52,18,0.35)]",
    surface:
      "bg-linear-to-br from-orange-900/[0.12] via-card to-card dark:from-orange-700/[0.08]",
    bar: "from-orange-800 to-amber-950",
    label: "text-orange-900/90 dark:text-orange-300/90",
    medalSize: "size-8",
    avatar: "size-8 after:border-2",
  },
} as const;

type PodiumPlace = keyof typeof podiumStyles;

interface Props {
  name: string;
  src: string;
  score: number;
  /** อันดับจริง (รองรับการแบ่งหน้า) */
  rank: number;
  /** ลำดับบนแพดเดียม 1–3 กำหนดธีมทอง/เงิน/ทองแดง */
  podiumPlace: PodiumPlace;
}

export const LeaderCard = ({
  name,
  src,
  score,
  rank,
  podiumPlace,
}: Props) => {
  const theme = podiumStyles[podiumPlace];

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
          <h2 className="flex min-w-0 items-center gap-3 text-base font-semibold leading-snug">
            <UserAvatar
              name={name}
              src={src}
              className={{
                container: theme.avatar,
                fallback: "text-sm font-medium",
              }}
            />
            <span className="truncate" title={name}>
              {name}
            </span>
          </h2>
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
        <p className="text-xs font-medium text-muted-foreground">พอยต์</p>
        <p className="font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
          {score.toLocaleString("th-TH")}
        </p>
      </div>
    </section>
  );
};

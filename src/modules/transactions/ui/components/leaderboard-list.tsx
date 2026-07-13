import Image from "next/image";

import GoldMedalIcon from "../../../../../public/1st.svg";
import SilverMedalIcon from "../../../../../public/2nd.svg";
import BronzeMedalIcon from "../../../../../public/3rd.svg";
import CoinGiveIcon from "../../../../../public/coin-give.svg";

import { ApiOutputs } from "@convex/api";
import type { StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

type Leaderboard = ApiOutputs["leaderboard"]["getMany"]["page"][0];

const medalStyles: Record<number, StaticImageData> = {
  1: GoldMedalIcon,
  2: SilverMedalIcon,
  3: BronzeMedalIcon,
};

const RankBadge = ({ rank }: { rank: number }) => {
  const medal = medalStyles[rank];

  if (medal) {
    return (
      <span className="relative inline-flex size-10 shrink-0 items-center justify-center">
        <Image src={medal} alt="Medal" width={40} height={40} />
      </span>
    );
  }

  return (
    <span className="inline-flex size-10 shrink-0 items-center justify-center text-base font-bold tabular-nums text-[#58cc02]">
      {rank}
    </span>
  );
};

interface Props {
  entries: Leaderboard[];
  myEmployeeId?: Leaderboard["employeeId"] | null;
}

export const LeaderboardList = ({ entries, myEmployeeId }: Props) => {
  return (
    <div className="overflow-hidden bg-background">
      {entries.length > 0 ? (
        <ul>
          {entries.map((entry) => (
            <li
              key={`${entry.rank}-${entry.employeeCode}`}
              className={cn(
                "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#F7F7F7] rounded-md",
                myEmployeeId != null && entry.employeeId === myEmployeeId && "bg-[#e5e5e5]"
              )}
            >
              <RankBadge rank={entry.rank} />

              <UserAvatar
                name={entry.employeeName}
                src={entry.employeeCode}
                className={{
                  container: "size-12",
                  fallback: "text-base",
                }}
              />

              <span
                className="min-w-0 flex-1 truncate text-base font-bold"
                title={entry.employeeName}
              >
                {entry.employeeName}
              </span>

              <span className="shrink-0 text-base font-medium tabular-nums text-[#f1c40f] flex items-center gap-2">
                <Image src={CoinGiveIcon} alt="Coin Give" width={20} height={20} />
                {entry.points.toLocaleString("th-TH")}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-base text-muted-foreground">
          ยังไม่มีข้อมูลอันดับ
        </p>
      )}

    </div>
  );
};

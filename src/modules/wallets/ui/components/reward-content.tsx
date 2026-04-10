import Link from "next/link";
import Image from "next/image";

import EmptyImage from "../../../../../public/info.svg";

import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button";

import { SearchInput } from "@/components/search-input";

import { Reward } from "@/modules/rewards/ui/components/reward";

export const RewardContent = () => {
  const crpc = useCRPC();

  const [searchValue, setSearchValue] = useState("");

  const valueDebounced = useDebounce(searchValue, 200);

  const { data } = useSuspenseQuery(crpc.reward.getTrending.queryOptions({
    query: valueDebounced.trim(),
  }));

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex w-full items-center gap-4 py-4">
        <SearchInput value={searchValue} onChange={setSearchValue} />
      </div>

      <div className="grid gap-4">
        {data.length > 0 ? (
          data.map((reward) => (
            <Reward key={reward._id} reward={reward} variant="list" />
          ))
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <Image src={EmptyImage.src} alt="Empty" width={48} height={48} />
              </EmptyMedia>
              <EmptyTitle>ไม่พบสินค้า</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}

        <Link href="/rewards">
          <Button size="lg" className="w-full">
            ดูเพิ่มเติม
          </Button>
        </Link>
      </div>
    </div>
  );
};
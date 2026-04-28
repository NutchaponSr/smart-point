import Link from "next/link";

import { ArrowRightIcon } from "lucide-react";

interface Props {
  count: number;
}

export const EventCard = ({ count }: Props) => {
  return (
    <article className="relative flex flex-col rounded-xs border-2 border-border bg-background transition-all duration-150 hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,0_0_#0000,.25rem_.25rem_0_rgba(0,0,0,1)] group">
      <header className="flex flex-1 flex-row items-center justify-between gap-3 p-4">
        <Link href="/events" className="no-underline before:absolute before:content-[''] before:inset-0 flex items-center gap-2.5">
          <h3 className="leading-snug text-base font-normal">มีกิจกรรมที่ยังไม่ส่งคะแนนอยู่</h3>
          <p className="text-xl font-bold underline">{count}</p>
        </Link>

        <ArrowRightIcon className="size-4 opacity-0 group-hover:opacity-100 group-hover:-translate-x-2 transition-all duration-150" />
      </header>
    </article>
  );
}
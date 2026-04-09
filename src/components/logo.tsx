import Link from "next/link";

import { Domine } from "next/font/google";

import { cn } from "@/lib/utils";

const font = Domine({
  subsets: ["latin"],
})

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" aria-label="Smart Point" className={cn("shrink-0 lg:gap-1 lg:px-6", className)}>
      <span className={cn("inline-block aspect-115/22 shrink-0 text-2xl font-bold select-none text-white", font.className)}>
        Smart Point
      </span>
    </Link>
  );
}
import { Link } from "@/i18n/navigation";

import { Domine } from "next/font/google";

import { cn } from "@/lib/utils";

const font = Domine({
  subsets: ["latin"],
})

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" aria-label="Smart Point" className={cn("shrink-0 gap-1 px-6", className)}>
      <h1 className={cn("inline-block aspect-115/22 shrink-0 text-2xl font-bold select-none text-[#1cb0f6]", font.className)}>
        Smart Point
      </h1>
    </Link>
  );
}
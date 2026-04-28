"use client";

import Link from "next/link";

import { BsList } from "react-icons/bs";
import { useTranslations } from "next-intl";
import { HiShoppingBag } from "react-icons/hi2";

import { Button } from "@/components/ui/button";

import { Logo } from "@/components/logo";

import { UserButton } from "@/modules/auth/ui/components/user-button";

export const Header = () => {
  const t = useTranslations("nav");

  return (
    <header className="z-50 pl-4 h-20 lg:pl-0 lg:pr-0 flex flex-row justify-between items-center sticky top-0 left-0 right-0 shadow-[0_2px_0_0_rgba(0,0,0,1)] bg-black">
      <div className="flex items-center gap-4">
        <Logo />
      </div>

      <div className="hidden lg:flex lg:items-center">
        <div className="flex flex-col justify-center items-center lg:flex-row lg:gap-1 lg:px-6">
          <Button variant="rounded">
            <Link href="/transactions">
              {t("transaction")}
            </Link>
          </Button>
          <Button variant="rounded">
            <Link href="/rewards">
              {t("reward")}
            </Link>
          </Button>
          <Button variant="rounded">
            <Link href="/leaderboard">
              {t("leaderboard")}
            </Link>
          </Button>
          <Button variant="rounded">
            <Link href="/events">
              {t("events")}
            </Link>
          </Button>
          <Button variant="rounded">
            <Link href="/leaderboard">
              {t("leaderboard")}
            </Link>
          </Button>
          <Button variant="rounded" className="bg-white text-black hover:ring-1 hover:ring-white">
            <Link href="/dashboard">
              {t("dashboard")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="hidden lg:flex lg:items-center gap-4">
        <Link href="/checkout">
          <Button variant="elevated" size="iconLg" className="hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <HiShoppingBag className="size-6" />
          </Button>
        </Link>
        <div className="flex flex-col lg:flex-row lg:h-full">
          <UserButton />
        </div>
      </div>

      <div className="lg:hidden flex lg:flex-col flex-row h-full">
        <button className="flex w-full items-center justify-center h-full hover:bg-white border-black bg-pink p-4 text-lg lg:hover:text-white no-underline transition-colors duration-200 hover:text-black max-w-20 min-w-20 cursor-pointer max-h-20 min-h-20 border-l-2">
          <BsList className="size-6" />
        </button>
      </div>
    </header>
  );
}
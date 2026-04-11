"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CartScreen } from "../screens/cart-screen";

export const CheckoutView = () => {
  return (
    <div className="mx-auto w-full max-w-400">
      <header className="flex flex-col gap-4 border-b-2 border-border p-4 md:p-8 border-none pb-0 md:px-16 md:pb-0 lg:mb-2">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl">รถเข็น</h1>

          <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
            <Link href="/rewards">
              <Button variant="elevated" size="lg">
                ดูรางวัลเพิ่มเติม
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <CartScreen />
    </div>
  );
};
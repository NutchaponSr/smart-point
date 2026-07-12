"use client";

import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";

import { Button } from "@/components/ui/button";

import { CartScreen } from "../screens/cart-screen";

export const CheckoutView = () => {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 md:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/rewards")}
            className="w-fit gap-1.5 px-0 text-muted-foreground hover:text-foreground"
          >
            <RiArrowLeftLine className="size-4" />
            กลับไปเลือกรางวัล
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              รถเข็น
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ตรวจสอบรายการก่อนยืนยันแลกพอยต์
            </p>
          </div>
        </div>
      </header>

      <CartScreen />
    </div>
  );
};

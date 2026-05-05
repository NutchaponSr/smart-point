import Link from "next/link";

import checkoutImage from "../../../../../public/checkout.png";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { PointHero } from "@/modules/wallets/ui/components/point-hero";
import { CheckoutItem } from "@/modules/cart/ui/components/checkout-item";
import { CheckoutSummary } from "@/modules/cart/ui/components/checkout-summary";

export const CartScreen = () => {
  const crpc = useCRPC();
  const router = useRouter();

  const { data: cart } = useSuspenseQuery(crpc.cart.getCart.queryOptions());
  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  const checkout = useMutation(crpc.cart.redeemCart.mutationOptions());
  const remove = useMutation(crpc.cart.removeCartItem.mutationOptions());
  const updateQty = useMutation(crpc.cart.updateCartItemQuantity.mutationOptions());

  if (!cart.items.length) {
    return (
      <div className="grid gap-8 p-4 md:p-8 md:px-16">
        <div className="grid justify-items-center gap-3 rounded border-2 border-dashed border-border bg-background p-6 text-center [&>.icon]:text-xl">
          <figure className="w-full">
            <img src={checkoutImage.src} alt="Checkout" className="w-full rounded-xs" />
          </figure>
          <h3 className="text-lg font-normal leading-snug">คุณยังไม่ได้เพิ่มอะไรเลย...ในตอนนี้!</h3>
          <p>เมื่อคุณทำแล้ว รายการจะแสดงขึ้นที่นี่เพื่อให้คุณดำเนินการสั่งซื้อให้เสร็จสมบูรณ์</p>

          <Link href="/rewards">
            <Button variant="elevated" size="lg" className="bg-pink hover:bg-pink">
              ค้นหารางวัล
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 p-4 md:p-8 md:px-16">
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-8 lg:grid-cols-[2fr_minmax(26rem,1fr)]">
        <div className="grid gap-6">
          <div role="list" className="rounded-xs border-2 border-border bg-background">
            {cart.items.map((item) => (
              <CheckoutItem
                key={item._id}
                item={item}
                onRemove={() => remove.mutate({ cartItemId: item._id })}
                onUpdateQuantity={(quantity) =>
                  updateQty.mutate(
                    { cartItemId: item._id, quantity },
                    {
                      onError: (err) => {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "อัปเดตจำนวนไม่สำเร็จ";
                        toast.error(msg);
                      },
                    },
                  )
                }
                isUpdating={
                  updateQty.isPending &&
                  updateQty.variables?.cartItemId === item._id
                }
              />
            ))}
          </div>

          <CheckoutSummary totalPoints={cart.totalPoints} />
        </div>

        <div className="flex flex-col gap-6">
          <PointHero 
            title="ยอดพอยต์คงเหลือ"
            points={wallet.receivingBudget}
            variant="orange"
          />

          
          <Button onClick={() => 
            checkout.mutate({}, { 
              onSuccess: () => {
                router.push("/purchases");
                toast.success("จ่ายสำเร็จ");
              } 
            }
          )}>
            จ่าย
          </Button>
        </div>
      </div>
    </div>
  );
};
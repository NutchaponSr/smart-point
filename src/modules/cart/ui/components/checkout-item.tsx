import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { RiCopperCoinFill } from "react-icons/ri";

import { Button } from "@/components/ui/button";

interface Props {
  item: ApiOutputs["cart"]["getCart"]["items"][number];
  onRemove: () => void;
}

export const CheckoutItem = ({ item, onRemove }: Props) => {
  const { reward, quantity } = item;

  return (
    <div role="listitem" className="border-border not-first:border-t-2">
      <section className="flex flex-row gap-4 sm:gap-5 p-4 sm:p-5">
        <div className="relative inline-flex">
          <figure className="overflow-hidden rounded-xs border-2 border-border bg-cover bg-center h-16 w-16 sm:h-30 sm:w-30">
            <img 
              src={reward.image || placeholder.src} 
              alt={reward.name || "Reward"} 
              loading="lazy"  
              className="size-full object-cover"
            />
          </figure>

          <div className="absolute top-0 right-0 flex h-5 min-w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground bg-primary px-1 text-xs font-normal text-primary-foreground sm:h-6 sm:min-w-6 sm:px-1.5">
            {quantity}
          </div>
        </div>
        <section className="flex flex-1 flex-col gap-1">
          <h4 className="line-clamp-2 text-base font-medium no-underline sm:text-lg">
            <a href={`/rewards/${reward._id}`} className="no-underline">
              {reward.name}
            </a>
          </h4>
          <p className="text-sm text-muted-foreground">
            {reward.description}
          </p>

          <footer className="mt-auto flex flex-col gap-x-4 gap-y-1 text-sm sm:flex-wrap">
            <div className="flex flex-wrap items-stretch gap-3 pt-2">
              {!reward.onePerOrder && (
                <Button variant="elevated" size="xs">
                  แก้ไข
                </Button>
              )}
              <Button variant="elevated" size="xs" onClick={onRemove}>
                ลบออก
              </Button>
            </div>
          </footer>
        </section>

        <section className="ml-auto flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <RiCopperCoinFill className="size-5" />
            <span className="text-base font-bold sm:text-lg">
              {reward.pointCost * quantity}
            </span>
          </div>
        </section>
      </section>
    </div>
  );
};
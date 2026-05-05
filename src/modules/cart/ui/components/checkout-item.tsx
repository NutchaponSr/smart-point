"use client";

import { useEffect, useState } from "react";

import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { RiCopperCoinFill } from "react-icons/ri";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogHidden,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  item: ApiOutputs["cart"]["getCart"]["items"][number];
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  isUpdating?: boolean;
}

export const CheckoutItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  isUpdating,
}: Props) => {
  const { reward, quantity } = item;
  const [editOpen, setEditOpen] = useState(false);
  const [draftQty, setDraftQty] = useState(quantity);

  const maxQty = reward.stock === -1 ? 999 : reward.stock;

  useEffect(() => {
    if (editOpen) {
      setDraftQty(quantity);
    }
  }, [editOpen, quantity]);

  const clampDraft = (n: number) =>
    Math.min(maxQty, Math.max(1, Math.round(n)));

  const onSaveQuantity = () => {
    const next = clampDraft(draftQty);
    setDraftQty(next);
    if (next !== quantity) {
      onUpdateQuantity(next);
    }
    setEditOpen(false);
  };

  return (
    <div role="listitem" className="border-border not-first:border-t-2">
      <section className="flex flex-row items-start gap-4 sm:gap-5 p-4 sm:p-5">
        <div className="relative inline-flex shrink-0 self-start">
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
        <section className="flex min-w-0 flex-1 flex-col gap-1">
          <h4 className="line-clamp-2 text-base font-medium no-underline sm:text-lg">
            <a href={`/rewards/${reward._id}`} className="no-underline">
              {reward.name}
            </a>
          </h4>
          <p className="text-sm text-muted-foreground">{reward.description}</p>

          <footer className="mt-auto flex flex-col gap-x-4 gap-y-1 text-sm sm:flex-wrap">
            <div className="flex flex-wrap items-stretch gap-3 pt-2">
              {!reward.onePerOrder && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "elevated", size: "xs" }),
                    )}
                  >
                    แก้ไข
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHidden />
                    <DialogHeader>
                      <DialogTitle>แก้ไขจำนวน</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`qty-${item._id}`}>จำนวน</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="elevated"
                            size="icon"
                            className="size-8 shrink-0"
                            disabled={draftQty <= 1}
                            onClick={() =>
                              setDraftQty((q) => clampDraft(q - 1))
                            }
                          >
                            −
                          </Button>
                          <Input
                            id={`qty-${item._id}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={maxQty}
                            value={draftQty}
                            onChange={(e) => {
                              const v = e.target.valueAsNumber;
                              if (Number.isNaN(v)) return;
                              setDraftQty(clampDraft(v));
                            }}
                            className="text-center"
                          />
                          <Button
                            type="button"
                            variant="elevated"
                            size="icon"
                            className="size-8 shrink-0"
                            disabled={draftQty >= maxQty}
                            onClick={() =>
                              setDraftQty((q) => clampDraft(q + 1))
                            }
                          >
                            +
                          </Button>
                        </div>
                        {reward.stock !== -1 && (
                          <p className="text-xs text-muted-foreground">
                            คงเหลือในสต็อก {reward.stock} ชิ้น
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="border-0 bg-transparent p-4 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditOpen(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="button"
                        onClick={onSaveQuantity}
                        disabled={isUpdating}
                      >
                        บันทึก
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="elevated" size="xs" onClick={onRemove}>
                ลบออก
              </Button>
            </div>
          </footer>
        </section>

        <section className="ml-auto flex shrink-0 flex-col items-end gap-1 self-start">
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
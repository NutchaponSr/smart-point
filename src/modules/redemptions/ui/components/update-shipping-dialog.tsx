"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  shippingStatuses,
  type ShippingStatus,
} from "@/modules/rewards/constants";
import type { RedemptionAdminRow } from "@/modules/redemptions/ui/components/redemption-shipping-columns";

interface Props {
  row: RedemptionAdminRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHIPPING_OPTIONS: ShippingStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

export const UpdateShippingDialog = ({ row, open, onOpenChange }: Props) => {
  const crpc = useCRPC();
  const updateShipping = useMutation(
    crpc.redemption.updateShippingStatus.mutationOptions(),
  );

  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>("pending");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (row == null) return;
    setShippingStatus(row.redemption.shippingStatus);
    setNote("");
  }, [row]);

  const handleSubmit = async () => {
    if (row == null) return;

    try {
      await updateShipping.mutateAsync({
        redemptionId: row.redemption._id,
        shippingStatus,
        note: note.trim() || undefined,
      });
      toast.success("อัปเดตสถานะจัดส่งแล้ว");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ไม่สามารถอัปเดตได้",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-md ring-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b-2 border-[#0003] bg-[#58cc02] px-6 py-4">
          <DialogTitle className="text-lg font-bold text-white">
            อัปเดตสถานะจัดส่ง
          </DialogTitle>
        </DialogHeader>

        {row != null && (
          <div className="grid gap-4 px-6 py-5">
            <div className="rounded-md border-2 border-border bg-muted/40 p-3">
              <p className="text-sm font-bold">{row.reward.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.employee.name} ({row.employee.employeeId})
              </p>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-bold">สถานะจัดส่ง</legend>
              <div className="grid grid-cols-2 gap-2">
                {SHIPPING_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setShippingStatus(option)}
                    className={`rounded-md border-2 px-3 py-2 text-sm font-bold transition-colors ${
                      shippingStatus === option
                        ? "border-[#58cc02] bg-[#d7ffb8] text-[#58a700]"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {shippingStatuses[option].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-2">
              <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
              <Input
                id="note"
                value={note}
                placeholder="หมายเหตุเพิ่มเติม"
                onChange={(e) => setNote(e.target.value)}
                className="rounded-md border-2"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t-2 bg-[#f5f5f5] p-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="secondary"
            disabled={updateShipping.isPending || row == null}
            onClick={() => void handleSubmit()}
          >
            {updateShipping.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

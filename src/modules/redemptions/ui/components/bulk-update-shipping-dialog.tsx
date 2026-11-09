"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  shippingStatuses,
  type ShippingStatus,
} from "@/modules/rewards/constants";

interface Props {
  redemptionIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const SHIPPING_OPTIONS: ShippingStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

export const BulkUpdateShippingDialog = ({
  redemptionIds,
  open,
  onOpenChange,
  onUpdated,
}: Props) => {
  const crpc = useCRPC();
  const bulkUpdate = useMutation(
    crpc.redemption.bulkUpdateShippingStatus.mutationOptions(),
  );

  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>("processing");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setShippingStatus("processing");
    setNote("");
  }, [open]);

  const handleSubmit = async () => {
    if (redemptionIds.length === 0) return;

    try {
      const result = await bulkUpdate.mutateAsync({
        redemptionIds,
        shippingStatus,
        note: note.trim() || undefined,
      });

      if (result.updated === 0) {
        toast.error("ไม่สามารถอัปเดตรายการที่เลือกได้");
        return;
      }

      toast.success(
        result.skipped > 0
          ? `อัปเดต ${result.updated} รายการ ข้าม ${result.skipped} รายการ`
          : `อัปเดต ${result.updated} รายการแล้ว`,
      );
      onUpdated();
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
            อัปเดต {redemptionIds.length} รายการ
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5">
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
            <Label htmlFor="bulk-note">หมายเหตุ (ไม่บังคับ)</Label>
            <Input
              id="bulk-note"
              value={note}
              placeholder="หมายเหตุเพิ่มเติม"
              onChange={(event) => setNote(event.target.value)}
              className="rounded-md border-2"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t-2 bg-[#f5f5f5] p-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="secondary"
            disabled={bulkUpdate.isPending || redemptionIds.length === 0}
            onClick={() => void handleSubmit()}
          >
            {bulkUpdate.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

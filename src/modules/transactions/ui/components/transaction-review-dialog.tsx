"use client";

import CoinGiveIcon from "../../../../../public/coin-give.svg";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { ReactNode } from "react";
import type { ApiOutputs } from "@convex/api";
import { useMutation } from "@tanstack/react-query";

import { pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";
import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { tags } from "@/modules/transactions/constants";
import { TransactionStatusBadge } from "@/modules/transactions/ui/components/transaction-analytic-columns";

type Transaction = ApiOutputs["transaction"]["getMany"]["page"][0];

interface Props {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-[#afafaf]">{label}</p>
      <div className="text-sm font-medium text-[#4b4b4b]">{value}</div>
    </div>
  );
}

function PartyCard({
  label,
  name,
  id,
  department,
  image,
  accent,
}: {
  label: string;
  name: string;
  id: string | undefined;
  department: string | undefined;
  image: string | null | undefined;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-3">
      <UserAvatar
        name={name}
        src={image ?? undefined}
        className={{
          container: "size-10 shrink-0",
          fallback: accent ? "text-sm font-medium bg-orange" : "text-sm font-medium",
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#afafaf]">{label}</p>
        <p className="text-sm font-bold text-[#4b4b4b]">{name}</p>
        {id ? <p className="text-xs text-[#777]">รหัส: {id}</p> : null}
        {department ? <p className="text-xs text-[#777]">แผนก: {department}</p> : null}
      </div>
    </div>
  );
}

export function TransactionReviewDialog({
  transaction,
  open,
  onOpenChange,
}: Props) {
  const crpc = useCRPC();
  const remove = useMutation(crpc.transaction.approve.mutationOptions());

  const [RejectionDialog, reject] = useConfirm({
    title: "ลบธุรกรรมและคืนแต้ม",
  });

  const senderName = transaction.sender?.name
    ? pickLocalized(transaction.sender.name, "th") || "ไม่พบข้อมูลผู้ส่ง"
    : "ไม่พบข้อมูลผู้ส่ง";
  const receiverName = transaction.receiver?.name
    ? pickLocalized(transaction.receiver.name, "th") || "ไม่พบข้อมูลผู้รับ"
    : "ไม่พบข้อมูลผู้รับ";
  const senderDepartment = transaction.sender?.department
    ? pickLocalized(transaction.sender.department, "th") || undefined
    : undefined;
  const receiverDepartment = transaction.receiver?.department
    ? pickLocalized(transaction.receiver.department, "th") || undefined
    : undefined;
  const tagLabel = tags[transaction.tags] ?? transaction.tags;
  const createdAt = format(
    new Date(transaction._creationTime),
    "d MMM yyyy HH:mm",
    { locale: th },
  );
  const reviewedAt =
    transaction.reviewedAt > 0
      ? format(new Date(transaction.reviewedAt), "d MMM yyyy HH:mm", {
          locale: th,
        })
      : null;

  const handleReject = async () => {
    const ok = await reject();
    if (!ok) return;

    remove.mutate(
      { transactionId: transaction._id },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <>
      <RejectionDialog />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดธุรกรรม</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <InfoRow
              label="รหัสธุรกรรม"
              value={
                <p
                  className="break-all font-mono text-xs text-[#777]"
                  title={transaction._id}
                >
                  {transaction._id}
                </p>
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <PartyCard
                label="ผู้ส่ง"
                name={senderName}
                id={transaction.sender?.id}
                department={senderDepartment}
                image={transaction.sender?.image}
              />
              <PartyCard
                label="ผู้รับ"
                name={receiverName}
                id={transaction.receiver?.id}
                department={receiverDepartment}
                image={transaction.receiver?.image}
                accent
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                label="จำนวนพอยต์"
                value={
                  <span className="text-lg font-bold text-[#F7C100] flex items-center gap-1">
                    <img src={CoinGiveIcon.src} alt="Coin Give" className="size-6" />
                    {transaction.amount} 
                  </span>
                }
              />
              <InfoRow
                label="สถานะ"
                value={<TransactionStatusBadge status={transaction.status} />}
              />
            </div>

            <InfoRow label="วันที่สร้าง" value={createdAt} />

            {reviewedAt ? (
              <InfoRow label="วันที่ตรวจสอบ" value={reviewedAt} />
            ) : null}

            <InfoRow label="แท็ก SMART Culture" value={tagLabel || "-"} />

            <InfoRow
              label="ข้อความ"
              value={
                transaction.message ? (
                  <p className="whitespace-pre-wrap rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-3 text-sm leading-relaxed">
                    {transaction.message}
                  </p>
                ) : (
                  "-"
                )
              }
            />

            {transaction.rejectionReason ? (
              <InfoRow
                label="เหตุผลที่ปฏิเสธ"
                value={
                  <p className="whitespace-pre-wrap rounded-md border-2 border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                    {transaction.rejectionReason}
                  </p>
                }
              />
            ) : null}
          </div>

          <DialogFooter className="border-0 bg-transparent p-4 flex items-center justify-end gap-2">
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={handleReject}
            >
              ลบและคืนแต้ม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

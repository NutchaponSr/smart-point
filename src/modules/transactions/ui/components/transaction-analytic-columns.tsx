"use client";

import CoinGiveIcon from "../../../../../public/coin-give.svg";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { BsCalendar2Fill } from "react-icons/bs";
import type { ApiOutputs } from "@convex/api";

import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { statuses, tags } from "@/modules/transactions/constants";
import { TransactionActions } from "@/modules/transactions/ui/components/transaction-actions";

export type Transaction = ApiOutputs["transaction"]["getMany"]["page"][0];
type TransactionStatus = Transaction["status"];

const statusBadgeClassName: Record<TransactionStatus, string> = {
  pending: "bg-[#ffe8c2] text-[#cc7800]",
  completed: "bg-[#d7ffb8] text-[#58a700]",
  rejected: "bg-[#ffdfdf] text-[#ea2b2b]",
};

const FEED_AVATAR_CLASS = {
  sender: {
    fallback: "bg-[#1cb0f6]! text-sm font-bold",
    container: "ring-[#1899d6]! shadow-[0_3px_0_#1899d6]!",
  },
  receiver: {
    fallback: "bg-[#ffc800]! text-xs font-bold",
    container: "ring-[#e6b400]! shadow-[0_3px_0_#e6b400]!",
  },
} as const;

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md px-2.5 py-1.5 text-xs font-bold",
        statusBadgeClassName[status],
      )}
    >
      {statuses[status]}
    </span>
  );
}

interface TransactionAnalyticCardProps {
  transaction: Transaction;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}

export function TransactionAnalyticCard({
  transaction,
  selected,
  onSelectedChange,
}: TransactionAnalyticCardProps) {
  const senderName = transaction.sender?.name
    ? pickLocalized(transaction.sender.name, "th") || "ไม่พบข้อมูลผู้ส่ง"
    : "ไม่พบข้อมูลผู้ส่ง";
  const receiverName = transaction.receiver?.name
    ? pickLocalized(transaction.receiver.name, "th") || "ไม่พบข้อมูลผู้รับ"
    : "ไม่พบข้อมูลผู้รับ";
  const tagLabel = tags[transaction.tags] ?? transaction.tags;
  const createdAt = format(
    new Date(transaction._creationTime),
    "d MMM yyyy HH:mm",
    { locale: th },
  );

  return (
    <li
      className={cn(
        "flex flex-col gap-4 border-t-2 border-border bg-background px-4 py-5 transition-colors sm:flex-row sm:items-center",
        selected && "bg-[#eef8ff]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange(!!value)}
          aria-label="เลือกธุรกรรม"
          className="mt-1 size-5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="relative shrink-0">
          <UserAvatar
            name={senderName}
            src={transaction.sender?.image ?? undefined}
            className={{
              container: cn(
                "size-11",
                transaction.sender?.image
                  ? "ring-0! shadow-none!"
                  : FEED_AVATAR_CLASS.sender.container,
              ),
              fallback: FEED_AVATAR_CLASS.sender.fallback,
            }}
          />
          <div className="absolute -bottom-1.5 -right-1.5">
            <UserAvatar
              name={receiverName}
              src={transaction.receiver?.image ?? undefined}
              className={{
                container: cn(
                  "size-7",
                  transaction.receiver?.image
                    ? "ring-0! shadow-none!"
                    : FEED_AVATAR_CLASS.receiver.container,
                ),
                fallback: FEED_AVATAR_CLASS.receiver.fallback,
              }}
            />
          </div>
        </div>

        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <TransactionStatusBadge status={transaction.status} />
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-[#ffc800]">
              <img
                src={CoinGiveIcon.src}
                alt=""
                className="size-4"
                aria-hidden
              />
              {transaction.amount}
            </span>
            {tagLabel ? (
              <span className="line-clamp-1 max-w-full rounded-md bg-[#f3e0ff] px-2 py-1.5 text-xs font-bold text-[#a568cc]">
                {tagLabel}
              </span>
            ) : null}
          </div>

          <p className="text-base font-bold leading-snug text-[#4b4b4b]">
            <span className="text-[#1cb0f6]">{senderName}</span>
            <span className="font-semibold text-[#777]"> ให้ </span>
            <span className="text-primary">{transaction.amount} พอยต์</span>
            <span className="font-semibold text-[#777]"> แก่ </span>
            <span className="text-[#ffc800]">{receiverName}</span>
          </p>

          <p
            className="truncate font-mono text-[10px] text-[#afafaf]"
            title={transaction._id}
          >
            ID: {transaction._id}
          </p>

          {transaction.message ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-[#777]">
              {transaction.message}
            </p>
          ) : null}

          <span className="inline-flex w-fit items-center gap-2 rounded-md border-2 bg-[#f7f7f7] px-2.5 py-1.5 text-xs font-semibold text-[#4b4b4b]">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-[#ddf4ff] text-[#1899d6]">
              <BsCalendar2Fill className="size-3" />
            </span>
            {createdAt}
          </span>
        </div>
      </div>

      <div className="shrink-0 self-start sm:w-32 sm:pl-0 pl-11">
        <TransactionActions transaction={transaction} />
      </div>
    </li>
  );
}

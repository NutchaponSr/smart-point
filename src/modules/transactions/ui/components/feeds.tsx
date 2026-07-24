"use client";

import Image from "next/image";

import CoinIcon from "../../../../../public/coin.svg";
import CoinGiveIcon from "../../../../../public/coin-give.svg";

import { useState, type ReactNode } from "react";
import { ApiOutputs } from "@convex/api";
import { format, formatDistanceToNow, startOfDay } from "date-fns";
import { th } from "date-fns/locale";
import { CheckIcon, ListFilterIcon } from "lucide-react";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { useInfiniteQuery } from "better-convex/react";
import { GoComment, GoHeart, GoHeartFill } from "react-icons/go";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Accordion } from "@/components/accordion";
import { CostFilter } from "@/components/cost-filter";
import { SearchInput } from "@/components/search-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogHidden,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { tags } from "@/modules/transactions/constants";
import { useFeedFilters } from "@/modules/transactions/stores/use-feed-filters";
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";
import { TransactionStatusBadge } from "@/modules/transactions/ui/components/transaction-analytic-columns";

import { Id } from "../../../../../convex/functions/_generated/dataModel";

type Feed = ApiOutputs["transaction"]["feeds"]["page"][number];
type FeedView = "all" | "sent" | "received";

const FEED_VIEW_OPTIONS: { value: FeedView; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "sent", label: "ส่งให้คนอื่น" },
  { value: "received", label: "ได้รับ" },
];

const DATE_LABEL_PATTERN = "dd/MM/yyyy";

const formatDateRangeLabel = (from: number | null, to: number | null): string => {
  if (from == null) return "ช่วงเวลา";

  const fromDate = new Date(from);
  const toDate = to != null ? new Date(to) : fromDate;
  const isSameDay =
    startOfDay(fromDate).getTime() === startOfDay(toDate).getTime();

  if (isSameDay) return format(fromDate, DATE_LABEL_PATTERN);
  return `${format(fromDate, DATE_LABEL_PATTERN)} – ${format(toDate, DATE_LABEL_PATTERN)}`;
};

const formatDistanceTh = (date: Date | number, addSuffix = true) =>
  formatDistanceToNow(new Date(date), { addSuffix, locale: th });

const FEED_AVATAR_CLASS = {
  sender: {
    fallback: "bg-[#1cb0f6]! text-xl",
    container: "ring-[#1899d6]! shadow-[0_3px_0_#1899d6]!",
  },
  receiver: {
    fallback: "bg-[#ffc800]! text-xl",
    container: "ring-[#e6b400]! shadow-[0_3px_0_#e6b400]!",
  },
} as const;

function getFeedAvatarClassName(
  role: "sender" | "receiver",
  size: string,
  hasImage: boolean,
) {
  const tone = FEED_AVATAR_CLASS[role];
  return {
    container: cn(
      size,
      "shrink-0",
      hasImage ? "ring-0! shadow-none!" : tone.container,
    ),
    fallback: tone.fallback,
  };
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
          fallback: accent
            ? "bg-orange text-sm font-medium"
            : "text-lg font-medium",
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#afafaf]">{label}</p>
        <p className="text-sm font-bold text-[#4b4b4b]">{name}</p>
        {id ? <p className="text-xs text-[#777]">รหัส: {id}</p> : null}
        {department ? (
          <p className="text-xs text-[#777]">แผนก: {department}</p>
        ) : null}
      </div>
    </div>
  );
}

function FeedHeadline({
  isReceived,
  senderName,
  receiverName,
}: {
  isReceived: boolean;
  senderName: string;
  receiverName: string;
}) {
  if (isReceived) {
    return (
      <p className="flex min-w-0 items-baseline gap-1 text-sm leading-snug">
        <span className="min-w-0 truncate font-bold text-[#1cb0f6]">
          {senderName}
        </span>
        <span className="shrink-0 font-medium text-[#4b4b4b]">
          ส่งพอยต์ให้คุณ
        </span>
      </p>
    );
  }

  return (
    <p className="flex min-w-0 items-baseline gap-1 text-sm leading-snug">
      <span className="shrink-0 font-medium text-[#4b4b4b]">คุณมอบพอยต์ให้</span>
      <span className="min-w-0 truncate font-bold text-[#f1c40f]">
        {receiverName}
      </span>
    </p>
  );
}

function FeedMessageBubble({ message }: { message: string }) {
  return (
    <div className="max-w-full min-w-0 overflow-hidden rounded-md rounded-tl-none border-2 bg-[#f7f7f7] px-3.5 py-2.5 text-sm leading-snug text-[#4b4b4b]">
      <p className="whitespace-pre-wrap break-all">{message}</p>
    </div>
  );
}

function FeedCommentBubble({
  authorName,
  content,
}: {
  authorName: string;
  content: string;
}) {
  return (
    <div className="max-w-full min-w-0 overflow-hidden rounded-md rounded-tl-none border-2 border-[#e5e5e5] bg-[#f7f7f7] px-3 py-2">
      <p className="truncate text-sm font-bold text-[#4b4b4b]">{authorName}</p>
      <p className="mt-1 whitespace-pre-wrap break-all text-sm leading-snug text-[#4b4b4b]">
        {content}
      </p>
    </div>
  );
}

function PointBadge({
  isReceived,
  amount,
  size = "md",
}: {
  isReceived: boolean;
  amount: number;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 font-bold tabular-nums">
      <Image
        src={isReceived ? CoinIcon : CoinGiveIcon}
        alt=""
        width={size === "sm" ? 16 : 20}
        height={size === "sm" ? 20 : 24}
        aria-hidden
      />
      <span className={cn(isReceived ? "text-[#1cb0f6]" : "text-[#f1c40f]")}>
        {isReceived ? `+${amount}` : `-${amount}`}
      </span>
    </div>
  );
}

function FeedLikeButton({
  likes,
  likedByCurrentUser,
  onLike,
}: {
  likes: number;
  likedByCurrentUser: boolean;
  onLike: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={(event) => {
        event.stopPropagation();
        onLike();
      }}
      className="text-[#ff4b4b]"
    >
      {likedByCurrentUser ? (
        <GoHeartFill className="size-4 stroke-[0.25]" />
      ) : (
        <GoHeart className="size-4 stroke-[0.25]" />
      )}
      {likes}
    </Button>
  );
}

function FeedFiltersPopover() {
  const [filters, setFilters] = useFeedFilters();

  const hasActiveFilters =
    filters.feedView !== "all" ||
    filters.feedQ.length > 0 ||
    filters.feedMin > 0 ||
    filters.feedMax > 0 ||
    filters.feedFrom != null ||
    filters.feedTo != null;

  const dateRangeLabel = formatDateRangeLabel(filters.feedFrom, filters.feedTo);

  const onClear = () => {
    void setFilters({
      feedView: "all",
      feedQ: "",
      feedMin: 0,
      feedMax: 0,
      feedFrom: null,
      feedTo: null,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="primaryOutline"
          size="icon"
          aria-label="ตัวกรองกิจกรรมพอยต์"
          className={cn(hasActiveFilters && "border-[#1cb0f6] text-[#1cb0f6]")}
        >
          <ListFilterIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 divide-y-2 divide-solid divide-border p-0 select-none"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 p-4">
          <h3 className="relative z-1 text-base font-bold leading-snug">
            ตัวกรอง
          </h3>
          {hasActiveFilters ? (
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={onClear}
            >
              รีเซ็ต
            </button>
          ) : null}
        </header>

        <div className="p-4">
          <SearchInput
            value={filters.feedQ}
            placeholder="ค้นหาชื่อ ข้อความ หรือรหัสธุรกรรม"
            onChange={(feedQ) => void setFilters({ ...filters, feedQ })}
          />
        </div>

        <Accordion title="ประเภท">
          {FEED_VIEW_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="inline-flex cursor-pointer items-center gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
            >
              <span className="relative inline-flex shrink-0 items-center justify-center">
                <input
                  type="radio"
                  name="feed-view"
                  checked={filters.feedView === option.value}
                  onChange={() =>
                    void setFilters({ ...filters, feedView: option.value })
                  }
                  className="peer size-[calc(1lh+0.125rem)] shrink-0 cursor-pointer appearance-none rounded-xs border-[1.5px] border-border bg-background text-base leading-snug checked:bg-pink disabled:cursor-not-allowed disabled:opacity-30"
                />
                <CheckIcon className="pointer-events-none absolute hidden size-4.5 text-accent-foreground peer-checked:block" />
              </span>
              {option.label}
            </label>
          ))}
        </Accordion>

        <Accordion title="จำนวนพอยต์">
          <CostFilter
            decimalScale={0}
            minCost={filters.feedMin}
            maxCost={filters.feedMax}
            onMinCostChange={(feedMin) =>
              void setFilters({ ...filters, feedMin: feedMin ?? 0 })
            }
            onMaxCostChange={(feedMax) =>
              void setFilters({ ...filters, feedMax: feedMax ?? 0 })
            }
          />
        </Accordion>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <DateFilter
            from={filters.feedFrom}
            to={filters.feedTo}
            onChange={({ from, to }) =>
              void setFilters({ ...filters, feedFrom: from, feedTo: to })
            }
          >
            <button
              type="button"
              className="flex w-full text-start hover:underline"
            >
              {dateRangeLabel}
            </button>
          </DateFilter>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const Feeds = () => {
  const crpc = useCRPC();
  const [filters] = useFeedFilters();
  const debouncedQuery = useDebounce(filters.feedQ, 400);

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  const {
    data: feeds,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    crpc.transaction.feeds.infiniteQueryOptions({
      view: filters.feedView,
      q: debouncedQuery || null,
      min: filters.feedMin > 0 ? filters.feedMin : null,
      max: filters.feedMax > 0 ? filters.feedMax : null,
      from: filters.feedFrom,
      to: filters.feedTo,
    }),
  );

  const like = useMutation(crpc.transaction.like.mutationOptions());

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#4b4b4b]">กิจกรรมพอยต์</h2>
        <FeedFiltersPopover />
      </div>

      <ul className="divide-y-2 divide-[#e5e5e5] overflow-hidden rounded-md border-2 bg-white">
        {feeds.length > 0 ? (
          feeds.map((feed) => (
            <FeedItem
              key={feed._id}
              feed={feed}
              currentEmployeeId={wallet.employeeId}
              onLike={() => like.mutate({ transactionId: feed._id })}
            />
          ))
        ) : (
          <li className="grid gap-6 p-6 md:p-8">
            <div className="grid justify-items-center gap-4 rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-8 text-center">
              <div className="flex items-center gap-2">
                <Image
                  src={CoinIcon}
                  alt=""
                  width={28}
                  height={34}
                  aria-hidden
                />
                <Image
                  src={CoinGiveIcon}
                  alt=""
                  width={28}
                  height={34}
                  aria-hidden
                />
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold text-[#4b4b4b]">
                  ยังไม่มีกิจกรรมในฟีด
                </h3>
                <p className="text-sm text-[#777]">
                  เมื่อมีการมอบคะแนน รายการจะแสดงขึ้นที่นี่
                </p>
              </div>
            </div>
          </li>
        )}

        {hasNextPage ? (
          <li className="p-4">
            <Button
              variant="primaryOutline"
              className="w-full rounded-xl font-bold"
              onClick={() => fetchNextPage()}
            >
              ดูเพิ่มเติม
            </Button>
          </li>
        ) : null}
      </ul>
    </section>
  );
};

const FeedItem = ({
  feed,
  currentEmployeeId,
  onLike,
}: {
  feed: Feed;
  currentEmployeeId: Id<"employee">;
  onLike: () => void;
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const isReceived = feed.receiverId === currentEmployeeId;
  const timeAgo = formatDistanceTh(feed.createdAt);

  const avatarName = isReceived ? feed.sender.name : feed.receiver.name;
  const avatarImage = isReceived ? feed.sender.image : feed.receiver.image;

  return (
    <>
      <li
        className={cn(
          "p-4 transition-colors bg-background",
        )}
      >
        <div className="flex min-w-0 items-start gap-3 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsDetailOpen(true)}
            className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden text-left"
          >
            <UserAvatar
              name={avatarName}
              src={avatarImage || undefined}
              className={getFeedAvatarClassName(
                isReceived ? "sender" : "receiver",
                "size-11",
                Boolean(avatarImage),
              )}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex w-full min-w-0 flex-col gap-2 text-left">
                <FeedHeadline
                  isReceived={isReceived}
                  senderName={feed.sender.name}
                  receiverName={feed.receiver.name}
                />

                {isReceived ? (
                  <>
                    {feed.message ? (
                      <FeedMessageBubble message={feed.message} />
                    ) : null}
                    <span className="text-xs font-bold text-[#afafaf]">
                      {timeAgo}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-[#afafaf]">
                      {timeAgo}
                    </span>
                    {feed.message ? (
                      <FeedMessageBubble message={feed.message} />
                    ) : null}
                  </>
                )}

                {/* <p
                  className="truncate font-mono text-[10px] text-[#afafaf]"
                  title={feed._id}
                >
                  ID: {feed._id}
                </p> */}
              </div>
            </div>

            <PointBadge isReceived={isReceived} amount={feed.amount} size="sm" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 pl-14">
          <FeedLikeButton
            likes={feed.likes.count}
            likedByCurrentUser={feed.likes.likedByCurrentUser}
            onLike={onLike}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCommentOpen(true)}
          >
            <GoComment className="size-4 stroke-[0.5]" />
            {feed.comments.length}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primaryOutline"
            onClick={() => setIsDetailOpen(true)}
          >
            รายละเอียด
          </Button>
        </div>
      </li>

      <FeedDetailDialog
        feed={feed}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <FeedDialog
        isOpen={isCommentOpen}
        onOpenChange={setIsCommentOpen}
        isReceived={isReceived}
        amount={feed.amount}
        senderName={feed.sender.name}
        senderImage={feed.sender.image}
        receiverName={feed.receiver.name}
        receiverImage={feed.receiver.image}
        message={feed.message}
        likes={feed.likes.count}
        comments={feed.comments}
        createdAt={feed.createdAt}
        tags={feed.tags}
        onLike={onLike}
        transactionId={feed._id}
        likedByCurrentUser={feed.likes.likedByCurrentUser}
      />
    </>
  );
};

function FeedDetailDialog({
  feed,
  open,
  onOpenChange,
}: {
  feed: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tagLabel = feed.tags ? (tags[feed.tags] ?? feed.tags) : "-";
  const createdAt = format(new Date(feed.createdAt), "d MMM yyyy HH:mm", {
    locale: th,
  });
  const reviewedAt =
    feed.reviewedAt > 0
      ? format(new Date(feed.reviewedAt), "d MMM yyyy HH:mm", { locale: th })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>รายละเอียดธุรกรรม</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* <InfoRow
            label="รหัสธุรกรรม"
            value={
              <p className="break-all font-mono text-xs text-[#777]">{feed._id}</p>
            }
          /> */}

          <div className="grid gap-3 sm:grid-cols-2">
            <PartyCard
              label="ผู้ส่ง"
              name={feed.sender.name}
              id={feed.sender.employeeId}
              department={feed.sender.department}
              image={feed.sender.image}
            />
            <PartyCard
              label="ผู้รับ"
              name={feed.receiver.name}
              id={feed.receiver.employeeId}
              department={feed.receiver.department}
              image={feed.receiver.image}
              accent
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow
              label="จำนวนพอยต์"
              value={
                <span className="flex items-center gap-1 text-lg font-bold text-[#F7C100]">
                  <Image
                    src={CoinGiveIcon}
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden
                  />
                  {feed.amount}
                </span>
              }
            />
            <InfoRow
              label="สถานะ"
              value={
                <TransactionStatusBadge
                  status={
                    feed.status === "rejected"
                      ? "rejected"
                      : feed.status === "pending"
                        ? "pending"
                        : "completed"
                  }
                />
              }
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
              feed.message ? (
                <p className="whitespace-pre-wrap rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-3 text-sm leading-relaxed">
                  {feed.message}
                </p>
              ) : (
                "-"
              )
            }
          />

          {feed.rejectionReason ? (
            <InfoRow
              label="เหตุผลที่ปฏิเสธ"
              value={
                <p className="whitespace-pre-wrap rounded-md border-2 border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                  {feed.rejectionReason}
                </p>
              }
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const FeedDialog = ({
  isOpen,
  onOpenChange,
  isReceived,
  amount,
  senderName,
  senderImage,
  receiverName,
  receiverImage,
  message,
  likes,
  comments,
  createdAt,
  onLike,
  transactionId,
  likedByCurrentUser,
}: {
  isOpen: boolean;
  isReceived: boolean;
  amount: number;
  senderName: string;
  senderImage: string | null;
  receiverName: string;
  receiverImage: string | null;
  message: string;
  likes: number;
  comments: ApiOutputs["transaction"]["feeds"]["page"][0]["comments"];
  createdAt: number;
  tags?: string | null;
  onLike: () => void;
  onOpenChange: (open: boolean) => void;
  transactionId: Id<"transaction">;
  likedByCurrentUser: boolean;
}) => {
  const crpc = useCRPC();

  const { data: currentUser } = useSuspenseQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  const [comment, setComment] = useState("");

  const addComment = useMutation(crpc.transaction.comment.mutationOptions());

  const avatarName = isReceived ? senderName : receiverName;
  const avatarImage = isReceived ? senderImage : receiverImage;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-md border-2 border-[#e5e5e5] p-0 sm:max-w-md! sm:w-md! gap-0 shadow-none ring-0">
        <DialogHidden />

        <div className="flex min-w-0 items-start gap-3 overflow-hidden border-b-2 border-[#e5e5e5] px-4 py-6">
          <UserAvatar
            name={avatarName}
            src={avatarImage || undefined}
            className={getFeedAvatarClassName(
              isReceived ? "sender" : "receiver",
              "size-11",
              Boolean(avatarImage),
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden text-left">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <FeedHeadline
                  isReceived={isReceived}
                  senderName={senderName}
                  receiverName={receiverName}
                />
              </div>
              <PointBadge isReceived={isReceived} amount={amount} size="sm" />
            </div>

            {isReceived ? (
              <>
                {message ? <FeedMessageBubble message={message} /> : null}
                <span className="text-xs font-bold text-[#afafaf]">
                  {formatDistanceTh(createdAt)}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-[#afafaf]">
                  {formatDistanceTh(createdAt)}
                </span>
                {message ? <FeedMessageBubble message={message} /> : null}
              </>
            )}

            <p
              className="truncate font-mono text-[10px] text-[#afafaf]"
              title={transactionId}
            >
              ID: {transactionId}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <FeedLikeButton
                likes={likes}
                likedByCurrentUser={likedByCurrentUser}
                onLike={onLike}
              />
            </div>
          </div>
        </div>

        <div className="max-h-[280px] overflow-x-hidden overflow-y-auto bg-white px-4 py-4">
          {comments.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {comments.map((item) => (
                <li key={item._id} className="flex min-w-0 items-start gap-3">
                  <UserAvatar
                    name={item.author.name}
                    src={item.author.image || undefined}
                    className={{
                      container: "size-8 shrink-0",
                    }}
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <FeedCommentBubble
                      authorName={item.author.name}
                      content={item.content}
                    />
                    <p className="mt-2 text-xs font-bold text-[#afafaf]">
                      {formatDistanceTh(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-center gap-3 rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-6 text-center">
              <GoComment className="size-8 text-[#e5e5e5]" />
              <div className="grid gap-1">
                <h3 className="text-base font-bold text-[#4b4b4b]">
                  ยังไม่มีความคิดเห็น
                </h3>
                <p className="text-sm text-[#777]">
                  เริ่มแสดงความคิดเห็นเป็นคนแรก
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="overflow-hidden border-t-2 border-[#e5e5e5] bg-white p-3">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar
              name={currentUser.name ?? ""}
              className={{
                container: "size-9 shrink-0",
              }}
            />
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md rounded-tl-none border-2 border-[#e5e5e5] bg-[#fafafa] px-3 py-2">
              <textarea
                rows={1}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="เขียนความคิดเห็น..."
                className="field-sizing-content h-auto max-w-full min-w-0 w-full resize-none overflow-hidden bg-transparent text-sm leading-snug break-all text-[#4b4b4b] placeholder:text-[#afafaf] focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!comment.trim()) return;
                  addComment.mutate({ transactionId, content: comment });
                  setComment("");
                }}
                disabled={!comment.trim()}
                className={cn(
                  "shrink-0 transition-opacity",
                  comment.trim() ? "opacity-100" : "opacity-30",
                )}
              >
                <BsArrowUpCircleFill
                  className={cn(
                    "size-7",
                    comment.trim() ? "text-[#1cb0f6]" : "text-[#afafaf]",
                  )}
                />
              </button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

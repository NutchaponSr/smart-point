"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { enUS, th } from "date-fns/locale";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/convex/auth-client";
import {
  BsBoxArrowInRight,
  BsCheckCircle,
  BsChevronDown,
  BsGift,
  BsHeart,
  BsPersonPlusFill,
  BsPinAngleFill,
  BsSendFill,
  BsShieldCheck,
  BsShieldX,
  BsStars,
} from "react-icons/bs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRPC } from "@/lib/convex/crpc";
import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";

import NotFoundImage from "../../public/extra_character_e.svg";

type ActivityLogType =
  | "point_transfer_sent"
  | "point_transfer_approved"
  | "point_transfer_rejected"
  | "daily_login"
  | "first_login"
  | "login_streak"
  | "monthly_active"
  | "praise_streak"
  | "event_joined"
  | "event_completed"
  | "event_rejected"
  | "donation";

const logTypeIcon: Record<ActivityLogType, typeof BsSendFill> = {
  point_transfer_sent: BsSendFill,
  point_transfer_approved: BsShieldCheck,
  point_transfer_rejected: BsShieldX,
  daily_login: BsBoxArrowInRight,
  first_login: BsGift,
  login_streak: BsBoxArrowInRight,
  monthly_active: BsStars,
  praise_streak: BsStars,
  event_joined: BsPersonPlusFill,
  event_completed: BsStars,
  event_rejected: BsShieldX,
  donation: BsHeart,
};

const logTypeTone: Record<ActivityLogType, string> = {
  point_transfer_sent: "text-[#1cb0f6]",
  point_transfer_approved: "text-[#58cc02]",
  point_transfer_rejected: "text-[#ff4b4b]",
  daily_login: "text-[#f1c40f]",
  first_login: "text-[#f1c40f]",
  login_streak: "text-[#f1c40f]",
  monthly_active: "text-[#f1c40f]",
  praise_streak: "text-[#f1c40f]",
  event_joined: "text-[#1cb0f6]",
  event_completed: "text-[#58cc02]",
  event_rejected: "text-[#ff4b4b]",
  donation: "text-[#cc348d]",
};

const getDateFnsLocale = (locale: string) => (locale === "th" ? th : enUS);

const SEEN_STORAGE_PREFIX = "smart-point:feed-seen:";
const SEEN_LIMIT = 80;

type FeedSeen = {
  news: string[];
  logs: string[];
};

function seenStorageKey(userId: string) {
  return `${SEEN_STORAGE_PREFIX}${userId}`;
}

function readSeen(userId: string): FeedSeen | null {
  try {
    const raw = localStorage.getItem(seenStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FeedSeen>;
    if (!Array.isArray(parsed.news) || !Array.isArray(parsed.logs)) return null;
    return {
      news: parsed.news.filter((id) => typeof id === "string"),
      logs: parsed.logs.filter((id) => typeof id === "string"),
    };
  } catch {
    return null;
  }
}

function writeSeen(userId: string, seen: FeedSeen) {
  localStorage.setItem(
    seenStorageKey(userId),
    JSON.stringify({
      news: seen.news.slice(-SEEN_LIMIT),
      logs: seen.logs.slice(-SEEN_LIMIT),
    }),
  );
}

function unreadCount(ids: string[], seenIds: string[]) {
  const seen = new Set(seenIds);
  return ids.filter((id) => !seen.has(id)).length;
}

function UnreadBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={label}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff4b4b] px-1 text-[11px] font-bold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const tabTriggerClassName = cn(
  "min-h-11 flex-1 rounded-none border-0 bg-transparent px-3 py-2.5 text-sm font-bold",
  "text-muted-foreground shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#1cb0f6] after:opacity-0",
  "hover:bg-transparent hover:text-muted-foreground",
  "data-active:bg-transparent data-active:text-[#1cb0f6] data-active:after:opacity-100",
  "hover:data-active:text-[#1cb0f6]",
);

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex flex-col items-center justify-center gap-4 py-2">
      <Image src={NotFoundImage} alt="Not Found" width={80} height={80} />
      <div className="flex flex-col items-center justify-center">
        <h5 className="text-base font-medium">{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TabPanelFallback() {
  const t = useTranslations("news");
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      {t("loading")}
    </div>
  );
}

function NewsList({
  items,
  seenIds,
  onOpen,
}: {
  items: Array<{
    _id: string;
    title: Parameters<typeof pickLocalized>[0];
    summary: Parameters<typeof pickLocalized>[0];
    body: Parameters<typeof pickLocalized>[0];
    publishedAt: number | string | Date | null;
    isPinned: boolean;
  }>;
  seenIds: string[];
  onOpen: (id: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("news");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const seen = new Set(seenIds);

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const isExpanded = expandedId === item._id;
        const isUnseen = !seen.has(item._id);
        const title = pickLocalized(item.title, locale);
        const summary = pickLocalized(item.summary, locale);
        const body = pickLocalized(item.body, locale);
        const publishedLabel = item.publishedAt
          ? format(new Date(item.publishedAt), "d MMM yyyy", {
              locale: getDateFnsLocale(locale),
            })
          : null;

        return (
          <li
            key={item._id}
            className={cn(
              "overflow-hidden rounded-md border-2 border-border transition-colors",
              isExpanded && "border-pink/40 bg-pink/5",
            )}
          >
            <button
              type="button"
              onClick={() => {
                onOpen(item._id);
                setExpandedId(isExpanded ? null : item._id);
              }}
              className="flex w-full items-start p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isUnseen && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-[#ff4b4b]"
                          aria-hidden
                        />
                      )}
                      {item.isPinned && (
                        <BsPinAngleFill className="size-3 shrink-0 text-pink" />
                      )}
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug">
                        {title}
                      </h3>
                    </div>
                    {summary && !isExpanded && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {summary}
                      </p>
                    )}
                  </div>
                  <BsChevronDown
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </div>
                {publishedLabel && (
                  <time className="mt-1 block text-[11px] text-muted-foreground">
                    {publishedLabel}
                  </time>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-3 pb-3 pt-2">
                {summary && (
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {summary}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ACTIVITY_LOG_TYPES = new Set<ActivityLogType>([
  "point_transfer_sent",
  "point_transfer_approved",
  "point_transfer_rejected",
  "daily_login",
  "first_login",
  "login_streak",
  "monthly_active",
  "praise_streak",
  "event_joined",
  "event_completed",
  "event_rejected",
  "donation",
]);

function formatActivityLogMessage(
  item: {
    type: string;
    summary: string;
    amount: number | null;
    bahtAmount?: number | null;
    activityName: { th: string; en: string } | string | null;
    actor: { name: { th: string; en: string } | string } | null;
    subject: { name: { th: string; en: string } | string } | null;
    meta: Record<string, unknown> | null;
    viewerRole?: "actor" | "subject";
  },
  locale: string,
  t: ReturnType<typeof useTranslations<"activityLog">>,
): string {
  const type = item.type as ActivityLogType;
  if (!ACTIVITY_LOG_TYPES.has(type)) return item.summary;

  const nameFromMeta =
    typeof item.meta?.receiverName === "string" ? item.meta.receiverName : null;
  const name = pickLocalized(
    item.subject?.name ?? nameFromMeta ?? item.actor?.name ?? "",
    locale,
  );
  const actorName = pickLocalized(item.actor?.name ?? "", locale);
  const activityName = pickLocalized(item.activityName, locale);
  const amount = item.amount ?? "";
  const bahtAmount = item.bahtAmount ?? item.amount ?? "";

  if (type === "donation") {
    return item.viewerRole === "subject"
      ? t("types.donation_received", { amount, bahtAmount, name: actorName })
      : t("types.donation", { amount, bahtAmount, name });
  }

  if (type === "point_transfer_rejected") {
    return item.viewerRole === "actor"
      ? t("types.point_transfer_rejected_admin", { amount, name })
      : t("types.point_transfer_rejected", { amount, name });
  }

  if (type === "daily_login") {
    return t("types.daily_login", { amount: amount || 5 });
  }

  if (type === "first_login") {
    return t("types.first_login", { amount: amount || 5 });
  }

  if (type === "login_streak") {
    return t("types.login_streak", { amount: amount || 5 });
  }

  if (type === "monthly_active") {
    return t("types.monthly_active", { amount: amount || 5 });
  }

  if (type === "praise_streak") {
    return t("types.praise_streak", { amount: amount || 20 });
  }

  return t(`types.${type}`, { amount, name, activityName });
}

function ActivityLogList({
  items,
}: {
  items: Array<{
    _id: string;
    type: string;
    summary: string;
    amount: number | null;
    bahtAmount?: number | null;
    activityName: { th: string; en: string } | string | null;
    actor: { name: { th: string; en: string } | string } | null;
    subject: { name: { th: string; en: string } | string } | null;
    meta: Record<string, unknown> | null;
    viewerRole?: "actor" | "subject";
    createdAt: number | string | Date;
  }>;
}) {
  const locale = useLocale();
  const tLog = useTranslations("activityLog");

  if (items.length === 0) {
    return (
      <EmptyState
        title={tLog("empty.title")}
        description={tLog("empty.description")}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const Icon = logTypeIcon[item.type as ActivityLogType] ?? BsCheckCircle;
        const tone =
          logTypeTone[item.type as ActivityLogType] ?? "text-muted-foreground";
        const timeLabel = format(new Date(item.createdAt), "d MMM yyyy HH:mm", {
          locale: getDateFnsLocale(locale),
        });
        const message = formatActivityLogMessage(item, locale, tLog);

        return (
          <li
            key={item._id}
            className="flex items-start gap-3 rounded-md border-2 border-border p-3"
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f7f7f7]",
                tone,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{message}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <time>{timeLabel}</time>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NewsPanel() {
  const crpc = useCRPC();
  const t = useTranslations("news");
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const [tab, setTab] = useState("news");
  const [seen, setSeen] = useState<FeedSeen | null>(null);
  const seenRef = useRef<FeedSeen | null>(null);
  const bootstrappedUserId = useRef<string | null>(null);

  const { data: news } = useSuspenseQuery(
    crpc.news.getLatest.queryOptions({ limit: 5 }),
  );
  const { data: logs } = useSuspenseQuery(
    crpc.activityLog.getLatest.queryOptions({ limit: 10 }),
  );

  const newsIds = news.map((item) => item._id);
  const logIds = logs.map((item) => item._id);
  const newsKey = newsIds.join("\0");
  const logKey = logIds.join("\0");

  useEffect(() => {
    if (!userId || bootstrappedUserId.current === userId) return;
    bootstrappedUserId.current = userId;
    const stored = readSeen(userId) ?? { news: newsIds, logs: logIds };
    if (!readSeen(userId)) writeSeen(userId, stored);
    seenRef.current = stored;
    setSeen(stored);
  }, [userId, newsKey, logKey, newsIds, logIds]);

  useEffect(() => {
    if (tab !== "logs" || !userId) return;
    const current = seenRef.current;
    if (!current) return;
    const seenLogs = new Set(current.logs);
    const missing = logIds.filter((id) => !seenLogs.has(id));
    if (missing.length === 0) return;
    const next = {
      ...current,
      logs: [...current.logs, ...missing].slice(-SEEN_LIMIT),
    };
    seenRef.current = next;
    setSeen(next);
    writeSeen(userId, next);
  }, [tab, userId, logKey, logIds]);

  const markNewsOpened = (id: string) => {
    if (!userId) return;
    const current = seenRef.current ?? { news: [], logs: [] };
    if (current.news.includes(id)) return;
    const next = {
      ...current,
      news: [...current.news, id].slice(-SEEN_LIMIT),
    };
    seenRef.current = next;
    setSeen(next);
    writeSeen(userId, next);
  };

  const seenNews = seen?.news ?? newsIds;
  const seenLogs = seen?.logs ?? logIds;
  const newsUnread = unreadCount(newsIds, seenNews);
  const logUnread = unreadCount(logIds, seenLogs);

  return (
    <article className="flex flex-col gap-0 overflow-hidden rounded-md border-2 bg-background">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value === "string") setTab(value);
        }}
        className="gap-0"
      >
        <TabsList
          variant="line"
          className="h-auto w-full gap-0 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="news" className={tabTriggerClassName}>
            {t("tabs.news")}
            <UnreadBadge
              count={newsUnread}
              label={t("unread", { count: newsUnread })}
            />
          </TabsTrigger>
          <TabsTrigger value="logs" className={tabTriggerClassName}>
            {t("tabs.logs")}
            <UnreadBadge
              count={logUnread}
              label={t("unread", { count: logUnread })}
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="news"
          className="max-h-80 overflow-y-auto overscroll-contain p-4 pt-3"
        >
          <NewsList items={news} seenIds={seenNews} onOpen={markNewsOpened} />
        </TabsContent>
        <TabsContent
          value="logs"
          className="max-h-80 overflow-y-auto overscroll-contain p-4 pt-3"
        >
          <ActivityLogList items={logs} />
        </TabsContent>
      </Tabs>
    </article>
  );
}

export const News = () => {
  return (
    <Suspense
      fallback={
        <article className="flex flex-col gap-0 overflow-hidden rounded-md border-2 bg-background">
          <TabPanelFallback />
        </article>
      }
    >
      <NewsPanel />
    </Suspense>
  );
};

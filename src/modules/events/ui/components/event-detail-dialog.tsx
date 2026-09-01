"use client";

import RubyIcon from "../../../../../public/ruby.svg";

import { toast } from "sonner";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { BsCalendar2Fill, BsCheckCircleFill, BsPeopleFill } from "react-icons/bs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pickLocalized } from "@/lib/i18n/localized";
import { formatLocalizedDate } from "@/lib/format-thai-date";
import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  buRestrictedCategories,
  categories,
  statuses,
} from "@/modules/events/constants";
import { formatAllowedBuLabels } from "@/modules/events/utils/bu-labels";

type ActivityCategory = keyof typeof categories;
type ParticipationStatus = keyof typeof statuses;

export type EventDetail = {
  id?: string;
  _id?: string;
  name: Parameters<typeof pickLocalized>[0];
  description?: Parameters<typeof pickLocalized>[0];
  point: number;
  category: ActivityCategory;
  startDate: number | Date;
  endDate?: number | Date | null;
  maxParticipants?: number | null;
  joinedCount?: number | null;
  allowedDivisions?: (string | null)[] | null;
  allowedDepartments?: (string | null)[] | null;
  myStatus?: ParticipationStatus | null;
  myParticipation?: {
    status: string;
    pointAwarded?: number | null;
    evidenceFileName?: string | null;
  } | null;
};

const categoryBadgeClassName: Record<ActivityCategory, string> = {
  external: "bg-[#ddf4ff] text-[#1899d6]",
  internal: "bg-[#d7ffb8] text-[#58a700]",
  internal_bu: "bg-[#f3e0ff] text-[#a568cc]",
  specials_point: "bg-[#ffe8c2] text-[#cc7800]",
};

const statusBadgeClassName: Record<ParticipationStatus, string> = {
  registered: "bg-[#ddf4ff] text-[#1899d6]",
  attended: "bg-[#ffe8c2] text-[#cc7800]",
  rewarded: "bg-[#d7ffb8] text-[#58a700]",
};

function activityIdOf(event: EventDetail) {
  return String(event.id ?? event._id);
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-[#afafaf]">{label}</p>
      <div className="text-sm font-medium text-[#4b4b4b]">{value}</div>
    </div>
  );
}

interface Props {
  event: EventDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDialog({ event, open, onOpenChange }: Props) {
  const locale = useLocale();
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const join = useMutation(crpc.activity.join.mutationOptions());

  if (!event) return null;

  const name = pickLocalized(event.name, locale);
  const description = pickLocalized(event.description, locale);
  const joined = event.myStatus != null || event.myParticipation != null;
  const isFull =
    event.maxParticipants != null &&
    (event.joinedCount ?? 0) >= event.maxParticipants;
  const canJoin = !joined && !isFull;
  const participationStatus = (event.myParticipation?.status ??
    event.myStatus) as ParticipationStatus | null;
  const statusLabel =
    participationStatus && participationStatus in statuses
      ? statuses[participationStatus].th
      : participationStatus;
  const points = event.myParticipation?.pointAwarded ?? event.point;
  const showBu = buRestrictedCategories.includes(
    event.category as (typeof buRestrictedCategories)[number],
  );
  const dateLabel = `${formatLocalizedDate(event.startDate, locale)}${
    event.endDate
      ? ` – ${formatLocalizedDate(event.endDate, locale)}`
      : ""
  }`;
  const participantLabel =
    event.maxParticipants != null && event.joinedCount != null
      ? `${event.joinedCount} / ${event.maxParticipants}`
      : event.joinedCount != null
        ? `${event.joinedCount} คน (ไม่จำกัด)`
        : event.maxParticipants != null
          ? `จำกัด ${event.maxParticipants} คน`
          : "ไม่จำกัด";

  const onConfirmJoin = () => {
    join.mutate(
      { activityId: activityIdOf(event) },
      {
        onSuccess: () => {
          toast.success(`เข้าร่วม "${name}" เรียบร้อย`);
          queryClient.invalidateQueries({
            queryKey: crpc.activity.recommended.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: crpc.activity.list.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: crpc.activity.getMany.queryKey(),
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "เข้าร่วมกิจกรรมไม่สำเร็จ");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>รายละเอียดกิจกรรม</DialogTitle>
          <DialogDescription>
            {canJoin
              ? "ตรวจสอบรายละเอียดแล้วกดยืนยันเพื่อเข้าร่วม"
              : "ข้อมูลกิจกรรมทั้งหมด"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-bold",
                categoryBadgeClassName[event.category],
              )}
            >
              {categories[event.category].th}
            </span>
            {statusLabel && participationStatus ? (
              <span
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-bold",
                  statusBadgeClassName[participationStatus] ??
                    "bg-muted text-muted-foreground",
                )}
              >
                {statusLabel}
              </span>
            ) : null}
            <span className="flex items-center gap-1 rounded-md px-2 py-1.5 font-semibold text-[#cc348d]">
              <img
                src={RubyIcon.src}
                alt="คะแนนพิเศษ"
                className="size-5 fill-current"
              />
              {points}
            </span>
          </div>

          <div className="grid gap-1.5">
            <h3 className="text-lg font-bold break-all text-[#4b4b4b]">
              {name}
            </h3>
            {description ? (
              <p className="whitespace-pre-wrap break-all text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่มีคำอธิบาย</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow
              label="วันที่"
              value={
                <span className="inline-flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#ddf4ff] text-[#1899d6]">
                    <BsCalendar2Fill className="size-3.5" />
                  </span>
                  {dateLabel}
                </span>
              }
            />
            <InfoRow
              label="ผู้เข้าร่วม"
              value={
                <span className="inline-flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#d7ffb8] text-[#58a700]">
                    <BsPeopleFill className="size-3.5" />
                  </span>
                  {participantLabel}
                </span>
              }
            />
          </div>

          {event.maxParticipants != null && event.joinedCount != null ? (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#58cc02] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (event.joinedCount / event.maxParticipants) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
          ) : null}

          {showBu ? (
            <InfoRow
              label="BU / สังกัดที่เข้าร่วมได้"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {formatAllowedBuLabels(
                    event.allowedDivisions,
                    event.allowedDepartments,
                  ).map((label) => (
                    <span
                      key={label}
                      className="rounded-md bg-[#f3e0ff] px-2 py-1 text-xs font-semibold text-[#a568cc]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              }
            />
          ) : null}

          {event.myParticipation?.evidenceFileName ? (
            <InfoRow
              label="หลักฐาน"
              value={event.myParticipation.evidenceFileName}
            />
          ) : null}
        </div>

        <DialogFooter className="border-0 bg-transparent p-4 pt-2 sm:flex-col">
          {joined ? (
            <div className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#d7ffb8] text-base font-medium text-[#58a700]">
              <BsCheckCircleFill className="size-4" />
              {statusLabel ?? "เข้าร่วมแล้ว"}
            </div>
          ) : isFull ? (
            <Button type="button" variant="locked" className="w-full" disabled>
              เต็มแล้ว
            </Button>
          ) : (
            <div className="grid w-full gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full tracking-wide"
                disabled={join.isPending}
                onClick={onConfirmJoin}
              >
                {join.isPending ? "กำลังเข้าร่วม..." : "ยืนยันเข้าร่วม"}
              </Button>
              <Button
                type="button"
                variant="default"
                className="w-full tracking-wide"
                disabled={join.isPending}
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

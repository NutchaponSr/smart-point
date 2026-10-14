"use client";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

type Participant = ApiOutputs["activity"]["getOne"]["joinedEmployees"][0];
type ParticipantStatus = Participant["status"];

interface ColumnOptions {
  approvingIds: Set<string>;
  rejectingIds: Set<string>;
  onApprove: (participantId: string) => void;
  onReject: (participantId: string) => void;
  onOpenEvidence: (participant: Participant) => void;
}

const statusBadgeClassName: Record<ParticipantStatus, string> = {
  registered: "text-[#1899d6]",
  attended: "text-[#cc7800]",
  rewarded: "text-[#58a700]",
  cancelled: "text-muted-foreground",
};

function SelectAllCheckbox({
  table,
}: {
  table: {
    getIsAllPageRowsSelected: () => boolean;
    getIsSomePageRowsSelected: () => boolean;
    toggleAllPageRowsSelected: (value: boolean) => void;
  };
}) {
  const t = useTranslations("events.participants");
  return (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label={t("select-all")}
      onClick={(e) => e.stopPropagation()}
      className="size-5"
    />
  );
}

function SelectRowCheckbox({
  row,
}: {
  row: {
    getIsSelected: () => boolean;
    toggleSelected: (value: boolean) => void;
  };
}) {
  const t = useTranslations("events.participants");
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={t("select-row")}
      className="size-5"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export const columns = (options: ColumnOptions): ColumnDef<Participant>[] => {
  return [
    {
      id: "select",
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <SelectRowCheckbox row={row} />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: () => <ColumnLabel name="employee" />,
      cell: ({ row }) => <ParticipantNameCell participant={row.original} />,
    },
    {
      accessorKey: "status",
      header: () => <ColumnLabel name="status" />,
      cell: ({ row }) => <ParticipantStatusCell status={row.original.status} />,
    },
    {
      id: "evidence",
      header: () => <ColumnLabel name="evidence" />,
      cell: ({ row }) =>
        row.original.evidenceStorageId ? (
          <EvidenceButton onClick={() => options.onOpenEvidence(row.original)} />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
    {
      id: "review",
      header: () => <ColumnLabel name="review" />,
      cell: ({ row }) => (
        <ReviewActions
          canReview={
            row.original.status === "registered" ||
            row.original.status === "attended"
          }
          pendingApprove={options.approvingIds.has(row.original.participantId)}
          pendingReject={options.rejectingIds.has(row.original.participantId)}
          onApprove={() => options.onApprove(row.original.participantId)}
          onReject={() => options.onReject(row.original.participantId)}
        />
      ),
    },
  ];
};

function ColumnLabel({
  name,
}: {
  name: "employee" | "status" | "evidence" | "review";
}) {
  const t = useTranslations("events.participants.columns");
  return t(name);
}

function ParticipantStatusCell({ status }: { status: ParticipantStatus }) {
  const t = useTranslations("events.participants.status");
  return (
    <span className={`text-sm font-semibold ${statusBadgeClassName[status] ?? ""}`}>
      {t(status)}
    </span>
  );
}

function EvidenceButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("events.participants.columns");
  return (
    <Button type="button" size="sm" onClick={onClick}>
      {t("view-file")}
    </Button>
  );
}

function ReviewActions({
  canReview,
  pendingApprove,
  pendingReject,
  onApprove,
  onReject,
}: {
  canReview: boolean;
  pendingApprove: boolean;
  pendingReject: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("events.participants.columns");
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        title={t("approve-title")}
        disabled={!canReview || pendingApprove}
        onClick={onApprove}
      >
        {t("approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="danger"
        title={t("reject-title")}
        disabled={!canReview || pendingReject}
        onClick={onReject}
      >
        {t("reject")}
      </Button>
    </div>
  );
}

function ParticipantNameCell({ participant }: { participant: Participant }) {
  const locale = useLocale();
  const name = pickLocalized(participant.name, locale);
  const department = pickLocalized(participant.department, locale);

  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar
        name={name}
        className={{
          container: "size-8",
          fallback: "text-sm font-medium",
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{department}</span>
      </div>
    </div>
  );
}

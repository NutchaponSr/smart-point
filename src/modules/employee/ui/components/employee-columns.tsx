"use client";

import type { ApiOutputs } from "@convex/api";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EmployeeActions } from "@/modules/employee/ui/components/employee-actions";

type Employee = ApiOutputs["employee"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Employee>[] => {
  // Hook called from table host; cell renderers close over locale via component below.
  return [
    {
      accessorKey: "name",
      header: "พนักงาน",
      cell: ({ row }) => <EmployeeNameCell employee={row.original} />,
    },
    {
      accessorKey: "department",
      header: "ฝ่าย",
      cell: ({ row }) => <LocalizedCell value={row.original.department} />,
    },
    {
      accessorKey: "position",
      header: "ตำแหน่ง",
      cell: ({ row }) => <LocalizedCell value={row.original.position} />,
    },
    {
      accessorKey: "rank",
      header: "ระดับ",
      cell: ({ row }) => {
        const rank = row.original.rank;
        return <>{typeof rank === "string" ? rank : rank.th || rank.en}</>;
      },
    },
    {
      accessorKey: "division",
      header: "หน่วยงาน",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return <EmployeeActions employee={row.original} />;
      },
    },
  ];
};

function EmployeeNameCell({ employee }: { employee: Employee }) {
  const locale = useLocale();
  const name = pickLocalized(employee.name, locale);

  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar
        name={name}
        className={{
          container: "size-8",
          fallback: "text-sm",
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-[#4b4b4b]">{name}</span>
        <span className="text-xs font-medium text-[#777]">{employee.email}</span>
      </div>
    </div>
  );
}

function LocalizedCell({
  value,
}: {
  value: Employee["department"] | Employee["position"];
}) {
  const locale = useLocale();
  return <>{pickLocalized(value, locale)}</>;
}

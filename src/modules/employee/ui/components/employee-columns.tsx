import type { ApiOutputs } from "@convex/api";
import type { ColumnDef } from "@tanstack/react-table";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { EmployeeActions } from "@/modules/employee/ui/components/employee-actions";

type Employee = ApiOutputs["employee"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Employee>[] => {
  return [
    {
      accessorKey: "name",
      header: "พนักงาน",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2.5">
            <UserAvatar
              name={row.original.name}
              className={{
                container: "size-8",
                fallback: "text-sm",
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#4b4b4b]">
                {row.original.name}
              </span>
              <span className="text-xs font-medium text-[#777]">
                {row.original.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "ฝ่าย",
    },
    {
      accessorKey: "position",
      header: "ตำแหน่ง",
    },
    {
      accessorKey: "rank",
      header: "ระดับ",
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

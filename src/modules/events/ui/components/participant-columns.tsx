import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

type Participant = ApiOutputs["activity"]["getOne"]["participants"][0];

export const columns = (): ColumnDef<Participant>[] => {
  return [
    {
      id: "employeeName",
      accessorFn: (row) => row.employee?.name ?? "",
      filterFn: (row, columnId, filterValue) => {
        const query = String(filterValue ?? "").trim().toLowerCase();
        if (!query) return true;
        const name = String(row.getValue(columnId) ?? "").toLowerCase();
        const employeeId = row.original.employee?.employeeId?.toLowerCase() ?? "";
        return name.includes(query) || employeeId.includes(query);
      },
      header: "พนักงาน",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2.5">
            {row.original.employee && (
              <UserAvatar 
                name={row.original.employee.name} 
                className={{
                  container: "size-8 after:border-[1.5px]",
                  fallback: "text-sm font-medium",
                }}
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{row.original.employee?.name ?? "-"}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.employee?.department ?? "-"}
              </span>
            </div>
          </div>
        )
      }
    }
  ]
}
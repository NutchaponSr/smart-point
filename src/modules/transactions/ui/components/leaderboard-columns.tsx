import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";

type Leaderboard = ApiOutputs["leaderboard"]["getMany"]["page"][0];

export const columns = (): ColumnDef<Leaderboard>[] => {
  return [
    {
      id: "rank",
      header: "ลำดับ",
      cell: ({ row }) => {
        return <>{row.original.rank}</>
      },
    },
    {
      id: "employeeName",
      header: "ชื่อพนักงาน",
      cell: ({ row }) => {
        return <>{row.original.employeeName}</>
      },
    },
    {
      id: "points",
      header: "จำนวนพอยต์",
      cell: ({ row }) => {
        return <>{row.original.points}</>
      },
    },
  ]
}
"use client";

import Ruby from "../../../../../public/ruby.svg";

import { 
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useState } from "react";
import { ApiOutputs } from "@convex/api";
import { useRouter } from "next/navigation";
import { GoPersonFill } from "react-icons/go";
import { useDebounce } from "@uidotdev/usehooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHidden } from "@/components/ui/dialog";
import { FieldSet } from "@/components/fieldset";
import { SearchInput } from "@/components/search-input";

import { Selection } from "@/components/selection";
import { ExcelDropdown } from "@/components/excel-dropdown";

import { columns } from "@/modules/events/ui/components/participant-columns";

import { categories, hasActivityEnded } from "@/modules/events/constants";
import { joinEventSchema, JoinEventSchema } from "@/modules/events/schema";
import { useSearchEmployee } from "@/modules/wallets/stores/use-search-employee";
import { useParticipantExcel } from "@/modules/events/hooks/use-participant-excel";

interface Props {
  eventId: string;
}

export const JoinEventView = ({ eventId }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { query, setQuery } = useSearchEmployee();

  const debouncedQuery = useDebounce(query, 300);
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบผู้เข้าร่วม",
  });

  const { data: employees } = useQuery({
    enabled: debouncedQuery.trim().length > 0,
    ...crpc.employee.search.queryOptions({ query: debouncedQuery.trim() || "_", self: true })
  });

  const { data: activity } = useSuspenseQuery(crpc.activity.getOne.queryOptions({ activityId: eventId }));

  const bulkLeave = useMutation(crpc.activity.bulkLeave.mutationOptions());
  const join = useMutation(crpc.activity.join.mutationOptions());
  const approve = useMutation(crpc.activity.approve.mutationOptions());
  const bulkApprove = useMutation(crpc.activity.bulkApprove.mutationOptions());
  const reject = useMutation(crpc.activity.reject.mutationOptions());
  const bulkReject = useMutation(crpc.activity.bulkReject.mutationOptions());
  const form = useForm<JoinEventSchema>({
    resolver: zodResolver(joinEventSchema),
    defaultValues: {
      employee: {
        id: "",
        name: "",
        email: "",
        department: "",
      },
    },
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
  const [selectedEvidence, setSelectedEvidence] = useState<
    ApiOutputs["activity"]["getOne"]["joinedEmployees"][0] | null
  >(null);

  const {
    onImport,
    onExport,
  } = useParticipantExcel({ activityId: eventId, data: activity.joinedEmployees });

  const activityHasEnded = hasActivityEnded(activity.endDate);

  const approveSuccessMessage = () =>
    "อนุมัติสำเร็จ — บวกคะแนนพิเศษให้พนักงานแล้ว";

  const table = useReactTable({
    data: activity.joinedEmployees,
    columns: columns({
      approvingIds,
      rejectingIds,
      onOpenEvidence: (participant) => setSelectedEvidence(participant),
      onApprove: (participantId) => {
        setApprovingIds((prev) => new Set(prev).add(participantId));
        approve.mutate(
          { activityId: eventId, participantId },
          {
            onSuccess: (result) => {
              if (result.approved) {
                toast.success(approveSuccessMessage());
              } else {
                toast.error("ไม่สามารถอนุมัติรายการนี้ได้");
              }
              queryClient.invalidateQueries({
                queryKey: crpc.activity.getOne.queryKey({ activityId: eventId }),
              });
            },
            onError: () => {
              toast.error("อนุมัติไม่สำเร็จ");
            },
            onSettled: () => {
              setApprovingIds((prev) => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
              });
            },
          },
        );
      },
      onReject: (participantId) => {
        setRejectingIds((prev) => new Set(prev).add(participantId));
        reject.mutate(
          { activityId: eventId, participantId },
          {
            onSuccess: (result) => {
              if (result.rejected) {
                toast.success("ปฏิเสธหลักฐานแล้ว — พนักงานสามารถแนบใหม่ได้");
              } else {
                toast.error("ไม่สามารถปฏิเสธรายการนี้ได้");
              }
              queryClient.invalidateQueries({
                queryKey: crpc.activity.getOne.queryKey({ activityId: eventId }),
              });
            },
            onError: () => {
              toast.error("ปฏิเสธไม่สำเร็จ");
            },
            onSettled: () => {
              setRejectingIds((prev) => {
                const next = new Set(prev);
                next.delete(participantId);
                return next;
              });
            },
          },
        );
      },
    }),
    getRowId: (row) => row.employeeId,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const onSubmit = (data: JoinEventSchema) => {
    join.mutate(
      {
        activityId: eventId,
        employeeId: data.employee.id,
      },
      {
        onSuccess: () => {
          form.reset();
          setQuery("");
        },
      },
    );
  };

  const selectedEvidenceStorageId = selectedEvidence?.evidenceStorageId;
  const { data: evidenceUrl } = useQuery({
    ...crpc.upload.getFileUrl.queryOptions({
      storageId: selectedEvidenceStorageId ?? "pending",
    }),
    enabled: !!selectedEvidenceStorageId,
  });

  return (
    <>
      <ConfirmationDialog />
      <Dialog
        open={selectedEvidence != null}
        onOpenChange={(open) => {
          if (!open) setSelectedEvidence(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHidden />
          <div className="grid gap-3">
            <h3 className="text-base font-semibold">
              หลักฐาน: {selectedEvidence?.name}
            </h3>
            {selectedEvidence?.evidenceFileName ? (
              <p className="text-sm text-muted-foreground">
                ไฟล์: {selectedEvidence.evidenceFileName}
              </p>
            ) : null}
            {selectedEvidence?.evidenceType === "pdf" && evidenceUrl ? (
              <iframe
                src={evidenceUrl}
                className="h-[70vh] w-full rounded-xs border-2 border-border"
                title="evidence pdf"
              />
            ) : selectedEvidence?.evidenceType !== "pdf" && evidenceUrl ? (
              <img
                src={evidenceUrl}
                alt="evidence"
                className="max-h-[70vh] w-full rounded-xs border-2 border-border object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">กำลังโหลดไฟล์หลักฐาน...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <header className="flex h-[82px] flex-col justify-center gap-4 border-b-2 border-border p-4 md:p-8">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 hidden! text-2xl sm:block!">
            {activity.name}
          </h1>
          
          <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
            <Button type="button" onClick={() => router.push("/meta/events")}>
              ยกเลิก
            </Button>
          </div>
        </div>
      </header>
      <section className="lg:grid lg:grid-cols-[1fr_30vw]">
        <div>
          <section className="border-b-2 border-border bg-background">
            <header className="grid gap-4 p-3 not-first:border-t">
              <h1 className="text-lg font-normal leading-[1.2]">
                {activity.name}
              </h1>
            </header>
            <section className="grid grid-cols-[auto_1fr] gap-px border-t-2 border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,full)]">
            <div className="p-3 outline-2outline-offset-0 outline-border border-r-2">
              <div className="flex items-center gap-1 text-base font-medium text-[#cc348d]">
                <img src={Ruby.src} alt="คะแนนพิเศษ" className="size-6" />
                {activity.point}
              </div>
            </div>
              <div className="flex items-center justify-between w-full grow px-4 py-3 max-sm:col-span-full">
                <div className="flex items-center gap-1 grow">
                  <GoPersonFill className="size-4 stroke-[0.25]" />
                  <span className="text-sm font-normal">
                    {activity.maxParticipants ? `${activity.joinedCount} / ${activity.maxParticipants}` : "ไม่จำกัด"}
                  </span>
                </div>
                <u className="text-xs">{categories[activity.category]?.th}</u>
              </div>
            </section>
            <section className="border-t-2 border-border p-3">
              <p className="text-xs">
                {activity.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                เข้าร่วมแล้วได้คะแนนพิเศษ 5 แต้ม · แนบหลักฐานแล้วรอ admin อนุมัติ/ปฏิเสธ · อนุมัติจะบวกคะแนนพิเศษ
                {activityHasEnded ? " · กิจกรรมสิ้นสุดแล้ว" : null}
              </p>
            </section>
          </section>

          <table className="grid w-full border-spacing-0 gap-4 lg:table lg:overflow-hidden">
            <thead className="hidden lg:table-header-group">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="block rounded-xs lg:table-row">
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "px-4 py-3 text-left align-middle select-none first:w-[48px]! lg:first:border-r-2",
                        header.column.getCanSort() && "cursor-pointer",
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-2 text-base font-semibold">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          header.column.getIsSorted() === "asc" ? (
                            <ArrowUpIcon className="size-4" />
                          ) : (
                            <ArrowDownIcon className="size-4" />
                          )
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="contents lg:table-row-group lg:rounded-xs">
              {table.getRowModel().rows.length > 0 ? 
                table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="block rounded-xs border-b-2 border-border lg:table-row bg-background even:bg-muted">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="block p-4 text-left align-middle not-first:border-t-2 not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs lg:first:border-r-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr className="block rounded-xs border-b-2 border-border lg:table-row bg-background">
                  <td colSpan={table.getAllColumns().length} className="block p-4 text-left align-middle not-first:border-t not-first:border-border lg:table-cell lg:border-t-2 lg:border-border lg:[table_>_:last-child_>_tr:last-child_>_&:first-child]:rounded-bl-xs lg:[table_>_:last-child_>_tr:last-child_>_&:last-child]:rounded-br-xs"> 
                    Nothing yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <aside className="sticky top-0 hidden h-screen flex-col self-start overflow-y-auto bg-background lg:flex lg:border-l-2 lg:border-border">
          <div className="grid gap-4 p-4! md:p-6!">
            <div className="flex items-center gap-2">
              <SearchInput
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(value) => table.getColumn("name")?.setFilterValue(value)}
                placeholder="ค้นหาชื่อผู้เข้าร่วม"
              />
              <ExcelDropdown 
                onImport={onImport}
                onExport={onExport}
              />
            </div>
          </div>
          <div className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
            <Button 
              type="button" 
              onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
            >
              แก้ไขกิจกรรม
            </Button>
          </div>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <h2 className="text-xl leading-snug">
                เพิ่มผู้เข้าร่วม
              </h2>
              <Controller 
                control={form.control}
                name="employee"
                render={({ field }) => (
                  <FieldSet label="พนักงาน" errorMessage={form.formState.errors.employee?.id?.message}>
                    <Selection 
                      placeholder="ระบุพนักงาน"
                      selectedValue={field.value.id || undefined}
                      selectedLabel={field.value.name || undefined}
                      onClear={() => form.resetField("employee")}
                      options={employees?.map((employee) => ({
                        label: employee.name,
                        value: employee.id,
                        email: employee.email,
                        department: employee.department,
                      })) || []}
                      onSearch={async (value) => {
                        setQuery(value);
                        return [];
                      }}
                      onSelect={(option) => {
                        const employee = employees?.find((employee) => employee.id === option.value);
                        if (!employee) return;

                        field.onChange({
                          id: option.value,
                          name: option.label,
                          email: employee.email,
                          department: employee.department,
                        });
                      }}
                    />
                  </FieldSet>
                )}
              />
              <Button  
                type="submit"
                disabled={join.isPending}
              >
                บันทึกข้อมูล
              </Button>
            </form>
          </FormProvider>
          {(table.getIsSomePageRowsSelected() || table.getIsAllPageRowsSelected()) && (
            <div className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <h2 className="text-xl leading-snug">การจัดการผู้เข้าร่วม</h2>
              <Button
                type="button"
                disabled={bulkApprove.isPending}
                onClick={() => {
                  bulkApprove.mutate(
                    {
                      activityId: eventId,
                      participantIds: table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original.participantId),
                    },
                    {
                      onSuccess: (result) => {
                        toast.success(
                          `อนุมัติสำเร็จ ${result.approved} รายการ (ข้าม ${result.skipped}) — คะแนนพิเศษ`,
                        );
                        queryClient.invalidateQueries({
                          queryKey: crpc.activity.getOne.queryKey({
                            activityId: eventId,
                          }),
                        });
                      },
                    },
                  );
                }}
              >
                อนุมัติทั้งหมด
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={bulkReject.isPending}
                onClick={() => {
                  bulkReject.mutate(
                    {
                      activityId: eventId,
                      participantIds: table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original.participantId),
                    },
                    {
                      onSuccess: (result) => {
                        toast.success(
                          `ปฏิเสธสำเร็จ ${result.rejected} รายการ (ข้าม ${result.skipped})`,
                        );
                        queryClient.invalidateQueries({
                          queryKey: crpc.activity.getOne.queryKey({
                            activityId: eventId,
                          }),
                        });
                      },
                    },
                  );
                }}
              >
                ปฏิเสธทั้งหมด
              </Button>
              <h2 className="text-xl leading-snug text-destructive">โซนอันตราย</h2>
              <Button 
                className="bg-destructive" 
                type="button" 
                onClick={async () => {
                  const ok = await confirm();

                  if (ok) {
                    bulkLeave.mutate({
                      activityId: eventId,
                      participantIds: table.getSelectedRowModel().rows.map((row) => row.original.participantId),
                    });
                  }
                }}
              >
                ลบ
              </Button>
            </div>
          )}
        </aside>
      </section>
    </>
  );
};
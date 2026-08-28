"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";

import { FormHeader } from "@/components/form-header";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";
import { EmployeePreview } from "@/modules/employee/ui/components/employee-preview";
import {
  K2WorkflowViewers,
  type K2ViewerEntry,
} from "@/modules/employee/ui/components/k2-workflow-viewers";

import { employeeSchema, EmployeeSchema } from "@/modules/employee/schema";

export const NewEmployeeView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.employee.create.mutationOptions());
  const upsertK2 = useMutation(crpc.k2Workflow.upsertViewers.mutationOptions());
  const [k2Viewers, setK2Viewers] = useState<K2ViewerEntry[]>([]);

  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: "",
      name: { th: "", en: "" },
      email: "",
      department: { th: "", en: "" },
      position: { th: "", en: "" },
      rank: "",
      division: "",
      citizenId: "",
    },
  });

  const onSubmit = (data: EmployeeSchema) => {
    create.mutate(
      {
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        rank: data.rank,
        division: data.division,
        password: data.citizenId,
      },
      {
        onSuccess: () => {
          const saveK2 =
            k2Viewers.length > 0
              ? upsertK2.mutateAsync({
                  employeeId: data.employeeId,
                  viewers: k2Viewers.map((v) => v.businessCode),
                })
              : Promise.resolve();

          void saveK2
            .then(() => {
              form.reset();
              setK2Viewers([]);
            })
            .catch((error: unknown) => {
              toast.error(
                error instanceof Error
                  ? `สร้างพนักงานแล้ว แต่บันทึกสิทธิ์ K2 ไม่สำเร็จ: ${error.message}`
                  : "สร้างพนักงานแล้ว แต่บันทึกสิทธิ์ K2 ไม่สำเร็จ",
              );
            });
        },
      },
    );
  };

  const watchedEmployeeId = form.watch("employeeId");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader title="เพิ่มพนักงาน" backHref="/meta/employees" />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EmployeeForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto border-l-2 border-[#e5e5e5] bg-[#f7f7f7] p-6 lg:flex">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <h2 className="text-xl font-extrabold text-[#4b4b4b]">
                  Preview
                </h2>
                <p className="text-sm font-medium text-[#777]">
                  ดูตัวอย่างบัตรพนักงานแบบเรียลไทม์
                </p>
              </div>
            </div>

            {/* <EmployeePreview /> */}

            <section className="grid gap-3 pt-4">
              <div className="grid gap-1">
                <h3 className="text-base font-extrabold text-[#4b4b4b]">
                  สิทธิ์ดูธุรกรรม (K2)
                </h3>
                <p className="text-xs font-medium text-[#777]">
                  กำหนดผู้ที่ดูธุรกรรมของพนักงานคนนี้ได้
                </p>
              </div>
              <K2WorkflowViewers
                mode="create"
                businessEmployeeId={watchedEmployeeId}
                value={k2Viewers}
                onChange={setK2Viewers}
              />
            </section>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};

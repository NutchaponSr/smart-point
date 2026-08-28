"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import { FormHeader } from "@/components/form-header";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";
import { K2WorkflowViewers } from "@/modules/employee/ui/components/k2-workflow-viewers";

import {
  employeeEditSchema,
  type EmployeeEditSchema,
} from "@/modules/employee/schema";

import type { Id } from "../../../../../convex/functions/_generated/dataModel";

interface Props {
  employeeId: Id<"employee">;
}

function toLocalizedDefaults(
  value: { th: string; en: string } | string,
): { th: string; en: string } {
  if (typeof value === "string") {
    const t = value.trim();
    return { th: t, en: t };
  }
  return { th: value.th, en: value.en };
}

export const EmployeeInfoView = ({ employeeId }: Props) => {
  const locale = useLocale();
  const crpc = useCRPC();
  const router = useRouter();

  const { data: employee } = useSuspenseQuery(
    crpc.employee.getOne.queryOptions({ employeeId }),
  );

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบพนักงาน",
  });

  const form = useForm<EmployeeEditSchema>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      name: toLocalizedDefaults(employee.name),
      employeeId: employee.employeeId,
      department: toLocalizedDefaults(employee.department),
      position: toLocalizedDefaults(employee.position),
      rank:
        typeof employee.rank === "string"
          ? employee.rank
          : employee.rank.th || employee.rank.en,
      division: employee.division,
      newPassword: "",
    },
  });

  const remove = useMutation(crpc.employee.remove.mutationOptions());
  const update = useMutation(crpc.employee.update.mutationOptions());

  const onSubmit = (data: EmployeeEditSchema) => {
    const newPassword = data.newPassword.trim();
    update.mutate(
      {
        employeeId: employeeId as Id<"employee">,
        businessEmployeeId: data.employeeId,
        name: data.name,
        department: data.department,
        position: data.position,
        rank: data.rank,
        division: data.division,
        ...(newPassword.length > 0 ? { newPassword } : {}),
      },
      {
        onSuccess: () => {
          form.reset({
            ...data,
            newPassword: "",
          });
          toast.success("บันทึกข้อมูลพนักงานสำเร็จ");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
          );
        },
      },
    );
  };

  const handleRemove = async () => {
    const ok = await confirm();

    if (ok) {
      remove.mutate(
        { employeeId: employeeId as Id<"employee"> },
        {
          onSuccess: () => {
            router.push(`/meta/employees`);
          },
        },
      );
    }
  };

  return (
    <FormProvider {...form}>
      <ConfirmationDialog />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader
          title={pickLocalized(employee.name, locale)}
          backHref="/meta/employees"
        />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EmployeeForm isEdit />
          </div>
          <aside className="sticky top-0 h-screen border-t-2 flex-col gap-4 self-start overflow-y-auto bg-background md:flex md:border-l-2 md:border-t-0 md:border-border">
            <section className="grid gap-4 p-4! md:p-6!">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl leading-snug">ข้อมูลที่เกี่ยวข้อง</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-base font-semibold">
                      สิทธิ์ดูธุรกรรม (K2)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ผู้ที่ดูธุรกรรมของพนักงานคนนี้ได้
                    </p>
                  </div>
                  <K2WorkflowViewers
                    mode="edit"
                    businessEmployeeId={employee.employeeId}
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={() =>
                    router.push(`/meta/transactions?by=${employee._id}`)
                  }
                >
                  ธุรกรรม
                </Button>
              </div>
            </section>

            <section className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl leading-snug text-destructive">
                  พื้นที่อันตราย
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  variant="danger"
                  size="lg"
                  type="button"
                  onClick={handleRemove}
                >
                  ลบบัญชีผู้ใช้งาน
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};

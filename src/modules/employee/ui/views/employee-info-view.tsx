"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import { FormHeader } from "@/components/form-header";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";

import { employeeSchema, EmployeeSchema } from "@/modules/employee/schema";

import { Id } from "../../../../../convex/functions/_generated/dataModel";

interface Props {
  employeeId: Id<"employee">;
}

export const EmployeeInfoView = ({ employeeId }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const { data: employee } = useSuspenseQuery(crpc.employee.getOne.queryOptions({ employeeId }));
  
  
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบพนักงาน",
  });
  
  const form = useForm<Omit<EmployeeSchema, "email" | "citizenId" | "employeeId">>({
    resolver: zodResolver(employeeSchema.omit({ email: true, citizenId: true, employeeId: true })),
    defaultValues: {
      name: employee.name,
      department: employee.department,
      position: employee.position,
      rank: employee.rank,
      division: employee.division,
    },
  });
  
  const remove = useMutation(crpc.employee.remove.mutationOptions());
  const update = useMutation(crpc.employee.update.mutationOptions());

  const onSubmit = (data: Omit<EmployeeSchema, "email" | "citizenId" | "employeeId">) => {
    update.mutate({ employeeId: employeeId as Id<"employee">, ...data }, {
      onSuccess: () => {
        form.reset();
        toast.success("บันทึกข้อมูลพนักงานสำเร็จ");
      }
    });
  };  

  const handleRemove = async () => {
    const ok = await confirm();

    if (ok) {
      remove.mutate({ employeeId: employeeId as Id<"employee"> }, {
        onSuccess: () => {
          router.push(`/dashboard/employee`);
        }
      });
    }
  };

  return (
    <FormProvider {...form}>
      <ConfirmationDialog />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader title={employee.name} backHref="/meta/employees" />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EmployeeForm isEdit />
          </div>
          <aside className="sticky top-0 h-screen border-t-2 flex-col gap-4 self-start overflow-y-auto bg-background md:flex md:border-l-2 md:border-t-0 md:border-border">
            <section className="grid gap-4 p-4! md:p-6!">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl leading-snug">
                  ข้อมูลที่เกี่ยวข้อง
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  type="button"
                  size="lg"
                  onClick={() => router.push(`/meta/transactions?by=${employee._id}`)}
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
                <Button variant="danger" size="lg" type="button" onClick={handleRemove}>
                  ลบบัญชีผู้ใช้งาน
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
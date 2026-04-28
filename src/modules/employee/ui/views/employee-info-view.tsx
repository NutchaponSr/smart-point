"use client";

import Link from "next/link";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";

import { employeeSchema, EmployeeSchema } from "@/modules/employee/schema";

interface Props {
  employeeId: string;
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
    update.mutate({ employeeId, ...data }, {
      onSuccess: () => {
        form.reset();
        toast.success("บันทึกข้อมูลพนักงานสำเร็จ");
      }
    });
  };  

  const handleRemove = async () => {
    const ok = await confirm();

    if (ok) {
      remove.mutate({ employeeId }, {
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
        <header className="flex flex-col gap-4 border-b-2 border-border justify-center p-4 md:p-8 h-[82px]">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 text-2xl hidden! sm:block!">{employee.name}</h1>
            <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
              <Link href={`/dashboard/employee`}>
                <Button variant="elevated" type="button">
                  ย้อนกลับ
                </Button>
              </Link>
              <Button variant="elevated" className="bg-pink" type="submit">
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EmployeeForm isEdit />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto bg-background lg:flex lg:border-l-2 lg:border-border">
            <section className="grid gap-4 p-4! md:p-6!">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl leading-snug">
                  ข้อมูลที่เกี่ยวข้อง
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  variant="elevated" 
                  className="bg-pink" 
                  type="button"
                >
                  ธุรกรรม
                </Button>
                <Button variant="elevated" className="bg-pink" type="button">
                  ประวัติการแลก
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
                <Button variant="elevated" className="bg-destructive" type="button" onClick={handleRemove}>
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
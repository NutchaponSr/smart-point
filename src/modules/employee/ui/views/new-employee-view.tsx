"use client";

import Link from "next/link";

import { Geist_Mono } from "next/font/google";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";

import { employeeSchema, EmployeeSchema } from "@/modules/employee/schema";

const font = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const NewEmployeeView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.employee.create.mutationOptions());

  const form = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: "",
      name: "",
      email: "",
      department: "",
      position: "",
      rank: "",
      division: "",
      citizenId: "",
    },
  });
  const previewData = form.watch();

  const onSubmit = (data: EmployeeSchema) => {
    create.mutate({
      employeeId: data.employeeId,
      name: data.name,
      email: data.email,
      department: data.department,
      position: data.position,
      rank: data.rank,
      division: data.division,
      password: data.citizenId,
    }, {
      onSuccess: () => {
        form.reset();
      }
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <header className="flex flex-col gap-4 border-b-2 border-border justify-center p-4 md:p-8 h-[82px]">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 text-2xl hidden! sm:block!">เพิ่มพนักงาน</h1>
            <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
              <Link href={`/dashboard/employee`}>
                <Button variant="elevated" type="button">
                  ยกเลิก
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
            <EmployeeForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto bg-background p-6 lg:flex lg:border-l-2 lg:border-border">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl leading-snug">
                Preview
              </h2>
            </div>

            <div className="h-[350px] overflow-auto rounded-xs bg-[#f4f4f0] p-4 font-mono text-sm text-muted-foreground border-2 border-border">
              <pre className={font.className}>
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
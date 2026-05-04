"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { FormHeader } from "@/components/form-header";

import { EmployeeForm } from "@/modules/employee/ui/components/employee-form";
import { EmployeePreview } from "@/modules/employee/ui/components/employee-preview";

import { employeeSchema, EmployeeSchema } from "@/modules/employee/schema";

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
        <FormHeader title="เพิ่มพนักงาน" />
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

            <EmployeePreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
"use client";

import Link from "next/link";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { EventForm } from "@/modules/events/ui/components/event-form";
import { EventBuSelector } from "@/modules/events/ui/components/event-bu-selector";
import { EventPreview } from "@/modules/events/ui/components/event-preview";

import { eventSchema, EventSchema } from "@/modules/events/schema";

export const NewEventView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.activity.create.mutationOptions());

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: { th: "", en: "" },
      description: { th: "", en: "" },
      point: 0,
      category: "specials_point",
      startDate: new Date().getTime(),
      endDate: new Date().getTime(),
      maxParticipants: 0,
      allowedDivisions: [],
      allowedDepartments: [],
    },
  });

  const onSubmit = (data: EventSchema) => {
    create.mutate({
      name: data.name,
      description: data.description,
      point: data.point,
      category: data.category,
      startDate: data.startDate,
      endDate: data.endDate,
      maxParticipants: data.maxParticipants,
      allowedDivisions: data.allowedDivisions,
      allowedDepartments: data.allowedDepartments,
    }, {
      onSuccess: () => {
        form.reset();
      }
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <header className="flex flex-col gap-4 border-b-2 border-border justify-center p-4 md:p-8 h-[82px]">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 text-2xl hidden! sm:block!">เพิ่มกิจกรรม</h1>
            <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
              <Link href={`/meta/events`}>
                <Button type="button">
                  ยกเลิก
                </Button>
              </Link>
              <Button variant="secondary" type="submit">
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </header>
        <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,30vw)]">
          <div>
            <EventForm />
            <EventBuSelector />
          </div>
          <aside className="sticky top-0 hidden h-screen min-w-0 flex-col gap-4 self-start overflow-y-auto border-l-2 border-[#e5e5e5] bg-[#f7f7f7] p-6 lg:flex">
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
            <EventPreview />
          </aside>
        </section>
      </form>
    </FormProvider>
  )
}
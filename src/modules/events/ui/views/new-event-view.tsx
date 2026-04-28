"use client";

import Link from "next/link";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { EventForm } from "@/modules/events/ui/components/event-form";
import { EventPreview } from "@/modules/events/ui/components/event-preview";

import { eventSchema, EventSchema } from "@/modules/events/schema";

export const NewEventView = () => {
  const crpc = useCRPC();

  const create = useMutation(crpc.activity.create.mutationOptions());

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      point: 0,
      category: "internal",
      startDate: new Date().getTime(),
      endDate: new Date().getTime(),
      maxParticipants: 0,
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
              <Link href={`/dashboard/events`}>
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
        <section className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EventForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto bg-background p-6 lg:flex lg:border-l-2 lg:border-border">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl leading-snug">
                Preview
              </h2>
            </div>
            <EventPreview />
          </aside>
        </section>
      </form>
    </FormProvider>
  )
}
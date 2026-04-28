"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import { EventForm } from "@/modules/events/ui/components/event-form";
import { EventPreview } from "@/modules/events/ui/components/event-preview";

import { eventSchema, EventSchema } from "@/modules/events/schema";

interface Props {
  eventId: string;
}

export const EditEventView = ({ eventId }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const update = useMutation(crpc.activity.update.mutationOptions());
  const remove = useMutation(crpc.activity.remove.mutationOptions());

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบกิจกรรม",
  });

  const { data: activity } = useSuspenseQuery(crpc.activity.getOne.queryOptions({ activityId: eventId }));

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: activity.name,
      description: activity?.description ?? "",
      point: activity?.point,
      category: activity.category,
      startDate: activity?.startDate,
      endDate: activity?.endDate ?? 0,
      maxParticipants: activity?.maxParticipants ?? 0,
    },
  });

  const onSubmit = (data: EventSchema) => {
    update.mutate(
      {
        activityId: eventId,
        name: data.name,
        description: data.description,
        point: data.point,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants,
      },
      {
        onSuccess: () => {
          form.reset(data);
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ConfirmationDialog />
        <header className="flex h-[82px] flex-col justify-center gap-4 border-b-2 border-border p-4 md:p-8">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h1 className="line-clamp-2 hidden! text-2xl sm:block!">
              {activity.name}
            </h1>
            <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
              <Link href="/dashboard/events">
                <Button variant="elevated" type="button">
                  ยกเลิก
                </Button>
              </Link>
              <Button
                variant="elevated"
                className="bg-pink"
                type="submit"
                disabled={update.isPending}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EventForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col self-start overflow-y-auto bg-background lg:flex lg:border-l-2 lg:border-border">
            <div className="grid gap-4 p-4! md:p-6!">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl leading-snug">
                  ภาพรวม
                </h2>
              </div>
              <EventPreview />
            </div>
            <div className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <Button 
                variant="elevated" 
                className="bg-pink" 
                type="button" 
                onClick={() => router.push(`/dashboard/events/${eventId}/join`)}
              >
                ผู้เข้าร่วม
              </Button>
            </div>
            <div className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <h2 className="text-xl leading-snug text-destructive">
                โซนอันตราย
              </h2>
              <Button 
                variant="elevated" 
                className="bg-destructive" 
                type="button" 
                onClick={async () => {
                  const ok = await confirm();

                  if (ok) {
                    remove.mutate({ 
                      activityId: eventId 
                    }, {
                      onSuccess: () => {
                        router.push("/dashboard/events");
                      }
                    });
                  }
                }}
              >
                ลบ
              </Button>
            </div>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
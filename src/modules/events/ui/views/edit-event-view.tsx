"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { isLocalizedString, pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import { FormHeader } from "@/components/form-header";

import { EventForm } from "@/modules/events/ui/components/event-form";
import { EventBuSelector } from "@/modules/events/ui/components/event-bu-selector";
import { EventPreview } from "@/modules/events/ui/components/event-preview";

import { eventSchema, EventSchema } from "@/modules/events/schema";

interface Props {
  eventId: string;
}

export const EditEventView = ({ eventId }: Props) => {
  const locale = useLocale();
  const crpc = useCRPC();
  const router = useRouter();

  const update = useMutation(crpc.activity.update.mutationOptions());
  const remove = useMutation(crpc.activity.remove.mutationOptions());

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบกิจกรรม",
  });

  const { data: activity } = useSuspenseQuery(crpc.activity.getOne.queryOptions({ activityId: eventId }));
  const hasEnded =
    activity.endDate != null && new Date(activity.endDate).getTime() < Date.now();
  const canDelete = activity.joinedCount <= 0 || hasEnded;

  const name = isLocalizedString(activity.name)
    ? activity.name
    : { th: String(activity.name ?? ""), en: String(activity.name ?? "") };
  const description = isLocalizedString(activity.description)
    ? activity.description
    : {
        th: String(activity.description ?? ""),
        en: String(activity.description ?? ""),
      };

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name,
      description,
      point: activity?.point,
      category: activity.category,
      startDate: activity?.startDate,
      endDate: activity?.endDate ?? 0,
      maxParticipants: activity?.maxParticipants ?? 0,
      allowedDivisions: (activity?.allowedDivisions ?? []).filter(
        (d): d is string => d != null,
      ),
      allowedDepartments: (activity?.allowedDepartments ?? []).filter(
        (d): d is string => d != null,
      ),
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
        allowedDivisions: data.allowedDivisions,
        allowedDepartments: data.allowedDepartments,
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
        <FormHeader
          title={pickLocalized(activity.name, locale)}
          backHref="/meta/events"
        />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <EventForm />
            <EventBuSelector />
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
                type="button" 
                size="lg"
                onClick={() => router.push(`/meta/events/${eventId}/join`)}
              >
                ผู้เข้าร่วม
              </Button>
            </div>
            <div className="grid gap-4 p-4! md:p-6! border-t-2 border-border">
              <h2 className="text-xl leading-snug text-destructive">
                โซนอันตราย
              </h2>
              <Button
                type="button"
                variant="danger"
                size="lg"
                disabled={!canDelete || remove.isPending}
                title={
                  canDelete
                    ? undefined
                    : "มีพนักงานเข้าร่วมอยู่ — ลบได้หลังกิจกรรมสิ้นสุด"
                }
                onClick={async () => {
                  if (!canDelete) return;

                  const ok = await confirm();

                  if (ok) {
                    remove.mutate(
                      { activityId: eventId },
                      {
                        onSuccess: () => {
                          router.push("/dashboard/events");
                        },
                      },
                    );
                  }
                }}
              >
                ลบ
              </Button>
              {!canDelete ? (
                <p className="text-sm text-muted-foreground">
                  มีพนักงานเข้าร่วมอยู่ — ลบได้หลังกิจกรรมสิ้นสุด
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
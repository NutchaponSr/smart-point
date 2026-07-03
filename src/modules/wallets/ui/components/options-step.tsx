import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"
import { ApiOutputs } from "@convex/api";
import type { LucideIcon } from "lucide-react";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { SendTransactionSchema } from "../../schema";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pointHeroVariants } from "./point-hero";
import { RiCopperCoinFill } from "react-icons/ri";
import ElementEditable from "@/components/element-editable";
import { tags as smartTagLabels } from "@/modules/transactions/constants";

type TimelinePartyRow = {
  step: number;
  title: string;
  Icon: LucideIcon;
  name: string;
  email: string;
  department: string;
  image: string | null | undefined;
};

interface Props {
  user: ApiOutputs["user"]["getCurrentUser"];
}

export const OptionsStep = ({ user }: Props) => {
  const { watch, control } = useFormContext<SendTransactionSchema>();

  const employee = watch("employee");
  const tagId = watch("tags");

  const { field: messageField, fieldState: messageFieldState } = useController({ control, name: "message" });

  const timelineRows = useMemo<TimelinePartyRow[]>(
    () => [
      {
        step: 1,
        title: "ผู้ส่ง",
        Icon: ArrowUpRightIcon,
        name: user.name,
        email: user.email ?? "",
        department: user.department,
        image: user.image,
      },
      {
        step: 2,
        title: "ผู้รับ",
        Icon: ArrowDownLeftIcon,
        name: employee?.name ?? "",
        email: employee?.email ?? "",
        department: employee?.department ?? "",
        image: null,
      },
    ],
    [user.name, user.email, user.department, user.image, employee?.name, employee?.email, employee?.department]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className={cn(pointHeroVariants({ variant: "blueTint" }))}>
        <CardContent className="px-6 pb-2.5">
          <Timeline defaultValue={2} className="w-full max-w-md">
            {timelineRows.map(({ step, title, Icon, name, email, department, image }) => (
              <TimelineItem key={step} step={step}>
                <TimelineHeader>
                  <TimelineTitle>{title}</TimelineTitle>
                </TimelineHeader>
                <TimelineIndicator className="bg-primary/10 group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7">
                  <Icon className="size-4" />
                </TimelineIndicator>
                <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                <TimelineContent>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={name}
                      src={image ?? undefined}
                      className={{
                        container: "size-5 after:border-[1.25px]",
                        fallback: "text-xs font-medium",
                      }}
                    />
                    <p className="text-sm leading-5 tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">{name}</p>
                  </div>
                  <div>
                    <p className="text-xs leading-4 tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">
                      {email} · {department}
                    </p>
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
        <CardFooter className="py-2 bg-purple">
          <div className="flex flex-row items-center justify-between w-full">
            <h2 className="text-xl font-bold grow">จำนวน:</h2>
            <div className="flex items-center gap-1.5 text-base">
              <RiCopperCoinFill className="size-5" />
              {watch("amount")}
            </div>
          </div>
        </CardFooter>
      </Card>

      {tagId && (
        <div className="rounded-xs border-2 border-border bg-background px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground font-medium leading-none mb-1">SMART Culture</p>
          <p className="text-base font-medium leading-snug">
            {smartTagLabels[tagId] ?? tagId}
          </p>
        </div>
      )}

      <ElementEditable 
        value={messageField.value ?? ""}
        placeholder="กรุณาระบุข้อความอธิบาย"
        onChange={messageField.onChange}
      />
      <small className="text-destructive">{messageFieldState.error?.message}</small>
    </div>
  );
};
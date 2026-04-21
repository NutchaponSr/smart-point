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
import { BsBasket2Fill } from "react-icons/bs";
import { FaEllipsisH, FaUtensils } from "react-icons/fa";
import ElementEditable from "@/components/element-editable";
import { cva } from "class-variance-authority";
import { tags } from "../../constants";

type TimelinePartyRow = {
  step: number;
  title: string;
  Icon: LucideIcon;
  name: string;
  email: string;
  department: string;
  image: string | null | undefined;
};

export const iconTagVariants = cva("size-7 flex items-center justify-center shrink-0 rounded-full border-[1.5px]", {
  variants: {
    variant: {
      default: "bg-purple",
      green: "bg-green",
      orange: "bg-orange",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface Props {
  user: ApiOutputs["user"]["getCurrentUser"];
}

export const OptionsStep = ({ user }: Props) => {
  const { watch, control } = useFormContext<SendTransactionSchema>();

  const employee = watch("employee");

  const { field: messageField, fieldState: messageFieldState } = useController({ control, name: "message" });
  const { field: tagsField, fieldState: tagsFieldState } = useController({ control, name: "tags" });

  const selectedTags = tagsField.value ?? [];

  const toggleTag = (tagId: string) => {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    tagsField.onChange(next);
  };

  const timelineRows = useMemo<TimelinePartyRow[]>(
    () => [
      {
        step: 1,
        title: "ผู้ส่ง",
        Icon: ArrowUpRightIcon,
        name: user.name,
        email: user.email,
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

      <fieldset className="flex flex-col border-none gap-2">
        <legend
          id="category-tags-legend"
          className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-medium [&_a]:font-normal"
        >
          เลือกหมวดหมู่
        </legend>

        <div
          role="group"
          aria-labelledby="category-tags-legend"
          className="grid md:auto-cols-fr gap-4 sm:grid-cols-2 md:grid-flow-rowt"
        >
          {tags.map((tag, index) => {
            const checked = selectedTags.includes(tag.name);
            return (
              <label
                key={index}
                className={cn(
                  "relative cursor-pointer text-current font-[inherit] text-base leading-snug no-underline flex gap-3 rounded-xs px-4 py-3 text-left transition-all flex-row items-center bg-background border-2 border-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px]",
                  checked && "border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[4px] -translate-y-[4px]"
                )}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={() => toggleTag(tag.name)}
                  onBlur={tagsField.onBlur}
                />
                <div className={cn(iconTagVariants({ variant: tag.color }), "text-primary")}>
                  {tag.code}
                </div>
                <span className="text-[1rem] leading-[1.3] font-normal text-ellipsis overflow-hidden whitespace-nowrap">
                  {tag.name}
                </span>
              </label>
            );
          })}
        </div>

        <small className="text-destructive">{tagsFieldState.error?.message}</small>
      </fieldset>

      <ElementEditable 
        value={messageField.value ?? ""}
        placeholder="กรุณาระบุข้อความอธิบาย"
        onChange={messageField.onChange}
      />
      <small className="text-destructive">{messageFieldState.error?.message}</small>
    </div>
  );
};
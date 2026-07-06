import { Fragment, useMemo } from "react";
import { ChevronDownIcon } from "lucide-react";

import { ApiOutputs } from "@convex/api";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { RiCopperCoinFill } from "react-icons/ri";
import { useController, useFormContext } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Selection } from "@/components/selection";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { SendTransactionSchema } from "@/modules/wallets/schema";
import { useSearchEmployee } from "@/modules/wallets/stores/use-search-employee";
import {
  isSmartCultureTagId,
  smartCulturePillars,
  smartCultureTagOptions,
  tags as tagLabels,
  type SmartCulturePillarKey,
} from "@/modules/transactions/constants";
import { cn } from "@/lib/utils";

const sendAmountOptions = [5, 10] as const;

interface Props {
  points: number;
  user: ApiOutputs["user"]["getCurrentUser"] | null;
}

function splitTagId(
  value: string,
): { pillar: SmartCulturePillarKey; points: number } | null {
  if (!isSmartCultureTagId(value)) return null;
  const [a, b] = value.split("_");
  if (!a || !b) return null;
  return { pillar: a as SmartCulturePillarKey, points: Number(b) as 5 | 15 | 20 };
}

export const SendStep = ({ points, user }: Props) => {
  const crpc = useCRPC();
  const { query, setQuery } = useSearchEmployee();

  const debouncedQuery = useDebounce(query, 300);

  const { data: employees } = useQuery({
    enabled: debouncedQuery.trim().length > 0,
    ...crpc.employee.search.queryOptions({ query: debouncedQuery.trim() || "_" }),
  });

  const { control, formState } = useFormContext<SendTransactionSchema>();
  const { errors } = formState;

  const { field: employeeField, fieldState: employeeState } = useController({
    control,
    name: "employee",
  });
  const { field: amountField, fieldState: amountState } = useController({
    control,
    name: "amount",
  });
  const { field: tagsField, fieldState: tagsState } = useController({
    control,
    name: "tags",
  });

  const tagId = tagsField.value ?? "";

  const levelSummary = useMemo(() => {
    const s = tagId ? splitTagId(tagId) : null;
    if (!s) return null;
    const p = smartCulturePillars.find((x) => x.key === s.pillar);
    const L = p?.levels.find((l) => l.points === s.points);
    if (!p || !L) return null;
    return { pillar: p, level: L };
  }, [tagId]);

  const formBlockKey = isSmartCultureTagId(tagId)
    ? `${tagId}-${amountField.value}`
    : `amount-${amountField.value}`;

  const employeeValue = employeeField.value ?? {
    id: "",
    name: "",
    email: "",
    department: "",
  };

  const employeeErrorMessage =
    employeeState.error?.message ?? errors.employee?.id?.message;

  return (
    <div className="grid gap-4">
      <h1 className="uppercase font-medium text-sm leading-none tracking-wide">จาก:</h1>
      <div className="p-4 border-2 border-border rounded-xs bg-background min-w-0">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar
            name={user?.name ?? ""}
            className={{
              container: "size-9 shrink-0 after:border-[1.5px]",
              fallback: "text-base font-medium",
            }}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <p className="truncate text-sm font-medium leading-5 tracking-wide">
              {user?.name ?? "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground leading-4 tracking-wide">
              {[user?.email, user?.department].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <RiCopperCoinFill className="size-9" />
            <h2 className="text-3xl font-bold tracking-wide">{points}</h2>
          </div>
        </div>
      </div>

      <h1 className="uppercase font-medium text-sm leading-none tracking-wide">กรุณาระบุ: ชื่อเพื่อนพนักงานที่คุณต้องการชื่นชม</h1>
      <fieldset className="flex flex-col border-none gap-2">
        <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
          <Label htmlFor="employeeId" className="">
            พนักงาน
          </Label>
        </legend>
        <Selection
          placeholder="ระบุพนักงาน (ชื่อหรือรหัสพนักงาน)"
          selectedValue={employeeValue.id || undefined}
          selectedLabel={employeeValue.name || undefined}
          onClear={() => {
            employeeField.onChange({
              id: "",
              name: "",
              email: "",
              department: "",
            });
          }}
          options={
            employees?.map((employee) => ({
              label: employee.name,
              value: employee.employeeId,
              email: employee.email,
              department: employee.department,
            })) || []
          }
          onSearch={async (value) => {
            setQuery(value);
            return [];
          }}
          onSelect={(option) => {
            const employee = employees?.find(
              (e) => e.employeeId === option.value,
            );
            if (!employee) return;

            employeeField.onChange({
              id: option.value,
              name: option.label,
              email: employee.email,
              department: employee.department,
            });
          }}
        />
        <small className="text-destructive">{employeeErrorMessage}</small>
      </fieldset>

      <div className="grid gap-4" key={formBlockKey}>
        <fieldset className="flex flex-col border-none gap-2">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <Label>คะแนนที่ต้องการมอบให้เพื่อน</Label>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {sendAmountOptions.map((value) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-xs border-2 px-4 py-3 text-base font-medium transition-colors",
                  amountField.value === value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/40",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <RiCopperCoinFill className="size-5 shrink-0" />
                  {value} แต้ม
                </span>
                <span className="relative inline-flex shrink-0 items-center justify-center">
                  <input
                    type="radio"
                    name="send-amount"
                    value={value}
                    className="peer size-[calc(1lh+0.125rem)] shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-border bg-background checked:bg-pink"
                    checked={amountField.value === value}
                    onChange={() => amountField.onChange(value)}
                  />
                  <span className="pointer-events-none absolute hidden size-[0.65rem] rounded-full bg-black peer-checked:block" />
                </span>
              </label>
            ))}
          </div>
          <small className="text-destructive">{amountState.error?.message}</small>
        </fieldset>

        {/* <fieldset className="flex flex-col border-none gap-2">
          <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
            <Label>แท็ก SMART Culture</Label>
            <span className="text-xs font-normal text-muted-foreground">(ไม่บังคับ)</span>
          </legend>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-between min-h-10 px-4 text-sm font-[inherit] border-2"
              >
                <span
                  className={cn(
                    "truncate text-left text-base",
                    !isSmartCultureTagId(tagId) && "text-muted-foreground",
                  )}
                >
                  {isSmartCultureTagId(tagId) ? tagLabels[tagId] : "เลือกแท็ก SMART Culture"}
                </span>
                <ChevronDownIcon className="size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) max-h-[min(24rem,70vh)] overflow-y-auto">
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={isSmartCultureTagId(tagId) ? tagId : ""}
                  onValueChange={(id) => {
                    tagsField.onChange(id);
                  }}
                >
                  <DropdownMenuRadioItem value="" className="h-10">
                    ไม่ระบุ
                  </DropdownMenuRadioItem>
                  {smartCultureTagOptions.map((opt, i) => {
                    const showHeader =
                      i === 0 ||
                      opt.pillarKey !== smartCultureTagOptions[i - 1]!.pillarKey;
                    return (
                      <Fragment key={opt.id}>
                        {showHeader && (
                          <DropdownMenuLabel className="pt-1.5 px-4 first:pt-0">
                            <span className="font-mono mr-1.5 text-foreground">
                              {opt.pillarKey}
                            </span>
                            {opt.pillarNameTh}
                          </DropdownMenuLabel>
                        )}
                        <DropdownMenuRadioItem value={opt.id} className="items-start h-auto">
                          <span className="flex flex-col gap-0.5 py-0.5 min-w-0 w-full text-left">
                            <span className="flex min-w-0 w-full max-w-full flex-nowrap items-center gap-1.5 text-sm">
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {opt.title}
                              </span>
                              <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm">
                                <RiCopperCoinFill className="size-3 shrink-0" />
                                {opt.points}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground font-normal leading-snug line-clamp-2">
                              {opt.description}
                            </span>
                          </span>
                        </DropdownMenuRadioItem>
                      </Fragment>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <small className="text-destructive">{tagsState.error?.message}</small>
        </fieldset> */}

        {isSmartCultureTagId(tagId) && levelSummary && (
          <div
            className="rounded-xs border-2 border-border p-3 bg-background text-sm space-y-1.5"
            key={`summary-${formBlockKey}`}
          >
            <p className="font-bold leading-snug">{levelSummary.pillar.nameTh}</p>
            <p className="font-medium text-foreground/90">
              {levelSummary.level.title}{" "}
              <span className="text-muted-foreground">({levelSummary.level.points} แต้ม)</span>
            </p>
            <p className="text-muted-foreground leading-relaxed text-xs">
              {levelSummary.level.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

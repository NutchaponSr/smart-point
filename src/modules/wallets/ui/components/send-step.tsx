import { useMemo } from "react";
import Image from "next/image";

import { ApiOutputs } from "@convex/api";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { useController, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Selection } from "@/components/selection";
import ElementEditable from "@/components/element-editable";

import { SendTransactionSchema } from "@/modules/wallets/schema";
import { SendPointHelpPopover } from "@/modules/wallets/ui/components/send-point-help-popover";
import { useSearchEmployee } from "@/modules/wallets/stores/use-search-employee";
import {
  isSmartCultureTagId,
  smartCulturePillars,
  type SmartCulturePillarKey,
} from "@/modules/transactions/constants";

import CoinGivingIcon from "../../../../../public/coin-give.svg";
const sendAmountOptions = [5, 10, 20] as const;

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

export const SendStep = ({ points }: Props) => {
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
  const { field: tagsField } = useController({
    control,
    name: "tags",
  });
  const { field: messageField, fieldState: messageState } = useController({
    control,
    name: "message",
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

  const messageErrorMessage =
    messageState.error?.message ?? errors.message?.message;

  return (
    <div className="grid gap-4">
      <section className="grid gap-1.5">
        <h3 className="text-sm font-bold text-[#4b4b4b]">
          เลือกพนักงาน
        </h3>
        <div
          className={cn(
            "[&_[class*='rounded-xs']]:rounded-xl",
            "[&_[class*='border-border']]:border-[#e5e5e5]",
            "[&_[class*='min-h-10']]:min-h-10",
            "[&_input]:text-sm [&_input]:text-[#4b4b4b]",
            "[&_span]:text-sm",
            "focus-within:[&_[class*='border-border']]:border-[#84d8ff]",
            "focus-within:[&_[class*='bg-background']]:bg-[#ddf4ff]",
          )}
        >
          <Selection
            placeholder="ค้นหาชื่อหรือรหัสพนักงาน"
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
        </div>
        {employeeErrorMessage && (
          <p className="text-xs font-medium text-[#ea2b2b]">{employeeErrorMessage}</p>
        )}
      </section>

      <section className="grid gap-1.5">
        <h3 className="text-sm font-bold text-[#4b4b4b]">
          ข้อความชื่นชม
        </h3>
        <ElementEditable
          value={messageField.value ?? ""}
          placeholder="บอกเล่าสิ่งที่คุณชื่นชม..."
          onChange={messageField.onChange}
          onBlur={messageField.onBlur}
          className={{
            container: cn(
              "min-h-0 rounded-md border-2 bg-white p-2",
              messageErrorMessage
                ? "border-[#ea2b2b] bg-[#fff5f5]"
                : "border-[#e5e5e5] focus-within:border-[#84d8ff] focus-within:bg-[#ddf4ff]",
            ),
            input: "min-h-12 text-sm text-[#4b4b4b]",
            placeholder: "top-3 left-3",
          }}
        />
        {messageErrorMessage && (
          <p className="text-xs font-medium text-[#ea2b2b]">{messageErrorMessage}</p>
        )}
      </section>

      <div className="grid gap-1.5" key={formBlockKey}>
        <section className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#4b4b4b]">
              คะแนนที่มอบให้
            </h3>
            <SendPointHelpPopover />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {sendAmountOptions.map((value) => {
              const isSelected = amountField.value === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => amountField.onChange(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border-2 px-3 py-2.5 font-medium transition-colors",
                    isSelected
                      ? "border-[#84d8ff] bg-[#ddf4ff] text-[#4b4b4b]"
                      : "border-[#e5e5e5] bg-white text-[#4b4b4b] hover:bg-[#f7f7f7]",
                  )}
                >
                  <Image src={CoinGivingIcon} alt="" width={20} height={20} className="shrink-0" />                  
                  <span className="text-base text-[#f1c40f]">{value}</span>
                </button>
              );
            })}
          </div>

          {amountState.error?.message && (
            <p className="text-xs font-medium text-[#ea2b2b]">{amountState.error.message}</p>
          )}
        </section>

        {isSmartCultureTagId(tagId) && levelSummary && (
          <div
            className="space-y-0.5 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-3 text-xs"
            key={`summary-${formBlockKey}`}
          >
            <p className="font-bold text-[#4b4b4b]">{levelSummary.pillar.nameTh}</p>
            <p className="text-[#4b4b4b]/90">
              {levelSummary.level.title}{" "}
              <span className="text-[#afafaf]">({levelSummary.level.points} แต้ม)</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

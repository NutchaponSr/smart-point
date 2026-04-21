import CurrencyInput from "react-currency-input-field";

import { ApiOutputs } from "@convex/api";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { RiCopperCoinFill } from "react-icons/ri";
import { useController, useFormContext } from "react-hook-form";

import { useCRPC } from "@/lib/convex/crpc";

import { Label } from "@/components/ui/label";

import { Selection } from "@/components/selection";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { SendTransactionSchema } from "@/modules/wallets/schema";

import { useSearchEmployee } from "@/modules/wallets/stores/use-search-employee";

interface Props {
  points: number;
  user: ApiOutputs["user"]["getCurrentUser"];
}

export const SendStep = ({ points, user }: Props) => {
  const crpc = useCRPC();
  const { query, setQuery } = useSearchEmployee();

  const debouncedQuery = useDebounce(query, 300);

  const { data: employees } = useQuery({
    enabled: debouncedQuery.trim().length > 0,
    ...crpc.employee.search.queryOptions({ query: debouncedQuery.trim() || "_" })
  });

  const { 
    control,
    formState: { errors },
  } = useFormContext<SendTransactionSchema>();

  const { 
    field: employeeField, 
    fieldState: employeeState 
  } = useController({ control, name: "employee" });
  
  const { 
    field: amountField, 
    fieldState: amountState 
  } = useController({ control, name: "amount" });

  const employeeErrorMessage =
    employeeState.error?.message ??
    errors.employee?.id?.message;

  return (
    <div className="grid gap-4">
      <h1 className="uppercase font-medium text-sm leading-none tracking-wide">จาก:</h1>
      <div className="p-4 border-2 border-border rounded-xs bg-background">
        <div className="flex items-center gap-2.5">
          <UserAvatar 
            name={user.name}
            src={user.image || undefined}
            className={{
              container: "size-9 after:border-[1.5px]",
              fallback: "text-base font-medium",
            }}
          />
          <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis grow">
            <p className="text-sm font-medium leading-5 tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">{user.name}</p>
            <p className="text-xs text-muted-foreground leading-4 tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">
              {user.email} · {user.department}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <RiCopperCoinFill className="size-9" />
            <h2 className="text-3xl font-bold tracking-wide">{points}</h2>
          </div>
        </div>
      </div>


      <h1 className="uppercase font-medium text-sm leading-none tracking-wide">โอนไปยัง:</h1>
      <fieldset className="flex flex-col border-none gap-2">
        <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
          <Label htmlFor="employeeId" className="">พนักงาน</Label>
        </legend>
        <Selection 
          placeholder="ระบุพนักงาน"
          selectedValue={employeeField.value.id || undefined}
          selectedLabel={employeeField.value.name || undefined}
          onClear={() => {
            employeeField.onChange({
              id: "",
              name: "",
              email: "",
              department: "",
            });
          }}
          options={employees?.map((employee) => ({
            label: employee.name,
            value: employee.employeeId,
            email: employee.email,
            department: employee.department,
          })) || []}
          onSearch={async (value) => {
            setQuery(value);
            return [];
          }}
          onSelect={(option) => {
            const employee = employees?.find((employee) => employee.employeeId === option.value);
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

      <fieldset className="flex flex-col border-none gap-2">
        <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
          <Label htmlFor="employeeId" className="">จำนวน</Label>
        </legend>
        <CurrencyInput
          id="amount"
          name="amount"
          allowNegativeValue={false}
          placeholder="ระบุจำนวน"
          decimalScale={2}
          value={
            typeof amountField.value === "number" &&
            !Number.isNaN(amountField.value) &&
            amountField.value !== 0
              ? amountField.value
              : ""
          }
          onValueChange={(value) => {
            const n = value === undefined || value === "" ? 0 : Number(value);
            amountField.onChange(Number.isNaN(n) ? 0 : n);
          }}
          onBlur={amountField.onBlur}
          className="font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-xs block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-pink focus:border-pink focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3"
        />
        <small className="text-destructive">{amountState.error?.message}</small>
      </fieldset>
    </div>
  );
};
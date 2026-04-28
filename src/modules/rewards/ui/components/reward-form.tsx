import CurrencyInput from "react-currency-input-field";
import { Controller, type RefCallBack, useFormContext } from "react-hook-form";
import { FieldSet } from "@/components/fieldset";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { RewardFormInput } from "@/modules/rewards/schema";

/** react-currency-input-field ใช้ onValueChange ไม่ใช่ onChange ของ RHF — ห้าม spread `field` ทั้งก้อน */
function intFromCurrencyValue(raw: string | undefined) {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : Math.trunc(n);
}

const currencyIntClassName =
  "font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-xs block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-pink focus:border-pink focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3";

export const RewardForm = () => {
  const { control } = useFormContext<RewardFormInput>();

  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">รางวัล</h2>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FieldSet label="ชื่อ" errorMessage={fieldState.error?.message}>
              <Input {...field} />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <FieldSet label="คำอธิบาย" errorMessage={fieldState.error?.message}>
              <Textarea {...field} value={field.value ?? ""} />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="pointCost"
          render={({ field, fieldState }) => (
            <FieldSet
              label="จำนวนพอยต์"
              errorMessage={fieldState.error?.message}
            >
              <CurrencyInput
                name={field.name}
                onBlur={field.onBlur}
                ref={field.ref as RefCallBack}
                value={
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value)
                }
                onValueChange={(v) => field.onChange(intFromCurrencyValue(v))}
                min={0}
                allowNegativeValue={false}
                decimalScale={0}
                intlConfig={{ locale: "th-TH" }}
                className={currencyIntClassName}
              />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="stock"
          render={({ field, fieldState }) => (
            <FieldSet
              label="จำนวนคงเหลือ"
              errorMessage={fieldState.error?.message}
            >
              <CurrencyInput
                name={field.name}
                onBlur={field.onBlur}
                ref={field.ref as RefCallBack}
                value={
                  field.value === undefined || field.value === null
                    ? ""
                    : String(field.value)
                }
                onValueChange={(v) => field.onChange(intFromCurrencyValue(v))}
                min={-1}
                allowNegativeValue
                decimalScale={0}
                intlConfig={{ locale: "th-TH" }}
                className={currencyIntClassName}
              />
              <small className="text-muted-foreground text-sm">
                -1 = ไม่จำกัดจำนวนคงเหลือ (มิฉะนั้นกรอกจำนวนเต็ม ≥ 1)
              </small>
            </FieldSet>
          )}
        />
      </section>
      <section className="grid gap-4 p-4! md:p-8! border-t-2 border-border">
        <h2 className="text-xl leading-snug">รูปภาพ (ตัวเลือก)</h2>
        <Controller
          control={control}
          name="image"
          render={({ field, fieldState }) => (
            <FieldSet errorMessage={fieldState.error?.message}>
              <ImageUpload
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FieldSet>
          )}
        />
      </section>
      <section className="grid gap-4 p-4! md:p-8! border-t-2 border-border">
        <h2 className="text-xl leading-snug">จำกัดต่อชิ้น</h2>
        <Controller
          control={control}
          name="onePerOrder"
          render={({ field, fieldState }) => (
            <FieldSet errorMessage={fieldState.error?.message}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={(value) => field.onChange(!!value)}
                />
                <span className="text-base">แลกรางวัลได้เพียง 1 ครั้งต่อคำสั่งซื้อ</span>
              </div>
            </FieldSet>
          )}
        />
      </section>
      <section className="grid gap-4 p-4! md:p-8! border-t-2 border-border">
        <h2 className="text-xl leading-snug">จำกัดการใช้งาน</h2>
        <Controller
          control={control}
          name="isActive"
          render={({ field, fieldState }) => (
            <FieldSet errorMessage={fieldState.error?.message}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={(value) => field.onChange(!!value)}
                />
                <span className="text-base">แสดงผลบนหน้ารางวัล</span>
              </div>
            </FieldSet>
          )}
        />
      </section>
    </>
  );
};

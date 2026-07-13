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
  "font-[inherit] min-h-10 px-4 text-sm leading-snug border-2 border-border rounded-md block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-[#49c0f8] focus:border-[#49c0f8] focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-3";

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t-2 border-border p-4 first:border-t-0 md:p-8">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-[#84d8ff] bg-[#ddf4ff] text-sm font-extrabold text-[#1cb0f6]">
          {step}
        </span>
        <div className="grid gap-0.5">
          <h2 className="text-xl font-extrabold leading-snug text-[#4b4b4b]">
            {title}
          </h2>
          <p className="text-sm font-medium text-[#777]">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 bg-background p-4 md:p-5">{children}</div>
    </section>
  );
}

export const RewardForm = () => {
  const { control } = useFormContext<RewardFormInput>();

  return (
    <>
      <FormSection
        step="1"
        title="รางวัล"
        description="ข้อมูลพื้นฐานที่แสดงบนหน้ารางวัล"
      >
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
              <small className="text-sm font-medium text-[#777]">
                -1 = ไม่จำกัดจำนวนคงเหลือ (มิฉะนั้นกรอกจำนวนเต็ม ≥ 1)
              </small>
            </FieldSet>
          )}
        />
      </FormSection>

      <FormSection
        step="2"
        title="รูปภาพ"
        description="รูปปกของรางวัล (ตัวเลือก)"
      >
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
      </FormSection>

      <FormSection
        step="3"
        title="การตั้งค่า"
        description="จำกัดการแลกและสถานะการแสดงผล"
      >
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
                <span className="text-base font-medium text-[#4b4b4b]">
                  แลกรางวัลได้เพียง 1 ครั้งต่อคำสั่งซื้อ
                </span>
              </div>
            </FieldSet>
          )}
        />
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
                <span className="text-base font-medium text-[#4b4b4b]">
                  แสดงผลบนหน้ารางวัล
                </span>
              </div>
            </FieldSet>
          )}
        />
      </FormSection>
    </>
  );
};

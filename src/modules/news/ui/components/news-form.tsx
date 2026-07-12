import { Controller, useFormContext } from "react-hook-form";

import { FieldSet } from "@/components/fieldset";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { NewsFormInput } from "@/modules/news/schema";

export const NewsForm = () => {
  const { control } = useFormContext<NewsFormInput>();

  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">ข้อมูลข่าวสาร</h2>
        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <FieldSet label="หัวข้อ" errorMessage={fieldState.error?.message}>
              <Input {...field} placeholder="หัวข้อข่าวสาร" />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="summary"
          render={({ field, fieldState }) => (
            <FieldSet
              label="สรุปย่อ"
              errorMessage={fieldState.error?.message}
            >
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="ข้อความสั้นๆ สำหรับแสดงในรายการ"
                rows={2}
              />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="body"
          render={({ field, fieldState }) => (
            <FieldSet label="เนื้อหา" errorMessage={fieldState.error?.message}>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="รายละเอียดข่าวสาร"
                rows={8}
              />
            </FieldSet>
          )}
        />
      </section>

      <section className="grid gap-4 border-t-2 border-border p-4! md:p-8!">
        <h2 className="text-xl leading-snug">การเผยแพร่</h2>
        <Controller
          control={control}
          name="isPublished"
          render={({ field, fieldState }) => (
            <FieldSet errorMessage={fieldState.error?.message}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={(value) => field.onChange(!!value)}
                />
                <span className="text-base">เผยแพร่ข่าวสาร</span>
              </div>
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="isPinned"
          render={({ field, fieldState }) => (
            <FieldSet errorMessage={fieldState.error?.message}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={(value) => field.onChange(!!value)}
                />
                <span className="text-base">ปักหมุดข่าวสำคัญ</span>
              </div>
            </FieldSet>
          )}
        />
      </section>
    </>
  );
};

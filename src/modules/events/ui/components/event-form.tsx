import { Controller, useFormContext } from "react-hook-form";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { FieldSet } from "@/components/fieldset";
import { PriceInput } from "@/components/price-input";
import { DatePicker } from "@/components/date-picker";
import { formatThaiDate } from "@/lib/format-thai-date";

import { EventSchema } from "../../schema";
import { ChevronDownIcon } from "lucide-react";
import { categories } from "../../constants";

export const EventForm = () => {
  const { control } = useFormContext<EventSchema>();

  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">
          กิจกรรม
        </h2>
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
            <FieldSet label="นิยาม" errorMessage={fieldState.error?.message}>
              <Textarea {...field} />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="point"
          render={({ field, fieldState }) => (
            <FieldSet label="จำนวนพอยต์" errorMessage={fieldState.error?.message}>
              <PriceInput
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                id="point"
                name="point"
                placeholder="กรอกจำนวนพอยต์"
                decimalScale={0}
                className="h-12 text-base"
              />
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field, fieldState }) => (
            <FieldSet label="ประเภท" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="lg" className="w-full justify-between">
                    <span>{categories[field.value]?.th}</span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                      {Object.entries(categories).map(([key, category]) => (
                        <DropdownMenuRadioItem key={key} value={key}>
                          {category.th}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </FieldSet>
          )}
        />
        <div className="flex items-center gap-4 w-full">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FieldSet label="วันที่เริ่มต้น" errorMessage={fieldState.error?.message}>
                <DatePicker output="number" value={field.value} onSelect={field.onChange}>
                  <Button size="lg" type="button" className="justify-start px-4">
                    {formatThaiDate(field.value)}
                  </Button>
                </DatePicker>
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="endDate"
            render={({ field, fieldState }) => (
              <FieldSet label="วันที่สิ้นสุด" errorMessage={fieldState.error?.message}>
                <DatePicker output="number" value={field.value} onSelect={field.onChange}>
                  <Button size="lg" type="button" className="justify-start px-4">
                    {formatThaiDate(field.value)}
                  </Button>
                </DatePicker>
              </FieldSet>
            )}
          />
        </div>
        <Controller
          control={control}
          name="maxParticipants"
          render={({ field, fieldState }) => (
            <FieldSet label="จำนวนผู้เข้าร่วมสูงสุด" errorMessage={fieldState.error?.message}>
              <PriceInput
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                id="maxParticipants"
                name="maxParticipants"
                placeholder="กรอกจำนวนผู้เข้าร่วม"
                decimalScale={0}
                className="h-12 text-base"
              />
            </FieldSet>
          )}
        />
      </section>
    </>
  );
};
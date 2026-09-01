import Image from "next/image";

import { ChevronDownIcon } from "lucide-react";
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
import { categories } from "../../constants";

export const EventForm = () => {
  const { control } = useFormContext<EventSchema>();

  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">
          กิจกรรม
        </h2>
        <div className="grid gap-4 md:grid-cols-2 md:*:min-w-0">
          <Controller
            control={control}
            name="name.th"
            render={({ field, fieldState }) => (
              <FieldSet
                label="ชื่อ"
                image={<Image src="/TH.svg" alt="Name" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} />
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="name.en"
            render={({ field, fieldState }) => (
              <FieldSet
                label="Name"
                image={<Image src="/US.svg" alt="Name" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} />
              </FieldSet>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:*:min-w-0">
          <Controller
            control={control}
            name="description.th"
            render={({ field, fieldState }) => (
              <FieldSet
                label="คำอธิบาย"
                image={<Image src="/TH.svg" alt="Description" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea {...field} />
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="description.en"
            render={({ field, fieldState }) => (
              <FieldSet
                label="Description (English)"
                image={<Image src="/US.svg" alt="Description" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea {...field} />
              </FieldSet>
            )}
          />
        </div>
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
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:*:min-w-0">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FieldSet label="วันที่เริ่มต้น" errorMessage={fieldState.error?.message}>
                <DatePicker output="number" value={field.value} onSelect={field.onChange}>
                  <Button size="lg" type="button" className="w-full justify-start px-4">
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
                  <Button size="lg" type="button" className="w-full justify-start px-4">
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
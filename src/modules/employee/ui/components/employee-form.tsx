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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FieldSet } from "@/components/fieldset";

import { EmployeeSchema } from "../../schema";
import { departments, divisions, positions, ranks } from "../../constants";

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
      <div className="grid gap-4 bg-background p-4 md:p-5">
        {children}
      </div>
    </section>
  );
}

export const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { control } = useFormContext<EmployeeSchema>();

  return (
    <>
      <FormSection
        step="1"
        title="พนักงาน"
        description="ข้อมูลพื้นฐานที่แสดงบนบัตรพนักงาน"
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
        {!isEdit && (
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FieldSet label="อีเมล" errorMessage={fieldState.error?.message}>
                <Input {...field} value={field.value ?? ""} type="email" />
              </FieldSet>
            )}
          />
        )}
      </FormSection>

      {!isEdit && (
        <FormSection
          step="2"
          title="บัญชีผู้ใช้งาน"
          description="ใช้สำหรับเข้าสู่ระบบครั้งแรก"
        >
          <Controller
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <FieldSet
                label="ชื่อผู้ใช้งาน"
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} />
                <small className="text-sm font-medium text-[#777]">
                  รหัสพนักงาน
                </small>
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="citizenId"
            render={({ field, fieldState }) => (
              <FieldSet
                label="รหัสผ่าน"
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} />
                <small className="text-sm font-medium text-[#777]">
                  เลข 5 หลักท้ายบัตรประชาชน
                </small>
              </FieldSet>
            )}
          />
        </FormSection>
      )}

      <FormSection
        step={isEdit ? "2" : "3"}
        title="รายละเอียด"
        description="แผนก ตำแหน่ง และสังกัด"
      >
        <Controller
          control={control}
          name="department"
          render={({ field, fieldState }) => (
            <FieldSet label="แผนก" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full justify-between"
                  >
                    <span>
                      {
                        departments.find((d) => d.slug === field.value)?.name
                          .th
                      }
                    </span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {departments.map((department) => (
                        <DropdownMenuRadioItem
                          key={department.slug}
                          value={department.slug}
                        >
                          {department.name.th}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="position"
          render={({ field, fieldState }) => (
            <FieldSet label="ตำแหน่ง" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full justify-between"
                  >
                    <span>
                      {positions.find((p) => p.slug === field.value)?.name.th}
                    </span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {positions.map((position) => (
                        <DropdownMenuRadioItem
                          key={position.slug}
                          value={position.slug}
                        >
                          {position.name.th}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="rank"
          render={({ field, fieldState }) => (
            <FieldSet label="ระดับ" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full justify-between"
                  >
                    <span>
                      {ranks.find((r) => r.slug === field.value)?.name.th}
                    </span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {ranks.map((rank) => (
                        <DropdownMenuRadioItem
                          key={rank.slug}
                          value={rank.slug}
                        >
                          {rank.name.th}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </FieldSet>
          )}
        />
        <Controller
          control={control}
          name="division"
          render={({ field, fieldState }) => (
            <FieldSet
              label="BU / สังกัด"
              errorMessage={fieldState.error?.message}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full justify-between"
                  >
                    <span>
                      {divisions.find((d) => d.slug === field.value)?.name.th}
                    </span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {divisions.map((division) => (
                        <DropdownMenuRadioItem
                          key={division.slug}
                          value={division.slug}
                        >
                          {division.name.th}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </FieldSet>
          )}
        />
      </FormSection>
    </>
  );
};

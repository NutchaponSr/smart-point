import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
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

import { divisions } from "../../constants";

/** ฟิลด์ร่วม create/edit — optional ตามโหมด */
type EmployeeFormValues = {
  name: { th: string; en: string };
  employeeId: string;
  email?: string | null;
  citizenId?: string;
  newPassword?: string;
  department: { th: string; en: string };
  position: { th: string; en: string };
  rank: string;
  division: string;
};

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

function LocalizedTextPair({
  control,
  thName,
  enName,
  thLabel,
  enLabel,
}: {
  control: ReturnType<typeof useFormContext<EmployeeFormValues>>["control"];
  thName: "department.th" | "position.th" | "name.th";
  enName: "department.en" | "position.en" | "name.en";
  thLabel: string;
  enLabel: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Controller
        control={control}
        name={thName}
        render={({ field, fieldState }) => (
          <FieldSet
            label={thLabel}
            image={<Image src="/TH.svg" alt="TH" width={20} height={20} />}
            errorMessage={fieldState.error?.message}
          >
            <Input {...field} />
          </FieldSet>
        )}
      />
      <Controller
        control={control}
        name={enName}
        render={({ field, fieldState }) => (
          <FieldSet
            label={enLabel}
            image={<Image src="/US.svg" alt="EN" width={20} height={20} />}
            errorMessage={fieldState.error?.message}
          >
            <Input {...field} />
          </FieldSet>
        )}
      />
    </div>
  );
}

export const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { control } = useFormContext<EmployeeFormValues>();

  return (
    <>
      <FormSection
        step="1"
        title="พนักงาน"
        description="ข้อมูลพื้นฐานที่แสดงบนบัตรพนักงาน (ไทย / อังกฤษ)"
      >
        <LocalizedTextPair
          control={control}
          thName="name.th"
          enName="name.en"
          thLabel="ชื่อ"
          enLabel="Name"
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

      <FormSection
        step="2"
        title="บัญชีผู้ใช้งาน"
        description={
          isEdit
            ? "เปลี่ยนรหัสพนักงานหรือตั้งรหัสผ่านใหม่ได้โดยไม่ต้องรู้รหัสเดิม"
            : "ใช้สำหรับเข้าสู่ระบบครั้งแรก"
        }
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
                รหัสพนักงาน (ไม่ใช่รหัสภายในระบบ)
              </small>
            </FieldSet>
          )}
        />
        {isEdit ? (
          <Controller
            control={control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <FieldSet
                label="รหัสผ่านใหม่"
                errorMessage={fieldState.error?.message}
              >
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="password"
                  autoComplete="new-password"
                />
                <small className="text-sm font-medium text-[#777]">
                  เว้นว่างถ้าไม่ต้องการเปลี่ยน — ไม่ต้องใส่รหัสเดิม
                </small>
              </FieldSet>
            )}
          />
        ) : (
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
        )}
        {isEdit && (
          <Controller
            control={control}
            name="citizenId"
            render={({ field, fieldState }) => (
              <FieldSet
                label="เลขบัตรประชาชน"
                errorMessage={fieldState.error?.message}
              >
                <Input
                  {...field}
                  value={field.value ?? ""}
                  inputMode="numeric"
                  maxLength={5}
                />
                <small className="text-sm font-medium text-[#777]">
                  5 หลักท้ายบัตรประชาชน — เว้นว่างถ้าไม่ต้องการเปลี่ยน
                </small>
              </FieldSet>
            )}
          />
        )}
      </FormSection>

      <FormSection
        step="3"
        title="รายละเอียด"
        description="แผนก / ตำแหน่ง (ไทย / อังกฤษ) ระดับ และสังกัด"
      >
        <LocalizedTextPair
          control={control}
          thName="department.th"
          enName="department.en"
          thLabel="แผนก"
          enLabel="Department"
        />
        {/* Catalog dropdown (department) — ปิดชั่วคราว
        <Controller
          control={control}
          name="department"
          render={({ field, fieldState }) => (
            <FieldSet label="แผนก" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="lg" className="w-full justify-between">
                    <span>{departments.find((d) => d.slug === field.value)?.name.th}</span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={field.value as string} onValueChange={field.onChange}>
                      {departments.map((department) => (
                        <DropdownMenuRadioItem key={department.slug} value={department.slug}>
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
        */}

        <LocalizedTextPair
          control={control}
          thName="position.th"
          enName="position.en"
          thLabel="ตำแหน่ง"
          enLabel="Position"
        />
        {/* Catalog dropdown (position) — ปิดชั่วคราว: import { positions } from constants
        <Controller control={control} name="position" render={({ field, fieldState }) => (
          <FieldSet label="ตำแหน่ง" errorMessage={fieldState.error?.message}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="lg" className="w-full justify-between">
                  <span>{positions.find((p) => p.slug === field.value)?.name.th}</span>
                  <ChevronDownIcon className="size-4.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuRadioGroup value={field.value as string} onValueChange={field.onChange}>
                    {positions.map((position) => (
                      <DropdownMenuRadioItem key={position.slug} value={position.slug}>
                        {position.name.th}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </FieldSet>
        )} />
        */}

        <Controller
          control={control}
          name="rank"
          render={({ field, fieldState }) => (
            <FieldSet label="ระดับ" errorMessage={fieldState.error?.message}>
              <Input {...field} />
            </FieldSet>
          )}
        />
        {/* Catalog dropdown (rank) — ปิดชั่วคราว: import { ranks } from constants
        <Controller control={control} name="rank" render={({ field, fieldState }) => (
          <FieldSet label="ระดับ" errorMessage={fieldState.error?.message}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="lg" className="w-full justify-between">
                  <span>{ranks.find((r) => r.slug === field.value)?.name.th}</span>
                  <ChevronDownIcon className="size-4.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                    {ranks.map((rank) => (
                      <DropdownMenuRadioItem key={rank.slug} value={rank.slug}>
                        {rank.name.th}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </FieldSet>
        )} />
        */}

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

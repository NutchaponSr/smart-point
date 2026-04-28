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

export const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { control } = useFormContext<EmployeeSchema>();


  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">
          พนักงาน
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
      </section>
      {!isEdit && (
        <section className="grid gap-4 p-4! md:p-8! border-t-2 border-border">
          <h2 className="text-xl leading-snug">บัญชีผู้ใช้งาน</h2>
          <Controller 
            control={control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <FieldSet label="ชื่อผู้ใช้งาน" errorMessage={fieldState.error?.message}>
                <Input {...field} />
                <small className="text-sm text-muted-foreground">
                  รหัสพนักงาน
                </small>
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="citizenId"
            render={({ field, fieldState }) => (
              <FieldSet label="รหัสผ่าน" errorMessage={fieldState.error?.message}>
                <Input {...field} />
                <small className="text-sm text-muted-foreground">
                  เลข 5 หลักท้ายบัตรประชาชน
                </small>
              </FieldSet>
            )}
          />
        </section>
      )}
      <section className="grid gap-4 p-4! md:p-8! border-t-2 border-border">
        <h2 className="text-xl leading-snug">รายละเอียด</h2>
        <Controller
          control={control}
          name="department"
          render={({ field, fieldState }) => (
            <FieldSet label="แผนก" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="lg" className="w-full justify-between">
                    <span>{departments.find((d) => d.slug === field.value)?.name.th}</span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
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
        <Controller
          control={control}
          name="position"
          render={({ field, fieldState }) => (
            <FieldSet label="ตำแหน่ง" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="lg" className="w-full justify-between">
                    <span>{positions.find((p) => p.slug === field.value)?.name.th}</span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
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
          )}
        />
        <Controller
          control={control}
          name="rank"
          render={({ field, fieldState }) => (
            <FieldSet label="ระดับ" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="lg" className="w-full justify-between">
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
          )}
        />
        <Controller
          control={control}
          name="division"
          render={({ field, fieldState }) => (
            <FieldSet label="หน่วยงาน" errorMessage={fieldState.error?.message}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="lg" className="w-full justify-between">
                    <span>{divisions.find((d) => d.slug === field.value)?.name.th}</span>
                    <ChevronDownIcon className="size-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                      {divisions.map((division) => (
                        <DropdownMenuRadioItem key={division.slug} value={division.slug}>
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
      </section>
    </>
  );
};
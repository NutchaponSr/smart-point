import Image from "next/image";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { FieldSet } from "@/components/fieldset";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { NewsFormInput } from "@/modules/news/schema";

export const NewsForm = () => {
  const { control } = useFormContext<NewsFormInput>();
  const t = useTranslations("news.admin");

  return (
    <>
      <section className="grid gap-4 p-4! md:p-8!">
        <h2 className="text-xl leading-snug">{t("section-info")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="title.th"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("title-th")}
                image={<Image src="/TH.svg" alt="TH" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} placeholder={t("title-placeholder-th")} />
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="title.en"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("title-en")}
                image={<Image src="/US.svg" alt="EN" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Input {...field} placeholder={t("title-placeholder-en")} />
              </FieldSet>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="summary.th"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("summary-th")}
                image={<Image src="/TH.svg" alt="TH" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("summary-placeholder-th")}
                  rows={2}
                />
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="summary.en"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("summary-en")}
                image={<Image src="/US.svg" alt="EN" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("summary-placeholder-en")}
                  rows={2}
                />
              </FieldSet>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="body.th"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("body-th")}
                image={<Image src="/TH.svg" alt="TH" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  placeholder={t("body-placeholder-th")}
                  rows={8}
                />
              </FieldSet>
            )}
          />
          <Controller
            control={control}
            name="body.en"
            render={({ field, fieldState }) => (
              <FieldSet
                label={t("body-en")}
                image={<Image src="/US.svg" alt="EN" width={20} height={20} />}
                errorMessage={fieldState.error?.message}
              >
                <Textarea
                  {...field}
                  placeholder={t("body-placeholder-en")}
                  rows={8}
                />
              </FieldSet>
            )}
          />
        </div>
      </section>

      <section className="grid gap-4 border-t-2 border-border p-4! md:p-8!">
        <h2 className="text-xl leading-snug">{t("section-publish")}</h2>
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
                <span className="text-base">{t("publish")}</span>
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
                <span className="text-base">{t("pin")}</span>
              </div>
            </FieldSet>
          )}
        />
      </section>
    </>
  );
};

"use client";

import TH from "../../../../../public/TH.svg";
import EN from "../../../../../public/US.svg";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import Image, { StaticImageData } from "next/image";

const LOCALE_LABELS: Record<(typeof routing.locales)[number], {
  label: string;
  image: StaticImageData;
}> = {
  th: {
    label: "ไทย",
    image: TH,
  },
  en: {
    label: "English",
    image: EN,
  },
};

export const LanguageSelector = () => {
  const locale = useLocale() as (typeof routing.locales)[number];
  const pathname = usePathname();
  const router = useRouter();

  const onLocaleChange = (newLocale: (typeof routing.locales)[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <ul className="flex gap-5">
      {routing.locales.map((locale) => (
        <li key={locale}>
          <button onClick={() => onLocaleChange(locale)} className="items-center flex justify-center space-x-2">
            <Image src={LOCALE_LABELS[locale].image.src} alt={LOCALE_LABELS[locale].label} width={20} height={20} />
            <span className="whitespace-nowrap text-base font-bold tracking-[.8px] text-[#4b4b4b]">{LOCALE_LABELS[locale].label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

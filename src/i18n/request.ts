import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";
import en from "../messages/en.json";
import th from "../messages/th.json";

const messagesByLocale = {
  en,
  th,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale],
  };
});

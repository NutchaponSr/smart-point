"use client";

import { useTranslations } from "next-intl";

import { Main } from "@/components/main";

import { MyEventScreen } from "@/modules/events/ui/screens/my-event-screen";

export const MyEventView = () => {
  const t = useTranslations("events");

  return (
    <Main title={t("title")}>
      <MyEventScreen />
    </Main>
  )
}
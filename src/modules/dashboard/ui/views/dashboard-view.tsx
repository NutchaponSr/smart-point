"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Main } from "@/components/main";
import { Navigations } from "@/components/navigations";

import { links } from "@/modules/dashboard/constants";
import { type DayRange, defaultRange } from "@/modules/dashboard/date-range";
import { CultureSection } from "@/modules/dashboard/ui/components/culture-section";
import { KpiSection } from "@/modules/dashboard/ui/components/kpi-section";
import { PreorderSection } from "@/modules/dashboard/ui/components/preorder-section";

export const DashboardView = () => {
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<DayRange>(defaultRange);
  const [division, setDivision] = useState<string | null>(null);

  return (
    <Main title={t("title")} menu={<Navigations links={links} />}>
      <section className="flex flex-col gap-6 p-4 md:p-8">
        <KpiSection
          range={range}
          division={division}
          onRangeChange={setRange}
          onDivisionChange={setDivision}
        />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <CultureSection range={range} division={division} />
          <PreorderSection range={range} division={division} />
        </div>
      </section>
    </Main>
  );
};

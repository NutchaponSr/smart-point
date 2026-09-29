"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface Props {
  links: Array<{
    slug: string;
    name: {
      th: string;
      en: string;
    };
  }>;
}

export const Navigations = ({ links }: Props) => {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <>
      <Link href="/dashboard">
        <Button>{t("overview")}</Button>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>{t("data")}</NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-md border-2 border-border bg-background p-0 py-2">
              {links.map((link) => (
                <NavigationMenuLink
                  href={`/meta/${link.slug}`}
                  key={link.slug}
                  className="rounded-none!"
                >
                  {locale === "en" ? link.name.en : link.name.th}
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
};

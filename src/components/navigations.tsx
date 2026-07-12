"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button";

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
  return (
    <>
      <Link href="/dashboard">
        <Button>
          ภาพรวม
        </Button>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>ข้อมูล</NavigationMenuTrigger>
            <NavigationMenuContent className="bg-background border-2 border-border rounded-xs p-0 py-2">
              {links.map((link) => (
                <NavigationMenuLink href={`/meta/${link.slug}`} key={link.slug} className="rounded-none!">
                  {link.name.th}
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}
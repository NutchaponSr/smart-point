"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

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
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>ข้อมูล</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-background border-2 border-border rounded-xs p-0 py-2">
            {links.map((link) => (
              <NavigationMenuLink href={`/dashboard/${link.slug}`} key={link.slug} className="rounded-none!">
                {link.name.th}
              </NavigationMenuLink>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
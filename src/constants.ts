import type { StaticImageData } from "next/image";

import HomeIcon from "../public/home.svg";
import ShopIcon from "../public/shop.svg";
import HistoryIcon from "../public/page.svg";
import LeaderboardIcon from "../public/leaderboard.svg";
import EventsIcon from "../public/event.svg";
import DashboardIcon from "../public/chart.svg";

export type NavigationItem = {
  icon: StaticImageData;
  label: string;
  href: string;
  isAdmin?: boolean;
};

export type MetadataItem = {
  label: string;
  href: string;
  isAdmin?: boolean;
};

export const navigations: NavigationItem[] = [
  {
    icon: HomeIcon,
    label: "home",
    href: "/",
  },
  {
    icon: ShopIcon,
    label: "reward",
    href: "/rewards",
  },
  {
    icon: HistoryIcon,
    label: "purchases",
    href: "/purchases",
  },
  {
    icon: LeaderboardIcon,
    label: "leaderboard",
    href: "/leaderboard",
  },
  {
    icon: EventsIcon,
    label: "events",
    href: "/events",
  },
  {
    icon: DashboardIcon,
    label: "dashboard",
    href: "/dashboard",
    isAdmin: true,
  },
];

export const metadata: MetadataItem[] = [
  {
    label: "employees",
    href: "/meta/employees",
    isAdmin: true,
  },
  {
    label: "reward",
    href: "/meta/rewards",
    isAdmin: true,
  },
  {
    label: "transaction",
    href: "/meta/transactions",
    isAdmin: true,
  },
  {
    label: "redemptions",
    href: "/meta/redemptions?shippingStatus=pending&shippingStatus=processing",
    isAdmin: true,
  },
  {
    label: "events",
    href: "/meta/events",
    isAdmin: true,
  },
  {
    label: "news",
    href: "/meta/news",
    isAdmin: true,
  },
];

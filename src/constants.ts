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
    label: "หน้าหลัก",
    href: "/",
  },
  {
    icon: ShopIcon,
    label: "รางวัล",
    href: "/rewards",
  },
  {
    icon: HistoryIcon,
    label: "ประวัติการแลก",
    href: "/purchases",
  },
  {
    icon: LeaderboardIcon,
    label: "ตารางคะแนน",
    href: "/leaderboard",
  },
  {
    icon: EventsIcon,
    label: "กิจกรรม",
    href: "/events",
  },
  {
    icon: DashboardIcon,
    label: "แดชบอร์ด",
    href: "/dashboard",
    isAdmin: true,
  },
];

export const metadata: MetadataItem[] = [
  {
    label: "พนักงาน",
    href: "/meta/employees",
    isAdmin: true,
  },
  {
    label: "รางวัล",
    href: "/meta/rewards",
    isAdmin: true,
  },
  {
    label: "ธุรกรรม",
    href: "/meta/transactions?status=pending",
    isAdmin: true,
  },
  {
    label: "กิจกรรม",
    href: "/meta/events",
    isAdmin: true,
  },
  {
    label: "ข่าวสาร",
    href: "/meta/news",
    isAdmin: true,
  },
];

import type { IconType } from "react-icons";
import { MdLeaderboard } from "react-icons/md";
import { HiShoppingCart } from "react-icons/hi2";
import { RiCopperCoinFill } from "react-icons/ri";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { BsCalendar2EventFill, BsFillGridFill } from "react-icons/bs";

export type NavigationItem = {
  icon: IconType;
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
    icon: RiCopperCoinFill,
    label: "หน้าหลัก",
    href: "/",
  },
  {
    icon: HiShoppingCart,
    label: "รางวัล",
    href: "/rewards",
  },
  {
    icon: FaMoneyBillTransfer,
    label: "ประวัติการแลกรางวัล",
    href: "/purchases",
  },
  {
    icon: MdLeaderboard,
    label: "อันดับคะแนนสูงสุด",
    href: "/leaderboard",
  },
  {
    icon: BsCalendar2EventFill,
    label: "กิจกรรม",
    href: "/events",
    isAdmin: true,
  },
  {
    icon: BsFillGridFill,
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
];

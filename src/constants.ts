import { MdLeaderboard } from "react-icons/md";
import { HiShoppingCart } from "react-icons/hi2";
import { RiCopperCoinFill } from "react-icons/ri";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { BsCalendar2EventFill, BsFillGridFill } from "react-icons/bs";

export const navigations = [
  {
    icon: RiCopperCoinFill,
    label: "ธุรกรรม",
    href: "/transactions",
  },
  {
    icon: HiShoppingCart,
    label: "รางวัล",
    href: "/rewards",
  },
  {
    icon: FaMoneyBillTransfer,
    label: "ประวัติการแลก",
    href: "/purchases",
  },
  {
    icon: MdLeaderboard,
    label: "กระดานผู้นำ",
    href: "/leaderboard",
  },  
  {
    icon: BsCalendar2EventFill,
    label: "กิจกรรม",
    href: "/events",
  },
  {
    icon: BsFillGridFill,
    label: "แดชบอร์ด",
    href: "/dashboard",
  },
]
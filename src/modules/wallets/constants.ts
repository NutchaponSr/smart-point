import { IconType } from "react-icons/lib";
import { iconTagVariants } from "./ui/components/options-step";
import { BsBasket2Fill } from "react-icons/bs";
import { VariantProps } from "class-variance-authority";
import { FaEllipsisH, FaUtensils } from "react-icons/fa";

export const tags: Array<{
  name: string;
  icon: IconType;
  color: VariantProps<typeof iconTagVariants>["variant"]
}> = [
  {
    name: "ช๊อปปิ้ง",
    icon: BsBasket2Fill,
    color: "default",
  },
  {
    name: "อาหาร",
    icon: FaUtensils,
    color: "green",
  },
  {
    name: "อื่นๆ",
    icon: FaEllipsisH,
    color: "orange",
  },
]
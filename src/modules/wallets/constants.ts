import { iconTagVariants } from "./ui/components/options-step";
import { BsBasket2Fill } from "react-icons/bs";
import { VariantProps } from "class-variance-authority";
import { FaEllipsisH, FaUtensils } from "react-icons/fa";

export const tags: Array<{
  code: string;
  name: string;
  color: VariantProps<typeof iconTagVariants>["variant"]
}> = [
  {
    code: "S",
    name: "สัญญาโปร่งใส",
    color: "default",
  },
  {
    code: "M",
    name: "ใส่ใจเรียนรู้",
    color: "green",
  },
  {
    code: "A",
    name: "สู้การเปลี่ยนแปลง",
    color: "orange",
  },
  {
    code: "R",
    name: "แสดงคสามยอมรับ",
    color: "orange",
  },
  {
    code: "T",
    name: "สนับสนุนลูกค้า",
    color: "default",
  }
]
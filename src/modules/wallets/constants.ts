export type WalletTagColor = "default" | "green" | "orange";

export const tags: Array<{
  code: string;
  name: string;
  color: WalletTagColor;
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
  },
]

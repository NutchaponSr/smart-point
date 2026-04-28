import { sortValues } from "@/modules/rewards/search-params";

export function generateSort(sort: typeof sortValues[number]) {
  switch (sort) {
    case "curated":
      return "คัดสรรสำหรับคุณ";
    case "trending":
      return "กำลังเป็นกระแส";
    case "hot_and_new":
      return "รายการใหม่ล่าสุด";
  }
}
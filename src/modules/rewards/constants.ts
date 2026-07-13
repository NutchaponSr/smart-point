export enum Status {
  pending = "pending",
  fulfilled = "fulfilled",
  cancelled = "cancelled",
}

export const statuses: Record<Status, string> = {
  pending: "รอดำเนินการ",
  fulfilled: "แลกสำเร็จ",
  cancelled: "ยกเลิก",
};

export type ShippingStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered";

export const shippingStatuses: Record<
  ShippingStatus,
  { label: string; color: string }
> = {
  pending: { label: "รอจัดส่ง", color: "text-[#1899d6]" },
  processing: { label: "กำลังเตรียม", color: "text-[#cc7800]" },
  shipped: { label: "จัดส่งแล้ว", color: "text-[#58a700]" },
  delivered: { label: "ส่งถึงแล้ว", color: "text-[#58a700]" },
};

export const rewardHeaderMapping: Record<string, string> = {
  Name: "name",
  Description: "description",
  "Point Cost": "pointCost",
  Stock: "stock",
  "One Per Order": "onePerOrder",
  "Is Active": "isActive",
}

export const rewardHeaders: Record<string, string> = {
  "name": "Name",
  "description": "Description",
  "pointCost": "Point Cost",
  "stock": "Stock",
  "onePerOrder": "One Per Order",
  "isActive": "Is Active",
}
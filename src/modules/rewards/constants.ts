export enum Status {
  pending = "pending",
  fulfilled = "fulfilled",
  cancelled = "cancelled",
}

export const statuses: Record<Status, string> = {
  pending: "Pending",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
}

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
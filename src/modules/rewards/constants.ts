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
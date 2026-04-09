export enum Status {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
  completed = "completed",
}

export const statuses: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
}
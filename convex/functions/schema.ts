import { arrayOf, boolean, convexTable, custom, defineRelations, defineSchema, id, index, integer, text, textEnum, timestamp, uniqueIndex } from "better-convex/orm";
import { v } from "convex/values";

export const user = convexTable("user", {
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean(),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  username: text().notNull(),
  displayUsername: text().notNull(),
  employeeId: id("employee").notNull(),
}, (t) => [
  index("by_email").on(t.email),
  index("by_username").on(t.username),
  index("by_employeeId").on(t.employeeId),
]);

export const session = convexTable("session", {
  token: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  ipAddress: text(),
  userAgent: text(),
  userId: id("user").notNull(),
}, (t) => [
  index("by_token").on(t.token),
  index("by_userId").on(t.userId),
  index("by_expiresAt").on(t.expiresAt),
  index("by_expiresAt_userId").on(t.expiresAt, t.userId),
]);

export const account = convexTable("account", {
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: id("user").notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: integer(),
  refreshTokenExpiresAt: integer(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_accountId").on(t.accountId),
  index("by_userId").on(t.userId),
  index("by_accountId_providerId").on(t.accountId, t.providerId),
  index("by_providerId_userId").on(t.providerId, t.userId),
]);

export const verification = convexTable("verification", {
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("by_identifier").on(t.identifier),
  index("by_expiresAt").on(t.expiresAt),
]);

export const jwks = convexTable("jwks", {
  publicKey: text().notNull(),
  privateKey: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const employee = convexTable("employee", {
  employeeId: text().notNull(),
  name: text().notNull(),
  email: text(),
  department: text().notNull(),
  position: text().notNull(),
  rank: text().notNull(),
  division: text().notNull(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_department").on(t.department),
]);

export const wallet = convexTable("wallet", {
  employeeId: id("employee").notNull(),
  givingBudget: integer().notNull(),
  receivingBudget: integer().notNull(),
  lastBudgetUpdate: timestamp().notNull().defaultNow(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
]);

export const transaction = convexTable("transaction", {
  senderId: id("employee").notNull(),
  receiverId: id("employee").notNull(),
  amount: integer().notNull(),
  message: text().notNull(),
  tags: arrayOf(text()).notNull(),
  status: textEnum(["pending", "approved", "rejected", "completed"] as const).notNull(),
  reviewedBy: id("employee").notNull(),
  reviewedAt: timestamp().notNull(),
  rejectionReason: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_senderId").on(t.senderId),
  index("by_receiverId").on(t.receiverId),
  index("by_status").on(t.status),
]);

export const reward = convexTable("reward", {
  name: text().notNull(),
  description: text(),
  image: text(),
  pointCost: integer().notNull(),
  stock: integer().notNull(),
  onePerOrder: boolean(),
  isActive: boolean().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_isActive").on(t.isActive),
]);

export const cart = convexTable("cart", {
  employeeId: id("employee").notNull(),
  status: textEnum(["active", "checked_out", "abandoned"] as const).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_employeeId_status").on(t.employeeId, t.status),
]);

export const cartItem = convexTable("cartItem", {
  cartId: id("cart").notNull(),
  rewardId: id("reward").notNull(),
  quantity: integer().notNull(),
}, (t) => [
  index("by_cartId").on(t.cartId),
  index("by_cartId_rewardId").on(t.cartId, t.rewardId),
]);

export const redemption = convexTable("redemption", {
  employeeId: id("employee").notNull(),
  rewardId: id("reward").notNull(),
  quantity: integer().notNull(),
  pointCostPerItem: integer().notNull(),
  pointSpent: integer().notNull(),
  status: textEnum(["pending", "fulfilled", "cancelled"] as const).notNull(),
  fulfilledBy: id("employee"),
  fulfilledAt: timestamp(),
  note: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_rewardId").on(t.rewardId),
  index("by_status").on(t.status),
  index("by_employeeId_status").on(t.employeeId, t.status),
]);

export const activity = convexTable("activity", {
  name: text().notNull(),
  description: text(),
  reward: custom(
    v.union(
      v.object({ type: v.literal("points"), pointReward: v.number() }),
      v.object({ type: v.literal("ticket"), ticketDiscount: v.number() }),
    ),
  ).notNull(),
  startDate: timestamp().notNull(),
  endDate: timestamp(),
  maxParticipants: integer(), // null = unlimited
  isActive: boolean().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_isActive").on(t.isActive),
  index("by_startDate").on(t.startDate),
]);

export const review = convexTable("review", {
  redemptionId: id("redemption").notNull(),
  rewardId: id("reward").notNull(),
  userId: id("user").notNull(),
  stars: integer().notNull(), // 1-5
  comment: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("by_rewardId").on(t.rewardId),
  index("by_userId").on(t.userId),
  uniqueIndex("by_redemptionId").on(t.redemptionId),
]);

export const activityParticipant = convexTable("activityParticipant", {
  activityId: id("activity").notNull(),
  employeeId: id("employee").notNull(),
  status: textEnum(["registered", "attended", "rewarded", "cancelled"] as const).notNull(),
  pointAwarded: integer(),
  awardedBy: id("user"),
  awardedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_activityId").on(t.activityId),
  index("by_employeeId").on(t.employeeId),
  uniqueIndex("by_activityId_employeeId").on(t.activityId, t.employeeId),
]);

export const pointLedger = convexTable("pointLedger", {
  employeeId: id("employee").notNull(),
  delta: integer().notNull(), // บวก = รับ, ลบ = จ่าย
  balanceAfter: integer().notNull(),
  balanceType: textEnum(["giving", "receiving"] as const).notNull(),
  sourceType: textEnum(["transaction", "redemption", "activity", "monthly_reset"] as const).notNull(),
  sourceId: text(),
  note: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_sourceType_sourceId").on(t.sourceType, t.sourceId),
]);

export const tables = {
  user,
  session,
  account,
  verification,
  jwks,
  employee,
  wallet,
  transaction,
  reward,
  redemption,
  activity,
  activityParticipant,
  pointLedger,
  cart,
  cartItem,
  review,
}

export const relations = defineRelations(tables, (r) => ({
  //TODO: Relations
}));

export default defineSchema(tables, {
  defaults: {
    defaultLimit: 100,
  },
});
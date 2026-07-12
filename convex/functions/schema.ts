import { arrayOf, boolean, convexTable, custom, defineRelations, defineSchema, id, index, integer, searchIndex, text, textEnum, timestamp, uniqueIndex } from "better-convex/orm";

export const user = convexTable("user", {
  name: text().notNull(),
  email: text(),
  emailVerified: boolean(),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  username: text().notNull(),
  displayUsername: text().notNull(),
  employeeId: id("employee").notNull(),
  role: textEnum(["admin", "user"] as const).notNull(),
}, (t) => [
  index("by_role").on(t.role),
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
  index("by_department").on(t.department),
  uniqueIndex("by_employeeId").on(t.employeeId),
  searchIndex("search_name").on(t.name),
  searchIndex("search_email").on(t.email),
  searchIndex("search_employeeId").on(t.employeeId),
]);

export const wallet = convexTable("wallet", {
  employeeId: id("employee").notNull(),
  givingBudget: integer().notNull(),
  receivingBudget: integer().notNull(),
  specialBudget: integer(),
  lastBudgetUpdate: timestamp().notNull().defaultNow(),
  lastDailyBonus: timestamp(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
]);

export const transaction = convexTable("transaction", {
  senderId: id("employee").notNull(),
  receiverId: id("employee").notNull(),
  amount: integer().notNull(),
  message: text().notNull(),
  tags: text().notNull(),
  status: textEnum(["pending", "rejected", "completed"] as const).notNull(),
  reviewedBy: id("employee").notNull(),
  reviewedAt: timestamp().notNull(),
  rejectionReason: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_senderId").on(t.senderId),
  index("by_receiverId").on(t.receiverId),
  index("by_status").on(t.status),
  index("by_senderId_status").on(t.senderId, t.status),
  index("by_receiverId_status").on(t.receiverId, t.status),
]);

export const like = convexTable("like", {
  employeeId: id("employee").notNull(),
  transactionId: id("transaction").notNull(),
  createdAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_transactionId").on(t.transactionId),
  uniqueIndex("by_employeeId_transactionId").on(t.employeeId, t.transactionId),
]);

export const comment = convexTable("comment", {
  employeeId: id("employee").notNull(),
  transactionId: id("transaction").notNull(),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_transactionId").on(t.transactionId),
  uniqueIndex("by_employeeId_transactionId").on(t.employeeId, t.transactionId),
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
  index("by_rewardId").on(t.rewardId),
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
  point: integer().notNull(),
  category: textEnum(["external", "internal", "internal_bu", "specials_point"] as const).notNull(),
  startDate: timestamp().notNull(),
  endDate: timestamp(),
  maxParticipants: integer(), // null = unlimited
  allowedDivisions: arrayOf(text()),
  allowedDepartments: arrayOf(text()),
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
  evidenceStorageId: text(),
  evidenceType: textEnum(["image", "pdf"] as const),
  evidenceMimeType: text(),
  evidenceFileName: text(),
  evidenceSize: integer(),
  evidenceUploadedAt: timestamp(),
  evidenceUploadedBy: id("user"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_activityId").on(t.activityId),
  index("by_employeeId").on(t.employeeId),
  uniqueIndex("by_activityId_employeeId").on(t.activityId, t.employeeId),
]);

export const news = convexTable("news", {
  title: text().notNull(),
  summary: text(),
  body: text().notNull(),
  isPublished: boolean().notNull(),
  publishedAt: timestamp(),
  isPinned: boolean(),
  createdBy: id("user").notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
}, (t) => [
  index("by_isPublished").on(t.isPublished),
  index("by_publishedAt").on(t.publishedAt),
  index("by_isPublished_publishedAt").on(t.isPublished, t.publishedAt),
  index("by_createdBy").on(t.createdBy),
]);

export const pointLedger = convexTable("pointLedger", {
  employeeId: id("employee").notNull(),
  delta: integer().notNull(), // บวก = รับ, ลบ = จ่าย
  balanceAfter: integer().notNull(),
  balanceType: textEnum(["giving", "receiving", "special"] as const).notNull(),
  sourceType: textEnum(["transaction", "redemption", "activity", "monthly_reset", "daily_login", "monthly_quest"] as const).notNull(),
  sourceId: text(),
  note: text(),
  createdAt: timestamp().notNull().defaultNow(),
}, (t) => [
  index("by_employeeId").on(t.employeeId),
  index("by_sourceType_sourceId").on(t.sourceType, t.sourceId),
  index("by_employeeId_sourceType").on(t.employeeId, t.sourceType),
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
  like,
  comment,
  news,
}

/** ต้องรัน `defineSchema` ก่อน `defineRelations` เพื่อให้ `tables` มี `OrmSchemaDefinition` (จำเป็นต่อ ORM select().filter()…​.paginate() ฯลฯ) */
const convexSchema = defineSchema(tables, {
  defaults: {
    defaultLimit: 100,
  },
});

export const relations = defineRelations(tables, (r) => ({
  // TODO: Relations
}));

export default convexSchema;
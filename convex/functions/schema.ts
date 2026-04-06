import { boolean, convexTable, defineRelations, defineSchema, id, index, integer, text, timestamp, uniqueIndex } from "better-convex/orm";

export const user = convexTable("user", {
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean(),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  username: text().notNull(),
  displayUsername: text().notNull(),
}, (t) => [
  index("email").on(t.email),
  index("username").on(t.username),
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

export const tables = {
  user,
  session,
  account,
  verification,
  jwks,
  employee,
  wallet,
}

export const relations = defineRelations(tables, (r) => ({
  //TODO: Relations
}));

export default defineSchema(tables, {
  defaults: {
    defaultLimit: 100,
  },
});
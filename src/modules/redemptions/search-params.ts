import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const sortValues = ["recently-updated", "purchase-date"] as const;
const shippingStatusValues = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const;
const statusValues = ["pending", "fulfilled", "cancelled"] as const;

export const redemptionAdminFilterSearchParams = {
  q: parseAsString.withDefault(""),
  shippingStatus: parseAsArrayOf(
    parseAsStringLiteral(shippingStatusValues),
  ),
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
  sort: parseAsStringLiteral(sortValues).withDefault("purchase-date"),
  from: parseAsInteger,
  to: parseAsInteger,
  by: parseAsString,
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
};

export const loadRedemptionAdminFilters = createLoader(
  redemptionAdminFilterSearchParams,
);

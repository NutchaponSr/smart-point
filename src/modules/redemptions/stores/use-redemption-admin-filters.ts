import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

const sortValues = ["recently-updated", "purchase-date"] as const;
const shippingStatusValues = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const;
const statusValues = ["pending", "fulfilled", "cancelled"] as const;

const params = {
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

export const useRedemptionAdminFilters = () => {
  return useQueryStates(params);
};

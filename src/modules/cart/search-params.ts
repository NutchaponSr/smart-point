import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

const sortValues = ["recently-updated", "purchase-date"] as const;

const params = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(25),
  sort: parseAsStringLiteral(sortValues).withDefault("purchase-date"),
  from: parseAsInteger,
  to: parseAsInteger,
}

export const loadPurchaseFilters = createLoader(params);
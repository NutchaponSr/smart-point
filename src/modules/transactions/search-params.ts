import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const periodValues = ["24hr", "7d", "30d", "fullTime"] as const;
const statusValues = ["pending", "completed", "rejected"] as const;
const sortValues = ["sent", "received"] as const;

const baseFilterSearchParams = {
  q: parseAsString.withDefault(""),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
  view: parseAsStringLiteral(sortValues).withDefault("sent"),
  by: parseAsString,
};

export const filterSearchParams = {
  ...baseFilterSearchParams,
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
  from: parseAsInteger,
  to: parseAsInteger,
};

export const loadTransactionFilters = createLoader(filterSearchParams);

const params = {
  q: parseAsString.withDefault(""),
  period: parseAsStringLiteral(periodValues).withDefault("24hr"),
  limit: parseAsInteger.withDefault(25),
  cursor: parseAsInteger.withDefault(0),
  page: parseAsInteger.withDefault(0),
};

export const loadLeaderboardSearchParams = createLoader(params);

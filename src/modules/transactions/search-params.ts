import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const periodValues = ["24hr", "7d", "30d", "fullTime"] as const;
const statusValues = ["pending", "completed", "rejected", "approved"] as const;
const sortValues = ["sent", "received"] as const;

export const filterSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(10),
  page: parseAsInteger.withDefault(0),
  view: parseAsStringLiteral(sortValues).withDefault("sent"),
};

export const loadFilterSearchParams = createLoader(filterSearchParams);

const params = {
  period: parseAsStringLiteral(periodValues).withDefault("24hr"),
  limit: parseAsInteger.withDefault(25),
  cursor: parseAsInteger.withDefault(0),
};

export const loadLeaderboardSearchParams = createLoader(params);

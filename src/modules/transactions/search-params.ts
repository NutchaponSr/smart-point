import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from "nuqs/server";

import { Status } from "@/modules/transactions/constants";

const periodValues = ["24hr", "7d", "30d", "fullTime"] as const;

export const filterSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum<Status>(Object.values(Status))),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(10),
  page: parseAsInteger.withDefault(0),
};

export const loadFilterSearchParams = createLoader(filterSearchParams);

const params = {
  period: parseAsStringLiteral(periodValues).withDefault("24hr"),
  limit: parseAsInteger.withDefault(25),
  cursor: parseAsInteger.withDefault(0),
};

export const loadLeaderboardSearchParams = createLoader(params);

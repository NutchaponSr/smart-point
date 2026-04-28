import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const sortValues = ["sent", "received"] as const;
const statusValues = ["pending", "completed", "rejected"] as const;

const baseParams = {
  q: parseAsString.withDefault(""),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
  view: parseAsStringLiteral(sortValues).withDefault("sent"),
  from: parseAsInteger,
  to: parseAsInteger,
  by: parseAsString,
};

const params = {
  ...baseParams,
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
};

const analyticParams = {
  ...baseParams,
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)).withDefault(["pending"]),
};

export const useTransactionFilters = () => {
  return useQueryStates(params);
};

export const useAnalyticTransactionFilters = () => {
  return useQueryStates(analyticParams);
};
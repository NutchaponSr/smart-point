import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const sortValues = ["sent", "received"] as const;
const statusValues = ["pending", "completed", "rejected"] as const;

const params = {
  q: parseAsString.withDefault(""),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
  view: parseAsStringLiteral(sortValues).withDefault("sent"),
  from: parseAsInteger,
  to: parseAsInteger,
  by: parseAsString,
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
};

export const useTransactionFilters = () => {
  return useQueryStates(params);
};
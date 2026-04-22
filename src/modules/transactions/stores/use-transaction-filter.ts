import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const sortValues = ["sent", "received"] as const;
const statusValues = ["pending", "completed", "rejected", "approved"] as const;

const params = {
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(10),
  page: parseAsInteger.withDefault(0),
  view: parseAsStringLiteral(sortValues).withDefault("sent"),
}

export const useTransactionFilters = () => {
  return useQueryStates(params);
}
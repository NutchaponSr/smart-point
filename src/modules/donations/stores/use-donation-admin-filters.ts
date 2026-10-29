import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const params = {
  q: parseAsString.withDefault(""),
  min: parseAsInteger.withDefault(0),
  max: parseAsInteger.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
};

export const useDonationAdminFilters = () => {
  return useQueryStates(params);
};

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const params = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
};

export const useNewsFilters = () => {
  return useQueryStates(params);
};

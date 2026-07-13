import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";

const params = {
  q: parseAsString.withDefault(""),
  division: parseAsArrayOf(parseAsString).withDefault([]),
  department: parseAsArrayOf(parseAsString).withDefault([]),
  rank: parseAsArrayOf(parseAsString).withDefault([]),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
};

export const useEmployeeFilters = () => {
  return useQueryStates(params);
};

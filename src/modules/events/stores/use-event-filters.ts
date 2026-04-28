import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  parseAsArrayOf,
} from "nuqs";

const sortValues = ["external", "internal", "internal_bu", "specials_point"] as const;
const statusValues = ["registered", "rewarded"] as const;

const params = {
  q: parseAsString.withDefault(""),
  view: parseAsArrayOf(parseAsStringLiteral(sortValues)),
  minParticipants: parseAsInteger,
  maxParticipants: parseAsInteger,
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
  status: parseAsArrayOf(parseAsStringLiteral(statusValues)),
};

export const useEventFilters = () => {
  return useQueryStates(params);
};

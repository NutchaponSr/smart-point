import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsBoolean,
  useQueryStates,
} from "nuqs";

const sortValues = ["external", "internal", "internal_bu", "specials_point", "all"] as const;

const params = {
  q: parseAsString.withDefault(""),
  view: parseAsStringLiteral(sortValues).withDefault("all"),
  minParticipants: parseAsInteger,
  maxParticipants: parseAsInteger,
  isJoined: parseAsBoolean.withDefault(false),
};

export const useEventFilters = () => {
  return useQueryStates(params);
};

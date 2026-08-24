import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

const feedScopeValues = ["mine", "team"] as const;

const params = {
  feedScope: parseAsStringLiteral(feedScopeValues).withDefault("mine"),
  feedQ: parseAsString.withDefault(""),
  feedMin: parseAsFloat.withDefault(0),
  feedMax: parseAsFloat.withDefault(0),
  feedFrom: parseAsInteger,
  feedTo: parseAsInteger,
};

export const useFeedFilters = () => {
  return useQueryStates(params);
};

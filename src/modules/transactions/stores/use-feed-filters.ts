import {
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

const feedViewValues = ["all", "sent", "received"] as const;

const params = {
  feedView: parseAsStringLiteral(feedViewValues).withDefault("all"),
  feedQ: parseAsString.withDefault(""),
  feedMin: parseAsFloat.withDefault(0),
  feedMax: parseAsFloat.withDefault(0),
  feedFrom: parseAsInteger,
  feedTo: parseAsInteger,
};

export const useFeedFilters = () => {
  return useQueryStates(params);
};

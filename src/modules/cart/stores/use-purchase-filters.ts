import { 
  parseAsFloat,
  parseAsString, 
  parseAsStringLiteral, 
  useQueryStates 
} from "nuqs";

const sortValues = ["recently-updated", "purchase-date"] as const;

const params = {
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(sortValues).withDefault("purchase-date"),
}

export const usePurchaseFilters = () => {
  return useQueryStates(params);
}
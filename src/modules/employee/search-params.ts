import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

const params = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
}

export const loadEmployeeFilters = createLoader(params);  
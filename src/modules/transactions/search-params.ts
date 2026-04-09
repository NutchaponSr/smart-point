import { createLoader, parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";

import { Status } from "@/modules/transactions/constants";

export const filterSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum<Status>(Object.values(Status))),
  min: parseAsFloat.withDefault(0),
  max: parseAsFloat.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(10),
  page: parseAsInteger.withDefault(0),
};

export const loadFilterSearchParams = createLoader(filterSearchParams);

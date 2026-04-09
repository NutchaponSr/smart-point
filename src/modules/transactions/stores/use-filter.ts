import { 
  parseAsArrayOf, 
  parseAsFloat, 
  parseAsInteger, 
  parseAsStringEnum, 
  useQueryState 
} from "nuqs";
import { useEffect } from "react";
import { useDebounce } from "@uidotdev/usehooks";

import { Status } from "@/modules/transactions/constants";

export const useFilter = () => {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const debouncedQuery = useDebounce(query, 300);

  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsStringEnum<Status>(Object.values(Status)))
  );

  const [min, setMin] = useQueryState("min", parseAsFloat.withDefault(0));
  const [max, setMax] = useQueryState("max", parseAsFloat.withDefault(0));
  const [from, setFrom] = useQueryState("from", parseAsInteger);
  const [to, setTo] = useQueryState("to", parseAsInteger);
  const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(0));

  const debouncedMin = useDebounce(min, 400);
  const debouncedMax = useDebounce(max, 400);

  useEffect(() => {
    void setPage(0);
  }, [debouncedQuery, status, debouncedMin, debouncedMax, from, to, setPage]);

  return {
    query,
    debouncedQuery,
    setQuery,
    status,
    setStatus,
    min,
    setMin,
    max,
    setMax,
    debouncedMin,
    debouncedMax,
    from,
    setFrom,
    to,
    setTo,
    limit,
    setLimit,
    page,
    setPage,
  };
};
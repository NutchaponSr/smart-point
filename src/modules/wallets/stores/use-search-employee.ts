import { throttle, useQueryState } from "nuqs";

export const useSearchEmployee = () => {
  const [query, setQuery] = useQueryState("q", {
    defaultValue: "",
    clearOnDefault: true,
    limitUrlUpdates: throttle(300),
  });

  return {
    query,
    setQuery,
  }
}
import { useCallback, useEffect, useRef, useState } from "react";

type Args = {
  debouncedQuery: string;
  limit: number;
  urlPage: number;
  onPageChange: (page: number) => void;
};


export function usePagination({
  debouncedQuery,
  limit,
  urlPage,
  onPageChange,
}: Args) {
  const [stack, setStack] = useState<(string | null)[]>([null]);

  const prevQueryRef = useRef<string | undefined>(undefined);
  const prevLimitRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (
      prevQueryRef.current !== undefined &&
      (prevQueryRef.current !== debouncedQuery || prevLimitRef.current !== limit)
    ) {
      setStack([null]);
      onPageChange(1);
    }
    prevQueryRef.current = debouncedQuery;
    prevLimitRef.current = limit;
  }, [debouncedQuery, limit, onPageChange]);

  useEffect(() => {
    if (urlPage <= 1 && stack.length > 1) {
      setStack([null]);
    }
  }, [stack.length, urlPage]);

  const currentPage = Math.min(Math.max(urlPage, 1), stack.length);
  const requestCursor = stack[currentPage - 1] ?? null;
  const canGoBack = currentPage > 1;

  const goBack = useCallback(() => {
    const nextPage = Math.max(1, urlPage - 1);
    onPageChange(nextPage);
  }, [onPageChange, urlPage]);

  const goForward = useCallback(
    (continueCursor: string) => {
      setStack((s) => {
        const safePage = Math.min(Math.max(urlPage, 1), s.length);
        const trimmed = s.slice(0, safePage);
        return [...trimmed, continueCursor];
      });
      const nextPage = Math.max(1, urlPage) + 1;
      onPageChange(nextPage);
    },
    [onPageChange, urlPage],
  );

  const resetToFirstPage = useCallback(() => {
    setStack([null]);
    onPageChange(1);
  }, [onPageChange]);

  return { requestCursor, canGoBack, goBack, goForward, resetToFirstPage };
}

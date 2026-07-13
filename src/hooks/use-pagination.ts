import { useCallback, useEffect, useRef, useState } from "react";

type Args = {
  debouncedQuery: string;
  limit: number;
  urlPage: number;
  onPageChange: (page: number) => void;
  /** เมื่อค่านี้เปลี่ยน จะรีเซ็ต cursor stack กลับหน้าแรก */
  resetKey?: string;
};

export function usePagination({
  debouncedQuery,
  limit,
  urlPage,
  onPageChange,
  resetKey = "",
}: Args) {
  const [stack, setStack] = useState<(string | null)[]>([null]);

  const prevQueryRef = useRef<string | undefined>(undefined);
  const prevLimitRef = useRef<number | undefined>(undefined);
  const prevResetKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      prevQueryRef.current !== undefined &&
      (prevQueryRef.current !== debouncedQuery ||
        prevLimitRef.current !== limit ||
        prevResetKeyRef.current !== resetKey)
    ) {
      setStack([null]);
      onPageChange(1);
    }
    prevQueryRef.current = debouncedQuery;
    prevLimitRef.current = limit;
    prevResetKeyRef.current = resetKey;
  }, [debouncedQuery, limit, resetKey, onPageChange]);

  // รีเซ็ต stack เมื่อกลับหน้า 1 เท่านั้น — อย่าใส่ stack.length ใน deps
  // เพราะ goForward อัปเดต stack ก่อน urlPage (nuqs) จะเปลี่ยน → ถ้ารันตอนนั้นจะล้าง cursor แล้วปุ่มย้อนกลับพัง
  useEffect(() => {
    if (urlPage <= 1) {
      setStack((s) => (s.length > 1 ? [null] : s));
    }
  }, [urlPage]);

  const currentPage = Math.min(Math.max(urlPage, 1), stack.length);
  const requestCursor = stack[currentPage - 1] ?? null;
  const canGoBack = currentPage > 1;

  const goBack = useCallback(() => {
    const nextPage = Math.max(1, currentPage - 1);
    onPageChange(nextPage);
  }, [onPageChange, currentPage]);

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

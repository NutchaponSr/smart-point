"use client";

import { useState, useEffect } from "react";

import { ReviewModal } from "@/modules/cart/ui/components/review-modal";

export const Modals = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <ReviewModal />
    </>
  );
}
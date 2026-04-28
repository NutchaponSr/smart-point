import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export const Pagination = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: Props) => {
  return (
    <div
      className="flex items-center gap-2"
      role="navigation"
      aria-label="Employee list navigation"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canGoBack}
        aria-label="Previous page"
        onClick={onBack}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canGoForward}
        aria-label="Next page"
        onClick={onForward}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </div>
  );
}
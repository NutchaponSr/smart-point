"use client";

import { useState } from "react";
import { GoStarFill, GoStar } from "react-icons/go";
import { cn } from "@/lib/utils";

interface Props {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export const StarPicker = ({
  value = 0,
  onChange,
  disabled,
  className
}: Props) => {
  const [hoverValue, setHoverValue] = useState(0);

  const activeValue = Math.max(value, hoverValue);

  const handleChange = (star: number) => {
    if (disabled) return;
    onChange?.(star);
  };

  return (
    <div className={cn("flex items-center", disabled && "opacity-50", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = activeValue >= star;
        const isHovering = hoverValue >= star;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => handleChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => !disabled && setHoverValue(0)}
            className={cn(
              "p-0.5 transition",
              !disabled && "cursor-pointer"
            )}
          >
            {isFilled ? (
              <GoStarFill className="size-5 text-primary" />
            ) : (
              <GoStar className="size-5" />
            )}
          </button>
        );
      })}
    </div>
  );
};
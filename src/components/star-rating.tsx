import { GoStarFill, GoStar } from "react-icons/go";

import { cn } from "@/lib/utils";

const MAX_RATING = 5;
const MIN_RATING = 0;

interface Props {
  rating: number;
  className?: string;
  iconClassName?: string;
  text?: string;
}

export const StarRating = ({
  rating,
  className,
  iconClassName,
  text
}: Props) => {
  const safeRating = Math.max(MIN_RATING, Math.min(rating, MAX_RATING));
  const filledStars = Math.floor(safeRating);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: MAX_RATING }).map((_, index) => (
        index < filledStars ? (
          <GoStarFill key={index} className={cn("size-4.5", iconClassName)} />
        ) : (
          <GoStar key={index} className={cn("size-4.5", iconClassName)} />
        )
      ))}
      {text && <p className="ml-1">{text}</p>}
    </div>
  );
}
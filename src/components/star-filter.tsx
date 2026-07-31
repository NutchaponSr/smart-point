import { useTranslations } from "next-intl";
import { GoStar, GoStarFill } from "react-icons/go";

interface Props {
  star: number | null;
  onStarChange: (star: number) => void;
}

export const StarFilter = ({ star, onStarChange }: Props) => {
  const t = useTranslations("filter");

  return (
    <fieldset className="flex flex-col border-none gap-2" role="group">
      {Array.from({ length: 4 }, (_, index) => 4 - index).map((rating) => (
        <label
          key={rating}
          className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 w-full"
        >
          <span className="flex shrink-0 items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, index) =>
              index < rating ? (
                <GoStarFill key={index} className="size-5 stroke-[0.25]" />
              ) : (
                <GoStar key={index} className="size-5 stroke-[0.25]" />
              )
            )}
            {t("rating-up")}
          </span>
          <span className="relative inline-flex shrink-0 items-center justify-center ml-auto">
            <input
              type="radio"
              name="star-filter"
              value={rating}
              className="appearance-none size-[calc(1lh+0.125rem)] border-[1.5px] border-border bg-background text-base leading-snug shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 checked:bg-pink rounded-full peer"
              checked={star === rating}
              onChange={() => onStarChange(rating)}
            />
            <span className="pointer-events-none absolute hidden size-[0.65rem] rounded-full bg-black peer-checked:block" />
          </span>
        </label>
      ))}
    </fieldset>
  );
}
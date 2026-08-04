import { ApiOutputs } from "@convex/api";
import { useLocale } from "next-intl";

import { StarRating } from "@/components/star-rating";
import { pickLocalized } from "@/lib/i18n/localized";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

interface Props {
  reviewer: ApiOutputs["reward"]["getOne"]["reviewers"][number];
}

export const Review = ({ reviewer }: Props) => {
  const locale = useLocale();
  const name = pickLocalized(reviewer.reviewer.name, locale);

  return (
    <section className="grid gap-2">
      <span className="flex shrink-0 items-center">
        <StarRating rating={reviewer.stars} />
      </span>
      <p className="text-base m-0">{reviewer.comment}</p>
      <section className="flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-2">
          {name ? (
            <UserAvatar
              name={name}
              className={{
                container: "size-5 after:border-[1.5px]",
                fallback: "text-xs font-normal",
              }}
            />
          ) : null}
          <h5 className="text-sm font-normal leading-[1.3]">{name}</h5>
        </div>
      </section>
    </section>
  );
};
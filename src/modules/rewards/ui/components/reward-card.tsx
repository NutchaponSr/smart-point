import placeholder from "../../../../../public/placeholder.png";

import { Doc } from "../../../../../convex/functions/_generated/dataModel";
import { GoBookmarkFill } from "react-icons/go";

interface Props {
  reward: Doc<"reward">;
}

export const RewardCard = ({ reward }: Props) => {
  return (
    <article className="relative flex flex-col sm:flex-row rounded-xs border-2 border-border bg-background transition-all duration-150 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] select-none">
      <figure className="aspect-square overflow-hidden bg-(image:--product-cover-placeholder) rounded-l-xs bg-cover [&_img]:size-full [&_img]:object-cover border-b-2 sm:border-b-0 sm:border-r-2">
        <img src={reward?.image || placeholder.src} alt={reward.name} loading="lazy" className="sm:size-40! size-full object-contain" />
      </figure>
      <section className="flex flex-1 flex-col sm:flex-2">
        <header className="flex flex-1 flex-col gap-3 border-b-2 border-border p-4">
          <h3 className="text-lg font-normal leading-[1.3] truncate">{reward.name}</h3>
          {!!reward.description && (
            <small className="text-muted-foreground truncate sm:block hidden text-sm">{reward.description}</small>
          )}
        </header>
        <footer className="flex h-16">
          <div className="grow p-4">
            <div className="relative grid border-[1.5px] border-border w-fit">
              <div className="bg-pink-300 px-2 py-1 text-accent-" itemProp="point" content={String(reward.pointCost)}>
                {reward.pointCost}
              </div>
            </div>
          </div>
          <div role="button" className="flex items-center justify-center p-4 border-border border-l-2 size-16">
            <GoBookmarkFill className="size-6" />
          </div>
        </footer>
      </section>
    </article>
  );
}
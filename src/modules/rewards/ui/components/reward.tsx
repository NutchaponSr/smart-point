import type { FC, Ref } from "react";

import placeholder from "../../../../../public/placeholder.png";

import { GoStarFill } from "react-icons/go";

import { Doc } from "../../../../../convex/functions/_generated/dataModel";
import { ApiOutputs } from "@convex/api";

export type RewardCardVariant = "list" | "grid" | "card";

type VariantProps = {
  reward: ApiOutputs["reward"]["getMany"]["page"][0];
  ref?: Ref<HTMLElement>;
};

const RewardList: FC<VariantProps> = ({ reward, ref }) => {
  return (
    <article
      ref={ref}
      className="relative flex select-none flex-col rounded-xs border-2 border-border bg-background transition-all duration-150 hover:-translate-x-[4px] hover:-translate-y-[4px] hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,0_0_#0000,.25rem_.25rem_0_rgba(0,0,0,1)] sm:flex-row"
    >
      <figure className="aspect-square overflow-hidden rounded-l-xs border-b-2 border-border bg-(image:--product-cover-placeholder) bg-cover sm:border-r-2 sm:border-b-0 [&_img]:size-full [&_img]:object-cover">
        <img
          src={reward?.image || placeholder.src}
          alt={reward.name}
          loading="lazy"
          className="size-full object-contain sm:size-40!"
        />
      </figure>
      <section className="flex flex-1 flex-col sm:flex-2">
        <header className="flex flex-1 flex-col gap-3 border-b-2 border-border p-4">
          <h3 className="truncate text-lg font-normal leading-[1.3]">{reward.name}</h3>
          {!!reward.description && (
            <small className="hidden truncate text-sm text-muted-foreground sm:block">
              {reward.description}
            </small>
          )}
        </header>
        <footer className="flex h-16">
          <div className="grow p-4">
            <div className="relative grid w-fit border-[1.5px] border-border">
              <div
                className="bg-pink px-2 py-1 text-accent-"
                itemProp="point"
                content={String(reward.pointCost)}
              >
                {reward.pointCost}
              </div>
            </div>
          </div>
        </footer>
      </section>
    </article>
  );
};


const RewardGrid: FC<VariantProps> = ({ reward, ref }) => {
  return (
    <article
      ref={ref}
      className="relative flex flex-col rounded-xs border-2 border-border bg-background transition-all duration-150 lg:flex-row hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,0_0_#0000,.25rem_.25rem_0_rgba(0,0,0,1)]"
    >
      <figure className="aspect-square overflow-hidden rounded-t-xs border-b-2 border-border bg-(image:--product-cover-placeholder) bg-cover lg:rounded-l-xs lg:rounded-tr-none lg:border-r-2 lg:border-b-0 lg:w-[60%] [&_img]:size-full [&_img]:object-cover">
        <img
          src={reward?.image || placeholder.src}
          alt={reward.name}
          loading="lazy"
        />
      </figure>
      <section className="flex flex-1 flex-col lg:gap-8 lg:px-6 lg:py-4 lg:w-[40%]">
        <header className="flex flex-1 flex-col gap-3 border-b-2 border-border p-4 lg:border-b-0 lg:p-0">
          <a href={`/rewards/${reward._id}`} className="no-underline before:absolute before:content-[''] before:inset-0">
            <h2 className="overflow-hidden text-[20px] font-normal leading-[1.3] line-clamp-3">{reward.name}</h2>
          </a>
          <small className="hidden text-muted-foreground lg:line-clamp-4 lg:block">{reward.description}</small>
        </header>
        <footer className="flex divide-x divide-border items-center lg:divide-x-0">
          <div className="flex-1 p-4 lg:p-0">
            <div className="relative grid w-fit border-[1.5px] border-border">
              <div
                className="bg-pink px-2 py-1 text-accent-"
                itemProp="point"
                content={String(reward.pointCost)}
              >
                {reward.pointCost}
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-0">
            <div className="flex shrink-0 items-center gap-1">
              <GoStarFill className="size-4.5" />
              <span className="text-base font-no">{reward.totalStars}</span>
            </div>
          </div>
        </footer>
      </section>
    </article>
  );
};

const RewardCard: FC<VariantProps> = ({ reward, ref }) => {
  return (
    <article
      ref={ref}
      className="relative flex flex-col rounded-xs border-2 border-border bg-background transition-all duration-150 hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,0_0_#0000,.25rem_.25rem_0_rgba(0,0,0,1)]"
    >
      <figure className="aspect-square overflow-hidden rounded-t-xs border-b-2 border-border bg-(image:--product-cover-placeholder) bg-cover [&_img]:size-full [&_img]:object-cover">
        <img
          src={reward?.image || placeholder.src}
          alt={reward.name}
          loading="lazy"
        />
      </figure>
      <header className="flex flex-1 flex-col gap-3 border-b-2 border-border p-4">
        <a href={`/rewards/${reward._id}`} className="no-underline before:absolute before:content-[''] before:inset-0">
          <h2 className="line-clamp-4 lg:text-xl">{reward.name}</h2>
        </a>
        <div className="flex shrink-0 items-center gap-1">
          <GoStarFill className="size-4.5" />
          <span className="text-base font-no">{reward.totalStars}</span>
        </div>
      </header>
      <footer className="flex divide-x divide-border">
        <div className="flex-1 p-4">
          <div className="relative grid w-fit border-[1.5px] border-border">
            <div
              className="bg-pink px-2 py-1 text-accent-"
              itemProp="point"
              content={String(reward.pointCost)}
            >
              {reward.pointCost}
            </div>
          </div>
        </div>
      </footer>
    </article>
  );
};

const VARIANTS = {
  list: RewardList,
  grid: RewardGrid,
  card: RewardCard,
} as const satisfies Record<RewardCardVariant, FC<VariantProps>>;

interface Props {
  reward: ApiOutputs["reward"]["getMany"]["page"][0];
  ref?: Ref<HTMLElement>;
  variant: RewardCardVariant;
}

export const Reward = ({ reward, variant, ref }: Props) => {
  const Component = VARIANTS[variant];
  return <Component reward={reward} ref={ref} />;
};

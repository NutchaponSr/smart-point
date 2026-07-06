import { IconType } from "react-icons";

import { cva, VariantProps } from "class-variance-authority";

export const iconColor = cva("size-5", {
  variants: {
    color: {
      pink: "text-pink",
      orange: "text-orange",
      purple: "text-purple",
    },
  },
  defaultVariants: {
    color: "pink",
  },
});

interface Props extends VariantProps<typeof iconColor> {
  title: string;
  value: number;
  icon: IconType;
}

export const InfoCard = ({
  title,
  value,
  color,
  icon: Icon,
}: Props) => {
  return (
    <section className="text-4xl leading-tight p-6 border-2 border-border rounded-xs grid content-between gap-2 bg-background">
      <h2 className="flex gap-2 text-base items-center">
        <Icon className={iconColor({ color })} />
        {title}
      </h2>
      <div className="overflow-hidden wrap-break-word">
        <span className="text-4xl">{value}</span>
      </div>
    </section>
  );
}
import { cva, VariantProps } from "class-variance-authority";

export const dotColor = cva("size-5 rounded-full", {
  variants: {
    color: {
      pink: "bg-pink",
      orange: "bg-orange",
      purple: "bg-purple",
    },
  },
  defaultVariants: {
    color: "pink",
  },
});

interface Props extends VariantProps<typeof dotColor> {
  title: string;
  value: number;
}

export const InfoCard = ({
  title,
  value,
  color,
}: Props) => {
  return (
    <section className="text-4xl leading-tight p-8 border-2 border-border rounded-xs grid content-between gap-2 bg-background">
      <h2 className="flex gap-2 text-base items-center">
        <div className={dotColor({ color })} />
        {title}
      </h2>
      <div className="overflow-hidden wrap-break-word">
        <span className="text-4xl">{value}</span>
      </div>
    </section>
  );
}
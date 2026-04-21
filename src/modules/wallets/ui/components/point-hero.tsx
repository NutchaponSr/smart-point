import Link from "next/link";

import { BsClock } from "react-icons/bs";
import { RiCopperCoinFill } from "react-icons/ri";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export const pointHeroVariants = cva("group/card flex flex-col gap-1 overflow-hidden rounded-xs bg-card py-4 border-2 border-border ring-0 h-max", {
  variants: {
    variant: {
      purple: "bg-purple",
      orange: "bg-orange", 
      pink: "bg-pink",
      blueTint: "bg-[#D6E4ED]"
    },
  },
  defaultVariants: {
    variant: "purple",
  },
});

interface Props extends VariantProps<typeof pointHeroVariants> {
  title: string;
  points: number;
  footer?: React.ReactNode;
}

export const PointHero = ({ 
  variant,
  title,
  points,
  footer,
}: Props) => {
  return (
    <Card className={cn(pointHeroVariants({ variant }))}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3 flex flex-row items-center gap-2">
        <RiCopperCoinFill className="size-10" />
        <h2 className="text-4xl font-bold tracking-tight">{points}</h2>
      </CardContent>
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
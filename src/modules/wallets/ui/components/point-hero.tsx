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

export const pointHeroVariants = cva("group/card flex flex-col gap-1 overflow-hidden rounded-xs bg-card py-4 text-sm ring-2 ring-ring has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t *:[img:last-child]:rounded-b", {
  variants: {
    variant: {
      pink: "bg-pink",
      orange: "bg-orange", 
    },
  },
  defaultVariants: {
    variant: "pink",
  },
});

interface Props extends VariantProps<typeof pointHeroVariants> {
  title: string;
  points: number;
}

export const PointHero = ({ 
  variant,
  title,
  points,
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
      <CardFooter>
        <div className="flex flex-row items-center justify-between w-full">
          <Link href="/wallets" className="hover:underline">View history</Link>
          <div className="flex items-center gap-2">
            <BsClock className="size-4" />
            <span>Last updated 12 hours ago</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
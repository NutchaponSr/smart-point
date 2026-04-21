import { Button } from "@/components/ui/button";
import { RiCopperCoinFill } from "react-icons/ri";

interface Props {
  title: string;
  amount: number;
}

export const BudgetCard = ({
  title,
  amount,
}: Props) => {
  return (
    <article className="text-4xl leading-tight p-8 border-2 border-border rounded-xs flex flex-col gap-2 bg-orange">
      <h2 className="flex gap-2 text-base leading-tight ">
        {title}
      </h2>
      <div className="overflow-hidden wrap-break-word flex items-center gap-2">
        <RiCopperCoinFill className="size-9" />
        <span className="text-4xl font-bold">
          {amount}
        </span>
      </div>
      <Button variant="secondary">
        แลกของรางวัล
      </Button>
    </article>
  );
}
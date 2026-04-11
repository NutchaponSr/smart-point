import { RiCopperCoinFill } from "react-icons/ri";

interface Props {
  totalPoints: number;
}

export const CheckoutSummary = ({ totalPoints }: Props) => {
  return (
    <div role="list" className="rounded-xs border-2 border-border bg-background">
      {/* TODO: Discount code */}
      <footer className="grid gap-4 p-4 sm:px-5">
        <div className="grid grid-flow-col justify-between gap-4">
          <h4 className="inline-flex flex-wrap gap-2 text-base font-bold sm:text-xl">
            รวม
          </h4>
          <div className="text-base sm:text-lg font-bold flex items-center gap-1">
            <RiCopperCoinFill className="size-5" />
            {totalPoints}
          </div>
        </div>
      </footer>
    </div>
  );
};
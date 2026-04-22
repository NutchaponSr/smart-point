import { ChevronRightIcon } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const Accordion = ({ title, children }: Props) => {
  return (
    <details className="group/details flex-wrap items-center justify-between gap-4 p-4 block">
      <summary className="flex cursor-pointer items-center [&::-webkit-details-marker]:hidden [&::marker]:hidden grow group-open/details:mb-2">
        {title}
        <ChevronRightIcon className="col-start-2 ml-auto size-4.5 shrink-0 group-open/details:rotate-90" />
      </summary>
      <fieldset className="flex flex-col border-none gap-2 grow basis-0">
        {children}
      </fieldset>
    </details>
  );
}
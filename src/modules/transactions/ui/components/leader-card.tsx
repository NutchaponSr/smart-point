import { RiMedalFill } from "react-icons/ri";

import { cn } from "@/lib/utils";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

interface Props {
  name: string;
  src: string;
  medalColor: string;
  score: number;
}

export const LeaderCard = ({ name, src, medalColor, score }: Props) => {
  return (
    <section className="text-4xl leading-tight p-8 border-2 border-border rounded-xs grid content-between gap-2 bg-background">
      <div className="flex gap-2 items-center justify-between">
        <h2 className="flex gap-2 text-lg items-center">
          <UserAvatar 
            name={name} 
            src={src}
            className={{
              container: "size-6 after:border-[1.5px]",
              fallback: "text-xs font-normal",
            }} 
          />
          {name}
        </h2>
        <span className="flex items-center justify-center">
          <RiMedalFill className={cn("size-8", medalColor)} />
        </span>
      </div>
      <div className="overflow-hidden wrap-break-word">
        <span className="text-4xl">{score}</span>
      </div>
    </section>
  );
}
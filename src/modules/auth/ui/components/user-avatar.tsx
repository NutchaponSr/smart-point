import { cn } from "@/lib/utils";
import { getAvatarInitialFromName } from "@/lib/name-initial";

import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";

interface Props {
  src?: string;
  name: string;
  className?: {
    container?: string;
    fallback?: string;
  }
}

export const UserAvatar = ({ 
  src,
  name,
  className 
}: Props) => {
  return (
    <Avatar className={cn(className?.container)}>
      {/* {src && (
        <AvatarImage 
          src={src}
          alt={name}
        />
      )} */}
      <AvatarFallback className={cn(className?.fallback)}>
        {getAvatarInitialFromName(name) }
      </AvatarFallback>
    </Avatar>
  );
}
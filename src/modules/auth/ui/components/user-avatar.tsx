import { cn } from "@/lib/utils";

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
      {src && (
        <AvatarImage 
          src={src}
          alt={name}
        />
      )}
      <AvatarFallback className={cn(className?.fallback)}>
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
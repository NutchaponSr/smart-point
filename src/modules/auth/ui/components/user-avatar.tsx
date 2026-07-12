import { cn } from "@/lib/utils";
import { getAvatarInitialFromName } from "@/lib/name-initial";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const DUOLINGO_AVATAR_COLORS = [
  { bg: "bg-[#1cb0f6]", ring: "ring-[#1899d6]", shadow: "shadow-[0_3px_0_#1899d6]" },
  { bg: "bg-[#58cc02]", ring: "ring-[#58a700]", shadow: "shadow-[0_3px_0_#58a700]" },
  { bg: "bg-[#ff9600]", ring: "ring-[#e08600]", shadow: "shadow-[0_3px_0_#e08600]" },
  { bg: "bg-[#ce82ff]", ring: "ring-[#a855f7]", shadow: "shadow-[0_3px_0_#a855f7]" },
  { bg: "bg-[#ff4b4b]", ring: "ring-[#ea2b2b]", shadow: "shadow-[0_3px_0_#ea2b2b]" },
  { bg: "bg-[#ffc800]", ring: "ring-[#e6b400]", shadow: "shadow-[0_3px_0_#e6b400]" },
  { bg: "bg-[#2dd4bf]", ring: "ring-[#14b8a6]", shadow: "shadow-[0_3px_0_#14b8a6]" },
] as const;

function getAvatarColorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DUOLINGO_AVATAR_COLORS[Math.abs(hash) % DUOLINGO_AVATAR_COLORS.length]!;
}

interface Props {
  src?: string;
  name: string;
  className?: {
    container?: string;
    fallback?: string;
  };
}

export const UserAvatar = ({
  src,
  name,
  className,
}: Props) => {
  const colors = getAvatarColorFromName(name);

  return (
    <Avatar
      className={cn(
        "after:border-0 ring-2 ring-inset",
        colors.ring,
        colors.shadow,
        className?.container,
      )}
    >
      {src && (
        <AvatarImage
          src={src}
          alt={name}
          className="ring-2 ring-inset ring-white/20"
        />
      )}
      <AvatarFallback
        className={cn(
          colors.bg,
          "font-bold text-white",
          className?.fallback,
        )}
      >
        {getAvatarInitialFromName(name)}
      </AvatarFallback>
    </Avatar>
  );
};

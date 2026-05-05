"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BsDoorOpen } from "react-icons/bs";

import { authClient } from "@/lib/convex/auth-client";
import { getAvatarInitialFromName } from "@/lib/name-initial";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./user-avatar";

export const UserButton = () => {
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const fallback = useMemo(
    () => getAvatarInitialFromName(session?.user?.name ?? ""),
    [session?.user?.name],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div role="button" className="flex w-full items-center justify-center h-full hover:bg-white border-black bg-pink p-4 text-2xl lg:hover:text-black no-underline transition-colors duration-200 hover:text-black max-w-20 min-w-20 cursor-pointer max-h-20 min-h-20">
          {fallback}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={4} side="bottom" sideOffset={6}>
        <DropdownMenuItem 
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.refresh();
                },
              }
            })
          }}
        >
          <BsDoorOpen className="size-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const UserButtonDropdown = () => {
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const fallback = useMemo(
    () => getAvatarInitialFromName(session?.user?.name ?? ""),
    [session?.user?.name],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div role="button" className="flex items-center gap-2 w-full px-6 py-4">
          <UserAvatar 
            name={fallback}
            className={{
              container: "size-6",
              fallback: "text-sm font-medium rounded-full!",
            }}
          />
          <span className="text-base text-white font-normal">{session?.user?.name}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={4} side="bottom" sideOffset={6}>
        <DropdownMenuItem
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              }
            })
          }}
        >
          <BsDoorOpen className="size-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
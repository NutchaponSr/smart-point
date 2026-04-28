"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BsDoorOpen } from "react-icons/bs";

import { authClient } from "@/lib/convex/auth-client";

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

  const fallback = useMemo(() => {
    const leadingVowels = /^[เแโใไ]/
    const prefixes = ["นาย", "นางสาว", "นาง"]

    const getFallback = (str: string) => {
      if (!str) return "?"

      // ตัด prefix ออกก่อน
      let cleaned = str.trim()
      for (const prefix of prefixes) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.slice(prefix.length).trim()
          break
        }
      }

      // หาอักษรแรกที่ไม่ใช่สระนำ
      for (const ch of cleaned) {
        if (!leadingVowels.test(ch)) {
          return ch.toUpperCase()
        }
      }
      return cleaned.charAt(0).toUpperCase()
    }

    return getFallback(session?.user?.name || "")
  }, [session?.user?.name])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div role="button" className="flex w-full items-center justify-center h-full hover:bg-white border-black bg-pink p-4 text-2xl lg:hover:text-black no-underline transition-colors duration-200 hover:text-black max-w-20 min-w-20 cursor-pointer max-h-20 min-h-20">
          {fallback.charAt(0).toUpperCase()}
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

export const UserButtonDropdown = () => {
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const fallback = useMemo(() => {
    const leadingVowels = /^[เแโใไ]/
    const prefixes = ["นาย", "นางสาว", "นาง"]

    const getFallback = (str: string) => {
      if (!str) return "?"

      // ตัด prefix ออกก่อน
      let cleaned = str.trim()
      for (const prefix of prefixes) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.slice(prefix.length).trim()
          break
        }
      }

      // หาอักษรแรกที่ไม่ใช่สระนำ
      for (const ch of cleaned) {
        if (!leadingVowels.test(ch)) {
          return ch.toUpperCase()
        }
      }
      return cleaned.charAt(0).toUpperCase()
    }

    return getFallback(session?.user?.name || "")
  }, [session?.user?.name])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div role="button" className="flex items-center gap-2">
          <UserAvatar 
            name={session?.user?.name || ""}
            src={session?.user?.image || undefined}
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
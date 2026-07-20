"use client";

import Image from "next/image";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";

import { authClient } from "@/lib/convex/auth-client";
import { cn } from "@/lib/utils";
import {
  AVATAR_IDS,
  avatarPath,
  isAllowedAvatarPath,
  type AvatarId,
} from "@convex/avatars";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PLACEHOLDER_BG = "/placeholder.png";

function formatJoinedAt(createdAt: Date | string | number | undefined) {
  if (createdAt == null) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `เข้าร่วมเมื่อ ${format(date, "LLLL yyyy", { locale: th })}`;
}

export function AvatarProfileHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticImage, setOptimisticImage] = useState<string | null>(null);

  const sessionImage = isAllowedAvatarPath(user?.image) ? user.image : null;
  const currentSrc = optimisticImage ?? sessionImage;
  const hasAvatar = Boolean(currentSrc);
  const joinedLabel = formatJoinedAt(user?.createdAt);

  useEffect(() => {
    if (optimisticImage != null && sessionImage === optimisticImage) {
      setOptimisticImage(null);
    }
  }, [optimisticImage, sessionImage]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setIsSaving(false);
    }
  };

  const onSelectAvatar = async (id: AvatarId) => {
    const image = avatarPath(id);
    if (image === currentSrc) {
      setOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await authClient.updateUser({ image });
      if (result.error) {
        toast.error("เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ");
        return;
      }
      setOptimisticImage(image);
      toast.success("เปลี่ยนรูปโปรไฟล์สำเร็จ");
      setOpen(false);
    } catch {
      toast.error("เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="grid gap-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-md border-2 border-dashed",
            hasAvatar && "bg-white",
          )}
        >
          {!hasAvatar ? (
            <Image
              src={PLACEHOLDER_BG}
              alt=""
              fill
              priority
              sizes="(max-width: 988px) 100vw, 988px"
              className="object-cover object-center"
              aria-hidden
            />
          ) : null}

          <button
            type="button"
            aria-label="เปลี่ยนรูปโปรไฟล์"
            onClick={() => setOpen(true)}
            className="relative flex h-[100px] w-full cursor-pointer items-end justify-center sm:h-[120px]"
          >
            {currentSrc ? (
              <Image
                src={currentSrc}
                alt={user?.name ?? "avatar"}
                width={200}
                height={200}
                priority
                className="mb-[-12px] size-[80px] rounded-2xl object-contain sm:size-[100px]"
              />
            ) : null}
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="เปลี่ยนรูปโปรไฟล์"
            onClick={() => setOpen(true)}
            className="absolute top-3 right-3 z-10 size-10 rounded-full border-2 border-[#e5e5e5] bg-white text-[#3c3c3c] shadow-none hover:bg-[#f7f7f7]"
          >
            <PencilIcon className="size-4" strokeWidth={2.5} />
          </Button>
        </div>

        <div className="grid gap-0.5">
          <h2 className="text-2xl font-bold text-[#3c3c3c] sm:text-3xl">
            {user?.name ?? "—"}
          </h2>
          {user?.username ? (
            <p className="text-base font-medium text-[#777]">#{user.username}</p>
          ) : null}
          {joinedLabel ? (
            <p className="text-sm text-[#777]">{joinedLabel}</p>
          ) : null}
        </div>
      </section>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#3c3c3c]">
              เลือกรูปโปรไฟล์
            </DialogTitle>
            <DialogDescription className="text-[#777]">
              เลือกตัวละครสัตว์ที่คุณชอบ — เปลี่ยนได้ทุกเมื่อ ไม่จำกัดครั้ง
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {AVATAR_IDS.map((id) => {
              const src = avatarPath(id);
              const selected = currentSrc === src;

              return (
                <button
                  key={id}
                  type="button"
                  disabled={isSaving}
                  onClick={() => onSelectAvatar(id)}
                  className={cn(
                    "flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 bg-[#f7f7f7] p-2 transition-colors",
                    isSaving && "cursor-not-allowed opacity-60",
                    selected
                      ? "border-[#84d8ff] bg-[#ddf4ff]"
                      : "border-[#e5e5e5] hover:bg-[#efefef]",
                  )}
                >
                  <Image
                    src={src}
                    alt={id}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

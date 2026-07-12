"use client";

import { X } from "lucide-react";
import { GoPlus } from "react-icons/go";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { REWARD_IMAGE_MAX_BYTES } from "@/modules/rewards/image-limits";

type ImageUploadFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name?: string;
  disabled?: boolean;
};

function formatMaxSizeLabel() {
  const mb = REWARD_IMAGE_MAX_BYTES / 1_048_576;
  return `${mb} MB`;
}

export const ImageUpload = ({
  value,
  onChange,
  onBlur,
  name,
  disabled,
}: ImageUploadFieldProps) => {
  const crpc = useCRPC();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const generateUpload = useMutation(
    crpc.upload.generateUploadUrl.mutationOptions(),
  );

  const { data: previewUrl } = useQuery({
    ...crpc.upload.getFileUrl.queryOptions({ storageId: value }),
    enabled: Boolean(value),
  });

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("อัปโหลดได้เฉพาะรูปภาพ");
      return;
    }
    if (file.size > REWARD_IMAGE_MAX_BYTES) {
      setLocalError(`ขนาดไฟล์ต้องไม่เกิน ${formatMaxSizeLabel()}`);
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUpload.mutateAsync(undefined);
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) {
        setLocalError("อัปโหลดไม่สำเร็จ ลองอีกครั้ง");
        return;
      }
      const body = (await res.json()) as { storageId?: string };
      if (!body.storageId) {
        setLocalError("อัปโหลดไม่สำเร็จ: ไม่พบ storageId");
        return;
      }
      onChange(body.storageId);
    } catch {
      setLocalError("อัปโหลดไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setIsUploading(false);
    }
  };

  if (previewUrl) {
    return (
      <figure
        aria-label="rewar image"
        className="group relative col-span-full overflow-hidden rounded-t-xs border-b-2 border-border bg-cover group"
      >
        <div className="flex h-full snap-x snap-mandatory items-center overflow-x-scroll overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mt-0! flex min-h-px flex-[1_0_100%] snap-start justify-center border-0! p-0!">
            <img
              src={previewUrl}
              alt="reward image"
              className="w-full"
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="absolute inset-e-1 top-1 h-8 w-8 rounded-full bg-background p-0 group-hover:opacity-100 opacity-0 transition-opacity"
            onClick={() => onChange("")}
            disabled={disabled || isUploading}
            aria-label="ลบรูป"
          >
            <X className="size-4" />
          </Button>
        </div>
      </figure>
    );
  }

  return (
    <div
      className={cn(
        "grid justify-items-center gap-3 rounded-xs border-2 border-dashed border-border bg-background p-6 text-center [&>.icon]:text-xl",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input 
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        onBlur={onBlur}
        onChange={onPick}
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        className="bg-pink"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        <GoPlus className="size-5 stroke-[0.25]" />
        {isUploading ? "กำลังอัปโหลด…" : "อัปโหลดรูปภาพ"}
      </Button>
      <small className="text-sm text-muted-foreground">
        รูปภาพ: สูงสุด {formatMaxSizeLabel()} — แนะนำอย่างน้อย 1280×720px, 72 DPI
      </small>
      {localError ? (
        <small className="text-sm text-destructive">{localError}</small>
      ) : null}
    </div>
  );
};

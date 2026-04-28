"use client";

import { ApiOutputs } from "@convex/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useCRPC } from "@/lib/convex/crpc";
import {
  Dialog,
  DialogContent,
  DialogHidden,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categories } from "../../constants";

interface Props {
  event: ApiOutputs["activity"]["list"]["page"][0];
}

const IMAGE_MAX_BYTES = 1_048_576;
const PDF_MAX_BYTES = 5_242_880;

function formatBytesToMb(bytes: number) {
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}

export const AttachButton = ({ event }: Props) => {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(
    crpc.upload.generateUploadUrl.mutationOptions(),
  );
  const attachEvidence = useMutation(
    crpc.activity.attachEvidence.mutationOptions(),
  );

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setLocalError("รองรับเฉพาะไฟล์รูปภาพหรือ PDF");
      return;
    }

    const maxBytes = isPdf ? PDF_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > maxBytes) {
      setLocalError(
        isPdf
          ? `ไฟล์ PDF ต้องไม่เกิน ${formatBytesToMb(PDF_MAX_BYTES)}`
          : `รูปภาพต้องไม่เกิน ${formatBytesToMb(IMAGE_MAX_BYTES)}`,
      );
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl.mutateAsync(undefined);
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!uploadResponse.ok) {
        setLocalError("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
        return;
      }

      const uploadBody = (await uploadResponse.json()) as { storageId?: string };
      if (!uploadBody.storageId) {
        setLocalError("อัปโหลดไม่สำเร็จ: ไม่พบ storageId");
        return;
      }

      await attachEvidence.mutateAsync({
        activityId: String(event._id),
        storageId: uploadBody.storageId,
        fileName: file.name,
      });

      toast.success("แนบหลักฐานเรียบร้อย");
      await queryClient.invalidateQueries({
        queryKey: crpc.activity.list.queryKey(),
      });
    } catch {
      setLocalError("ไม่สามารถแนบหลักฐานได้ กรุณาลองใหม่");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        className="rounded-xs border-2 border-border bg-background px-2 py-1 text-sm font-normal"
        disabled={isUploading}
      >
        แนบหลักฐาน
      </DialogTrigger>
      <DialogContent>
        <DialogHidden />
        <div className="flex flex-col gap-4 py-2 px-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-start gap-2">
              <p className="text-sm md:text-base font-bold whitespace-pre-wrap wrap-break-word">
                {event.name}
              </p>
              <div className="bg-pink border-[1.5px] border-border px-2 py-1 text-sm font-normal">
                {event.point}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground rounded-lg bg-muted px-2 py-1">
                <div className="size-2 rounded-full bg-orange shrink-0" />
                {categories[event.category].th}
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="sr-only"
            onChange={onPick}
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xs border-2 border-border bg-pink px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isUploading ? "กำลังอัปโหลด..." : "เลือกไฟล์หลักฐาน"}
          </button>
          <p className="text-xs text-muted-foreground">
            รองรับรูปภาพไม่เกิน {formatBytesToMb(IMAGE_MAX_BYTES)} และ PDF ไม่เกิน{" "}
            {formatBytesToMb(PDF_MAX_BYTES)}
          </p>
          {event.myParticipation.evidenceFileName ? (
            <p className="text-xs text-muted-foreground">
              แนบล่าสุด: {event.myParticipation.evidenceFileName}
            </p>
          ) : null}
          {localError ? (
            <p className="text-sm text-destructive">{localError}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
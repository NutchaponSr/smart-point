"use client";

import CoinIcon from "../../../../../public/coin.svg";

import { ApiOutputs } from "@convex/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  BsCheckCircleFill,
  BsCloudUploadFill,
} from "react-icons/bs";

import { useCRPC } from "@/lib/convex/crpc";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
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

const PDF_MAX_BYTES = 5 * 1024 * 1024;

const categoryBadgeClassName: Record<
  ApiOutputs["activity"]["list"]["page"][0]["category"],
  string
> = {
  external: "bg-[#ddf4ff] text-[#1899d6]",
  internal: "bg-[#d7ffb8] text-[#58a700]",
  internal_bu: "bg-[#f3e0ff] text-[#a568cc]",
  specials_point: "bg-[#ffe8c2] text-[#cc7800]",
};

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

  const evidenceFileName = event.myParticipation.evidenceFileName;
  const points = event.myParticipation.pointAwarded ?? event.point;

  const onPick: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setLocalError("รองรับเฉพาะไฟล์ PDF");
      return;
    }

    if (file.size > PDF_MAX_BYTES) {
      setLocalError(`ไฟล์ PDF ต้องไม่เกิน ${formatBytesToMb(PDF_MAX_BYTES)}`);
      return;
    }

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl.mutateAsync(undefined);
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
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
        type="button"
        disabled={isUploading}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "w-full tracking-wide",
        )}
      >
        {isUploading ? "กำลังอัปโหลด..." : "แนบหลักฐาน"}
      </DialogTrigger>
      <DialogContent className="overflow-hidden rounded-md border-2 border-[#e5e5e5] p-0 sm:max-w-md gap-0 shadow-none ring-0">
        <DialogHidden />

        <header className="border-b-2 border-[#e5e5e5] bg-[#ddf4ff] px-4 py-4">
          <h2 className="text-base font-bold text-[#1cb0f6]">แนบหลักฐาน</h2>
          <p className="mt-1 text-sm font-medium text-[#777]">
            อัปโหลดไฟล์ PDF เพื่อยืนยันการเข้าร่วม
          </p>
        </header>

        <div className="flex flex-col gap-3 border-b-2 border-[#e5e5e5] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-bold",
                categoryBadgeClassName[event.category],
              )}
            >
              {categories[event.category].th}
            </span>
            <span className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[#1cb0f6] font-semibold">
              <img
                src={CoinIcon.src}
                alt="Coin"
                className="size-5 fill-current"
              />
              {points}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#4b4b4b] break-all">
            {event.name}
          </h3>
        </div>

        <div className="px-4 py-4">
          {evidenceFileName ? (
            <div className="flex items-start gap-2.5 rounded-md border-2 border-[#e5e5e5] bg-[#d7ffb8] px-3 py-3">
              <BsCheckCircleFill className="mt-0.5 size-4 shrink-0 text-[#58a700]" />
              <div className="min-w-0 grid gap-0.5">
                <p className="text-sm font-bold text-[#58a700]">แนบหลักฐานแล้ว</p>
                <p className="truncate text-sm font-medium text-[#4b4b4b]">
                  {evidenceFileName}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid justify-items-center gap-3 rounded-md border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-6 text-center">
              <BsCloudUploadFill className="size-10 text-[#afafaf]" />
              <div className="grid gap-1">
                <h3 className="text-base font-bold text-[#4b4b4b]">
                  ยังไม่มีไฟล์หลักฐาน
                </h3>
                <p className="text-sm text-[#777]">
                  รองรับเฉพาะไฟล์ PDF ขนาดไม่เกิน {formatBytesToMb(PDF_MAX_BYTES)}
                </p>
              </div>
            </div>
          )}

          {localError ? (
            <p className="mt-3 text-sm font-semibold text-rose-500">
              {localError}
            </p>
          ) : null}
        </div>

        <footer className="border-t-2 border-[#e5e5e5] bg-white p-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={onPick}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full tracking-wide"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading
              ? "กำลังอัปโหลด..."
              : evidenceFileName
                ? "เปลี่ยนไฟล์หลักฐาน"
                : "เลือกไฟล์หลักฐาน"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

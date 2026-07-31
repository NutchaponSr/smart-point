"use client";

import RubyIcon from "../../../../../public/ruby.svg";

import { ApiOutputs } from "@convex/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BsCheckCircleFill,
  BsCloudUploadFill,
  BsFileEarmarkPdfFill,
} from "react-icons/bs";

import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
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
import {
  EVIDENCE_ACCEPT,
  EVIDENCE_IMAGE_MAX_BYTES,
  EVIDENCE_PDF_MAX_BYTES,
  formatEvidenceMaxSize,
  formatFileSize,
  getEvidenceFileKind,
} from "../../evidence-limits";

interface Props {
  event: ApiOutputs["activity"]["list"]["page"][0];
}

const categoryBadgeClassName: Record<
  ApiOutputs["activity"]["list"]["page"][0]["category"],
  string
> = {
  external: "bg-[#ddf4ff] text-[#1899d6]",
  internal: "bg-[#d7ffb8] text-[#58a700]",
  internal_bu: "bg-[#f3e0ff] text-[#a568cc]",
  specials_point: "bg-[#ffe8c2] text-[#cc7800]",
};

function validateEvidenceFile(file: File): string | null {
  const kind = getEvidenceFileKind(file);
  if (!kind) {
    return "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) หรือ PDF";
  }

  const maxBytes =
    kind === "pdf" ? EVIDENCE_PDF_MAX_BYTES : EVIDENCE_IMAGE_MAX_BYTES;
  if (file.size > maxBytes) {
    return kind === "pdf"
      ? `ไฟล์ PDF ต้องไม่เกิน ${formatEvidenceMaxSize(EVIDENCE_PDF_MAX_BYTES)}`
      : `รูปภาพต้องไม่เกิน ${formatEvidenceMaxSize(EVIDENCE_IMAGE_MAX_BYTES)}`;
  }

  return null;
}

export const AttachButton = ({ event }: Props) => {
  const locale = useLocale();
  const eventName = pickLocalized(event.name, locale);
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateUploadUrl = useMutation(
    crpc.upload.generateUploadUrl.mutationOptions(),
  );
  const attachEvidence = useMutation(
    crpc.activity.attachEvidence.mutationOptions(),
  );

  const evidenceFileName = event.myParticipation.evidenceFileName;
  const evidenceType = event.myParticipation.evidenceType;
  const hasEvidence = !!evidenceFileName;
  const points = event.myParticipation.pointAwarded ?? event.point;
  const pendingKind = pendingFile ? getEvidenceFileKind(pendingFile) : null;

  useEffect(() => {
    if (!pendingFile || pendingKind !== "image") {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile, pendingKind]);

  const resetPending = () => {
    setPendingFile(null);
    setLocalError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetPending();
    }
  };

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const error = validateEvidenceFile(file);
    if (error) {
      setLocalError(error);
      return;
    }

    setPendingFile(file);
  };

  const onConfirm = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setLocalError(null);
    try {
      const postUrl = await generateUploadUrl.mutateAsync(undefined);
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": pendingFile.type || "application/octet-stream",
        },
        body: pendingFile,
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
        fileName: pendingFile.name,
      });

      toast.success("แนบหลักฐานเรียบร้อย");
      await queryClient.invalidateQueries({
        queryKey: crpc.activity.list.queryKey(),
      });
      setOpen(false);
      resetPending();
    } catch {
      setLocalError("ไม่สามารถแนบหลักฐานได้ กรุณาลองใหม่");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {hasEvidence
              ? "หลักฐานถูกบันทึกแล้ว ไม่สามารถเปลี่ยนไฟล์ได้"
              : "เลือกไฟล์แล้วกดยืนยันก่อนส่งหลักฐาน"}
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
            <span className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[#cc348d] font-semibold">
              <img
                src={RubyIcon.src}
                alt="คะแนนพิเศษ"
                className="size-5 fill-current"
              />
              {points}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#4b4b4b] break-all">
            {eventName}
          </h3>
        </div>

        <div className="px-4 py-4">
          {hasEvidence ? (
            <div className="flex items-start gap-2.5 rounded-md border-2 border-[#e5e5e5] bg-[#d7ffb8] px-3 py-3">
              <BsCheckCircleFill className="mt-0.5 size-4 shrink-0 text-[#58a700]" />
              <div className="min-w-0 grid gap-0.5">
                <p className="text-sm font-bold text-[#58a700]">แนบหลักฐานแล้ว</p>
                <p className="truncate text-sm font-medium text-[#4b4b4b]">
                  {evidenceFileName}
                </p>
                {evidenceType ? (
                  <p className="text-xs text-[#777]">
                    {evidenceType === "pdf" ? "ไฟล์ PDF" : "รูปภาพ"}
                  </p>
                ) : null}
              </div>
            </div>
          ) : pendingFile ? (
            <div className="grid gap-3 rounded-md border-2 border-[#e5e5e5] bg-[#fafafa] p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="ตัวอย่างหลักฐาน"
                  className="mx-auto max-h-48 w-full rounded-md border-2 border-[#e5e5e5] object-contain"
                />
              ) : (
                <div className="grid place-items-center gap-2 py-4">
                  <BsFileEarmarkPdfFill className="size-12 text-[#afafaf]" />
                </div>
              )}
              <div className="grid gap-0.5 text-center">
                <p className="truncate text-sm font-bold text-[#4b4b4b]">
                  {pendingFile.name}
                </p>
                <p className="text-xs text-[#777]">
                  {pendingKind === "pdf" ? "ไฟล์ PDF" : "รูปภาพ"} ·{" "}
                  {formatFileSize(pendingFile.size)}
                </p>
              </div>
              <p className="text-center text-xs font-medium text-[#777]">
                ตรวจสอบไฟล์ให้ถูกต้องก่อนกดยืนยัน
              </p>
            </div>
          ) : (
            <div className="grid justify-items-center gap-3 rounded-md border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] p-6 text-center">
              <BsCloudUploadFill className="size-10 text-[#afafaf]" />
              <div className="grid gap-1">
                <h3 className="text-base font-bold text-[#4b4b4b]">
                  ยังไม่มีไฟล์หลักฐาน
                </h3>
                <p className="text-sm text-[#777]">
                  รูปภาพ (JPG, PNG, WebP) ไม่เกิน{" "}
                  {formatEvidenceMaxSize(EVIDENCE_IMAGE_MAX_BYTES)}
                </p>
                <p className="text-sm text-[#777]">
                  หรือ PDF ไม่เกิน {formatEvidenceMaxSize(EVIDENCE_PDF_MAX_BYTES)}
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

        {!hasEvidence ? (
          <footer className="grid gap-2 border-t-2 border-[#e5e5e5] bg-white p-4">
            <input
              ref={inputRef}
              type="file"
              accept={EVIDENCE_ACCEPT}
              className="sr-only"
              onChange={onPick}
              disabled={isUploading}
            />
            {pendingFile ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full tracking-wide"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  เลือกไฟล์ใหม่
                </Button>
                <Button
                  type="button"
                  className="w-full tracking-wide"
                  disabled={isUploading}
                  onClick={onConfirm}
                >
                  {isUploading ? "กำลังอัปโหลด..." : "ยืนยันแนบหลักฐาน"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="w-full tracking-wide"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                เลือกไฟล์หลักฐาน
              </Button>
            )}
          </footer>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

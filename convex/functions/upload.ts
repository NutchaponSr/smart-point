import z from "zod/v4";

import { authMutation, authQuery } from "../lib/crpc";

import type { Id } from "./_generated/dataModel";

/** 1 MiB — ตรวจฝั่ง client ก่อน POST; ใช้ค่าเดียวกับ `src/modules/rewards/image-limits.ts` */
export const REWARD_IMAGE_MAX_BYTES = 1_048_576;

export const generateUploadUrl = authMutation
  .mutation(async ({ ctx }) => {
    return await ctx.storage.generateUploadUrl();
  });

export const getFileUrl = authQuery
  .input(z.object({ storageId: z.string().min(1) }))
  .query(async ({ ctx, input }) => {
    return await ctx.storage.getUrl(input.storageId as Id<"_storage">);
  });
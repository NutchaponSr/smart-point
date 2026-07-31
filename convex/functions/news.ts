import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { requireAdmin } from "../lib/auth-helper";
import { authMutation, authQuery, privateMutation } from "../lib/crpc";
import {
  isLocalizedString,
  localizedSearchText,
  toLocalizedString,
} from "../lib/localized";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./generated/server";

const localizedRequiredSchema = z.object({
  th: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

const localizedOptionalSchema = z
  .object({
    th: z.string().trim(),
    en: z.string().trim(),
  })
  .transform((value) => {
    if (value.th === "" && value.en === "") return null;
    return value;
  })
  .nullable()
  .optional();

const newsRow = z.object({
  title: localizedRequiredSchema,
  summary: localizedOptionalSchema,
  body: localizedRequiredSchema,
  isPublished: z.boolean(),
  isPinned: z.boolean().optional(),
});

const parseCursorOffset = (cursor: string | null | undefined): number =>
  Math.max(0, Number.parseInt(cursor ?? "0", 10) || 0);

const toNewsId = (newsId: string): Id<"news"> => newsId as Id<"news">;

function matchesNewsSearch(row: Doc<"news">, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  const haystack = [
    localizedSearchText(row.title),
    localizedSearchText(row.summary),
    localizedSearchText(row.body),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

function sortNewsForFeed(a: Doc<"news">, b: Doc<"news">) {
  const aPinned = a.isPinned ? 1 : 0;
  const bPinned = b.isPinned ? 1 : 0;
  if (aPinned !== bPinned) return bPinned - aPinned;
  const aTime = a.publishedAt ?? a._creationTime;
  const bTime = b.publishedAt ?? b._creationTime;
  return bTime - aTime;
}

async function enrichNewsRow(ctx: QueryCtx, row: Doc<"news">) {
  const creator = await ctx.db.get(row.createdBy);
  return {
    ...row,
    createdByName: creator?.name ?? null,
  };
}

export const getLatest = authQuery
  .input(
    z.object({
      limit: z.number().int().min(1).max(10).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .query("news")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .collect();

    const sorted = rows
      .filter((row) => row.publishedAt != null)
      .sort(sortNewsForFeed)
      .slice(0, input.limit);

    return await Promise.all(sorted.map((row) => enrichNewsRow(ctx, row)));
  });

export const getList = authQuery
  .input(
    z.object({
      q: z.string().optional().nullable(),
      limit: z.number().min(1).max(100),
      cursor: z.string().nullish(),
    }),
  )
  .query(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
    const offset = parseCursorOffset(input.cursor);

    const allRows = await ctx.db.query("news").collect();
    const filtered = allRows
      .filter((row) => matchesNewsSearch(row, normalizedQuery))
      .sort((a, b) => b._creationTime - a._creationTime);

    const page = filtered.slice(offset, offset + input.limit);
    const nextOffset = offset + input.limit;
    const hasNextPage = nextOffset < filtered.length;

    return {
      page: await Promise.all(page.map((row) => enrichNewsRow(ctx, row))),
      isDone: !hasNextPage,
      continueCursor: hasNextPage ? String(nextOffset) : null,
      hasNextPage,
    };
  });

export const getOne = authQuery
  .input(z.object({ newsId: z.string().min(1) }))
  .query(async ({ ctx, input }) => {
    const newsId = toNewsId(input.newsId);
    const row = await ctx.db.get(newsId);
    if (!row) {
      throw new CRPCError({ code: "NOT_FOUND", message: "ไม่พบข่าวสาร" });
    }
    if (!row.isPublished) {
      requireAdmin(ctx.user);
    }
    return await enrichNewsRow(ctx, row);
  });

export const create = authMutation
  .input(newsRow)
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    return await ctx.db.insert("news", {
      title: input.title,
      summary: input.summary ?? null,
      body: input.body,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? Date.now() : null,
      isPinned: input.isPinned ?? false,
      createdBy: ctx.userId as Id<"user">,
    });
  });

export const update = authMutation
  .input(
    z.object({
      newsId: z.string().min(1),
      title: localizedRequiredSchema.optional(),
      summary: localizedOptionalSchema,
      body: localizedRequiredSchema.optional(),
      isPublished: z.boolean().optional(),
      isPinned: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const newsId = toNewsId(input.newsId);
    const current = await ctx.db.get(newsId);
    if (!current) {
      throw new CRPCError({ code: "NOT_FOUND", message: "ไม่พบข่าวสาร" });
    }

    const patch: Partial<Doc<"news">> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.summary !== undefined) patch.summary = input.summary;
    if (input.body !== undefined) patch.body = input.body;
    if (input.isPinned !== undefined) patch.isPinned = input.isPinned;
    if (input.isPublished !== undefined) {
      patch.isPublished = input.isPublished;
      if (input.isPublished && current.publishedAt == null) {
        patch.publishedAt = Date.now();
      }
      if (!input.isPublished) {
        patch.publishedAt = null;
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(newsId, patch);
    }

    return newsId;
  });

export const remove = authMutation
  .input(z.object({ newsId: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const newsId = toNewsId(input.newsId);
    const row = await ctx.db.get(newsId);
    if (!row) {
      throw new CRPCError({ code: "NOT_FOUND", message: "ไม่พบข่าวสาร" });
    }
    await ctx.db.delete(newsId);
    return newsId;
  });

export const bulkDelete = authMutation
  .input(z.object({ ids: z.array(z.string().min(1)) }))
  .mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user);

    const unique = [...new Set(input.ids.map(toNewsId))];
    let deleted = 0;
    for (const newsId of unique) {
      const row = await ctx.db.get(newsId);
      if (!row) continue;
      await ctx.db.delete(newsId);
      deleted += 1;
    }
    return { deleted };
  });

/** Backfill title/summary/body จาก string → { th, en } */
export const migrateLocalizedStrings = privateMutation.mutation(
  async ({ ctx }) => {
    const rows = await ctx.db.query("news").collect();
    let updated = 0;

    for (const row of rows) {
      const title = toLocalizedString(row.title);
      const summary = toLocalizedString(row.summary);
      const body = toLocalizedString(row.body);

      if (!title || !body) continue;

      const titleNeedsUpdate = !isLocalizedString(row.title);
      const summaryNeedsUpdate =
        row.summary != null && !isLocalizedString(row.summary);
      const bodyNeedsUpdate = !isLocalizedString(row.body);

      if (!titleNeedsUpdate && !summaryNeedsUpdate && !bodyNeedsUpdate) {
        continue;
      }

      await ctx.db.patch(row._id, {
        title,
        summary,
        body,
      });
      updated += 1;
    }

    return { scanned: rows.length, updated };
  },
);

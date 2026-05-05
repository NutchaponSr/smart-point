import z from "zod/v4";

import { CRPCError } from "better-convex/server";

import { authMutation, authQuery } from "../lib/crpc";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./generated/server";

type DbCtx = QueryCtx | MutationCtx;

async function resolveStorageImageUrl(
  storage: QueryCtx["storage"],
  image: string | null | undefined,
): Promise<string | null> {
  if (image == null || String(image).trim() === "") return null;
  return await storage.getUrl(image as Id<"_storage">);
}

async function getActiveCartId(
  ctx: { db: DbCtx["db"] },
  employeeId: Id<"employee">
): Promise<Id<"cart"> | null> {
  const cart = await ctx.db
    .query("cart")
    .withIndex("by_employeeId_status", (q) =>
      q.eq("employeeId", employeeId).eq("status", "active")
    )
    .first();
  return cart?._id ?? null;
}

async function requireActiveCart(
  ctx: { db: DbCtx["db"] },
  employeeId: Id<"employee">
) {
  const cart = await ctx.db
    .query("cart")
    .withIndex("by_employeeId_status", (q) =>
      q.eq("employeeId", employeeId).eq("status", "active")
    )
    .first();
  if (!cart) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Cart not found",
    });
  }
  return cart;
}

export const getCart = authQuery.query(async ({ ctx }) => {
  const cart = await ctx.db
    .query("cart")
    .withIndex("by_employeeId_status", (q) =>
      q.eq("employeeId", ctx.user.employeeId).eq("status", "active")
    )
    .first();

  if (!cart) return { cart: null, items: [], totalPoints: 0 };

  const cartItems = await ctx.db
    .query("cartItem")
    .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
    .collect();

  const items = await Promise.all(
    cartItems.map(async (item) => {
      const reward = await ctx.db.get(item.rewardId);

      if (!reward || !reward.isActive) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: "Reward not available",
        });
      }

      const image = await resolveStorageImageUrl(ctx.storage, reward.image);
      return {
        ...item,
        reward: { ...reward, image },
      };
    })
  );

  const totalPoints = items.reduce(
    (sum, item) => sum + (item.reward?.pointCost ?? 0) * item.quantity,
    0
  );

  return { cart, items, totalPoints };
});

export const addCart = authMutation
  .input(
    z.object({
      rewardId: z.string(),
      quantity: z.number().int().min(1).default(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const raw = await ctx.db.get(input.rewardId as Id<"reward">);
    const reward = raw as Doc<"reward"> | null;
    if (!reward || !reward.isActive) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Reward not available",
      });
    }

    const onePerOrder = reward.onePerOrder === true;
    const quantity = onePerOrder ? 1 : input.quantity;

    if (reward.stock !== -1 && reward.stock < quantity) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient stock",
      });
    }

    let cartId = await getActiveCartId(ctx, ctx.user.employeeId);
    if (!cartId) {
      cartId = await ctx.db.insert("cart", {
        employeeId: ctx.user.employeeId,
        status: "active",
      });
    }

    const existing = await ctx.db
      .query("cartItem")
      .withIndex("by_cartId_rewardId", (q) =>
        q.eq("cartId", cartId).eq("rewardId", input.rewardId as Id<"reward">)
      )
      .first();

    if (existing) {
      // onePerOrder + มีในรถเข็นแล้ว: สำเร็จแบบ no-op ให้ client นำทางไป checkout ได้
      if (onePerOrder) {
        return;
      }
      const nextQty = existing.quantity + quantity;
      if (reward.stock !== -1 && nextQty > reward.stock) {
        throw new CRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient stock",
        });
      }
      await ctx.db.patch(existing._id, {
        quantity: nextQty,
      });
    } else {
      await ctx.db.insert("cartItem", {
        cartId,
        rewardId: input.rewardId as Id<"reward">,
        quantity,
      });
    }
  });

export const removeCartItem = authMutation
  .input(
    z.object({
      cartItemId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const cart = await requireActiveCart(ctx, ctx.user.employeeId);
    const item = await ctx.db.get(input.cartItemId as Id<"cartItem">);
    if (!item || item.cartId !== cart._id) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Cart item not found",
      });
    }
    await ctx.db.delete(item._id);
  });

export const updateCartItemQuantity = authMutation
  .input(
    z.object({
      cartItemId: z.string(),
      quantity: z.number().int().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const cart = await requireActiveCart(ctx, ctx.user.employeeId);
    const item = await ctx.db.get(input.cartItemId as Id<"cartItem">);
    if (!item || item.cartId !== cart._id) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Cart item not found",
      });
    }

    const raw = await ctx.db.get(item.rewardId);
    const reward = raw as Doc<"reward"> | null;
    if (!reward || !reward.isActive) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Reward not available",
      });
    }
    if (reward.onePerOrder === true && input.quantity !== 1) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "รางวัลนี้แลกได้ครั้งละ 1 ชิ้นเท่านั้น",
      });
    }
    if (reward.stock !== -1 && input.quantity > reward.stock) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Insufficient stock",
      });
    }

    await ctx.db.patch(item._id, {
      quantity: input.quantity,
    });
  });

/** แลกของในตะกร้า: หัก receiving budget, สร้าง redemption ต่อรายการรางวัล, ลดสต็อก, ปิดตะกร้า */
export const redeemCart = authMutation.mutation(async ({ ctx }) => {
  const cart = await ctx.db
    .query("cart")
    .withIndex("by_employeeId_status", (q) =>
      q.eq("employeeId", ctx.user.employeeId).eq("status", "active")
    )
    .first();

  if (!cart) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Cart is empty",
    });
  }

  const cartItems = await ctx.db
    .query("cartItem")
    .withIndex("by_cartId", (q) => q.eq("cartId", cart._id))
    .collect();

  if (cartItems.length === 0) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Cart is empty",
    });
  }

  const qtyByReward = new Map<Id<"reward">, number>();
  for (const item of cartItems) {
    qtyByReward.set(
      item.rewardId,
      (qtyByReward.get(item.rewardId) ?? 0) + item.quantity
    );
  }

  const lines: {
    item: (typeof cartItems)[number];
    reward: Doc<"reward">;
    linePoints: number;
  }[] = [];

  for (const item of cartItems) {
    const raw = await ctx.db.get(item.rewardId);
    if (!raw || !raw.isActive) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "A reward in your cart is no longer available",
      });
    }
    const reward = raw as Doc<"reward">;
    const totalQtyForReward = qtyByReward.get(reward._id) ?? 0;
    if (reward.stock !== -1 && totalQtyForReward > reward.stock) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: `Insufficient stock for ${reward.name}`,
      });
    }
    const linePoints = reward.pointCost * item.quantity;
    lines.push({ item, reward, linePoints });
  }

  const totalPoints = lines.reduce((sum, l) => sum + l.linePoints, 0);

  const wallet = await ctx.db
    .query("wallet")
    .withIndex("by_employeeId", (q) =>
      q.eq("employeeId", ctx.user.employeeId)
    )
    .first();

  if (!wallet) {
    throw new CRPCError({
      code: "NOT_FOUND",
      message: "Wallet not found",
    });
  }

  if (wallet.receivingBudget < totalPoints) {
    throw new CRPCError({
      code: "BAD_REQUEST",
      message: "Insufficient receiving points",
    });
  }

  const redemptionIds: Id<"redemption">[] = [];

  for (const { item, reward, linePoints } of lines) {
    const redemptionId = await ctx.db.insert("redemption", {
      employeeId: ctx.user.employeeId,
      rewardId: reward._id,
      quantity: item.quantity,
      pointCostPerItem: reward.pointCost,
      pointSpent: linePoints,
      status: "pending",
    });
    redemptionIds.push(redemptionId);

    const latestRaw = await ctx.db.get(reward._id);
    const latestReward = latestRaw as Doc<"reward"> | null;
    if (
      latestReward &&
      latestReward.stock !== -1 &&
      item.quantity > latestReward.stock
    ) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: `Insufficient stock for ${latestReward.name}`,
      });
    }
    if (latestReward && latestReward.stock !== -1) {
      await ctx.db.patch(latestReward._id, {
        stock: latestReward.stock - item.quantity,
      });
    }
  }

  const newReceiving = wallet.receivingBudget - totalPoints;
  await ctx.db.patch(wallet._id, {
    receivingBudget: newReceiving,
  });

  await ctx.db.insert("pointLedger", {
    employeeId: ctx.user.employeeId,
    delta: -totalPoints,
    balanceAfter: newReceiving,
    balanceType: "receiving",
    sourceType: "redemption",
    sourceId: String(redemptionIds[0]),
    note: "Reward redemption",
    createdAt: Date.now(),
  });

  await ctx.db.patch(cart._id, {
    status: "checked_out",
  });

  for (const ci of cartItems) {
    await ctx.db.delete(ci._id);
  }

  return { redemptionIds, totalPoints };
});

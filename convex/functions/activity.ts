import { CRPCError } from "better-convex/server";
import z from "zod/v4";

import { authMutation, authQuery } from "../lib/crpc";

import type { Id } from "./_generated/dataModel";

const BASE_LIMIT = 10;

export const getMany = authQuery
  .input(
    z.object({
      q: z.string().optional(),
      view: z.enum(["external", "internal", "internal_bu", "specials_point", "all"]).optional(),
      minParticipants: z.number().nullable(),
      maxParticipants: z.number().nullable(),
      isJoined: z.boolean().optional(),
    }),
  )
  .paginated({
    limit: BASE_LIMIT,
    item: z.object({
      createdAt: z.number(),
      description: z.string().nullish(),
      endDate: z.number().nullish(),
      isActive: z.boolean(),
      maxParticipants: z.number().nullish(),
      name: z.string(),
      point: z.number(),
      startDate: z.number(),
      updatedAt: z.number().nullish(),
      _id: z.custom<Id<"activity">>(),
      _creationTime: z.number(),
      participantCount: z.number(),
      isJoined: z.boolean(),
      category: z.enum([
        "external",
        "internal",
        "internal_bu",
        "specials_point",
      ]),
    }),
  })
  .query(async ({ ctx, input }) => {
    const currentEmployeeId = ctx.user.employeeId; // ไม่ต้อง optional

  const [activities, participantDocs] = await Promise.all([
    ctx.db.query("activity").collect(),
    ctx.db.query("activityParticipant").collect(),
  ]);

  // รวม count + joined ในรอบเดียว
  const participantCounts = new Map<Id<"activity">, number>();
  const joinedActivityIds = new Set<Id<"activity">>();

  for (const p of participantDocs) {
    participantCounts.set(p.activityId, (participantCounts.get(p.activityId) ?? 0) + 1);

    if (p.employeeId === currentEmployeeId) joinedActivityIds.add(p.activityId);
  }

  const normalizedQuery = input.q?.trim().toLowerCase() ?? "";
  const selectedView = input.view ?? "all";

  const sortTime = (a: (typeof activities)[number]) =>
    a.startDate ?? a.createdAt ?? a._creationTime;

  const filtered = activities
    .map((activity) => ({
      ...activity,
      createdAt: activity.createdAt ?? activity._creationTime,
      participantCount: participantCounts.get(activity._id) ?? 0,
      isJoined: joinedActivityIds.has(activity._id), // authQuery = always has user
    }))
    .filter((activity) => {
      if (selectedView !== "all" && activity.category !== selectedView) return false;
      if (normalizedQuery) {
        const inName = activity.name.toLowerCase().includes(normalizedQuery);
        const inDesc = activity.description?.toLowerCase().includes(normalizedQuery) ?? false;
        if (!inName && !inDesc) return false;
      }
      if (input.minParticipants != null && activity.participantCount < input.minParticipants) return false;
      if (input.maxParticipants != null && activity.participantCount > input.maxParticipants) return false;
      if (input.isJoined && !activity.isJoined) return false;
      return true;
    })
    .sort((a, b) => {
      const byStart = sortTime(b) - sortTime(a);
      if (byStart !== 0) return byStart;
      return String(b._id).localeCompare(String(a._id));
    });

  const startIndex = Math.max(0, Number.parseInt(input.cursor ?? "0", 10) || 0);
  const endIndex = startIndex + input.limit;
  const page = filtered.slice(startIndex, endIndex);
  const continueCursor = endIndex >= filtered.length ? null : String(endIndex);

  return {
    page,
    isDone: continueCursor === null,
    continueCursor,
  };
  });

export const getOne = authQuery
  .input(
    z.object({
      activityId: z.string(),
    }),
  )
  .output(
    z.object({
      createdAt: z.number(),
      description: z.string().nullish(),
      endDate: z.number().nullish(),
      isActive: z.boolean(),
      maxParticipants: z.number().nullish(),
      name: z.string(),
      point: z.number(),
      startDate: z.number(),
      updatedAt: z.number().nullish(),
      _id: z.custom<Id<"activity">>(),
      _creationTime: z.number(),
      participantCount: z.number(),
      participants: z.array(
        z.object({
          participantId: z.custom<Id<"activityParticipant">>(),
          employeeId: z.custom<Id<"employee">>(),
          status: z.enum(["registered", "attended", "rewarded", "cancelled"]),
          createdAt: z.number(),
          updatedAt: z.number().nullish(),
          employee: z
            .object({
              id: z.custom<Id<"employee">>(),
              employeeId: z.string(),
              name: z.string(),
              department: z.string(),
              position: z.string(),
              rank: z.string(),
              division: z.string(),
              email: z.string().nullish(),
            })
            .nullable(),
        }),
      ),
      isJoined: z.boolean(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participantDocs = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
      .collect();

    const uniqueEmployeeIds = [
      ...new Set(participantDocs.map((participant) => participant.employeeId)),
    ];
    const employees = await Promise.all(
      uniqueEmployeeIds.map((employeeId) => ctx.db.get(employeeId)),
    );
    const employeeById = new Map(
      uniqueEmployeeIds.map((employeeId, index) => [
        employeeId,
        employees[index],
      ]),
    );
    const currentEmployeeId = ctx.user?.employeeId;

    return {
      ...activity,
      createdAt: activity.createdAt ?? activity._creationTime,
      participantCount: participantDocs.filter((p) => p.status !== "cancelled")
        .length,
      isJoined: Boolean(
        currentEmployeeId &&
          participantDocs.some(
            (participant) =>
              participant.employeeId === currentEmployeeId &&
              participant.status !== "cancelled",
          ),
      ),
      participants: participantDocs.map((participant) => {
        const employee = employeeById.get(participant.employeeId) ?? null;
        return {
          participantId: participant._id,
          employeeId: participant.employeeId,
          status: participant.status,
          createdAt: participant.createdAt ?? participant._creationTime,
          updatedAt: participant.updatedAt,
          employee: employee
            ? {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                department: employee.department,
                position: employee.position,
                rank: employee.rank,
                division: employee.division,
                email: employee.email,
              }
            : null,
        };
      }),
    };
  });

export const join = authMutation
  .input(
    z.object({
      activityId: z.string(),
    }),
  )
  .output(
    z.object({
      joined: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }
    if (!activity.isActive) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Activity is not active",
      });
    }

    const existing = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q.eq("activityId", activityId).eq("employeeId", ctx.user.employeeId),
      )
      .first();

    if (existing && existing.status !== "cancelled") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "You have already joined this activity",
      });
    }

    const activeParticipants = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId", (q) => q.eq("activityId", activityId))
      .collect();
    const participantCount = activeParticipants.filter(
      (participant) => participant.status !== "cancelled",
    ).length;

    if (
      activity.maxParticipants != null &&
      participantCount >= activity.maxParticipants
    ) {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Activity is full",
      });
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "registered",
      });
      return { joined: true };
    }

    await ctx.db.insert("activityParticipant", {
      activityId,
      employeeId: ctx.user.employeeId,
      status: "registered",
    });

    return { joined: true };
  });

export const leave = authMutation
  .input(
    z.object({
      activityId: z.string(),
    }),
  )
  .output(
    z.object({
      left: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const activityId = input.activityId as Id<"activity">;
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "Activity not found",
      });
    }

    const participant = await ctx.db
      .query("activityParticipant")
      .withIndex("by_activityId_employeeId", (q) =>
        q.eq("activityId", activityId).eq("employeeId", ctx.user.employeeId),
      )
      .first();

    if (!participant || participant.status === "cancelled") {
      throw new CRPCError({
        code: "NOT_FOUND",
        message: "You have not joined this activity",
      });
    }
    if (participant.status !== "registered") {
      throw new CRPCError({
        code: "BAD_REQUEST",
        message: "Cannot leave activity in current status",
      });
    }

    await ctx.db.delete(participant._id);

    return { left: true };
  });

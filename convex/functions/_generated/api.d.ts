/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  activity: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        isJoined?: boolean;
        limit?: number;
        maxParticipants: number | null;
        minParticipants: number | null;
        q?: string;
        view?:
          | "external"
          | "internal"
          | "internal_bu"
          | "specials_point"
          | "all";
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: any;
          category: "external" | "internal" | "internal_bu" | "specials_point";
          createdAt: number;
          description?: string | null;
          endDate?: number | null;
          isActive: boolean;
          isJoined: boolean;
          maxParticipants?: number | null;
          name: string;
          participantCount: number;
          point: number;
          startDate: number;
          updatedAt?: number | null;
        }>;
      }
    >;
    getOne: FunctionReference<
      "query",
      "public",
      { activityId: string },
      {
        _creationTime: number;
        _id: any;
        createdAt: number;
        description?: string | null;
        endDate?: number | null;
        isActive: boolean;
        isJoined: boolean;
        maxParticipants?: number | null;
        name: string;
        participantCount: number;
        participants: Array<{
          createdAt: number;
          employee: {
            department: string;
            division: string;
            email?: string | null;
            employeeId: string;
            id: any;
            name: string;
            position: string;
            rank: string;
          } | null;
          employeeId: any;
          participantId: any;
          status: "registered" | "attended" | "rewarded" | "cancelled";
          updatedAt?: number | null;
        }>;
        point: number;
        startDate: number;
        updatedAt?: number | null;
      }
    >;
    join: FunctionReference<
      "mutation",
      "public",
      { activityId: string },
      { joined: boolean }
    >;
    leave: FunctionReference<
      "mutation",
      "public",
      { activityId: string },
      { left: boolean }
    >;
  };
  cart: {
    addCart: FunctionReference<
      "mutation",
      "public",
      { quantity?: number; rewardId: string },
      any
    >;
    getCart: FunctionReference<"query", "public", {}, any>;
    redeemCart: FunctionReference<"mutation", "public", {}, any>;
    removeCartItem: FunctionReference<
      "mutation",
      "public",
      { cartItemId: string },
      any
    >;
    updateCartItemQuantity: FunctionReference<
      "mutation",
      "public",
      { cartItemId: string; quantity: number },
      any
    >;
  };
  employee: {
    search: FunctionReference<"query", "public", { query: string }, any>;
  };
  leaderboard: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: number | null;
        limit: number;
        period: "24hr" | "7d" | "30d" | "fullTime";
      },
      any
    >;
    getMyEntry: FunctionReference<
      "query",
      "public",
      { period: "24hr" | "7d" | "30d" | "fullTime" },
      any
    >;
  };
  redemption: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        limit?: number;
        q?: string | null;
        sort?: "recently-updated" | "purchase-date" | null;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          redemption: {
            _id: any;
            createdAt: number;
            employeeId: string;
            pointSpent: number;
            quantity: number;
            status: "pending" | "fulfilled" | "cancelled";
          };
          review: {
            _id: string;
            comment: string | null;
            createdAt: number;
            stars: number;
          } | null;
          reward: { _id: any; image: string; name: string; pointCost: number };
        }>;
      }
    >;
    reviewRedemption: FunctionReference<
      "mutation",
      "public",
      { comment?: string; redemptionId: string; stars: number },
      any
    >;
  };
  reward: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        limit?: number;
        maxCost?: number | null;
        minCost?: number | null;
        q?: string | null;
        sort?: "curated" | "trending" | "hot_and_new" | null;
        star?: number | null;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: any;
          description?: string | null;
          image?: string | null;
          isActive: boolean;
          name: string;
          pointCost: number;
          stock: number;
          totalReviews: number;
          totalStars: number;
        }>;
      }
    >;
    getOne: FunctionReference<"query", "public", { rewardId: string }, any>;
    getRecommend: FunctionReference<"query", "public", {}, any>;
    getTrending: FunctionReference<"query", "public", { query?: string }, any>;
  };
  seed: {
    seedActivity: FunctionReference<"action", "public", {}, any>;
    seedEmployee: FunctionReference<
      "action",
      "public",
      {
        employees: Array<{
          department: string;
          division: string;
          email?: string;
          employeeId: string;
          name: string;
          password: string;
          position: string;
          rank: string;
        }>;
      },
      any
    >;
    seedReward: FunctionReference<"action", "public", {}, any>;
  };
  transaction: {
    approve: FunctionReference<
      "mutation",
      "public",
      { transactionId: string },
      any
    >;
    comment: FunctionReference<
      "mutation",
      "public",
      { content: string; transactionId: string },
      any
    >;
    feeds: FunctionReference<
      "query",
      "public",
      { cursor?: string | null; limit?: number },
      any
    >;
    getHistory: FunctionReference<
      "query",
      "public",
      {
        cursor: number | null;
        from?: number | null;
        limit: number;
        max: number | null;
        min: number | null;
        query?: string;
        status?: Array<
          "pending" | "completed" | "rejected" | "approved"
        > | null;
        to?: number | null;
        view: "sent" | "received";
      },
      any
    >;
    like: FunctionReference<
      "mutation",
      "public",
      { transactionId: string },
      any
    >;
    send: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        message: string;
        receiverId: string;
        tags: Array<string>;
      },
      any
    >;
  };
  user: {
    getCurrentUser: FunctionReference<"query", "public", {}, any>;
  };
  wallet: {
    getOne: FunctionReference<"query", "public", {}, any>;
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  generated: {
    auth: {
      create: FunctionReference<
        "mutation",
        "internal",
        { input: { data: any; model: string }; select?: Array<string> },
        any
      >;
      deleteMany: FunctionReference<
        "mutation",
        "internal",
        {
          input: { model: string; where?: Array<any> };
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      deleteOne: FunctionReference<
        "mutation",
        "internal",
        { input: { model: string; where?: Array<any> } },
        any
      >;
      findMany: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          limit?: number;
          model: string;
          offset?: number;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          sortBy?: { direction: "asc" | "desc"; field: string };
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      findOne: FunctionReference<
        "query",
        "internal",
        {
          join?: any;
          model: string;
          select?: Array<string>;
          where?: Array<{
            connector?: "AND" | "OR";
            field: string;
            operator?:
              | "lt"
              | "lte"
              | "gt"
              | "gte"
              | "eq"
              | "in"
              | "not_in"
              | "ne"
              | "contains"
              | "starts_with"
              | "ends_with";
            value:
              | string
              | number
              | boolean
              | Array<string>
              | Array<number>
              | null;
          }>;
        },
        any
      >;
      getLatestJwks: FunctionReference<"action", "internal", {}, any>;
      rotateKeys: FunctionReference<"action", "internal", {}, any>;
      updateMany: FunctionReference<
        "mutation",
        "internal",
        {
          input: { model: string; update: any; where?: Array<any> };
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        any
      >;
      updateOne: FunctionReference<
        "mutation",
        "internal",
        { input: { model: string; update: any; where?: Array<any> } },
        any
      >;
    };
    server: {
      aggregateBackfill: FunctionReference<"mutation", "internal", any, any>;
      aggregateBackfillChunk: FunctionReference<
        "mutation",
        "internal",
        any,
        any
      >;
      aggregateBackfillStatus: FunctionReference<
        "mutation",
        "internal",
        any,
        any
      >;
      migrationCancel: FunctionReference<"mutation", "internal", any, any>;
      migrationRun: FunctionReference<"mutation", "internal", any, any>;
      migrationRunChunk: FunctionReference<"mutation", "internal", any, any>;
      migrationStatus: FunctionReference<"mutation", "internal", any, any>;
      reset: FunctionReference<"action", "internal", any, any>;
      resetChunk: FunctionReference<
        "mutation",
        "internal",
        { cursor: string | null; tableName: string },
        any
      >;
      scheduledDelete: FunctionReference<"mutation", "internal", any, any>;
      scheduledMutationBatch: FunctionReference<
        "mutation",
        "internal",
        any,
        any
      >;
    };
  };
  seed: {
    insertActivity: FunctionReference<
      "mutation",
      "internal",
      {
        category: "external" | "internal" | "internal_bu" | "specials_point";
        description?: string;
        endDate?: number;
        isActive: boolean;
        maxParticipants?: number;
        name: string;
        point: number;
        startDate: number;
      },
      any
    >;
    insertEmployee: FunctionReference<
      "mutation",
      "internal",
      {
        department: string;
        division: string;
        email?: string;
        employeeId: string;
        name: string;
        position: string;
        rank: string;
      },
      any
    >;
    insertReward: FunctionReference<
      "mutation",
      "internal",
      {
        description?: string;
        image?: string;
        isActive: boolean;
        name: string;
        onePerOrder?: boolean;
        pointCost: number;
        stock: number;
      },
      any
    >;
  };
  wallet: {
    initial: FunctionReference<
      "mutation",
      "internal",
      { employeeId: string },
      any
    >;
    monthlyReset: FunctionReference<"mutation", "internal", {}, any>;
    resetGivingBudget: FunctionReference<
      "mutation",
      "internal",
      { cursor: string | null },
      any
    >;
  };
};

export declare const components: {};

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
    approve: FunctionReference<
      "mutation",
      "public",
      { activityId: string; participantId: string },
      {
        approved: boolean;
        payoutBalanceType?: "giving" | "receiving";
        skipped: boolean;
      }
    >;
    attachEvidence: FunctionReference<
      "mutation",
      "public",
      { activityId: string; fileName: string; storageId: string },
      { uploaded: boolean }
    >;
    bulkAddParticipants: FunctionReference<
      "mutation",
      "public",
      { activityId: string; rows: Array<{ employeeIds: Array<string> }> },
      any
    >;
    bulkApprove: FunctionReference<
      "mutation",
      "public",
      { activityId: string; participantIds: Array<string> },
      { approved: number; skipped: number }
    >;
    bulkCreate: FunctionReference<
      "mutation",
      "public",
      {
        rows: Array<{
          allowedDepartments?: Array<string>;
          allowedDivisions?: Array<string>;
          category: "external" | "internal" | "internal_bu" | "specials_point";
          description?: string | null;
          endDate?: number | null;
          maxParticipants?: number | null;
          name: string;
          point: number;
          startDate: number;
        }>;
      },
      any
    >;
    bulkDelete: FunctionReference<
      "mutation",
      "public",
      { activityIds: Array<string> },
      any
    >;
    bulkLeave: FunctionReference<
      "mutation",
      "public",
      { activityId: string; participantIds: Array<string> },
      { left: number; skipped: number }
    >;
    bulkReject: FunctionReference<
      "mutation",
      "public",
      { activityId: string; participantIds: Array<string> },
      { rejected: number; skipped: number }
    >;
    count: FunctionReference<"query", "public", {}, any>;
    create: FunctionReference<
      "mutation",
      "public",
      {
        allowedDepartments?: Array<string>;
        allowedDivisions?: Array<string>;
        category: "external" | "internal" | "internal_bu" | "specials_point";
        description?: string | null;
        endDate?: number | null;
        maxParticipants?: number | null;
        name: string;
        point: number;
        startDate: number;
      },
      any
    >;
    exportAll: FunctionReference<
      "mutation",
      "public",
      {
        maxParticipants?: number | null;
        minParticipants?: number | null;
        q?: string | null;
        view?: Array<
          "external" | "internal" | "internal_bu" | "specials_point"
        > | null;
      },
      any
    >;
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        eligibleOnly?: boolean | null;
        limit: number;
        maxParticipants?: number | null;
        minParticipants?: number | null;
        q?: string | null;
        view?: Array<
          "external" | "internal" | "internal_bu" | "specials_point"
        > | null;
      },
      any
    >;
    getOne: FunctionReference<"query", "public", { activityId: string }, any>;
    join: FunctionReference<
      "mutation",
      "public",
      { activityId: string; employeeId?: string | null },
      any
    >;
    leave: FunctionReference<
      "mutation",
      "public",
      { activityId: string },
      { left: boolean }
    >;
    list: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        limit: number;
        q?: string | null;
        status?: Array<"registered" | "rewarded"> | null;
        view?: Array<
          "external" | "internal" | "internal_bu" | "specials_point"
        > | null;
      },
      any
    >;
    recommended: FunctionReference<
      "query",
      "public",
      { limit: number; now?: number | null },
      any
    >;
    reject: FunctionReference<
      "mutation",
      "public",
      { activityId: string; participantId: string },
      { rejected: boolean; skipped: boolean }
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { activityId: string },
      any
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        activityId: string;
        allowedDepartments?: Array<string>;
        allowedDivisions?: Array<string>;
        category?: "external" | "internal" | "internal_bu" | "specials_point";
        description?: string | null;
        endDate?: number | null;
        isActive?: boolean;
        maxParticipants?: number | null;
        name?: string;
        point?: number;
        startDate?: number;
      },
      any
    >;
  };
  activityLog: {
    getLatest: FunctionReference<"query", "public", { limit?: number }, any>;
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
    bulkDelete: FunctionReference<
      "mutation",
      "public",
      { employeeIds: Array<any> },
      any
    >;
    bulkImport: FunctionReference<
      "mutation",
      "public",
      {
        rows: Array<{
          department: string;
          division: string;
          email?: string | null;
          employeeId: string;
          name: string;
          password: string;
          position: string;
          rank: string;
          rowIndex: number;
        }>;
      },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        department: string;
        division: string;
        email?: string | null;
        employeeId: string;
        name: string;
        password: string;
        position: string;
        rank: string;
      },
      any
    >;
    exportAll: FunctionReference<
      "mutation",
      "public",
      {
        department?: Array<string> | null;
        division?: Array<string> | null;
        query?: string | null;
        rank?: Array<string> | null;
      },
      any
    >;
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        department?: Array<string> | null;
        division?: Array<string> | null;
        limit: number;
        query?: string | null;
        rank?: Array<string> | null;
      },
      any
    >;
    getOne: FunctionReference<"query", "public", { employeeId: any }, any>;
    remove: FunctionReference<"mutation", "public", { employeeId: any }, any>;
    search: FunctionReference<
      "query",
      "public",
      { query: string; self?: boolean },
      any
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        department: string;
        division: string;
        employeeId: any;
        name: string;
        position: string;
        rank: string;
      },
      any
    >;
  };
  leaderboard: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        division?: Array<string> | null;
        limit: number;
        period: "24hr" | "7d" | "30d" | "fullTime";
        q?: string | null;
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
  news: {
    bulkDelete: FunctionReference<
      "mutation",
      "public",
      { ids: Array<string> },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        body: string;
        isPinned?: boolean;
        isPublished: boolean;
        summary?: string | null;
        title: string;
      },
      any
    >;
    getLatest: FunctionReference<"query", "public", { limit?: number }, any>;
    getList: FunctionReference<
      "query",
      "public",
      { cursor?: string | null; limit: number; q?: string | null },
      any
    >;
    getOne: FunctionReference<"query", "public", { newsId: string }, any>;
    remove: FunctionReference<"mutation", "public", { newsId: string }, any>;
    update: FunctionReference<
      "mutation",
      "public",
      {
        body?: string;
        isPinned?: boolean;
        isPublished?: boolean;
        newsId: string;
        summary?: string | null;
        title?: string;
      },
      any
    >;
  };
  redemption: {
    getMany: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        from?: number | null;
        limit: number;
        q?: string | null;
        sort?: "recently-updated" | "purchase-date" | null;
        to?: number | null;
      },
      any
    >;
    getManyAdmin: FunctionReference<
      "query",
      "public",
      {
        by?: string | null;
        cursor?: string | null;
        from?: number | null;
        limit: number;
        q?: string | null;
        shippingStatus?: Array<
          "pending" | "processing" | "shipped" | "delivered"
        > | null;
        sort?: "recently-updated" | "purchase-date" | null;
        status?: Array<"pending" | "fulfilled" | "cancelled"> | null;
        to?: number | null;
      },
      any
    >;
    reviewRedemption: FunctionReference<
      "mutation",
      "public",
      { comment?: string; redemptionId: string; stars: number },
      any
    >;
    updateShippingStatus: FunctionReference<
      "mutation",
      "public",
      {
        carrier?: string;
        note?: string;
        redemptionId: string;
        shippingStatus: "pending" | "processing" | "shipped" | "delivered";
        trackingNumber?: string;
      },
      any
    >;
  };
  reward: {
    bulkCreate: FunctionReference<
      "mutation",
      "public",
      {
        rows: Array<{
          description: string | null;
          isActive?: boolean;
          name: string;
          onePerOrder?: boolean;
          pointCost: number;
          stock: number;
        }>;
      },
      any
    >;
    bulkDelete: FunctionReference<
      "mutation",
      "public",
      { ids: Array<string> },
      any
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        description?: string | null;
        image?: string | null;
        isActive: boolean;
        name: string;
        onePerOrder?: boolean;
        pointCost: number;
        stock: number;
      },
      any
    >;
    exportAll: FunctionReference<
      "mutation",
      "public",
      {
        maxCost?: number | null;
        minCost?: number | null;
        q?: string | null;
        star?: number | null;
      },
      any
    >;
    getList: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        limit: number;
        maxCost?: number | null;
        minCost?: number | null;
        q?: string | null;
        star?: number | null;
      },
      any
    >;
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
    remove: FunctionReference<"mutation", "public", { rewardId: string }, any>;
    update: FunctionReference<
      "mutation",
      "public",
      {
        description?: string | null;
        image?: string | null;
        isActive?: boolean;
        name?: string;
        onePerOrder?: boolean | null;
        pointCost?: number;
        rewardId: string;
        stock?: number;
      },
      any
    >;
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
      { confirm: boolean; transactionId: string },
      any
    >;
    bulkApprove: FunctionReference<
      "mutation",
      "public",
      { confirm: boolean; transactionIds: Array<string> },
      any
    >;
    comment: FunctionReference<
      "mutation",
      "public",
      { content: string; transactionId: string },
      any
    >;
    exportAll: FunctionReference<
      "mutation",
      "public",
      {
        by?: string | null;
        from?: number | null;
        max?: number | null;
        min?: number | null;
        q?: string | null;
        self: boolean;
        status?: Array<"pending" | "completed" | "rejected"> | null;
        to?: number | null;
        view?: "sent" | "received" | null;
      },
      any
    >;
    feeds: FunctionReference<
      "query",
      "public",
      {
        cursor?: string | null;
        from?: number | null;
        limit?: number;
        max?: number | null;
        min?: number | null;
        q?: string | null;
        to?: number | null;
        view?: "all" | "sent" | "received";
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: any;
          amount: number;
          comments: Array<{
            _id: any;
            author: {
              _id: any;
              department: string;
              division: string;
              employeeId: string;
              image: string | null;
              name: string;
              position: string;
              rank: string;
            };
            content: string;
            createdAt: number;
            updatedAt: number | null;
          }>;
          createdAt: number;
          likes: { count: number; likedByCurrentUser: boolean };
          message: string;
          receiver: {
            _id: any;
            department: string;
            division: string;
            employeeId: string;
            image: string | null;
            name: string;
            position: string;
            rank: string;
          };
          receiverId: any;
          rejectionReason: string | null;
          reviewedAt: number;
          reviewedBy: string;
          sender: {
            _id: any;
            department: string;
            division: string;
            employeeId: string;
            image: string | null;
            name: string;
            position: string;
            rank: string;
          };
          senderId: any;
          status: "pending" | "approved" | "rejected" | "completed";
          tags?: string | null;
          updatedAt: number | null;
        }>;
      }
    >;
    getMany: FunctionReference<
      "query",
      "public",
      {
        by?: string | null;
        cursor?: string | null;
        from?: number | null;
        limit: number;
        max?: number | null;
        min?: number | null;
        q?: string | null;
        self: boolean;
        status?: Array<"pending" | "completed" | "rejected"> | null;
        to?: number | null;
        view?: "sent" | "received" | null;
      },
      any
    >;
    getMonthlyQuestProgress: FunctionReference<
      "query",
      "public",
      { monthStart: number },
      any
    >;
    getMonthlyTransferQuota: FunctionReference<
      "query",
      "public",
      { receiverId: string },
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
      { amount: number; message: string; receiverId: string; tags: string },
      any
    >;
  };
  upload: {
    generateUploadUrl: FunctionReference<"mutation", "public", {}, any>;
    getFileUrl: FunctionReference<
      "query",
      "public",
      { storageId: string },
      any
    >;
  };
  user: {
    getCurrentUser: FunctionReference<"query", "public", {}, any>;
  };
  wallet: {
    dailyBonusHistory: FunctionReference<"query", "public", {}, any>;
    dailyLogin: FunctionReference<"mutation", "public", {}, any>;
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
  employee: {
    signUpEmployeeInternal: FunctionReference<
      "action",
      "internal",
      {
        email: string;
        employeeId: any;
        name: string;
        password: string;
        username: string;
      },
      any
    >;
  };
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
        allowedDepartments?: Array<string>;
        allowedDivisions?: Array<string>;
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
        password: string;
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

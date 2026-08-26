/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
  AnyDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */

export type DataModel = {
  account: {
    document: {
      accessToken?: null | string;
      accessTokenExpiresAt?: null | number;
      accountId: string;
      createdAt?: number;
      idToken?: null | string;
      password?: null | string;
      providerId: string;
      refreshToken?: null | string;
      refreshTokenExpiresAt?: null | number;
      scope?: null | string;
      updatedAt?: null | number;
      userId: Id<"user">;
      _id: Id<"account">;
      _creationTime: number;
    };
    fieldPaths:
      | "accessToken"
      | "accessTokenExpiresAt"
      | "accountId"
      | "createdAt"
      | "_creationTime"
      | "_id"
      | "idToken"
      | "password"
      | "providerId"
      | "refreshToken"
      | "refreshTokenExpiresAt"
      | "scope"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_accountId: ["accountId", "_creationTime"];
      by_accountId_providerId: ["accountId", "providerId", "_creationTime"];
      by_providerId_userId: ["providerId", "userId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  activity: {
    document: {
      allowedDepartments?: null | Array<null | string>;
      allowedDivisions?: null | Array<null | string>;
      category: "external" | "internal" | "internal_bu" | "specials_point";
      createdAt?: number;
      description?: null | { en: string; th: string };
      endDate?: null | number;
      isActive: boolean;
      maxParticipants?: null | number;
      name: { en: string; th: string };
      point: number;
      startDate: number;
      updatedAt?: null | number;
      _id: Id<"activity">;
      _creationTime: number;
    };
    fieldPaths:
      | "allowedDepartments"
      | "allowedDivisions"
      | "category"
      | "createdAt"
      | "_creationTime"
      | "description"
      | "description.en"
      | "description.th"
      | "endDate"
      | "_id"
      | "isActive"
      | "maxParticipants"
      | "name"
      | "name.en"
      | "name.th"
      | "point"
      | "startDate"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
      by_startDate: ["startDate", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  activityLog: {
    document: {
      actorEmployeeId: Id<"employee">;
      meta?: null | string;
      sourceId: string;
      subjectEmployeeId?: null | Id<"employee">;
      summary: string;
      type:
        | "point_transfer_sent"
        | "point_transfer_approved"
        | "point_transfer_rejected"
        | "daily_login"
        | "first_login"
        | "login_streak"
        | "monthly_active"
        | "praise_streak"
        | "event_joined"
        | "event_completed"
        | "event_rejected"
        | "donation";
      _id: Id<"activityLog">;
      _creationTime: number;
    };
    fieldPaths:
      | "actorEmployeeId"
      | "_creationTime"
      | "_id"
      | "meta"
      | "sourceId"
      | "subjectEmployeeId"
      | "summary"
      | "type";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_actor: ["actorEmployeeId", "_creationTime"];
      by_subject: ["subjectEmployeeId", "_creationTime"];
      by_type: ["type", "_creationTime"];
      by_type_sourceId: ["type", "sourceId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  activityParticipant: {
    document: {
      activityId: Id<"activity">;
      awardedAt?: null | number;
      awardedBy?: null | Id<"user">;
      createdAt?: number;
      employeeId: Id<"employee">;
      evidenceFileName?: null | string;
      evidenceMimeType?: null | string;
      evidenceSize?: null | number;
      evidenceStorageId?: null | string;
      evidenceType?: null | "image" | "pdf";
      evidenceUploadedAt?: null | number;
      evidenceUploadedBy?: null | Id<"user">;
      pointAwarded?: null | number;
      status: "registered" | "attended" | "rewarded" | "cancelled";
      updatedAt?: null | number;
      _id: Id<"activityParticipant">;
      _creationTime: number;
    };
    fieldPaths:
      | "activityId"
      | "awardedAt"
      | "awardedBy"
      | "createdAt"
      | "_creationTime"
      | "employeeId"
      | "evidenceFileName"
      | "evidenceMimeType"
      | "evidenceSize"
      | "evidenceStorageId"
      | "evidenceType"
      | "evidenceUploadedAt"
      | "evidenceUploadedBy"
      | "_id"
      | "pointAwarded"
      | "status"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_activityId: ["activityId", "_creationTime"];
      by_activityId_employeeId: ["activityId", "employeeId", "_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_bucket: {
    document: {
      count: number;
      indexName: string;
      keyHash: string;
      keyParts: Array<any>;
      nonNullCountValues: Record<string, number>;
      sumValues: Record<string, number>;
      tableKey: string;
      updatedAt: number;
      _id: Id<"aggregate_bucket">;
      _creationTime: number;
    };
    fieldPaths:
      | "count"
      | "_creationTime"
      | "_id"
      | "indexName"
      | "keyHash"
      | "keyParts"
      | "nonNullCountValues"
      | `nonNullCountValues.${string}`
      | "sumValues"
      | `sumValues.${string}`
      | "tableKey"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_table_index: ["tableKey", "indexName", "_creationTime"];
      by_table_index_hash: [
        "tableKey",
        "indexName",
        "keyHash",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_extrema: {
    document: {
      count: number;
      fieldName: string;
      indexName: string;
      keyHash: string;
      sortKey: string;
      tableKey: string;
      updatedAt: number;
      value: any;
      valueHash: string;
      _id: Id<"aggregate_extrema">;
      _creationTime: number;
    };
    fieldPaths:
      | "count"
      | "_creationTime"
      | "fieldName"
      | "_id"
      | "indexName"
      | "keyHash"
      | "sortKey"
      | "tableKey"
      | "updatedAt"
      | "value"
      | "valueHash";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_table_index: ["tableKey", "indexName", "_creationTime"];
      by_table_index_hash_field_sort: [
        "tableKey",
        "indexName",
        "keyHash",
        "fieldName",
        "sortKey",
        "_creationTime",
      ];
      by_table_index_hash_field_value: [
        "tableKey",
        "indexName",
        "keyHash",
        "fieldName",
        "valueHash",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_member: {
    document: {
      docId: string;
      extremaValues: Record<string, any>;
      indexName: string;
      keyHash: string;
      keyParts: Array<any>;
      kind: string;
      nonNullCountValues: Record<string, number>;
      rankKey?: null | any;
      rankNamespace?: null | any;
      rankSumValue?: null | number;
      sumValues: Record<string, number>;
      tableKey: string;
      updatedAt: number;
      _id: Id<"aggregate_member">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "docId"
      | "extremaValues"
      | `extremaValues.${string}`
      | "_id"
      | "indexName"
      | "keyHash"
      | "keyParts"
      | "kind"
      | "nonNullCountValues"
      | `nonNullCountValues.${string}`
      | "rankKey"
      | "rankNamespace"
      | "rankSumValue"
      | "sumValues"
      | `sumValues.${string}`
      | "tableKey"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_kind_table_index: ["kind", "tableKey", "indexName", "_creationTime"];
      by_kind_table_index_doc: [
        "kind",
        "tableKey",
        "indexName",
        "docId",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_rank_node: {
    document: {
      aggregate?: null | { count: number; sum: number };
      items: Array<{ k: any; s: number; v: any }>;
      subtrees: Array<string>;
      _id: Id<"aggregate_rank_node">;
      _creationTime: number;
    };
    fieldPaths:
      | "aggregate"
      | "aggregate.count"
      | "aggregate.sum"
      | "_creationTime"
      | "_id"
      | "items"
      | "subtrees";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_rank_tree: {
    document: {
      aggregateName: string;
      maxNodeSize: number;
      namespace?: null | any;
      root: Id<"aggregate_rank_node">;
      _id: Id<"aggregate_rank_tree">;
      _creationTime: number;
    };
    fieldPaths:
      | "aggregateName"
      | "_creationTime"
      | "_id"
      | "maxNodeSize"
      | "namespace"
      | "root";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_aggregate_name: ["aggregateName", "_creationTime"];
      by_namespace: ["namespace", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aggregate_state: {
    document: {
      completedAt?: null | number;
      cursor?: null | string;
      indexName: string;
      keyDefinitionHash: string;
      kind: string;
      lastError?: null | string;
      metricDefinitionHash: string;
      processed: number;
      startedAt: number;
      status: string;
      tableKey: string;
      updatedAt: number;
      _id: Id<"aggregate_state">;
      _creationTime: number;
    };
    fieldPaths:
      | "completedAt"
      | "_creationTime"
      | "cursor"
      | "_id"
      | "indexName"
      | "keyDefinitionHash"
      | "kind"
      | "lastError"
      | "metricDefinitionHash"
      | "processed"
      | "startedAt"
      | "status"
      | "tableKey"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_kind_status: ["kind", "status", "_creationTime"];
      by_kind_table_index: ["kind", "tableKey", "indexName", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  cart: {
    document: {
      createdAt?: number;
      employeeId: Id<"employee">;
      status: "active" | "checked_out" | "abandoned";
      updatedAt?: null | number;
      _id: Id<"cart">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "employeeId"
      | "_id"
      | "status"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employeeId_status: ["employeeId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  cartItem: {
    document: {
      cartId: Id<"cart">;
      quantity: number;
      rewardId: Id<"reward">;
      _id: Id<"cartItem">;
      _creationTime: number;
    };
    fieldPaths: "cartId" | "_creationTime" | "_id" | "quantity" | "rewardId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_cartId: ["cartId", "_creationTime"];
      by_cartId_rewardId: ["cartId", "rewardId", "_creationTime"];
      by_rewardId: ["rewardId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  comment: {
    document: {
      content: string;
      createdAt?: number;
      employeeId: Id<"employee">;
      transactionId: Id<"transaction">;
      updatedAt?: null | number;
      _id: Id<"comment">;
      _creationTime: number;
    };
    fieldPaths:
      | "content"
      | "createdAt"
      | "_creationTime"
      | "employeeId"
      | "_id"
      | "transactionId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employeeId_transactionId: [
        "employeeId",
        "transactionId",
        "_creationTime",
      ];
      by_transactionId: ["transactionId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  donation: {
    document: {
      bahtAmount: number;
      createdAt?: number;
      donorEmployeeId: Id<"employee">;
      points: number;
      recipientEmployeeId: Id<"employee">;
      status: "completed";
      _id: Id<"donation">;
      _creationTime: number;
    };
    fieldPaths:
      | "bahtAmount"
      | "createdAt"
      | "_creationTime"
      | "donorEmployeeId"
      | "_id"
      | "points"
      | "recipientEmployeeId"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_donorEmployeeId: ["donorEmployeeId", "_creationTime"];
      by_recipientEmployeeId: ["recipientEmployeeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  employee: {
    document: {
      citizenId?: null | string;
      department: { en: string; th: string };
      departmentSearch?: null | string;
      division: string;
      email?: null | string;
      employeeId: string;
      name: { en: string; th: string } | string;
      nameSearch?: null | string;
      position: { en: string; th: string };
      rank: { en: string; th: string } | string;
      _id: Id<"employee">;
      _creationTime: number;
    };
    fieldPaths:
      | "citizenId"
      | "_creationTime"
      | "department"
      | "department.en"
      | "departmentSearch"
      | "department.th"
      | "division"
      | "email"
      | "employeeId"
      | "_id"
      | "name"
      | "name.en"
      | "nameSearch"
      | "name.th"
      | "position"
      | "position.en"
      | "position.th"
      | "rank"
      | "rank.en"
      | "rank.th";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_citizenId: ["citizenId", "_creationTime"];
      by_department: ["department", "_creationTime"];
      by_department_employeeId: ["department", "employeeId", "_creationTime"];
      by_division_department_employeeId: [
        "division",
        "department",
        "employeeId",
        "_creationTime",
      ];
      by_division_employeeId: ["division", "employeeId", "_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_rank_employeeId: ["rank", "employeeId", "_creationTime"];
    };
    searchIndexes: {
      search_department: {
        searchField: "departmentSearch";
        filterFields: never;
      };
      search_email: {
        searchField: "email";
        filterFields: never;
      };
      search_employeeId: {
        searchField: "employeeId";
        filterFields: never;
      };
      search_name: {
        searchField: "nameSearch";
        filterFields: never;
      };
    };
    vectorIndexes: {};
  };
  jwks: {
    document: {
      createdAt?: number;
      privateKey: string;
      publicKey: string;
      _id: Id<"jwks">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "_id"
      | "privateKey"
      | "publicKey";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  k2Workflow: {
    document: {
      employeeId: string;
      employees?: null | Array<null | string>;
      _id: Id<"k2Workflow">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "employeeId" | "employees" | "_id";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employees: ["employees", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  like: {
    document: {
      createdAt?: number;
      employeeId: Id<"employee">;
      transactionId: Id<"transaction">;
      _id: Id<"like">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "employeeId"
      | "_id"
      | "transactionId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employeeId_transactionId: [
        "employeeId",
        "transactionId",
        "_creationTime",
      ];
      by_transactionId: ["transactionId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  migration_run: {
    document: {
      allowDrift: boolean;
      cancelRequested: boolean;
      completedAt?: null | number;
      currentIndex: number;
      direction: string;
      dryRun: boolean;
      lastError?: null | string;
      migrationIds: Array<string>;
      runId: string;
      startedAt: number;
      status: string;
      updatedAt: number;
      _id: Id<"migration_run">;
      _creationTime: number;
    };
    fieldPaths:
      | "allowDrift"
      | "cancelRequested"
      | "completedAt"
      | "_creationTime"
      | "currentIndex"
      | "direction"
      | "dryRun"
      | "_id"
      | "lastError"
      | "migrationIds"
      | "runId"
      | "startedAt"
      | "status"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_run_id: ["runId", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  migration_state: {
    document: {
      applied: boolean;
      checksum: string;
      completedAt?: null | number;
      cursor?: null | string;
      direction?: null | string;
      lastError?: null | string;
      migrationId: string;
      processed: number;
      runId?: null | string;
      startedAt?: null | number;
      status: string;
      updatedAt: number;
      writeMode: string;
      _id: Id<"migration_state">;
      _creationTime: number;
    };
    fieldPaths:
      | "applied"
      | "checksum"
      | "completedAt"
      | "_creationTime"
      | "cursor"
      | "direction"
      | "_id"
      | "lastError"
      | "migrationId"
      | "processed"
      | "runId"
      | "startedAt"
      | "status"
      | "updatedAt"
      | "writeMode";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_migration_id: ["migrationId", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  news: {
    document: {
      body: { en: string; th: string };
      createdAt?: number;
      createdBy: Id<"user">;
      isPinned?: null | boolean;
      isPublished: boolean;
      publishedAt?: null | number;
      summary?: null | { en: string; th: string };
      title: { en: string; th: string };
      updatedAt?: null | number;
      _id: Id<"news">;
      _creationTime: number;
    };
    fieldPaths:
      | "body"
      | "body.en"
      | "body.th"
      | "createdAt"
      | "createdBy"
      | "_creationTime"
      | "_id"
      | "isPinned"
      | "isPublished"
      | "publishedAt"
      | "summary"
      | "summary.en"
      | "summary.th"
      | "title"
      | "title.en"
      | "title.th"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdBy: ["createdBy", "_creationTime"];
      by_isPublished: ["isPublished", "_creationTime"];
      by_isPublished_publishedAt: [
        "isPublished",
        "publishedAt",
        "_creationTime",
      ];
      by_publishedAt: ["publishedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pointLedger: {
    document: {
      balanceAfter: number;
      balanceType: "giving" | "receiving" | "special";
      createdAt?: number;
      delta: number;
      employeeId: Id<"employee">;
      note?: null | string;
      sourceId?: null | string;
      sourceType:
        | "transaction"
        | "redemption"
        | "activity"
        | "monthly_reset"
        | "daily_login"
        | "monthly_quest"
        | "first_login"
        | "login_streak"
        | "monthly_active"
        | "praise_streak"
        | "donation";
      _id: Id<"pointLedger">;
      _creationTime: number;
    };
    fieldPaths:
      | "balanceAfter"
      | "balanceType"
      | "createdAt"
      | "_creationTime"
      | "delta"
      | "employeeId"
      | "_id"
      | "note"
      | "sourceId"
      | "sourceType";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employeeId_sourceType: ["employeeId", "sourceType", "_creationTime"];
      by_sourceType_sourceId: ["sourceType", "sourceId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  redemption: {
    document: {
      carrier?: null | string;
      createdAt?: number;
      deliveredAt?: null | number;
      employeeId: Id<"employee">;
      fulfilledAt?: null | number;
      fulfilledBy?: null | Id<"employee">;
      note?: null | string;
      pointCostPerItem: number;
      pointSpent: number;
      quantity: number;
      rewardId: Id<"reward">;
      shippedAt?: null | number;
      shippingStatus?:
        | null
        | "pending"
        | "processing"
        | "shipped"
        | "delivered";
      status: "pending" | "fulfilled" | "cancelled";
      trackingNumber?: null | string;
      updatedAt?: null | number;
      _id: Id<"redemption">;
      _creationTime: number;
    };
    fieldPaths:
      | "carrier"
      | "createdAt"
      | "_creationTime"
      | "deliveredAt"
      | "employeeId"
      | "fulfilledAt"
      | "fulfilledBy"
      | "_id"
      | "note"
      | "pointCostPerItem"
      | "pointSpent"
      | "quantity"
      | "rewardId"
      | "shippedAt"
      | "shippingStatus"
      | "status"
      | "trackingNumber"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_employeeId_shippingStatus: [
        "employeeId",
        "shippingStatus",
        "_creationTime",
      ];
      by_employeeId_status: ["employeeId", "status", "_creationTime"];
      by_rewardId: ["rewardId", "_creationTime"];
      by_shippingStatus: ["shippingStatus", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  redemptionSummary: {
    document: {
      byStatusCancelled: number;
      byStatusFulfilled: number;
      byStatusPending: number;
      createdAt?: number;
      periodEnd: number;
      periodKey: string;
      periodStart: number;
      totalPointsSpent: number;
      totalRedemptions: number;
      _id: Id<"redemptionSummary">;
      _creationTime: number;
    };
    fieldPaths:
      | "byStatusCancelled"
      | "byStatusFulfilled"
      | "byStatusPending"
      | "createdAt"
      | "_creationTime"
      | "_id"
      | "periodEnd"
      | "periodKey"
      | "periodStart"
      | "totalPointsSpent"
      | "totalRedemptions";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_periodKey: ["periodKey", "_creationTime"];
      by_periodStart: ["periodStart", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  review: {
    document: {
      comment?: null | string;
      createdAt?: number;
      redemptionId: Id<"redemption">;
      rewardId: Id<"reward">;
      stars: number;
      userId: Id<"user">;
      _id: Id<"review">;
      _creationTime: number;
    };
    fieldPaths:
      | "comment"
      | "createdAt"
      | "_creationTime"
      | "_id"
      | "redemptionId"
      | "rewardId"
      | "stars"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_redemptionId: ["redemptionId", "_creationTime"];
      by_rewardId: ["rewardId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  reward: {
    document: {
      createdAt?: number;
      description?: null | { en: string; th: string };
      image?: null | string;
      isActive: boolean;
      name: { en: string; th: string };
      onePerOrder?: null | boolean;
      pointCost: number;
      stock: number;
      updatedAt?: null | number;
      _id: Id<"reward">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "description"
      | "description.en"
      | "description.th"
      | "_id"
      | "image"
      | "isActive"
      | "name"
      | "name.en"
      | "name.th"
      | "onePerOrder"
      | "pointCost"
      | "stock"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  session: {
    document: {
      createdAt?: number;
      expiresAt: number;
      ipAddress?: null | string;
      token: string;
      updatedAt?: null | number;
      userAgent?: null | string;
      userId: Id<"user">;
      _id: Id<"session">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "expiresAt"
      | "_id"
      | "ipAddress"
      | "token"
      | "updatedAt"
      | "userAgent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_expiresAt: ["expiresAt", "_creationTime"];
      by_expiresAt_userId: ["expiresAt", "userId", "_creationTime"];
      by_token: ["token", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  transaction: {
    document: {
      amount: number;
      createdAt?: number;
      message: string;
      receiverId: Id<"employee">;
      rejectionReason?: null | string;
      reviewedAt: number;
      reviewedBy: Id<"employee">;
      senderId: Id<"employee">;
      status: "pending" | "rejected" | "completed";
      tags: string;
      updatedAt?: null | number;
      _id: Id<"transaction">;
      _creationTime: number;
    };
    fieldPaths:
      | "amount"
      | "createdAt"
      | "_creationTime"
      | "_id"
      | "message"
      | "receiverId"
      | "rejectionReason"
      | "reviewedAt"
      | "reviewedBy"
      | "senderId"
      | "status"
      | "tags"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_receiverId: ["receiverId", "_creationTime"];
      by_receiverId_status: ["receiverId", "status", "_creationTime"];
      by_senderId: ["senderId", "_creationTime"];
      by_senderId_receiverId: ["senderId", "receiverId", "_creationTime"];
      by_senderId_status: ["senderId", "status", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  user: {
    document: {
      createdAt?: number;
      displayUsername: string;
      email?: null | string;
      emailVerified?: null | boolean;
      employeeId: Id<"employee">;
      image?: null | string;
      name: string;
      role: "admin" | "user";
      updatedAt?: null | number;
      username: string;
      _id: Id<"user">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "displayUsername"
      | "email"
      | "emailVerified"
      | "employeeId"
      | "_id"
      | "image"
      | "name"
      | "role"
      | "updatedAt"
      | "username";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_email: ["email", "_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
      by_role: ["role", "_creationTime"];
      by_username: ["username", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  verification: {
    document: {
      createdAt?: number;
      expiresAt: number;
      identifier: string;
      updatedAt?: null | number;
      value: string;
      _id: Id<"verification">;
      _creationTime: number;
    };
    fieldPaths:
      | "createdAt"
      | "_creationTime"
      | "expiresAt"
      | "_id"
      | "identifier"
      | "updatedAt"
      | "value";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_expiresAt: ["expiresAt", "_creationTime"];
      by_identifier: ["identifier", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  wallet: {
    document: {
      employeeId: Id<"employee">;
      givingBudget: number;
      lastBudgetUpdate: number;
      lastDailyBonus?: null | number;
      loginStreak?: null | number;
      praiseStreakMonths?: null | number;
      receivingBudget: number;
      specialBudget?: null | number;
      _id: Id<"wallet">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "employeeId"
      | "givingBudget"
      | "_id"
      | "lastBudgetUpdate"
      | "lastDailyBonus"
      | "loginStreak"
      | "praiseStreakMonths"
      | "receivingBudget"
      | "specialBudget";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_employeeId: ["employeeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
};

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(tableName, id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;

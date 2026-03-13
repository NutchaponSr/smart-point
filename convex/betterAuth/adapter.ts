import schema from "./schema";

import { createApi } from "@convex-dev/better-auth";

import { createAuthOptions } from "../auth";

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions);
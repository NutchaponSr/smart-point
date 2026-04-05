import { getAuth } from "../functions/generated/auth";
import { Select } from "./api";

export type Auth = ReturnType<typeof getAuth>;
export type SessionUser = Select<"user"> & {
  session: Select<"session">;
}
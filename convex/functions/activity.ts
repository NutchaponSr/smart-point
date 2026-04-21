import z from "zod/v4";

import { publicQuery } from "../lib/crpc";

export const getMany = publicQuery
  .input(
    z.object({
      q: z.string().optional(),
      sort: z.enum(["newest", "oldest"]).optional(),
      minDate: z.number().optional(),
      maxDate: z.number().optional(),
      minParticipants: z.number().optional(),
      maxParticipants: z.number().optional(),
      isActive: z.boolean().optional(),
    })
  )
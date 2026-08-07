import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * ทุกวัน 17:00 UTC = 00:00 ICT ของวันถัดไป
 * → dailyProgramMaintenance เช็ควันไทยแล้วรีเซ็ดงบ / สรุปปักษ์ / เคลียร์ต้นปี
 */
crons.daily(
  "program-maintenance-ict-midnight",
  { hourUTC: 17, minuteUTC: 0 },
  internal.wallet.dailyProgramMaintenance,
);

export default crons;

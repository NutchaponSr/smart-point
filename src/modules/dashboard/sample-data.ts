export const dashboardMeta = {
  title: "แดชบอร์ดระบบ SMART POINT Recognition",
  audience: "มุมมองผู้จัดการฝ่ายทรัพยากรบุคคลและผู้บริหาร",
  scope: "มุมมองแอดมิน: ไตรมาส 3 | มายยางพร, ระยอง, ไทย",
  period: "ก.ย. - ต.ค. 2569 | ไตรมาส 3 | MAP YANG PHON",
  filters: ["แผนก: ทุกแผนก", "ระดับ: ทุกระดับ", "ค่านิยมหลัก: ทุกค่านิยม"],
};

export const kpis = {
  activeRate: {
    label: "อัตราผู้ใช้งานจริง",
    percent: 62.5,
    active: 1125,
    total: 1800,
    target: 80,
    belowTarget: true,
  },
  pointsUsed: {
    label: "คะแนนที่มีการใช้งาน",
    total: 48500,
    p2p: 65,
    activity: 35,
  },
  redemption: {
    label: "อัตราการแลกของรางวัล Pre-order",
    percent: 78,
    redeemed: 877,
    eligible: 1125,
    orders: 1240,
  },
  budget: {
    label: "การใช้งบประมาณ (เป้าหมาย 50K)",
    spent: 31250,
    target: 50000,
    percent: 62.5,
    belowTarget: true,
  },
};

export const dailyActiveUsers = [
  42, 46, 44, 52, 49, 58, 55, 63, 60, 68, 72, 69, 76, 74, 82, 79, 86, 83, 90,
  88, 84, 91, 87, 80, 85, 89, 84, 88, 82, 86,
];

export const participationMatrix = {
  senderLabel: "ผู้ส่ง",
  receiverLabel: "ผู้รับ",
  departments: ["ปฏิบัติการ", "พาณิชย์", "การเงิน", "บุคคล"],
  cells: [
    [3, 4, 2, 1],
    [4, 3, 2, 1],
    [2, 3, 4, 2],
    [1, 2, 3, 2],
  ],
};

export const topExchanges = [
  { from: "ฝ่ายปฏิบัติการ", to: "ฝ่ายการพาณิชย์" },
  { from: "ฝ่ายปฏิบัติการ", to: "ฝ่ายการเงิน" },
  { from: "ฝ่ายการพาณิชย์", to: "ฝ่ายปฏิบัติการ" },
  { from: "ฝ่ายการเงิน", to: "ฝ่ายปฏิบัติการ" },
  { from: "ฝ่ายบุคคล", to: "ฝ่ายการพาณิชย์" },
];

export const popularRewards = [
  { name: "ของรางวัลสุขภาพ", points: 200 },
  { name: "แก้วน้ำสแตนเลส", points: 150 },
  { name: "Set อาบน้ำ", points: 75 },
  { name: "ชุดของขวัญองค์กร", points: 75 },
];

export const pointDistribution = [
  { label: "<10", height: 48, color: "#1cb0f6" },
  { label: "10-25", height: 64, color: "#ce82ff" },
  { label: "50-75", height: 78, color: "#58cc02" },
  { label: "100-150", height: 100, color: "#ff9600" },
  { label: "200", height: 54, color: "#ff4b4b" },
];

export const donationSummary = {
  title: "สรุปผลกระทบจากการบริจาค",
  note: "คะแนนที่บริจาค (<10 Pts)",
  points: 4850,
  baht: 4850,
};

export const praises = [
  {
    from: "สมศักดิ์",
    fromDept: "Operations",
    to: "นิภา",
    toDept: "Finance",
    message: "ขอบคุณสำหรับการช่วยเร่งรัดเอกสารเบิกจ่ายสิ้นเดือน ทำให้ทีมทำงานได้ตามกำหนดครับ",
    hashtag: "#Synergy",
    tags: ["ดีเยี่ยม", "ทีมเวิร์ค", "ขอบคุณ"],
    time: "2 นาทีที่แล้ว",
  },
  {
    from: "คุณพัฒน์",
    fromDept: "Commercial",
    to: "คุณนิภา",
    toDept: "Accounting",
    message: "ยอดเยี่ยมมากครับสำหรับสรุปรายงานรายสัปดาห์ รวดเร็วและถูกต้องที่สุด!",
    hashtag: "#Mastery",
    tags: ["ดีเยี่ยม", "เป็นมืออาชีพ", "ขอบคุณ"],
    time: "2 นาทีที่แล้ว",
  },
];

export const heatmapShades = [
  "#e5e5e5",
  "#d7ffb8",
  "#89e219",
  "#58cc02",
  "#58a700",
];

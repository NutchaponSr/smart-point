export enum Status {
  pending = "pending",
  rejected = "rejected",
  completed = "completed",
}

export const statuses: Record<Status, string> = {
  pending: "Pending",
  rejected: "Rejected",
  completed: "Completed",
}

export const transactionHeaders = {
  senderId: "Sender ID",
  sender: "Sender",
  receiverId: "Receiver ID",
  amount: "Amount",
  message: "Message",
  tags: "Tags",
  status: "Status",
  reviewedBy: "Reviewed By",
  reviewedAt: "Reviewed At",
}

export const SMART_CULTURE_TITLE = "SMART Culture" as const

export type SmartCulturePillarKey = "S" | "M" | "A" | "R" | "T"

type SmartCultureLevel = {
  readonly points: 5 | 15 | 20
  readonly title: string
  readonly description: string
}

export type SmartCulturePillar = {
  readonly key: SmartCulturePillarKey
  readonly nameTh: string
  readonly nameEn: string
  readonly levels: readonly SmartCultureLevel[]
}

export const smartCulturePillars: readonly SmartCulturePillar[] = [
  {
    key: "S",
    nameTh: "สัญญาโปร่งใส",
    nameEn: "Spirit of Commitment, Integrity & Ethic",
    levels: [
      {
        points: 5,
        title: "รักษาระเบียบ",
        description:
          "เป็นแบบอย่างที่ดีในการทำตามระเบียบขององค์กร",
      },
      {
        points: 15,
        title: "รักษาคำพูดสุดยอด",
        description: "ทำตามที่รับปากไว้เป๊ะ ไม่เคยผิดนัด",
      },
      {
        points: 20,
        title: "ซื่อสัตย์จริงใจ",
        description: "รายงานข้อมูลตามจริง โปร่งใส ตรวจสอบได้",
      },
    ],
  },
  {
    key: "M",
    nameTh: "ใส่ใจเรียนรู้",
    nameEn: "Mastery of Learning & Applying Technology",
    levels: [
      {
        points: 5,
        title: "เรียนรู้ไว",
        description:
          "หมั่นเรียนรู้/ปรับตัวเข้ากับระบบใหม่หรือความรู้ใหม่ได้รวดเร็ว",
      },
      {
        points: 15,
        title: "กล้าตัดสินใจ",
        description:
          "กล้าลองทำในสิ่งที่ไม่เคยทำ เพื่อผลลัพธ์ที่ดีกว่า",
      },
      {
        points: 20,
        title: "กูรูเทคโนโลยี",
        description:
          "นำเครื่องมือหรือ AI ใหม่ๆ มาช่วยให้ทำงานง่ายขึ้น",
      },
    ],
  },
  {
    key: "A",
    nameTh: "สู่การเปลี่ยนแปลง",
    nameEn: "Agility",
    levels: [
      {
        points: 5,
        title: "คิดบวกรับความเปลี่ยนแปลง",
        description:
          "ไม่หวั่นไหวกับงานด่วนหรือการเปลี่ยนทิศทาง",
      },
      {
        points: 15,
        title: "ตัวจริงเรื่องปรับเปลี่ยน",
        description: "ปรับแผนงานเก่ง ทันต่อสถานการณ์ที่เปลี่ยนไป",
      },
      {
        points: 20,
        title: "จอมวางแผน (PDCA)",
        description: "ปรับปรุงงานให้ดีขึ้นตลอดเวลา ไม่หยุดนิ่ง",
      },
    ],
  },
  {
    key: "R",
    nameTh: "แสดงการยอมรับ",
    nameEn: "Respect Others and Value Diversity",
    levels: [
      {
        points: 5,
        title: "สุดยอดผู้ฟัง",
        description:
          "รับฟังความคิดเห็นที่แตกต่างด้วยความเคารพ",
      },
      {
        points: 15,
        title: "เปิดใจกว้าง",
        description:
          "ยอมรับความแตกต่างและดึงจุดเด่นของทุกคนมาใช้",
      },
      {
        points: 20,
        title: "ทีมเวิร์คดีเด่น",
        description: "ช่วยหาข้อสรุปที่ทุกคนแฮปปี้และไปต่อได้",
      },
    ],
  },
  {
    key: "T",
    nameTh: "สนับสนุนลูกค้า",
    nameEn: "Think Customers, Think Value",
    levels: [
      {
        points: 5,
        title: "ใส่ใจลูกค้าที่หนึ่ง",
        description:
          "เข้าใจความต้องการของลูกค้าแบบรู้ใจสุดๆ",
      },
      {
        points: 15,
        title: "งานเนี๊ยบตรงเวลา",
        description: "ส่งมอบคุณภาพงานที่ดีเยี่ยมตามกำหนด",
      },
      {
        points: 20,
        title: "Customer Centric",
        description: "คิดแทนลูกค้าและเสนอทางออกที่คุ้มค่าเสมอ",
      },
    ],
  },
]

export type SmartCultureTagOption = {
  readonly id: string
  readonly pillarKey: SmartCulturePillarKey
  readonly pillarNameTh: string
  readonly points: 5 | 15 | 20
  readonly title: string
  readonly description: string
}

/** 15 รายการ แยกกลุ่ม S–T รวม flat สำหรับเมนู/รายการ */
export const smartCultureTagOptions: readonly SmartCultureTagOption[] =
  smartCulturePillars.flatMap((pillar) =>
    pillar.levels.map((level) => ({
      id: `${pillar.key}_${level.points}`,
      pillarKey: pillar.key,
      pillarNameTh: pillar.nameTh,
      points: level.points,
      title: level.title,
      description: level.description,
    })),
  )

const smartCultureIndex = (() => {
  const map: Record<string, string> = {}
  const ids: string[] = []
  for (const pillar of smartCulturePillars) {
    for (const level of pillar.levels) {
      const id = `${pillar.key}_${level.points}`
      ids.push(id)
      map[id] = `${pillar.key}: ${level.title} (${level.points})`
    }
  }
  return { tags: map, tagIds: ids }
})()

/** รหัสแท็ก `S_5` … `T_20` ค่าเป็นข้อความสั้นสำหรับแสดง/ส่งออก */
export const tags: Record<string, string> = smartCultureIndex.tags
export const smartCultureTagIds: string[] = smartCultureIndex.tagIds

const TAG_ID_RE = /^(S|M|A|R|T)_(5|15|20)$/

export function getSmartCultureTagPoints(tagId: string): number | null {
  const m = TAG_ID_RE.exec(tagId)
  return m ? Number(m[2]) : null
}

export function isSmartCultureTagId(value: string): boolean {
  return TAG_ID_RE.test(value) && value in tags
}

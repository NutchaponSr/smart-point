# คู่มือติดตั้งโปรเจกต์ Smart Point

โปรเจกต์นี้เป็นเว็บแอปที่พัฒนาด้วย [Next.js](https://nextjs.org) (frontend) และ [Convex](https://convex.dev) (backend/database) พร้อมระบบยืนยันตัวตนด้วย [Better Auth](https://www.better-auth.com)

## สิ่งที่ต้องมีก่อนติดตั้ง (Prerequisites)

- [Node.js](https://nodejs.org) เวอร์ชัน 20 ขึ้นไป
- npm (มาพร้อม Node.js)
- Git
- บัญชี [Convex](https://dashboard.convex.dev) (ใช้ login ฟรีผ่าน GitHub/Google/อีเมล)

ตรวจสอบเวอร์ชัน Node.js:

```bash
node -v
```

## ขั้นตอนที่ 1: Clone โปรเจกต์

```bash
git clone https://github.com/NutchaponSr/smart-point.git
cd smart-point
```

## ขั้นตอนที่ 2: ติดตั้ง dependencies

```bash
npm install
```

## ขั้นตอนที่ 3: ตั้งค่า Convex

รันคำสั่งต่อไปนี้เพื่อ login และเชื่อมโปรเจกต์กับ deployment ของ Convex (ครั้งแรกจะมีลิงก์เปิดเบราว์เซอร์ให้ล็อกอิน และให้เลือก/สร้างโปรเจกต์):

```bash
npx convex dev
```

คำสั่งนี้จะสร้างไฟล์ `.env.local` ให้อัตโนมัติ พร้อมค่าต่อไปนี้:

```env
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=<deployment ของโปรเจกต์คุณ>

NEXT_PUBLIC_CONVEX_URL=<URL ของ Convex deployment>

NEXT_PUBLIC_CONVEX_SITE_URL=<URL สำหรับ HTTP actions ของ Convex>
```

> ปล่อยให้เทอร์มินัลที่รัน `npx convex dev` ทำงานค้างไว้ระหว่างพัฒนา เพื่อ sync schema/functions ไปยัง Convex อัตโนมัติเมื่อมีการแก้โค้ดใน `convex/`

### ตั้งค่า environment variable ฝั่ง Convex backend

ระบบยืนยันตัวตน (`convex/functions/auth.ts`) ต้องใช้ตัวแปร `SITE_URL` บนฝั่ง Convex deployment (ไม่ใช่ใน `.env.local`) ให้รันคำสั่งนี้อีก terminal หนึ่ง:

```bash
npx convex env set SITE_URL http://localhost:3000
```

## ขั้นตอนที่ 4: รันเว็บแอปในโหมด Development

เปิดอีก terminal หนึ่ง (แยกจาก `npx convex dev`) แล้วรัน:

```bash
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## ขั้นตอนที่ 5 (ทางเลือก): ใส่ข้อมูลตัวอย่าง (Seed data)

โปรเจกต์มีสคริปต์สำหรับ seed ข้อมูลตัวอย่าง (อ่านพนักงานจาก `scripts/employee.csv`):

```bash
npm run seed
```

ลบข้อมูลทั้งหมดที่ seed ไว้:

```bash
npm run clear-data
```

## คำสั่งอื่น ๆ ที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | รันเซิร์ฟเวอร์ Next.js สำหรับพัฒนา |
| `npm run build` | build โปรเจกต์สำหรับ production |
| `npm run start` | รัน production build ที่ build ไว้แล้ว |
| `npm run lint` | ตรวจสอบโค้ดด้วย Biome |
| `npm run format` | จัดฟอร์แมตโค้ดด้วย Biome |
| `npm run seed` | เพิ่มข้อมูลตัวอย่างลง Convex |
| `npm run clear-data` | ลบข้อมูลทั้งหมดออกจาก Convex |

## แก้ปัญหาเบื้องต้น (Troubleshooting)

- **หน้าเว็บขึ้น error เชื่อมต่อ Convex ไม่ได้**: ตรวจสอบว่า `npx convex dev` ยังรันอยู่ และค่าใน `.env.local` ถูกสร้างครบ (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`)
- **สมัครสมาชิก/ล็อกอินไม่ได้**: ตรวจสอบว่าได้ตั้งค่า `SITE_URL` บน Convex deployment แล้ว (`npx convex env set SITE_URL http://localhost:3000`)
- **แก้โค้ดใน `convex/` แล้วไม่มีผล**: ต้องมี terminal ที่รัน `npx convex dev` ทำงานอยู่ตลอดเวลา ไฟล์จะถูก deploy ไปที่ Convex อัตโนมัติเมื่อบันทึก

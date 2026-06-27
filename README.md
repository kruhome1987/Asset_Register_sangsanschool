# ระบบทะเบียนคุมทรัพย์สิน โรงเรียนวัดแสงสรรค์

ระบบจัดการทะเบียนครุภัณฑ์สำหรับโรงเรียน พัฒนาด้วย HTML/JavaScript + Google Apps Script + Google Sheets

## โครงสร้างไฟล์

```
asset-registry/
├── index.html        ← หน้าเว็บหลัก (Frontend ทั้งหมด)
├── config.js         ← ตั้งค่า URL และรหัสผ่าน (แก้ที่นี่เท่านั้น)
├── vercel.json       ← ตั้งค่า Vercel deployment
├── Code.gs           ← Google Apps Script (อัปโหลดใน Google Apps Script)
└── README.md
```

## วิธี Deploy บน Vercel

### ขั้นตอนที่ 1 — อัปโหลดโค้ดขึ้น GitHub
1. สร้าง repository ใหม่บน GitHub (ตั้งชื่อตามต้องการ เช่น `asset-registry`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ (ยกเว้น `Code.gs` ซึ่งอยู่ที่ Google Apps Script)

### ขั้นตอนที่ 2 — Deploy บน Vercel
1. ไปที่ [vercel.com](https://vercel.com) → **Add New Project**
2. เลือก repository จาก GitHub
3. Framework Preset → เลือก **Other**
4. กด **Deploy** ได้เลย (ไม่ต้องตั้งค่าเพิ่ม)

### ขั้นตอนที่ 3 — ตั้งค่า Google Apps Script
1. เปิดไฟล์ `Code.gs` ใน Google Apps Script
2. Deploy → **New Deployment** → Web App
   - Execute as: **Me**
   - Who has access: **Anyone** ← ⚠️ สำคัญมาก ต้องเลือก Anyone จึงจะ POST ได้
3. คัดลอก URL ที่ได้มาใส่ใน `config.js` ช่อง `APP_SCRIPT_URL`

## วิธีเปลี่ยนรหัสผ่าน Admin

1. ไปที่ [https://emn178.github.io/online-tools/sha256.html](https://emn178.github.io/online-tools/sha256.html)
2. พิมพ์รหัสผ่านใหม่ที่ต้องการ → คัดลอก hash ที่ได้
3. เปิดไฟล์ `config.js` → แก้ไขค่า `ADMIN_PASSWORD_HASH`
4. commit และ push ขึ้น GitHub → Vercel จะ deploy ใหม่อัตโนมัติ

> **หมายเหตุ:** รหัสผ่านปัจจุบันคือ `7890` (username: `admin`)

## ฟีเจอร์หลัก

- 📋 สารบัญประเภทหลักครุภัณฑ์ตามมาตรฐาน สพฐ.
- 🏷️ ทะเบียนรายชิ้นพร้อมค้นหา/กรองหลายมิติ
- 🔢 แนะนำเลขครุภัณฑ์อัตโนมัติ (รูปแบบ `รหัส/ลำดับ/ปีพ.ศ.`)
- 🔒 Room PIN สำหรับการตรวจสอบครุภัณฑ์แยกห้อง
- 📊 ประเมินค่าเสื่อมราคาตามหลักการบัญชี
- ✅ ระบบตรวจนับประจำปี (ตรวจสอบแล้ว / รอตรวจสอบ / ไม่พบครุภัณฑ์)
- 📥 ส่งออก Excel (CSV)

## ผู้พัฒนา

ว่าที่ร้อยตรีบุญโฮม ตรองติรัมย์  
ครูประจำชั้น ป.3/2 โรงเรียนวัดแสงสรรค์

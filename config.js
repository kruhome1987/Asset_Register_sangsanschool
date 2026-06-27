/**
 * ระบบทะเบียนคุมทรัพย์สิน โรงเรียนวัดแสงสรรค์
 * ไฟล์กำหนดค่า (แก้ไขที่นี่เมื่อต้องการเปลี่ยน URL หรือตั้งค่าอื่น ๆ)
 */

// URL ของ Google Apps Script Web App (แก้ไขหลัง re-deploy GAS)
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyo_8DGXbUhh5MWpA4WIbDVyoh30VKgmdehw_DxGflkbQn6amQTRxaadKcL3SlTruqo/exec";

/**
 * รหัสผ่านแอดมิน (SHA-256 hash)
 * วิธีสร้าง hash ใหม่: ไปที่ https://emn178.github.io/online-tools/sha256.html
 * พิมพ์รหัสผ่านที่ต้องการ → คัดลอก hash มาใส่แทนด้านล่าง
 * รหัสผ่านปัจจุบัน: 7890 (เปลี่ยนได้ตามต้องการ)
 */
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD_HASH = "6a95bbab63d587b596398c4bd7e91a132f24032d2007d107e5ea71967724b092"; // sha256("7890")

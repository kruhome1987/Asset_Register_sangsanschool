// ไฟล์: api/getData.js
export default async function handler(req, res) {
  // จำ Cache ไว้ 30 วินาที เพื่อความรวดเร็ว
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

  const SPREADSHEET_ID = '1ZU2qByqg50fspEtV2n-ZPkXIEokHIvxQIOGX3_PdjNQ';
  const API_KEY = process.env.GOOGLE_API_KEY; // ใช้กุญแจเดิมใน Vercel ได้เลย

  try {
    // 1. ดึงรายชื่อชีตทั้งหมดที่มีในไฟล์
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    const metaRes = await fetch(metaUrl);
    const metaData = await metaRes.json();
    
    if (!metaData.sheets) throw new Error("ไม่สามารถอ่านข้อมูล Google Sheet ได้");
    
    const sheetNames = metaData.sheets.map(s => s.properties.title);

    // 2. ดึงข้อมูลจากทุกชีตพร้อมกันในครั้งเดียว (Batch Get)
    const ranges = sheetNames.map(name => encodeURIComponent(`${name}!A:Z`)).join('&ranges=');
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?ranges=${ranges}&key=${API_KEY}`;
    
    const dataRes = await fetch(dataUrl);
    const batchData = await dataRes.json();

    let catalog = [];
    let records = [];
    let roomPINs = {};

    // ฟังก์ชันช่วยจัดรูปแบบข้อมูลแบบตารางให้กลายเป็น Object
    const formatSheet = (values) => {
      if (!values || values.length <= 1) return [];
      const headers = values[0];
      return values.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = row[i] || ''; });
        return obj;
      });
    };

    // 3. แยกแยะข้อมูลตามชื่อชีต
    batchData.valueRanges.forEach((rangeData) => {
      // ดึงชื่อชีตออกมาจากชื่อ Range
      let sheetName = rangeData.range.split('!')[0].replace(/'/g, '');
      const values = rangeData.values || [];

      if (sheetName === 'AssetCatalog') {
        catalog = formatSheet(values);
      } else if (sheetName === 'RoomPIN') {
        if (values.length > 1) {
          for (let i = 1; i < values.length; i++) {
            const room = values[i][0] ? String(values[i][0]).trim() : '';
            const pin = values[i][1] ? String(values[i][1]).trim() : '';
            if (room) roomPINs[room] = pin;
          }
        }
      } else if (sheetName !== 'ชีต1' && sheetName !== 'Sheet1') {
        // ชีตอื่นๆ ถือว่าเป็นชีตเก็บรายการครุภัณฑ์รายชิ้น
        records = records.concat(formatSheet(values));
      }
    });

    // 4. ส่งข้อมูลกลับไปให้หน้าเว็บ
    return res.status(200).json({ status: 'success', catalog, records, roomPINs });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.toString() });
  }
}
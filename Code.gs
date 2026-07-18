// ======================================================================
// Code.gs — Google Apps Script สำหรับระบบทะเบียนคุมทรัพย์สิน
// โรงเรียนวัดแสงสรรค์
//
// วิธีใช้: นำโค้ดนี้ไปวางใน Google Apps Script แล้ว Deploy เป็น Web App
// ตั้งค่า: Execute as "Me", Who has access "Anyone"
// ======================================================================

const SHEET_ID = '1ZU2qByqg50fspEtV2n-ZPkXIEokHIvxQIOGX3_PdjNQ';

// 👇 ใส่ ID โฟลเดอร์ Google Drive ที่เปิดแชร์สาธารณะ (Anyone with link) ไว้แล้ว สำหรับเก็บรูป
const IMAGE_FOLDER_ID = '1XkXNNNiwUvzyks6aGoUweMGpWGndxfDw'; 

function doGet(e) {
  // ถ้าไม่มี action → แสดงหน้าเว็บ (สำหรับ GAS Hosted เท่านั้น, Vercel ไม่ใช้ส่วนนี้)
  if (!e || !e.parameter || !e.parameter.action) {
    return HtmlService.createTemplateFromFile('Index')
        .evaluate()
        .setTitle('ระบบทะเบียนคุมทรัพย์สิน โรงเรียนวัดแสงสรรค์')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    setupCatalogSheet(ss);

    if (e.parameter.action === 'test') {
      return createResponse({ status: 'success', message: 'เชื่อมต่อสำเร็จ' });
    }

    const catalogSheet = ss.getSheetByName('AssetCatalog');
    const catalogData = getSheetRows(catalogSheet);

    let recordsData = [];
    const allSheets = ss.getSheets();
    for (let i = 0; i < allSheets.length; i++) {
      const sheetName = allSheets[i].getName();
      if (sheetName !== 'AssetCatalog' && sheetName !== 'ชีต1' && sheetName !== 'Sheet1' && sheetName !== 'RoomPIN') {
        recordsData = recordsData.concat(getSheetRows(allSheets[i]));
      }
    }

    return createResponse({
      status: 'success',
      catalog: catalogData,
      records: recordsData,
      roomPINs: getRoomPinData(ss)
    });
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

function getRoomPinData(ss) {
  let sheet = ss.getSheetByName('RoomPIN');
  if (!sheet) {
    sheet = ss.insertSheet('RoomPIN');
    sheet.appendRow(['สถานที่เก็บ / ชื่อห้อง', 'รหัส PIN (4 หลัก)']);
    sheet.appendRow(['ห้อง ป.3/1', '1111']);
    sheet.appendRow(['ห้อง ป.3/2', '2222']);
    sheet.appendRow(['ห้องวิทยาศาสตร์', '3333']);
    sheet.appendRow(['ห้องพักครู', '4444']);
    sheet.appendRow(['พัสดุ', '9999']);
  }
  const data = sheet.getDataRange().getDisplayValues();
  const obj = {};
  for (let i = 1; i < data.length; i++) {
    const room = String(data[i][0]).trim();
    const pin = String(data[i][1]).trim();
    if (room) obj[room] = pin;
  }
  return obj;
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    setupCatalogSheet(ss);

    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'addCatalog') {
      const catalogSheet = ss.getSheetByName('AssetCatalog');
      catalogSheet.appendRow([
        "'" + params['รหัสครุภัณฑ์'],
        params['ชื่อครุภัณฑ์'],
        params['ประเภทครุภัณฑ์'],
        params['อายุการใช้งาน'],
        params['จำนวนคงเหลือ'] || 0,
        params['หน่วยนับ']
      ]);
      const lastRow = catalogSheet.getLastRow();
      if (lastRow > 1) {
        catalogSheet.getRange(2, 1, lastRow - 1, catalogSheet.getLastColumn()).sort(1);
      }
      return createResponse({ status: 'success' });
    }
    else if (action === 'addRecord') {
      const parentCode = params['รหัสครุภัณฑ์หลัก'];
      let targetSheet = getOrCreateSheet(ss, parentCode);
      
      // จัดการเซฟรูปภาพ
      let imageUrl = '';
      if (params.imageB64 && IMAGE_FOLDER_ID !== 'ใส่_ID_โฟลเดอร์_Drive_ที่นี่') {
        imageUrl = saveImageToDrive(params.imageB64, params.imageMime, params['เลขครุภัณฑ์'].replace(/\//g, '-') + "_" + new Date().getTime());
      }

      targetSheet.appendRow([
        "'" + parentCode,
        params['วันที่ได้มา'],
        "'" + params['เลขครุภัณฑ์'],
        params['ชื่อรายการ'],
        params['ลักษณะขนาด'],
        params['ราคาต่อหน่วย'],
        params['สถานที่เก็บ'],
        params['สถานะ'],
        params['วันที่จำหน่าย'] || '',
        params['ประเภทเงิน'] || '',
        params['วิธีการที่ได้มา'] || '',
        params['การตรวจสอบ'] || 'ตรวจสอบแล้ว',
        params['รหัส GFMIS'] || '',
        params['เอกสารอ้างอิง'] || '',
        imageUrl // คอลัมน์ที่ 15 เก็บ URL รูปภาพ
      ]);
      return createResponse({ status: 'success' });
    }
    else if (action === 'editRecord') {
      deleteRecordFromAllSheets(ss, params['oldSerial']);
      const parentCode = params['รหัสครุภัณฑ์หลัก'];
      let targetSheet = getOrCreateSheet(ss, parentCode);
      
      // จัดการเซฟรูปภาพกรณีแก้ไข
      let imageUrl = params['existingImageUrl'] || '';
      if (params.imageB64 && IMAGE_FOLDER_ID !== 'ใส่_ID_โฟลเดอร์_Drive_ที่นี่') {
        imageUrl = saveImageToDrive(params.imageB64, params.imageMime, params['เลขครุภัณฑ์'].replace(/\//g, '-') + "_" + new Date().getTime());
      }

      targetSheet.appendRow([
        "'" + parentCode,
        params['วันที่ได้มา'],
        "'" + params['เลขครุภัณฑ์'],
        params['ชื่อรายการ'],
        params['ลักษณะขนาด'],
        params['ราคาต่อหน่วย'],
        params['สถานที่เก็บ'],
        params['สถานะ'],
        params['วันที่จำหน่าย'] || '',
        params['ประเภทเงิน'] || '',
        params['วิธีการที่ได้มา'] || '',
        params['การตรวจสอบ'] || 'ตรวจสอบแล้ว',
        params['รหัส GFMIS'] || '',
        params['เอกสารอ้างอิง'] || '',
        imageUrl // คอลัมน์ที่ 15 เก็บ URL รูปภาพ
      ]);
      return createResponse({ status: 'success' });
    }
    else if (action === 'updateCheckStatus') {
      const allSheets = ss.getSheets();
      const searchSerial = String(params.serialNumber).trim();
      let isUpdated = false;
      for (let s = 0; s < allSheets.length; s++) {
        const sheet = allSheets[s];
        const sheetName = sheet.getName();
        if (sheetName !== 'AssetCatalog' && sheetName !== 'ชีต1' && sheetName !== 'Sheet1' && sheetName !== 'RoomPIN') {
          const data = sheet.getDataRange().getDisplayValues();
          for (let i = data.length - 1; i >= 1; i--) {
            if (String(data[i][2]).trim() === searchSerial) {
              sheet.getRange(i + 1, 12).setValue(params.checkStatus);
              isUpdated = true;
              break;
            }
          }
        }
        if (isUpdated) break;
      }
      return createResponse({ status: isUpdated ? 'success' : 'error', message: isUpdated ? '' : 'ไม่พบครุภัณฑ์นี้ในระบบ' });
    }
    else if (action === 'deleteCatalog') {
      const catalogSheet = ss.getSheetByName('AssetCatalog');
      deleteRowByValue(catalogSheet, 0, params.code);
      return createResponse({ status: 'success' });
    }
    else if (action === 'deleteRecord') {
      deleteRecordFromAllSheets(ss, params.serialNumber);
      return createResponse({ status: 'success' });
    }
    else if (action === 'resetAllAudits') {
      const allSheets = ss.getSheets();
      for (let s = 0; s < allSheets.length; s++) {
        const sheet = allSheets[s];
        const sheetName = sheet.getName();
        if (sheetName !== 'AssetCatalog' && sheetName !== 'ชีต1' && sheetName !== 'Sheet1' && sheetName !== 'RoomPIN') {
          const lastRow = sheet.getLastRow();
          if (lastRow > 1) {
            const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
            const data = dataRange.getDisplayValues();
            const newAuditValues = [];
            for (let i = 0; i < data.length; i++) {
              const status = String(data[i][7]).trim();
              newAuditValues.push(status === 'จำหน่ายแล้ว' ? [data[i][11]] : ['รอตรวจสอบ']);
            }
            sheet.getRange(2, 12, newAuditValues.length, 1).setValues(newAuditValues);
          }
        }
      }
      return createResponse({ status: 'success' });
    }

    return createResponse({ status: 'error', message: 'ไม่มี action ที่ตรงกัน' });
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

// =====================================================================
// Helper Functions
// =====================================================================

// ฟังก์ชันบันทึกรูปลง Drive
function saveImageToDrive(base64Data, mimeType, fileName) {
  try {
    if (!base64Data) return '';
    const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
    // ตัด Header ของ Base64 ออก (เช่น data:image/jpeg;base64,)
    const data = base64Data.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, fileName);
    const file = folder.createFile(blob);
    // เซ็ตสิทธิ์ให้คนนอกดูรูปผ่านเว็บได้
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    console.log("Error saving image: " + e.toString());
    return '';
  }
}

function setupCatalogSheet(ss) {
  if (!ss.getSheetByName('AssetCatalog')) {
    const s = ss.insertSheet('AssetCatalog');
    s.appendRow(['รหัสครุภัณฑ์', 'ชื่อครุภัณฑ์', 'ประเภทครุภัณฑ์', 'อายุการใช้งาน', 'จำนวนคงเหลือ', 'หน่วยนับ']);
  }
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // เพิ่มคอลัมน์ URL รูปภาพ เข้าไปท้ายสุด
    sheet.appendRow(['รหัสครุภัณฑ์หลัก', 'วันที่ได้มา', 'เลขครุภัณฑ์', 'ชื่อรายการ', 'ลักษณะขนาด', 'ราคาต่อหน่วย', 'สถานที่เก็บ', 'สถานะ', 'วันที่จำหน่าย', 'ประเภทเงิน', 'วิธีการที่ได้มา', 'การตรวจสอบ', 'รหัส GFMIS', 'เอกสารอ้างอิง', 'URL รูปภาพ']);
  }
  return sheet;
}

function deleteRecordFromAllSheets(ss, serialNumber) {
  const allSheets = ss.getSheets();
  const searchSerial = String(serialNumber).trim();
  for (let s = 0; s < allSheets.length; s++) {
    const sheet = allSheets[s];
    const sheetName = sheet.getName();
    if (sheetName !== 'AssetCatalog' && sheetName !== 'ชีต1' && sheetName !== 'Sheet1' && sheetName !== 'RoomPIN') {
      const data = sheet.getDataRange().getDisplayValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]).trim() === searchSerial) {
          sheet.deleteRow(i + 1);
        }
      }
    }
  }
}

function getSheetRows(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function deleteRowByValue(sheet, colIndex, value) {
  const data = sheet.getDataRange().getDisplayValues();
  const searchValue = String(value).trim();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIndex]).trim() === searchValue) {
      sheet.deleteRow(i + 1);
    }
  }
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

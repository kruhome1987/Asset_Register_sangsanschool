export default async function handler(req, res) {
  // ตั้งค่า Cache ให้ Vercel จำข้อมูลไว้ 60 วินาที เพื่อความเร็วสูงสุด
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const SPREADSHEET_ID = "1ZU2qByqg50fspEtV2n-ZPkXIEokHIvxQIOGX3_PdjNQ";
    const API_KEY = process.env.GOOGLE_API_KEY; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Links!A2:F?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values) {
      return res.status(200).json({ status: "success", data: [] });
    }

    const links = data.values.map(row => ({
      id: row[0] || "",
      title: row[1] || "",
      url: row[2] || "",
      description: row[3] || "",
      imageUrl: row[4] || "",
      createdAt: row[5] || ""
    })).filter(item => item.id !== "");
    
    links.reverse(); 
    
    return res.status(200).json({ status: "success", data: links });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.toString() });
  }
}
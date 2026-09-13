export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gasUrl = process.env.VITE_GAS_URL || process.env.GAS_URL;

  if (!gasUrl) {
    return res.status(503).json({
      ok: false,
      error: 'MISSING_GAS_URL',
      message: 'Google Apps Script URL is not configured. Please set VITE_GAS_URL in environment variables.',
    });
  }

  // Health check GET
  if (req.method === 'GET') {
    try {
      const response = await fetch(gasUrl, { method: 'GET', redirect: 'follow' });
      const responseText = await response.text();
      if (responseText.includes('ต้องมีสิทธิ์เข้าถึง') || responseText.includes('Request Access') || response.status === 403) {
        return res.status(403).json({
          ok: false,
          error: 'GOOGLE_PERMISSION_DENIED',
          message: 'Google Apps Script ยังไม่ได้ตั้งค่าสิทธิ์เป็น "ทุกคน (Anyone)" กรุณาไปที่ Apps Script > Deploy > Manage deployments > เปลี่ยน "ผู้ที่มีสิทธิ์เข้าถึง" ให้เป็น "ทุกคน"',
        });
      }
      return res.status(200).json({ ok: true, message: 'Connected to Google Apps Script successfully!' });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
    }
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await response.text();
    if (responseText.includes('ต้องมีสิทธิ์เข้าถึง') || responseText.includes('Request Access') || response.status === 403) {
      return res.status(403).json({
        ok: false,
        error: 'GOOGLE_PERMISSION_DENIED',
        message: 'Google Apps Script ยังไม่ได้ตั้งค่าสิทธิ์เป็น "ทุกคน (Anyone)" กรุณาไปที่ Apps Script > Deploy > Manage deployments > เปลี่ยน "ผู้ที่มีสิทธิ์เข้าถึง" ให้เป็น "ทุกคน"',
      });
    }

    let parsedJson = null;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      // not json, return raw text
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: 'Google Apps Script returned an error status',
        status: response.status,
        response: parsedJson || responseText,
      });
    }

    return res.status(200).json({
      ok: true,
      response: parsedJson || responseText,
    });
  } catch (error) {
    console.error('Admin Sheet Proxy Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to communicate with Google Apps Script Web App',
      details: error.message,
    });
  }
}


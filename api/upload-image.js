export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
      }
    }

    const { image, filename = 'boost_image.jpg', mimeType = 'image/jpeg' } = payload || {};
    if (!image) {
      return res.status(400).json({ ok: false, error: 'No image provided' });
    }

    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const safeName = filename.endsWith(ext) ? filename : `image_${Date.now()}${ext}`;

    const customHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    const fileObj = typeof File !== 'undefined'
      ? new File([buffer], safeName, { type: mimeType })
      : new Blob([buffer], { type: mimeType });

    // 1. Try Catbox Moe Main Server
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', fileObj, safeName);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: customHeaders,
        body: fd,
      });

      const directUrl = (await catboxRes.text()).trim();
      if (catboxRes.ok && directUrl.startsWith('http')) {
        return res.status(200).json({ ok: true, url: directUrl, provider: 'catbox' });
      }
      console.warn('Catbox upload warning:', catboxRes.status, directUrl);
    } catch (catboxErr) {
      console.warn('Catbox upload failed:', catboxErr.message);
    }

    // 2. Fallback to Litterbox (Catbox temporary/backup server)
    try {
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('time', '72h');
      fd.append('fileToUpload', fileObj, safeName);

      const litterRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        headers: customHeaders,
        body: fd,
      });

      const directUrl = (await litterRes.text()).trim();
      if (litterRes.ok && directUrl.startsWith('http')) {
        return res.status(200).json({ ok: true, url: directUrl, provider: 'litterbox' });
      }
      console.warn('Litterbox upload warning:', litterRes.status, directUrl);
    } catch (litterErr) {
      console.warn('Litterbox upload failed:', litterErr.message);
    }

    return res.status(500).json({
      ok: false,
      error: 'ไม่สามารถอัปโหลดรูปภาพไปยัง Catbox Cloud ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือใช้การ "แปะลิงก์รูป (URL)" แทน'
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

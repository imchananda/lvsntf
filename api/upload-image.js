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

    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const safeName = filename.endsWith(ext) ? filename : `image_${Date.now()}${ext}`;
    fd.append('fileToUpload', new Blob([buffer], { type: mimeType }), safeName);

    const catboxRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: fd,
    });

    const directUrl = (await catboxRes.text()).trim();
    if (catboxRes.ok && directUrl.startsWith('http')) {
      return res.status(200).json({ ok: true, url: directUrl });
    } else {
      return res.status(500).json({ ok: false, error: directUrl || 'Failed to upload to Catbox' });
    }
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

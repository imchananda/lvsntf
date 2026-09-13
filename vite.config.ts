import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Custom dev middleware for /api/admin-sheet
function adminSheetDevPlugin(gasUrl: string): Plugin {
  return {
    name: 'admin-sheet-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/admin-sheet')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            if (!gasUrl) {
              res.statusCode = 503;
              res.end(JSON.stringify({
                ok: false,
                error: 'MISSING_GAS_URL',
                message: 'ยังไม่ได้ตั้งค่า VITE_GAS_URL ในไฟล์ .env'
              }));
              return;
            }
            try {
              const gasRes = await fetch(gasUrl, { method: 'GET', redirect: 'follow' });
              const text = await gasRes.text();
              if (text.includes('ต้องมีสิทธิ์เข้าถึง') || text.includes('Request Access') || text.includes('accounts.google.com') || gasRes.status === 403) {
                res.statusCode = 403;
                res.end(JSON.stringify({
                  ok: false,
                  error: 'GOOGLE_PERMISSION_DENIED',
                  message: 'Google Apps Script ยังไม่ได้ตั้งค่า "ผู้ที่มีสิทธิ์เข้าถึง" เป็น "ทุกคน (Anyone)"'
                }));
                return;
              }
              res.statusCode = 200;
              res.end(JSON.stringify({
                ok: true,
                message: 'เชื่อมต่อกับ Google Apps Script สำเร็จ',
                raw: text.slice(0, 200)
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
            return;
          }

          if (req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            if (!gasUrl) {
              res.statusCode = 503;
              res.end(JSON.stringify({
                ok: false,
                error: 'MISSING_GAS_URL',
                message: 'ยังไม่ได้ตั้งค่า VITE_GAS_URL ในไฟล์ .env'
              }));
              return;
            }

            const chunks: Buffer[] = [];
            req.on('data', chunk => { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); });
            req.on('end', async () => {
              try {
                const body = Buffer.concat(chunks).toString('utf-8');
                const gasRes = await fetch(gasUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json; charset=utf-8' },
                  body,
                  redirect: 'follow',
                });
                const text = await gasRes.text();
                if (text.includes('ต้องมีสิทธิ์เข้าถึง') || text.includes('Request Access') || text.includes('accounts.google.com') || gasRes.status === 403) {
                  res.statusCode = 403;
                  res.end(JSON.stringify({
                    ok: false,
                    error: 'GOOGLE_PERMISSION_DENIED',
                    message: 'Google Apps Script ยังไม่ได้ตั้งค่าสิทธิ์เป็น "ทุกคน (Anyone)" กรุณาไปที่ Apps Script > Deploy > Manage deployments > เปลี่ยน "ผู้ที่มีสิทธิ์เข้าถึง" ให้เป็น "ทุกคน"'
                  }));
                  return;
                }

                try {
                  const json = JSON.parse(text);
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, data: json }));
                } catch {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, text }));
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

// Custom dev middleware for /api/upload-image (Catbox Cloud)
function uploadImageDevPlugin(): Plugin {
  return {
    name: 'upload-image-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/upload-image')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            const chunks: Buffer[] = [];
            req.on('data', chunk => { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); });
            req.on('end', async () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf-8');
                const payload = JSON.parse(bodyStr);
                const { image, filename = 'boost_image.jpg', mimeType = 'image/jpeg' } = payload || {};
                if (!image) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ ok: false, error: 'No image data provided' }));
                  return;
                }

                // Strip data URI prefix if present
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
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, url: directUrl }));
                } else {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ ok: false, error: directUrl || 'Failed to upload to Catbox' }));
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ ok: false, error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-expect-error process is defined in the Node environment where Vite runs
  const env = loadEnv(mode, process.cwd(), '');
  const gasUrl = env.VITE_GAS_URL || process.env.VITE_GAS_URL || '';
  const sheetId = env.SHEET_ID || process.env.SHEET_ID || '1wfDp4FABGJKj33ozdxtk-G0a5yCpbZ7Y9TP_T5GvRrE';
  const msgSheetId = env.VITE_MSG_SHEET_ID || process.env.VITE_MSG_SHEET_ID || '';

  return {
    plugins: [
      react(),
      adminSheetDevPlugin(gasUrl),
      uploadImageDevPlugin()
    ],
    base: './', // For GitHub Pages deployment
    server: {
      proxy: {
        '/api/sheet': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const gid = url.searchParams.get('gid') || '0';
            const sheetName = url.searchParams.get('sheetName');
            if (sheetName) {
              return `/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
            }
            return `/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
          }
        },
        '/api/msg-sheet': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const gid = url.searchParams.get('gid') || '0';
            const sid = msgSheetId || sheetId;
            return `/spreadsheets/d/${sid}/export?format=csv&gid=${gid}`;
          }
        },
        '/api/gdrive': {
          target: 'https://lh3.googleusercontent.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gdrive/, ''),
          headers: {
            'Referer': 'https://drive.google.com',
          }
        }
      }
    }
  }
})



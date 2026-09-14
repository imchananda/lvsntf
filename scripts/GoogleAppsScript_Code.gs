/**
 * =========================================================================
 *  NamtanFilm × Levi's — Google Apps Script Web App Backend
 * =========================================================================
 *  วิธีติดตั้ง:
 *  1. เปิด Google Sheet ของแคมเปญ
 *  2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 *  3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดไฟล์นี้ลงไป
 *  4. คลิกปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 *  5. เลือกประเภท: "เว็บแอป" (Web app)
 *  6. ตั้งค่า:
 *     - ดำเนินการในฐานะ (Execute as): "ฉัน" (Me)
 *     - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone) **สำคัญมาก**
 *  7. คลิก "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL เว็บแอป" (Web app URL)
 *  8. นำ URL ที่ได้ไปใส่ในไฟล์ .env หรือการตั้งค่าของ Vercel:
 *     VITE_GAS_URL=https://script.google.com/macros/s/xxxx/exec
 * =========================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    message: "NamtanFilm x Levi's Google Apps Script is running successfully!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ ok: false, error: "Empty request body" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const sheetGID = String(payload.sheetGID || "0");
    const sheetName = payload.sheetName ? String(payload.sheetName).trim() : "";
    const data = payload.data || {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = null;

    // ค้นหาชีตตามชื่อชีตก่อน (เช่น followers หรือ data)
    if (sheetName) {
      sheet = ss.getSheetByName(sheetName);
    }
    // ค้นหาตาม GID หากยังไม่พบ
    if (!sheet) {
      const sheets = ss.getSheets();
      for (let i = 0; i < sheets.length; i++) {
        if (String(sheets[i].getSheetId()) === sheetGID) {
          sheet = sheets[i];
          break;
        }
      }
    }
    if (!sheet) {
      sheet = ss.getActiveSheet();
    }

    // อ่าน Headers จากแถวแรก
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      return responseJSON({ ok: false, error: "Sheet is empty, no headers found" });
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).toLowerCase().trim();
    });

    // ตรวจสอบและสร้างหัวคอลัมน์เป้าหมายแต่ละข้อและรูปภาพอัตโนมัติหากยังไม่มี (เว้นชีต followers)
    if (sheet.getName().toLowerCase() !== 'followers') {
      const targetHeaders = [
        'target_likes',
        'target_comments',
        'target_reposts',
        'target_shares',
        'target_views',
        'target_saves',
        'show_phase_filter',
        'default_section',
        'image'
      ];
      targetHeaders.forEach(function (th) {
        if (headers.indexOf(th) === -1) {
          const nextCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, nextCol).setValue(th);
          headers.push(th);
        }
      });
    }

    // ─── ACTION: addRow ───────────────────────────────────────────────────────
    if (action === "addRow") {
      const newId = data.id || "post_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + "_" + Math.floor(Math.random() * 1000);
      data.id = newId;

      const newRow = headers.map(function (header) {
        if (header === 'id') return newId;
        if (header === 'mark') return data.mark ? '1' : '0';
        if (header === 'platform') return data.platform || '';
        if (header === 'media' || header === 'ชื่อสื่อ') return data.media || data.title || '';
        if (header === 'title' || header === 'note') return data.title || data.media || '';
        if (header === 'url') return data.url || '';
        if (header === 'hashtag' || header === 'hashtags') return data.hashtags || data.hashtag || '';
        if (header === 'artist') return data.artist || 'both';
        if (header === 'focus') return data.focus || (data.mark ? '1' : '0');
        if (header === 'boost') return data.boost !== undefined ? String(data.boost) : '';
        if (header === 'likes') return data.likes !== undefined ? String(data.likes) : '';
        if (header === 'comments') return data.comments !== undefined ? String(data.comments) : '';
        if (header === 'shares') return data.shares !== undefined ? String(data.shares) : '';
        if (header === 'reposts') return data.reposts !== undefined ? String(data.reposts) : '';
        if (header === 'views') return data.views !== undefined ? String(data.views) : '';
        if (header === 'saves') return data.saves !== undefined ? String(data.saves) : '';
        if (header === 'target') return data.target !== undefined ? String(data.target) : '';
        if (header === 'target_likes' || header === 'targetlikes') return data.target_likes !== undefined ? String(data.target_likes) : '';
        if (header === 'target_comments' || header === 'targetcomments') return data.target_comments !== undefined ? String(data.target_comments) : '';
        if (header === 'target_shares' || header === 'targetshares') return data.target_shares !== undefined ? String(data.target_shares) : '';
        if (header === 'target_reposts' || header === 'targetreposts') return data.target_reposts !== undefined ? String(data.target_reposts) : '';
        if (header === 'target_views' || header === 'targetviews') return data.target_views !== undefined ? String(data.target_views) : '';
        if (header === 'target_saves' || header === 'targetsaves') return data.target_saves !== undefined ? String(data.target_saves) : '';
        if (header === 'image' || header === 'img' || header === 'picture') return data.image || data.img || '';
        if (header === 'namtan_before' || header === 'namtan_followers_before') return data.namtan_before || data.namtan_followers_before || '';
        if (header === 'namtan_after' || header === 'namtan_followers_after') return data.namtan_after || data.namtan_followers_after || '';
        if (header === 'film_before' || header === 'film_followers_before') return data.film_before || data.film_followers_before || '';
        if (header === 'film_after' || header === 'film_followers_after') return data.film_after || data.film_followers_after || '';
        return data[header] !== undefined ? data[header] : '';
      });

      sheet.appendRow(newRow);
      return responseJSON({ ok: true, id: newId });
    }

    // ─── ACTION: updateRow ────────────────────────────────────────────────────
    if (action === "updateRow") {
      const targetId = String(data.id || "").trim();
      const targetUrl = String(data.url || "").trim().toLowerCase();
      const rows = sheet.getDataRange().getValues();
      const idColIdx = headers.indexOf("id");
      const urlColIdx = headers.indexOf("url");

      let foundRowIndex = -1;
      for (let r = 1; r < rows.length; r++) {
        const rowId = idColIdx !== -1 ? String(rows[r][idColIdx]).trim() : "";
        const rowUrl = urlColIdx !== -1 ? String(rows[r][urlColIdx]).trim().toLowerCase() : "";

        if ((targetId && rowId === targetId) || (!targetId && targetUrl && rowUrl === targetUrl)) {
          foundRowIndex = r + 1; // 1-indexed for Sheet API
          break;
        }
      }

      if (foundRowIndex === -1) {
        // หากไม่พบ และเป็น global_settings, toggle_settings หรือเป็นแผ่น followers/toggle setting ให้เพิ่มแถวใหม่อัตโนมัติ
        if (targetId === "global_settings" || targetId === "toggle_settings" || targetId === "followers_summary" || sheet.getName().toLowerCase() === "followers" || sheet.getName().toLowerCase() === "toggle setting") {
          const newId = targetId || "toggle_settings";
          const newConfigRow = headers.map(function (header) {
            if (header === 'id') return newId;
            if (header === 'mark') return (data.mark === '1' || data.mark === 1 || data.mark === true) ? '1' : '0';
            if (header === 'private_access') return (data.private_access === '1' || data.private_access === 1 || data.private_access === true) ? '1' : '0';
            if (header === 'hashtag' || header === 'hashtags') return data.hashtags || data.hashtag || '';
            if (header === 'show_phase_filter' || header === 'phase_filter') return (data.show_phase_filter === '1' || data.show_phase_filter === 1 || data.show_phase_filter === true) ? '1' : '0';
            if (header === 'default_section' || header === 'active_section') return data.default_section || data.active_section || 'boost';
            if (header === 'namtan_before' || header === 'namtan_followers_before') return data.namtan_before || data.namtan_followers_before || '';
            if (header === 'namtan_after' || header === 'namtan_followers_after') return data.namtan_after || data.namtan_followers_after || '';
            if (header === 'film_before' || header === 'film_followers_before') return data.film_before || data.film_followers_before || '';
            if (header === 'film_after' || header === 'film_followers_after') return data.film_after || data.film_followers_after || '';
            return data[header] !== undefined ? data[header] : '';
          });
          sheet.appendRow(newConfigRow);
          return responseJSON({ ok: true, note: "Appended row automatically" });
        }
        return responseJSON({ ok: false, error: "Row not found to update" });
      }

      headers.forEach(function (header, colIdx) {
        const colNum = colIdx + 1;
        if (header === 'id') return; // ไม่เขียนทับ id

        if (header === 'mark' && data.mark !== undefined) {
          const isMarkOn = (data.mark === '1' || data.mark === 1 || data.mark === true);
          sheet.getRange(foundRowIndex, colNum).setValue(isMarkOn ? '1' : '0');
        } else if (header === 'private_access' && data.private_access !== undefined) {
          const isPrivOn = (data.private_access === '1' || data.private_access === 1 || data.private_access === true);
          sheet.getRange(foundRowIndex, colNum).setValue(isPrivOn ? '1' : '0');
        } else if ((header === 'show_phase_filter' || header === 'phase_filter') && (data.show_phase_filter !== undefined || data.phase_filter !== undefined)) {
          const rawVal = data.show_phase_filter !== undefined ? data.show_phase_filter : data.phase_filter;
          const isPhaseFilterOn = (rawVal === '1' || rawVal === 1 || rawVal === true);
          sheet.getRange(foundRowIndex, colNum).setValue(isPhaseFilterOn ? '1' : '0');
        } else if (header === 'platform' && data.platform !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.platform);
        } else if ((header === 'media' || header === 'ชื่อสื่อ') && data.media !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.media);
        } else if ((header === 'title' || header === 'note') && data.title !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.title);
        } else if (header === 'url' && data.url !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.url);
        } else if ((header === 'hashtag' || header === 'hashtags') && (data.hashtags !== undefined || data.hashtag !== undefined)) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.hashtags || data.hashtag);
        } else if (header === 'artist' && data.artist !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.artist);
        } else if (header === 'focus' && data.focus !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.focus);
        } else if (header === 'boost' && data.boost !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(String(data.boost));
        } else if ((header === 'image' || header === 'img' || header === 'picture') && (data.image !== undefined || data.img !== undefined)) {
          sheet.getRange(foundRowIndex, colNum).setValue(data.image !== undefined ? data.image : data.img);
        } else if (['likes', 'comments', 'shares', 'reposts', 'views', 'saves', 'target', 'target_likes', 'target_comments', 'target_shares', 'target_reposts', 'target_views', 'target_saves'].indexOf(header) !== -1 && data[header] !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(String(data[header]));
        } else if (data[header] !== undefined) {
          sheet.getRange(foundRowIndex, colNum).setValue(data[header]);
        }
      });

      return responseJSON({ ok: true });
    }

    // ─── ACTION: deleteRow ────────────────────────────────────────────────────
    if (action === "deleteRow") {
      const targetId = String(data.id || "").trim();
      const targetUrl = String(data.url || "").trim().toLowerCase();
      const rows = sheet.getDataRange().getValues();
      const idColIdx = headers.indexOf("id");
      const urlColIdx = headers.indexOf("url");

      for (let r = 1; r < rows.length; r++) {
        const rowId = idColIdx !== -1 ? String(rows[r][idColIdx]).trim() : "";
        const rowUrl = urlColIdx !== -1 ? String(rows[r][urlColIdx]).trim().toLowerCase() : "";

        if ((targetId && rowId === targetId) || (!targetId && targetUrl && rowUrl === targetUrl)) {
          sheet.deleteRow(r + 1);
          return responseJSON({ ok: true });
        }
      }

      return responseJSON({ ok: false, error: "Row not found to delete" });
    }

    return responseJSON({ ok: false, error: "Invalid action: " + action });
  } catch (err) {
    return responseJSON({ ok: false, error: err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

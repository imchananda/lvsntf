# 👖✨ NamtanFilm × Levi's — Social Engagement Tracker & Admin Hub

เว็บแอปพลิเคชัน Social Engagement Tracker และระบบศูนย์รวมการจัดการข้อมูลสำหรับแฟนคลับ **NamtanFilm (น้ำตาล ทิพนารี & ฟิล์ม รชานันท์)** ในแคมเปญ **Levi's (Live in Levi's)**

---

## 🌟 จุดเด่นของระบบ (Features)

### 1. หน้าบ้านสำหรับแฟนคลับ (Fan Engagement Portal)
- 🚀 **แถบ "บูส บูส!" (Boost Carousel)**: แสดงโพสต์เป้าหมายสำคัญพร้อมแถบ Progress Bar เทียบเป้าหมายยอดไลก์ คอมเมนต์ รีทวีต ยอดวิว แบบ Real-time
- 🌟 **แถบ "โฟกัสสื่อ" (Fashion Media Priority)**: รวมโพสต์จากสื่อแฟชั่นและนิตยสารชั้นนำเพื่อดันยอด MIV / EMV
- 📋 **รายการภารกิจ (Missions Grid)**: แยกตามแพลตฟอร์ม (X, Instagram, TikTok, Facebook, YouTube, Threads) พร้อมสถานะสำเร็จ บันทึกในเครื่อง (LocalStorage)
- 💬 **ตัวสร้างข้อความสุ่ม (Caption Generator)**: สุ่มคำชม/ให้กำลังใจลุคยีนส์สุดเท่ของคู่ น้ำตาล-ฟิล์ม พร้อมปุ่มคัดลอกด่วนไปคอมเมนต์หรือทวีต
- 📊 **สรุปสถิติ & การ์ดแชร์ (Profile Card & Stats Sharing)**: สร้างข้อความสรุปความสำเร็จพร้อมแฮชแท็กแคมเปญสำหรับแชร์ลง X
- 🎬 **Starfield End Credits & 100% Achievement**: ระบบเครดิตภาพยนตร์เลื่อนรายชื่อแฟนคลับที่ทำภารกิจสำเร็จ

### 2. ระบบหลังบ้านสำหรับแอดมิน (Admin Central Hub — `#/admin`)
- 🔐 **Admin Authentication**: ล็อกอินเข้าสู่ระบบด้วยรหัสผ่านแอดมินแยกส่วน
- 📥 **Data Management (จัดการและนำเข้าข้อมูลโพสต์)**:
  - นำเข้าโพสต์ใหม่ผ่านหน้าเว็บ พร้อมตรวจจับ Platform อัตโนมัติจาก URL
  - **Duplicate URL Warning**: ระบบตรวจจับและแจ้งเตือนทันทีหาก URL มีอยู่ในระบบแล้ว
  - **Media Name Autosuggest**: แนะนำชื่อสื่อเดิมที่เคยบันทึกไว้ในระบบ
  - ระบุหมวดหมู่ศิลปิน: `💖 คู่ NamtanFilm`, `🧡 Namtan เดี่ยว`, `💙 Film เดี่ยว`, `👖 Levi's Official`, `📰 สื่อ/นิตยสาร`
  - แก้ไขและลบโพสต์ได้แบบสดๆ เชื่อมต่อ Google Sheets ผ่าน Google Apps Script Web App
  - จัดการแฮชแท็กหลักของแคมเปญ (Global Hashtags Settings)
- 📊 **EMV / MIV Calculator**: คำนวณมูลค่าสื่อ Earned Media Value & Media Impact Value พร้อมคัดกรองระหว่างศิลปินกับสื่อ และสร้างรายงานสรุป

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Quick Start)

### 1. ตั้งค่า Google Sheets
สร้าง Google Sheet ใหม่ และกำหนด Headers ในแถวแรก (แถวที่ 1):

```
id | mark | platform | media | title | url | hashtags | artist | focus | boost | likes | comments | shares | reposts | views | saves | target
```

- **File > Share > Publish to web** (เผยแพร่ไปยังเว็บ) เลือกเป็น **Entire Document** และ **CSV**

### 2. ติดตั้ง Google Apps Script Web App (สำหรับระบบนำเข้าข้อมูลหลังบ้าน)
1. ใน Google Sheet ไปที่ **ส่วนขยาย (Extensions) > Apps Script**
2. คัดลอกโค้ดจากไฟล์ [`scripts/GoogleAppsScript_Code.gs`](file:///d:/_DEV/NamtanFilmxLevis/scripts/GoogleAppsScript_Code.gs) ไปวางทับโค้ดเดิมทั้งหมด
3. คลิกปุ่ม **ทำให้ใช้งานได้ (Deploy) > การทำให้ใช้งานได้รายการใหม่ (New deployment)**
4. เลือกประเภท: **เว็บแอป (Web app)**
   - ดำเนินการในฐานะ: **ฉัน (Me)**
   - ผู้ที่มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)** *(สำคัญมาก)*
5. คลิก **ทำให้ใช้งานได้** แล้วคัดลอก URL เว็บแอปที่ได้รับ

### 3. ตั้งค่า Environment Variables (`.env`)
สร้างไฟล์ `.env` ที่โฟลเดอร์หลัก:

```env
# Google Sheet ID (ดูจาก URL ของ Google Sheet)
SHEET_ID=your_google_sheet_id_here

# Google Apps Script Web App URL ที่ได้จากขั้นตอนที่ 2
VITE_GAS_URL=https://script.google.com/macros/s/xxxxxxxxxxxx/exec

# รหัสผ่านเข้าเว็บสำหรับแฟนคลับ
SITE_PASSWORD=levis2026

# รหัสผ่านเข้าสู่ระบบหลังบ้านแอดมิน
VITE_ADMIN_PASSWORD=admin_levis_secure
```

### 4. รันโปรเจกต์ (Run Project)

```bash
# ติดตั้ง dependencies
npm install

# รันโหมด Development
npm run dev

# ทดสอบบิลด์ Production
npm run build
```

---

## 🧭 การเข้าใช้งานหน้าต่างๆ (Routes)

- **หน้าหลักสำหรับแฟนคลับ**: `http://localhost:5173/` (ต้องกรอก `SITE_PASSWORD`)
- **Admin Hub (รวมทุกระบบหลังบ้าน)**: `http://localhost:5173/#/admin`
- **Admin จัดการและนำเข้าข้อมูล**: `http://localhost:5173/#/admin-data`
- **Admin เครื่องคำนวณ EMV/MIV**: `http://localhost:5173/#/admin-calc`

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```
NamtanFilmxLevis/
├── api/
│   ├── sheet.js                 # Proxy ดึงข้อมูล Google Sheets CSV
│   ├── admin-sheet.js           # Proxy ส่งข้อมูล Add/Edit/Delete ไป Google Apps Script
│   ├── verify-password.js       # ตรวจสอบรหัสผ่าน
│   └── img.js                   # Proxy รูปภาพ
├── scripts/
│   └── GoogleAppsScript_Code.gs # สคริปต์ Google Apps Script สำเร็จรูป
├── src/
│   ├── components/
│   │   ├── AchievementPopup.tsx # ป๊อปอัปยินดีเมื่อทำครบ 100%
│   │   ├── EndCreditsModal.tsx  # เครดิตภาพยนตร์รายชื่อแฟนคลับ
│   │   ├── FlashTaskCard.tsx    # การ์ดภารกิจด่วนนับถอยหลัง
│   │   ├── NameSubmitModal.tsx  # ฟอร์มลงชื่อรับเครดิต
│   │   ├── PasswordGate.tsx     # หน้า Private Access สไตล์ Levi's
│   │   ├── ProfileCard.tsx      # การ์ดสรุปสถิติแฟนคลับ
│   │   └── StatsCardModal.tsx   # การ์ดสรุปสถิติแชร์ลง X
│   ├── i18n/
│   │   ├── LanguageContext.tsx  # Context ภาษา (TH / EN)
│   │   └── translations.ts      # คำแปลและข้อความภาษาไทยและอังกฤษ
│   ├── pages/
│   │   ├── AdminHub.tsx         # หน้าหลักศูนย์รวมแอดมิน (แท็บ Data + Calc)
│   │   ├── AdminDataManagement.tsx # หน้าจัดการและนำเข้าโพสต์
│   │   ├── AdminLogin.tsx       # หน้าล็อกอินแอดมิน
│   │   └── AdminCalculator.tsx  # เครื่องคำนวณมูลค่าสื่อ EMV / MIV
│   ├── App.tsx                  # หน้าหลักแฟนคลับ (สไตล์ Prada ในธีม Levi's)
│   ├── index.css                # ดีไซน์โทนสี Denim & Red Tab
│   └── main.tsx                 # Entry point และระบบจัดการ Routing
```

---

Made with 👖 & ❤️ for NamtanFilm Fan Community

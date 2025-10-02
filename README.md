# WDBank-Style Exam System (Google Sheets Backend)

ระบบแบบทดสอบที่ดึงข้อสอบจาก Google Sheets และบันทึกผลกลับไปยัง Google Sheets
รองรับทั้งมือถือ (แสดงผลทีละ 1 ข้อ + จับเวลา + โปรเกรสบาร์) และจอใหญ่ (หลายข้อ/หน้า + ปุ่มพิมพ์)

## โครงสร้างโปรเจกต์
```
/ (root)
├── index.html
├── styles.css
├── app.js
├── api.js
├── print.css
├── /assets
│   └── logo.svg
├── /backend
│   ├── code.gs
│   └── sheets.gs
└── /templates
    ├── Questions.csv
    ├── Students.csv
    ├── Subjects.csv
    ├── Grades.csv
    ├── Exams.csv
    └── Results.csv
```

## วิธีใช้งานอย่างย่อ
1) สร้าง Google Sheet ใหม่ 1 ไฟล์ แล้วสร้างชีตตามชื่อในโฟลเดอร์ **/templates** (หรืออัปโหลด CSV แต่ละไฟล์เข้าไป)
2) เปิด **Extensions → Apps Script** วางโค้ดจาก `backend/code.gs` และ `backend/sheets.gs`
3) เปลี่ยนค่า `SPREADSHEET_ID` ใน `code.gs` ให้เป็น ID ของ Google Sheet ที่สร้าง
4) **Deploy** เป็น **Web app** → Anyone with the link (หากทดสอบสาธารณะ) แล้วคัดลอก **Web App URL**
5) เปิดไฟล์ `api.js` แล้วตั้งค่าคอนฟิก `SCRIPT_URL` ให้เป็น Web App URL
6) เปิด `index.html` ในเบราว์เซอร์ (แนะนำวางบน GitHub Pages หรือ Static host ใด ๆ ก็ได้)
7) เริ่มใช้งาน: หน้าแรกเลือกวิชา → เลือกระดับชั้น → เลือกนักเรียน → อ่านคำชี้แจง → เริ่มทำข้อสอบ

## ฟีเจอร์
- หน้าแรกเลือก **วิชา (ไทย/คณิต/อังกฤษ)** → เลือก **ระดับชั้น** และ **นักเรียน**
- หน้า **คำชี้แจง** + ปุ่มเริ่ม
- **มือถือ/จอเล็ก**: แสดงทีละ 1 ข้อ มี **ตัวจับเวลา** และ **แถบความคืบหน้า**
- **จอใหญ่**: แสดงหลายข้อต่อหน้า มี **หมายเลขหน้า**, **ปุ่มพิมพ์** แบบทดสอบ (ใช้ `print.css`)
- บันทึกผลแบบ **POST** ไปที่ Apps Script (หรือ JSONP fallback)
- กันรีเฟรชหาย: เก็บ **progress ชั่วคราวใน localStorage**
- ดึงข้อสอบแบบสุ่มลำดับตัวเลือก และรองรับหลายรูปแบบ (เลือกตอบเดียว/หลายตัวเลือก/เติมคำ — สามารถขยายเพิ่มได้)

## โครงสร้างชีต (คอลัมน์สำคัญ)
### Subjects
- id (TEXT) — เช่น `TH`, `MATH`, `ENG`
- name_th (TEXT) — ชื่อภาษาไทย
- name_en (TEXT) — ชื่ออังกฤษ

### Grades
- id (TEXT) — เช่น `P1`, `P2`, ..., `P6` (หรือ `M1`...)
- name_th (TEXT)

### Students
- id (TEXT) — ไอดีนักเรียน (ถ้าไม่มีใช้รหัสประจำตัว)
- name (TEXT)
- grade_id (TEXT → อ้างอิง Grades.id)
- room (TEXT, optional)

### Questions
- id (TEXT) — รหัสข้อสอบ เช่น `Q0001`
- subject_id (TEXT → Subjects.id)
- grade_id (TEXT → Grades.id)
- type (TEXT) — `single`, `multiple`, `fill`
- prompt (TEXT) — โจทย์
- choice_a (TEXT, optional)
- choice_b (TEXT, optional)
- choice_c (TEXT, optional)
- choice_d (TEXT, optional)
- correct (TEXT) — เช่น `A`, `B`, `C`, `D` หรือ `A|C` (multiple) หรือคำตอบสำหรับ fill
- points (NUMBER) — คะแนนข้อนี้ (เช่น 1)
- media (TEXT, optional URL ของภาพ)
- explanation (TEXT, optional เฉลย/คำอธิบาย)

### Exams
- id (TEXT) — ไอดีชุดแบบทดสอบ เช่น `EX-TH-P1-001`
- subject_id (TEXT)
- grade_id (TEXT)
- title (TEXT) — ชื่อ/หัวข้อแบบทดสอบ
- question_ids (TEXT) — รายการรหัสข้อสอบ คั่นด้วย `|` (เช่น `Q0001|Q0004|Q0007`)
- time_limit_sec (NUMBER) — จำกัดเวลารวม (วินาที) เช่น `900` = 15 นาที
- items_per_page (NUMBER, optional สำหรับโหมดจอใหญ่)

> หากไม่ระบุ `Exams.question_ids` ระบบสามารถ fallback เป็น "ดึงคำถามทั้งหมดของ subject+grade" ตามลำดับเวลา (สามารถกรองเพิ่มเติมใน Apps Script ได้)

### Results
- id (TEXT) — รันไอดีผล เช่น `R-<timestamp>`
- exam_id (TEXT)
- student_id (TEXT)
- student_name (TEXT)
- grade_id (TEXT)
- subject_id (TEXT)
- start_time (DATETIME)
- end_time (DATETIME)
- duration_sec (NUMBER)
- score (NUMBER)
- max_score (NUMBER)
- details_json (TEXT) — บันทึกรายละเอียดการตอบรูปแบบ JSON string

## การพิมพ์เป็นไฟล์แบบทดสอบ (โหมดจอใหญ่)
- ปุ่ม **พิมพ์** จะเรียก window.print() และใช้ `print.css` เพื่อปรับรูปแบบให้สวยงาม
- แนะนำเปิดใน Chrome แล้ว Save as PDF เพื่อแจกเป็นไฟล์

## หมายเหตุเรื่องความปลอดภัย
- โค้ดตัวอย่างตั้งค่าเป็น public demo (ง่ายต่อการลองใช้) — โปรดปรับสิทธิ์การเข้าถึง Web App ให้เหมาะสมในงานจริง
- สามารถเพิ่ม Token/Key อย่างง่ายใน `api.js` และตรวจสอบฝั่ง Apps Script ได้

---

© 2025 WD-style Exam System

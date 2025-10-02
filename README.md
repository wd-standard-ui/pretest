# Exam System — Starter Kit (LINE LIFF + GAS + Sheets + Drive)

โครงเริ่มต้นสำหรับระบบข้อสอบ Interactive:
- Frontend (รันบน GitHub Pages): LINE LIFF login, ครู/นักเรียน, อัปโหลดรูปแนบข้อสอบ
- Backend (Google Apps Script): Verify LINE idToken, บันทึกข้อมูลลง Google Sheets, เก็บรูปใน Google Drive

## โครงสร้าง
```
frontend/
  index.html
  css/print.css
  js/
    app.js, auth.js, api.js, ui.js, teacher.js, student.js, exam.js, charts.js, config.js
gas/
  code.gs
```

## ตั้งค่า
1) สร้าง Google Spreadsheet และสร้างชีต: users, classes, enrollments, exams, questions, student_attempts, student_answers (header ตาม code)  
2) สร้างโฟลเดอร์ใน Google Drive สองอัน: ASSETS, EXPORTS (คัดลอก folderId)  
3) เปิด Apps Script ใหม่ → วาง `gas/code.gs` → ตั้ง Script Properties:  
   - `SPREADSHEET_ID`, `FOLDER_ID_ASSETS`, `FOLDER_ID_EXPORTS`, `LIFF_CHANNEL_ID`, `ALLOWED_ORIGIN`  
4) Deploy Web App: Execute as Me, Who has access = Anyone → คัดลอก URL เป็น `SCRIPT_URL`  
5) LINE Developers → สร้าง LIFF → ได้ `LIFF_ID`  
6) แก้ `frontend/js/config.js` ให้ใส่ค่า `LIFF_ID` และ `SCRIPT_URL`  
7) โฮสต์ `frontend/` บน GitHub Pages

> หมายเหตุ: โค้ดนี้เป็น starter minimal — ฟังก์ชันวิเคราะห์เชิงลึก/สิทธิ์ละเอียด/ตรวจ role ควรเพิ่มก่อนใช้จริง

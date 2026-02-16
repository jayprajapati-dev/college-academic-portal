# ▶️ PHASE 3 - RUN & DEMO GUIDE (STEP BY STEP)
- How to run (3 terminals)

This file explains **exactly how to run the project** and **how to show it during demo**.

---

## ✅ BEFORE YOU RUN

Make sure these are installed:
- **Node.js (LTS):** https://nodejs.org/
- **MongoDB Community Server:** https://www.mongodb.com/try/download/community
- **MongoDB Shell (mongosh):** https://www.mongodb.com/try/download/shell

---

## ✅ STEP 1: START MONGODB (DATABASE)

**Why:** The backend needs database to store and read data.

### Option A (Recommended): Start MongoDB Service Automatically
If MongoDB is installed as a **Service**, it starts automatically.

### Option B: Check/Start manually using mongosh
Open **Terminal 1** and run:
```powershell
mongosh
```

**If it connects, you will see:**
```
test>
```

**Keep this terminal open.**

---

## ✅ STEP 2: START BACKEND SERVER

Open **Terminal 2** and run:
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected successfully
```

**Keep this terminal open.**

---

## ✅ STEP 3: START FRONTEND

Open **Terminal 3** and run:
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

**Browser will open automatically.**

---

## ✅ STEP 4: QUICK VERIFY

### Frontend Check
Open browser:
```
http://localhost:3000
```
You should see:
```
Smart College Academic Portal
Frontend is running...
```

### Backend Check
Run in any terminal:
```powershell
Invoke-RestMethod http://localhost:5000 -Method Get
```
Expected:
```
message : Backend is running...
```

---

## ✅ HOW TO USE MONGODB WHEN NEEDED

### Check database data
Open terminal and run:
```powershell
mongosh
```
Then:
```javascript
use smart-college-portal
show collections
```

### See data in a collection
Example for admins:
```javascript
db.admins.find()
```

### Exit MongoDB Shell
```javascript
exit
```

---

## ✅ DEMO / PRESENTATION MODE (WHEN SHOWING PROJECT)

### What to open before demo:
1. **MongoDB (Terminal 1)**
2. **Backend (Terminal 2)**
3. **Frontend (Terminal 3)**
4. **Browser** opened at http://localhost:3000

### Demo Checklist:
- [ ] MongoDB connected (mongosh shows `test>`)
- [ ] Backend running (shows “Server running on port 5000”)
- [ ] Frontend running (browser opens and shows project title)

---

## ✅ QUICK COMMANDS (COPY & RUN)

```powershell
# Terminal 1 (MongoDB)
mongosh

# Terminal 2 (Backend)
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm run dev

# Terminal 3 (Frontend)
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm start
```

---

## 🆘 COMMON PROBLEMS

### MongoDB not opening
If you see "mongosh not recognized":
- Restart the computer
- Then open new terminal and run `mongosh` again

### Port already in use
```powershell
netstat -ano | findstr :5000
```
Kill the process or change port in `.env` file.

---

## ✅ SUMMARY

To run the project, always follow this order:
1. MongoDB
2. Backend
3. Frontend

If all three are running, your project is ready to show.

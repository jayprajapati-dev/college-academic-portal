# 🔧 PHASE 2 - INSTALLATION & SETUP GUIDE

**This file is Phase 2 complete step-by-step setup guide**

---

## 📋 OVERVIEW - What Did We Setup?

**3 Major Things:**
1. ✅ **Frontend** - React JS application
2. ✅ **Backend** - Node.js + Express server
3. ✅ **Database** - MongoDB configuration

---

## 🚀 PREREQUISITES

### Install these first:

1. **Node.js & npm**
   - Download: https://nodejs.org (LTS version)
   - Verify: `node --version` and `npm --version`

2. **MongoDB**
   - Download: https://www.mongodb.com/try/download/community
   - Install and run as service

3. **Git** (optional but recommended)
   - Download: https://git-scm.com

4. **VS Code** (Code editor)
   - Download: https://code.visualstudio.com

---

## 📁 FOLDER STRUCTURE - What Was Created?

```
Project/
│
├── client/                          (FRONTEND - React)
│   ├── node_modules/               (Dependencies - automatic)
│   ├── public/
│   │   └── index.html              (Main HTML file)
│   ├── src/
│   │   ├── App.js                  (Main React component)
│   │   ├── App.css                 (Styling)
│   │   ├── index.js                (Entry point)
│   │   └── index.css               (Global styles)
│   └── package.json                (Frontend dependencies list)
│
├── server/                          (BACKEND - Node.js)
│   ├── node_modules/               (Dependencies - automatic)
│   ├── db/
│   │   ├── connection.js           (MongoDB connection)
│   │   └── MONGODB_SETUP.md        (Database guide)
│   ├── models/                     (MongoDB Schemas)
│   │   ├── Admin.js                (Admin schema)
│   │   ├── Semester.js             (Semester schema)
│   │   ├── Branch.js               (Branch schema)
│   │   └── Subject.js              (Subject schema)
│   ├── server.js                   (Main server file)
│   ├── .env                        (Environment variables)
│   └── package.json                (Backend dependencies list)
│
├── db/                             (DATABASE DOCUMENTATION)
│   └── MONGODB_SETUP.md            (Setup instructions)
│
├── docs/                           (PROJECT DOCUMENTATION)
│   ├── database-design.md
│   ├── phase-1-planning.md
│   ├── admin-subject-marks-material-flowchart.png
│   └── student-subject-system-flowchart.png
│
└── maker/                          (TEAM DOCUMENTATION)
    ├── 1-phase.md                  (Phase 1 planning guide)
    └── 2-setup.md                  (This file - setup guide)
```

---

## 💻 SETUP STEPS - Step by Step

### STEP 1: Frontend Setup

#### 1.1 Navigate to Client Folder
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
```

#### 1.2 Install Dependencies
```powershell
npm install
```

**What Will Happen?**
- `node_modules` folder will be created
- All required packages will be downloaded
- React, ReactDOM, React-Router etc will be installed

**Installation time:** 3-5 minutes (depends on internet speed)

#### 1.3 Frontend Files - What Was Created?

**a) package.json** - Dependencies list
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0"
  }
}
```

**b) src/App.js** - Main React component
- App root component
- Routes will be added here
- Layout structure is here

**c) src/index.js** - Entry point
- Renders the App
- Connects to DOM element

**d) public/index.html** - Main HTML file
- Has `<div id="root"></div>` where React app will mount

**e) CSS Files**
- `index.css` - Global styles
- `App.css` - App component styles

---

### STEP 2: Backend Setup

#### 2.1 Navigate to Server Folder
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
```

#### 2.2 Install Dependencies
```powershell
npm install
```

**What Will Happen?**
- All server packages will be installed
- Express, MongoDB, JWT etc will be setup

#### 2.3 Backend Files - What Was Created?

**a) server.js** - Main server file
```javascript
- Initializes Express app
- Enables CORS
- Defines Routes
- Server listens on PORT 5000
```

**b) .env** - Environment Variables
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-college-portal
JWT_SECRET=your_jwt_secret_key_here
```

**What is it:**
- `PORT` - Which port server will run on
- `NODE_ENV` - Development or Production
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - Token encryption key

**c) db/connection.js** - MongoDB Connection
```javascript
- Connects to MongoDB
- Connection error handling
```

**d) models/** - MongoDB Schemas

| File | What is it |
|------|------------|
| Admin.js | Store User credentials |
| Semester.js | Store Semesters (1-8) |
| Branch.js | Store Branches (IT, CE, ME) |
| Subject.js | Store Subjects |

---

### STEP 3: Database Setup

#### 3.1 MongoDB Installation

**On Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Install MongoDB as a Service"
4. Finish installation

**Verify:**
```powershell
mongosh
```

**Output should be:**
```
test>
```

(Now exit: `exit`)

#### 3.2 Database Connection

**Connection details:**
- **Host**: localhost
- **Port**: 27017
- **Database Name**: smart-college-portal
- **Connection String**: mongodb://localhost:27017/smart-college-portal

---

## ▶️ RUNNING THE APPLICATION (STEP BY STEP)

### ⚠️ IMPORTANT: Use 3 different terminals (or terminal tabs)

**Why 3 terminals?**
- Terminal 1 = MongoDB (database)
- Terminal 2 = Backend (server)
- Terminal 3 = Frontend (React app)

---

### ✅ STEP 0: Install Dependencies (Do this first)

**Why:** The project needs packages (React, Express, MongoDB driver, etc.) before it can run.

**Frontend install:**
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm install
```

**Backend install:**
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm install
```

**If npm is not found:**
Download Node.js (LTS): https://nodejs.org/

---

### ✅ STEP 1: Install and Start MongoDB (Terminal 1)

**Why:** MongoDB stores all project data (users, semesters, subjects, notices).

**Download MongoDB Community Server:**
https://www.mongodb.com/try/download/community

**During installation:**
- Choose **Install MongoDB as a Service**
- If you want D drive, set Data Directory to `D:\MongoDB\data` and Log Directory to `D:\MongoDB\log`

**After install, verify in a terminal:**
```powershell
mongosh
```

**You should see:**
```
test>
```

**Keep this terminal open.**

---

### ✅ STEP 2: Start Backend (Terminal 2)

Open another terminal and run:
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm run dev
```

**You should see:**
```
Server running on port 5000
MongoDB connected successfully
```

**Keep this terminal open.**

---

### ✅ STEP 3: Start Frontend (Terminal 3)

Open a third terminal and run:
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm start
```

**You should see:**
```
Compiled successfully!
Webpack compiled with 0 warnings
Local: http://localhost:3000
```

**Browser will automatically open** at http://localhost:3000

---

### ✅ STEP 4: Quick Verify (Optional)

Open a terminal and run:
```powershell
Invoke-RestMethod http://localhost:5000 -Method Get
```

**Expected output:**
```
message : Backend is running...
```

---

### 🎯 WHAT YOU SHOULD SEE

**In Browser (http://localhost:3000):**
```
Smart College Academic Portal
Frontend is running...
```

**In Backend Terminal:**
```
Server running on port 5000
MongoDB connected successfully
```

**In MongoDB Terminal:**
```
test>
(Connection open)
```

---

## 🔌 URLS - Where is everything running?

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend | http://localhost:5000 | 5000 |
| Database | mongodb://localhost:27017 | 27017 |

---

## ✅ VERIFY everything is working

### Frontend Check:
```
✅ Browser opened http://localhost:3000
✅ "Smart College Academic Portal" heading visible
✅ "Frontend is running..." message visible
```

### Backend Check:

**Test GET request in Terminal:**
```powershell
Invoke-RestMethod http://localhost:5000 -Method Get
```

**Output should be:**
```
message : Backend is running...
```

### Database Check:

```powershell
mongosh
```

Then:
```javascript
use smart-college-portal
db.admins.find()
```

(Should be empty array `[]`)

---

## 🐛 TROUBLESHOOTING

### Problem 1: npm command not found

**Solution:**
```powershell
node --version
npm --version
```

If error comes, reinstall Node.js

### Problem 2: Port already in use

**Something else is running on port 5000:**
```powershell
netstat -ano | findstr :5000
```

Then kill the process or use different port

### Problem 3: Cannot connect to MongoDB

**Check:**
```powershell
mongosh
```

If `command not found` then MongoDB not properly installed

### Problem 4: Dependencies not installing

```powershell
npm cache clean --force
npm install
```

---

## 📦 PACKAGES INSTALLED

### Frontend (React)
- **react** - UI library
- **react-dom** - DOM rendering
- **react-router-dom** - Navigation/Routing
- **axios** - HTTP requests
- **react-scripts** - Build tools

### Backend (Node.js)
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **mongodb** - Database driver
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing
- **bcryptjs** - Password encryption
- **jsonwebtoken** - Authentication tokens
- **nodemon** - Auto-restart on changes

---

## 📝 NEXT STEPS

**What to do now:**

1. ✅ Frontend + Backend + Database all are running
2. ⏭️ **Next**: Build Authentication Module (Login)
3. ⏭️ **Then**: Build Admin Panel
4. ⏭️ **Then**: Build Student Dashboard
5. ⏭️ **Finally**: Testing and deployment

---

## 🎯 QUICK COMMANDS CHEAT SHEET

```powershell
# Frontend
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm install          # Dependencies install
npm start            # Run development server

# Backend
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm install          # Dependencies install
npm run dev          # Run with auto-restart

# Database
mongosh              # Connect to MongoDB
use smart-college-portal     # Select database
db.admins.find()     # Check admins collection
```

---

## 📞 HELP NEEDED?

1. Check **1-phase.md** for project overview
2. Check **docs/** for database design
3. Google the error message
4. Ask senior members

---

**Status: Phase 2 Setup COMPLETE** ✅

**Next: Phase 3 Development (Start writing Code)**

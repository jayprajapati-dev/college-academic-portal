# 🎯 ACTUAL SETUP - WHAT WE DID (REAL STEPS)

This file shows **exactly what commands we ran and what output came**.  
Use this as reference when setting up on your PC.

---

## ✅ WHAT WE INSTALLED

### 1. Node.js (LTS)
Downloaded from: https://nodejs.org/

**Verified:**
```powershell
node --version
npm --version
```

**Output:**
```
v18.x.x (or higher)
9.x.x (or higher)
```

---

### 2. MongoDB Community Server
Downloaded from: https://www.mongodb.com/try/download/community

**File:** `mongodb-windows-x86_64-8.2.4-signed.msi`

**Installation:**
- Run the installer
- Choose "Install MongoDB as a Service"
- Data Directory: `D:\MongoDB\data`
- Log Directory: `D:\MongoDB\log`

**Verified:**
```powershell
mongod --version
```

**Output:**
```
db version v8.2.4
Build Info: {
    "version": "8.2.4",
    ...
}
```

---

### 3. MongoDB Shell (mongosh)
Downloaded from: https://www.mongodb.com/try/download/shell

**File:** `mongosh-2.6.0-win32-x64.zip`

**What to do:**
1. Extract the zip
2. Copy to: `D:\MongoDB\bin`
3. Add `D:\MongoDB\bin` to PATH (Environment Variables)
4. Restart PC

**Verified:**
```powershell
mongosh
```

**Output:**
```
Current Mongosh Log ID: 698087de7b8e3b3b4c628c9f
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.6.0
Using MongoDB:          8.2.4
Using Mongosh:          2.6.0

test>
```

Exit with: `exit`

---

## ✅ PROJECT SETUP (What we did)

### Step 1: Frontend Dependencies
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm install
```

**Output:**
```
added X packages, and audited Y packages in Z seconds
```

---

### Step 2: Backend Dependencies
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm install
```

**Output:**
```
added X packages, and audited Y packages in Z seconds
```

---

## ✅ RUNNING THE PROJECT (3 TERMINALS)

### Terminal 1: MongoDB
```powershell
mongosh
```

**Output:**
```
test>
(Keep this running)
```

---

### Terminal 2: Backend Server
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\server"
npm run dev
```

**Output:**
```
> smart-college-backend@1.0.0 dev
> nodemon server.js

[nodemon] 2.0.22
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node server.js`
Server running on port 5000
MongoDB connected successfully
(Keep this running)
```

---

### Terminal 3: Frontend
```powershell
cd "d:\Diploma\it\sem6\Software Development-50\Project\client"
npm start
```

**Output:**
```
> smart-college-frontend@1.0.0 start
> react-scripts start

(node:13768) [DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:13768) [DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
Starting the development server...
Compiled successfully!

Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000

(Browser opens automatically)
```

---

## ✅ VERIFICATION

### In Browser
Open: `http://localhost:3000`

**You should see:**
```
Smart College Academic Portal
Frontend is running...
```

✅ **This confirms everything is working!**

### Backend Check
```powershell
Invoke-RestMethod http://localhost:5000 -Method Get
```

**Output:**
```
message : Backend is running...
```

### Database Check
In MongoDB terminal:
```javascript
use smart-college-portal
db.admins.find()
```

**Output:**
```
[]
(Empty because no data yet)
```

---

## 🎯 SUMMARY - COPY & RUN ORDER

1. **First** - Make sure 3 things are installed:
   - Node.js ✅
   - MongoDB Server ✅
   - mongosh ✅

2. **Second** - Run npm install in both folders:
   ```
   client/ → npm install
   server/ → npm install
   ```

3. **Third** - Open 3 terminals and run:
   - Terminal 1: `mongosh`
   - Terminal 2: `cd server && npm run dev`
   - Terminal 3: `cd client && npm start`

4. **Check** - Browser opens at `http://localhost:3000`

---

## ❌ COMMON ERRORS & FIXES

### Error: mongosh not recognized
**Fix:** Add `D:\MongoDB\bin` to PATH and restart PC

### Error: Port 5000 already in use
**Fix:**
```powershell
netstat -ano | findstr :5000
taskkill /PID [process_id] /F
```

### Error: MongoDB not connecting
**Fix:** Make sure `mongosh` shows `test>` first

---

## 💡 IMPORTANT

**Always follow this order:**
1. MongoDB (Terminal 1)
2. Backend (Terminal 2)
3. Frontend (Terminal 3)

If all 3 are running without errors, your project is ready!


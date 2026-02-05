# 🚀 Smart College Academic Portal - Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- Git

---

## 📦 Installation Steps

### 1. Clone and Navigate
```bash
cd "D:\Diploma\it\sem6\Software Development-50\Project"
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd server
npm install
```

#### Environment Configuration
The `.env` file is already configured with:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartacademics
JWT_SECRET=your_jwt_secret_key_here
```

**⚠️ IMPORTANT:** Before production, change `JWT_SECRET` to a strong random string!

#### Start MongoDB
Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Or if installed manually
mongod
```

#### Start Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../client
npm install
```

#### Start Frontend
```bash
npm start
# Client runs on http://localhost:3000
```

---

## 🔧 Configuration Details

### Backend (server/)
- **Port:** 5000
- **Database:** MongoDB at `mongodb://localhost:27017/smartacademics`
- **CORS:** Enabled for `http://localhost:3000`
- **File Uploads:** Stored in `server/uploads/materials/`

### Frontend (client/)
- **Port:** 3000
- **Proxy:** Configured to forward `/api/*` requests to `http://localhost:5000`
- **Authentication:** JWT tokens stored in localStorage

---

## 👤 Default Admin Account

After running the seed script, use these credentials:

**Email:** `admin@smartcollege.edu`  
**Password:** `Admin@123`

### Create Admin Account Manually
```bash
cd server
node seed.js
```

This creates:
- 1 Admin user
- 3 Test students
- Sample academic data

---

## 🧪 Testing the Application

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

### 2. Open Browser
Navigate to: `http://localhost:3000`

### 3. Login as Admin
- Email: `admin@smartcollege.edu`
- Password: `Admin@123`

### 4. Run Test Data Script
1. Login as admin
2. Open browser console (F12)
3. Navigate to: `http://localhost:3000/test-data.js`
4. Copy the entire script content
5. Paste in console and press Enter
6. Run: `runAllTests()`

This will:
- ✅ Create 3 semesters
- ✅ Create 9 branches (3 per semester)
- ✅ Create 27 subjects (3 per branch)
- ✅ Add sample materials
- ✅ Test all CRUD operations

---

## 🐛 Troubleshooting

### Issue: "Error fetching semesters"

**Causes:**
1. Backend server not running
2. MongoDB not running
3. No authentication token
4. Proxy not configured

**Solutions:**

#### Check Backend Server
```bash
cd server
npm start
```
Should see: `✅ MongoDB Connected` and `🚀 Server running on port 5000`

#### Check MongoDB
```bash
# Windows - Check if running
tasklist | findstr mongod

# Start MongoDB
net start MongoDB
```

#### Check Authentication
1. Make sure you're logged in
2. Check browser console for token:
```javascript
localStorage.getItem('token')
```
If null, login again.

#### Check Proxy Configuration
Verify `client/package.json` has:
```json
"proxy": "http://localhost:5000"
```

### Issue: "CORS Error"

**Solution:** Ensure backend `server/server.js` has:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue: "Module not found"

**Solution:**
```bash
# Backend
cd server
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Check MongoDB is installed
2. Start MongoDB service:
```bash
net start MongoDB
```
3. Verify connection string in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/smartacademics
```

---

## 📁 Project Structure

```
Project/
├── server/                    # Backend (Node.js + Express)
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── middleware/           # Auth & upload middleware
│   ├── uploads/              # File storage
│   ├── .env                  # Environment variables
│   ├── server.js             # Main server file
│   └── seed.js               # Database seeding
│
├── client/                    # Frontend (React)
│   ├── public/
│   │   └── test-data.js      # Testing script
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilities
│   │   ├── App.js            # Main app
│   │   └── index.js          # Entry point
│   └── package.json          # Dependencies + proxy config
│
├── docs/                      # Documentation
├── PHASE-2-COMPLETION-REPORT.md
└── SETUP-GUIDE.md            # This file
```

---

## 🔐 Security Notes

### For Development:
- ✅ JWT_SECRET is set (change in production)
- ✅ CORS enabled for localhost:3000
- ✅ File upload restrictions (50MB, specific types)
- ✅ Role-based authorization

### Before Production:
- [ ] Change JWT_SECRET to strong random string
- [ ] Update CORS origin to production URL
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Set secure cookie flags
- [ ] Use environment-specific configs

---

## 📞 Quick Commands Reference

### Backend
```bash
cd server
npm install              # Install dependencies
npm start               # Start server
node seed.js            # Seed database
```

### Frontend
```bash
cd client
npm install             # Install dependencies
npm start              # Start dev server
npm run build          # Build for production
```

### Database
```bash
# Connect to MongoDB
mongo
use smartacademics
db.users.find()         # View users
db.semesters.find()     # View semesters
```

---

## ✅ Verification Checklist

Before testing, ensure:
- [ ] MongoDB is running (`net start MongoDB`)
- [ ] Backend server is running (`cd server && npm start`)
- [ ] Frontend is running (`cd client && npm start`)
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal
- [ ] Browser opens at `http://localhost:3000`
- [ ] Can login with admin credentials
- [ ] No console errors in browser (F12)

---

## 🎉 Success Indicators

You should see:
1. **Backend Terminal:**
   ```
   ✅ MongoDB Connected: localhost
   🚀 Server running on port 5000
   ```

2. **Frontend Terminal:**
   ```
   Compiled successfully!
   Local: http://localhost:3000
   ```

3. **Browser:**
   - Login page loads
   - No console errors
   - Can navigate after login

---

## 📚 Additional Resources

- [MongoDB Installation](https://docs.mongodb.com/manual/installation/)
- [Node.js Download](https://nodejs.org/)
- [React Documentation](https://reactjs.org/)
- [Express.js Guide](https://expressjs.com/)

---

**Need Help?** Check the troubleshooting section or review the PHASE-2-COMPLETION-REPORT.md for feature documentation.

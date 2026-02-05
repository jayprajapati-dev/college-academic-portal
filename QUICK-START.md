# 🚀 Quick Start Guide - Phase 1

## Step 1: Start MongoDB
```bash
# Make sure MongoDB is running
mongod
```

## Step 2: Setup & Run Backend

```bash
# Navigate to server folder
cd server

# Run seed data (first time only)
npm run seed

# Start backend server
npm run dev
```

✅ Backend running on `http://localhost:5000`

## Step 3: Run Frontend

```bash
# Navigate to client folder (open new terminal)
cd client

# Start React app
npm start
```

✅ Frontend running on `http://localhost:3000`

## Step 4: Test Login

### Admin Login
- URL: `http://localhost:3000/login`
- Email: `admin@smartacademic.com`
- Password: `admin123`

### Student Login
- URL: `http://localhost:3000/login`
- Email: `john.student@example.com`
- Password: `student123`

## 🎯 Quick Tests

### Test 1: Student Registration
1. Go to `/register`
2. Register new student
3. Login → See Student Dashboard

### Test 2: Admin Adds HOD
1. Login as admin
2. Go to Admin Dashboard
3. Click "Add HOD" → Use API endpoint:
   ```bash
   POST http://localhost:5000/api/admin/add-hod
   Headers: Authorization: Bearer <token>
   Body: {
     "name": "Dr. John Smith",
     "mobile": "9876543210",
     "branchId": "<branch_id_from_database>"
   }
   ```
4. Note the temp password
5. Logout and login as HOD with mobile + temp password
6. Complete first login flow

### Test 3: Forgot Password
1. Go to `/forgot-password`
2. Enter mobile/email
3. Answer security question
4. Reset password

## 📍 All Routes

| Route | Description |
|-------|-------------|
| `/` | Landing Page |
| `/login` | Login Page |
| `/register` | Student Registration |
| `/forgot-password` | Password Recovery |
| `/first-login` | First Time Setup |
| `/complete-profile` | Profile Completion |
| `/student/dashboard` | Student Dashboard |
| `/teacher/dashboard` | Teacher Dashboard |
| `/hod/dashboard` | HOD Dashboard |
| `/admin/dashboard` | Admin Dashboard |
| `/about` | About Page |
| `/contact` | Contact Page |
| `/privacy` | Privacy Policy |
| `/terms` | Terms & Conditions |
| `/disclaimer` | Disclaimer |

## 🛠️ Useful Commands

### Backend
```bash
npm run dev        # Start development server
npm run seed       # Run seed data
npm start          # Start production server
```

### Frontend
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### MongoDB
```bash
mongod             # Start MongoDB
mongo              # Open MongoDB shell
use smartacademics # Select database
db.users.find()    # View users
```

## ✅ Phase 1 Complete Checklist

- [x] MongoDB running
- [x] Backend server running (port 5000)
- [x] Frontend running (port 3000)
- [x] Seed data loaded
- [x] Admin login working
- [x] Student registration working
- [x] First login flow working
- [x] All dashboards accessible

## 🐛 Common Issues

**Issue:** MongoDB not connecting
- **Solution:** Make sure MongoDB is running (`mongod`)

**Issue:** Port already in use
- **Solution:** Kill process or change port in `.env`

**Issue:** Cannot login
- **Solution:** Run `npm run seed` to create default users

**Issue:** 404 on API calls
- **Solution:** Check backend is running on port 5000

## 📝 Development Tips

1. Keep 3 terminals open:
   - Terminal 1: MongoDB (`mongod`)
   - Terminal 2: Backend (`npm run dev`)
   - Terminal 3: Frontend (`npm start`)

2. Use browser DevTools (F12) to check:
   - Console for errors
   - Network tab for API calls
   - Application tab for localStorage (token)

3. Test APIs with:
   - Thunder Client (VS Code Extension)
   - Postman
   - Or `curl` commands

## 🎉 You're Ready!

Phase 1 is complete and running. Start testing all features!

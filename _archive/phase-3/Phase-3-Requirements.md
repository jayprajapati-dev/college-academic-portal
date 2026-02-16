# Phase-3 Requirements - Student Dashboard & Materials

## 📋 Overview

**Phase:** 3 - Student Dashboard Development  
**Duration:** 2-3 days  
**Status:** 🔄 Pending (Ready to Start)  
**Priority:** HIGH  

### Modules to Develop:
1. Student Dashboard (View Semesters, Branches, Subjects)
2. Subject Materials (Download PDFs/Notes)
3. Student Access Control (Role-based View)

---

## 🎯 PHASE 3.1: STUDENT DASHBOARD

### Requirements

#### UI Components:
- Welcome header with student name
- Semester selector dropdown
- Branch selector dropdown (filtered by semester)
- Subject list grid (filtered by semester & branch)
- Subject cards showing:
  - Subject name
  - Subject code
  - Credits
  - Subject type (Theory/Practical/Both)
  - Quick action buttons

#### Database Collections Needed:
```javascript
// No new collections - using existing data
// Just add student references to existing docs
```

#### Frontend Routes:
```
/dashboard                 - Student dashboard
/dashboard/subjects        - View subjects for selected semester/branch
/dashboard/subjects/:id    - View single subject details
```

#### API Endpoints Needed (Backend):

**GET endpoints (Student can view):**
```
GET /api/students/dashboard
  - Returns: welcome message, student info
  
GET /api/academic/semesters?role=student
  - Returns: available semesters for student
  
GET /api/academic/branches?semesterId=X&role=student
  - Returns: branches in selected semester
  
GET /api/academic/subjects?branchId=X&role=student
  - Returns: subjects in selected branch
  
GET /api/academic/subjects/:id
  - Returns: single subject details with marks structure
```

#### Frontend Tasks:

1. **Create StudentDashboard Component**
   - Location: `client/src/pages/StudentDashboard.jsx`
   - Show welcome message
   - Display semester dropdown
   - Display branch dropdown (filtered)
   - Display subjects grid

2. **Create SubjectCard Component**
   - Location: `client/src/components/SubjectCard.jsx`
   - Show subject info
   - View details button

3. **Create SubjectDetailsView Component**
   - Location: `client/src/pages/SubjectDetails.jsx`
   - Show full subject information
   - Show marks distribution
   - Show materials section

4. **Update App.js Routes**
   - Add `/dashboard` route
   - Add `/dashboard/subjects/:id` route

---

## 🎯 PHASE 3.2: SUBJECT MATERIALS & DOWNLOAD

### Requirements

#### UI Components:
- Materials section in subject details
- Material list with:
  - Material title
  - Material type (Notes/Video/PDF/Assignment)
  - Upload date
  - Download button
  - Resource type badge

#### Frontend Routes:
```
/dashboard/subjects/:id/materials    - View materials for subject
```

#### API Endpoints Needed:

**GET endpoints (Student can view):**
```
GET /api/academic/subjects/:id/materials
  - Returns: all materials for subject
  
GET /api/academic/materials/:id/download
  - Returns: file download
```

#### Frontend Tasks:

1. **Create MaterialsList Component**
   - Location: `client/src/components/MaterialsList.jsx`
   - Display materials table
   - Download buttons
   - Resource type badges

2. **Create MaterialCard Component**
   - Location: `client/src/components/MaterialCard.jsx`
   - Show material info
   - Download link/button

3. **Update SubjectDetails Page**
   - Add materials section
   - Fetch materials on load
   - Handle downloads

4. **Add Download Functionality**
   - Handle PDF/file downloads
   - Show download progress
   - Track download analytics

---

## 🎯 PHASE 3.3: STUDENT ACCESS CONTROL

### Requirements

#### Authorization:
- Only authenticated students can access dashboard
- Students can only see their own semester/branch data
- Students cannot see admin functions
- Logout functionality

#### Frontend Tasks:

1. **Add Role-based Route Guards**
   - Location: `client/src/middleware/ProtectedRoute.js`
   - Check if user is student
   - Redirect non-students to login

2. **Update Navigation**
   - Show student nav menu
   - Hide admin features
   - Add logout button

3. **Add Access Control Checks**
   - Verify student role on each page
   - Show appropriate content
   - Handle unauthorized access

---

## 📊 Data Flow Diagram

```
Student Login
    ↓
Dashboard Page
    ↓
Select Semester (Dropdown)
    ↓
Select Branch (Filtered Dropdown)
    ↓
View Subjects (Grid/List)
    ↓
Click Subject Card
    ↓
Subject Details Page
    ↓
View Materials Section
    ↓
Download Material
    ↓
File Downloaded
```

---

## 🔄 Student Data Access Flow

```
API Request Flow:
1. Student selects semester
   → Fetch semesters available to student
   
2. Student selects branch
   → Fetch branches in that semester
   
3. View subjects
   → Fetch subjects in that branch
   
4. Click subject
   → Get subject details + materials
   
5. Download material
   → Stream file to student
```

---

## 🎨 UI DESIGN FILES LOCATION

**Figma/Design files location:**
- `student-dashboard-UI/` - Dashboard design mockup
- `student-subject-details-UI/` - Subject details design (TBD)
- `student-materials-UI/` - Materials download design (TBD)

---

## ✅ PHASE 3 COMPLETION CHECKLIST

**Backend API:**
- [ ] GET /api/students/dashboard endpoint
- [ ] GET /api/academic/semesters?role=student endpoint
- [ ] GET /api/academic/branches?semesterId=X&role=student endpoint
- [ ] GET /api/academic/subjects?branchId=X&role=student endpoint
- [ ] GET /api/academic/materials/:id/download endpoint
- [ ] Student role authorization in all endpoints

**Frontend Components:**
- [ ] StudentDashboard page
- [ ] SubjectCard component
- [ ] SubjectDetails page
- [ ] MaterialsList component
- [ ] MaterialCard component
- [ ] Semester selector dropdown
- [ ] Branch selector dropdown (filtered)
- [ ] Materials download functionality

**Routes & Navigation:**
- [ ] /dashboard route added
- [ ] /dashboard/subjects/:id route added
- [ ] Student nav menu updated
- [ ] Logout functionality working
- [ ] Protected routes for student pages

**Access Control:**
- [ ] Role-based route guards
- [ ] Authorization checks on all APIs
- [ ] Redirect to login if not authenticated
- [ ] Only show own data filtering

**Testing:**
- [ ] Login as student
- [ ] View dashboard
- [ ] Filter by semester/branch
- [ ] View subject details
- [ ] Download materials
- [ ] Logout

---

## 📝 NOTES

1. **Reuse existing components** from Phase-2
   - Use Table component for materials list
   - Use Button component for download
   - Use Badge component for material types

2. **Similar to Admin Panel**
   - Admin manages data
   - Student views data
   - Same data structure, different permissions

3. **Database Queries**
   - Filter subjects by semester and branch
   - Show only published/active materials
   - Track downloads in analytics (Phase-4)

4. **Security**
   - All endpoints must check student role
   - Students can only see their enrolled subjects
   - Implement semester/branch ownership checks

---

## 🚀 Starting Phase-3

**When Ready to Start:**
1. ✅ Phase-2 should be 100% complete
2. ✅ All Phase-2 APIs tested and working
3. ✅ Student role created in database
4. ✅ Sample student accounts in database

**Next Step:** Create StudentDashboard component and wire API connections.


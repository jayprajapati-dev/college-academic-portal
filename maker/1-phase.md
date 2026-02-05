# 📘 PHASE 1 - PROJECT PLANNING & ANALYSIS

**This file is a complete guide for Phase 1 - planning and design work**

---

## 🎯 PROJECT OVERVIEW

### Project Name
**Smart College Academic Portal**

### Short Description
"A software that shows complete information of subjects according to every semester and branch of college (subject name, subject code, marks distribution, exam type, internal/external evaluation etc.) in one place, where if teacher gives a task or assignment, it appears on notice board with deadline and only relevant semester-branch students can see that notice."

---

## 🔴 PROBLEM STATEMENT

### What is the Problem?
College does not have any centralized system for academic data:
- **Scattered in PDFs**
- **Scattered on Notice boards**  
- **Scattered in Messages**
- **Students miss deadlines**
- **Subject details** are not accessible to students
- **Notices** are visible to everyone (not relevant to all students)

### What is the Solution?
**A Single Centralized Portal where:**
- ✅ Can navigate Semester → Branch → Subject
- ✅ Can view complete subject details  
- ✅ Assignment deadlines are clear
- ✅ Only relevant students can see notices

---

## 👥 USER ROLES

### 1️⃣ ADMIN (Teacher / College Staff)

**Permissions:**
- ✅ Can Login
- ✅ Manage Semesters (add/edit/delete)
- ✅ Manage Branches (add/edit/delete)
- ✅ Manage Subjects (add/edit/delete/update)
- ✅ Add Subject details (marks distribution, exam type, internal/external)
- ✅ Upload Study material (PDF, notes)
- ✅ Post Notices & assignments with deadline
- ✅ Assign Tasks to students

**Required Fields for Admin:**
- Enrollment Number or Mobile Number
- Strong Password (encrypted)
- Role = "Admin"

---

### 2️⃣ STUDENT

**Permissions:**
- ✅ Can view Semester & branch
- ✅ Can view Subject details
- ✅ Can download Study material
- ✅ Can view only their semester-branch notices
- ✅ Can view Assignment deadlines

**What Student Cannot Do:**
- ❌ Cannot add/edit/delete any data
- ❌ Cannot post Notices
- ❌ Cannot manage Subjects

**Required Fields for Student:**
- Enrollment Number
- Password (encrypted)
- Role = "Student"

---

## 📚 PROJECT MODULES

### Module 1: Authentication Module
- Admin Login
- Student Login
- Password encryption
- JWT Token based session

### Module 2: Semester Management
- Semester create/read/update/delete
- Sem 1, Sem 2, Sem 3... Sem 8
- Admin only access

### Module 3: Branch Management
- Branch create/read/update/delete
- IT, CE, ME, etc.
- Linked with Semester
- Admin only access

### Module 4: Subject Management
- Subject create/read/update/delete
- Add Subject name, code
- Linked with Branch
- Admin only access

### Module 5: Subject Details Module
- Marks distribution
- Exam type (Theory, Practical, etc.)
- Internal marks
- External marks
- Admin only access

### Module 6: Notice & Assignment Module
- Post Notices (Admin)
- Assignments with deadlines (Admin)
- View notices (Students - only their semester-branch)
- View assignments (Students - only their semester-branch)

### Module 7: Download Center
- Study materials (PDF, notes)
- Subject wise materials
- Download functionality

### Module 8: Student View Module
- Dashboard view
- Semester selection
- Branch based filtering
- Subject listing
- Material viewing & downloading

---

## 🗄️ DATABASE DESIGN (MongoDB)

### Collection: **admins**
```javascript
{
  _id: ObjectId,
  enrollmentOrMobile: String (unique),
  password: String (encrypted),
  role: "Admin",
  name: String,
  createdAt: Date
}
```

### Collection: **semesters**
```javascript
{
  _id: ObjectId,
  semesterNumber: Number (1-8),
  createdAt: Date
}
```

### Collection: **branches**
```javascript
{
  _id: ObjectId,
  branchName: String (IT, CE, ME),
  semesterId: ObjectId (reference to semesters),
  createdAt: Date
}
```

### Collection: **subjects**
```javascript
{
  _id: ObjectId,
  subjectName: String,
  subjectCode: String,
  branchId: ObjectId (reference to branches),
  createdAt: Date
}
```

### Collection: **subjectDetails**
```javascript
{
  _id: ObjectId,
  subjectId: ObjectId (reference to subjects),
  marksDistribution: {
    theory: Number,
    practical: Number,
    internal: Number,
    external: Number
  },
  examType: String,
  createdAt: Date
}
```

### Collection: **notices**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  semesterId: ObjectId,
  branchId: ObjectId,
  deadline: Date,
  createdBy: ObjectId (reference to admins),
  createdAt: Date
}
```

### Collection: **materials**
```javascript
{
  _id: ObjectId,
  subjectId: ObjectId,
  fileName: String,
  fileType: String (pdf, doc),
  fileUrl: String,
  uploadedBy: ObjectId (reference to admins),
  createdAt: Date
}
```

---

## 📊 FLOWCHARTS & DIAGRAMS

### Admin Module Flowchart
```
Admin Login
    ↓
Dashboard
    ├→ Semester Management
    │   ├→ Add Semester
    │   ├→ Edit Semester
    │   └→ Delete Semester
    ├→ Branch Management
    │   ├→ Add Branch
    │   ├→ Edit Branch
    │   └→ Delete Branch
    ├→ Subject Management
    │   ├→ Add Subject
    │   ├→ Edit Subject
    │   └→ Delete Subject
    ├→ Subject Details
    │   ├→ Add Marks Distribution
    │   └→ Set Exam Type
    ├→ Upload Materials
    │   └→ Upload PDF/Notes
    └→ Post Notices
        ├→ Create Notice
        ├→ Set Deadline
        └→ Select Semester/Branch
```

### Student Module Flowchart
```
Student Login
    ↓
Dashboard
    ├→ Select Semester
    │   ├→ Select Branch
    │   │   ├→ View Subjects
    │   │   │   ├→ View Subject Details
    │   │   │   ├→ Download Materials
    │   │   │   └→ View Marks
    │   │   └→ View Assignments
    │   │       └→ Check Deadline
    │   └→ View Notices
    │       └→ Only relevant notices
    └→ Logout
```

---

## 🔄 PROCESS MODEL: RAD (Rapid Application Development)

**Why RAD?**
- Quick iterations possible
- Immediate feedback
- Modular development
- Testing at each phase

**Phases:**
1. **Planning Phase** (1-2 days)
2. **Prototyping Phase** (1-2 days)
3. **Development Phase** (3-4 days)
4. **Testing Phase** (1-2 days)

---

## 📝 SUMMARY

| Item | Details |
|------|---------|
| **Project Name** | Smart College Academic Portal |
| **Domain** | Education / College Management |
| **Users** | Admin (Teachers) + Students |
| **Modules** | 8 major modules |
| **Technology** | React, Node.js, MongoDB |
| **Process Model** | RAD |
| **Database Type** | NoSQL (MongoDB) |

---

## ✅ PHASE 1 CHECKLIST

- ✅ Project Title defined
- ✅ Problem Statement clear
- ✅ System Overview defined
- ✅ User Roles identified
- ✅ 8 Modules listed
- ✅ Database design completed
- ✅ Flowcharts created
- ✅ Process model selected
- ✅ Folder structure planned

**Phase 1 Status: COMPLETED** ✅

---

**Next Step: Read `2-setup.md` for Phase 2 Setup!**

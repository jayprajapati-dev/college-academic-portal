# Database Schema - Smart College Academic Portal

Database: MongoDB  
Total Collections: 14  
Last Updated: February 16, 2026

---

## Collections Overview

| Collection | Purpose | Key References |
|------------|---------|----------------|
| users | All users (Student/Teacher/HOD/Admin) | branch, semester, assignedSubjects |
| branches | Academic branches (IT, CE, ME) | - |
| semesters | Semesters (Sem 1-8) | - |
| subjects | Subjects with branch/semester link | branch, semester |
| attendances | Attendance records | subject, branch, semester |
| tasks | Assignments/homework | subject, createdBy |
| notices | Notice board announcements | createdBy |
| notifications | User notifications | userId |
| timetables | Class schedules | branch, semester, subject |
| examschedules | Exam schedules | subject, branch, semester |
| examresults | Exam results | student, exam, subject |
| librarybooks | Library catalog | - |
| admins | Legacy admin accounts | - |
| contactmessages | Contact form submissions | - |

---

## 📋 DETAILED SCHEMAS

### 1. User Model (`users` collection)

**File:** `server/models/User.js`

```javascript
{
  // Basic Info
  name: String (required, trimmed),
  email: String (required, unique, lowercase, validated),
  mobile: String (10 digits),
  enrollmentNumber: String (sparse, unique for students),
  
  // Role & Access
  role: String (enum: ['student', 'teacher', 'hod', 'admin'], default: 'student'),
  adminAccess: Boolean (default: false), // ✅ Allows HOD/Teacher admin features
  status: String (enum: ['pending_first_login', 'active', 'disabled'], default: 'active'),
  
  // Academic Assignment
  branch: ObjectId (ref: 'Branch'),
  semester: ObjectId (ref: 'Semester'),
  assignedSubjects: [ObjectId] (ref: 'Subject'), // For teachers
  assignedHOD: ObjectId (ref: 'User'), // For teachers
  
  // For HOD (if they teach)
  branches: [ObjectId] (ref: 'Branch'), // Branch(es) they manage
  semesters: [ObjectId] (ref: 'Semester'),
  subjects: [ObjectId] (ref: 'Subject'), // If HOD teaches
  department: ObjectId (ref: 'Branch'),
  
  // Authentication
  password: String (required, hashed, select: false),
  tempPassword: String (select: false),
  passwordChangeRequired: Boolean (default: false),
  passwordSetupRequired: Boolean (default: false),
  passwordSetupCompletedAt: Date,
  
  // Security Question
  securityQuestion: String (enum: 8 predefined questions),
  securityAnswer: String (hashed, select: false),
  caseInsensitiveAnswer: Boolean (default: true),
  
  // Audit
  addedBy: ObjectId (ref: 'User'),
  addedByRole: String (enum: ['admin', 'hod', 'system']),
  addedAt: Date (default: Date.now),
  createdAt: Date (auto),
  lastLogin: Date,
  
  // Custom Permissions
  permissions: [String] // e.g., ['notices', 'tasks', 'attendance']
}
```

**Indexes:**
- `email`: unique
- `enrollmentNumber`: sparse unique
- `role`: non-unique

---

### 2. Branch Model (`branches` collection)

**File:** `server/models/Branch.js`

```javascript
{
  name: String (required), // e.g., "Computer Engineering"
  code: String (required, unique), // e.g., "CE"
  description: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `code`: unique

---

### 3. Semester Model (`semesters` collection)

**File:** `server/models/Semester.js`

```javascript
{
  name: String (required), // e.g., "Semester 1"
  number: Number (required), // 1-8
  description: String,
  academicYear: String, // e.g., "2024-25"
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `number`: non-unique

---

### 4. Subject Model (`subjects` collection)

**File:** `server/models/Subject.js`

```javascript
{
  name: String (required), // e.g., "Data Structures"
  code: String (required), // e.g., "DS101"
  credits: Number,
  
  // Academic Links
  branch: ObjectId (required, ref: 'Branch'),
  semester: ObjectId (required, ref: 'Semester'),
  
  // Subject Details
  type: String (enum: ['theory', 'practical', 'both']),
  internalMarks: Number,
  externalMarks: Number,
  totalMarks: Number,
  
  // Teacher Assignment
  teachers: [ObjectId] (ref: 'User'),
  
  // Study Materials
  materials: [{
    title: String,
    description: String,
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedAt: Date,
    uploadedBy: ObjectId (ref: 'User'),
    downloads: Number (default: 0)
  }],
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `code`: unique
- `branch`: non-unique
- `semester`: non-unique

---

### 5. Attendance Model (`attendances` collection)

**File:** `server/models/Attendance.js`

```javascript
{
  // Class Info
  branch: ObjectId (required, ref: 'Branch'),
  semester: ObjectId (required, ref: 'Semester'),
  subject: ObjectId (required, ref: 'Subject'),
  
  // Date & Session
  date: Date (required),
  dateKey: String (required), // Format: "YYYY-MM-DD"
  session: String (required, enum: ['Lecture', 'Lab-Tutorial'], default: 'Lecture'),
  
  // Attendance Data
  students: [{
    studentId: ObjectId (required, ref: 'User'),
    status: String (required, enum: ['Present', 'Absent', 'Late'])
  }],
  
  // Metadata
  markedBy: ObjectId (required, ref: 'User'),
  markedAt: Date (default: Date.now),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- Compound: `{subject: 1, dateKey: 1, session: 1}` (unique)

---

### 6. Task Model (`tasks` collection)

**File:** `server/models/Task.js`

```javascript
{
  // Task Info
  title: String (required),
  description: String (required),
  instructions: String,
  type: String (enum: ['assignment', 'homework', 'project', 'quiz']),
  
  // Academic Link
  subject: ObjectId (required, ref: 'Subject'),
  branch: ObjectId (ref: 'Branch'),
  semester: ObjectId (ref: 'Semester'),
  
  // Deadline
  dueDate: Date (required),
  
  // Recipients & Status
  recipients: [{
    userId: ObjectId (required, ref: 'User'),
    status: String (required, enum: ['pending', 'submitted', 'completed'], default: 'pending'),
    answer: String, // Student's submission
    submittedAt: Date,
    // Future: submittedFiles array for file uploads
  }],
  
  // Metadata
  createdBy: ObjectId (required, ref: 'User'),
  createdByRole: String (enum: ['admin', 'hod', 'teacher']),
  
  // Reminders
  reminderSent1Day: Boolean (default: false),
  reminderSent3Day: Boolean (default: false),
  overdueNotified: Boolean (default: false),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `subject`: non-unique
- `dueDate`: non-unique
- `createdBy`: non-unique

---

### 7. Notice Model (`notices` collection)

**File:** `server/models/Notice.js`

```javascript
{
  // Notice Content
  title: String (required),
  content: String (required),
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  
  // Targeting
  targetRoles: [String] (enum: ['student', 'teacher', 'hod', 'admin']),
  audience: String (enum: ['All', 'Selected'], default: 'All'),
  
  // Scope (auto-calculated based on creator)
  branch: ObjectId (ref: 'Branch'), // HOD-created notices
  semester: ObjectId (ref: 'Semester'),
  subject: ObjectId (ref: 'Subject'), // Teacher-created notices
  
  // Recipients
  recipients: [ObjectId] (ref: 'User'),
  
  // Expiry
  expiryDate: Date,
  
  // Metadata
  createdBy: ObjectId (required, ref: 'User'),
  createdByRole: String (enum: ['admin', 'hod', 'teacher']),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `createdBy`: non-unique
- `expiryDate`: non-unique

---

### 8. Notification Model (`notifications` collection)

**File:** `server/models/Notification.js`

```javascript
{
  // Notification Content
  userId: ObjectId (required, ref: 'User'),
  title: String (required),
  message: String (required),
  type: String (enum: ['task', 'notice', 'attendance', 'general']),
  
  // Action
  actionUrl: String, // e.g., "/student/tasks/123"
  
  // Status
  read: Boolean (default: false),
  readAt: Date,
  
  createdAt: Date (auto, default: Date.now)
}
```

**Indexes:**
- `userId`: non-unique
- `read`: non-unique
- `createdAt`: non-unique (descending)

---

### 9. Timetable Model (`timetables` collection)

**File:** `server/models/Timetable.js`

```javascript
{
  // Class Info
  branch: ObjectId (required, ref: 'Branch'),
  semester: ObjectId (required, ref: 'Semester'),
  
  // Schedule
  schedule: [{
    day: String (required, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    slots: [{
      startTime: String (required), // e.g., "09:00"
      endTime: String (required), // e.g., "10:00"
      subject: ObjectId (ref: 'Subject'),
      teacher: ObjectId (ref: 'User'),
      room: String, // e.g., "Lab 1", "Room 201"
      type: String (enum: ['lecture', 'lab', 'tutorial'])
    }]
  }],
  
  // Metadata
  academicYear: String, // e.g., "2024-25"
  createdBy: ObjectId (ref: 'User'),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- Compound: `{branch: 1, semester: 1, academicYear: 1}` (unique)

---

### 10. ExamSchedule Model (`examschedules` collection)

**File:** `server/models/ExamSchedule.js`

```javascript
{
  // Exam Info
  name: String (required), // e.g., "Mid-Term Exam"
  type: String (enum: ['midterm', 'final', 'practical', 'viva']),
  
  // Academic Link
  subject: ObjectId (required, ref: 'Subject'),
  branch: ObjectId (required, ref: 'Branch'),
  semester: ObjectId (required, ref: 'Semester'),
  
  // Schedule
  date: Date (required),
  startTime: String (required), // e.g., "10:00"
  endTime: String (required), // e.g., "13:00"
  duration: Number, // in minutes
  
  // Details
  room: String,
  maxMarks: Number (required),
  instructions: String,
  
  // Metadata
  academicYear: String,
  createdBy: ObjectId (ref: 'User'),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `subject`: non-unique
- `date`: non-unique

---

### 11. ExamResult Model (`examresults` collection)

**File:** `server/models/ExamResult.js`

```javascript
{
  // Student & Exam
  student: ObjectId (required, ref: 'User'),
  exam: ObjectId (required, ref: 'ExamSchedule'),
  subject: ObjectId (required, ref: 'Subject'),
  
  // Marks
  marksObtained: Number (required),
  totalMarks: Number (required),
  percentage: Number, // auto-calculated
  
  // Grade
  grade: String (enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']),
  status: String (enum: ['pass', 'fail']),
  
  // Metadata
  uploadedBy: ObjectId (ref: 'User'),
  remarks: String,
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- Compound: `{student: 1, exam: 1}` (unique)

---

### 12. LibraryBook Model (`librarybooks` collection)

**File:** `server/models/LibraryBook.js`

```javascript
{
  // Book Info
  title: String (required),
  author: String (required),
  isbn: String (unique, sparse),
  publisher: String,
  edition: String,
  yearPublished: Number,
  
  // Categorization
  category: String (enum: ['Fiction', 'Non-Fiction', 'Technical', 'Reference', 'Magazine']),
  subject: String, // e.g., "Computer Science"
  
  // Inventory
  totalCopies: Number (default: 1),
  availableCopies: Number (default: 1),
  
  // Details
  description: String,
  language: String (default: 'English'),
  pages: Number,
  
  // Metadata
  addedBy: ObjectId (ref: 'User'),
  
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `isbn`: unique sparse
- `title`: non-unique
- `category`: non-unique

---

### 13. Admin Model (`admins` collection) ⚠️ LEGACY

**File:** `server/models/Admin.js`

```javascript
{
  username: String,
  password: String (hashed),
  email: String,
  createdAt: Date
}
```

**Status:** Possibly redundant (User model handles all roles now)  
**Action:** Verify usage and consider deprecation

---

### 14. ContactMessage Model (`contactmessages` collection)

**File:** `server/models/ContactMessage.js`

```javascript
{
  // Sender Info
  name: String (required),
  email: String (required),
  mobile: String,
  
  // Message
  subject: String (required),
  message: String (required),
  
  // Status
  read: Boolean (default: false),
  readAt: Date,
  replied: Boolean (default: false),
  repliedAt: Date,
  replyMessage: String,
  
  createdAt: Date (auto)
}
```

**Indexes:**
- `read`: non-unique
- `createdAt`: non-unique (descending)

---

## 📈 RELATIONSHIPS DIAGRAM

```
User
├── belongsTo: Branch
├── belongsTo: Semester
├── hasMany: assignedSubjects (Subject)
├── hasMany: tasks (Task) as creator
├── hasMany: notices (Notice) as creator
├── hasMany: notifications (Notification)
└── hasMany: attendances (Attendance) as student

Branch
├── hasMany: subjects (Subject)
├── hasMany: semesters (Semester)
├── hasMany: users (User)
└── hasMany: timetables (Timetable)

Semester
├── hasMany: subjects (Subject)
└── hasMany: users (User)

Subject
├── belongsTo: Branch
├── belongsTo: Semester
├── hasMany: teachers (User)
├── hasMany: materials (embedded)
├── hasMany: tasks (Task)
├── hasMany: attendances (Attendance)
└── hasMany: exams (ExamSchedule)

Task
├── belongsTo: Subject
├── belongsTo: createdBy (User)
└── hasMany: recipients (embedded with User ref)

Notice
├── belongsTo: createdBy (User)
├── belongsTo: Subject (optional)
└── hasMany: recipients (User)

Attendance
├── belongsTo: Subject
├── belongsTo: Branch
├── belongsTo: Semester
├── belongsTo: markedBy (User)
└── hasMany: students (embedded with User ref)

ExamSchedule
├── belongsTo: Subject
├── belongsTo: Branch
└── belongsTo: Semester

ExamResult
├── belongsTo: ExamSchedule
├── belongsTo: Subject
└── belongsTo: Student (User)

Notification
└── belongsTo: User
```

---

## 🔑 KEY DATABASE FEATURES

### Implemented:
✅ **Role-Based User Model** with adminAccess flag  
✅ **Multi-collection structure** (14 collections)  
✅ **Embedded documents** (materials in Subject, recipients in Task)  
✅ **References** (ObjectId refs for relationships)  
✅ **Compound indexes** (subject + dateKey + session in Attendance)  
✅ **Unique constraints** (email, enrollment number, subject code)  
✅ **Enum validations** (role, status, priority, session types)  
✅ **Timestamps** (createdAt, updatedAt auto-generated)  
✅ **Sparse indexes** (enrollmentNumber, ISBN)  
✅ **Password hashing** (bcrypt in User model)  
✅ **Security question hashing** (bcrypt in User model)  

### Pending:
❌ **Coordinator role fields** in User model (see ISSUES-AND-GAPS.md)  
❌ **File upload fields** in Task recipients (submittedFiles array)  
❌ **Book issue/return tracking** in LibraryBook  
❌ **Audit log collection** (track all changes)  

---

## 💾 DATABASE STATISTICS (Estimated)

### Development Environment:
- **Total Collections:** 14
- **Total Documents:** ~500-1000 (varies by testing data)
- **Database Size:** ~50-100 MB
- **Average Query Time:** <50ms

### Production Environment (Estimated):
- **Users:** ~500-2000 (students + staff)
- **Subjects:** ~100-200
- **Tasks:** ~500-1000 per semester
- **Notices:** ~100-300 per semester
- **Attendance Records:** ~10,000-50,000 per year
- **Database Size:** ~500 MB - 2 GB
- **Average Query Time:** <100ms (with proper indexing)

---

## 🔧 DATABASE OPTIMIZATION NOTES

### Indexes to Add (if not already added):
```javascript
// User collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ branch: 1, semester: 1 })

// Attendance collection
db.attendances.createIndex({ subject: 1, dateKey: 1, session: 1 }, { unique: true })
db.attendances.createIndex({ branch: 1, semester: 1 })

// Task collection
db.tasks.createIndex({ subject: 1 })
db.tasks.createIndex({ dueDate: 1 })
db.tasks.createIndex({ "recipients.userId": 1 })

// Notification collection
db.notifications.createIndex({ userId: 1, read: 1 })
db.notifications.createIndex({ createdAt: -1 })

// Notice collection
db.notices.createIndex({ expiryDate: 1 })
db.notices.createIndex({ createdBy: 1 })
```

---

**Last Updated:** February 14, 2026  
**Schema Version:** 1.0

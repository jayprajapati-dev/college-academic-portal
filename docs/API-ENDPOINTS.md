# 🔌 API ENDPOINTS - Smart College Academic Portal

**Base URL:** `http://localhost:5000` (Development)  
**Authentication:** JWT Bearer Token  
**Total Routes:** 13 files with 50+ endpoints  
**Last Updated:** February 14, 2026

---

## 📋 TABLE OF CONTENTS

1. [Authentication APIs](#

-authentication-apis)
2. [User & Admin APIs](#-user--admin-apis)
3. [Academic Structure APIs](#-academic-structure-apis)
4. [Notice APIs](#-notice-apis)
5. [Task APIs](#-task-apis)
6. [Attendance APIs](#-attendance-apis)
7. [Timetable APIs](#-timetable-apis)
8. [Exam APIs](#-exam-apis)
9. [Library APIs](#-library-apis)
10. [Notification APIs](#-notification-apis)
11. [Profile APIs](#-profile-apis)
12. [Permissions APIs](#-permissions-apis)
13. [Contact APIs](#-contact-apis)

---

## 🔐 AUTHENTICATION APIS

**File:** `server/routes/auth.js`

### POST `/api/auth/register`
Register a new student user.

**Access:** Public  
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "enrollmentNumber": "2024IT001",
  "branch": "branch_id",
  "semester": "semester_id",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": { ...userData },
  "token": "jwt_token_here"
}
```

---

### POST `/api/auth/login`
Login with email/mobile and password.

**Access:** Public  
**Body:**
```json
{
  "emailOrMobile": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "role": "student",
    "adminAccess": false,
    ...
  },
  "token": "jwt_token_here",
  "requiresPasswordSetup": false,
  "requiresPasswordChange": false
}
```

---

### POST `/api/auth/forgot-password`
Initiate password reset (verify security question).

**Access:** Public  
**Body:**
```json
{
  "emailOrMobile": "john@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "securityQuestion": "What is your mother's maiden name?"
}
```

---

### POST `/api/auth/verify-security-answer`
Verify security answer.

**Access:** Public  
**Body:**
```json
{
  "emailOrMobile": "john@example.com",
  "securityAnswer": "Smith"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Security answer verified",
  "resetToken": "temp_token_for_reset"
}
```

---

### POST `/api/auth/reset-password`
Reset password after verification.

**Access:** Public (with resetToken)  
**Body:**
```json
{
  "emailOrMobile": "john@example.com",
  "resetToken": "temp_token",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 👥 USER & ADMIN APIS

**File:** `server/routes/admin.js`

### POST `/api/admin/add-teacher`
Add a new teacher (Admin/HOD only).

**Access:** Admin, HOD (with branch validation)  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "mobile": "9876543211",
  "branch": "branch_id",
  "assignedSubjects": ["subject_id1", "subject_id2"],
  "password": "temp123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Teacher added successfully",
  "user": { ...teacherData }
}
```

---

### POST `/api/admin/add-hod`
Add a new HOD (Admin only).

**Access:** Admin  
**Body:**
```json
{
  "name": "Dr. Kumar",
  "email": "kumar@example.com",
  "mobile": "9876543212",
  "branch": "branch_id",
  "assignedSubjects": ["subject_id1"], // optional
  "password": "temp123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "HOD added successfully",
  "user": { ...hodData }
}
```

---

### GET `/api/admin/students`
Get all students (Admin) or branch students (HOD).

**Access:** Admin, HOD  
**Query Params:** `?page=1&limit=20&search=John&branch=branch_id&semester=sem_id`  
**Response:**
```json
{
  "success": true,
  "students": [...studentArray],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

---

### PATCH `/api/admin/block-user/:userId`
Block a student account.

**Access:** Admin, HOD  
**Response:**
```json
{
  "success": true,
  "message": "User blocked successfully"
}
```

---

### PATCH `/api/admin/unblock-user/:userId`
Unblock a student account.

**Access:** Admin, HOD  
**Response:**
```json
{
  "success": true,
  "message": "User unblocked successfully"
}
```

---

### PATCH `/api/admin/promote-to-admin/:userId`
Give admin access to HOD/Teacher.

**Access:** Admin only  
**Response:**
```json
{
  "success": true,
  "message": "User promoted to admin access"
}
```

---

## 🏗️ ACADEMIC STRUCTURE APIS

**File:** `server/routes/academic.js`

### Branches

#### GET `/api/academic/branches`
Get all branches with pagination.

**Access:** All authenticated users  
**Query:** `?page=1&limit=10`  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "branch_id",
      "name": "Computer Engineering",
      "code": "CE",
      "description": "..."
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

#### POST `/api/academic/branches`
Create a new branch.

**Access:** Admin  
**Body:**
```json
{
  "name": "Computer Engineering",
  "code": "CE",
  "description": "Computer Science and Engineering"
}
```

#### PUT `/api/academic/branches/:id`
Update a branch.

**Access:** Admin  

#### DELETE `/api/academic/branches/:id`
Delete a branch.

**Access:** Admin  

---

### Semesters

#### GET `/api/academic/semesters`
Get all semesters.

**Access:** All authenticated users  

#### POST `/api/academic/semesters`
Create a semester.

**Access:** Admin  
**Body:**
```json
{
  "name": "Semester 1",
  "number": 1,
  "description": "First semester",
  "academicYear": "2024-25"
}
```

#### PUT `/api/academic/semesters/:id`
Update a semester.

**Access:** Admin  

#### DELETE `/api/academic/semesters/:id`
Delete a semester.

**Access:** Admin  

---

### Subjects

#### GET `/api/academic/subjects`
Get all subjects with filters.

**Access:** All authenticated users  
**Query:** `?branch=branch_id&semester=sem_id&page=1&limit=20`  

#### GET `/api/academic/subjects/:id`
Get subject details.

**Access:** All authenticated users  

#### POST `/api/academic/subjects`
Create a subject.

**Access:** Admin  
**Body:**
```json
{
  "name": "Data Structures",
  "code": "DS101",
  "credits": 4,
  "branch": "branch_id",
  "semester": "semester_id",
  "type": "theory",
  "internalMarks": 30,
  "externalMarks": 70,
  "teachers": ["teacher_id1", "teacher_id2"]
}
```

#### PUT `/api/academic/subjects/:id`
Update a subject.

**Access:** Admin  

#### DELETE `/api/academic/subjects/:id`
Delete a subject.

**Access:** Admin  

---

### Materials (Subject Study Materials)

#### POST `/api/academic/subjects/:id/materials`
Upload study material for a subject.

**Access:** Admin, Teacher  
**Content-Type:** `multipart/form-data`  
**Body:**
```
- title: "Chapter 1 Notes"
- description: "Introduction to Data Structures"
- file: <file upload> (PDF, DOCX, PPT, ZIP - max 50MB)
```

#### GET `/api/academic/subjects/:id/materials`
Get all materials for a subject.

**Access:** All authenticated users  

#### DELETE `/api/academic/subjects/:id/materials/:matId`
Delete a material.

**Access:** Admin, Teacher  

#### PATCH `/api/academic/subjects/:id/materials/:matId/download`
Increment download count.

**Access:** All authenticated users  

---

### Academic Structure

#### GET `/api/academic/structure`
Get hierarchical view of branches → semesters → subjects.

**Access:** All authenticated users  
**Response:**
```json
{
  "success": true,
  "structure": [
    {
      "branch": { ...branchData },
      "semesters": [
        {
          "semester": { ...semesterData },
          "subjects": [...subjectArray]
        }
      ]
    }
  ]
}
```

---

## 📢 NOTICE APIS

**File:** `server/routes/notice.js`

### POST `/api/notice`
Create a new notice.

**Access:** Admin, HOD, Teacher  
**Body:**
```json
{
  "title": "Holiday Announcement",
  "content": "College will remain closed on...",
  "priority": "high",
  "audience": "All", // or "Selected"
  "targetRoles": ["student", "teacher"], // if audience is "Selected"
  "expiryDate": "2026-03-01"
}
```
**Scope:**
- Admin: Can target everyone or any role
- HOD: Targets own branch students/teachers automatically
- Teacher: Targets own subject students automatically

**Response:**
```json
{
  "success": true,
  "message": "Notice created successfully",
  "notice": { ...noticeData }
}
```

---

### GET `/api/notice`
Get all notices (filtered by user role).

**Access:** All authenticated users  
**Response:**
```json
{
  "success": true,
  "notices": [
    {
      "_id": "notice_id",
      "title": "Holiday Announcement",
      "content": "...",
      "priority": "high",
      "createdBy": { "name": "Admin Name" },
      "createdAt": "2026-02-14T10:00:00Z",
      "expiryDate": "2026-03-01T00:00:00Z"
    }
  ]
}
```

---

### GET `/api/notice/:id`
Get single notice details.

**Access:** All authenticated users  

---

### PUT `/api/notice/:id`
Update a notice.

**Access:** Creator or Admin  

---

### DELETE `/api/notice/:id`
Delete a notice.

**Access:** Creator or Admin  

---

## 📝 TASK APIS

**File:** `server/routes/task.js`

### POST `/api/task`
Create a new task/assignment.

**Access:** Teacher (assigned to subject), HOD (if teaching)  
**Body:**
```json
{
  "title": "Assignment 1",
  "description": "Solve the given problems",
  "instructions": "Submit by tomorrow",
  "type": "assignment",
  "subject": "subject_id",
  "dueDate": "2026-02-20T23:59:00Z"
}
```
**Note:** Recipients (students) are auto-calculated from subject enrollment.

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": { ...taskData }
}
```

---

### GET `/api/task/all`
Get all tasks.

**Access:**
- Teacher: Tasks created by them
- HOD: Tasks for their branch (if teaching)
- Admin: Not allowed (tasks disabled for admin)
- Student: Tasks for enrolled subjects

**Query:** `?status=pending&subject=subject_id`  

---

### GET `/api/task/:id`
Get task details.

**Access:** Creator, assigned students  
**Response:**
```json
{
  "success": true,
  "task": {
    "_id": "task_id",
    "title": "Assignment 1",
    "description": "...",
    "dueDate": "2026-02-20T23:59:00Z",
    "subject": { ...subjectData },
    "createdBy": { ...teacherData },
    "studentStatus": "pending" // only for students
  }
}
```

---

### POST `/api/task/:id/submit`
Student submits a task.

**Access:** Student (if task recipient)  
**Body:**
```json
{
  "answer": "Here is my submission text..."
}
```
**Response:**
```json
{
  "success": true,
  "message": "Task submitted successfully"
}
```

---

### GET `/api/task/:id/submissions`
Get all student submissions for a task.

**Access:** Teacher (task creator)  
**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "student": {
        "_id": "student_id",
        "name": "John Doe",
        "enrollmentNumber": "2024IT001"
      },
      "status": "submitted",
      "answer": "...",
      "submittedAt": "2026-02-15T10:30:00Z"
    }
  ]
}
```

---

### PATCH `/api/task/:taskId/submissions/:studentId/status`
Update student submission status.

**Access:** Teacher (task creator)  
**Body:**
```json
{
  "status": "completed" // or "pending", "submitted"
}
```

---

### PUT `/api/task/:id`
Update a task.

**Access:** Teacher (task creator)  

---

### DELETE `/api/task/:id`
Delete a task.

**Access:** Teacher (task creator)  

---

## ✅ ATTENDANCE APIS

**File:** `server/routes/attendance.js`

### POST `/api/attendance/mark`
Mark attendance for a class.

**Access:** Teacher, HOD  
**Body:**
```json
{
  "subject": "subject_id",
  "branch": "branch_id",
  "semester": "semester_id",
  "date": "2026-02-14",
  "session": "Lecture", // or "Lab-Tutorial"
  "students": [
    { "studentId": "student_id1", "status": "Present" },
    { "studentId": "student_id2", "status": "Absent" },
    { "studentId": "student_id3", "status": "Late" }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendance": { ...attendanceData }
}
```

---

### GET `/api/attendance/sessions`
Get all attendance sessions.

**Access:** Teacher, HOD, Admin  
**Query:** `?subject=subject_id&startDate=2026-02-01&endDate=2026-02-28`  

---

### GET `/api/attendance/student/:studentId`
Get attendance for a specific student.

**Access:** Admin, HOD, Teacher, Student (own only)  
**Response:**
```json
{
  "success": true,
  "attendance": [
    {
      "subject": { "name": "Data Structures" },
      "date": "2026-02-14",
      "session": "Lecture",
      "status": "Present"
    }
  ],
  "summary": {
    "totalClasses": 50,
    "present": 45,
    "absent": 3,
    "late": 2,
    "percentage": 90
  }
}
```

---

### GET `/api/attendance/:id`
Get specific attendance session.

**Access:** Teacher, HOD, Admin  

---

### PUT `/api/attendance/:id`
Update an attendance session.

**Access:** Teacher (who marked it)  

---

### DELETE `/api/attendance/:id`
Delete an attendance session.

**Access:** Teacher, HOD, Admin  

---

## 📅 TIMETABLE APIS

**File:** `server/routes/timetable.js`

### GET `/api/timetable/branch/:branchId/semester/:semesterId`
Get timetable for a branch/semester.

**Access:** All authenticated users  

### POST `/api/timetable`
Create/update timetable.

**Access:** Admin, HOD  
**Body:**
```json
{
  "branch": "branch_id",
  "semester": "semester_id",
  "schedule": [
    {
      "day": "Monday",
      "slots": [
        {
          "startTime": "09:00",
          "endTime": "10:00",
          "subject": "subject_id",
          "teacher": "teacher_id",
          "room": "Room 201",
          "type": "lecture"
        }
      ]
    }
  ],
  "academicYear": "2024-25"
}
```

### GET `/api/timetable/student/:studentId`
Get timetable for a student.

**Access:** Student (own), Admin, HOD, Teacher  

---

## 📝 EXAM APIS

**File:** `server/routes/exam.js`

### POST `/api/exam/schedule`
Create exam schedule.

**Access:** Admin, HOD  
**Body:**
```json
{
  "name": "Mid-Term Exam",
  "type": "midterm",
  "subject": "subject_id",
  "branch": "branch_id",
  "semester": "semester_id",
  "date": "2026-03-15",
  "startTime": "10:00",
  "endTime": "13:00",
  "duration": 180,
  "room": "Hall A",
  "maxMarks": 100
}
```

### GET `/api/exam/schedule`
Get exam schedules.

**Query:** `?branch=branch_id&semester=sem_id&startDate=2026-03-01`  

### POST `/api/exam/results`
Upload exam results.

**Access:** Admin, HOD  
**Body:**
```json
{
  "student": "student_id",
  "exam": "exam_id",
  "subject": "subject_id",
  "marksObtained": 85,
  "totalMarks": 100,
  "grade": "A"
}
```

### GET `/api/exam/results/student/:studentId`
Get results for a student.

**Access:** Student (own), Admin, HOD  

---

## 📚 LIBRARY APIS

**File:** `server/routes/library.js`

### GET `/api/library/books`
Get all library books.

**Access:** All authenticated users  
**Query:** `?search=algorithms&category=Technical&page=1&limit=20`  

### POST `/api/library/books`
Add a new book.

**Access:** Admin, Librarian  
**Body:**
```json
{
  "title": "Introduction to Algorithms",
  "author": "Cormen",
  "isbn": "978-0262033848",
  "publisher": "MIT Press",
  "category": "Technical",
  "totalCopies": 5
}
```

### PUT `/api/library/books/:id`
Update book details.

**Access:** Admin  

### DELETE `/api/library/books/:id`
Delete a book.

**Access:** Admin  

---

## 🔔 NOTIFICATION APIS

**File:** `server/routes/notifications.js`

### GET `/api/notifications`
Get user notifications.

**Access:** All authenticated users  
**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notif_id",
      "title": "New Task Assigned",
      "message": "Assignment 1 has been posted",
      "type": "task",
      "actionUrl": "/student/tasks/task_id",
      "read": false,
      "createdAt": "2026-02-14T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### PATCH `/api/notifications/mark-read/:id`
Mark notification as read.

**Access:** Notification owner  

### PATCH `/api/notifications/mark-all-read`
Mark all notifications as read.

**Access:** All authenticated users  

---

## 👤 PROFILE APIS

**File:** `server/routes/profile.js`

### GET `/api/profile`
Get user profile.

**Access:** All authenticated users  

### PUT `/api/profile`
Update user profile.

**Access:** All authenticated users  
**Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "mobile": "9999999999"
}
```

### POST `/api/profile/photo`
Upload profile photo.

**Access:** All authenticated users  
**Content-Type:** `multipart/form-data`  

---

## 🔑 PERMISSIONS APIS

**File:** `server/routes/permissions.js`

### GET `/api/permissions/me`
Get user's allowed modules.

**Access:** All authenticated users  
**Query:** `?mode=admin` (for HOD/Teacher with adminAccess)  
**Response:**
```json
{
  "success": true,
  "allowedModules": [
    "dashboard",
    "materials",
    "library",
    "tasks",
    "notices",
    "attendance",
    "exams",
    "users"
  ],
  "role": "teacher",
  "adminAccess": true
}
```

---

## 📧 CONTACT APIS

**File:** `server/routes/contact.js`

### POST `/api/contact`
Submit contact form.

**Access:** Public  
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "subject": "Inquiry about admission",
  "message": "I would like to know..."
}
```

### GET `/api/contact`
Get all contact messages (Admin only).

**Access:** Admin  

### PATCH `/api/contact/:id/read`
Mark contact message as read.

**Access:** Admin  

---

## 🔧 COMMON RESPONSE FORMATS

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ...responseData }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Pagination Response:
```json
{
  "success": true,
  "data": [...items],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## 🔒 AUTHENTICATION HEADER

For all protected routes, include JWT token:

```
Authorization: Bearer <your_jwt_token>
```

Get token from login response and store in localStorage:
```javascript
localStorage.setItem('token', response.token);
```

---

## 📝 NOTES

- All dates should be in ISO 8601 format
- File uploads use `multipart/form-data`
- Pagination default: `page=1, limit=20`
- All ObjectIds are MongoDB ObjectIds (24-character hex string)
- Timestamps are automatically added by MongoDB (createdAt, updatedAt)

---

**API Version:** 1.0  
**Last Updated:** February 14, 2026

# System Architecture & Flowcharts

## 1. SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SMART COLLEGE ACADEMIC PORTAL SYSTEM                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐        ┌─────────────┐
│  CLIENT LAYER        │         │   SERVER LAYER       │        │ DATABASE    │
│  (React Frontend)    │         │  (Node + Express)    │        │ (MongoDB)   │
│                      │         │                      │        │             │
│ ├─ Login Page        │◄────────│ ├─ Auth Routes      │◄──────│ ├─ Users    │
│ ├─ Dashboard         │         │ ├─ Academic Routes   │       │ ├─ Subjects│
│ ├─ Subject Hub       │         │ ├─ Admin Routes      │       │ ├─ Tasks   │
│ ├─ Task Board        │─────────│ ├─ Profile Routes    │──────│ ├─ Notices │
│ ├─ Notice Board      │         │ └─ File Uploads      │       │ ├─ Library │
│ ├─ Attendance View   │         │                      │       │ └─ Attendance
│ ├─ Timetable         │    JWT  │  Auth Middleware     │   JWT │             │
│ ├─ Library           │         │  Role Middleware     │       │             │
│ └─ Profile           │         │  Error Handler       │       │             │
│                      │         │                      │        │             │
└──────────────────────┘         └──────────────────────┘        └─────────────┘
         ▲                                   ▲                            │
         │         HTTP/REST API            │                            │
         └───────────────────────────────────┘                            │
                                                                           │
                                         MongoDB Connection String ───────┘
```

---

## 2. AUTHENTICATION FLOW DIAGRAM

```
START
  │
  ├─► User Access Portal
  │
  ├─► Logged In? ────NO────┐
  │                        │
  │                        ├─► Login Page
  │                        │    ├─ Email/Mobile/Enrollment#
  │                        │    └─ Password
  │                        │
  │                        ├─► Verify Credentials ──YES──┐
  │                        │                             │
  │                        └─► ERROR MESSAGE ◄───NO──────┘
  │
  │ YES
  ├─► Check JWT Token Valid?
  │
  │ YES
  ├─► First Login Required? ──YES──┐
  │                                │
  │                                ├─► First Login Page
  │                                │    ├─ New Password
  │                                │    ├─ Confirm Password
  │                                │    └─ Security Question
  │                                │
  │                                ├─► Update User Profile
  │                                │    └─ Set passwordChangeRequired = false
  │
  │ NO
  ├─► Check User Role ──────┐
  │                         │
  │                    ┌────┼────┬─────────┬─────────┐
  │                    │         │         │         │
  │                 Student   Teacher    HOD      Admin
  │                    │         │         │         │
  │              ┌─────┴─┐  ┌────┴──┐  ┌──┴────┐  ┌─┴───────┐
  │              │       │  │       │  │       │  │         │
  │          Student   Landing  Teacher  HOD   Admin  Admin
  │          Dashboard Dashboard Dashboard Panel  Panel  Setup
  │              │       │  │       │  │       │  │         │
  └──────────────┴───────┴──┴───────┴──┴───────┴──┴─────────┘
                            │
                          SUCCESS
                            │
                         END
```

---

## 3. STUDENT USER JOURNEY FLOW

```
                    ┌─────────────────────────────────┐
                    │   STUDENT PORTAL ACCESS         │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Student Dashboard    │
                    └────────┬─────┬────┬────┴────┬──────────┐
                             │     │    │         │          │
                    ┌────────┼─────┼────┼─────────┼──────────┐
                    │        │     │    │         │          │
                Browse   View  Submit  View    Check    Edit
                Subjects Tasks Tasks   Notices Attendance Profile
                    │        │     │    │         │          │
          ┌─────────┴────────┘     │    │         │          │
          │                        │    │         │          │
      Subject                      │    │         │          │
      Hub                          │    │         │          │
      Page      Assignment   Task    Notice   Attendance  Profile
        │        Board       Details  Board    Tracking    Edit
        │          │           │        │        │          │
        ├─ Code    ├─ Due      ├─ Submit├─ Date ├─ Lecture ├─ Name
        ├─ Name    ├─ Title    ├─ Files ├─ Title├─ Lab     ├─ Mobile
        ├─ Credits├─ Content  ├─ Status├─ Content└─ Summary ├─ Branch
        ├─ Exam Type          ├─ Score   │                   └─ Semester
        ├─ Marks  └─ Deadline  │       └─ Remarks
        ├─ Syllabus            │
        ├─ Notes               └─ Student Notifications
        ├─ Papers                  (Real-time Updates)
        └─ Books                       │
                                   Mark as
                                   Read/Delete

        ↓ (All Actions)
    ┌───────────────────────┐
    │ Database Update       │
    │ (MongoDB Documents)   │
    └───────────────────────┘
```

---

## 4. TEACHER/HOD WORKFLOW

```
    ┌─────────────────────────────────────────────────┐
    │  TEACHER/HOD DASHBOARD                          │
    └──────────────┬──────────────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┬─────────────┐
       │           │           │              │             │
    Create       Post         Mark          Manage        View
    Tasks      Notices     Attendance      Subjects      Submissions
       │           │           │              │             │
       │           │           │              │             │
   ┌──┴──┐    ┌───┴───┐   ┌───┴──┐      ┌───┴───┐      ┌──┴──┐
   │     │    │       │   │      │      │       │      │     │
┌─┴─┐┌─┴─┐ ┌┴──┐┌──┬─┘ ┌─┴─┐ ┌─┴─┐  ┌─┴──┐┌──┴─┐  ┌─┴─┐┌─┴─┐
│Set ││Due││Role┌─────┘│Lec││Lab│  │Edit││Run │  │View││Filter
│Sub││Date││Targ││Title││Att││Att│  │Mat││Rep │  │Sub││by
│ject││  ││eted││Desc││  ││   │  │er ││ort  │  │ │Status
└───┘└───┘ └────┘└────┘└───┘└───┘  └────┘└────┘  └───┘└────┘
   │       │         │      │         │           │
   │       │         │      │         │           │
   └───────┼─────────┴──────┴─────────┴───────────┘
           │
    ┌──────▼──────────┐
    │  Submit to DB   │
    │  (MongoDB)      │
    │                 │
    │ Collections:    │
    │ ├─ Tasks        │
    │ ├─ Notices      │
    │ ├─ Attendance   │
    │ └─ Materials    │
    └─────────────────┘
```

---

## 5. ADMIN PANEL FLOW

```
    ┌─────────────────────────────────────────────┐
    │  ADMIN CONTROL PANEL                        │
    └────────────┬────────────────────────────────┘
                 │
        ┌────────┼────────┬────────────┬──────────┐
        │        │        │            │          │
    User     Academic  System      Content     Reports
    Management Structure Management Management
        │        │        │            │
    ┌──┴──┐ ┌──┴──┐ ┌───┴──┐ ┌──────┴──┐
    │     │ │     │ │      │ │         │
    │     │ │     │ │      │ │         │
  ┌─┴─┐   ├─┴─┐   ├─┴──┐   ├─┴──┐   ┌──┴──┐
  │Add│   │Add│   │Set │   │Add │   │View │
  │HOD│   │Sem│   │Rules   │Mater   │Analyt
  │User   │Branch │          │ials    │ics
  │ │ │   │ │ │   │          │ │      │ │
  │Deact  │Delete │          │Edit    │Export
  │ │ │   │ │ │   │          │ │      │Data
  │Status │Config │          │Delete  │
  │ │ │   │ │ │   │          │ │      │
  └─┬─┘   └──┬──┘ └───┬──┘ └──┬──┘  └──┬──┘
    │        │        │       │        │
    └────────┼────────┼───────┼────────┘
             │
      ┌──────▼─────────────┐
      │  MongoDB Update    │
      │  (All Collections) │
      │                    │
      │ Users              │
      │ Subjects           │
      │ Branches           │
      │ Semesters          │
      │ And More...        │
      └────────────────────┘
```

---

## 6. DATA FLOW FOR SUBJECT VIEWING (WITH MARKS)

```
STUDENT VISITS SUBJECT PAGE: /subjects/:id
           │
           ▼
┌────────────────────────────────────┐
│ Frontend (SubjectHub.jsx)          │
│                                    │
│ 1. Extract ID from URL             │
│ 2. useEffect fires on mount        │
│ 3. Calls API                       │
└────────┬───────────────────────────┘
         │
         │ HTTP GET Request
         ▼
┌────────────────────────────────────┐
│ Backend API Route                  │
│ GET /api/academic/subjects/:id/pub │
│                                    │
│ 1. Validate ID                     │
│ 2. Query MongoDB                   │
└────────┬───────────────────────────┘
         │
         │ Database Query
         ▼
┌────────────────────────────────────┐
│ MongoDB - Subject Collection       │
│                                    │
│ db.subjects.findById(id)           │
│  .populate('branchId')             │
│  .populate('semesterId')           │
│  .select(...)                      │
│                                    │
│ Returns:                           │
│ {                                  │
│   name: "Database Systems",        │
│   code: "CS201",                   │
│   marks: {                         │
│     theory: {                      │
│       internal: 20,                │
│       external: 30,                │
│       total: 50                    │
│     },                             │
│     practical: {                   │
│       internal: 10,                │
│       external: 20,                │
│       total: 30                    │
│     },                             │
│     totalMarks: 80,                │
│     passingMarks: 30               │
│   },                               │
│   type: "theory+practical",        │
│   ...                              │
│ }                                  │
└────────┬───────────────────────────┘
         │
         │ JSON Response
         ▼
┌────────────────────────────────────┐
│ Frontend - Parse Response          │
│                                    │
│ setSubject(data.subject)           │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Render Subject Components          │
│                                    │
│ ✅ Code & Name                     │
│ ✅ Credits & Semester              │
│ ✅ Exam Type (NEW)                 │
│   └─ "Theory + Practical"          │
│                                    │
│ ✅ Total Marks Card (NEW)          │
│   └─ 80 marks                      │
│                                    │
│ ✅ Marks Breakdown (NEW)           │
│   ├─ Theory: 50 (20+30)            │
│   ├─ Practical: 30 (10+20)         │
│   └─ Passing: 30                   │
│                                    │
│ ✅ Materials Section               │
│ ✅ Timetable Section               │
│ ✅ Library Books                   │
└────────┬───────────────────────────┘
         │
         ▼
    STUDENT SEES:
    ┌──────────────────────────────────┐
    │ DATABASE SYSTEMS    [CS201]      │
    │ Semester 4 | B.Tech CS|Credits 4 │
    │                                  │
    │ EXAM TYPE          TOTAL MARKS   │
    │ Theory + Practical      80       │
    │                                  │
    │ MARKS BREAKDOWN                  │
    │ ┌─────Theory────────┐            │
    │ │ Internal:    20   │            │
    │ │ External:    30   │            │
    │ │ Total:       50   │            │
    │ └───────────────────┘            │
    │                                  │
    │ ┌─────Practical────────┐         │
    │ │ Internal:     10    │         │
    │ │ External:     20    │         │
    │ │ Total:        30    │         │
    │ └────────────────────┘         │
    │                                  │
    │ PASSING MARKS: 30                │
    │                                  │
    │ MATERIALS | TIMETABLE | etc      │
    └──────────────────────────────────┘
```

---

## 7. COMPLETE REQUEST-RESPONSE CYCLE

```
┌──────────────────────────────────────────────────────────────────┐
│       COMPLETE REQUEST-RESPONSE PROCESSING CHAIN                │
└──────────────────────────────────────────────────────────────────┘

CLIENT REQUEST
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 1. HTTP REQUEST                                                  │
│    ├─ Method: GET/POST/PUT/DELETE                               │
│    ├─ URL: /api/academic/subjects/123                           │
│    ├─ Headers: { Authorization: Bearer JWT_TOKEN }              │
│    ├─ Body: (if POST/PUT) JSON data                             │
│    └─ Timestamp: Auto                                            │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. ROUTING (Express Router)                                      │
│    └─ Match URL pattern to route handler                         │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. MIDDLEWARE EXECUTION (In Order)                               │
│    ├─ CORS & Security Headers                                    │
│    ├─ Auth Middleware                                            │
│    │  └─ Verify JWT token validity                               │
│    │     └─ Extract user info from token                         │
│    ├─ Role Middleware (OPTIONAL)                                 │
│    │  └─ Check if user has required role                         │
│    └─ Body Parser (auto)                                         │
│       └─ Convert JSON to JavaScript objects                      │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. ROUTE HANDLER / CONTROLLER                                    │
│    ├─ Validate Input (ID format, required fields)                │
│    ├─ Prepare MongoDB query                                      │
│    └─ Execute business logic                                     │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. DATABASE QUERY                                                │
│    ├─ Connection: MongoDB Atlas/Local                            │
│    ├─ Query: db.collection.find/update/insert/delete             │
│    ├─ Populated fields: branchId, semesterId                     │
│    └─ Selected fields: name, code, marks, type, etc.             │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. DATA PROCESSING                                               │
│    ├─ Format response data                                       │
│    ├─ Calculate derived values (if needed)                       │
│    ├─ Serialize JavaScript objects to JSON                       │
│    └─ Set HTTP status code (200, 404, 500, etc.)                │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. HTTP RESPONSE                                                 │
│    ├─ Status: 200 OK                                             │
│    ├─ Headers: Content-Type: application/json                    │
│    ├─ Body: {                                                    │
│    │   success: true,                                            │
│    │   subject: {                                                │
│    │     _id: "507f1f77bcf86cd799439011",                        │
│    │     name: "Database Systems",                               │
│    │     code: "CS201",                                          │
│    │     type: "theory+practical",                               │
│    │     marks: {totalMarks: 80, ...},                           │
│    │     ...                                                     │
│    │   }                                                         │
│    │ }                                                           │
│    └─ Timestamp: Auto                                            │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. CLIENT RECEIVES RESPONSE                                      │
│    ├─ Parse JSON                                                 │
│    ├─ Check if response.success === true                         │
│    ├─ Save data to React state: setSubject(data.subject)        │
│    └─ Handle errors if status !== 200                            │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. UI RENDERING                                                  │
│    ├─ React re-renders component with new data                   │
│    ├─ Display:                                                   │
│    │  ├─ Subject name and code                                    │
│    │  ├─ Exam Type badge                                         │
│    │  ├─ Marks breakdown cards                                   │
│    │  ├─ Materials section                                       │
│    │  └─ Other sections                                          │
│    └─ Browser displays updated page                              │
└──────────────────────────────────────────────────────────────────┘

SUCCESS! Student sees complete subject information with marks.
```

---

## Summary of Flowcharts

| Flowchart | Purpose |
|-----------|---------|
| Architecture | Shows system layers (Client, Server, Database) |
| Authentication | User login and first-login flow |
| Student Journey | All features student can access |
| Teacher Workflow | Teacher/HOD specific operations |
| Admin Panel | Administrative functions |
| Subject Data Flow | How subject marks are retrieved | Request-Response | Complete API call cycle |

---

**Note:** All these flows are currently implemented and working in the Smart College Academic Portal.

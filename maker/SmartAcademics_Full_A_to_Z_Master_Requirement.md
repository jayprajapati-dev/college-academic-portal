
# SMART ACADEMICS
## COMPLETE A–Z REQUIREMENT BASED DEVELOPMENT DOCUMENT
### (Backend + Frontend + UI + Workflow + Roles + Pages)

---
---

## 1. PROJECT INTRODUCTION

### 1.1 Project Title
**Smart Academics – College Academic Management & Information Portal**

### 1.2 Purpose of the Project
The purpose of Smart Academics is to build a **centralized, role-based academic portal** for colleges where:
- Students can view semester-wise academic information
- Teachers can upload academic content
- HODs can verify and approve content
- Super Admin can control the entire system

This project is designed as a **real-world software system**, not just a demo project.

---

## 2. TECHNOLOGY STACK

### 2.1 Frontend
- React.js
- React Router
- Axios
- Context API / Redux (optional)
- Tailwind CSS / Material UI

### 2.2 Backend
- Node.js
- Express.js

### 2.3 Database
- MongoDB
- Mongoose ODM

### 2.4 Authentication & Security
- JWT (Access Token)
- Password hashing (bcrypt)
- Role-based access control (RBAC)

---

## 3. USER ROLES & PERMISSIONS (VERY IMPORTANT)

### 3.1 Student
**Permissions**
- View semesters
- View branches
- View subjects
- View approved syllabus, materials, notices, timetable
- Cannot create or edit anything

**Restrictions**
- No access to admin panel
- No approval rights

---

### 3.2 Teacher
**Permissions**
- Added by Admin/HOD (not self-registration)
- Login with mobile number + temporary password (given by Admin/HOD)
- MUST change password on first login
- MUST set security question & answer on first login
- Add academic content (notices, materials, syllabus, timetable)
- **3 buttons when adding/editing content:**
  - **Draft:** Save for later review (status: draft)
  - **Submit:** Publish directly and go live immediately (status: published)
  - **Cancel:** Discard changes
- Edit own content (both draft and published)
- Delete own content
- View own content only (drafts + published)

**First Login Flow:****
1. Enter mobile number + temp password
2. System shows: "Change Your Password" page
3. Enter new password (confirm password)
4. Set security question & answer
5. Checkbox: "Make answer case-insensitive" (if ticked, 'yellow'='YELLOW'='YeLLoW')
6. Submit → Auto-shows Profile Form with name, etc.
7. Profile displays auto-assigned data (read-only):
   - HOD Name (assigned by Admin/HOD)
   - Semester (assigned by Admin/HOD)
   - Branch (assigned by Admin/HOD)
   - Subject (assigned by Admin/HOD)

**Restrictions**
- Cannot modify auto-assigned profile fields (HOD, semester, branch, subject)
- Cannot access other teachers' content
- Cannot create/edit semesters, branches, or subjects
- Cannot add users

**Separate UI:**
- Simple dashboard
- Content management for assigned subjects only
- No user management section
- No academic structure management

---

### 3.3 HOD (Head of Department)
**Permissions**
- **All Teacher permissions** (can do everything Teacher can do)
- Added by Admin only (with mobile number + temp password)
- Can add Teachers (like Admin does)
- Can assign temp password to Teachers
- Manage teachers of own branch (view, deactivate)
- **3 buttons when adding/editing content:**
  - **Draft:** Save for later review (status: draft)
  - **Submit:** Publish directly and go live immediately (status: published)
  - **Cancel:** Discard changes
- View all content of own branch (drafts + published of all teachers)
- Edit/delete any content within own branch
- Can do Teacher's work if needed

**First Login Flow:**
- Same as Teacher (change password, security question setup)
- Profile shows auto-assigned Branch (read-only, set by Admin)

**Restrictions**
- Cannot create semesters, branches, or subjects
- Cannot access other branches
- Cannot modify own branch assignment
- Cannot add/manage HODs

**Separate UI:**
- Enhanced dashboard (Teacher features + management features)
- Content management for entire branch
- Teacher management section (add, view, deactivate teachers)
- No academic structure management (semester/branch/subject CRUD)

---

### 3.4 Admin (Super Admin)
**Permissions**
- **All HOD permissions** (can do everything HOD can do)
- **All Teacher permissions** (can do everything Teacher can do)
- Full system control
- **First:** Create semesters, branches, subjects (Academic Structure)
- **Then:** Add HODs with mobile number + temporary password
- **Then:** Add Teachers with mobile number + temporary password
- Assign branch to HODs (from existing branches)
- Assign HOD, semester, branch, subject to Teachers (from existing data)
- Manage all users across all branches
- **3 buttons when adding/editing content:**
  - **Draft:** Save for later review (status: draft)
  - **Submit:** Publish directly and go live immediately (status: published)
  - **Cancel:** Discard changes
- View/edit/delete any content from any branch (drafts + published)
- View system analytics
- Activate/deactivate any user

**Restrictions**
- None

**Important Workflow:**
- Must create Branch/Semester/Subject BEFORE adding HOD/Teacher
- Cannot assign non-existent academic items to users

**Separate UI:**
- Complete dashboard (all features)
- Academic structure management (semester/branch/subject CRUD)
- User management for all roles (add HOD, add Teacher, assign)
- Content management for all branches
- System analytics and settings

---

## 4. COMPLETE PAGE LIST (SYSTEM WIDE)

### Public Pages
1. Home
2. Academics Explorer
3. Subject Details
4. About Us
5. Contact Us
6. Privacy Policy
7. Terms & Conditions
8. Disclaimer

### Authentication Pages
9. Login (Mobile Number/Email + Password)
10. Student Registration
11. First Login - Change Password & Security Question (for Teachers/HOD)
12. Forgot Password (using Security Question)
13. Teacher/HOD Profile Setup (auto-filled after first login)

### Student Pages
13. Student Dashboard
14. Subject Content View
15. Notices Page
16. Timetable Page

### Teacher Pages
17. Teacher Dashboard
18. Add / Edit Content (3 buttons: Draft, Submit, Cancel)
19. My Drafts (list of saved drafts)
20. My Published Content (list of live content)
21. Content Management (create, edit, delete)

### HOD Pages
22. HOD Dashboard (includes Teacher features + management)
23. Teacher Management (view, add, deactivate)
24. Add Teacher (with mobile + temp password)
25. Branch Content Overview (all drafts + published of branch)
26. Add / Edit Content (3 buttons: Draft, Submit, Cancel)
27. My Drafts
28. My Published Content

### Admin Pages
29. Admin Dashboard (full access)
30. Users & Roles Management
31. Add HOD (with mobile + temp password)
32. Add Teacher (with mobile + temp password)
33. Semester Management (CRUD)
34. Branch Management (CRUD)
35. Subject Management (CRUD)
36. Assign Branch to HOD
37. Assign HOD/Semester/Branch/Subject to Teacher
38. All Content Management (view/edit/delete any content - drafts + published)
39. Add / Edit Content (3 buttons: Draft, Submit, Cancel)
40. System Analytics
41. System Settings

---

## 5. DATABASE DESIGN (DETAILED)

### 5.1 User Collection
- name
- email
- mobile (required for teacher/hod)
- role (student / teacher / hod / admin)
- branch (for HOD/Teacher - assigned by Admin/HOD)
- semester (for Teacher - assigned by Admin/HOD)
- assignedSubjects (array for Teacher - assigned by Admin/HOD)
- assignedHOD (for Teacher - assigned by Admin/HOD)
- status (pending / active / disabled)
- password (hashed)
- tempPassword (for first login - plain text, deleted after first login)
- passwordChangeRequired (boolean - true for first login)
- securityQuestion (for password recovery)
- securityAnswer (hashed)
- caseInsensitiveAnswer (boolean - if true, answer can be any case)
- createdAt
- lastLogin

---

### 5.2 Semester Collection
- semesterNumber
- academicYear
- status

---

### 5.3 Branch Collection
- branchName (IT, CE, ME)
- code
- status

---

### 5.4 Subject Collection
- subjectName
- subjectCode
- semesterId
- branchId
- examType
- marksStructure

---

### 5.5 Content Collection
- contentType (notice / material / syllabus / timetable)
- title
- description
- fileUrl (optional)
- semesterId
- branchId
- subjectId
- createdBy (userId)
- createdByRole (teacher / hod / admin)
- status (draft / published)
  - draft: saved for later review by creator
  - published: live and visible to students
- publishedAt (null if status is draft)
- createdAt
- updatedAt
- title
- type (syllabus / material / notice / assignment)
- subjectId
- createdBy
- status (draft / pending / approved)
- approvedBy
- createdAt

---

## 6. AUTHENTICATION FLOW

### 6.1 Student Registration Flow
Student → Register → Auto Active → Login Allowed

### 6.2 Teacher/HOD Account Creation Flow (by Admin/HOD)
Admin/HOD → Add Teacher/HOD (enter mobile + generate temp password) → Account Created (status: pending_first_login)

### 6.3 Teacher/HOD First Login Flow
1. Enter mobile number + temp password
2. System checks: passwordChangeRequired === true
3. Redirect to "Change Password & Security Setup" page:
   - Enter new password
   - Confirm new password
   - Select security question (dropdown)
   - Enter security answer
   - Checkbox: "Make answer case-insensitive"
4. Submit → Delete tempPassword, set passwordChangeRequired = false
5. Auto-redirect to Profile Form:
   - Enter: name, personal details
   - System auto-fills (read-only):
     * For HOD: Branch (set by Admin)
     * For Teacher: HOD, Semester, Branch, Subjects (set by Admin/HOD)
6. Submit → status changes to "active" → Redirect to Dashboard

### 6.4 Regular Login Flow
- Enter mobile/email + password
- Credentials validated
- JWT issued with role
- Role checked
- Redirect to respective dashboard

### 6.5 Forgot Password Flow
1. Enter mobile/email
2. System shows security question
3. Enter answer (case-insensitive if user chose that option during setup)
4. Answer verified → Allow password reset
5. Enter new password → Update password

---

## 7. ADMIN WORKFLOW (STEP BY STEP)

### 7.1 Initial Setup (IMPORTANT: Follow this sequence)

**STEP 1: Academic Structure Setup (Must be done FIRST)**
1. Create Semesters (e.g., Semester 1, Semester 2, Semester 3...)
2. Create Branches (e.g., IT, CE, ME)
3. Create Subjects:
   - Enter subject name & code
   - Assign to specific semester
   - Assign to specific branch
   - Save

**STEP 2: User Creation (Only AFTER academic structure exists)**
4. Add HOD:
   - Enter mobile number
   - Generate temporary password
   - Select & assign branch (from existing branches)
   - Save → HOD gets temp credentials (via email/SMS/display once)
5. Add Teachers (can also be done by HOD):
   - Enter mobile number
   - Generate temporary password
   - Select & assign HOD (from existing HODs)
   - Select & assign semester (from existing semesters)
   - Select & assign branch (from existing branches)
   - Select & assign subjects (multiple selection from existing subjects of that semester+branch)
   - Save → Teacher gets temp credentials

**Note:** Cannot add HOD/Teacher without first creating Branch, Semester, Subject

### 7.2 HOD Workflow (Similar to Admin for Teachers)
1. Add Teacher:
   - Enter mobile number
   - Generate temporary password
   - Assign semester (within HOD's branch)
   - Assign subjects
   - Save → Teacher gets temp credentials
2. Manage Teachers (view, deactivate)
3. Create/publish content for branch (can do Teacher's work)
4. View/manage all branch content

### 7.3 Daily Tasks (Admin)
- Review HOD/Teacher accounts
- Monitor system analytics
- Manage content if needed
- Manage users (activate/deactivate)

---

## 8. SECURITY QUESTIONS (PRE-DEFINED LIST)

Teacher/HOD will select one during first login:
1. What is your mother's maiden name?
2. What was the name of your first pet?
3. What city were you born in?
4. What is your favorite color?
5. What was the name of your elementary school?
6. What is your favorite food?
7. What is your father's middle name?

**Case-Insensitive Option:**
- If user ticks "Make answer case-insensitive" checkbox:
  - Answer stored as lowercase hash
  - During forgot password: user enters "YELLOW" → converted to "yellow" → matched
  - If unticked: exact case match required

---

## 9. CONTENT MANAGEMENT WORKFLOW (NO APPROVAL SYSTEM)

**Adding/Editing Content - 3 Button Options:**
1. **Draft Button:**
   - Saves content with status: "draft"
   - Content NOT visible to students
   - Can review and edit later
   - Personal workspace for creator

2. **Submit Button:**
   - Saves content with status: "published"
   - Content goes LIVE immediately
   - Visible to students instantly
   - No approval needed from anyone

3. **Cancel Button:**
   - Discards all changes
   - Returns to previous page

**Teacher Workflow:**
Teacher → Create Content → Click "Draft" (save for later) OR "Submit" (live immediately)

**HOD Workflow:**
- Can create/edit/delete content for entire branch
- Can view all drafts + published content of own branch teachers
- Can click "Draft" or "Submit" - same options as Teacher

**Admin Workflow:**
- Can create/edit/delete content for any branch
- Can view all drafts + published content across system
- Can click "Draft" or "Submit" - same options as Teacher

**Important:** Draft is for personal review only, NOT for approval. Submit = instant publish.

---

## 10. UI STRUCTURE RULES

### 10.1 Admin Panel (Complete UI)
- Left Sidebar with all menu items:
  - Dashboard
  - Academic Management (Semester/Branch/Subject)
  - User Management (Add HOD/Teacher, Assignments)
  - Content Management (all branches)
  - System Analytics
  - Settings
- Fixed navigation
- Full access to everything

### 10.2 HOD Panel (Enhanced UI)
- Left Sidebar with limited menu items:
  - Dashboard
  - Teacher Management (Add/View/Deactivate)
  - Content Management (own branch only)
  - My Profile
- Can do all Teacher work
- Cannot access Academic Management (Semester/Branch/Subject)
- Cannot access other branches

### 10.3 Teacher Panel (Simple UI)
- Left Sidebar with basic menu items:
  - Dashboard
  - Add Content (form with 3 buttons: Draft, Submit, Cancel)
  - My Drafts (list of saved drafts, can edit/delete/submit)
  - My Published Content (list of live content, can edit/delete)
  - My Profile
- Cannot access user management
- Cannot access academic management
- Only assigned subject content visible

### 10.4 Student UI
- Clean
- Read-only
- Mobile-first
- No login required for viewing public content

---

## 11. SECURITY RULES

- Passwords never visible (hashed with bcrypt)
- Temp passwords deleted after first successful login
- Security answers hashed (with optional case-insensitive comparison)
- No role escalation (middleware checks)
- JWT expiry handling (15 min access token, refresh token pattern optional)
- Protected APIs (role-based middleware)
- Auto-assigned profile fields cannot be modified by user (frontend disabled + backend validation)

---

## 11. DEVELOPMENT PHASE BREAKDOWN

### Phase 1
Authentication & User Roles
- Student registration + auto-active
- Admin login (pre-seeded in DB)
- JWT token generation
- Role-based middleware
- **NEW:** Admin Add HOD (mobile + temp password)
- **NEW:** Admin Add Teacher (mobile + temp password + assignments)
- **NEW:** First Login Flow (password change + security question)
- **NEW:** Profile Form (auto-filled + read-only fields)
- **NEW:** Forgot Password (using security question)

### Phase 2
Admin Core Setup (Academic Structure FIRST, then Users)
- **Step A: Academic Structure (do this first)**
  - Semester CRUD (Create, Read, Update, Delete)
  - Branch CRUD
  - Subject CRUD (with semester + branch assignment)
- **Step B: User Management (depends on Step A)**
  - Add HOD page (select from existing branches)
  - Add Teacher page (select from existing HOD/semester/branch/subjects)
  - Assign Branch to HOD
  - Assign HOD/Semester/Branch/Subject to Teacher
  - HOD can add Teachers (similar to Admin, but within HOD's branch only)

### Phase 3
Academic Explorer

### Phase 4
Content Management

### Phase 5
Approval System

### Phase 6
UI & UX Polish

### Phase 7
Testing & Submission

---

## 12. FINAL SUBMISSION REQUIREMENTS

- GitHub Repository
- SRS Document
- PPT Presentation
- Live Demo
- Database Design
- Flowcharts

---

## 13. FINAL NOTE

This project follows **real software engineering principles**.
If implemented fully, it can be scaled into a production system.

---
END OF DOCUMENT

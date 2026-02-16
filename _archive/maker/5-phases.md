# 📋 PHASE BREAKDOWN - DETAILED DEVELOPMENT PLAN

This file breaks down the project into **detailed phases and tasks**.  
Follow this to organize development work properly.

---

## 🎯 PROJECT PHASES OVERVIEW

```
Phase 1: Authentication (Login/Register/Forgot Password)
Phase 2: Admin Panel (Manage Semesters, Branches, Subjects)
Phase 3: Student Dashboard (View Subjects, Download Materials)
Phase 4: Notices & Assignments (Post & View)
Phase 5: Testing & Deployment
```

---

## ✅ PHASE 1: AUTHENTICATION & LOGIN SYSTEM

**Duration:** 2-3 days  
**Modules:** Authentication, Login, Register, Forgot Password  
**Who needs:** Both Admin and Student

### Part 1.1: Admin Login Page
- Create login form (username/password)
- Connect to backend API
- Store token in browser (localStorage)
- Redirect after login

### Part 1.2: Admin Register (Optional)
- Create admin user manually in database
- Or create register form for admin

### Part 1.3: Student Login Page
- Same as admin login but for students
- Different UI/flow if needed

### Part 1.4: Forgot Password (Optional for Phase 1)
- Send reset link via email
- Or simple password reset form
- Can skip in Phase 1, add in Phase 2

### Part 1.5: Logout
- Clear token from browser
- Redirect to login page

---

## ✅ PHASE 2: ADMIN PANEL - DATA MANAGEMENT

**Duration:** 3-4 days  
**Modules:** Semester, Branch, Subject, Subject Details  
**Who needs:** Admin only

### Part 2.1: Semester Management
**What admin can do:**
- View all semesters (Sem 1, 2, 3... 8)
- Add new semester
- Edit semester
- Delete semester

**Backend API needed:**
```
POST /api/semesters          (create)
GET /api/semesters           (read all)
GET /api/semesters/:id       (read one)
PUT /api/semesters/:id       (update)
DELETE /api/semesters/:id    (delete)
```

### Part 2.2: Branch Management
**What admin can do:**
- View all branches (IT, CE, ME)
- Add new branch (select semester first)
- Edit branch
- Delete branch

**Backend API needed:**
```
POST /api/branches           (create)
GET /api/branches            (read all)
GET /api/branches/:id        (read one)
PUT /api/branches/:id        (update)
DELETE /api/branches/:id     (delete)
GET /api/branches?semesterId=X  (filter by semester)
```

### Part 2.3: Subject Management
**What admin can do:**
- View all subjects
- Add new subject (select branch first)
- Edit subject
- Delete subject

**Backend API needed:**
```
POST /api/subjects           (create)
GET /api/subjects            (read all)
GET /api/subjects/:id        (read one)
PUT /api/subjects/:id        (update)
DELETE /api/subjects/:id     (delete)
GET /api/subjects?branchId=X (filter by branch)
```

### Part 2.4: Subject Details (Marks, Exam Type)
**What admin can do:**
- Add marks distribution (theory, practical, internal, external)
- Set exam type (theory, practical, etc.)
- Set passing marks
- Set total marks

**Backend API needed:**
```
POST /api/subjects/:id/details    (create/update)
GET /api/subjects/:id/details     (read)
```

---

## ✅ PHASE 3: STUDENT DASHBOARD - VIEW DATA

**Duration:** 2-3 days  
**Modules:** Student Dashboard, Subject View, Materials Download  
**Who needs:** Student only

### Part 3.1: Student Dashboard
**What student sees:**
- Welcome message
- Select semester dropdown
- Select branch dropdown
- Display subjects for selected semester & branch

**Frontend:**
- Dropdowns for semester & branch
- Auto-load subjects when both selected

**Backend API:**
```
GET /api/students/dashboard
GET /api/semesters              (dropdown list)
GET /api/branches?semesterId=X  (filtered dropdown)
GET /api/subjects?branchId=X    (filtered list)
```

### Part 3.2: Subject Details View
**What student sees:**
- Subject name & code
- Subject details (marks, exam type, etc.)
- Study materials (PDFs, notes)
- Download button for each material

**Backend API:**
```
GET /api/subjects/:id
GET /api/subjects/:id/details
GET /api/subjects/:id/materials
```

### Part 3.3: Download Center
**What student can do:**
- View all materials for each subject
- Download PDFs/notes
- Filter by subject

**Backend API:**
```
GET /api/materials?subjectId=X
GET /api/materials/:id/download
```

---

## ✅ PHASE 4: NOTICES & ASSIGNMENTS

**Duration:** 2-3 days  
**Modules:** Notices, Assignments, Deadline Management  
**Who needs:** Admin (post), Student (view)

### Part 4.1: Admin - Post Notices
**What admin can do:**
- Write notice title & content
- Select semester & branch (who can see)
- Set deadline (optional)
- Post notice

**Backend API:**
```
POST /api/notices             (create)
GET /api/notices              (read all)
PUT /api/notices/:id          (update)
DELETE /api/notices/:id       (delete)
```

### Part 4.2: Admin - Post Assignments
**What admin can do:**
- Write assignment title & description
- Select semester & branch (who can see)
- Set deadline (required)
- Upload assignment file
- Post assignment

**Backend API:**
```
POST /api/assignments         (create)
GET /api/assignments          (read all)
PUT /api/assignments/:id      (update)
DELETE /api/assignments/:id   (delete)
```

### Part 4.3: Student - View Notices
**What student sees:**
- Only notices for their semester & branch
- Notice title, content, date posted
- Filter by subject (if needed)

**Backend API:**
```
GET /api/notices?semesterId=X&branchId=Y
GET /api/notices/:id
```

### Part 4.4: Student - View Assignments
**What student sees:**
- Only assignments for their semester & branch
- Assignment title, description, deadline
- Download assignment file
- Show "Due soon" if deadline < 3 days

**Backend API:**
```
GET /api/assignments?semesterId=X&branchId=Y
GET /api/assignments/:id
```

### Part 4.5: Contact Message System (Student & Admin)
**What student can do (Contact Page):**
- Fill in contact form with name, email, inquiry type, message
- Submit message (requires login)
- If not logged in: show "Please login to send message" alert
- If logged in: submit message to admin
- View sent messages in message history section
- See message status (Pending/Replied)
- View admin replies below each message

**What admin can do (Admin Panel - Messages):**
- View inbox with all incoming messages
- See sender name, email, date, inquiry type
- Click to view full message content
- Reply to message with response
- Mark message as resolved
- Delete message
- Filter messages by status (pending/replied)

**Frontend Components:**
- Contact form (name, email, inquiry type dropdown, message textarea)
- Login check before submit
- Messages history section (shows all user's sent messages)
- Admin message inbox (table/list view)
- Admin reply modal/form
- Status badge (Pending/Replied) on each message

**Database Schema:**
```
Messages Collection:
- _id (ObjectId)
- userId (ref: Users)
- senderName (string)
- senderEmail (string)
- inquiryType (enum: Academic, Technical, General, Feedback)
- message (string)
- status (enum: Pending, Replied, Resolved)
- createdAt (timestamp)
- updatedAt (timestamp)

Replies Collection:
- _id (ObjectId)
- messageId (ref: Messages)
- adminId (ref: Admin User)
- replyText (string)
- repliedAt (timestamp)
```

**Backend API needed:**
```
POST /api/messages                (user sends message - requires login)
GET /api/messages                 (user views their own messages)
GET /api/messages/:id             (view single message with replies)

Admin APIs:
GET /api/admin/messages           (view all messages - admin only)
GET /api/admin/messages?status=pending  (filter by status)
GET /api/admin/messages/:id       (view message details)
POST /api/admin/messages/:id/reply    (admin replies to message)
PUT /api/admin/messages/:id       (update message status)
DELETE /api/admin/messages/:id    (delete message)
```

**User Flow:**
1. User visits Contact page
2. Fills form with name, email, inquiry type, message
3. Clicks "Send Message"
4. If not logged in → Alert: "Please login to send your message"
5. If logged in → Message saved to DB, show success message
6. Below form, show "My Messages" section with all sent messages
7. Each message shows: inquiry type, date sent, status badge (Pending/Replied)
8. Click on message to see replies from admin below it
9. Admin logs into Admin Panel → goes to Messages section
10. Admin sees inbox with all messages, newest first
11. Admin clicks on message → sees full content + reply form
12. Admin types reply and clicks "Send Reply"
13. Reply is saved and linked to original message
14. User can immediately see reply in their message history (status changes to "Replied")

---

## ✅ PHASE 5: UPLOAD & MATERIALS MANAGEMENT

**Duration:** 2 days  
**Modules:** File Upload, Study Materials  
**Who needs:** Admin (upload), Student (download)

### Part 5.1: Admin - Upload Study Materials
**What admin can do:**
- Select subject
- Upload PDF/notes
- Add material name & description
- Upload material

**Backend API:**
```
POST /api/subjects/:id/materials    (upload)
GET /api/materials                  (list all)
DELETE /api/materials/:id           (delete)
```

### Part 5.2: Student - Download Materials
**What student can do:**
- View all materials for each subject
- Download PDF/notes
- View file size & upload date

---

## ✅ PHASE 6: TESTING & FINAL TOUCHES

**Duration:** 2-3 days

### Part 6.1: Testing
- Test all login scenarios
- Test admin operations (CRUD for all modules)
- Test student view (permissions, filtering)
- Test file upload & download
- Test deadline calculations

### Part 6.2: Error Handling
- Handle network errors gracefully
- Show proper error messages
- Validate form inputs
- Prevent unauthorized access

### Part 6.3: UI/UX Improvements
- Add loading spinners
- Add success messages
- Improve styling
- Mobile responsiveness (optional)

---

## 📊 DEVELOPMENT ORDER (RECOMMENDED)

```
1. Phase 1: Auth (Login/Register)
   ↓
2. Phase 2: Admin Panel (Data Management)
   ↓
3. Phase 3: Student Dashboard (View Data)
   ↓
4. Phase 4: Notices & Assignments
   ↓
5. Phase 5: Materials Upload & Download
   ↓
6. Phase 6: Testing & Polish
```

---

## 🎯 QUICK PHASE 1 CHECKLIST (FIRST TO COMPLETE)

- [ ] Admin Login UI (form, buttons, styling)
- [ ] Admin Login API (backend endpoint)
- [ ] Login validation (check username/password)
- [ ] Store token in localStorage
- [ ] Redirect after successful login
- [ ] Student Login UI
- [ ] Student Login API
- [ ] Logout functionality
- [ ] Protected routes (redirect to login if no token)
- [ ] Test login with sample data

---

## 📝 HOW TO PROCEED

1. **Read this file** - understand the breakdown
2. **Start Phase 1** - complete auth first
3. **Test Phase 1** - make sure login works
4. **Move to Phase 2** - admin panel
5. **Keep this file open** - reference while developing

---

## 🔗 DEPENDENCIES

- Phase 1 → Phase 2 (need login first)
- Phase 2 → Phase 3 (need data in db)
- Phase 3 → Phase 4 (need subjects first)
- Phase 4 → Phase 5 (materials need assignment context)

**Can't skip phases!** Must complete in order.

---

## 💡 TIPS

1. **Divide work:** Each phase can be 1-2 person working
2. **Test frequently:** Don't wait until end to test
3. **Keep API docs:** Write API endpoints as you create them
4. **Commit regularly:** Git commit after each phase
5. **Use this as reference:** When confused about what's next

---

**Start with Phase 1 - Authentication! 🚀**

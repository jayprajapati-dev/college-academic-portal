# Manual QA Master Checklist (Start to End)

Last Updated: March 7, 2026  
Prepared For: Full manual verification before demo/release  
Execution Type: End-to-end sequential runbook

---

## 0. Objective

This file gives a complete manual testing path from start to end.

Use this when you want to verify:
- all role flows
- all major modules one by one
- key UI behavior (desktop + mobile)
- permissions and negative cases

---

## 1. Test Environment and Accounts

## 1.1 Devices and Browsers

- [ ] Desktop: 1366x768 or above
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x812
- [ ] Chrome latest
- [ ] Edge latest

## 1.2 Backend and Frontend Startup

1. Start backend from `server`.
2. Start frontend from `client`.
3. Open `http://localhost:3000`.

Expected:
- [ ] Backend starts without crash
- [ ] Frontend starts without crash
- [ ] Login page opens
- [ ] No blocking red error in console

## 1.3 Mandatory Test Accounts

- [ ] Admin user
- [ ] HOD user
- [ ] Teacher user
- [ ] Student user
- [ ] Coordinator user
- [ ] Multi-mode user (example: admin + teacher + coordinator)

## 1.4 Mandatory Data Setup

- [ ] At least 1 branch exists
- [ ] At least 2 semesters exist
- [ ] At least 2 subjects exist
- [ ] Teacher has assigned subject
- [ ] HOD has branch mapping
- [ ] Coordinator has active coordinator assignment (branch + semesters + validity)

---

## 2. Master Execution Order (Do Not Skip)

Run in this order:

1. Public Pages and Navigation
2. Authentication and Session
3. Admin Core Modules
4. HOD Core Modules
5. Teacher Core Modules
6. Coordinator Core Modules
7. Student Core Modules
8. Cross-role Mode Switch Validation
9. UI and Responsive Validation
10. Security and Negative Tests
11. Final Regression Pack
12. Sign-off

---

## 3. Public Pages and Navigation (No Login)

## 3.1 Public Route Checks

Visit each route:
- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/about`
- `/contact`
- `/faq`
- `/privacy`
- `/terms`
- `/disclaimer`
- `/notices`

Expected:
- [ ] All pages load without crash
- [ ] Header and footer render correctly
- [ ] No broken links
- [ ] No overlapping text/buttons on mobile

## 3.2 Subject Public Flow

1. Open any subject from landing explorer.
2. Open subject hub page.
3. Open public materials/projects links.

Expected:
- [ ] Subject detail loads
- [ ] Marks/type info visible
- [ ] Public materials list visible
- [ ] Project section navigation works

---

## 4. Authentication and Session

## 4.1 Login (Identifier Variants)

For each role account, test login via:
- email
- mobile
- enrollment number (student)

Expected:
- [ ] Valid credentials login success
- [ ] Invalid credentials show proper message
- [ ] Disabled user blocked with proper message

## 4.2 Role Redirect (Critical)

After login, verify redirect:
- Admin -> `/admin/dashboard`
- HOD -> `/hod/dashboard`
- Teacher -> `/teacher/dashboard`
- Student -> `/student/dashboard`
- Coordinator -> `/coordinator/dashboard`

Expected:
- [ ] Correct dashboard route for each role

## 4.3 First Login + Password Setup

1. Use first-login required user.
2. Verify redirect to first-login flow.
3. Change password.

Expected:
- [ ] Password setup page appears
- [ ] Validation messages appear for weak passwords
- [ ] Successful completion updates access

## 4.4 Forgot Password

1. Open forgot password page.
2. Submit identifier.
3. Answer security question.
4. Reset password.

Expected:
- [ ] Security question fetched
- [ ] Wrong answer blocked
- [ ] Correct answer allows reset

## 4.5 Logout + Session Expiry

Expected:
- [ ] Logout clears session and returns to login
- [ ] Protected URLs force login after logout
- [ ] Expired/invalid token produces unauthorized behavior

---

## 5. Admin Full Manual Flow

Login as Admin and execute in this order.

## 5.1 Admin Dashboard

- [ ] Dashboard opens
- [ ] Stats cards load
- [ ] No empty/NaN counters

UI checks:
- [ ] Header title and panel label match
- [ ] Sidebar icons + labels aligned

## 5.2 User Management (`/admin/users`)

1. Open users list.
2. Search by name/email.
3. Filter by role.
4. Open user detail modal.
5. Toggle student block/unblock.
6. Toggle admin access for teacher/hod.
7. Edit role where allowed.

Expected:
- [ ] List loads
- [ ] Search/filter works
- [ ] Actions persist after refresh
- [ ] Success/error feedback visible

UI checks:
- [ ] Table responsive on mobile with scroll
- [ ] Action buttons not hidden

## 5.3 Coordinator Assignment Flow

1. Open coordinator assignment modal for teacher user.
2. Select branch.
3. Select semesters.
4. Set academic year and validity dates.
5. Save.
6. Reopen and verify values.
7. Revoke coordinator.

Expected:
- [ ] Assignment saves correctly
- [ ] Coordinator role/scope reflects in user data
- [ ] Revoke works and role behavior updates

## 5.4 Academic Structure Modules

### 5.4.1 Branches (`/admin/branches`)
- [ ] Create branch
- [ ] Edit branch
- [ ] Delete branch (if allowed)

### 5.4.2 Semesters (`/admin/semesters`)
- [ ] Create semester
- [ ] Edit semester
- [ ] Delete semester (if allowed)

### 5.4.3 Subjects (`/admin/subjects`)
- [ ] Create subject
- [ ] Assign teacher(s)
- [ ] Edit subject details
- [ ] Delete subject (if allowed)

### 5.4.4 Academic Structure (`/admin/academic-structure`)
- [ ] Hierarchy loads
- [ ] Branch -> semester -> subject structure visible

## 5.5 Content Modules (Admin View)

### 5.5.1 Notices (`/admin/notices`)
- [ ] Create notice
- [ ] Edit notice
- [ ] Delete notice
- [ ] Target role selection works

### 5.5.2 Materials (`/admin/materials`)
- [ ] Materials list opens
- [ ] Subject-wise filtering works

### 5.5.3 Library (`/admin/library`)
- [ ] Book list opens
- [ ] Create book
- [ ] Edit book
- [ ] Delete book

### 5.5.4 Projects (`/admin/projects`)
- [ ] Project list opens
- [ ] Filter/search works

### 5.5.5 Timetable (`/admin/timetable`)
- [ ] Timetable page loads
- [ ] Create/edit operations work

### 5.5.6 Exams (`/admin/exams`)
- [ ] Schedule list loads
- [ ] Create/edit/delete schedule works

## 5.6 Monitoring Modules

### 5.6.1 Contacts (`/admin/contacts`)
- [ ] Contact messages list loads
- [ ] Reply flow works

### 5.6.2 Activity (`/admin/activity`)
- [ ] Activity log list loads
- [ ] Filters/search (if present) work

---

## 6. HOD Full Manual Flow

Login as HOD and execute in order.

## 6.1 Dashboard and Profile

- [ ] HOD dashboard opens
- [ ] HOD profile page opens and details correct

## 6.2 Teacher Management

### 6.2.1 Add Teacher (`/hod/add-teacher`)
- [ ] Form opens
- [ ] Create teacher works for own branch

### 6.2.2 Manage Teachers (`/hod/manage-teachers`)
- [ ] Teachers list opens
- [ ] Search/filter works

## 6.3 HOD User Management Scope (`/hod/users`)

- [ ] Only allowed users shown
- [ ] Branch-scoped restrictions enforced
- [ ] Coordinator assignment allowed where expected

## 6.4 HOD Academic and Content Modules

- [ ] `/hod/subjects` loads
- [ ] `/hod/academic-structure` loads
- [ ] `/hod/materials` loads
- [ ] `/hod/notices` CRUD works
- [ ] `/hod/tasks` CRUD works
- [ ] `/hod/tasks/:taskId/submissions` opens
- [ ] `/hod/library` CRUD works
- [ ] `/hod/projects` CRUD works
- [ ] `/hod/timetable` loads
- [ ] `/hod/exams` loads
- [ ] `/hod/reports` loads

Expected:
- [ ] HOD cannot access admin-only destructive actions

---

## 7. Teacher Full Manual Flow

Login as Teacher and execute in order.

## 7.1 Dashboard and Profile

- [ ] `/teacher/dashboard` loads
- [ ] `/teacher/profile` loads

## 7.2 Teacher Scope User Management (`/teacher/users`)

- [ ] User list opens for allowed scope
- [ ] No unauthorized action exposed

## 7.3 Teacher Academic/Content Modules

- [ ] `/teacher/subjects` loads
- [ ] `/teacher/academic-structure` loads
- [ ] `/teacher/materials` loads
- [ ] `/teacher/notices` CRUD works (within scope)
- [ ] `/teacher/tasks` create/edit/delete works
- [ ] `/teacher/tasks/:taskId/submissions` status update works
- [ ] `/teacher/library` opens without 403
- [ ] `/teacher/projects` CRUD works
- [ ] `/teacher/timetable` loads
- [ ] `/teacher/exams` loads

UI checks:
- [ ] Pagination works in tables
- [ ] Search/filter not breaking layout on mobile

---

## 8. Coordinator Full Manual Flow

Login as Coordinator and execute in order.

## 8.1 Core Landing and Profile

- [ ] Redirect to `/coordinator/dashboard`
- [ ] `/coordinator/profile` opens
- [ ] Panel label shows coordinator where expected

## 8.2 Coordinator Module Access

- [ ] `/coordinator/users` opens
- [ ] `/coordinator/notices` opens
- [ ] `/coordinator/tasks` opens
- [ ] `/coordinator/tasks/:taskId/submissions` opens
- [ ] `/coordinator/projects` opens
- [ ] `/coordinator/activity` opens

## 8.3 Coordinator Scope Validation

- [ ] Data limited to assigned branch/semesters
- [ ] No cross-branch unauthorized access

## 8.4 Coordinator + Library/Subjects Practical Check

For users in coordinator mode with content permissions:
- [ ] Library books fetch does not return 403 unexpectedly
- [ ] Subject list reflects coordinator scoped subjects

---

## 9. Student Full Manual Flow

Login as Student and execute in order.

## 9.1 Student Dashboard + Profile

- [ ] `/student/dashboard` loads
- [ ] `/student/profile` loads
- [ ] Branch and semester shown correctly

## 9.2 Student Learning Flow

- [ ] `/student/subjects` loads
- [ ] open subject hub (`/subjects/:id`)
- [ ] open public materials (`/subjects/:id/materials`)
- [ ] open tasks list (`/subjects/:subjectId/tasks`)
- [ ] open task details (`/student/tasks/:taskId`)
- [ ] submit task response

## 9.3 Student Utility Modules

- [ ] `/student/library` loads
- [ ] `/student/timetable` loads
- [ ] `/student/exams` loads
- [ ] notice board visibility correct

## 9.4 Notifications

- [ ] Notification bell visible (student)
- [ ] Notifications list opens
- [ ] Action URL click navigates correctly
- [ ] Mark read behavior works

---

## 10. Cross-Mode and Multi-Role Switch Validation

Use a user with multiple modes.

## 10.1 Desktop Header Mode Tabs

- [ ] All available modes shown
- [ ] Active mode highlighted
- [ ] Click mode -> corresponding dashboard opens

## 10.2 Mobile Header Mode Switch

- [ ] Mode chips visible on mobile
- [ ] Chips tappable
- [ ] Horizontal scroll works when many modes
- [ ] Active mode chip styling visible
- [ ] Content not overlapping below header

## 10.3 Deep Page Switching

From non-dashboard pages, verify mode switching still routes correctly:
- [ ] User Management page
- [ ] Notices page
- [ ] Tasks page
- [ ] Library page

---

## 11. Module-Wise UI Acceptance (All Features)

For each module page below, verify every point.

Modules:
- Dashboard
- Users
- Branches
- Semesters
- Subjects
- Academic Structure
- Notices
- Tasks
- Task Submissions
- Projects
- Materials
- Library
- Timetable
- Exams
- Contacts
- Activity Log
- Profile

UI checklist:
- [ ] Header title and breadcrumbs/context are clear
- [ ] Primary CTA button is visible
- [ ] Empty state message appears when no data
- [ ] Loading state appears during fetch
- [ ] Error state message appears on failure
- [ ] Success toast/alert appears after save/update/delete
- [ ] Table columns aligned
- [ ] Pagination controls work
- [ ] Form validation messages visible
- [ ] Modal opens/closes without overlay bug
- [ ] No clipped dropdowns
- [ ] No console errors on normal actions

---

## 12. Security and Negative Cases

## 12.1 Unauthorized Route Access

Try direct URL tampering:
- student -> `/admin/users`
- teacher -> `/admin/branches`
- student -> `/teacher/tasks`

Expected:
- [ ] Unauthorized route blocked (redirect/403)

## 12.2 Unauthorized API Action

Expected:
- [ ] Student cannot create notice
- [ ] Student cannot create task
- [ ] Student cannot create library entry
- [ ] Non-admin cannot perform admin-only destructive ops

## 12.3 Session and Token

- [ ] Missing token returns unauthorized
- [ ] Invalid token returns unauthorized
- [ ] Logout invalidates protected access

---

## 13. Performance and Stability Spot Checks

- [ ] No continuous re-render/flickering
- [ ] No duplicate API flood on page load
- [ ] Large tables remain usable
- [ ] Search/filter response acceptable (<2-3 sec locally)

---

## 14. Mobile-First Full Pass (Mandatory)

Run complete quick pass at 375px for each role:

Admin:
- [ ] Dashboard
- [ ] Users
- [ ] Notices
- [ ] Library

HOD:
- [ ] Dashboard
- [ ] Tasks
- [ ] Reports

Teacher:
- [ ] Dashboard
- [ ] Tasks
- [ ] Library

Coordinator:
- [ ] Dashboard
- [ ] Users
- [ ] Notices

Student:
- [ ] Dashboard
- [ ] Subjects
- [ ] Task detail
- [ ] Library

Common mobile UI checks:
- [ ] Sidebar toggle works
- [ ] Header mode switch chips visible where applicable
- [ ] Forms and modals fit viewport
- [ ] Tables horizontally scrollable

---

## 15. Final Regression Pack (High Priority Short Run)

Run before demo in exact order:

1. Login all roles once
2. Verify correct dashboard redirect for all
3. Admin user action (block/unblock)
4. Admin coordinator assign/revoke
5. HOD create notice
6. Teacher create task and open submissions
7. Teacher library open (no 403)
8. Coordinator users + notices open
9. Student task submit flow
10. Multi-mode switch desktop + mobile
11. Logout + protected route check

Expected:
- [ ] Zero blocker
- [ ] No auth regression

---

## 16. Defect Report Format

Use this for every issue:

```text
ID:
Title:
Role:
Module:
Route:
Device/Viewport:
Precondition:
Steps:
Expected:
Actual:
Console/API Error:
Screenshot/Video:
Severity: Blocker | High | Medium | Low
Status: Open | In Progress | Fixed | Retest | Closed
```

---

## 17. Final Sign-Off Sheet

Release Candidate:  
Build Version/Commit:  
Date:  
Tester Name:

Totals:
- Total checks executed:
- Passed:
- Failed:
- Blocked:

Open blockers:
1.
2.
3.

Decision:
- [ ] GO
- [ ] NO-GO

Comments:

---

## 18. Execution Notes

- If dashboard redirect is wrong, validate `/api/auth/login` response role and `/api/profile/me` role.
- If 403 appears unexpectedly, verify role + scope + mode and coordinator validity dates.
- For multi-mode accounts, always test both desktop and mobile switching.
- Re-test after every major fix using Section 15 regression pack.

---

## 19. Stitch Prompt Pack (Copy and Use)

Use these prompts directly in Stitch. These are written to keep your existing naming and navigation intact.

## 19.1 Website Prompt (Desktop-First)

```text
Create UI for Website

Redesign the Student Dashboard for a College Academic Portal with a premium, modern, professional, and unique visual style. Focus on a strong desktop experience first.

Critical constraints (must follow):
1. Keep existing header and sidebar structure unchanged.
2. Keep existing brand/app name in header exactly: SmartAcademics.
3. Keep existing panel text exactly: Student Panel.
4. Keep existing sidebar menu labels exactly as below:
	- Dashboard
	- Subjects
	- Library
	- Notice Board
	- Exams
	- Timetable
	- Profile
5. Keep existing route intent/pages unchanged:
	- /student/dashboard
	- /student/subjects
	- /student/library
	- /notices
	- /student/exams
	- /student/timetable
	- /student/profile
6. Redesign only visual system and UX quality; do not change core navigation architecture.

Design goals:
- Premium education SaaS feel, demo-impressive and faculty-friendly.
- Easy for students to understand in seconds.
- Strong visual hierarchy, professional typography, elegant spacing.
- Attractive but not noisy.
- Light-theme first with excellent contrast.

Desktop dashboard composition:
- Hero welcome section with student name + branch + semester.
- KPI cards: My Subjects, Pending Tasks, Upcoming Exams, Unread Notices.
- Main grid:
  - Left: task/deadline timeline
  - Center: important notices feed
  - Right: quick actions (Subjects, Library, Timetable, Exams, Profile)
- Bottom: subject overview cards + recent activity strip.

UI/UX quality requirements:
- Keep components consistent across cards, chips, badges, and buttons.
- Clear primary/secondary CTA styling.
- Strong empty states and loading skeletons.
- Smooth micro-interactions (hover elevation, subtle transitions, active states).
- No clutter; maintain clean alignment and spacing rhythm.

Output expectation:
- A high-fidelity desktop-ready Student Dashboard concept preserving current header/sidebar labels and page architecture.
```

## 19.2 App Prompt (Mobile-First)

```text
Create UI for App

Design a mobile-first Student Dashboard app UI for the same College Academic Portal. The UI must feel premium, clear, student-friendly, and modern.

Critical constraints (must follow):
1. Keep existing naming exactly in UI system:
	- Header/brand name: SmartAcademics
	- Panel identity: Student Panel
2. Keep same module/page ecosystem and navigation intent.
3. Keep same menu meaning from website:
	- Dashboard
	- Subjects
	- Library
	- Notice Board
	- Exams
	- Timetable
	- Profile
4. Do not redesign into a different product; keep same portal identity.

Mobile goals:
- One-hand friendly layout.
- Fast scan and easy understanding.
- Attractive and premium look for demo impact.
- Distinct visual language, not generic template UI.

Mobile layout structure:
- Top app bar: greeting + avatar + notification icon.
- Compact KPI area (cards or horizontal carousel): Subjects, Pending Tasks, Upcoming Exams, Unread Notices.
- Quick action section in thumb zone.
- Deadline timeline section (Today/This Week).
- Notices preview list with clear priority chips.
- Subject mini-cards with concise metadata.

UX requirements:
- Touch targets >= 44px.
- Strong readability at 375px width.
- No overlap/cutoff for cards, chips, dropdowns.
- Elegant loading, empty, and error states.
- Smooth motion (tap feedback, card lift, transition).

Output expectation:
- A high-fidelity mobile Student Dashboard app concept that keeps existing portal identity and navigation labels while delivering a premium modern experience.
```

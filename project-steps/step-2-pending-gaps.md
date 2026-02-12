# Step 2 - Pending Gaps (Blocking + Important)

This list is from the full code scan and documents. Fix these before final release.

## Blocking Gaps (Must Fix)
- Missing Student layout component used in student pages.
  - Used in [client/src/pages/NoticeBoard.jsx](client/src/pages/NoticeBoard.jsx)
  - Used in [client/src/pages/student/TaskView.jsx](client/src/pages/student/TaskView.jsx)
  - No StudentLayout export in [client/src/components/index.js](client/src/components/index.js)

- Missing routes for student notices and tasks.
  - No route for NoticeBoard in [client/src/App.js](client/src/App.js)
  - No route for StudentTaskView (subject tasks) in [client/src/App.js](client/src/App.js)

- Notification API mismatch.
  - Frontend calls mark-all-read in [client/src/components/NotificationBell.jsx](client/src/components/NotificationBell.jsx)
  - Backend does not implement it in [server/routes/notifications.js](server/routes/notifications.js)

- Notification data mismatch.
  - Task and Notice creation writes Notification model in [server/routes/task.js](server/routes/task.js) and [server/routes/notice.js](server/routes/notice.js)
  - Notification API returns mock data in [server/routes/notifications.js](server/routes/notifications.js)

- HOD task subject metadata endpoint missing.
  - HOD task page calls /api/academic/subjects/hod in [client/src/pages/hod/TaskManagement.jsx](client/src/pages/hod/TaskManagement.jsx)
  - No matching route in [server/routes/academic.js](server/routes/academic.js)

## Important Gaps (Should Fix)
- Student task detail route not present.
  - StudentTaskView navigates to /task/:id in [client/src/pages/student/TaskView.jsx](client/src/pages/student/TaskView.jsx)
  - No route defined in [client/src/App.js](client/src/App.js)

- NoticeBoard attachment name mismatch.
  - Notice creation uses {name, url} in [server/routes/notice.js](server/routes/notice.js)
  - NoticeBoard renders file.originalName in [client/src/pages/NoticeBoard.jsx](client/src/pages/NoticeBoard.jsx)

- Task delete uses fs but fs is not imported.
  - In [server/routes/task.js](server/routes/task.js)

- Task update expects file uploads, but task system uses link attachments.
  - In [server/routes/task.js](server/routes/task.js)

- Student dashboard quick actions not wired.
  - Buttons do not navigate to notices/materials/subjects in [client/src/pages/StudentDashboard.jsx](client/src/pages/StudentDashboard.jsx)

## Documentation Conflicts
- Task/Notice system marked complete in [PHASE_3_COMPLETE.md](PHASE_3_COMPLETE.md) and [docs/PHASE_3_SUMMARY.md](docs/PHASE_3_SUMMARY.md)
- But still marked missing in [COMPREHENSIVE_WEBSITE_ANALYSIS_REPORT.md](COMPREHENSIVE_WEBSITE_ANALYSIS_REPORT.md)

## Optional Gaps (Nice to Have)
- design-system tokens are empty: [design-system](design-system)
- README.md referenced in docs is missing at root

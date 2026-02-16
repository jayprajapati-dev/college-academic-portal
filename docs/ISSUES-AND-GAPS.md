# Issues and Gaps - Smart College Academic Portal

Last Updated: February 14, 2026
Project Status: ~85% complete

## Critical Missing Features

1) Coordinator role system (high priority)
- Assign coordinator to a single branch and multiple semesters.
- Validity window with academicYear, validFrom, validTill, UTC dates.
- Auto-expiry and grace period handling.
- Coordinator-scoped notices, tasks, and attendance.
- Admin APIs to assign and revoke coordinators.

2) Task submission file uploads (high priority)
- Allow students to upload files with submissions (PDF/DOCX/images).
- File size limits and count limits enforced.
- Teacher view/download of submitted files.
- Upload storage (local or cloud) and secure download endpoints.

3) Analytics and reports dashboard (medium-high)
- Attendance trends and defaulters list.
- Task completion stats and overdue counts.
- User distribution by role and branch.
- Export to CSV/PDF for admin/HOD.

4) Advanced search and filters (medium)
- Global search across users, tasks, and notices.
- Role-based filters for User Management.
- Priority/date filters for notices.
- Status/subject filters for tasks.

5) Email notifications (medium)
- Task creation and due reminders.
- Notice publish alerts.
- Password reset and account creation emails.

## Known Issues and Technical Debt

1) Redundant routes and pages
- /hod/add-teacher exists while inline modal is used in RoleManageTeachers.
- Consider removing the route and page once verified.

2) Legacy models and layouts
- server/models/Admin.js is likely unused after User model consolidation.
- AdminLayout.jsx, TeacherLayout.jsx, HodLayout.jsx appear unused; RoleLayout is primary.

3) No student dashboard page
- There is no dedicated student dashboard; students navigate from module pages.
- A basic dashboard would improve UX (not critical).

4) Mobile responsiveness gaps
- Some tables and modals need more mobile testing at 375px width.

5) Notifications are polling-based
- NotificationBell polls every 30 seconds; real-time updates are not implemented.

## Documentation Cleanup Suggestions

The following docs look historical and can be archived after verification:
- docs/roadmap.md (replaced by FINAL-ROADMAP.md)
- docs/STEP-1-COMPLETION-REPORT.md
- docs/PHASE-2-PROGRESS-REPORT.md
- docs/STEP-1-TESTING-GUIDE.md

## Optional Enhancements

- Audit log of admin actions (who changed what, when).
- Rate limiting and input sanitization for security hardening.
- Accessibility pass (ARIA labels, keyboard navigation).

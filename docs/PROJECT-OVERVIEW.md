# Project Overview - Smart College Academic Portal

## Purpose
A centralized academic portal for semester and branch data, subject details, tasks, notices, and attendance.

## Target Users
- Admin: full control over academic structure and system data.
- HOD: branch-scoped management and reporting.
- Teacher: subject-scoped tasks, notices, and attendance.
- Student: view-only access to academic content, tasks, notices, and attendance.

## Core Modules
- Authentication and role-based access
- User management with role scoping
- Academic structure (branches, semesters, subjects)
- Notices with role-based targeting
- Tasks and submissions (text-based)
- Attendance management and views
- Timetable, exams, library, materials
- Notifications

## Architecture
- Frontend: React (client/)
- Backend: Node.js + Express (server/)
- Database: MongoDB

## Key Flows

### Login and role routing
- User logs in with email or mobile and password.
- JWT token is issued and stored client-side.
- Navigation is determined by role and permissions.

### Notice delivery
- Admin can target all or selected roles.
- HOD and Teacher notices are scoped to their branch/subjects.
- Students only see notices targeted to their role and scope.

### Task lifecycle
- Teacher creates task for assigned subjects.
- Students submit text responses.
- Teacher reviews and updates status.
- Reminder scheduler generates notifications before due dates.

### Attendance
- Teacher marks attendance for a subject, date, and session.
- Students can view their attendance summary and history.

## Data Ownership Rules
- Admin: unrestricted data access.
- HOD: branch-scoped access.
- Teacher: subject-scoped access.
- Student: personal and enrolled academic data only.

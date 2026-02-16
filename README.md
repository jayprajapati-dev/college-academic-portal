# Smart College Academic Portal

A centralized academic portal for semester and branch data, subject details, tasks, notices, and attendance. The system supports Admin, HOD, Teacher, and Student roles with role-based access and scoped data.

## Key Features
- Role-based authentication and permissions
- User management for Admin and HOD
- Academic structure management (branches, semesters, subjects)
- Notice board with role targeting
- Teacher-only tasks and student submissions
- Attendance management with Lecture and Lab-Tutorial sessions
- Timetable, exams, library, and materials modules
- Notification center with reminders

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB

## Quick Start
1) Install backend dependencies:
   - cd server
   - npm install
2) Configure server environment in server/.env
3) Start backend:
   - npm run dev
4) Install frontend dependencies:
   - cd ../client
   - npm install
5) Start frontend:
   - npm start

## Documentation
- docs/PROJECT-OVERVIEW.md
- docs/SETUP-GUIDE.md
- docs/API-ENDPOINTS.md
- docs/DATABASE-SCHEMA.md
- docs/CURRENT-FEATURES.md
- docs/ISSUES-AND-GAPS.md
- docs/FINAL-ROADMAP.md
- docs/TESTING-CHECKLIST.md

## Scripts
Backend (server/)
- npm run dev
- npm run start
- npm run seed

Frontend (client/)
- npm start
- npm run build

## Project Status
- Current status: ~85% complete
- See docs/ISSUES-AND-GAPS.md for missing features and known gaps

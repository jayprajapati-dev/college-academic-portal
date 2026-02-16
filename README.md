# Smart College Academic Portal

Smart College Academic Portal is a full-stack academic management system that consolidates subject details, tasks, notices, attendance, timetables, and library resources. It supports Admin, HOD, Teacher, and Student roles with scoped access and consistent workflows.

## Overview
Academic information is often fragmented across notice boards, PDFs, and messages. This project provides a single portal where students and staff can access real-time academic updates, manage tasks, and track attendance in one place.

## Key Capabilities
- Role-based authentication and access control
- Academic structure management: branches, semesters, subjects
- Subject hub with exam type and marks distribution
- Tasks with student submissions and status tracking
- Notice board with role-based targeting
- Attendance marking and student view
- Timetable and library browsing
- Notifications and reminders

## Modules and Screens (What the Website Includes)
- Public landing page with branch/semester/subject explorer
- Authentication: register, login, first-login (staff), password reset
- Admin panel: users, roles, branches, semesters, subjects
- HOD panel: branch-scoped users, notices, tasks, attendance
- Teacher panel: subject tasks, notices, attendance, submissions
- Student hub: subject details, exam type, marks breakdown
- Materials library: notes, papers, and learning resources
- Tasks: assignments list, submission, and status tracking
- Notices: role-targeted announcements
- Attendance: session marking and student view
- Timetable: weekly schedule view
- Library: subject-wise book catalog
- Notifications center: reminders and updates

## Roles
- Admin: system configuration and user management
- HOD: branch-level management and reporting
- Teacher: subject-level tasks, notices, and attendance
- Student: view subjects, tasks, notices, attendance, and materials

## User Journeys
Student:
- Open landing page and browse subjects
- Register and login
- View subject hub (exam type + marks)
- Check tasks, submit work, track status
- Read notices, view attendance, check timetable

Teacher:
- Login and open teacher dashboard
- Create tasks and set due dates
- Post notices to target students
- Mark attendance and review submissions

Admin:
- Login and manage academic structure
- Create users and assign roles
- Monitor system activity and notices

HOD:
- Login and manage branch-scoped users
- Post notices, create tasks, and review attendance

## Feature Matrix (Role vs Capability)
| Capability | Admin | HOD | Teacher | Student |
|------------|-------|-----|---------|---------|
| Manage users and roles | Yes | Limited | No | No |
| Manage branches/semesters/subjects | Yes | Limited | No | No |
| Create tasks | No | Yes | Yes | No |
| Submit tasks | No | No | No | Yes |
| Post notices | Yes | Yes | Yes | No |
| Mark attendance | No | Yes | Yes | No |
| View attendance | Yes | Yes | Yes | Yes |
| View subject hub | Yes | Yes | Yes | Yes |
| View library and materials | Yes | Yes | Yes | Yes |

## Architecture
- Frontend: React with Tailwind CSS
- Backend: Node.js with Express (REST API)
- Database: MongoDB with Mongoose ODM
- Authentication: JWT tokens with role-based authorization

## Data Model Summary
Key collections: users, subjects, tasks, notices, attendance, timetables, librarybooks, notifications, branches, semesters.

Key relationships:
- users -> branches/semesters/subjects
- subjects -> branches/semesters
- tasks -> subjects + recipients
- attendances -> subjects + students

## Project Structure
```
Project/
├── client/                     # React frontend
├── server/                     # Express backend
├── db/                         # Seed scripts
├── docs/                       # Documentation
├── README.md                   # This file
├── QUICK-START.md              # Quick setup
├── SETUP-GUIDE.md              # Detailed setup
├── START-SERVERS.bat           # Windows launcher
└── START-SERVERS.ps1           # PowerShell launcher
```

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

Alternative (Windows):
- START-SERVERS.bat
- START-SERVERS.ps1

## Environment
Create server/.env with:
```
MONGODB_URI=your-mongodb-connection
JWT_SECRET=your-secret
PORT=5000
NODE_ENV=development
```

Optional client/.env:
```
REACT_APP_API_URL=http://localhost:5000
```

## Documentation Index
- docs/01-Submission-Checklist.md
- docs/02-Demo-Guide.md
- docs/03-Project-Status.md
- docs/04-Overview.md
- docs/05-Features.md
- docs/06-API-Reference.md
- docs/07-Database-Schema.md
- docs/09-Testing-Checklist.md
- docs/11-Submission-Files.md
- docs/13-Website-Design-Brief.md
- docs/admin-subject-marks-material-flowchart.png
- docs/student-subject-system-flowchart.png

## Scripts
Backend (server/)
- npm run dev
- npm run start
- npm run seed

Frontend (client/)
- npm start
- npm run build

## Demo Focus
- Subject hub (exam type and marks)
- Task creation and submission
- Notice creation and viewing
- Attendance marking and student view
- Timetable and library

## Project Status
- Current status: ~90% complete
- See docs/03-Project-Status.md for the latest summary

## Testing
- Manual QA checklist: docs/09-Testing-Checklist.md
- Focus areas: login flow, tasks, notices, attendance, subject hub

## API Snapshot
Example request:
```
GET /api/academic/subjects/:id/public
Authorization: Bearer <token>
```

Example response (partial):
```
{
   "success": true,
   "subject": {
      "name": "Database Systems",
      "code": "CS201",
      "type": "theory+practical",
      "marks": {
         "theory": { "internal": 20, "external": 30, "total": 50 },
         "practical": { "internal": 10, "external": 20, "total": 30 },
         "totalMarks": 80,
         "passingMarks": 30
      }
   }
}
```

## Security and Access Control
- JWT token authentication
- Role-based authorization middleware
- Protected routes for admin/hod/teacher actions
- Password hashing and security questions for staff first-login

## Deployment Notes
- Configure server/.env for production
- Build frontend with npm run build
- Use a reverse proxy for production (optional)

## Submission Notes
- Do not include node_modules/ or .env in submissions.
- Use docs/11-Submission-Files.md for a clean submission package.

## Contact
For setup or demo questions, refer to docs/02-Demo-Guide.md and docs/11-Submission-Files.md.

## Closing
This project demonstrates a complete academic portal with clear role separation, consistent workflows, and a clean UI. The documentation set is structured for quick evaluation and demo readiness.

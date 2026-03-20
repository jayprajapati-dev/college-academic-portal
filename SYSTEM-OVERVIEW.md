# Smart College Academic Portal — System Overview

## 1. Project Overview

### Modules
- **Timetable**: Class scheduling, conflict checks, role-based access
- **Rooms**: Room master (currently minimal/empty), used in timetable
- **Subjects**: Subject master, linked to timetable/tasks
- **Tasks**: Assignments, tasks, submissions
- **Users**: Admin, HOD, Teacher, Student, Coordinator
- **Notices, Exams, Library, Projects, Branches, Semesters**: Standard academic modules

### Folder Structure
```
server/
  models/        # Mongoose models (Timetable, Task, Subject, User, ...)
  routes/        # Express routes (timetable.js, task.js, ...)
  ...
client/
  src/
    pages/       # Page-level React components (role/RoleTimetable.jsx, ...)
    components/  # Shared UI components (RoleLayout.jsx, ...)
    hooks/       # Custom hooks (useRoleNav.js, ...)
    ...
```

---

## 2. Timetable Module

### Data Structure (server/models/Timetable.js)
- `semesterId`, `branchId`, `subjectId`, `teacherId`, `roomNo`
- `dayOfWeek`, `startTime`, `endTime`, `duration`, `lectureType`
- `createdBy`, `createdByRole`, `canBeModifiedBy[]`
- `status` (active/cancelled/archived), `notes`, timestamps

### Creation Flow
- **Form-based**: Admin/HOD/Teacher fill a form (semester, branch, subject, teacher, room, day, time, type)
- **Grid-based View**: Weekly table (days × time slots)
- **Conflict Handling**: Backend checks for teacher/room overlap before creation
- **Role Access**:
  - **Admin**: Full access (all branches/semesters)
  - **HOD**: Own branches only
  - **Teacher**: Own assigned classes
  - **Student**: Own branch/semester

---

## 3. Room Module

### Storage
- **Model**: `TimetableRoom.js` (currently empty/minimal)
- **Usage**: Room is a string field in Timetable (`roomNo`)
- **Scope**: No enforced branch/global logic; rooms are global by default
- **Selection**: Room is selected via dropdown/text in timetable form

---

## 4. UI Flow (Timetable)

### Steps
1. **Navigate to Timetable** (sidebar)
2. **Filter** by semester, branch, day, status (admin/HOD)
3. **Create Entry**: Click "+ Create Timetable Entry"
   - Fill form: semester, branch, subject, teacher, room, day, start/end time, type
   - Submit (conflict check runs)
4. **View/Edit/Delete**: Table view with ON/OFF toggle, modify, delete buttons
5. **Download PDF**: Exports current timetable view

### UI Elements
- Filters (dropdowns for semester, branch, day, status)
- Weekly grid (days × time slots)
- Modals for create/edit
- ON/OFF toggle for status
- Branch switcher (HOD)

### Complexities/Confusion
- Many filters and controls in one view
- Room selection is not validated against a master list
- Permission logic (canBeModifiedBy) is non-obvious

---

## 5. API Structure

### Timetable APIs (server/routes/timetable.js)
- `POST /api/timetable/create` — Create timetable entry (conflict check)
- `GET /api/timetable/all` — List all (admin)
- `GET /api/timetable/my-schedule` — List for current user (teacher/student)
- `GET /api/timetable/semester/:semesterId` — By semester
- `GET /api/timetable/subject/:subjectId` — By subject
- `PUT /api/timetable/:id` — Update entry
- `DELETE /api/timetable/:id` — Delete entry
- `POST /api/timetable/:id/grant-permission` — Grant edit access
- `POST /api/timetable/:id/revoke-permission` — Revoke edit access

### Room APIs
- **No dedicated room API** (room is just a string in timetable)

---

## 6. Issues / Limitations

- **UI Complexity**: Many filters, controls, and modals; can be confusing
- **Room Logic**: No real room master; no branch-wise room validation
- **Extra Fields**: Permission logic (canBeModifiedBy) is complex for most use cases
- **Missing Features**: No recurring slots, no batch/group support, no real room conflict resolution, no drag-and-drop/grid editing
- **Student View**: Only basic timetable view; no personalized notifications
- **Real-World Gaps**: No support for holidays, special events, or dynamic changes

---

## 7. Summary: Real-World Readiness

- **Strengths**: Covers basic timetable CRUD, conflict checks, role-based access, and weekly grid view.
- **Weaknesses**: Lacks advanced features (room master, batch, recurring slots, drag-and-drop, real-world exceptions). UI is complex and not fully intuitive. Some modules (Room) are incomplete.
- **Overall**: Usable for demo/academic purposes, but needs further work for real college deployment.

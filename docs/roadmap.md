# Project Roadmap – Phase 2 & Phase 3
## Smart College Academic Portal

---

## PHASE 2 – BLUEPRINT / HALF WORK
(Goal: Show project has started and core system works)

---

### STEP 1: GitHub Repository Setup
- Create GitHub repository
- Push current project folder structure
- Ensure README.md and docs are visible

Purpose:
- Version control
- Proof of continuous development

---

### STEP 2: Frontend Skeleton (React First)
- Initialize React app inside /client folder
- Create basic folder structure:
  - pages/
  - components/
- Create basic pages:
  - Login page
  - Student dashboard (empty layout)
  - Admin dashboard (empty layout)

Purpose:
- Prove React is used
- UI logic planning (not design)

Note:
- No styling needed at this stage

---

### STEP 3: Backend Skeleton (Node + Express)
- Initialize Node project inside /server folder
- Setup Express server
- Create basic folder structure:
  - routes/
  - controllers/
  - models/
- Create test route:
  - GET /api/test → returns success message

Purpose:
- Prove backend server works

---

### STEP 4: Database Setup (MongoDB)
- Setup MongoDB Atlas (cloud)
- Create database
- Create basic collections:
  - users
  - semesters
  - branches
  - subjects
- Add 1–2 sample documents

Purpose:
- Prove database design implementation

---

### STEP 5: Backend + Database Connection
- Connect Express server with MongoDB
- Create one working API:
  - Example: GET /api/subjects
- Fetch real data from MongoDB

Purpose:
- Backend + DB integration proof

---

### STEP 6: One End-to-End Flow (MOST IMPORTANT)
- Call backend API from React
- Display data on UI (simple list)

Example:
- Subjects list fetched from MongoDB
- Shown on Student page

Purpose:
- Show complete working flow

---

## PHASE 3 – FULL DEVELOPMENT
(Goal: Make system fully functional)

---

### STEP 7: UI Design & Enhancement
- Use Stitch or other UI tools for design inspiration
- Convert final UI into React components
- Improve layout and styling

Purpose:
- Better user experience

---

### STEP 8: Full Module Development
- Admin panel (add/edit data)
- Marks system
- Study materials
- Assignments & notices
- Library references
- Timetable

---

### STEP 9: Validation & Security
- Login validation
- Role-based access
- Input checks

---

### STEP 10: Final Testing & Documentation
- Testing all modules
- Update SRS
- Prepare final report, PPT, poster
- Add references

---

## SUMMARY (ONE LINE)
First make the system run,
then make it look good.

# Flowchart Prompts and Guide

Purpose: Use these prompts to generate professional flowcharts for the Smart College Academic Portal. Each prompt targets a specific module or flow. You can use them in any AI diagram tool or Mermaid editor. Keep diagrams simple and clean for presentation.

---

## How to Present Flowcharts to Sir

1) Keep each flowchart focused on one topic.
2) Use clear labels (no slang, no short forms).
3) Use 7 to 12 nodes per chart.
4) For the demo, show 2 or 3 key flowcharts only.
5) Always explain problem -> process -> result.

Recommended set for review:
- System Overview Flow
- Login and First-Login Flow
- Subject Detail (Marks and Exam Type) Flow
- Task Submission Flow
- Attendance Flow

---

## Flowchart Prompts (Copy-Paste)

### Prompt 1: System Overview Flow

Create a flowchart for the Smart College Academic Portal system overview. Show the main actors (Admin, HOD, Teacher, Student), core modules (Subjects, Tasks, Notices, Attendance, Timetable, Library), and database. Show how users log in and reach their role dashboards, then access modules. Use a clean left-to-right layout with 8 to 12 nodes.

---

### Prompt 2: Authentication and First Login Flow

Create a flowchart that shows the login and first-login flow. Steps: User opens portal -> login page -> credential validation -> if first login then password change + security question -> save -> redirect to role dashboard. Show alternate path for invalid credentials with error message. Use diamond decisions for first-login check and credential validation.

---

### Prompt 3: Subject Detail (Marks and Exam Type) Flow

Create a flowchart for the subject detail page with exam type and marks. Steps: Student opens subject page -> frontend calls GET /api/academic/subjects/:id/public -> server validates ID -> database fetch -> response -> UI renders subject code, name, exam type, total marks, theory/practical breakdown. Keep it to 8 to 10 nodes.

---

### Prompt 4: Task Creation and Submission Flow

Create a flowchart for tasks. Steps: Teacher creates task -> system saves task with due date -> student views tasks list -> student submits response/file -> system stores submission -> teacher reviews and updates status -> student sees updated status. Add a decision node for due date passed (on time vs overdue). Use 9 to 12 nodes.

---

### Prompt 5: Notice Publishing Flow

Create a flowchart for notice publishing. Steps: Admin/HOD/Teacher creates notice -> select target roles/branch/semester -> save notice -> notification sent -> students view notice board -> notice archived after expiry. Keep it short and clear with 7 to 10 nodes.

---

### Prompt 6: Attendance Marking Flow

Create a flowchart for attendance. Steps: Teacher selects subject -> selects date and session (lecture/lab) -> loads student list -> marks present/absent -> saves attendance -> student views attendance summary. Use a simple top-to-bottom flow with 7 to 9 nodes.

---

### Prompt 7: Timetable View Flow

Create a flowchart for timetable viewing. Steps: Student opens timetable -> system loads branch/semester -> fetch timetable -> render weekly schedule -> student filters by subject. Keep it to 6 to 8 nodes.

---

### Prompt 8: Library Book Browsing Flow

Create a flowchart for library browsing. Steps: Student opens library -> selects subject -> fetch books -> view book details -> optional search or filter by author. Keep it to 6 to 8 nodes.

---

## Suggested Labels and Styling Notes

- Use standard roles: Admin, HOD, Teacher, Student.
- Use consistent module names: Subjects, Tasks, Notices, Attendance, Timetable, Library.
- Use simple verbs: Login, Validate, Save, Fetch, Render.
- Use decision diamonds for: Valid credentials? First login? Due date passed?

---

## How to Explain Each Flowchart (Short Script)

Use this 2-line format:

1) "This flowchart shows how <module/flow> works end-to-end."
2) "Input comes from <user>, backend validates and saves to database, output is shown in the UI."

Example:
"This flowchart shows how the subject detail page works end-to-end."
"Student opens the page, server fetches marks and exam type, and the UI renders it clearly."

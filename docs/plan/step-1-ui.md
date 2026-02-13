# Step 1 UI Prompt (Role-Based Shared UI)

Use this prompt to generate a premium, unified UI design for Admin/HOD/Teacher with dynamic role-based modules. The final UI must share one shell and one set of pages, with sections appearing or hidden based on role permissions from backend.

---

PROMPT:

Design a premium, professional academic portal UI with a single shared layout for Admin, HOD, and Teacher. The shell (sidebar + top bar + content layout) is the same for all roles, but modules appear or hide based on role permissions. Use bold typography, a modern data-dashboard style, and clean, high-contrast cards. Provide a single design system with consistent spacing, buttons, and table styles.

Core requirements:
- One shared UI shell for Admin/HOD/Teacher.
- Modules are role-based (permissions controlled from backend).
- Each page must look complete and production-ready.
- Use consistent navigation icons and clear labels.
- Keep layout responsive for mobile and desktop.
- Provide clean table patterns, modal patterns, and form patterns.

Pages to design (shared, role-gated):
1) Role Dashboard (shared layout, different data widgets per role)
   - Admin: total users, branches, subjects, system health
   - HOD: branch stats, teachers, students, content
   - Teacher: assigned subjects, drafts/published, tasks
2) Academic Structure (Branch -> Semester -> Subject tree view)
3) Semesters Management (table + add/edit modal)
4) Branches Management (table + add/edit modal)
5) Subjects Management (table + filters + add/edit modal)
6) Subject Details (marks + exam types + syllabus overview)
7) Materials Manager (filters + category chips + upload modal)
8) Timetable Manager (day/subject filters + grid/table view)
9) Library Manager (subject-based library list + add/edit modal)
10) Notices Manager (priority badges + drafts/publish)
11) Tasks/Assignments Manager (status badges + due dates)
12) Attendance Manager (sessions + summary view)
13) Exams Manager (schedule + results)
14) Users Management (roles + status + permissions modal)
15) Profile (role profile + settings)

Design notes:
- Use a confident, premium palette (no default purple).
- Use expressive typography (avoid Inter/Roboto/Arial). Suggested: "Space Grotesk" + "Source Serif" or "Manrope" + "Spectral".
- Include a subtle patterned/gradient background for the main content area.
- Use modern cards with soft shadows, layered sections, and hover states.
- Provide form components with clear validation states.
- Provide empty states and loading states.

Deliverables:
- One layout system (sidebar + top nav + content).
- One page template per item above with variations for role-specific widgets.
- Consistent component library (buttons, badges, tables, modals, forms).

---

End of prompt.

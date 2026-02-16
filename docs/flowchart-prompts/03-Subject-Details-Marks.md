# Flowchart Prompt 03 - Subject Details (Marks and Exam Type)

Goal: Show the full Subject Hub page sections and data flow.

Prompt:
Create a flowchart for the Subject Hub page that shows all visible sections. Steps: Student opens Subject page -> Frontend calls GET /api/academic/subjects/:id/public -> Server validates ID -> Fetch subject from MongoDB -> Return subject data -> UI renders: Subject header (name, code, credits, branch, semester), Exam Type and Marks (total, theory/practical, passing), Materials preview, Tasks preview, Notices preview, Library books, Timetable preview, Projects section (coming soon). Mention each section explicitly. Use 10 to 14 nodes, left-to-right layout. Mention the API endpoint explicitly in the request node.

Must include nodes:
- Student Opens Subject Page
- GET /api/academic/subjects/:id/public
- Validate Subject ID
- Fetch Subject from DB
- Subject Data Response
- Render Subject Header (name, code, credits, branch, semester)
- Render Exam Type and Marks
- Render Materials Preview
- Render Tasks Preview
- Render Notices Preview
- Render Library Books
- Render Timetable Preview
- Render Projects Section (coming soon)

Notes:
- Keep it focused on data flow and UI sections.
- Use one node per section for clarity.

# Flowchart Prompt 02 - Authentication and First Login

Goal: Create two separate flowcharts: one for Student flow, and one for Admin/HOD/Teacher flow.

Prompt:
Create two flowcharts for authentication.

Flowchart A (Student):
Steps: Student opens portal -> Landing page -> If new, go to Register -> Register success -> Login page -> Validate credentials -> Decision: valid credentials? If no, show error and return to login. If yes, redirect to Landing page (student view). Do not include first-login setup for students. Use a top-to-bottom layout with 8 to 10 nodes.

Flowchart B (Admin/HOD/Teacher):
Steps: Staff opens portal -> Login page -> Validate credentials -> Decision: valid credentials? If no, show error and return to login. If yes, Decision: first login required? If yes, change password + security question -> Save -> Role check -> Redirect to Admin Dashboard or HOD Dashboard or Teacher Dashboard. If no, go directly to Role check -> Redirect. Use diamond decisions for validation, first login, and role. Top-to-bottom layout with 10 to 12 nodes.

Must include nodes (Flowchart A - Student):
- Open Portal
- Landing Page
- Register (new student)
- Registration Success
- Login Page
- Validate Credentials (decision)
- Error Message
- Student Landing View

Must include nodes (Flowchart B - Staff):
- Open Portal
- Login Page
- Validate Credentials (decision)
- Error Message
- First Login Required? (decision)
- Change Password
- Set Security Question
- Save Profile
- Role Check (decision)
- Admin Dashboard
- HOD Dashboard
- Teacher Dashboard

Notes:
- Keep labels short and clear.
- Use arrows that show both paths.
- Keep Student flow separate from Staff flow.

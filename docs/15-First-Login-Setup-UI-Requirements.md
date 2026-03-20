# First Login Setup - Pro Master Prompt

## How To Use
1. Copy only the prompt block below.
2. Paste into your coding AI (Copilot/ChatGPT/Claude/etc.).
3. Ask it to implement the page in your existing codebase.

---

## Pro Prompt (Copy From Here)

You are a senior React + UX engineer. Redesign and implement a production-grade first-login setup page for my existing application.

### Project Context
- Route: `/first-login`
- Current app: React frontend with existing auth flow
- This page is mandatory for newly created users (admin/hod/teacher/student) who login with temporary password.

### Core Objective
Create a premium, modern, highly usable first-login page where user must:
1. Set new password
2. Confirm new password
3. Select security question
4. Enter security answer
5. Optionally set case-insensitive answer toggle

### Non-Negotiable Business Rules
1. User should be on this page only when `user.passwordChangeRequired === true`.
2. User cannot bypass this setup if password change is required.
3. Temporary password must never be shown on this page.
4. On success: navigate to `/complete-profile`.
5. On cancel: clear token/session and redirect to `/login`.

### Backend API Contract (Do Not Change)
- Endpoint: `POST /api/auth/first-login`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Request body keys must remain exactly:
```json
{
  "newPassword": "string",
  "securityQuestion": "string",
  "securityAnswer": "string",
  "caseInsensitiveAnswer": false
}
```

### Validation Requirements
Implement client-side validation with inline errors:
1. New password required
2. Password minimum 6 characters
3. Confirm password must match
4. Security question required
5. Security answer required

Behavior rules:
1. Clear field-specific error when user edits that field
2. Disable submit during API request
3. Show backend error message when API fails

### UX + UI Quality Requirements
Design must feel premium and intentional, not generic.

Required UX states:
1. Initial form state
2. Field validation error state
3. Loading/submitting state
4. Success state
5. API failure state
6. Unauthorized/session-expired state (redirect to login)

Required UI details:
1. Clear hierarchy (title, subtitle, helper copy)
2. Strong visual clarity for password fields
3. Show/Hide password toggles
4. Security note explaining recovery answer purpose
5. Accessible focus states and labels
6. Responsive design for mobile + desktop
7. Touch-friendly controls (comfortable tap size)

### Accessibility Requirements
1. Proper labels for all fields
2. Keyboard navigable form
3. Visible focus indicators
4. Error/success area with assistive support (`aria-live`)
5. Sufficient color contrast

### Implementation Constraints
1. Keep existing business logic and routes intact
2. Do not change API payload keys
3. Do not add unnecessary dependencies
4. Use clean, maintainable React state handling
5. Keep compatibility with current app styles/dark mode behavior

### Deliverables
1. Final updated React component code for first-login page
2. Short explanation of what changed and why
3. Quick QA checklist for manual verification

If any requirement conflicts with visual style choices, prioritize security and API compatibility first.

## Pro Prompt (Copy Till Here)

---

## Quick QA Checklist
1. Temp-password user always lands on `/first-login`.
2. Successful submit redirects to `/complete-profile`.
3. Cancel logs user out and sends to `/login`.
4. Inline validation works for all required fields.
5. API errors are visible and understandable.
6. Mobile + desktop layout both clean and usable.

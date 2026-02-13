# Step 1 Plan - Role UI + Permissions

## Goal
Make Admin/HOD/Teacher share one UI shell and finish permission-driven menus with clear labels and instant updates after save.

## What I will do
1. Add human-friendly module labels in the permissions UI (instead of raw keys).
2. Add small UX helpers (select all, clear all, reset to role default).
3. Make menu refresh immediately after saving permissions.
4. Keep pages unchanged (only layout + permissions behavior).

## Files to change
- client/src/pages/UserManagement.jsx
- client/src/hooks/useRoleNav.js
- server/routes/permissions.js (if needed for immediate refresh)

## Output
- Admin can clearly edit permissions.
- Admin/HOD/Teacher menus update based on saved permissions.
- No change to existing page content.

# Screenshot Master Mapping (Readable Version)

This version is optimized for Markdown preview.

## Storage Rules
- Screenshot folder: docs/ppt-parts/
- File format: SS-XX-Module-Action.png

## Quick Capture Order
1. SS-01 to SS-06: Public and authentication screens
2. SS-07 to SS-24: Role and module screens
3. SS-25 to SS-30: API, database, QA, and appendix evidence

## Final Count
- Total screenshots planned: 30
- This is enough for strong report quality without unnecessary repetition.

## Chapter 1 and 3 (Public + Auth)
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-01-Landing-Home | Landing page hero and sections | 1.1 Introduction | Figure 1.1: Public landing page of Smart College Academic Portal |
| SS-02-Landing-Academic-Explorer | Academic explorer cards and filters | 1.5 Scope of the Project | Figure 1.2: Academic explorer for branch-semester-subject access |
| SS-03-Login-Form | Login form | 3.1 Functional Requirements | Figure 3.1: Login interface with authentication entry fields |
| SS-04-Register-Form | Registration form | 3.1 Functional Requirements | Figure 3.2: User registration form |
| SS-05-FirstLogin-Setup | First login setup | 6.1 | Figure 6.1: First-login account setup screen |
| SS-06-ForgotPassword | Forgot password/reset page | 6.1 | Figure 6.2: Password recovery workflow |

## Chapter 6.1 (Authentication and User)
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-07-Admin-Dashboard | Admin dashboard | 6.1 | Figure 6.3: Admin dashboard with management cards |
| SS-08-UserManagement | User management table/form | 6.1 | Figure 6.4: User management interface |
| SS-09-Profile-Role | Role profile page | 6.1 | Figure 6.5: Role profile and personal settings page |

## Chapter 6.2 (Academic Structure)
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-10-HOD-Dashboard | HOD dashboard | 6.2 | Figure 6.6: HOD dashboard with branch-scoped controls |
| SS-11-Branches | Branch management page | 6.2 | Figure 6.7: Branch management module |
| SS-12-Semesters | Semester management page | 6.2 | Figure 6.8: Semester management module |
| SS-13-Subjects | Subject management list/form | 6.2 | Figure 6.9: Subject management interface |
| SS-14-SubjectHub | Subject hub page | 6.2 | Figure 6.10: Subject hub with core subject details |
| SS-15-Rooms-Management | Rooms listing/create page | 6.2 | Figure 6.11: Room management for timetable allocation |

## Chapter 6.3 (Notice and Task)
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-16-Teacher-Dashboard | Teacher dashboard | 6.3 | Figure 6.12: Teacher dashboard for task and notice operations |
| SS-17-Student-Dashboard | Student dashboard | 6.3 | Figure 6.13: Student dashboard for academic tracking |
| SS-18-Notices-Create | Notice create form | 6.3 | Figure 6.14: Notice creation interface |
| SS-19-Notices-List | Notice board list | 6.3 | Figure 6.15: Notice board with role-targeted announcements |
| SS-20-Tasks-Create | Task create form | 6.3 | Figure 6.16: Task creation form by faculty role |
| SS-21-Tasks-List | Task list and filters | 6.3 | Figure 6.17: Task listing and status tracking |
| SS-22-Student-Submission | Student submission flow | 6.3 | Figure 6.18: Student task submission workflow |

## Chapter 6.4 (Timetable and Library)
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-23-Timetable-Weekly | Weekly timetable grid | 6.4 | Figure 6.19: Weekly timetable visualization |
| SS-24-Timetable-Controls | Timetable filters/controls | 6.4 | Figure 6.20: Timetable filter and control panel |
| SS-25-Timetable-ManageTable | Manage entries table | 6.4 | Figure 6.21: Timetable management table with actions |
| SS-26-Timetable-BulkStatus | Set All Active/Inactive buttons | 6.4 | Figure 6.22: Bulk status control for selected branch and semester |
| SS-27-Library-RoleView | Role library page | 6.4 | Figure 6.23: Role-based library resources interface |
| SS-28-Materials-RoleView | Materials management page | 6.4 | Figure 6.24: Study materials management interface |

## Chapter 7, 5, 8 and Appendix
| ID | Capture From | Report Section | Caption |
|---|---|---|---|
| SS-29-API-Sample-Auth | Postman/login API success response screen | 7.3 | Figure 7.1: Authentication API response sample |
| SS-30-API-Sample-Timetable | Postman/timetable API response screen | 7.3 | Figure 7.2: Timetable API integration sample |

## Extra Evidence for Chapter 5, 8 and Appendix (Use from same 30 set or replace weaker screenshots)

If you want stronger evidence without increasing count, replace any duplicate dashboard screenshot with the following:

| Replace ID | Capture What Exactly | Put in Section | Caption |
|---|---|---|---|
| Replace SS-10 or SS-17 | MongoDB collections list (users, branches, semesters, subjects, tasks, notices, timetables) | 5.1 | Figure 5.1: Database collections used in the project |
| Replace SS-11 or SS-14 | One sanitized sample document view with key fields | 5.2 | Figure 5.2: Sample document schema structure |
| Replace SS-16 or SS-21 | QA checklist sheet/result screenshot from docs or test run evidence | 8.2 | Figure 8.1: Manual QA checklist execution evidence |
| Replace SS-27 or SS-28 | Final project folder structure proof screenshot | Appendix C | Figure C.1: Final submission package structure |

This way your count stays around 30 but report evidence remains complete.

## Placement Rules
- Put each screenshot right after its first related explanation paragraph.
- Keep at least 2 lines of text before a figure.
- Keep screenshot and caption on the same page.
- Use one caption pattern everywhere: Figure X.Y: Caption text.

## Completion Tracker
- [ ] SS-01 to SS-10 captured
- [ ] SS-11 to SS-20 captured
- [ ] SS-21 to SS-30 captured

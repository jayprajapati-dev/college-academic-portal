# Report Real Data Collection Sheet

## Purpose
Collect all real data first, then write the report.
This prevents fake values, missing screenshots, and inconsistent module details.

## A. Project Identity Data
- Project title: Smart College Academic Portal
- Repository: college-academic-portal
- Frontend path: client/
- Backend path: server/
- Documentation path: docs/

## B. Team and Institute Data (Fill Required)
- Student name: Prajapati Jay V.
- Enrollment number: 236260316029
- Semester: 6th
- College name: Government Polytechnic Palanpur
- Department: Information Technology
- Submission date: 

## C. Environment Data (Real- check in code and fill right information)
- Node.js version used: [Run and fill]
- npm version used: [Run and fill]
- MongoDB version/environment: [Fill]
- Browser used for screenshots: [Fill]

## D. Module Evidence Tracker
| Module | Backend route file | Frontend page/component | Data source | Screenshot ID | Verified (Y/N) |
|---|---|---|---|---|---|
| Authentication | server/routes | client/src/pages | DB + JWT | SS-01..SS-04 | |
| User management | server/routes | client/src/pages | DB | SS-05..SS-08 | |
| Subject management | server/routes | client/src/pages | DB | SS-09..SS-12 | |
| Notice module | server/routes | client/src/pages | DB | SS-13..SS-16 | |
| Task module | server/routes | client/src/pages | DB | SS-17..SS-22 | |
| Timetable module | server/routes | client/src/pages | DB | SS-23..SS-30 | |
| Library/materials | server/routes | client/src/pages | DB | SS-31..SS-34 | |

## E. API Evidence Table
| API Endpoint | Method | Auth Required | Sample Request Source | Sample Response Source | Included in Report (Y/N) |
|---|---|---|---|---|---|
| /api/... | GET/POST/etc | Yes/No | Postman/Browser/Code | Postman/Browser/Code | |

## F. Database Evidence Table
| Collection | Key Fields | Related Collections | Index/Validation Notes | Included in Schema Chapter (Y/N) |
|---|---|---|---|---|
| users | | | | |
| branches | | | | |
| semesters | | | | |
| subjects | | | | |
| tasks | | | | |
| notices | | | | |
| timetables | | | | |
| notifications | | | | |

## G. QA Evidence
| Test Case ID | Scenario | Expected Result | Actual Result | Pass/Fail | Screenshot ID |
|---|---|---|---|---|---|
| TC-01 | Login with valid credentials | Dashboard opens |  |  |  |
| TC-02 | Role-based route access | Correct role page only |  |  |  |
| TC-03 | Create notice | Notice visible to target roles |  |  |  |
| TC-04 | Create task and submit | Submission tracked |  |  |  |
| TC-05 | Timetable status/update | Changes visible in UI |  |  |  |

## H. Final Consistency Check
- All screenshots are from current build
- All API examples are from current code
- All database fields match current models
- Report chapter references are aligned with screenshot IDs

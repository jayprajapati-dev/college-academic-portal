# Timetable Module Complete Guide (Role + Options + Room Control)

## 1. Overview
Ye document Timetable module ka complete breakdown deta hai:
- Timetable me kaun kaun se fields hain
- UI me kaun se options available hain
- Role wise kya permissions hain
- Room module kaise kaam karta hai
- Conflict prevention ka exact logic kya hai

---

## 2. Timetable Data Structure
Timetable entry me major fields:
- semesterId (required)
- branchId (required)
- subjectId (required)
- teacherId (required)
- roomNo (required)
- dayOfWeek (required): Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
- startTime (required, HH:MM)
- endTime (required, HH:MM)
- lectureType: Theory, Practical, Tutorial, Lab
- notes (optional)
- status: active, cancelled, archived
- createdBy, createdByRole
- canBeModifiedBy[] (extra edit permission list)

Important validation:
- startTime < endTime hona zaroori hai
- duration auto-calculate hota hai
- status default active hota hai

---

## 3. Room Master Data Structure
Room module alag collection use karta hai (TimetableRoom):
- roomNo (required)
- roomKey (auto generated normalized key)
- branchId (required)
- semesterId (optional)
- isActive (default true)
- createdBy

Normalization:
- roomNo trim + extra spaces remove
- roomKey uppercase format me store hota hai

Unique rule:
- (roomKey + branchId + semesterId) combination unique hai
- duplicate entry par create fail ya inactive room ho to reactivate hota hai

---

## 4. Role-wise Access Matrix

### Admin
- Timetable create kar sakta hai
- Timetable update/delete/status toggle kar sakta hai
- All timetable data dekh sakta hai (filters ke saath)
- Room list/add/update/remove kar sakta hai
- Grant/Revoke modification permission kar sakta hai

### HOD
- Timetable create kar sakta hai (sirf assigned branch scope me)
- Timetable update/delete/status toggle kar sakta hai (permission logic ke according)
- Apne branch scope ka timetable dekh sakta hai
- Room list/add/update/remove kar sakta hai (assigned branch scope)

### Teacher
- Timetable UI me apna schedule dekh sakta hai
- UI me create button nahi milta (Only Admin/HOD message dikhta hai)
- Backend API create allow karta hai, lekin UI intentionally restricted hai
- Modify permission mile to specific entries update kar sakta hai
- Room list dekh sakta hai (read access)

### Coordinator
- Room module me backend level par list/add/update/remove allowed hai
- Timetable creation/management UI flow me primary role nahi hai

### Student
- Student timetable endpoints se active schedule dekh sakta hai
- Branch + semester scoped data hi milta hai

---

## 5. Timetable Page UI Options

### Header actions
- + Control Rooms (Admin/HOD)
- + Create Timetable Entry (Admin/HOD)

### Smart Filters (main page)
- Admin ke liye:
  - Semester filter
  - Branch filter
  - Day filter
  - Status filter (ON/Active, OFF/Cancelled, Deleted/Archived, All)
- Non-admin ke liye:
  - Day filter

### Table / Grid behavior
- Weekly view Monday to Saturday
- Sunday fixed holiday indicator
- Time-slot wise entries grouped
- Conflict badge visible if same slot me multiple entries
- Entry card me status badge, subject, teacher, room
- Admin/HOD controls per entry:
  - ON/OFF toggle
  - Modify
  - Delete (soft delete as archived)

---

## 6. Create Timetable Entry Form Options
Required fields:
- Semester
- Branch
- Subject
- Teacher
- Day
- Room Number
- Start Time
- End Time

Optional fields:
- Lecture Type (default Theory)
- Notes

Room field behavior:
- Select or type style
- Existing active rooms suggestion list se aate hain
- Manual room text bhi allowed hai

---

## 7. Room Control Modal Options
Room Control modal me:
- Add Room section:
  - roomNo
  - branchId
  - semesterId (optional, empty means all semesters scope)
- Active Rooms list:
  - room name
  - branch/semester label
  - Remove button (soft deactivate)

Remove ka effect:
- Room isActive false hota hai
- Existing timetable entries delete nahi hote

---

## 8. Conflict Prevention Logic (Most Important)
Conflict check active timetable entries par hota hai (same semester + same branch + same day).

### Time overlap rule
Overlap consider hota hai agar:
- NOT (newEnd <= existingStart OR newStart >= existingEnd)

### Teacher conflict
- Same teacher agar overlap slot me already assigned hai to reject

### Room conflict
- Same room agar overlap slot me already booked hai to reject
- Room comparison normalized hota hai:
  - case-insensitive (uppercase conversion)
  - extra spaces ignore

### Update / Status ON conflict check
- Update me agar schedule related values badle to conflict re-check
- Entry OFF se ON karte waqt bhi conflict check mandatory

---

## 9. Timetable Status Meaning
- active: visible and operational timetable
- cancelled: temporary OFF
- archived: soft deleted entry

Note:
- Delete API hard delete nahi karta, status archived set karta hai

---

## 10. API Summary (Timetable + Room)
Base: /api/timetable

### Room APIs
- GET /rooms
- POST /rooms
- PUT /rooms/:id
- DELETE /rooms/:id

### Timetable APIs
- POST /create
- GET /all (admin)
- GET /semester/:semesterId
- GET /subject/:subjectId
- GET /my-schedule
- GET /day/:dayOfWeek
- GET /:id
- PUT /:id
- DELETE /:id
- PATCH /:id/status
- PUT /:id/status
- POST /:id/status
- POST /:id/grant-permission
- POST /:id/revoke-permission

Routing safety:
- ID based routes me ObjectId pattern enforced hai, taaki static paths jaise rooms galat route me na jaye.

---

## 11. Real-world Usage Flow
Recommended admin flow:
1. Pehle Control Rooms me branch/semester wise rooms add karo
2. Phir Create Timetable Entry se class schedule banao
3. Slot conflicts aayen to teacher ya room change karo
4. Temporary band karna ho to OFF (cancelled)
5. Permanent remove karna ho to Delete (archived)

---

## 12. Current Behavior Notes
- UI me timetable create explicitly Admin/HOD tak limited hai
- Backend me teacher create authorization present hai; agar strict policy chahiye to backend authorize list bhi Admin/HOD only karna chahiye
- Room module currently active-room model use karta hai with soft deactivation

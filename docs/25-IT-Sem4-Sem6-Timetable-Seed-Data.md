# IT Semester 4 and 6 Timetable Seed Data

This document defines the seeded weekly timetable data for Information Technology branch, semester 4 and semester 6.

## Script

- File: `server/scripts/seedItSem4Sem6Timetable.js`
- Run command:

```bash
cd server
npm run seed:it-timetable
```

## What The Script Does

1. Ensures semester 4 and semester 6 exist and are active.
2. Ensures Information Technology branch (`IT`) exists.
3. Ensures required rooms exist:
- `G-07` (Class)
- `G-06` (Lab)
- `F-06` (Class, Mech Building)
- `F-05` (Lab, Mech Building)
4. Ensures subjects for IT sem 4 and sem 6 exist.
5. Ensures teachers exist and assigns subjects.
6. Replaces existing timetable entries for IT sem 4 and sem 6.
7. Inserts one complete weekly timetable for both semesters.
8. Represents sem 6 practical blocks as proper lab spans where applicable.
8. Updates timetable settings to match the schedule window:
- `dayStartTime: 09:30`
- `dayEndTime: 18:10`
- `slotMinutes: 60`
- `maxSlot: 8`
- break windows:
- `12:30-13:00` Lunch Break
- `16:00-16:10` Short Break

## Rooms Plan

### Semester 4 (IT)
- Lecture/Tutorial: `G-07`
- Practical/Lab: `F-05`, `G-06`

### Semester 6 (IT)
- Lecture: `F-06`
- Practical/Lab: `F-05`

## Teacher Mapping

| Key | Teacher | Email |
|---|---|---|
| CK | Prof. C K | ck.it@college.edu |
| TP | Prof. T P | tp.it@college.edu |
| DL | Prof. D L | dl.it@college.edu |
| VAC | Prof. VAC Mentor | vac.it@college.edu |
| LIB | Library Staff IT | library.it@college.edu |

## Subject Mapping

### Semester 4

| Code | Subject |
|---|---|
| IT4-MAD | Mathematics for Application Development |
| IT4-CSDF | Computer Security and Digital Forensics |
| IT4-MCN | Mobile Computing Networks |
| IT4-AJP | Advanced Java Programming |
| IT4-FOML | Fundamentals of Machine Learning |
| IT4-UIUXD | UI and UX Design |
| IT4-ESVAC | Environment and Sustainability (VAC) |
| IT4-LIB | Library Hour |

### Semester 6

| Code | Subject |
|---|---|
| IT6-SD | Software Development |
| IT6-CDCT | Cloud and Distributed Computing Technologies |
| IT6-CSDF | Cyber Security and Digital Forensics |
| IT6-FOBC | Fundamentals of Blockchain |

## Semester 6 Weekly Timetable

| Day | 11:30-12:30 | 1:00-2:00 | 2:00-3:00 | 3:00-4:00 | 4:10-5:10 | 5:10-6:10 |
|---|---|---|---|---|---|---|
| Monday | SD (CK) [F-06] | SD (CK) [F-06] | C and DCT (TP) [F-05] | CS and DF (TP) [F-05] | -- | -- |
| Tuesday | C and DCT (TP) [F-05] | FOBC (CK) [F-06] | SD (CK) [F-06] | SD (CK) [F-06] | -- | -- |
| Wednesday | CS and DF (TP) [F-05] | FOBC (CK) [F-06] | CS and DF LAB block (TP) [F-05] | CS and DF LAB block (TP) [F-05] | FOBC (CK) [F-06] | -- |
| Thursday | C and DCT (TP) [F-05] | CS and DF (TP) [F-05] | SD (CK) [F-06] | SD (CK) [F-06] | C and DCT (TP) [F-05] | -- |
| Friday | -- | FOBC (CK) [F-06] | FOBC (CK) [F-06] | CS and DF LAB block (TP) [F-05] | CS and DF LAB block (TP) [F-05] | -- |

## Semester 4 Weekly Timetable (Seeded)

| Day | 9:30-10:30 | 10:30-11:30 | 11:30-12:30 | 1:00-2:00 | 2:00-3:00 | 3:00-4:00 | 4:10-5:10 | 5:10-6:10 |
|---|---|---|---|---|---|---|---|---|
| Monday | -- | MAD IT1 TP [F-05] | CS and DF IT2 CK [G-07] | MCN DL [G-07] | AJP CK [G-07] | AJP IT2 CK [G-07] | -- | -- |
| Tuesday | -- | CS and DF IT1 CK [G-07] | UI and UX D IT2 TP [G-06] | MAD TP [F-05] | E and S VAC [G-07] | MCN TUT TP [F-05] | -- | -- |
| Wednesday | FOML IT1 CK [G-07] | MAD IT2 TP [G-06] | MCN DL [G-07] | MAD TP [F-05] | FOML CK [G-07] | CS and DF CK [G-07] | UI and UX D TUT TP [F-05] | -- |
| Thursday | UI and UX D IT1 TP [F-05] | FOML IT2 CK [G-07] | CS and DF CK [G-07] | FOML CK [G-07] | E and S VAC [G-07] | UI and UX D TUT TP [G-06] | AJP CK [G-07] | -- |
| Friday | FOML CK [G-07] | AJP CK [G-07] | MCN DL [G-07] | MAD TP [F-05] | LIBRARY [G-07] | AJP IT1 CK [G-07] | -- | -- |

## Notes

- The script is idempotent for setup entities (semesters, branch, rooms, subjects, teachers).
- Existing IT sem 4 and sem 6 timetable rows are replaced to avoid old incorrect data mixing with new data.
- If you want different teacher names/emails, update `TEACHER_DEFS` in the script.

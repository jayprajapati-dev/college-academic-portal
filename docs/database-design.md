# Database Design – Phase 2
## Smart College Academic Portal

---

## 1. Database Used
MongoDB (NoSQL Database)

---

## 2. Reason for Choosing MongoDB
MongoDB is selected because:
- It stores data in flexible JSON-like documents
- It is easy to use with Node.js
- It supports scalable and dynamic data structures
- Different subjects can have different exam and marks patterns

---

## 3. Purpose of Database
The database is used to store and manage:
- Semester and branch structure
- Subject information and configuration
- Marks distribution (PA, theory, practical, project)
- Study material links
- Assignments and notices
- Admin and student access data

---

## 4. Database Design Approach
This system follows a **data-driven approach**.

Admin adds and configures data in the database.  
Students only view the data based on:
- Selected semester
- Selected branch
- Selected subject

If data exists → it is shown  
If data does not exist → it is not shown

---

## 5. Collections Overview
The following collections are used in the system:

1. users  
2. semesters  
3. branches  
4. subjects  
5. marksStructures  
6. studyMaterials  
7. assignments  
8. libraryResources  
9. timetables  

---

## 6. Collection Details

---

### 6.1 users
Stores login, registration and role-based access information
for both Admin (Teacher) and Student users.

This collection supports different login methods
based on user role.

Fields:
- userId
- role (admin / student)

Common Fields:
- name
- password
- isActive (true / false)
- createdAt
- updatedAt

Admin (Teacher) Specific Fields:
- mobileNumber (used for login)
- role = admin

Student Specific Fields:
- enrollmentNumber (used for login)
- mobileNumber (for verification / recovery)
- role = student

Login Rules:
- Admin logs in using mobile number and password
- Student logs in using enrollment number and password
- Login is case-insensitive (capital/small letters do not matter)

Password Recovery:
- Forgot password option is available
- User identity is verified using registered mobile number
- New password can be set after verification

Purpose:
- Provide secure and role-based authentication
- Allow different login methods for admin and student
- Support password recovery and account management

---

### 6.2 semesters
Stores semester information.

Fields:
- semesterId
- semesterName (Sem 1, Sem 2, Sem 3, etc.)

Purpose:
- Organize academic data semester-wise

---

### 6.3 branches
Stores branch information linked to semesters.

Fields:
- branchId
- branchName (IT, CE, EC, Civil, etc.)
- semesterId (reference)

Purpose:
- Separate subjects branch-wise under each semester

---

### 6.4 subjects
Stores basic subject information based on the selected subject.

Fields:
- subjectId
- subjectName
- subjectCode
- branchId (reference)
- description (optional)

Purpose:
- Core academic unit of the system

---

### 6.5 marksStructures
Stores marks and exam configuration for each subject.

Fields:
- marksStructureId
- subjectId (reference)
- hasPA (true/false)
- hasTheory (true/false)
- hasPractical (true/false)
- hasProject (true/false)

PA Configuration:
- paType (PA-1 / PA-2 / PA-1 + PA-2)
- pa1Marks (optional)
- pa2Marks (optional)

Other Marks:
- theoryMarks (optional)
- practicalMarks (optional)
- projectMarks (optional)

Purpose:
- Allow flexible marks structure for different subjects
- Display marks to students in table format

---

### 6.6 studyMaterials
Stores subject-related study material links.

Fields:
- materialId
- subjectId (reference)
- materialType (Syllabus, Notes, PA-1, PA-2, GTU Paper, Manual, etc.)
- title
- materialLink (external URL)

Purpose:
- Centralized access to learning materials
- Avoid file storage by using external links

---

### 6.7 assignments
Stores assignments and announcements posted by teachers.

Fields:
- assignmentId
- subjectId (reference)
- title
- description
- deadline
- createdBy (admin/teacher)
- createdDate

Purpose:
- Ensure students do not miss tasks or announcements

---

### 6.8 libraryResources
Stores subject-related library book information.

Fields:
- resourceId
- subjectId (reference)
- bookName
- authorName
- shortDescription
- bookImage (optional)
- availabilityStatus (optional)

Purpose:
- Help interested students find related books easily

---

### 6.9 timetables
Stores subject timetable information.

Fields:
- timetableId
- subjectId (reference)
- day
- time
- teacherName
- roomOrLab
- location (optional)

Purpose:
- Display subject-wise timetable to students

---

## 7. Relationship Overview

Semester  
→ Branch  
→ Subject  
→ Marks Structure  
→ Study Materials  
→ Assignments  
→ Library Resources  
→ Timetable  

All academic data is linked to **Subject**.

---

## 8. Data Visibility Rules
- Admin can add, edit and delete data
- Student has view-only access
- Only related semester and branch data is shown to students
- Optional data (projects, library, materials) is shown only if added

---

## 9. Phase-wise Usage

### Phase 2 (Blueprint)
- Database connection
- Collection structure
- Sample dummy data
- One end-to-end working flow

### Phase 3 (Full Development)
- Complete data
- Validation
- All modules fully connected

---

## 10. Conclusion
This database design is flexible, scalable and suitable
for a college academic portal.  
It supports different subject patterns, exam types
and learning resources while keeping the system simple
and organized.

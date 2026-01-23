# college-academic-portal
A MERN stack based web portal to manage college semesters, branches, subjects and assignment notices in one place.

# 🎓 Smart College Academic Portal

**“કોલેજના દરેક સેમેસ્ટર અને બ્રાન્ચ મુજબ વિષયોની સંપૂર્ણ માહિતી  
(વિષયનું નામ, વિષય કોડ, માર્ક્સ વિતરણ, પરીક્ષાનો પ્રકાર, આંતરિક/બાહ્ય મૂલ્યાંકન વગેરે)  
એક જગ્યાએ બતાવતું સોફ્ટવેર, જેમાં સર ટાસ્ક અથવા અસાઇનમેન્ટ આપે તો તેની ડેડલાઇન સાથે  
નોટિસ બોર્ડમાં દેખાય અને ફક્ત સંબંધિત સેમેસ્ટર–બ્રાન્ચના વિદ્યાર્થીઓને જ તે નોટિસ દેખાય.”**

---

## 1. Problem Statement

College academic data is scattered across PDFs, notice boards and messages.
Students often miss assignment deadlines and subject details.

**Problem:**  
There is no single centralized academic portal for semester, branch and subject details.

---

## 2. Project Objective

- Centralize semester and branch structure  
- Show complete subject details  
- Show assignments/task with deadlines  
- Show notices only to related students  

---

## 3. System Overview
- college academic portal
The system allows:
- Semester → Branch → Subject navigation  
- Subject details with marks & exam type  
- Assignment notices with deadlines  
- Admin-controlled academic data  

---

## 4. User Roles

### Admin (Teacher / College Staff)
- Login
- Manage semesters, branches, subjects(add, remove, update,)
- Add subject details
- Post notices & assignments
- Upload study material(marks, exam type, internal/external, pdf, proper page for each)
- Task / assignment notice send
- PDF / notes upload

### Student
- View semester & branch
- View subject details
- Download materials or Check
- View related notices/Task by Sir

👉 Student kuch add/edit nahi karega, sirf view & download

---

## 5. Modules

1. Authentication Module  
2. Semester Management  
3. Branch Management  
4. Subject Management  
5. Subject Details Module  
6. Notice & Assignment Module  
7. Download Center  
8. Student View Module  

---

## 6. Database Design (VERY SIMPLE - MongoDB)

### admins
- Enrollment Number(Student)/ Mobile Number(Admin, Teacher)
- password(secure type strong, medium allow secutiry)
- role(Student, Admin(Teacher))

### semesters
- collage semesters
(Sem 1, Sem 2, Sem 3…)

### branches
Branch semester based linked
- branchName
branchName
(IT, CE, ME…)
- semesterId

### subjects
Subject branch based linked
- subjectName
- subjectCode
- branchId

### subjectDetails
Subject complete academic details
- subjectId
- marksDistribution
- examType
- internalMarks
- externalMarks
- materialUrl

### notices
task / assignment
- title
- description
- deadline
- semesterId
- branchId


Semester → Branch → Subject → Subject Details
Notice → specific semester + branch

---

## 7. System Flow

Admin adds academic data →  
Student views filtered academic information →  
Student downloads materials & checks notices

---

## 8. Technology Stack

- Frontend: React JS
- Backend: Node JS + Express
- Database: MongoDB

---

## 9. Development Stages

1. Requirement analysis 
🟢 Stage 1: Planning & Design
- Idea final
- Problem statement
- System flow
- Database structure 

2. Backend API development  
🟡 Stage 2: Backend Development
- Node + Express setup
- MongoDB connection
- Admin login API
- Semester / branch / subject APIs

3. Frontend UI development  
🟠 Stage 3: Frontend Development
- React project setup
- Admin dashboard UI
- Student view pages


Semester → Branch → Subject → Subject Details
Notice → specific semester + branch


🔵 Stage 4: Features Completion
- Subject details page
- Notice & assignment module
- Download button for notes

4. Testing & documentation  
🟣 Stage 5: Testing & Finalization
- Data add / view test
- Download test
- Bug fixing
- Documentation + presentation

---

## 10. Testing Plan

- Login validation
- Data add/update check
- File download test
- Notice visibility check

---

## 11. Viva Points

- MERN stack based system
- Role-based access
- Academic data centralization
- Simple and scalable design

---

## 12. Future Scope

- Student login system
- Mobile app
- Email notifications

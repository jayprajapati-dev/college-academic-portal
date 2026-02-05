# Database Setup (MongoDB) - Simple Guide

This project uses MongoDB on your own computer. The database is NOT inside the zip file.

You must install MongoDB and run the seed script once.

---

## 1) Install MongoDB (local)
Use the official installer from MongoDB website.

---

## 2) Start MongoDB (Windows)

```
net start MongoDB
```

If MongoDB is not installed as a service, run:

```
mongod
```

---

## 3) Database Connection (where it is set)

File path:
server/.env

Line inside file:

```
MONGODB_URI=mongodb://localhost:27017/smartacademics
```

Meaning:
- localhost = your own PC
- 27017 = MongoDB default port
- smartacademics = database name (auto-created)

---

## 4) Create Database + Test Data

From project root:

```
cd server
node seed.js
```

This creates:
- Semesters
- Branches
- Subjects
- Users (Admin, Student, Teacher, HOD)

---

## 5) After Unzip (install packages)

```
cd server
npm install

cd ../client
npm install
```

---

## 6) Run Project

```
cd server
npm start
```

In new terminal:

```
cd client
npm start
```

---

If MongoDB is not running, the server will show a connection error. Start MongoDB first.
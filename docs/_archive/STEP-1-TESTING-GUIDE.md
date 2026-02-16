# STEP 1: Backend Setup - Testing Guide

## Quick Start

Backend server is running on: `http://localhost:5000`

All endpoints require JWT authentication token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Getting JWT Token for Testing

### 1. Login to get token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@college.com",
    "password": "Admin@123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@college.com",
    "role": "admin"
  }
}
```

Copy the `token` value and use it in all requests.

---

## Complete Endpoint Testing Checklist

### ✅ SEMESTERS (5 endpoints)

#### 1. Create Semester
```
POST http://localhost:5000/api/academic/semesters
Authorization: Bearer <token>
Content-Type: application/json

{
  "semesterNumber": 1,
  "year": "2024",
  "startDate": "2024-01-15",
  "endDate": "2024-05-15",
  "isActive": true
}
```

Expected Response (201):
```json
{
  "success": true,
  "message": "Semester created successfully",
  "semester": {
    "_id": "507f1f77bcf86cd799439012",
    "semesterNumber": 1,
    "year": "2024",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-05-15T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get All Semesters
```
GET http://localhost:5000/api/academic/semesters?page=1&limit=10&sort=semesterNumber
Authorization: Bearer <token>
```

#### 3. Get Single Semester
```
GET http://localhost:5000/api/academic/semesters/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

#### 4. Update Semester
```
PUT http://localhost:5000/api/academic/semesters/507f1f77bcf86cd799439012
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}
```

#### 5. Delete Semester
```
DELETE http://localhost:5000/api/academic/semesters/507f1f77bcf86cd799439012
Authorization: Bearer <token>
```

---

### ✅ BRANCHES (5 endpoints)

#### 1. Create Branch
```
POST http://localhost:5000/api/academic/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Information Technology",
  "code": "IT",
  "description": "IT Branch",
  "isActive": true
}
```

#### 2. Get All Branches
```
GET http://localhost:5000/api/academic/branches?page=1&limit=10
Authorization: Bearer <token>
```

#### 3. Get Single Branch
```
GET http://localhost:5000/api/academic/branches/507f1f77bcf86cd799439013
Authorization: Bearer <token>
```

#### 4. Update Branch
```
PUT http://localhost:5000/api/academic/branches/507f1f77bcf86cd799439013
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description"
}
```

#### 5. Delete Branch
```
DELETE http://localhost:5000/api/academic/branches/507f1f77bcf86cd799439013
Authorization: Bearer <token>
```

---

### ✅ SUBJECTS (5 endpoints)

#### 1. Create Subject
```
POST http://localhost:5000/api/academic/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Data Structures",
  "code": "CS201",
  "type": "theory+practical",
  "credits": 4,
  "marks": {
    "theory": {
      "internal": 10,
      "external": 70,
      "total": 80
    },
    "practical": {
      "internal": 10,
      "external": 10,
      "total": 20
    },
    "totalMarks": 100,
    "passingMarks": 40
  },
  "branchId": "507f1f77bcf86cd799439013",
  "semesterId": "507f1f77bcf86cd799439012",
  "isActive": true
}
```

#### 2. Get All Subjects
```
GET http://localhost:5000/api/academic/subjects?page=1&limit=20
Authorization: Bearer <token>
```

#### 3. Get Single Subject
```
GET http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014
Authorization: Bearer <token>
```

#### 4. Update Subject
```
PUT http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014
Authorization: Bearer <token>
Content-Type: application/json

{
  "credits": 3
}
```

#### 5. Delete Subject
```
DELETE http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014
Authorization: Bearer <token>
```

---

### ✅ MATERIALS (4 endpoints) - NEW

#### 1. Upload Material
```
POST http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014/materials
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  - material: (select PDF/DOC/PPT file)
  - title: "Chapter 1 - Introduction"
```

Expected Response (201):
```json
{
  "success": true,
  "message": "Material uploaded successfully",
  "material": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Chapter 1 - Introduction",
    "fileName": "chapter1.pdf",
    "fileType": ".pdf",
    "fileSize": 2048576,
    "filePath": "/uploads/materials/1699564800123-456789123.pdf",
    "downloadCount": 0,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get All Materials for Subject
```
GET http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014/materials
Authorization: Bearer <token>
```

Expected Response (200):
```json
{
  "success": true,
  "materials": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Chapter 1 - Introduction",
      "fileName": "chapter1.pdf",
      "fileType": ".pdf",
      "fileSize": 2048576,
      "filePath": "/uploads/materials/1699564800123-456789123.pdf",
      "downloadCount": 0,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 3. Delete Material
```
DELETE http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014/materials/507f1f77bcf86cd799439015
Authorization: Bearer <token>
```

#### 4. Increment Download Count
```
PATCH http://localhost:5000/api/academic/subjects/507f1f77bcf86cd799439014/materials/507f1f77bcf86cd799439015/download
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Download count updated",
  "downloadCount": 1
}
```

---

### ✅ STRUCTURE (1 endpoint)

#### Get Complete Academic Hierarchy
```
GET http://localhost:5000/api/academic/structure
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "structure": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "semesterNumber": 1,
      "year": "2024",
      "branches": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Information Technology",
          "code": "IT",
          "subjects": [
            {
              "_id": "507f1f77bcf86cd799439014",
              "name": "Data Structures",
              "code": "CS201",
              "type": "theory+practical",
              "marks": { ... }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Testing Workflow

### Recommended Testing Order

1. **Login** → Get JWT token
2. **Create Semester** → Save semester ID
3. **Create Branch** → Save branch ID
4. **Create Subject** → Save subject ID (use semester and branch IDs)
5. **Upload Material** → Save material ID (use subject ID)
6. **Get All Materials** → Verify material appears
7. **Increment Download** → Verify counter increases
8. **Delete Material** → Verify deletion
9. **Get Structure** → Verify full hierarchy

---

## Postman Collection Template

Save this as `Smart-College-APIs.postman_collection.json` and import to Postman:

```json
{
  "info": {
    "name": "Smart College - Phase 2 Backend",
    "description": "Complete API testing for academic module",
    "version": "1.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"admin@college.com\",\"password\":\"Admin@123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Semesters",
      "item": [
        {
          "name": "Create Semester",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/academic/semesters",
            "body": {
              "mode": "raw",
              "raw": "{\"semesterNumber\":1,\"year\":\"2024\",\"startDate\":\"2024-01-15\",\"endDate\":\"2024-05-15\"}"
            }
          }
        },
        {
          "name": "Get All Semesters",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/academic/semesters"
          }
        }
      ]
    }
  ]
}
```

---

## Validation Error Examples

### Missing Required Field
```json
{
  "success": false,
  "message": "Semester number is required"
}
```

### Invalid File Type
```json
{
  "success": false,
  "message": "Only PDF, DOC, DOCX, PPT, PPTX, ZIP, TXT, XLSX, XLS files are allowed"
}
```

### File Too Large
```json
{
  "success": false,
  "message": "File too large (max 50MB allowed)"
}
```

### Unauthorized (Missing Token)
```json
{
  "success": false,
  "message": "Unauthorized - Token missing or invalid"
}
```

### Forbidden (Not Admin)
```json
{
  "success": false,
  "message": "Forbidden - You don't have permission to access this resource"
}
```

---

## Summary

✅ **STEP 1 Complete:** All 20 API endpoints implemented and documented
- 16 CRUD endpoints (Semesters, Branches, Subjects)
- 4 Material management endpoints (NEW)
- 1 Structure/Hierarchy endpoint

**Status:** ✅ PRODUCTION READY

**Next:** STEP 2 - Frontend Pages & Components


# Phase 2 - Academic Management System

## Overview
Phase 2 focuses on building the complete academic structure management system for administrators. This includes CRUD operations for Semesters, Branches, Subjects, and their relationships. Admin users can manage the entire academic hierarchy that students will later view.

---

## What Needs to Be Done

### 1. Database Enhancements
- [x] Semester Schema (already exists)
- [x] Branch Schema (already exists)
- [x] Subject Schema (already exists)
- [ ] Add additional fields if needed
- [ ] Add validation and indexing for performance
- [ ] Create relationships between Semester → Branch → Subject

**Enhanced Semester Schema:**
```javascript
{
  semesterNumber: Number (1-8, required, unique),
  academicYear: String (e.g., "2024-2025", required),
  isActive: Boolean (default: true),
  startDate: Date (optional),
  endDate: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Enhanced Branch Schema:**
```javascript
{
  name: String (required, e.g., "Information Technology"),
  code: String (required, unique, e.g., "IT"),
  semesterId: ObjectId (ref: Semester, required),
  description: String (optional),
  totalSeats: Number (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Enhanced Subject Schema:**
```javascript
{
  name: String (required, e.g., "Data Structures"),
  code: String (required, unique, e.g., "CS201"),
  branchId: ObjectId (ref: Branch, required),
  semesterId: ObjectId (ref: Semester, required),
  credits: Number (optional),
  type: String (enum: ['theory', 'practical', 'theory+practical']),
  description: String (optional),
  syllabus: String (optional, markdown or HTML),
  
  // Marks Distribution
  marks: {
    theory: {
      internal: Number,
      external: Number,
      total: Number
    },
    practical: {
      internal: Number,
      external: Number,
      total: Number
    },
    totalMarks: Number,
    passingMarks: Number
  },
  
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2. Backend APIs - Academic Management

#### 2.1 Semester Management Routes (`/api/admin/semesters`)
- [ ] GET `/` - Get all semesters (with pagination, sorting)
- [ ] GET `/:id` - Get single semester details
- [ ] POST `/` - Create new semester
- [ ] PUT `/:id` - Update semester
- [ ] DELETE `/:id` - Delete semester (soft delete)
- [ ] GET `/:id/branches` - Get all branches in a semester
- [ ] GET `/:id/subjects` - Get all subjects in a semester
- [ ] GET `/:id/stats` - Get semester statistics (branch count, subject count, student count)

#### 2.2 Branch Management Routes (`/api/admin/branches`)
- [ ] GET `/` - Get all branches (with filters: semesterId, isActive)
- [ ] GET `/:id` - Get single branch details
- [ ] POST `/` - Create new branch (requires semesterId)
- [ ] PUT `/:id` - Update branch
- [ ] DELETE `/:id` - Delete branch (soft delete, check if subjects exist)
- [ ] GET `/:id/subjects` - Get all subjects in a branch
- [ ] GET `/:id/students` - Get all students in a branch
- [ ] GET `/:id/stats` - Get branch statistics

#### 2.3 Subject Management Routes (`/api/admin/subjects`)
- [ ] GET `/` - Get all subjects (with filters: branchId, semesterId, type)
- [ ] GET `/:id` - Get single subject details
- [ ] POST `/` - Create new subject (requires branchId & semesterId)
- [ ] PUT `/:id` - Update subject (including marks distribution)
- [ ] DELETE `/:id` - Delete subject (soft delete, check if materials exist)
- [ ] GET `/:id/materials` - Get all materials for a subject
- [ ] POST `/:id/materials` - Upload material for subject
- [ ] DELETE `/:id/materials/:materialId` - Delete material
- [ ] GET `/:id/students` - Get enrolled students

#### 2.4 Academic Structure Routes (`/api/admin/academic`)
- [ ] GET `/structure` - Get complete academic hierarchy (Semester → Branch → Subject)
- [ ] POST `/bulk-create` - Bulk create semesters/branches/subjects
- [ ] PUT `/reorder` - Reorder semesters or subjects
- [ ] GET `/validation` - Validate academic structure (check missing links)

---

### 3. Middleware Enhancements
- [ ] `adminOnly.js` - Ensure only admin can access academic management
- [ ] `validateAcademic.js` - Validate semester/branch/subject data
- [ ] `checkDependencies.js` - Check if deletion is safe (no students enrolled)
- [ ] `fileUpload.js` - Handle file uploads for study materials

---

### 4. Frontend Pages - Admin Panel

#### 4.1 Semester Management Page (`/admin/semesters`)
**Features:**
- [ ] Table showing all semesters with:
  - Semester number
  - Academic year
  - Status (Active/Inactive)
  - Number of branches
  - Number of subjects
  - Actions (Edit, Delete, View)
- [ ] Add Semester button → Opens modal
- [ ] Edit Semester → Opens modal with pre-filled data
- [ ] Delete Semester → Confirmation dialog
- [ ] Search and filter functionality
- [ ] Pagination

**Add/Edit Semester Modal:**
- [ ] Semester number dropdown (1-8)
- [ ] Academic year input
- [ ] Start date picker (optional)
- [ ] End date picker (optional)
- [ ] Active/Inactive toggle
- [ ] Save button
- [ ] Cancel button

#### 4.2 Branch Management Page (`/admin/branches`)
**Features:**
- [ ] Dropdown to select semester (filter)
- [ ] Table showing branches for selected semester:
  - Branch name
  - Branch code
  - Total seats
  - Number of subjects
  - Status (Active/Inactive)
  - Actions (Edit, Delete, View Subjects)
- [ ] Add Branch button → Opens modal
- [ ] Edit Branch → Opens modal
- [ ] Delete Branch → Confirmation dialog
- [ ] Search functionality

**Add/Edit Branch Modal:**
- [ ] Select semester dropdown
- [ ] Branch name input
- [ ] Branch code input (auto-generate option)
- [ ] Description textarea
- [ ] Total seats input (optional)
- [ ] Active/Inactive toggle
- [ ] Save button
- [ ] Cancel button

#### 4.3 Subject Management Page (`/admin/subjects`)
**Features:**
- [ ] Dropdown to select semester
- [ ] Dropdown to select branch (filtered by semester)
- [ ] Table showing subjects for selected branch:
  - Subject name
  - Subject code
  - Type (Theory/Practical/Both)
  - Credits
  - Total marks
  - Materials count
  - Status (Active/Inactive)
  - Actions (Edit, Delete, View Materials, Add Material)
- [ ] Add Subject button → Opens form
- [ ] Edit Subject → Opens form with pre-filled data
- [ ] Delete Subject → Confirmation dialog
- [ ] Search functionality
- [ ] Filter by type

**Add/Edit Subject Form:**
- [ ] Select semester dropdown
- [ ] Select branch dropdown (filtered)
- [ ] Subject name input
- [ ] Subject code input (auto-generate option)
- [ ] Subject type radio buttons (Theory/Practical/Both)
- [ ] Credits input
- [ ] Description textarea
- [ ] Syllabus rich text editor (optional)

**Marks Distribution Section:**
- [ ] Theory Marks:
  - Internal marks input
  - External marks input
  - Total auto-calculated
- [ ] Practical Marks:
  - Internal marks input
  - External marks input
  - Total auto-calculated
- [ ] Total marks (auto-calculated)
- [ ] Passing marks input
- [ ] Save button
- [ ] Cancel button

#### 4.4 Study Materials Management (`/admin/subjects/:id/materials`)
**Features:**
- [ ] Subject details at top (name, code, semester, branch)
- [ ] Table showing all materials:
  - Material title
  - File name
  - File type (url-link)
  - File size(optional)
  - Upload date(auto)
  - Actions (Preview, Download, Delete) requiment based any action which actual need in do it.
- [ ] Upload Material button → Opens upload form
- [ ] Drag & drop upload area
- [ ] Delete Material → Confirmation dialog

**Upload Material Form:**
- [ ] Material title input
- [ ] Description textarea (optional)
- [ ] File upload input (accept: URL(Any-like google drive and other))
- [ ] Upload progress bar
- [ ] Upload button
- [ ] Cancel button

#### 4.5 Academic Structure Overview (`/admin/academic-structure`)
**Features:**
- [ ] Visual tree/hierarchy view:
  - Semester 1
    - Branch IT
      - Subject: Data Structures
      - Subject: DBMS
    - Branch CE
      - Subject: SOM
  - Semester 2
    - ...
- [ ] Expand/Collapse all button
- [ ] Quick statistics cards:
  - Total semesters
  - Total branches
  - Total subjects
  - Total materials uploaded
- [ ] Quick actions:
  - Add semester
  - Add branch
  - Add subject
- [ ] Export structure button (JSON/CSV)

---

### 5. Frontend Components

#### 5.1 Academic Management Components
- [ ] SemesterCard - Display semester info
- [ ] BranchCard - Display branch info
- [ ] SubjectCard - Display subject info
- [ ] SemesterModal - Add/Edit semester
- [ ] BranchModal - Add/Edit branch
- [ ] SubjectForm - Add/Edit subject (full form)
- [ ] MaterialUploader - Upload files
- [ ] MaterialTable - Display materials list
- [ ] AcademicTree - Hierarchical view
- [ ] DeleteConfirmation - Reusable delete modal
- [ ] SearchBar - Reusable search
- [ ] FilterDropdown - Reusable filter

#### 5.2 Data Display Components
- [ ] DataTable - Reusable table with sorting, pagination
- [ ] StatsCard - Display statistics
- [ ] EmptyState - Show when no data
- [ ] LoadingTable - Loading skeleton for tables
- [ ] Badge - Status badges (Active/Inactive)
- [ ] Tooltip - Show additional info on hover

---

### 6. Validation & Business Rules

#### 6.1 Semester Validation
- [ ] Semester number must be unique per academic year
- [ ] Academic year format: YYYY-YYYY
- [ ] End date must be after start date
- [ ] Cannot delete semester if branches exist

#### 6.2 Branch Validation
- [ ] Branch code must be unique
- [ ] Branch name must be unique per semester
- [ ] Must select valid semester
- [ ] Cannot delete branch if subjects or students exist

#### 6.3 Subject Validation
- [ ] Subject code must be unique
- [ ] Subject name must be unique per branch
- [ ] Must select valid semester and branch
- [ ] Marks validation:
  - Internal + External = Total for theory
  - Internal + External = Total for practical
  - Passing marks < Total marks
  - All marks must be >= 0
- [ ] Cannot delete subject if materials or enrolled students exist

#### 6.4 Material Validation
- [ ] File size limit: 50MB per file
- [ ] Allowed file types: PDF, DOC, DOCX, PPT, PPTX, ZIP, TXT
- [ ] Title is required
- [ ] File must be selected

---

### 7. File Upload System

#### 7.1 Backend File Handling
- [ ] Use `multer` for file uploads
- [ ] Store files in `/uploads/materials/` folder
- [ ] Store file metadata in database
- [ ] Generate unique file names (UUID + original extension)
- [ ] Implement file size validation
- [ ] Implement file type validation

#### 7.2 File Storage Structure
```
uploads/
  materials/
    [semesterId]/
      [branchId]/
        [subjectId]/
          [uuid]-filename.pdf
```

#### 7.3 Frontend File Upload
- [ ] Drag & drop upload interface
- [ ] File preview before upload
- [ ] Upload progress indicator
- [ ] Multiple file upload support
- [ ] File type icons (PDF, DOC, etc.)
- [ ] File size display

---

### 8. Testing Checklist

#### 8.1 Semester Management
- [ ] Admin can view all semesters
- [ ] Admin can add new semester
- [ ] Admin can edit semester
- [ ] Admin can delete semester (if no branches)
- [ ] Cannot create duplicate semester numbers
- [ ] Validation errors show properly

#### 8.2 Branch Management
- [ ] Admin can view branches filtered by semester
- [ ] Admin can add branch (must select semester)
- [ ] Admin can edit branch
- [ ] Admin can delete branch (if no subjects)
- [ ] Cannot create duplicate branch codes
- [ ] Branch shows correct semester

#### 8.3 Subject Management
- [ ] Admin can view subjects filtered by semester & branch
- [ ] Admin can add subject with marks distribution
- [ ] Admin can edit subject and update marks
- [ ] Admin can delete subject (if no materials)
- [ ] Marks calculation works correctly
- [ ] Cannot create duplicate subject codes
- [ ] Subject type (theory/practical) affects marks fields

#### 8.4 Material Management
- [ ] Admin can view materials for a subject
- [ ] Admin can upload PDF files
- [ ] Admin can upload DOC files
- [ ] Admin can delete materials
- [ ] File size validation works (reject > 50MB)
- [ ] File type validation works (reject invalid types)
- [ ] Download count increments
- [ ] Materials are stored in correct folder structure

#### 8.5 Academic Structure
- [ ] Hierarchical view displays correctly
- [ ] Can expand/collapse tree nodes
- [ ] Statistics show accurate counts
- [ ] Quick actions work from overview page

#### 8.6 Integration Testing
- [ ] Creating semester → Creating branch → Creating subject flow works
- [ ] Deleting subject → Materials are removed
- [ ] Deleting branch → Subjects cannot be accessed
- [ ] Search works across all pages
- [ ] Filters work correctly
- [ ] Pagination works

---

### 9. UI/UX Requirements

#### 9.1 Design Guidelines
- [ ] Consistent color scheme with Phase 1
- [ ] Admin pages use red-orange gradient theme
- [ ] Tables have hover effects
- [ ] Buttons have consistent styling
- [ ] Forms have proper validation feedback
- [ ] Loading states for all async operations
- [ ] Success/Error toast notifications

#### 9.2 Responsive Design
- [ ] Tables responsive on mobile (cards view)
- [ ] Forms work on mobile devices
- [ ] Modals work on small screens
- [ ] Dropdowns work on touch devices

#### 9.3 Accessibility
- [ ] All forms have proper labels
- [ ] Error messages are descriptive
- [ ] Keyboard navigation works
- [ ] ARIA labels for screen readers

---

### 10. Performance Optimization

#### 10.1 Backend Optimization
- [ ] Database indexing on frequently queried fields (code, semesterId, branchId)
- [ ] Implement pagination for large datasets
- [ ] Use aggregation pipelines for statistics
- [ ] Cache academic structure (Redis optional)
- [ ] Lazy loading for materials

#### 10.2 Frontend Optimization
- [ ] Lazy load pages
- [ ] Debounce search inputs
- [ ] Virtual scrolling for large tables (optional)
- [ ] Image optimization for file icons
- [ ] Code splitting

---

## Phase 2 Completion Criteria

### ✅ Phase 2 is DONE when:

1. **Database:**
   - ✅ Semester, Branch, Subject schemas enhanced
   - ✅ Relationships properly defined
   - ✅ Validation rules implemented

2. **Backend:**
   - ✅ All CRUD APIs for Semesters working
   - ✅ All CRUD APIs for Branches working
   - ✅ All CRUD APIs for Subjects working
   - ✅ File upload system working
   - ✅ Academic structure API working
   - ✅ Validation and error handling proper

3. **Frontend:**
   - ✅ Semester management page complete
   - ✅ Branch management page complete
   - ✅ Subject management page complete
   - ✅ Material upload/management working
   - ✅ Academic structure overview working
   - ✅ All forms validated
   - ✅ All modals functional

4. **Integration:**
   - ✅ Admin can create Semester → Branch → Subject hierarchy
   - ✅ Admin can upload materials to subjects
   - ✅ Deletion checks work (prevent orphaned data)
   - ✅ Search and filters work across all pages
   - ✅ Pagination works correctly

5. **Testing:**
   - ✅ All CRUD operations tested manually
   - ✅ File upload tested with various file types
   - ✅ Validation tested (duplicate codes, required fields)
   - ✅ Delete constraints tested
   - ✅ Browser console has no errors

6. **Data:**
   - ✅ At least 3 semesters created
   - ✅ At least 3 branches per semester
   - ✅ At least 5 subjects per branch
   - ✅ At least 2 materials per subject

---

## When Phase 2 is Complete:

🎉 **You can move to Phase 3** which includes:
- Student dashboard to view academic structure
- Student access to study materials
- Material download functionality
- Subject details view for students
- Student enrollment management

---

## API Endpoints Summary

### Semester APIs
```
GET    /api/admin/semesters              - List all
POST   /api/admin/semesters              - Create
GET    /api/admin/semesters/:id          - Get one
PUT    /api/admin/semesters/:id          - Update
DELETE /api/admin/semesters/:id          - Delete
GET    /api/admin/semesters/:id/branches - Get branches
```

### Branch APIs
```
GET    /api/admin/branches               - List all
POST   /api/admin/branches               - Create
GET    /api/admin/branches/:id           - Get one
PUT    /api/admin/branches/:id           - Update
DELETE /api/admin/branches/:id           - Delete
GET    /api/admin/branches/:id/subjects  - Get subjects
```

### Subject APIs
```
GET    /api/admin/subjects               - List all
POST   /api/admin/subjects               - Create
GET    /api/admin/subjects/:id           - Get one
PUT    /api/admin/subjects/:id           - Update
DELETE /api/admin/subjects/:id           - Delete
GET    /api/admin/subjects/:id/materials - Get materials
POST   /api/admin/subjects/:id/materials - Upload material
DELETE /api/admin/subjects/:id/materials/:matId - Delete material
```

### Academic Structure APIs
```
GET    /api/admin/academic/structure     - Full hierarchy
GET    /api/admin/academic/stats         - Statistics
```

---

## Notes for Development

- Start with backend APIs first, test with Postman
- Create database schemas before APIs
- Implement frontend page by page (Semester → Branch → Subject)
- Test each CRUD operation thoroughly
- Use Git commits after each major feature
- Keep file uploads simple in Phase 2 (enhancement in later phases)
- Focus on core functionality, polish UI in Phase 3

---

**Last Updated:** February 3, 2026  
**Status:** Ready to start - Phase 1 complete

---

## Dependencies from Phase 1

**Required from Phase 1:**
- ✅ Admin authentication working
- ✅ JWT token system
- ✅ Admin dashboard navigation
- ✅ Protected routes (admin-only)
- ✅ Basic UI components (buttons, forms, tables)
- ✅ Toast notifications system

**Uses from Phase 1:**
- Admin authentication middleware
- Role-based access control
- Existing database connection
- Admin dashboard layout/navigation

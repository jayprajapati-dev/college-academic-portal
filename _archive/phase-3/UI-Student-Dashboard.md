# UI Design - Student Dashboard

## 🎨 Student Dashboard Layout

### Page Structure

```
┌─────────────────────────────────────────────────┐
│  Header (Student Name, Logout)                  │
├─────────────────────────────────────────────────┤
│  Welcome Section                                │
│  "Welcome, John Doe! 👋"                        │
├─────────────────────────────────────────────────┤
│  Filters Section                                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Semester ▼   │  │ Branch ▼     │            │
│  │ - Sem 1      │  │ - IT         │            │
│  │ - Sem 2      │  │ - CE         │            │
│  │ - Sem 3      │  │ - EC         │            │
│  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────┤
│  Subjects Grid                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Subject  │  │ Subject  │  │ Subject  │     │
│  │ Card 1   │  │ Card 2   │  │ Card 3   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐                   │
│  │ Subject  │  │ Subject  │                   │
│  │ Card 4   │  │ Card 5   │                   │
│  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────┘
```

### Header Section

```
┌─────────────────────────────────────────────────┐
│ 🎓 Smart College Academic Portal                │
│                                      Logout ✕   │
└─────────────────────────────────────────────────┘
```

### Welcome Section

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Welcome back, John Doe! 👋                     │
│  Student ID: STU12345                           │
│  Email: john@example.com                        │
│                                                 │
│  Your Enrolled Subjects: 6                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Subject Card Design

```
┌────────────────────────────────┐
│ Subject Name: Data Structures  │
│ Code: CS101                     │
│ ───────────────────────────────│
│ Credits: 4                      │
│ Type: Theory                    │
│ ───────────────────────────────│
│ [View Details] [Download Docs] │
└────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (1024px+)
- 3 subject cards per row
- Full width filters
- Sidebar optional

### Tablet (768px-1023px)
- 2 subject cards per row
- Stacked filters
- Touch-friendly buttons

### Mobile (< 768px)
- 1 subject card per row
- Vertical filters
- Large buttons for touch

---

## 🎨 Color Scheme

**Primary:**
- Background: #F8FAFC
- Text: #1E293B
- Card Background: #FFFFFF

**Accent:**
- Primary Color: #195de6 (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)

**Subject Type Badges:**
- Theory: 🔵 Blue
- Practical: 🟢 Green
- Both: 🟣 Purple

---

## 🔄 Interactive Elements

### Semester Dropdown
- Shows all available semesters
- Pre-selected if only one
- Triggers subject reload on change
- Shows loading state

### Branch Dropdown
- Filtered based on selected semester
- Disabled if no semester selected
- Triggers subject reload on change
- Shows "No branches available" if empty

### Subject Card
- Hover effect: shadow & scale
- Click: navigate to details page
- Keyboard accessible: Tab + Enter

---

## 📊 Data Display Format

### Subject Card Information

```javascript
{
  name: "Data Structures",
  code: "CS101",
  type: "theory",      // theory, practical, both
  credits: 4,
  description: "Study of fundamental data structures",
  materials: 5,         // number of materials
  enrolled: true,
  semester: "Sem 1",
  branch: "IT"
}
```

---

## ✨ Features

### 1. Dynamic Filtering
- Select Semester → Load Branches
- Select Branch → Load Subjects
- Both required to show subjects
- Clear filters button (optional)

### 2. Subject Cards
- Show essential info
- Link to details page
- Show material count
- Responsive grid layout

### 3. Empty States
- "No semesters available"
- "No branches in this semester"
- "No subjects in this branch"
- "Select semester and branch to view subjects"

### 4. Loading States
- Spinner while loading
- Skeleton loading (optional)
- "Loading subjects..." message

### 5. Error Handling
- API error messages
- Network error handling
- Retry button on failure

---

## 🎯 User Actions

1. **View Dashboard**
   - Student logs in
   - Navigates to /dashboard
   - Sees welcome message

2. **Select Semester**
   - Click semester dropdown
   - Choose semester
   - Branches load for that semester

3. **Select Branch**
   - Click branch dropdown
   - Choose branch
   - Subjects load for that branch

4. **View Subject Details**
   - Click subject card
   - Navigate to /dashboard/subjects/:id
   - See full details + materials

5. **Download Material**
   - View subject page
   - See materials section
   - Click download button
   - File downloads

---

## 🔐 Access Control

**Only Students Can:**
- View /dashboard
- View /dashboard/subjects
- View /dashboard/subjects/:id
- Download materials

**Cannot See:**
- /admin/* routes
- Admin functions
- Other students' data

---

## 📝 Accessibility

- ARIA labels on buttons
- Keyboard navigation support
- Color contrast > 4.5:1
- Focus visible on interactive elements
- Error messages announced to screen readers

---

## 🚀 Implementation Order

1. Create StudentDashboard component
2. Add semester/branch dropdowns
3. Create SubjectCard component
4. Display subjects grid
5. Create SubjectDetails page
6. Add materials section
7. Implement download functionality
8. Add loading & error states
9. Test on mobile
10. Add accessibility

---

## 📐 Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

---

## 🎨 Design Assets Needed

- Subject type icons
- Download icon
- Semester/Branch icons
- Loading spinner
- Empty state illustrations
- Error page design


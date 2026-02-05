const mongoose = require('mongoose');
const User = require('./models/User');
const Semester = require('./models/Semester');
const Branch = require('./models/Branch');
const Subject = require('./models/Subject');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartacademics', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Semester.deleteMany({});
    await Branch.deleteMany({});
    await Subject.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create Semesters
    console.log('📚 Creating Semesters...');
    const semesters = await Semester.insertMany([
      { semesterNumber: 1, academicYear: '2024-2025', isActive: true },
      { semesterNumber: 2, academicYear: '2024-2025', isActive: true },
      { semesterNumber: 3, academicYear: '2024-2025', isActive: true },
      { semesterNumber: 4, academicYear: '2024-2025', isActive: true },
      { semesterNumber: 5, academicYear: '2024-2025', isActive: true },
      { semesterNumber: 6, academicYear: '2024-2025', isActive: true }
    ]);
    console.log(`✅ Created ${semesters.length} semesters`);

    // Create Branches
    console.log('🏢 Creating Branches...');
    const branches = await Branch.insertMany([
      { 
        name: 'Information Technology', 
        code: 'IT',
        description: 'Computer science and information technology',
        semesterId: semesters[0]._id,
        isActive: true
      },
      { 
        name: 'Computer Science', 
        code: 'CS',
        description: 'Computer science and software engineering',
        semesterId: semesters[0]._id,
        isActive: true
      },
      { 
        name: 'Mechanical', 
        code: 'ME',
        description: 'Mechanical systems and manufacturing',
        semesterId: semesters[0]._id,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${branches.length} branches`);

    // Create Admin User
    console.log('👤 Creating Admin User...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@smartacademic.com',
      mobile: '9999999999',
      role: 'admin',
      password: 'admin123',
      status: 'active'
    });
    console.log('✅ Admin created');
    console.log('📧 Email: admin@smartacademic.com');
    console.log('🔑 Password: admin123');

    // Create Sample Subjects (IT Branch, Semester 1)
    console.log('📖 Creating Sample Subjects...');
    const subjects = await Subject.insertMany([
      {
        name: 'Programming Fundamentals',
        code: 'IT101',
        branchId: branches[0]._id,
        semesterId: semesters[0]._id,
        credits: 4,
        description: 'Introduction to programming concepts and basics of C language',
        syllabus: 'Basics of Programming, Variables, Data Types, Control Structures, Functions, Arrays, Strings',
        type: 'theory+practical',
        faculty: {
          name: 'Prof. Rajesh Kumar',
          email: 'rajesh@college.edu',
          office: 'Block A, Room 205',
          phone: '9876543210'
        },
        marks: {
          theory: { internal: 30, external: 70, total: 100 },
          practical: { internal: 20, external: 30, total: 50 },
          totalMarks: 150,
          passingMarks: 75
        },
        materials: [
          {
            title: 'C Programming Basics',
            category: 'Book',
            description: 'Introduction to C programming language',
            link: 'https://example.com/c-basics.pdf',
            uploadedAt: new Date('2024-01-15'),
            addedByRole: 'teacher'
          },
          {
            title: 'Chapter 1: Variables and Data Types',
            category: 'Notes',
            description: 'Detailed notes on variables and data types in C',
            link: 'https://example.com/variables.pdf',
            uploadedAt: new Date('2024-01-20'),
            addedByRole: 'teacher'
          },
          {
            title: 'Practice Problems',
            category: 'Manuals',
            description: 'Exercise problems for practice',
            link: 'https://example.com/practice.pdf',
            uploadedAt: new Date('2024-02-01'),
            addedByRole: 'teacher'
          }
        ]
      },
      {
        name: 'Data Structures',
        code: 'IT102',
        branchId: branches[0]._id,
        semesterId: semesters[0]._id,
        credits: 4,
        description: 'Fundamental data structures and algorithms analysis',
        syllabus: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, Searching',
        type: 'theory+practical',
        faculty: {
          name: 'Prof. Priya Sharma',
          email: 'priya@college.edu',
          office: 'Block B, Room 310',
          phone: '9876543211'
        },
        marks: {
          theory: { internal: 30, external: 70, total: 100 },
          practical: { internal: 20, external: 30, total: 50 },
          totalMarks: 150,
          passingMarks: 75
        },
        materials: [
          {
            title: 'Data Structures Textbook',
            category: 'Book',
            description: 'Comprehensive data structures reference',
            link: 'https://example.com/ds-textbook.pdf',
            uploadedAt: new Date('2024-01-10'),
            addedByRole: 'teacher'
          },
          {
            title: 'Linked Lists Implementation',
            category: 'Notes',
            description: 'Implementation and operations on linked lists',
            link: 'https://example.com/linked-lists.pdf',
            uploadedAt: new Date('2024-02-05'),
            addedByRole: 'teacher'
          }
        ]
      },
      {
        name: 'Database Management Systems',
        code: 'IT201',
        branchId: branches[0]._id,
        semesterId: semesters[1]._id,
        credits: 3,
        description: 'Introduction to DBMS concepts and SQL',
        syllabus: 'DBMS Concepts, ER Model, Relational Model, SQL, Normalization, Transactions',
        type: 'theory',
        faculty: {
          name: 'Prof. Amit Patel',
          email: 'amit@college.edu',
          office: 'Block C, Room 205',
          phone: '9876543212'
        },
        marks: {
          theory: { internal: 30, external: 70, total: 100 },
          practical: { internal: 0, external: 0, total: 0 },
          totalMarks: 100,
          passingMarks: 50
        },
        materials: [
          {
            title: 'DBMS Fundamentals',
            category: 'Book',
            description: 'Complete DBMS concepts and principles',
            link: 'https://example.com/dbms.pdf',
            uploadedAt: new Date('2024-01-25'),
            addedByRole: 'teacher'
          }
        ]
      },
      {
        name: 'Web Development',
        code: 'IT202',
        branchId: branches[0]._id,
        semesterId: semesters[1]._id,
        credits: 3,
        description: 'Full-stack web development with HTML, CSS, JavaScript',
        syllabus: 'HTML5, CSS3, JavaScript, DOM, AJAX, Responsive Design, Web Frameworks',
        type: 'theory+practical',
        faculty: {
          name: 'Prof. Vikram Singh',
          email: 'vikram@college.edu',
          office: 'Block A, Room 310',
          phone: '9876543213'
        },
        marks: {
          theory: { internal: 25, external: 60, total: 85 },
          practical: { internal: 20, external: 30, total: 50 },
          totalMarks: 135,
          passingMarks: 67
        },
        materials: [
          {
            title: 'Web Development Guide',
            category: 'Book',
            description: 'Complete web development tutorial',
            link: 'https://example.com/web-dev.pdf',
            uploadedAt: new Date('2024-02-01'),
            addedByRole: 'teacher'
          },
          {
            title: 'HTML5 Tutorial',
            category: 'Notes',
            description: 'HTML5 basics and semantic elements',
            link: 'https://example.com/html5.pdf',
            uploadedAt: new Date('2024-02-03'),
            addedByRole: 'teacher'
          },
          {
            title: 'JavaScript Fundamentals',
            category: 'Notes',
            description: 'JavaScript basics and DOM manipulation',
            link: 'https://example.com/js.pdf',
            uploadedAt: new Date('2024-02-05'),
            addedByRole: 'teacher'
          }
        ]
      },
      {
        name: 'Operating Systems',
        code: 'CS101',
        branchId: branches[1]._id,
        semesterId: semesters[0]._id,
        credits: 4,
        description: 'OS concepts, processes, memory management and scheduling',
        syllabus: 'OS Concepts, Processes and Threads, Scheduling, Memory Management, File Systems, Synchronization',
        type: 'theory',
        faculty: {
          name: 'Prof. Deepak Verma',
          email: 'deepak@college.edu',
          office: 'Block D, Room 205',
          phone: '9876543214'
        },
        marks: {
          theory: { internal: 30, external: 70, total: 100 },
          practical: { internal: 0, external: 0, total: 0 },
          totalMarks: 100,
          passingMarks: 50
        },
        materials: [
          {
            title: 'Operating Systems Principles',
            category: 'Book',
            description: 'OS concepts and design principles',
            link: 'https://example.com/os.pdf',
            uploadedAt: new Date('2024-01-20'),
            addedByRole: 'teacher'
          }
        ]
      },
      {
        name: 'Computer Architecture',
        code: 'CS102',
        branchId: branches[1]._id,
        semesterId: semesters[0]._id,
        credits: 4,
        description: 'Computer hardware architecture and organization',
        syllabus: 'Digital Logic, CPU Architecture, Memory Systems, I/O Systems, Performance Analysis',
        type: 'theory',
        faculty: {
          name: 'Prof. Neha Gupta',
          email: 'neha@college.edu',
          office: 'Block D, Room 310',
          phone: '9876543215'
        },
        marks: {
          theory: { internal: 30, external: 70, total: 100 },
          practical: { internal: 0, external: 0, total: 0 },
          totalMarks: 100,
          passingMarks: 50
        },
        materials: [
          {
            title: 'Computer Architecture and Design',
            category: 'Book',
            description: 'Complete computer architecture reference',
            link: 'https://example.com/architecture.pdf',
            uploadedAt: new Date('2024-01-18'),
            addedByRole: 'teacher'
          },
          {
            title: 'CPU Design Notes',
            category: 'Notes',
            description: 'Detailed CPU design and pipeline concepts',
            link: 'https://example.com/cpu-design.pdf',
            uploadedAt: new Date('2024-02-02'),
            addedByRole: 'teacher'
          }
        ]
      }
    ]);
    console.log(`✅ Created ${subjects.length} subjects with complete data`);

    // Create Sample Student
    console.log('👨‍🎓 Creating Sample Student...');
    const student = await User.create({
      name: 'John Doe',
      email: 'john.student@example.com',
      enrollmentNumber: 'IT2024001',
      password: 'student123',
      role: 'student',
      status: 'active',
      branch: branches[0]._id,
      semester: semesters[0]._id,
      mobile: '9876543210',
      dateOfBirth: new Date('2005-05-15'),
      gender: 'Male'
    });
    console.log('✅ Student created');
    console.log('📧 Email: john.student@example.com');
    console.log('🔑 Password: student123');

    // Create Sample Teacher
    console.log('👨‍🏫 Creating Sample Teacher...');
    const teacher = await User.create({
      name: 'Rahul Teacher',
      email: 'rahul.teacher@example.com',
      mobile: '8888888888',
      password: 'teacher123',
      role: 'teacher',
      status: 'active',
      branch: branches[0]._id,
      semester: semesters[0]._id,
      assignedSubjects: [subjects[0]._id, subjects[1]._id, subjects[2]._id, subjects[3]._id],
      qualifications: 'B.Tech in Information Technology, M.Tech in Computer Science',
      experience: '8 years of teaching experience'
    });
    console.log('✅ Teacher created');
    console.log('📧 Email: rahul.teacher@example.com');
    console.log('🔑 Password: teacher123');
    console.log('📚 Assigned Subjects: IT101, IT102, IT201, IT202');

    // Create Sample HOD
    console.log('👨‍💼 Creating Sample HOD...');
    const hod = await User.create({
      name: 'Neha HOD',
      email: 'neha.hod@example.com',
      mobile: '7777777777',
      password: 'hod123',
      role: 'hod',
      status: 'active',
      branch: branches[0]._id,
      semester: semesters[0]._id
    });
    console.log('✅ HOD created');
    console.log('📧 Email: neha.hod@example.com');
    console.log('🔑 Password: hod123');

    // Summary
    console.log('\n📊 Seed Data Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Semesters: ${semesters.length}`);
    console.log(`✅ Branches: ${branches.length}`);
    console.log(`✅ Subjects: ${subjects.length}`);
    console.log(`✅ Users: 4 (1 Admin + 1 Student + 1 Teacher + 1 HOD)`);
    console.log('═══════════════════════════════════════');
    console.log('\n🔐 Login Credentials:');
    console.log('───────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@smartacademic.com');
    console.log('  Password: admin123');
    console.log('\nStudent:');
    console.log('  Email: john.student@example.com');
    console.log('  Password: student123');
    console.log('\nTeacher:');
    console.log('  Email: rahul.teacher@example.com');
    console.log('  Password: teacher123');
    console.log('\nHOD:');
    console.log('  Email: neha.hod@example.com');
    console.log('  Password: hod123');
    console.log('───────────────────────────────────────');
    console.log('\n✅ Seed data created successfully!');
    console.log('🚀 You can now start the application\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();

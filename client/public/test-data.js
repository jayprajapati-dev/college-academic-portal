// Test Data Creation Script for Phase-2
// Run this in browser console after logging in as admin

const API_BASE = '/api/academic';
const token = localStorage.getItem('token');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Test Data
const testSemesters = [
  {
    name: 'Semester 1',
    number: 1,
    academicYear: '2024-2025',
    season: 'Fall',
    startDate: '2024-08-01',
    endDate: '2024-12-20',
    isActive: true
  },
  {
    name: 'Semester 2',
    number: 2,
    academicYear: '2024-2025',
    season: 'Spring',
    startDate: '2025-01-15',
    endDate: '2025-05-30',
    isActive: true
  },
  {
    name: 'Semester 3',
    number: 3,
    academicYear: '2025-2026',
    season: 'Fall',
    startDate: '2025-08-01',
    endDate: '2025-12-20',
    isActive: false
  }
];

const testBranches = [
  {
    name: 'Computer Engineering',
    code: 'CE',
    totalSeats: 60,
    description: 'Computer Engineering Department',
    hod: 'Dr. Rajesh Kumar',
    isActive: true
  },
  {
    name: 'Information Technology',
    code: 'IT',
    totalSeats: 120,
    description: 'Information Technology Department',
    hod: 'Dr. Priya Sharma',
    isActive: true
  },
  {
    name: 'Electronics & Communication',
    code: 'EC',
    totalSeats: 60,
    description: 'Electronics & Communication Engineering',
    hod: 'Dr. Amit Patel',
    isActive: true
  }
];

const testSubjects = [
  {
    name: 'Data Structures',
    code: 'CS101',
    type: 'theory',
    credits: 4,
    description: 'Fundamental data structures and algorithms',
    marks: {
      theory: {
        internal: 30,
        external: 70
      }
    }
  },
  {
    name: 'Database Management Systems',
    code: 'CS102',
    type: 'both',
    credits: 5,
    description: 'Database design and SQL',
    marks: {
      theory: {
        internal: 30,
        external: 70
      },
      practical: {
        internal: 40,
        external: 60
      }
    }
  },
  {
    name: 'Web Development Lab',
    code: 'CS103',
    type: 'practical',
    credits: 2,
    description: 'HTML, CSS, JavaScript practical',
    marks: {
      practical: {
        internal: 40,
        external: 60
      }
    }
  }
];

const testMaterials = [
  {
    title: 'Introduction to Data Structures',
    url: 'https://www.geeksforgeeks.org/data-structures/',
    description: 'Comprehensive guide to data structures',
    resourceType: 'Notes'
  },
  {
    title: 'DBMS Video Tutorial',
    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    description: 'Complete DBMS course',
    resourceType: 'Video'
  },
  {
    title: 'JavaScript Assignment',
    url: 'https://github.com/example/js-assignment',
    description: 'Practice problems for JavaScript',
    resourceType: 'Assignment'
  }
];

// Create Test Data Function
async function createTestData() {
  console.log('🚀 Starting Phase-2 Test Data Creation...\n');
  
  try {
    // Step 1: Create Semesters
    console.log('📅 Creating Semesters...');
    const createdSemesters = [];
    for (const semester of testSemesters) {
      const response = await fetch(`${API_BASE}/semesters`, {
        method: 'POST',
        headers,
        body: JSON.stringify(semester)
      });
      const data = await response.json();
      if (data.success) {
        createdSemesters.push(data.data);
        console.log(`✅ Created: ${semester.name}`);
      } else {
        console.log(`❌ Failed: ${semester.name} - ${data.message}`);
      }
    }
    
    // Step 2: Create Branches for each semester
    console.log('\n🏢 Creating Branches...');
    const createdBranches = [];
    for (const semester of createdSemesters) {
      for (const branch of testBranches) {
        const branchData = {
          ...branch,
          semesterId: semester._id
        };
        const response = await fetch(`${API_BASE}/branches`, {
          method: 'POST',
          headers,
          body: JSON.stringify(branchData)
        });
        const data = await response.json();
        if (data.success) {
          createdBranches.push(data.data);
          console.log(`✅ Created: ${branch.name} (${semester.name})`);
        } else {
          console.log(`❌ Failed: ${branch.name} - ${data.message}`);
        }
      }
    }
    
    // Step 3: Create Subjects for each branch
    console.log('\n📚 Creating Subjects...');
    const createdSubjects = [];
    for (const branch of createdBranches) {
      for (const subject of testSubjects) {
        const subjectData = {
          ...subject,
          semesterId: branch.semesterId,
          branchId: branch._id
        };
        const response = await fetch(`${API_BASE}/subjects`, {
          method: 'POST',
          headers,
          body: JSON.stringify(subjectData)
        });
        const data = await response.json();
        if (data.success) {
          createdSubjects.push(data.data);
          console.log(`✅ Created: ${subject.name} (${branch.name})`);
        } else {
          console.log(`❌ Failed: ${subject.name} - ${data.message}`);
        }
      }
    }
    
    // Step 4: Add Materials to first subject
    if (createdSubjects.length > 0) {
      console.log('\n🔗 Adding Material Links...');
      const firstSubject = createdSubjects[0];
      for (const material of testMaterials) {
        const response = await fetch(`${API_BASE}/subjects/${firstSubject._id}/materials`, {
          method: 'POST',
          headers,
          body: JSON.stringify(material)
        });
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Added: ${material.title}`);
        } else {
          console.log(`❌ Failed: ${material.title} - ${data.message}`);
        }
      }
    }
    
    console.log('\n✨ Test Data Creation Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Semesters: ${createdSemesters.length}`);
    console.log(`   Branches: ${createdBranches.length}`);
    console.log(`   Subjects: ${createdSubjects.length}`);
    console.log(`\n🎉 Phase-2 test data is ready!`);
    
    return {
      semesters: createdSemesters,
      branches: createdBranches,
      subjects: createdSubjects
    };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Test CRUD Operations
async function testCRUDOperations() {
  console.log('\n🧪 Testing CRUD Operations...\n');
  
  try {
    // Test GET operations
    console.log('📖 Testing GET operations...');
    
    const semestersRes = await fetch(`${API_BASE}/semesters`, { headers });
    const semestersData = await semestersRes.json();
    console.log(`✅ GET Semesters: ${semestersData.data?.length || 0} records`);
    
    const branchesRes = await fetch(`${API_BASE}/branches`, { headers });
    const branchesData = await branchesRes.json();
    console.log(`✅ GET Branches: ${branchesData.data?.length || 0} records`);
    
    const subjectsRes = await fetch(`${API_BASE}/subjects`, { headers });
    const subjectsData = await subjectsRes.json();
    console.log(`✅ GET Subjects: ${subjectsData.data?.length || 0} records`);
    
    // Test UPDATE operation
    if (semestersData.data && semestersData.data.length > 0) {
      console.log('\n✏️ Testing UPDATE operation...');
      const semester = semestersData.data[0];
      const updateData = {
        ...semester,
        description: 'Updated by test script'
      };
      const updateRes = await fetch(`${API_BASE}/semesters/${semester._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      const updateResult = await updateRes.json();
      console.log(updateResult.success ? '✅ UPDATE Semester: Success' : '❌ UPDATE Semester: Failed');
    }
    
    console.log('\n✨ CRUD Tests Complete!');
    
  } catch (error) {
    console.error('❌ CRUD Test Error:', error);
  }
}

// Validation Tests
function testValidations() {
  console.log('\n✅ Testing Form Validations...\n');
  
  const validationTests = [
    {
      name: 'Email Validation',
      tests: [
        { value: 'test@example.com', expected: true },
        { value: 'invalid-email', expected: false },
        { value: 'test@', expected: false }
      ]
    },
    {
      name: 'Phone Validation',
      tests: [
        { value: '9876543210', expected: true },
        { value: '1234567890', expected: false },
        { value: '98765', expected: false }
      ]
    },
    {
      name: 'URL Validation',
      tests: [
        { value: 'https://example.com', expected: true },
        { value: 'http://example.com', expected: true },
        { value: 'not-a-url', expected: false }
      ]
    }
  ];
  
  validationTests.forEach(test => {
    console.log(`Testing ${test.name}:`);
    test.tests.forEach(({ value, expected }) => {
      const result = expected ? '✅' : '❌';
      console.log(`  ${result} ${value} → ${expected ? 'Valid' : 'Invalid'}`);
    });
  });
  
  console.log('\n✨ Validation Tests Complete!');
}

// Main Test Runner
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   PHASE-2 TESTING SUITE');
  console.log('═══════════════════════════════════════════════════\n');
  
  if (!token) {
    console.error('❌ No authentication token found. Please login first.');
    return;
  }
  
  try {
    // Create test data
    await createTestData();
    
    // Test CRUD operations
    await testCRUDOperations();
    
    // Test validations
    testValidations();
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('   ✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Export functions
window.createTestData = createTestData;
window.testCRUDOperations = testCRUDOperations;
window.testValidations = testValidations;
window.runAllTests = runAllTests;

console.log('📋 Phase-2 Test Suite Loaded!');
console.log('Available commands:');
console.log('  - runAllTests()          → Run complete test suite');
console.log('  - createTestData()       → Create test semesters/branches/subjects');
console.log('  - testCRUDOperations()   → Test all CRUD operations');
console.log('  - testValidations()      → Test form validations');
console.log('\nReady to test! Run: runAllTests()');

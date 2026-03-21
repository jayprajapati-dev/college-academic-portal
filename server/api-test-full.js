#!/usr/bin/env node
/**
 * Role-wise comprehensive API checks for SmartAcademics.
 * Covers public/auth + admin + hod + teacher + coordinator + student critical CRUD paths.
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers.Authorization = `Bearer ${token}`;

    const request = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

function log(phase, test, status, msg = '') {
  const icon = status === 'ok'
    ? `${colors.green}OK${colors.reset}`
    : status === 'fail'
      ? `${colors.red}FAIL${colors.reset}`
      : `${colors.yellow}...${colors.reset}`;
  console.log(`${colors.cyan}[${phase}]${colors.reset} ${test} ${icon}${msg ? ` - ${msg}` : ''}`);
}

function assertStatus(result, accepted) {
  return accepted.includes(result.status);
}

async function run() {
  let passed = 0;
  let failed = 0;

  let adminToken = null;
  let teacherToken = null;
  let hodToken = null;
  let coordinatorToken = null;
  let studentToken = null;

  let branchId = null;
  let semesterId = null;
  let subjectId = null;
  let createdSubjectId = null;
  let createdTaskId = null;
  let createdBookId = null;
  let createdNoticeId = null;
  let createdTeacherId = null;
  let createdHodId = null;
  let createdStudentId = null;

  const stamp = Date.now().toString().slice(-6);
  const teacherMobile = `91${stamp}11${stamp.slice(0, 2)}`.slice(0, 10);
  const hodMobile = `92${stamp}22${stamp.slice(0, 2)}`.slice(0, 10);
  const studentMobile = `93${stamp}33${stamp.slice(0, 2)}`.slice(0, 10);

  try {
    console.log(`\n${colors.magenta}=== PHASE 1: AUTH + PUBLIC ===${colors.reset}`);

    const adminLogin = await req('POST', '/api/auth/login', {
      identifier: 'admin@smartacademic.com',
      password: 'admin123'
    });
    if (assertStatus(adminLogin, [200]) && adminLogin.body.token) {
      adminToken = adminLogin.body.token;
      log('AUTH', 'Admin login', 'ok', adminLogin.body.user?.email || 'admin');
      passed++;
    } else {
      log('AUTH', 'Admin login', 'fail', `status=${adminLogin.status}`);
      failed++;
      throw new Error('Admin login failed, cannot continue');
    }

    const semesters = await req('GET', '/api/academic/semesters');
    if (assertStatus(semesters, [200]) && Array.isArray(semesters.body.data) && semesters.body.data.length > 0) {
      semesterId = semesters.body.data[0]._id;
      log('PUBLIC', 'Semesters list', 'ok', `count=${semesters.body.data.length}`);
      passed++;
    } else {
      log('PUBLIC', 'Semesters list', 'fail', `status=${semesters.status}`);
      failed++;
    }

    const branches = await req('GET', '/api/academic/branches');
    if (assertStatus(branches, [200]) && Array.isArray(branches.body.data) && branches.body.data.length > 0) {
      branchId = branches.body.data[0]._id;
      log('PUBLIC', 'Branches list', 'ok', `count=${branches.body.data.length}`);
      passed++;
    } else {
      log('PUBLIC', 'Branches list', 'fail', `status=${branches.status}`);
      failed++;
    }

    const adminSubjects = await req('GET', '/api/academic/subjects/admin/list?limit=5', null, adminToken);
    if (assertStatus(adminSubjects, [200]) && Array.isArray(adminSubjects.body.subjects) && adminSubjects.body.subjects.length > 0) {
      subjectId = adminSubjects.body.subjects[0]._id;
      log('ADMIN', 'Subjects admin list', 'ok', `count=${adminSubjects.body.subjects.length}`);
      passed++;
    } else {
      log('ADMIN', 'Subjects admin list', 'fail', `status=${adminSubjects.status}`);
      failed++;
    }

    console.log(`\n${colors.magenta}=== PHASE 2: ADMIN CRUD ===${colors.reset}`);

    const createSubject = await req('POST', '/api/academic/subjects', {
      name: `API Test Subject ${stamp}`,
      code: `ATS${stamp}`,
      type: 'theory',
      credits: 4,
      branchId,
      semesterId,
      description: 'created by api-test-full.js'
    }, adminToken);
    if (assertStatus(createSubject, [201]) && createSubject.body.subject?._id) {
      createdSubjectId = createSubject.body.subject._id;
      log('ADMIN', 'Create subject', 'ok', createdSubjectId);
      passed++;
    } else {
      log('ADMIN', 'Create subject', 'fail', `${createSubject.status} ${createSubject.body.message || ''}`);
      failed++;
    }

    if (createdSubjectId) {
      const getSubject = await req('GET', `/api/academic/subjects/${createdSubjectId}`, null, adminToken);
      if (assertStatus(getSubject, [200]) && getSubject.body.subject?._id) {
        log('ADMIN', 'Read subject', 'ok', getSubject.body.subject.code);
        passed++;
      } else {
        log('ADMIN', 'Read subject', 'fail', `status=${getSubject.status}`);
        failed++;
      }

      const updateSubject = await req('PUT', `/api/academic/subjects/${createdSubjectId}`, {
        name: `Updated API Subject ${stamp}`,
        type: 'theory'
      }, adminToken);
      if (assertStatus(updateSubject, [200])) {
        log('ADMIN', 'Update subject', 'ok');
        passed++;
      } else {
        log('ADMIN', 'Update subject', 'fail', `status=${updateSubject.status}`);
        failed++;
      }
    }

    const users = await req('GET', '/api/admin/users?limit=5', null, adminToken);
    if (assertStatus(users, [200]) && Array.isArray(users.body.data)) {
      log('ADMIN', 'Users list', 'ok', `count=${users.body.data.length}`);
      passed++;
    } else {
      log('ADMIN', 'Users list', 'fail', `status=${users.status}`);
      failed++;
    }

    if (subjectId && branchId && semesterId) {
      const addTeacher = await req('POST', '/api/admin/add-teacher', {
        name: `Api Teacher ${stamp}`,
        mobile: teacherMobile,
        email: `teacher${stamp}@mail.com`,
        branchIds: [branchId],
        semesterIds: [semesterId],
        subjectIds: [subjectId]
      }, adminToken);

      if (assertStatus(addTeacher, [201]) && addTeacher.body.data?.id && addTeacher.body.data?.tempPassword) {
        createdTeacherId = addTeacher.body.data.id;
        const teacherTempPassword = addTeacher.body.data.tempPassword;
        log('ADMIN', 'Create teacher', 'ok', createdTeacherId);
        passed++;

        const teacherLogin = await req('POST', '/api/auth/login', {
          identifier: teacherMobile,
          password: teacherTempPassword
        });
        if (assertStatus(teacherLogin, [200]) && teacherLogin.body.token) {
          teacherToken = teacherLogin.body.token;
          log('TEACHER', 'Teacher login', 'ok');
          passed++;
        } else {
          log('TEACHER', 'Teacher login', 'fail', `status=${teacherLogin.status}`);
          failed++;
        }
      } else {
        log('ADMIN', 'Create teacher', 'fail', `${addTeacher.status} ${addTeacher.body.message || ''}`);
        failed++;
      }

      const addHod = await req('POST', '/api/admin/add-hod', {
        name: `Api HOD ${stamp}`,
        mobile: hodMobile,
        email: `hod${stamp}@mail.com`,
        branchIds: [branchId],
        semesterIds: [semesterId],
        subjectIds: subjectId ? [subjectId] : []
      }, adminToken);

      if (assertStatus(addHod, [201]) && addHod.body.data?.id && addHod.body.data?.tempPassword) {
        createdHodId = addHod.body.data.id;
        const hodTempPassword = addHod.body.data.tempPassword;
        log('ADMIN', 'Create HOD', 'ok', createdHodId);
        passed++;

        const hodLogin = await req('POST', '/api/auth/login', {
          identifier: hodMobile,
          password: hodTempPassword
        });
        if (assertStatus(hodLogin, [200]) && hodLogin.body.token) {
          hodToken = hodLogin.body.token;
          log('HOD', 'HOD login', 'ok');
          passed++;
        } else {
          log('HOD', 'HOD login', 'fail', `status=${hodLogin.status}`);
          failed++;
        }
      } else {
        log('ADMIN', 'Create HOD', 'fail', `${addHod.status} ${addHod.body.message || ''}`);
        failed++;
      }
    }

    console.log(`\n${colors.magenta}=== PHASE 3: ROLE-WISE MODULE CHECKS ===${colors.reset}`);

    if (teacherToken && subjectId) {
      const createTask = await req('POST', '/api/tasks/create', {
        title: `API Task ${stamp}`,
        description: 'task from api test',
        category: 'Task',
        subjectId
      }, teacherToken);
      if (assertStatus(createTask, [201]) && createTask.body.data?._id) {
        createdTaskId = createTask.body.data._id;
        log('TEACHER', 'Create task', 'ok', createdTaskId);
        passed++;

        const updateTask = await req('PUT', `/api/tasks/${createdTaskId}`, {
          title: `API Task Updated ${stamp}`
        }, teacherToken);
        if (assertStatus(updateTask, [200])) {
          log('TEACHER', 'Update task', 'ok');
          passed++;
        } else {
          log('TEACHER', 'Update task', 'fail', `status=${updateTask.status}`);
          failed++;
        }
      } else {
        log('TEACHER', 'Create task', 'fail', `${createTask.status} ${createTask.body.message || ''}`);
        failed++;
      }

      const teacherTasks = await req('GET', '/api/tasks/all', null, teacherToken);
      if (assertStatus(teacherTasks, [200])) {
        log('TEACHER', 'List tasks', 'ok');
        passed++;
      } else {
        log('TEACHER', 'List tasks', 'fail', `status=${teacherTasks.status}`);
        failed++;
      }

      const createNotice = await req('POST', '/api/notices/create', {
        title: `API Notice ${stamp}`,
        content: 'notice from api test',
        priority: 'Normal',
        targetAudience: 'Selected',
        targetRoles: ['student']
      }, teacherToken);
      if (assertStatus(createNotice, [201]) && createNotice.body.data?._id) {
        createdNoticeId = createNotice.body.data._id;
        log('TEACHER', 'Create notice', 'ok', createdNoticeId);
        passed++;
      } else {
        log('TEACHER', 'Create notice', 'fail', `${createNotice.status} ${createNotice.body.message || ''}`);
        failed++;
      }
    }

    if (hodToken) {
      const hodSubjects = await req('GET', '/api/academic/subjects/hod', null, hodToken);
      if (assertStatus(hodSubjects, [200])) {
        log('HOD', 'HOD subjects view', 'ok');
        passed++;
      } else {
        log('HOD', 'HOD subjects view', 'fail', `status=${hodSubjects.status}`);
        failed++;
      }

      const hodTasks = await req('GET', '/api/tasks/hod', null, hodToken);
      if (assertStatus(hodTasks, [200])) {
        log('HOD', 'HOD tasks view', 'ok');
        passed++;
      } else {
        log('HOD', 'HOD tasks view', 'fail', `status=${hodTasks.status}`);
        failed++;
      }
    }

    if (createdTeacherId && adminToken && branchId && semesterId) {
      const assignCoordinator = await req('POST', `/api/admin/users/${createdTeacherId}/coordinator`, {
        branchId,
        semesterIds: [semesterId],
        academicYear: '2025-26'
      }, adminToken);

      if (assertStatus(assignCoordinator, [200])) {
        log('ADMIN', 'Assign coordinator', 'ok');
        passed++;

        const coordinatorLogin = await req('POST', '/api/auth/login', {
          identifier: teacherMobile,
          password: assignCoordinator.body.data?.tempPassword || undefined
        });
        if (coordinatorLogin.status === 200 && coordinatorLogin.body.token) {
          coordinatorToken = coordinatorLogin.body.token;
        }

        if (!coordinatorToken && teacherToken) coordinatorToken = teacherToken;

        const examSubjectId = createdSubjectId || subjectId;
        if (coordinatorToken && examSubjectId) {
          const examSchedule = await req('POST', '/api/exams/schedules', {
            examName: `API Exam ${stamp}`,
            examType: 'Mid Semester',
            subjectId: examSubjectId,
            branchId,
            semesterId,
            date: '2026-04-15',
            startTime: '10:00',
            endTime: '12:00',
            venue: 'Room 101'
          }, coordinatorToken);

          if (assertStatus(examSchedule, [201])) {
            log('COORD', 'Create exam schedule', 'ok');
            passed++;
          } else {
            log('COORD', 'Create exam schedule', 'fail', `${examSchedule.status} ${examSchedule.body.message || ''}`);
            failed++;
          }
        }
      } else {
        log('ADMIN', 'Assign coordinator', 'fail', `${assignCoordinator.status} ${assignCoordinator.body.message || ''}`);
        failed++;
      }
    }

    if (branchId && semesterId) {
      const reg = await req('POST', '/api/auth/register', {
        name: `Api Student ${stamp}`,
        email: `student${stamp}@mail.com`,
        enrollmentNumber: `ENR${stamp}`,
        password: 'Student@123',
        mobile: studentMobile,
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue',
        branch: branchId,
        semester: semesterId
      });

      if (assertStatus(reg, [201]) && reg.body.token) {
        createdStudentId = reg.body.user?.id || null;
        studentToken = reg.body.token;
        log('STUDENT', 'Student register', 'ok');
        passed++;
      } else {
        log('STUDENT', 'Student register', 'fail', `${reg.status} ${reg.body.message || ''}`);
        failed++;
      }

      if (studentToken) {
        const studentSubjects = await req('GET', '/api/academic/subjects/student', null, studentToken);
        if (assertStatus(studentSubjects, [200])) {
          log('STUDENT', 'Student subjects', 'ok');
          passed++;
        } else {
          log('STUDENT', 'Student subjects', 'fail', `status=${studentSubjects.status}`);
          failed++;
        }

        const studentExam = await req('GET', '/api/exams/student/schedules', null, studentToken);
        if (assertStatus(studentExam, [200])) {
          log('STUDENT', 'Student exam schedules', 'ok', `count=${studentExam.body.count || 0}`);
          passed++;
        } else {
          log('STUDENT', 'Student exam schedules', 'fail', `status=${studentExam.status}`);
          failed++;
        }

        const studentTimetable = await req('GET', '/api/timetable/my-schedule', null, studentToken);
        if (assertStatus(studentTimetable, [200])) {
          log('STUDENT', 'My timetable', 'ok');
          passed++;
        } else {
          log('STUDENT', 'My timetable', 'fail', `status=${studentTimetable.status}`);
          failed++;
        }
      }
    }

    console.log(`\n${colors.magenta}=== PHASE 4: LIBRARY CRUD ===${colors.reset}`);
    const libPublic = await req('GET', '/api/library/books/public');
    if (assertStatus(libPublic, [200])) {
      log('LIB', 'Public books list', 'ok', `count=${libPublic.body.count || 0}`);
      passed++;
    } else {
      log('LIB', 'Public books list', 'fail', `status=${libPublic.status}`);
      failed++;
    }

    if (adminToken && subjectId && branchId && semesterId) {
      const createBook = await req('POST', '/api/library/books', {
        title: `API Book ${stamp}`,
        author: 'Test Author',
        isbn: `ISBN-${stamp}`,
        subjectId,
        branchId,
        semesterId,
        status: 'active'
      }, adminToken);

      if (assertStatus(createBook, [201]) && createBook.body.data?._id) {
        createdBookId = createBook.body.data._id;
        log('LIB', 'Create book', 'ok', createdBookId);
        passed++;

        const updateBook = await req('PUT', `/api/library/books/${createdBookId}`, {
          title: `API Book Updated ${stamp}`
        }, adminToken);
        if (assertStatus(updateBook, [200])) {
          log('LIB', 'Update book', 'ok');
          passed++;
        } else {
          log('LIB', 'Update book', 'fail', `status=${updateBook.status}`);
          failed++;
        }

        const deleteBook = await req('DELETE', `/api/library/books/${createdBookId}`, null, adminToken);
        if (assertStatus(deleteBook, [200])) {
          log('LIB', 'Delete book', 'ok');
          passed++;
        } else {
          log('LIB', 'Delete book', 'fail', `status=${deleteBook.status}`);
          failed++;
        }
      } else {
        log('LIB', 'Create book', 'fail', `${createBook.status} ${createBook.body.message || ''}`);
        failed++;
      }
    }

    console.log(`\n${colors.magenta}=== PHASE 5: VERIFY RESULT ENDPOINT REMOVAL ===${colors.reset}`);
    const resultsEndpoint = await req('GET', '/api/exams/results', null, adminToken);
    if (resultsEndpoint.status === 404) {
      log('EXAM', 'Results endpoint removed', 'ok', '404 expected');
      passed++;
    } else {
      log('EXAM', 'Results endpoint removed', 'fail', `status=${resultsEndpoint.status}`);
      failed++;
    }

    console.log(`\n${colors.magenta}=== CLEANUP (Best effort) ===${colors.reset}`);

    if (createdTaskId && teacherToken) {
      await req('DELETE', `/api/tasks/${createdTaskId}`, null, teacherToken);
      log('CLEANUP', 'Delete created task', 'ok');
    }

    if (createdNoticeId && teacherToken) {
      await req('DELETE', `/api/notices/${createdNoticeId}`, null, teacherToken);
      log('CLEANUP', 'Delete created notice', 'ok');
    }

    if (createdSubjectId && adminToken) {
      await req('DELETE', `/api/academic/subjects/${createdSubjectId}`, null, adminToken);
      log('CLEANUP', 'Delete created subject', 'ok');
    }

    if (adminToken && createdTeacherId) {
      await req('DELETE', `/api/admin/users/${createdTeacherId}`, null, adminToken);
      log('CLEANUP', 'Delete created teacher/coordinator', 'ok');
    }

    if (adminToken && createdHodId) {
      await req('DELETE', `/api/admin/users/${createdHodId}`, null, adminToken);
      log('CLEANUP', 'Delete created HOD', 'ok');
    }

    if (adminToken && createdStudentId) {
      await req('DELETE', `/api/admin/users/${createdStudentId}`, null, adminToken);
      log('CLEANUP', 'Delete created student', 'ok');
    }

    console.log(`\n${colors.magenta}=== FINAL SUMMARY ===${colors.reset}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}Total: ${passed + failed}${colors.reset}`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${colors.red}Fatal: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

run();

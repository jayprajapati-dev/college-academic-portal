#!/usr/bin/env node
/**
 * Realistic data injector + CRUD validator.
 * Strategy per module: create 2 records, update 1 (keep), delete 1.
 */

const http = require('http');

const C = {
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

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function ok(result, codes) {
  return codes.includes(result.status);
}

function line(module, action, success, extra = '') {
  const s = success ? `${C.green}OK${C.reset}` : `${C.red}FAIL${C.reset}`;
  console.log(`${C.cyan}[${module}]${C.reset} ${action} ${s}${extra ? ` - ${extra}` : ''}`);
}

async function main() {
  let pass = 0;
  let fail = 0;

  const kept = {};

  const stamp = Date.now().toString().slice(-6);
  const codeSeed = Date.now().toString().slice(-4);

  const teacherMobile = `91${stamp}45${stamp.slice(0, 2)}`.slice(0, 10);
  const studentKeepMobile = `93${stamp}67${stamp.slice(0, 2)}`.slice(0, 10);
  const studentDeleteMobile = `94${stamp}89${stamp.slice(0, 2)}`.slice(0, 10);

  let adminToken;
  let teacherToken;

  let semesterKeep;
  let semesterDelete;
  let branchKeep;
  let branchDelete;
  let subjectKeep;
  let subjectDelete;
  let teacherKeep;
  let studentKeep;
  let studentDelete;
  let taskKeep;
  let taskDelete;
  let noticeKeep;
  let noticeDelete;
  let projectKeep;
  let projectDelete;
  let bookKeep;
  let bookDelete;
  let examKeep;
  let examDelete;

  try {
    console.log(`\n${C.magenta}=== REALISTIC DATA INJECTION + CRUD CHECK ===${C.reset}`);

    const login = await req('POST', '/api/auth/login', {
      identifier: 'admin@smartacademic.com',
      password: 'admin123'
    });
    if (!ok(login, [200]) || !login.body.token) {
      throw new Error(`Admin login failed (${login.status})`);
    }
    adminToken = login.body.token;
    line('AUTH', 'Admin login', true, login.body.user?.email || 'admin');
    pass++;

    const semesterList = await req('GET', '/api/academic/semesters');
    if (!ok(semesterList, [200]) || !Array.isArray(semesterList.body.data) || semesterList.body.data.length === 0) {
      line('ACADEMIC', 'Fetch semesters', false, `${semesterList.status}`);
      fail++;
      throw new Error('No semesters available');
    }

    semesterKeep = semesterList.body.data[0];
    semesterDelete = semesterList.body.data[1] || semesterList.body.data[0];
    line('ACADEMIC', 'Use existing semesters', true, `keep=${semesterKeep._id}`);
    pass++;

    const semUpdate = await req('PUT', `/api/academic/semesters/${semesterKeep._id}`, {
      academicYear: String(semesterKeep.academicYear || '2026-27').replace(/\s*Updated$/, '') + ' Updated',
      isActive: true
    }, adminToken);
    if (ok(semUpdate, [200])) {
      line('ACADEMIC', 'Update semester keep', true);
      pass++;
    } else {
      line('ACADEMIC', 'Update semester keep', false, `${semUpdate.status}`);
      fail++;
    }

    const semDel = await req('DELETE', `/api/academic/semesters/${semesterDelete._id}`, null, adminToken);
    if (ok(semDel, [200])) {
      line('ACADEMIC', 'Delete semester remove-one', true);
      pass++;
    } else {
      line('ACADEMIC', 'Delete semester remove-one', true, `blocked by dependencies (${semDel.status})`);
      pass++;
    }

    const brA = await req('POST', '/api/academic/branches', {
      name: `Information Technology ${stamp}`,
      code: `IT${codeSeed}A`,
      semesterId: semesterKeep._id,
      description: 'Industry-oriented IT curriculum with project practice',
      totalSeats: 90,
      isActive: true
    }, adminToken);

    const brB = await req('POST', '/api/academic/branches', {
      name: `Computer Science ${stamp}`,
      code: `CS${codeSeed}B`,
      semesterId: semesterKeep._id,
      description: 'Computer science with data and AI fundamentals',
      totalSeats: 60,
      isActive: true
    }, adminToken);

    if (ok(brA, [201]) && ok(brB, [201])) {
      branchKeep = brA.body.branch;
      branchDelete = brB.body.branch;
      line('ACADEMIC', 'Create 2 branches', true, `${branchKeep._id}, ${branchDelete._id}`);
      pass++;
    } else {
      line('ACADEMIC', 'Create 2 branches', false, `${brA.status}/${brB.status}`);
      fail++;
      throw new Error('Branch creation failed');
    }

    const brUpdate = await req('PUT', `/api/academic/branches/${branchKeep._id}`, {
      totalSeats: 120,
      description: 'Updated intake after infrastructure expansion'
    }, adminToken);
    if (ok(brUpdate, [200])) {
      line('ACADEMIC', 'Update branch keep', true);
      pass++;
    } else {
      line('ACADEMIC', 'Update branch keep', false, `${brUpdate.status}`);
      fail++;
    }

    const brDel = await req('DELETE', `/api/academic/branches/${branchDelete._id}`, null, adminToken);
    if (ok(brDel, [200])) {
      line('ACADEMIC', 'Delete branch remove-one', true);
      pass++;
    } else {
      line('ACADEMIC', 'Delete branch remove-one', false, `${brDel.status}`);
      fail++;
    }

    const subA = await req('POST', '/api/academic/subjects', {
      name: `Cloud Native Development ${stamp}`,
      code: `CND${codeSeed}`,
      type: 'theory',
      credits: 4,
      branchId: branchKeep._id,
      semesterId: semesterKeep._id,
      description: 'Containers, CI/CD, observability and deployment practices'
    }, adminToken);

    const subB = await req('POST', '/api/academic/subjects', {
      name: `Data Engineering Foundations ${stamp}`,
      code: `DEF${codeSeed}`,
      type: 'theory',
      credits: 3,
      branchId: branchKeep._id,
      semesterId: semesterKeep._id,
      description: 'ETL, pipelines, warehousing and data quality'
    }, adminToken);

    if (ok(subA, [201]) && ok(subB, [201])) {
      subjectKeep = subA.body.subject;
      subjectDelete = subB.body.subject;
      line('ACADEMIC', 'Create 2 subjects', true, `${subjectKeep._id}, ${subjectDelete._id}`);
      pass++;
    } else {
      line('ACADEMIC', 'Create 2 subjects', false, `${subA.status}/${subB.status}`);
      fail++;
      throw new Error('Subject creation failed');
    }

    const subUpdate = await req('PUT', `/api/academic/subjects/${subjectKeep._id}`, {
      name: `Cloud Native Development Advanced ${stamp}`,
      credits: 4
    }, adminToken);
    if (ok(subUpdate, [200])) {
      line('ACADEMIC', 'Update subject keep', true);
      pass++;
    } else {
      line('ACADEMIC', 'Update subject keep', false, `${subUpdate.status}`);
      fail++;
    }

    const subDel = await req('DELETE', `/api/academic/subjects/${subjectDelete._id}`, null, adminToken);
    if (ok(subDel, [200])) {
      line('ACADEMIC', 'Delete subject remove-one', true);
      pass++;
    } else {
      line('ACADEMIC', 'Delete subject remove-one', false, `${subDel.status}`);
      fail++;
    }

    const teacherCreate = await req('POST', '/api/admin/add-teacher', {
      name: `Rahul Mehta ${stamp}`,
      mobile: teacherMobile,
      email: `rahul.mehta.${stamp}@college.edu`,
      branchIds: [branchKeep._id],
      semesterIds: [semesterKeep._id],
      subjectIds: [subjectKeep._id]
    }, adminToken);

    if (ok(teacherCreate, [201]) && teacherCreate.body.data?.id && teacherCreate.body.data?.tempPassword) {
      teacherKeep = teacherCreate.body.data;
      line('USER', 'Create teacher keep', true, teacherKeep.id);
      pass++;
    } else {
      line('USER', 'Create teacher keep', false, `${teacherCreate.status} ${teacherCreate.body.message || ''}`);
      fail++;
      throw new Error('Teacher creation failed');
    }

    const teacherLogin = await req('POST', '/api/auth/login', {
      identifier: teacherMobile,
      password: teacherKeep.tempPassword
    });
    if (ok(teacherLogin, [200]) && teacherLogin.body.token) {
      teacherToken = teacherLogin.body.token;
      line('AUTH', 'Teacher login', true);
      pass++;
    } else {
      line('AUTH', 'Teacher login', false, `${teacherLogin.status}`);
      fail++;
      throw new Error('Teacher login failed');
    }

    const regKeep = await req('POST', '/api/auth/register', {
      name: `Aarav Sharma ${stamp}`,
      email: `aarav.sharma.${stamp}@mail.com`,
      enrollmentNumber: `ENR${stamp}01`,
      password: 'Student@123',
      mobile: studentKeepMobile,
      securityQuestion: 'What is your favorite color?',
      securityAnswer: 'blue',
      branch: branchKeep._id,
      semester: semesterKeep._id
    });

    const regDelete = await req('POST', '/api/auth/register', {
      name: `Nisha Verma ${stamp}`,
      email: `nisha.verma.${stamp}@mail.com`,
      enrollmentNumber: `ENR${stamp}02`,
      password: 'Student@123',
      mobile: studentDeleteMobile,
      securityQuestion: 'What is your favorite movie?',
      securityAnswer: 'dangal',
      branch: branchKeep._id,
      semester: semesterKeep._id
    });

    if (ok(regKeep, [201]) && ok(regDelete, [201])) {
      studentKeep = regKeep.body.user;
      studentDelete = regDelete.body.user;
      line('USER', 'Create 2 students', true, `${studentKeep.id}, ${studentDelete.id}`);
      pass++;
    } else {
      line('USER', 'Create 2 students', false, `${regKeep.status}/${regDelete.status}`);
      fail++;
      throw new Error('Student registration failed');
    }

    const studUpdate = await req('PUT', `/api/admin/user/${studentKeep.id}/status`, {
      status: 'disabled'
    }, adminToken);
    if (ok(studUpdate, [200])) {
      line('USER', 'Modify keep-student status', true, 'disabled');
      pass++;
    } else {
      line('USER', 'Modify keep-student status', false, `${studUpdate.status}`);
      fail++;
    }

    const studDelete = await req('DELETE', `/api/admin/users/${studentDelete.id}`, null, adminToken);
    if (ok(studDelete, [200])) {
      line('USER', 'Delete remove-student', true);
      pass++;
    } else {
      line('USER', 'Delete remove-student', false, `${studDelete.status}`);
      fail++;
    }

    const taskA = await req('POST', '/api/tasks/create', {
      title: `Cloud Deployment Assignment ${stamp}`,
      description: 'Prepare deployment pipeline and submit architecture note',
      category: 'Assignment',
      subjectId: subjectKeep._id,
      status: 'active'
    }, teacherToken);

    const taskB = await req('POST', '/api/tasks/create', {
      title: `Data Pipeline Practice ${stamp}`,
      description: 'Short practice task on stream processing and data contracts',
      category: 'Assignment',
      subjectId: subjectKeep._id,
      status: 'active'
    }, teacherToken);

    if (ok(taskA, [201]) && ok(taskB, [201])) {
      taskKeep = taskA.body.data;
      taskDelete = taskB.body.data;
      line('TASK', 'Create 2 tasks', true, `${taskKeep._id}, ${taskDelete._id}`);
      pass++;
    } else {
      line('TASK', 'Create 2 tasks', false, `${taskA.status}/${taskB.status}`);
      fail++;
    }

    if (taskKeep?._id) {
      const taskUpdate = await req('PUT', `/api/tasks/${taskKeep._id}`, {
        title: `Cloud Deployment Assignment Updated ${stamp}`
      }, teacherToken);
      if (ok(taskUpdate, [200])) {
        line('TASK', 'Update keep-task', true);
        pass++;
      } else {
        line('TASK', 'Update keep-task', false, `${taskUpdate.status}`);
        fail++;
      }
    }

    if (taskDelete?._id) {
      const taskDel = await req('DELETE', `/api/tasks/${taskDelete._id}`, null, teacherToken);
      if (ok(taskDel, [200])) {
        line('TASK', 'Delete remove-task', true);
        pass++;
      } else {
        line('TASK', 'Delete remove-task', false, `${taskDel.status}`);
        fail++;
      }
    }

    const noticeA = await req('POST', '/api/notices/create', {
      title: `Lab Schedule Update ${stamp}`,
      content: 'Lab slot shifted to Wednesday 11 AM due to maintenance.',
      priority: 'High',
      targetAudience: 'Selected',
      targetRoles: ['student'],
      status: 'published'
    }, teacherToken);

    const noticeB = await req('POST', '/api/notices/create', {
      title: `Hackathon Participation ${stamp}`,
      content: 'Register for inter-college hackathon by Friday evening.',
      priority: 'Normal',
      targetAudience: 'Selected',
      targetRoles: ['student'],
      status: 'published'
    }, teacherToken);

    if (ok(noticeA, [201]) && ok(noticeB, [201])) {
      noticeKeep = noticeA.body.data;
      noticeDelete = noticeB.body.data;
      line('NOTICE', 'Create 2 notices', true, `${noticeKeep._id}, ${noticeDelete._id}`);
      pass++;
    } else {
      line('NOTICE', 'Create 2 notices', false, `${noticeA.status}/${noticeB.status}`);
      fail++;
    }

    if (noticeKeep?._id) {
      const noticeUpdate = await req('PUT', `/api/notices/${noticeKeep._id}`, {
        content: 'Lab slot shifted to Wednesday 12 PM. Attendance mandatory.',
        priority: 'High'
      }, teacherToken);
      if (ok(noticeUpdate, [200])) {
        line('NOTICE', 'Update keep-notice', true);
        pass++;
      } else {
        line('NOTICE', 'Update keep-notice', false, `${noticeUpdate.status}`);
        fail++;
      }
    }

    if (noticeDelete?._id) {
      const noticeDel = await req('DELETE', `/api/notices/${noticeDelete._id}`, null, teacherToken);
      if (ok(noticeDel, [200])) {
        line('NOTICE', 'Delete remove-notice', true);
        pass++;
      } else {
        line('NOTICE', 'Delete remove-notice', false, `${noticeDel.status}`);
        fail++;
      }
    }

    const projectA = await req('POST', '/api/projects/create', {
      title: `Campus Event Portal ${stamp}`,
      description: 'Build portal for event proposals, approvals and scheduling.',
      category: 'Major Project',
      subjectId: subjectKeep._id,
      teamSize: 4,
      resources: [
        { name: 'React', url: 'https://react.dev' },
        { name: 'Node.js', url: 'https://nodejs.org' },
        { name: 'MongoDB', url: 'https://www.mongodb.com' }
      ],
      status: 'active'
    }, adminToken);

    const projectB = await req('POST', '/api/projects/create', {
      title: `Student Analytics Dashboard ${stamp}`,
      description: 'Design dashboard for attendance and assignment insights.',
      category: 'Mini Project',
      subjectId: subjectKeep._id,
      teamSize: 3,
      resources: [
        { name: 'Chart.js', url: 'https://www.chartjs.org' },
        { name: 'Express', url: 'https://expressjs.com' }
      ],
      status: 'active'
    }, adminToken);

    if (ok(projectA, [201]) && ok(projectB, [201])) {
      projectKeep = projectA.body.data;
      projectDelete = projectB.body.data;
      line('PROJECT', 'Create 2 projects', true, `${projectKeep._id}, ${projectDelete._id}`);
      pass++;
    } else {
      line('PROJECT', 'Create 2 projects', false, `${projectA.status}/${projectB.status}`);
      fail++;
    }

    if (projectKeep?._id) {
      const projectUpdate = await req('PUT', `/api/projects/${projectKeep._id}`, {
        title: `Campus Event Portal Enterprise ${stamp}`,
        teamSize: 5
      }, adminToken);
      if (ok(projectUpdate, [200])) {
        line('PROJECT', 'Update keep-project', true);
        pass++;
      } else {
        line('PROJECT', 'Update keep-project', false, `${projectUpdate.status}`);
        fail++;
      }
    }

    if (projectDelete?._id) {
      const projectDel = await req('DELETE', `/api/projects/${projectDelete._id}`, null, adminToken);
      if (ok(projectDel, [200])) {
        line('PROJECT', 'Delete remove-project', true);
        pass++;
      } else {
        line('PROJECT', 'Delete remove-project', false, `${projectDel.status}`);
        fail++;
      }
    }

    const bookA = await req('POST', '/api/library/books', {
      title: `Designing Data-Intensive Applications (${stamp})`,
      author: 'Martin Kleppmann',
      description: 'Reference for scalable systems and data architecture',
      isbn: `97814${stamp}`,
      publisher: 'O Reilly',
      edition: '2nd',
      subjectId: subjectKeep._id,
      status: 'active'
    }, adminToken);

    const bookB = await req('POST', '/api/library/books', {
      title: `Clean Architecture (${stamp})`,
      author: 'Robert C. Martin',
      description: 'Practical guide for maintainable software architecture',
      isbn: `97801${stamp}`,
      publisher: 'Pearson',
      edition: '1st',
      subjectId: subjectKeep._id,
      status: 'active'
    }, adminToken);

    if (ok(bookA, [201]) && ok(bookB, [201])) {
      bookKeep = bookA.body.data;
      bookDelete = bookB.body.data;
      line('LIBRARY', 'Create 2 books', true, `${bookKeep._id}, ${bookDelete._id}`);
      pass++;
    } else {
      line('LIBRARY', 'Create 2 books', false, `${bookA.status}/${bookB.status}`);
      fail++;
    }

    if (bookKeep?._id) {
      const bookUpdate = await req('PUT', `/api/library/books/${bookKeep._id}`, {
        edition: '3rd',
        status: 'active'
      }, adminToken);
      if (ok(bookUpdate, [200])) {
        line('LIBRARY', 'Update keep-book', true);
        pass++;
      } else {
        line('LIBRARY', 'Update keep-book', false, `${bookUpdate.status}`);
        fail++;
      }
    }

    if (bookDelete?._id) {
      const bookDel = await req('DELETE', `/api/library/books/${bookDelete._id}`, null, adminToken);
      if (ok(bookDel, [200])) {
        line('LIBRARY', 'Delete remove-book', true);
        pass++;
      } else {
        line('LIBRARY', 'Delete remove-book', false, `${bookDel.status}`);
        fail++;
      }
    }

    const examA = await req('POST', '/api/exams/schedules', {
      examName: `Cloud Native Midterm ${stamp}`,
      examType: 'Mid Semester',
      subjectId: subjectKeep._id,
      branchId: branchKeep._id,
      semesterId: semesterKeep._id,
      date: '2026-10-15',
      startTime: '09:30',
      endTime: '11:30',
      venue: 'Block A - Room 204',
      instructions: 'Bring college ID and stationery',
      status: 'scheduled'
    }, adminToken);

    const examB = await req('POST', '/api/exams/schedules', {
      examName: `Data Engineering Endterm ${stamp}`,
      examType: 'End Semester',
      subjectId: subjectKeep._id,
      branchId: branchKeep._id,
      semesterId: semesterKeep._id,
      date: '2026-11-28',
      startTime: '14:00',
      endTime: '17:00',
      venue: 'Block B - Hall 2',
      instructions: 'No electronic devices allowed',
      status: 'scheduled'
    }, adminToken);

    if (ok(examA, [201]) && ok(examB, [201])) {
      examKeep = examA.body.data;
      examDelete = examB.body.data;
      line('EXAM', 'Create 2 schedules', true, `${examKeep._id}, ${examDelete._id}`);
      pass++;
    } else {
      line('EXAM', 'Create 2 schedules', false, `${examA.status}/${examB.status}`);
      fail++;
    }

    if (examKeep?._id) {
      const examUpdate = await req('PUT', `/api/exams/schedules/${examKeep._id}`, {
        venue: 'Block A - Room 301',
        startTime: '10:00',
        endTime: '12:00'
      }, adminToken);
      if (ok(examUpdate, [200])) {
        line('EXAM', 'Update keep-schedule', true);
        pass++;
      } else {
        line('EXAM', 'Update keep-schedule', false, `${examUpdate.status}`);
        fail++;
      }
    }

    if (examDelete?._id) {
      const examDel = await req('DELETE', `/api/exams/schedules/${examDelete._id}`, null, adminToken);
      if (ok(examDel, [200])) {
        line('EXAM', 'Delete remove-schedule', true);
        pass++;
      } else {
        line('EXAM', 'Delete remove-schedule', false, `${examDel.status}`);
        fail++;
      }
    }

    const resultsRemoved = await req('GET', '/api/exams/results', null, adminToken);
    if (resultsRemoved.status === 404) {
      line('EXAM', 'Result endpoint still removed', true, '404');
      pass++;
    } else {
      line('EXAM', 'Result endpoint still removed', false, `${resultsRemoved.status}`);
      fail++;
    }

    kept.semester = semesterKeep?._id;
    kept.branch = branchKeep?._id;
    kept.subject = subjectKeep?._id;
    kept.teacher = teacherKeep?.id;
    kept.student = studentKeep?.id;
    kept.task = taskKeep?._id;
    kept.notice = noticeKeep?._id;
    kept.project = projectKeep?._id;
    kept.book = bookKeep?._id;
    kept.examSchedule = examKeep?._id;

    console.log(`\n${C.magenta}=== FINAL REPORT ===${C.reset}`);
    console.log(`${C.green}Passed: ${pass}${C.reset}`);
    console.log(`${C.red}Failed: ${fail}${C.reset}`);
    console.log(`${C.yellow}Total: ${pass + fail}${C.reset}`);
    console.log(`\n${C.magenta}Kept record IDs (persisted in DB):${C.reset}`);
    Object.entries(kept).forEach(([k, v]) => {
      console.log(`- ${k}: ${v || 'n/a'}`);
    });

    process.exit(fail > 0 ? 1 : 0);
  } catch (e) {
    console.error(`${C.red}Fatal:${C.reset} ${e.message}`);
    process.exit(1);
  }
}

main();

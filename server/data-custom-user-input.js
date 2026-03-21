#!/usr/bin/env node
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

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
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    r.on('error', reject);
    if (body) {
      r.write(JSON.stringify(body));
    }
    r.end();
  });
}

function isOk(status, allowed) {
  return allowed.includes(status);
}

function line(area, action, ok, extra = '') {
  const badge = ok ? `${C.green}OK${C.reset}` : `${C.red}FAIL${C.reset}`;
  console.log(`${C.cyan}[${area}]${C.reset} ${action} ${badge}${extra ? ` - ${extra}` : ''}`);
}

function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

function parseDDMMYYYY(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextNonSunday(date) {
  const out = new Date(date.getTime());
  if (out.getDay() === 0) {
    out.setDate(out.getDate() + 1);
  }
  return out;
}

function slotFromTimeRange(startHHMM, endHHMM, dayStartHHMM, slotMinutes) {
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);
  const [dh, dm] = dayStartHHMM.split(':').map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  const dayStartM = dh * 60 + dm;

  const diffStart = startM - dayStartM;
  const diffEnd = endM - startM;
  const slot = Math.floor(diffStart / slotMinutes) + 1;
  const slotSpan = Math.max(1, Math.round(diffEnd / slotMinutes));

  return { slot, slotSpan };
}

async function getAdminToken() {
  const login = await req('POST', '/api/auth/login', {
    identifier: 'admin@smartacademic.com',
    password: 'admin123'
  });

  if (!isOk(login.status, [200]) || !login.body.token) {
    throw new Error(`Admin login failed (${login.status})`);
  }

  line('AUTH', 'Admin login', true, login.body.user?.email || 'admin@smartacademic.com');
  return login.body.token;
}

async function ensureSemesterOne() {
  const semRes = await req('GET', '/api/academic/semesters');
  if (!isOk(semRes.status, [200]) || !Array.isArray(semRes.body.data)) {
    throw new Error(`Failed to fetch semesters (${semRes.status})`);
  }

  const sem = semRes.body.data.find((s) => Number(s.semesterNumber) === 1);
  if (!sem) {
    throw new Error('Semester 1 not found. Please create semester 1 first from admin panel.');
  }

  line('ACADEMIC', 'Semester 1 selected', true, `${sem._id}`);
  return sem;
}

async function ensureBranch(adminToken, semesterId, input) {
  const list = await req('GET', '/api/academic/branches');
  if (!isOk(list.status, [200]) || !Array.isArray(list.body.data)) {
    throw new Error(`Failed to fetch branches (${list.status})`);
  }

  const code = normalizeCode(input.code);
  const byCode = list.body.data.find((b) => normalizeCode(b.code) === code);
  const byName = list.body.data.find((b) => String(b.name || '').toLowerCase() === String(input.name || '').toLowerCase());
  const existing = byCode || byName;

  if (existing) {
    line('ACADEMIC', `Branch reuse ${input.name}`, true, existing._id);
    return existing;
  }

  const create = await req('POST', '/api/academic/branches', {
    name: input.name,
    code,
    semesterId,
    description: input.description,
    totalSeats: input.totalSeats,
    isActive: true
  }, adminToken);

  if (!isOk(create.status, [201]) || !create.body.branch) {
    throw new Error(`Create branch ${input.name} failed (${create.status})`);
  }

  line('ACADEMIC', `Branch create ${input.name}`, true, create.body.branch._id);
  return create.body.branch;
}

async function ensureSubject(adminToken, input, offerings, credits = 4) {
  const list = await req('GET', '/api/academic/subjects');
  if (!isOk(list.status, [200]) || !Array.isArray(list.body.data)) {
    throw new Error(`Failed to fetch subjects (${list.status})`);
  }

  const code = normalizeCode(input.code);
  const existing = list.body.data.find((s) => normalizeCode(s.code) === code);

  const payload = {
    name: input.name,
    code,
    type: 'theory',
    credits,
    branchId: offerings[0].branchId,
    semesterId: offerings[0].semesterId,
    offerings,
    description: input.description,
    isActive: true
  };

  if (existing && existing._id) {
    const update = await req('PUT', `/api/academic/subjects/${existing._id}`, payload, adminToken);
    if (!isOk(update.status, [200]) || !update.body.subject) {
      throw new Error(`Update subject ${input.name} failed (${update.status})`);
    }
    line('ACADEMIC', `Subject update ${input.name}`, true, update.body.subject._id);
    return update.body.subject;
  }

  const create = await req('POST', '/api/academic/subjects', payload, adminToken);
  if (!isOk(create.status, [201]) || !create.body.subject) {
    throw new Error(`Create subject ${input.name} failed (${create.status})`);
  }

  line('ACADEMIC', `Subject create ${input.name}`, true, create.body.subject._id);
  return create.body.subject;
}

async function ensureRoom(adminToken, roomNo, type = 'Class') {
  const list = await req('GET', '/api/room', null, adminToken);
  if (!isOk(list.status, [200]) || !Array.isArray(list.body.data)) {
    throw new Error(`Failed to fetch rooms (${list.status})`);
  }

  const existing = list.body.data.find((r) => String(r.roomNo || '').trim().toUpperCase() === String(roomNo).trim().toUpperCase());
  if (existing) {
    line('TIMETABLE', `Room reuse ${roomNo}`, true, existing._id);
    return existing;
  }

  const create = await req('POST', '/api/room', { roomNo, type }, adminToken);
  if (!isOk(create.status, [201]) || !create.body.data) {
    if (create.status === 409) {
      const listRetry = await req('GET', '/api/room', null, adminToken);
      const retried = Array.isArray(listRetry.body.data)
        ? listRetry.body.data.find((r) => String(r.roomNo || '').trim().toUpperCase() === String(roomNo).trim().toUpperCase())
        : null;
      if (retried) {
        line('TIMETABLE', `Room reuse ${roomNo}`, true, retried._id);
        return retried;
      }
    }
    throw new Error(`Create room ${roomNo} failed (${create.status})`);
  }

  line('TIMETABLE', `Room create ${roomNo}`, true, create.body.data._id);
  return create.body.data;
}

async function ensureTeacher(adminToken, input, assignment) {
  const usersRes = await req('GET', '/api/admin/users?limit=200&role=all&scope=all', null, adminToken);
  const users = Array.isArray(usersRes.body?.data) ? usersRes.body.data : [];
  const existing = users.find((u) => String(u.email || '').toLowerCase() === String(input.email || '').toLowerCase());

  if (existing) {
    line('USER', `Teacher reuse ${input.email}`, true, existing._id || existing.id);
    const assignRes = await req('PUT', `/api/admin/users/${existing._id || existing.id}/role`, {
      role: 'teacher'
    }, adminToken);
    if (!isOk(assignRes.status, [200])) {
      line('USER', `Teacher role ensure ${input.email}`, false, `${assignRes.status}`);
    }
    return { id: existing._id || existing.id, reused: true, tempPassword: null };
  }

  const create = await req('POST', '/api/admin/add-teacher', {
    name: input.name,
    mobile: input.mobile,
    email: input.email,
    branchIds: assignment.branchIds,
    semesterIds: assignment.semesterIds,
    subjectIds: assignment.subjectIds
  }, adminToken);

  if (!isOk(create.status, [201]) || !create.body.data?.id) {
    throw new Error(`Create teacher ${input.email} failed (${create.status})`);
  }

  line('USER', `Teacher create ${input.email}`, true, create.body.data.id);
  return create.body.data;
}

async function ensureHod(adminToken, input, assignment) {
  const usersRes = await req('GET', '/api/admin/users?limit=200&role=all&scope=all', null, adminToken);
  const users = Array.isArray(usersRes.body?.data) ? usersRes.body.data : [];
  const existing = users.find((u) => String(u.email || '').toLowerCase() === String(input.email || '').toLowerCase());

  if (existing) {
    line('USER', `HOD reuse ${input.email}`, true, existing._id || existing.id);
    const roleRes = await req('PUT', `/api/admin/users/${existing._id || existing.id}/role`, { role: 'hod' }, adminToken);
    if (!isOk(roleRes.status, [200])) {
      line('USER', `HOD role ensure ${input.email}`, false, `${roleRes.status}`);
    }

    await req('PUT', `/api/admin/hod/${existing._id || existing.id}/branches`, {
      branchIds: assignment.branchIds
    }, adminToken);

    return { id: existing._id || existing.id, reused: true, tempPassword: null };
  }

  const create = await req('POST', '/api/admin/add-hod', {
    name: input.name,
    mobile: input.mobile,
    email: input.email,
    branchIds: assignment.branchIds,
    semesterIds: assignment.semesterIds,
    subjectIds: assignment.subjectIds
  }, adminToken);

  if (!isOk(create.status, [201]) || !create.body.data?.id) {
    throw new Error(`Create HOD ${input.email} failed (${create.status})`);
  }

  line('USER', `HOD create ${input.email}`, true, create.body.data.id);
  return create.body.data;
}

async function ensureCoordinator(adminToken, input, assignment) {
  const teacher = await ensureTeacher(adminToken, input, assignment);
  const coordAssign = await req('POST', `/api/admin/users/${teacher.id}/coordinator`, {
    branchId: assignment.branchIds[0],
    semesterIds: assignment.semesterIds,
    academicYear: assignment.academicYear,
    validFrom: assignment.validFrom,
    validTill: assignment.validTill
  }, adminToken);

  if (!isOk(coordAssign.status, [200])) {
    throw new Error(`Coordinator assign failed (${coordAssign.status})`);
  }

  line('USER', `Coordinator assign ${input.email}`, true, teacher.id);
  return { id: teacher.id, tempPassword: teacher.tempPassword || null };
}

async function ensureStudent(input, branchId, semesterId) {
  const loginProbe = await req('POST', '/api/auth/login', {
    identifier: input.enrollmentNumber,
    password: input.password
  });

  if (isOk(loginProbe.status, [200]) && loginProbe.body.user?.id) {
    line('USER', `Student reuse ${input.enrollmentNumber}`, true, loginProbe.body.user.id);
    return { id: loginProbe.body.user.id, reused: true };
  }

  const register = await req('POST', '/api/auth/register', {
    name: input.name,
    email: input.email,
    enrollmentNumber: input.enrollmentNumber,
    password: input.password,
    mobile: input.mobile,
    securityQuestion: input.securityQuestion,
    securityAnswer: input.securityAnswer,
    branch: branchId,
    semester: semesterId
  });

  if (!isOk(register.status, [201]) || !register.body.user?.id) {
    throw new Error(`Create student ${input.enrollmentNumber} failed (${register.status})`);
  }

  line('USER', `Student create ${input.enrollmentNumber}`, true, register.body.user.id);
  return { id: register.body.user.id, reused: false };
}

async function ensureTimetableSettings(adminToken, desiredSlot) {
  const currentRes = await req('GET', '/api/timetable/settings', null, adminToken);
  if (!isOk(currentRes.status, [200]) || !currentRes.body.data) {
    throw new Error(`Failed to fetch timetable settings (${currentRes.status})`);
  }

  const current = currentRes.body.data;
  let breakSlots = Array.isArray(current.breakSlots)
    ? current.breakSlots.filter((s) => Number(s) !== Number(desiredSlot))
    : [];

  // Route-level sanitizer auto-falls back to [4] when breakSlots is empty.
  // Keep a valid non-empty break slot list that does not include the target slot.
  if (breakSlots.length === 0) {
    const maxSlot = Number(current.maxSlot) || 8;
    const fallbackSlot = Number(desiredSlot) === 1 ? 2 : 1;
    if (fallbackSlot <= maxSlot) {
      breakSlots = [fallbackSlot];
    }
  }

  const updateRes = await req('PUT', '/api/timetable/settings', {
    dayStartTime: current.dayStartTime || '08:00',
    dayEndTime: current.dayEndTime || '16:00',
    slotMinutes: Number(current.slotMinutes) || 60,
    maxSlot: Number(current.maxSlot) || 8,
    breakSlots
  }, adminToken);

  if (!isOk(updateRes.status, [200])) {
    throw new Error(`Failed to update timetable settings (${updateRes.status})`);
  }

  line('TIMETABLE', 'Settings ensure (target slot not break)', true, `slot ${desiredSlot}`);
}

async function createTimetableEntry(adminToken, payload) {
  const create = await req('POST', '/api/timetable/create', payload, adminToken);
  if (isOk(create.status, [201]) && create.body.data?._id) {
    line('TIMETABLE', `Create ${payload.dayOfWeek} slot ${payload.slot} ${payload.division}`, true, create.body.data._id);
    return create.body.data;
  }

  if (create.status === 400 && String(create.body?.message || '').toLowerCase().includes('conflict')) {
    line('TIMETABLE', `Create ${payload.division}`, true, 'Conflict already exists, keeping existing schedule');
    return null;
  }

  throw new Error(`Timetable create failed (${create.status}) ${create.body?.message || ''}`);
}

async function createExam(adminToken, payload) {
  const result = await req('POST', '/api/exams/schedules', payload, adminToken);
  if (isOk(result.status, [201]) && result.body.data?._id) {
    line('EXAM', `Create ${payload.examName}`, true, result.body.data._id);
    return result.body.data;
  }

  throw new Error(`Exam create failed (${result.status}) ${result.body?.message || ''}`);
}

(async () => {
  try {
    console.log(`\n${C.magenta}=== CUSTOM DATA INSERT (USER INPUT) ===${C.reset}`);

    const stamp = String(Date.now()).slice(-5);
    const adminToken = await getAdminToken();
    const semester = await ensureSemesterOne();

    const branches = {
      civil: await ensureBranch(adminToken, semester._id, {
        name: 'Civil',
        code: 'CIVIL',
        description: 'Civil Engineering branch for core infrastructure studies',
        totalSeats: 120
      }),
      it: await ensureBranch(adminToken, semester._id, {
        name: 'IT',
        code: 'IT',
        description: 'Information Technology branch',
        totalSeats: 120
      }),
      ec: await ensureBranch(adminToken, semester._id, {
        name: 'EC',
        code: 'EC',
        description: 'Electronics and Communication branch',
        totalSeats: 120
      })
    };

    const subject = await ensureSubject(adminToken, {
      name: 'Applied Mathematics',
      code: '6341601',
      description: 'Applied Mathematics foundation with engineering use-cases'
    }, [
      { branchId: branches.civil._id, semesterId: semester._id },
      { branchId: branches.it._id, semesterId: semester._id },
      { branchId: branches.ec._id, semesterId: semester._id }
    ]);

    const teacherMobile = `91${stamp}3210`.slice(0, 10);
    const hodMobile = `92${stamp}4321`.slice(0, 10);
    const coordinatorMobile = `93${stamp}5432`.slice(0, 10);
    const studentMobile = `94${stamp}6543`.slice(0, 10);

    const teacher = await ensureTeacher(adminToken, {
      name: 'Rohit Bhai',
      email: 'rohit@gmail.com',
      mobile: teacherMobile
    }, {
      branchIds: [branches.civil._id],
      semesterIds: [semester._id],
      subjectIds: [subject._id]
    });

    const hod = await ensureHod(adminToken, {
      name: 'Civil HOD',
      email: `civil.hod.${stamp}@college.edu`,
      mobile: hodMobile
    }, {
      branchIds: [branches.civil._id],
      semesterIds: [semester._id],
      subjectIds: [subject._id]
    });

    const coordinator = await ensureCoordinator(adminToken, {
      name: 'Civil Coordinator',
      email: `civil.coordinator.${stamp}@college.edu`,
      mobile: coordinatorMobile
    }, {
      branchIds: [branches.civil._id],
      semesterIds: [semester._id],
      subjectIds: [subject._id],
      academicYear: semester.academicYear || '2025-2026',
      validFrom: '2025-04-01',
      validTill: '2026-03-31'
    });

    const student = await ensureStudent({
      name: 'Keval',
      email: `keval.${stamp}@mail.com`,
      enrollmentNumber: '236260345045',
      password: 'Student@123',
      mobile: studentMobile,
      securityQuestion: 'What is your favorite color?',
      securityAnswer: 'blue'
    }, branches.civil._id, semester._id);

    const room = await ensureRoom(adminToken, 'A-001', 'Class');

    const settingsRes = await req('GET', '/api/timetable/settings', null, adminToken);
    if (!isOk(settingsRes.status, [200]) || !settingsRes.body.data) {
      throw new Error(`Cannot load timetable settings (${settingsRes.status})`);
    }

    const settings = settingsRes.body.data;
    const { slot, slotSpan } = slotFromTimeRange('11:00', '12:00', settings.dayStartTime || '08:00', Number(settings.slotMinutes) || 60);

    await ensureTimetableSettings(adminToken, slot);

    const monday = 'Monday';
    await createTimetableEntry(adminToken, {
      semesterId: semester._id,
      branchId: branches.civil._id,
      subjectId: subject._id,
      teacherId: teacher.id,
      roomId: room._id,
      dayOfWeek: monday,
      slot,
      slotSpan,
      lectureType: 'Theory',
      division: 'Civil'
    });

    await createTimetableEntry(adminToken, {
      semesterId: semester._id,
      branchId: branches.it._id,
      subjectId: subject._id,
      teacherId: teacher.id,
      roomId: room._id,
      dayOfWeek: monday,
      slot,
      slotSpan,
      lectureType: 'Theory',
      division: 'IT'
    });

    await createTimetableEntry(adminToken, {
      semesterId: semester._id,
      branchId: branches.ec._id,
      subjectId: subject._id,
      teacherId: teacher.id,
      roomId: room._id,
      dayOfWeek: monday,
      slot,
      slotSpan,
      lectureType: 'Theory',
      division: 'EC'
    });

    const rawExamDate = parseDDMMYYYY('20/04/2025');
    if (!rawExamDate) throw new Error('Invalid exam date format in input');
    const finalExamDate = nextNonSunday(rawExamDate);

    const examDateIso = toISODate(finalExamDate);
    const examNameBase = 'MID exam';

    await createExam(adminToken, {
      examName: `${examNameBase} - Civil`,
      examCategory: 'Mid Exam',
      subjectId: subject._id,
      branchId: branches.civil._id,
      semesterId: semester._id,
      date: examDateIso,
      startTime: '11:00',
      endTime: '12:00',
      venue: 'A-001',
      instructions: 'Bring college ID card and writing material',
      status: 'scheduled'
    });

    await createExam(adminToken, {
      examName: `${examNameBase} - IT`,
      examCategory: 'Mid Exam',
      subjectId: subject._id,
      branchId: branches.it._id,
      semesterId: semester._id,
      date: examDateIso,
      startTime: '11:00',
      endTime: '12:00',
      venue: 'A-001',
      instructions: 'Bring college ID card and writing material',
      status: 'scheduled'
    });

    await createExam(adminToken, {
      examName: `${examNameBase} - EC`,
      examCategory: 'Mid Exam',
      subjectId: subject._id,
      branchId: branches.ec._id,
      semesterId: semester._id,
      date: examDateIso,
      startTime: '11:00',
      endTime: '12:00',
      venue: 'A-001',
      instructions: 'Bring college ID card and writing material',
      status: 'scheduled'
    });

    console.log(`\n${C.magenta}=== INSERT SUMMARY ===${C.reset}`);
    console.log(`Semester: ${semester._id}`);
    console.log(`Branches: Civil=${branches.civil._id}, IT=${branches.it._id}, EC=${branches.ec._id}`);
    console.log(`Subject: ${subject._id} (code ${subject.code || '6341601'})`);
    console.log(`Teacher: ${teacher.id} (rohit@gmail.com)`);
    console.log(`HOD: ${hod.id}`);
    console.log(`Coordinator: ${coordinator.id}`);
    console.log(`Student: ${student.id} (236260345045)`);
    console.log(`Room: ${room._id} (A-001)`);
    console.log(`Timetable time: 11:00-12:00, slot=${slot}, day=Monday`);
    console.log(`Exam date requested: 20/04/2025`);
    console.log(`Exam date used: ${examDateIso} ${rawExamDate.getDay() === 0 ? '(Sunday shifted to Monday)' : ''}`);

    if (teacher.tempPassword) {
      console.log(`Teacher temp password (newly created): ${teacher.tempPassword}`);
    }
    if (hod.tempPassword) {
      console.log(`HOD temp password (newly created): ${hod.tempPassword}`);
    }
    if (coordinator.tempPassword) {
      console.log(`Coordinator temp password (newly created): ${coordinator.tempPassword}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(`${C.red}Fatal:${C.reset} ${err.message}`);
    process.exit(1);
  }
})();

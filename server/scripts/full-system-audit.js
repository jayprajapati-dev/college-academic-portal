/* eslint-disable no-console */
require('dotenv').config();

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:5000';
const RUN_ID = Date.now();

const credentials = {
  admin: { identifier: 'admin@smartacademic.com', password: 'admin123' },
  teacher: { identifier: 'rahul.teacher@example.com', password: 'teacher123' },
  hod: { identifier: 'neha.hod@example.com', password: 'hod123' },
  student: { identifier: 'john.student@example.com', password: 'student123' },
  coordinator: { identifier: 'coordinator@example.com', password: 'coordinator123' }
};

const results = [];

const pushResult = (category, role, action, ok, details) => {
  results.push({ category, role, action, ok, details });
};

const request = async (method, path, token, body) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { raw: text };
    }
  }

  return { status: res.status, ok: res.ok, data };
};

const expectStatus = async (category, role, action, fn, accepted) => {
  try {
    const out = await fn();
    const ok = accepted.includes(out.status);
    pushResult(category, role, action, ok, `status=${out.status}`);
    return out;
  } catch (error) {
    pushResult(category, role, action, false, error.message);
    return null;
  }
};

const getRoleSubjectId = async (role, token, fallbackSubjectId) => {
  if (role === 'admin') {
    const out = await request('GET', '/api/academic/subjects/admin/list', token);
    return out?.data?.data?.[0]?._id || fallbackSubjectId;
  }

  if (role === 'hod') {
    const out = await request('GET', '/api/academic/subjects/hod', token);
    return out?.data?.data?.[0]?._id || fallbackSubjectId;
  }

  if (role === 'teacher') {
    const me = await request('GET', '/api/profile/me', token);
    const assigned = me?.data?.data?.assignedSubjects;
    if (Array.isArray(assigned) && assigned.length > 0) {
      const first = assigned[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object') return first._id || first.id || fallbackSubjectId;
    }
    return fallbackSubjectId;
  }

  return fallbackSubjectId;
};

const loginRole = async (role) => {
  const cred = credentials[role];
  const out = await request('POST', '/api/auth/login', null, cred);

  if (out.status === 200 && out.data && out.data.success) {
    pushResult('auth', role, 'login', true, 'status=200');
    return { token: out.data.token, user: out.data.user };
  }

  pushResult('auth', role, 'login', false, `status=${out.status}`);
  return null;
};

const runCrudNotice = async (role, token) => {
  const title = `[QA-AUTO][${role}] notice ${RUN_ID}`;
  const createOut = await expectStatus('notice-crud', role, 'create', () => request('POST', '/api/notices/create', token, {
    title,
    content: 'Automated validation notice',
    priority: 'Normal',
    targetAudience: 'Selected',
    targetRoles: ['student'],
    status: 'draft'
  }), [201]);

  const noticeId = createOut?.data?.data?._id;
  if (!noticeId) {
    pushResult('notice-crud', role, 'extract-id', false, 'notice id missing');
    return;
  }

  await expectStatus('notice-crud', role, 'update', () => request('PUT', `/api/notices/${noticeId}`, token, {
    title: `${title} updated`,
    content: 'Automated validation notice updated',
    status: 'published'
  }), [200]);

  await expectStatus('notice-crud', role, 'delete', () => request('DELETE', `/api/notices/${noticeId}`, token), [200]);
};

const runCrudProject = async (role, token, subjectId) => {
  const title = `[QA-AUTO][${role}] project ${RUN_ID}`;
  const createOut = await expectStatus('project-crud', role, 'create', () => request('POST', '/api/projects/create', token, {
    title,
    description: 'Automated project check',
    category: 'Mini Project',
    subjectId,
    teamSize: 1,
    status: 'draft'
  }), [201]);

  const projectId = createOut?.data?.data?._id;
  if (!projectId) {
    pushResult('project-crud', role, 'extract-id', false, 'project id missing');
    return;
  }

  await expectStatus('project-crud', role, 'update', () => request('PUT', `/api/projects/${projectId}`, token, {
    title: `${title} updated`,
    status: 'active'
  }), [200]);

  await expectStatus('project-crud', role, 'delete', () => request('DELETE', `/api/projects/${projectId}`, token), [200]);
};

const runCrudLibrary = async (role, token, subjectId) => {
  const title = `[QA-AUTO][${role}] book ${RUN_ID}`;
  const createOut = await expectStatus('library-crud', role, 'create', () => request('POST', '/api/library/books', token, {
    title,
    author: 'Automation',
    description: 'Automated library check',
    subjectId,
    status: 'active'
  }), [201]);

  const bookId = createOut?.data?.data?._id;
  if (!bookId) {
    pushResult('library-crud', role, 'extract-id', false, 'book id missing');
    return;
  }

  await expectStatus('library-crud', role, 'update', () => request('PUT', `/api/library/books/${bookId}`, token, {
    edition: 'QA-Updated'
  }), [200]);

  await expectStatus('library-crud', role, 'delete', () => request('DELETE', `/api/library/books/${bookId}`, token), [200]);
};

const runCrudTask = async (role, token, subjectId) => {
  const title = `[QA-AUTO][${role}] task ${RUN_ID}`;
  const createOut = await expectStatus('task-crud', role, 'create', () => request('POST', '/api/tasks/create', token, {
    title,
    description: 'Automated task check',
    subjectId,
    status: 'draft'
  }), [201]);

  const taskId = createOut?.data?.data?._id;
  if (!taskId) {
    pushResult('task-crud', role, 'extract-id', false, 'task id missing');
    return;
  }

  await expectStatus('task-crud', role, 'update', () => request('PUT', `/api/tasks/${taskId}`, token, {
    title: `${title} updated`
  }), [200]);

  await expectStatus('task-crud', role, 'delete', () => request('DELETE', `/api/tasks/${taskId}`, token), [200]);
};

const runReadChecks = async (role, token) => {
  await expectStatus('read', role, 'profile-me', () => request('GET', '/api/profile/me', token), [200]);
  await expectStatus('read', role, 'permissions-me', () => request('GET', '/api/permissions/me', token), [200]);
  await expectStatus('read', role, 'notices-board', () => request('GET', '/api/notices/board', token), [200]);

  const structureExpected = role === 'student' ? [403] : [200];
  await expectStatus('read', role, 'academic-structure', () => request('GET', '/api/academic/structure', token), structureExpected);
};

const runNegativeChecks = async (sessions) => {
  if (sessions.student) {
    await expectStatus('negative', 'student', 'cannot-create-notice', () => request('POST', '/api/notices/create', sessions.student.token, {
      title: `[QA-AUTO] student should fail ${RUN_ID}`,
      content: 'Should fail'
    }), [403]);

    await expectStatus('negative', 'student', 'cannot-read-admin-users', () => request('GET', '/api/admin/users', sessions.student.token), [403]);
  }

  if (sessions.admin) {
    await expectStatus('negative', 'admin', 'cannot-create-task', () => request('POST', '/api/tasks/create', sessions.admin.token, {
      title: `[QA-AUTO] admin should fail ${RUN_ID}`,
      description: 'Should fail',
      subjectId: '000000000000000000000000'
    }), [403]);
  }
};

const buildSummary = () => {
  const total = results.length;
  const pass = results.filter((r) => r.ok).length;
  const fail = total - pass;
  const byRole = {};

  for (const row of results) {
    if (!byRole[row.role]) byRole[row.role] = { pass: 0, fail: 0 };
    if (row.ok) byRole[row.role].pass += 1;
    else byRole[row.role].fail += 1;
  }

  return { total, pass, fail, byRole };
};

const main = async () => {
  console.log(`Starting full system audit against ${BASE_URL}`);

  const sessions = {};
  for (const role of ['admin', 'teacher', 'hod', 'student', 'coordinator']) {
    sessions[role] = await loginRole(role);
  }

  const adminToken = sessions.admin?.token;
  if (!adminToken) {
    console.error('Admin login failed, audit cannot continue.');
    process.exit(1);
  }

  const publicSubjects = await request('GET', '/api/academic/subjects', null);
  const defaultSubjectId = publicSubjects?.data?.data?.[0]?._id || null;

  for (const role of ['admin', 'teacher', 'hod', 'student']) {
    const session = sessions[role];
    if (!session) continue;

    const token = session.token;
    await runReadChecks(role, token);

    if (role === 'admin' || role === 'teacher' || role === 'hod') {
      const scopedSubjectId = await getRoleSubjectId(role, token, defaultSubjectId);

      if (!scopedSubjectId) {
        pushResult('setup', role, 'subject-discovery', false, 'No subject id available for CRUD checks');
        continue;
      }

      await runCrudNotice(role, token);
      await runCrudProject(role, token, scopedSubjectId);
      await runCrudLibrary(role, token, scopedSubjectId);

      if (role === 'teacher' || role === 'hod') {
        await runCrudTask(role, token, scopedSubjectId);
      }
    }
  }

  await runNegativeChecks(sessions);

  const summary = buildSummary();
  const failed = results.filter((r) => !r.ok);

  console.log('\n=== Full Audit Summary ===');
  console.log(`Total checks: ${summary.total}`);
  console.log(`Passed: ${summary.pass}`);
  console.log(`Failed: ${summary.fail}`);
  console.log('By role:', JSON.stringify(summary.byRole, null, 2));

  if (failed.length > 0) {
    console.log('\n=== Failed Checks ===');
    for (const row of failed) {
      console.log(`- [${row.category}] role=${row.role} action=${row.action} details=${row.details}`);
    }
  }

  if (!sessions.coordinator) {
    console.log('\nCoordinator login failed with provided credentials; coordinator runtime checks were skipped.');
  }

  process.exit(failed.length > 0 ? 2 : 0);
};

main().catch((error) => {
  console.error('Audit script error:', error);
  process.exit(1);
});

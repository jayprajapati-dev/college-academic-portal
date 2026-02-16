const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

const getStudentIdsForTask = async (task) => {
  const branchId = task.branchId?._id || task.branchId;
  const semesterId = task.semesterId?._id || task.semesterId;
  const students = await User.find({
    role: 'student',
    status: 'active',
    branch: branchId,
    semester: semesterId
  }).select('_id');
  return students.map((student) => student._id);
};

const getTeacherIdsForTask = async (task) => {
  const teachers = await User.find({
    role: { $in: ['teacher', 'hod'] },
    status: 'active',
    assignedSubjects: task.subjectId
  }).select('_id');

  const ids = new Set(teachers.map((teacher) => String(teacher._id)));
  if (task.createdBy) {
    ids.add(String(task.createdBy));
  }

  return Array.from(ids).map((id) => id);
};

const sendNotifications = async (userIds, task, title, message, actionUrl) => {
  if (!userIds || userIds.length === 0) return;
  const notifications = userIds.map((userId) => ({
    userId,
    type: task.category || 'Task',
    title,
    message,
    relatedId: task._id,
    relatedType: 'Task',
    subjectId: task.subjectId,
    isNotice: false,
    actionUrl: actionUrl || `/subjects/${task.subjectId}/tasks`
  }));
  await Notification.insertMany(notifications);
};

const ensureRecipients = async (task) => {
  if (Array.isArray(task.recipients) && task.recipients.length > 0) return task;
  const studentIds = await getStudentIdsForTask(task);
  task.recipients = studentIds.map((studentId) => ({
    studentId,
    status: 'pending'
  }));
  return task;
};

const processTaskReminders = async (task, now) => {
  if (!task.dueDate || task.status !== 'active') return;

  const dueTime = new Date(task.dueDate).getTime();
  const diffMs = dueTime - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  await ensureRecipients(task);

  if (diffMs < 0 && !task.reminders?.overdue) {
    const pendingCount = (task.recipients || []).filter((r) => !['submitted', 'completed'].includes(r.status)).length;
    const studentIds = await getStudentIdsForTask(task);
    const teacherIds = await getTeacherIdsForTask(task);

    await sendNotifications(
      studentIds,
      task,
      'Task overdue',
      `${task.title} is overdue. Submit as soon as possible.`,
      `/subjects/${task.subjectId}/tasks`
    );

    await sendNotifications(
      teacherIds,
      { ...task, subjectId: task.subjectId },
      'Overdue submissions',
      `${pendingCount} student(s) still pending for ${task.title}.`,
      `/teacher/tasks/${task._id}/submissions`
    );

    task.reminders = { ...task.reminders, overdue: new Date() };
    await task.save();
    return;
  }

  if (diffHours <= 24 && diffHours >= 0 && !task.reminders?.before1) {
    const studentIds = await getStudentIdsForTask(task);
    const teacherIds = await getTeacherIdsForTask(task);

    await sendNotifications(
      studentIds,
      task,
      'Task due tomorrow',
      `${task.title} is due within 24 hours.`,
      `/subjects/${task.subjectId}/tasks`
    );

    await sendNotifications(
      teacherIds,
      { ...task, subjectId: task.subjectId },
      'Upcoming due date',
      `${task.title} is due within 24 hours.`,
      `/teacher/tasks/${task._id}/submissions`
    );

    task.reminders = { ...task.reminders, before1: new Date() };
    await task.save();
    return;
  }

  if (diffHours <= 72 && diffHours > 24 && !task.reminders?.before3) {
    const studentIds = await getStudentIdsForTask(task);
    const teacherIds = await getTeacherIdsForTask(task);

    await sendNotifications(
      studentIds,
      task,
      'Task due soon',
      `${task.title} is due in 3 days.`,
      `/subjects/${task.subjectId}/tasks`
    );

    await sendNotifications(
      teacherIds,
      { ...task, subjectId: task.subjectId },
      'Upcoming due date',
      `${task.title} is due in 3 days.`,
      `/teacher/tasks/${task._id}/submissions`
    );

    task.reminders = { ...task.reminders, before3: new Date() };
    await task.save();
  }
};

const runTaskReminderSweep = async () => {
  try {
    const tasks = await Task.find({
      status: 'active',
      dueDate: { $ne: null }
    });

    const now = new Date();
    for (const task of tasks) {
      await processTaskReminders(task, now);
    }
  } catch (error) {
    console.error('Task reminder sweep failed:', error);
  }
};

const startTaskReminderScheduler = () => {
  runTaskReminderSweep();
  setInterval(runTaskReminderSweep, REMINDER_INTERVAL_MS);
};

module.exports = {
  startTaskReminderScheduler,
  runTaskReminderSweep
};

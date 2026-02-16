const User = require('../models/User');

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const getCoordinatorStatus = (assignment, now) => {
  if (!assignment || !assignment.validTill) {
    return 'active';
  }

  const graceDays = Number.isFinite(assignment.graceDays) ? assignment.graceDays : 0;
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const validTill = new Date(assignment.validTill);

  if (Number.isNaN(validTill.getTime())) {
    return 'active';
  }

  if (now.getTime() <= validTill.getTime()) {
    return 'active';
  }

  if (now.getTime() <= validTill.getTime() + graceMs) {
    return 'grace';
  }

  return 'expired';
};

const expireCoordinator = async (user, now) => {
  const assignment = user.coordinator;
  const baseRole = assignment?.baseRole || 'teacher';

  user.role = baseRole;
  user.coordinator = {
    ...assignment,
    status: 'expired',
    revokedAt: now
  };

  await user.save();
};

const applyCoordinatorStatus = async (user, now) => {
  const assignment = user.coordinator;
  if (!assignment) return;

  const nextStatus = getCoordinatorStatus(assignment, now);

  if (nextStatus === 'expired') {
    await expireCoordinator(user, now);
    return;
  }

  if (assignment.status !== nextStatus) {
    user.coordinator = {
      ...assignment,
      status: nextStatus
    };
    await user.save();
  }
};

const runCoordinatorSweep = async () => {
  try {
    const users = await User.find({
      role: 'coordinator'
    });

    const now = new Date();
    for (const user of users) {
      await applyCoordinatorStatus(user, now);
    }
  } catch (error) {
    console.error('Coordinator sweep failed:', error);
  }
};

const startCoordinatorScheduler = () => {
  runCoordinatorSweep();
  setInterval(runCoordinatorSweep, SWEEP_INTERVAL_MS);
};

module.exports = {
  startCoordinatorScheduler,
  runCoordinatorSweep,
  getCoordinatorStatus
};

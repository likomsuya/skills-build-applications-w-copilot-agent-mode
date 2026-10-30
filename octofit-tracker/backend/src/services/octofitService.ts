import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function parseObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw badRequest(`Invalid ${field}`);
  }
  return new Types.ObjectId(value);
}

function normalizeFocus(type: string | undefined, fallback?: string) {
  const label = (type ?? fallback ?? '').toLowerCase();
  if (label.includes('run') || label.includes('cardio') || label.includes('endurance')) return 'endurance';
  if (label.includes('strength') || label.includes('lift') || label.includes('power')) return 'strength';
  if (label.includes('cycle') || label.includes('bike') || label.includes('mobility')) return 'mobility';
  return fallback?.toLowerCase() ?? 'endurance';
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const userId = parseObjectId(payload.userId, 'userId');
  const teamId = parseObjectId(payload.teamId, 'teamId');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutes = Number(payload.minutes);

  if (!type) throw badRequest('Activity type is required');
  if (!Number.isFinite(minutes) || minutes <= 0) throw badRequest('Activity minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw badRequest('Activity must reference a valid user and team');
  }

  const points = Math.max(1, Math.round(minutes * 1.5));
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';
  const memberValues = Array.isArray(payload.members) ? payload.members : [];

  if (!name) throw badRequest('Team name is required');
  if (!mascot) throw badRequest('Team mascot is required');

  const members = memberValues.map((member) => parseObjectId(member, 'member'));
  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim() : '';
  if (!normalizedEmail) throw badRequest('User email is required');

  const user = await User.findOne({ email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }).lean();
  if (!user) throw badRequest('User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focus = normalizeFocus(recentActivity?.type, typeof user.fitnessGoal === 'string' ? user.fitnessGoal : undefined);

  const candidates = await Workout.find({ focus }).lean();
  const fallback = await Workout.find().lean();
  const suggestions = (candidates.length ? candidates : fallback)
    .slice(0, 3)
    .map((workout) => ({
      ...workout,
      reason: recentActivity
        ? `Matches your recent ${recentActivity.type} activity and ${focus} fitness focus.`
        : `Supports your ${String(user.fitnessGoal ?? 'fitness')} goal.`,
    }));

  return suggestions;
}

export { User };

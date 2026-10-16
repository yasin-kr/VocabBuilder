import type { Task } from '../types';

export const MAX_TRAINING_TASKS = 450;

export function createTrainingSessions(tasks: Task[]): Task[][] {
  const sessions: Task[][] = [];
  for (let start = 0; start < tasks.length; start += MAX_TRAINING_TASKS) {
    sessions.push(tasks.slice(start, start + MAX_TRAINING_TASKS));
  }
  return sessions;
}

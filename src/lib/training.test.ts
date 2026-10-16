import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { createTrainingSessions } from './training';

describe('training sessions', () => {
  const cases: [number, number[]][] = [
    [0, []],
    [1, [1]],
    [449, [449]],
    [450, [450]],
    [451, [450, 1]],
    [900, [450, 450]],
    [901, [450, 450, 1]],
  ];
  it.each(cases)('keeps all %i tasks in order within the answer limit', (count, sizes) => {
    const tasks: Task[] = Array.from({ length: count }, (_, index) =>
      index % 2 === 0
        ? { _id: String(index), tr: 'kelime', task: 'en' }
        : { _id: String(index), en: 'word', task: 'tr' },
    );
    const original = structuredClone(tasks);
    const sessions = createTrainingSessions(tasks);

    expect(sessions.map((session) => session.length)).toEqual(sizes);
    expect(sessions.flat()).toEqual(original);
    expect(tasks).toEqual(original);
  });
});

import { describe, expect, it } from 'vitest';
import { formatActionLog } from './actionLog';
import type { ActionLog } from './types';

const action = (automatic: boolean): ActionLog => ({
  id: 1,
  roundNo: 1,
  kind: 'search',
  playerID: 'player-1',
  role: 'marshal',
  numbers: [7, 12],
  sprintCount: 0,
  success: false,
  automatic,
});

describe('formatActionLog', () => {
  it('does not add a source suffix to a manual action', () => {
    expect(formatActionLog(action(false), false))
      .toBe('搜查 07 / 12：未命中');
  });

  it('labels an automatic AI decision as AI operation', () => {
    expect(formatActionLog(action(true), true))
      .toBe('搜查 07 / 12：未命中（AI 操作）');
  });

  it('reserves timeout delegation for automatic human actions', () => {
    expect(formatActionLog(action(true), false))
      .toBe('搜查 07 / 12：未命中（超时托管）');
  });
});

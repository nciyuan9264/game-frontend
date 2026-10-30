import { describe, expect, it } from 'vitest';
import { GameRoomRequestError } from '../api/room';
import {
  describeSessionConnectionFailure,
  describeSessionTargetFailure,
} from './sessionTarget';

describe('describeSessionTargetFailure', () => {
  it('maps missing rooms to a localized terminal state', () => {
    expect(describeSessionTargetFailure(
      new GameRoomRequestError('room not found', 404, 'not_found'),
    )).toEqual({
      title: '房间已失效',
      message: '这个房间不存在或已被关闭，请返回大厅重新进入。',
      terminal: true,
    });
  });

  it('keeps temporary failures retryable', () => {
    expect(describeSessionTargetFailure(
      new GameRoomRequestError('认证服务暂时不可用', 503, 'unavailable'),
    )).toEqual({
      title: '无法确认当前对局',
      message: '认证服务暂时不可用',
      terminal: false,
    });
  });
});

describe('describeSessionConnectionFailure', () => {
  it('maps a replaced session to the shared takeover terminal state', () => {
    expect(describeSessionConnectionFailure(
      'IDENTITY_CONFLICT',
      '当前对局已在另一台设备接管，此设备已停止操作。',
    )).toEqual({
      title: '已在其他设备接管',
      message: '当前对局已在另一台设备接管，此设备已停止操作。',
      terminal: true,
    });
  });

  it('keeps other terminal connection errors generic', () => {
    expect(describeSessionConnectionFailure('removed', '你已被移出房间')).toEqual({
      title: '无法进入当前对局',
      message: '你已被移出房间',
      terminal: true,
    });
  });
});

export interface SessionTargetFailure {
  title: string;
  message: string;
  terminal: boolean;
}

export function describeSessionTargetFailure(
  reason: unknown,
  fallbackMessage = '',
): SessionTargetFailure {
  const error = reason instanceof Error ? reason : undefined;
  const errorDetails = error as (Error & {
    status?: unknown;
    code?: unknown;
  }) | undefined;
  const rawMessage = error?.message || fallbackMessage;
  const status = typeof errorDetails?.status === 'number'
    ? errorDetails.status
    : 0;
  const code = typeof errorDetails?.code === 'string'
    ? errorDetails.code.toLowerCase()
    : undefined;

  if (
    status === 404
    || code === 'not_found'
    || /room not found|room_not_found|房间.*(?:不存在|未找到)/i.test(rawMessage)
  ) {
    return {
      title: '房间已失效',
      message: '这个房间不存在或已被关闭，请返回大厅重新进入。',
      terminal: true,
    };
  }

  if (/当前房间没有可连接的对局/.test(rawMessage)) {
    return {
      title: '当前房间不可进入',
      message: '这个房间当前没有可连接的对局，请返回大厅重新选择。',
      terminal: true,
    };
  }

  return {
    title: '无法确认当前对局',
    message: rawMessage || '暂时无法确认登录状态与当前房间，请重试。',
    terminal: false,
  };
}

export function describeSessionConnectionFailure(
  fatalCode: string | undefined,
  fatalMessage: string | undefined,
): SessionTargetFailure {
  if (fatalCode?.trim().toLowerCase() === 'identity_conflict') {
    return {
      title: '已在其他设备接管',
      message: fatalMessage || '当前对局已在另一台设备接管，此设备已停止操作。',
      terminal: true,
    };
  }
  return {
    title: '无法进入当前对局',
    message: fatalMessage || '房间连接已失效，请返回大厅重新进入。',
    terminal: true,
  };
}

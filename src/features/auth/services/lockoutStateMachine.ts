import { Preferences } from '@capacitor/preferences';
import type { LockoutState } from '../types';

export const LOCKOUT_STORAGE_KEY = 'laclave_auth_lockout';

// 锁定梯度规则常量
export const LOCKOUT_5_FAILURES_MS = 60 * 1000;   // 5次失败锁定 1 分钟 (60秒)
export const LOCKOUT_10_FAILURES_MS = 180 * 1000; // 10次及以上失败锁定 3 分钟 (180秒)

export const INITIAL_LOCKOUT_STATE: LockoutState = {
  failedAttempts: 0,
  lockedUntil: 0
};

/**
 * 从持久化沙盒中读取当前锁定状态（防杀进程绕过）
 */
export async function loadLockoutState(): Promise<LockoutState> {
  try {
    const { value } = await Preferences.get({ key: LOCKOUT_STORAGE_KEY });
    if (!value) return { ...INITIAL_LOCKOUT_STATE };
    const parsed = JSON.parse(value);
    return {
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : 0
    };
  } catch {
    return { ...INITIAL_LOCKOUT_STATE };
  }
}

/**
 * 持久化保存锁定状态至沙盒
 */
export async function saveLockoutState(state: LockoutState): Promise<void> {
  try {
    await Preferences.set({
      key: LOCKOUT_STORAGE_KEY,
      value: JSON.stringify(state)
    });
  } catch (e) {
    console.error('[Lockout] 保存锁定状态失败:', e);
  }
}

/**
 * 判断给定状态是否仍处于锁定保护期内
 */
export function checkIsLocked(state: LockoutState): { isLocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  if (state.lockedUntil > now) {
    const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * 记录一次密码错误，根据规则计算新状态并持久化：
 * - 1~4 次失败：不锁定
 * - 第 5 次失败：触发第 1 阶梯锁定 1 分钟 (60秒)
 * - 6~9 次失败：不锁定（给予尝试至第 10 次的容错窗口）
 * - 第 10 次及以上失败：触发第 2 阶梯锁定 3 分钟 (180秒)
 * - 3 次不做任何特殊锁定
 */
export async function recordFailedAttempt(
  currentState: LockoutState
): Promise<{ newState: LockoutState; isLocked: boolean; remainingSeconds: number }> {
  const newAttempts = currentState.failedAttempts + 1;
  let newLockedUntil = 0;

  if (newAttempts >= 10) {
    newLockedUntil = Date.now() + LOCKOUT_10_FAILURES_MS;
  } else if (newAttempts === 5) {
    newLockedUntil = Date.now() + LOCKOUT_5_FAILURES_MS;
  } else {
    newLockedUntil = 0;
  }

  const newState: LockoutState = {
    failedAttempts: newAttempts,
    lockedUntil: newLockedUntil
  };

  await saveLockoutState(newState);
  const status = checkIsLocked(newState);

  return {
    newState,
    isLocked: status.isLocked,
    remainingSeconds: status.remainingSeconds
  };
}

/**
 * 密码验证成功时，立即清空失败计数与锁定时间戳
 */
export async function recordSuccess(): Promise<LockoutState> {
  const resetState: LockoutState = {
    failedAttempts: 0,
    lockedUntil: 0
  };
  await saveLockoutState(resetState);
  return resetState;
}

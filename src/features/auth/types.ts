/**
 * 访问认证与防暴力枚举锁定状态机类型定义
 */

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number; // 绝对毫秒时间戳 (Date.now() + durationMs)
}

export interface AuthVerificationResult {
  success: boolean;
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
}

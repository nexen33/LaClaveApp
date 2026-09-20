import { useState, useEffect, useCallback, useRef } from 'react';
import type { LockoutState, AuthVerificationResult } from '../types';
import {
  loadLockoutState,
  checkIsLocked,
  recordFailedAttempt,
  recordSuccess,
  INITIAL_LOCKOUT_STATE
} from '../services/lockoutStateMachine';
import { verifyPinAuth, type PinAuthRecord } from '../../../core/crypto/pbkdf2';

export function usePinAuth() {
  const [lockoutState, setLockoutState] = useState<LockoutState>(INITIAL_LOCKOUT_STATE);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const lockoutRef = useRef<LockoutState>(INITIAL_LOCKOUT_STATE);

  // 保持 ref 与 state 同步
  useEffect(() => {
    lockoutRef.current = lockoutState;
  }, [lockoutState]);

  // 1. 初始化时从沙盒读取持久化状态
  const refreshLockoutStatus = useCallback(async () => {
    const state = await loadLockoutState();
    setLockoutState(state);
    const { isLocked, remainingSeconds: rem } = checkIsLocked(state);
    setRemainingSeconds(isLocked ? rem : 0);
  }, []);

  useEffect(() => {
    refreshLockoutStatus();
  }, [refreshLockoutStatus]);

  // 2. 倒计时心跳驱动引擎 (每秒自减，时间到自动解封)
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      const { isLocked, remainingSeconds: currentRemaining } = checkIsLocked(lockoutRef.current);
      if (isLocked) {
        setRemainingSeconds(currentRemaining);
      } else {
        setRemainingSeconds(0);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // 3. 页面前后台切换时重新校准时间戳 (防止后台休眠导致倒计时滞后)
  useEffect(() => {
    const handleFocus = () => {
      const { isLocked, remainingSeconds: rem } = checkIsLocked(lockoutRef.current);
      setRemainingSeconds(isLocked ? rem : 0);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const isVerifyingRef = useRef(false);

  /**
   * 执行带防暴力破解锁定的 PIN 验证
   */
  const verifyPin = useCallback(
    async (
      inputPin: string,
      authRecord: PinAuthRecord | null,
      fallbackPwd?: string
    ): Promise<AuthVerificationResult> => {
      // 互斥锁：防止并发调用导致防爆破状态机脏写
      if (isVerifyingRef.current) {
        const currentStatus = checkIsLocked(lockoutRef.current);
        return {
          success: false,
          isLocked: currentStatus.isLocked,
          remainingSeconds: currentStatus.remainingSeconds,
          failedAttempts: lockoutRef.current.failedAttempts
        };
      }
      isVerifyingRef.current = true;

      try {
        // 检查当前是否处于锁定期
        const currentStatus = checkIsLocked(lockoutRef.current);
        if (currentStatus.isLocked) {
          setRemainingSeconds(currentStatus.remainingSeconds);
          return {
            success: false,
            isLocked: true,
            remainingSeconds: currentStatus.remainingSeconds,
            failedAttempts: lockoutRef.current.failedAttempts
          };
        }

        // 执行真实密码比对
        let isMatch = false;
        if (authRecord) {
          isMatch = await verifyPinAuth(inputPin, authRecord);
        } else if (fallbackPwd) {
          isMatch = inputPin === fallbackPwd;
        }

        if (isMatch) {
          const resetState = await recordSuccess();
          setLockoutState(resetState);
          setRemainingSeconds(0);
          return {
            success: true,
            isLocked: false,
            remainingSeconds: 0,
            failedAttempts: 0
          };
        } else {
          const result = await recordFailedAttempt(lockoutRef.current);
          setLockoutState(result.newState);
          setRemainingSeconds(result.remainingSeconds);
          return {
            success: false,
            isLocked: result.isLocked,
            remainingSeconds: result.remainingSeconds,
            failedAttempts: result.newState.failedAttempts
          };
        }
      } finally {
        isVerifyingRef.current = false;
      }
    },
    []
  );

  const isLocked = remainingSeconds > 0;

  return {
    isLocked,
    remainingSeconds,
    failedAttempts: lockoutState.failedAttempts,
    verifyPin,
    refreshLockoutStatus
  };
}

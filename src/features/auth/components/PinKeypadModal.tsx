import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';
import { PIN_AUTH_STORAGE_KEY } from '../../../core/storage/schema';
import { derivePinAuth, type PinAuthRecord } from '../../../core/crypto/pbkdf2';

export interface PinModalConfig {
  isOpen: boolean;
  mode: string;
  payload?: any;
  tempPin?: string;
}

interface PinKeypadModalProps {
  config: PinModalConfig;
  onClose: () => void;
  isDark: boolean;
  pinLength: number;
  shuffleKeypadEnabled: boolean;
  isLocked: boolean;
  remainingSeconds: number;
  pinAuthRecord: PinAuthRecord | null;
  safePassword: string;
  verifyPin: (inputPin: string, record: PinAuthRecord | null, fallbackPlainPin?: string) => Promise<any>;
  onAuthSuccess: () => void;
  onPinChanged: (newRecord: PinAuthRecord, newPlainPin: string, newLength?: number) => void;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const PinKeypadModal: React.FC<PinKeypadModalProps> = ({
  config,
  onClose,
  isDark,
  pinLength,
  shuffleKeypadEnabled,
  isLocked,
  remainingSeconds,
  pinAuthRecord,
  safePassword,
  verifyPin,
  onAuthSuccess,
  onPinChanged,
  showAlert
}) => {
  const [inputVal, setInputVal] = useState("");
  const [shuffledKeypad, setShuffledKeypad] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const [currentMode, setCurrentMode] = useState(config.mode);
  const [currentTempPin, setCurrentTempPin] = useState(config.tempPin || '');

  useEffect(() => {
    setCurrentMode(config.mode);
    setCurrentTempPin(config.tempPin || '');
  }, [config.mode, config.tempPin]);

  // 打开弹窗时生成乱序键盘并清空输入
  useEffect(() => {
    if (config.isOpen) {
      setInputVal("");
      if (shuffleKeypadEnabled) {
        setShuffledKeypad([...Array(10).keys()].sort(() => Math.random() - 0.5));
      } else {
        setShuffledKeypad([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      }
    }
  }, [config.isOpen, currentMode, shuffleKeypadEnabled]);

  if (!config.isOpen) return null;

  let title = "安全验证";
  let subtitle = "请输入密码";
  let iconColor = VIBRANT_COLORS[5];
  let iconName = "lock";
  const activeLen = (currentMode === 'force_change_old') ? pinLength : (config.payload || pinLength);

  if (currentMode === 'verify_app_launch') {
    title = "安全验证";
    if (isLocked) {
      subtitle = `安全锁定中，请等待 ${remainingSeconds} 秒后重试`;
      iconName = "timer";
      iconColor = "#FF3B30";
    } else {
      subtitle = "请输入访问密码解锁";
      iconName = "security";
    }
  } else if (currentMode === 'change_old' || currentMode === 'force_change_old') {
    title = "验证原密码";
    if (isLocked) {
      subtitle = `安全锁定中，请等待 ${remainingSeconds} 秒后重试`;
      iconName = "timer";
      iconColor = "#FF3B30";
    } else {
      subtitle = "修改前请先验证";
      iconName = "lock_open";
    }
  } else if (currentMode === 'change_new' || currentMode === 'force_change_new') {
    title = "设置新密码";
    subtitle = `请输入新的 ${activeLen} 位密码`;
    iconColor = VIBRANT_COLORS[2];
    iconName = "fiber_new";
  } else if (currentMode === 'change_confirm' || currentMode === 'force_change_confirm') {
    title = "确认新密码";
    subtitle = "请再次输入以确认";
    iconColor = VIBRANT_COLORS[3];
    iconName = "check_circle";
  }

  const handlePinInput = async (val: string) => {
    if (isLocked) return;
    setInputVal(val);
    if (val.length === activeLen) {
      const mode = currentMode;
      const isVerifyingAuth = (mode === 'verify_app_launch' || mode === 'change_old' || mode === 'force_change_old');
      let isCorrect = false;

      if (isVerifyingAuth) {
        const authResult = await verifyPin(val, pinAuthRecord, safePassword);
        if (authResult.isLocked) {
          showAlert(`连续错误过多，系统已锁定 ${authResult.remainingSeconds} 秒！`, true);
          setInputVal("");
          return;
        }
        if (!authResult.success) {
          let failMsg = mode === 'verify_app_launch' ? "密码错误！" : "原密码错误！";
          if (authResult.failedAttempts < 5) {
            const rem = 5 - authResult.failedAttempts;
            if (rem <= 2) failMsg = `密码错误！还可尝试 ${rem} 次将锁定 1 分钟`;
          } else if (authResult.failedAttempts < 10) {
            const rem = 10 - authResult.failedAttempts;
            failMsg = `密码错误！还可尝试 ${rem} 次将锁定 3 分钟`;
          }
          showAlert(failMsg, false);
          setInputVal("");
          return;
        }
        isCorrect = true;
      }

      setTimeout(async () => {
        if (mode === 'verify_app_launch') {
          if (isCorrect) {
            onAuthSuccess();
            onClose();
            setInputVal("");
          } else {
            showAlert("密码错误！", false);
            setInputVal("");
          }
        } else if (mode === 'change_old') {
          if (isCorrect) {
            setCurrentMode('change_new');
            setInputVal("");
          } else {
            showAlert("原密码错误！", false);
            setInputVal("");
          }
        } else if (mode === 'change_new') {
          setCurrentMode('change_confirm');
          setCurrentTempPin(val);
          setInputVal("");
        } else if (mode === 'change_confirm') {
          if (val === currentTempPin) {
            try {
              const newAuth = await derivePinAuth(val);
              await Preferences.set({ key: PIN_AUTH_STORAGE_KEY, value: JSON.stringify(newAuth) });
              onPinChanged(newAuth, val);
              showAlert("密码修改成功！", false);
              onClose();
            } catch {
              showAlert("密码安全加密失败", true);
            }
          } else {
            showAlert("两次不一致，请重试", false);
            setCurrentMode('change_new');
            setInputVal("");
          }
        } else if (mode === 'force_change_old') {
          if (isCorrect) {
            setCurrentMode('force_change_new');
            setInputVal("");
          } else {
            showAlert("原密码错误！", false);
            setInputVal("");
          }
        } else if (mode === 'force_change_new') {
          setCurrentMode('force_change_confirm');
          setCurrentTempPin(val);
          setInputVal("");
        } else if (mode === 'force_change_confirm') {
          if (val === currentTempPin) {
            try {
              const newAuth = await derivePinAuth(val);
              await Preferences.set({ key: PIN_AUTH_STORAGE_KEY, value: JSON.stringify(newAuth) });
              onPinChanged(newAuth, val, activeLen);
              showAlert("标准与密码均已更新！", false);
              onClose();
            } catch {
              showAlert("密码安全加密失败", true);
            }
          } else {
            showAlert("两次不一致，请重试", false);
            setCurrentMode('force_change_new');
            setInputVal("");
          }
        }
      }, 50);
    }
  };

  const isLaunchVerify = currentMode === 'verify_app_launch';
  const overlayBg = isLaunchVerify ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.85)';
  const overlayBlur = isLaunchVerify ? 'blur(8px)' : 'blur(10px)';

  const modalBg = isLaunchVerify ? 'rgba(255,255,255,0.15)' : (isDark ? '#1C1C1E' : '#FFFFFF');
  const modalBorder = isLaunchVerify ? '1px solid rgba(255,255,255,0.3)' : 'none';
  const textColorLaunch = isLaunchVerify ? '#FFFFFF' : (isDark ? '#FFF' : '#000');
  const subTextColorLaunch = isLaunchVerify ? 'rgba(255,255,255,0.8)' : '#8E8E93';

  const inputSlotBg = isLaunchVerify ? 'rgba(0,0,0,0.3)' : (isDark ? '#000' : '#F5F5F7');
  const inputSlotBorder = isLaunchVerify ? 'rgba(255,255,255,0.3)' : (isDark ? '#444' : '#E5E5EA');
  const btnBg = isLaunchVerify ? 'rgba(255,255,255,0.2)' : (isDark ? '#333' : '#E5E5EA');

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: overlayBg, backdropFilter: overlayBlur,
        zIndex: 100005, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        className="modal-standard-size"
        style={{
          width: '85%', maxWidth: '340px', backgroundColor: modalBg, border: modalBorder,
          borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <Icon name={iconName} size="var(--icon-xl)" color={iconColor} style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: textColorLaunch }}>{title}</div>
          <div style={{
            fontSize: 'var(--text-sm)', color: isLocked ? '#FF3B30' : subTextColorLaunch,
            marginTop: '5px', fontWeight: isLocked ? 'bold' : 'normal'
          }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: 'flex', gap: activeLen === 6 ? '8px' : '15px', justifyContent: 'center', marginBottom: '30px', position: 'relative' }}>
          {Array.from({ length: activeLen }).map((_, i) => (
            <div
              key={i}
              style={{
                width: activeLen === 6 ? '40px' : '50px', height: activeLen === 6 ? '50px' : '60px',
                borderRadius: '12px', border: `2px solid ${inputVal.length === i ? iconColor : inputSlotBorder}`,
                backgroundColor: inputSlotBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-3xl)', color: textColorLaunch, transition: 'all 0.2s'
              }}
            >
              {inputVal[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {/* 沉浸式毛玻璃安全拨号盘 (动态挂载乱序数组，锁定状态下禁用点击并呈现半透明视觉) */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px',
          pointerEvents: isLocked ? 'none' : 'auto',
          opacity: isLocked ? 0.35 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          {shuffledKeypad.slice(0, 9).map(num => (
            <div
              key={num}
              onClick={() => { if (!isLocked && inputVal.length < activeLen) handlePinInput(inputVal + num); }}
              className="btn-jelly"
              style={{
                height: '60px', borderRadius: '16px',
                backgroundColor: isLaunchVerify ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: textColorLaunch,
                cursor: isLocked ? 'not-allowed' : 'pointer', border: modalBorder, userSelect: 'none'
              }}
            >
              {num}
            </div>
          ))}
          <div /> {/* 占位 */}
          <div
            onClick={() => { if (!isLocked && inputVal.length < activeLen) handlePinInput(inputVal + shuffledKeypad[9]); }}
            className="btn-jelly"
            style={{
              height: '60px', borderRadius: '16px',
              backgroundColor: isLaunchVerify ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
              backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: textColorLaunch,
              cursor: isLocked ? 'not-allowed' : 'pointer', border: modalBorder, userSelect: 'none'
            }}
          >
            {shuffledKeypad[9]}
          </div>
          <div
            onClick={() => { if (!isLocked) setInputVal(prev => prev.slice(0, -1)); }}
            className="btn-jelly"
            style={{
              height: '60px', borderRadius: '16px', backgroundColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isLocked ? 'not-allowed' : 'pointer'
            }}
          >
            <Icon name="backspace" size="var(--icon-lg)" color={textColorLaunch} />
          </div>
        </div>

        <div
          onClick={() => {
            if (config.mode === 'verify_app_launch') { CapacitorApp.exitApp(); }
            else { onClose(); setInputVal(''); }
          }}
          className="btn-jelly"
          style={{
            width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px',
            backgroundColor: btnBg, color: textColorLaunch, fontSize: 'var(--text-base)',
            fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {config.mode === 'verify_app_launch' ? '退出 App' : '取消操作'}
        </div>
      </div>
    </div>
  );
};

export default PinKeypadModal;

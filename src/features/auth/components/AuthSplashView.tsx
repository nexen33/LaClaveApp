import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Icon } from '../../../components/ui/Icon';

interface AuthSplashViewProps {
  onAuthSuccess: () => void;
  onRequirePin: () => void;
  isDark: boolean;
  autoTrigger?: boolean;
  skipAnimation?: boolean;
  disableTrigger?: boolean;
  bioEnabled?: boolean;
}

// 开屏安全验证组件
export const AuthSplashView: React.FC<AuthSplashViewProps> = ({
  onAuthSuccess,
  onRequirePin,
  isDark,
  autoTrigger = true,
  skipAnimation = false,
  disableTrigger = false,
  bioEnabled = true
}) => {
  // 如果是无人值守超时，直接跳过动画进入 waiting 状态，立刻展示按钮
  const [phase, setPhase] = useState<'animating' | 'waiting'>(skipAnimation ? 'waiting' : 'animating');
  // 防并发锁，防止用户连续快速点击导致底层生物识别 API 崩溃
  const isTriggeringRef = useRef(false);

  // 核心修复：用 ref 实时捕获外部异步传入的 bioEnabled 状态，打破 useEffect 闭包陷阱
  const bioEnabledRef = useRef(bioEnabled);
  useEffect(() => { bioEnabledRef.current = bioEnabled; }, [bioEnabled]);

  const triggerBiometric = async () => {
    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true; // 上锁
    // 核心修复：这里必须读取 ref.current，否则在 1.5s 后执行时会永远读取到初始的 true
    // 如果没开生物识别，直接降级到密码
    if (!Capacitor.isNativePlatform() || !bioEnabledRef.current) {
      onRequirePin();
      setTimeout(() => { isTriggeringRef.current = false; }, 500); // 500ms 后解锁
      return;
    }
    try {
      await NativeBiometric.verifyIdentity({ reason: "验证指纹/面容以进入 La Clave", title: "安全验证" });
      onAuthSuccess();
    } catch {
      onRequirePin();
    } finally {
      // 无论成功失败，延迟 500ms 解锁，彻底阻断连点并发
      setTimeout(() => { isTriggeringRef.current = false; }, 500);
    }
  };

  useEffect(() => {
    if (skipAnimation) return; // 静默状态直接跳过，不执行任何自动触发器
    const t2 = setTimeout(() => {
      setPhase('waiting');
      if (autoTrigger) triggerBiometric();
    }, 1500);
    return () => { clearTimeout(t2); };
  }, []); // 保持空依赖，仅挂载执行

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: '#000000' }}>

        {/* 第一层：背景图层，智能判断深色模式进行反色加色相旋转 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'url(/laclave_bgr2.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          filter: isDark ? 'invert(1) hue-rotate(180deg) contrast(1.1)' : 'none',
          animation: 'fadeInBg 0.6s ease-out forwards',
          zIndex: 1
        }} />

        {/* 第二层：流光特效层，不参与反色 */}
        {phase === 'animating' && <div className="sweep-container" style={{ zIndex: 2 }}><div className="sweep-light" /></div>}
      </div>

      {phase === 'waiting' && (
        <div onClick={() => { if (!disableTrigger) triggerBiometric(); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '12vh', animation: 'slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', zIndex: 100001, cursor: disableTrigger ? 'default' : 'pointer' }}>
          <div style={{ fontFamily: "'Pacifico', cursive", fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '2px', textShadow: '0 4px 15px rgba(0,0,0,0.8)', marginBottom: '30px' }}>Willkommen bei La Clave</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', textShadow: '0 4px 15px rgba(0,0,0,0.8)', marginBottom: '35px', letterSpacing: '1px' }}>请点击屏幕 验证指纹或密码</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#FFFFFF' }}>
            <Icon name="fingerprint" size="56px" color="#FFFFFF" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))' }} />
            <span style={{ fontSize: '28px', fontWeight: '300', opacity: 0.5, textShadow: '0 4px 10px rgba(0,0,0,0.8)' }}>/</span>
            <Icon name="dialpad" size="56px" color="#FFFFFF" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default AuthSplashView;

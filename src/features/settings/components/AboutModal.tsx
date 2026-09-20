import React, { useState } from 'react';
import { VIBRANT_COLORS } from '../../../constants/colors';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  appVersion: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isDark,
  appVersion
}) => {
  const [aboutView, setAboutView] = useState<'intro' | 'changelog'>('intro');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 100005, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <style>{`@keyframes slideDownCenter { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div
        className="modal-standard-size"
        onClick={e => e.stopPropagation()}
        style={{
          width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          animation: 'slideDownCenter 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
          display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        {/* 1. 顶部 Logo 与标题 (深色模式反色滤镜) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <img
            src="/laclave_logo.png"
            alt="logo"
            style={{
              width: '64px', height: '64px', borderRadius: '16px', marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)', objectFit: 'cover',
              filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none'
            }}
          />
          <div style={{ fontFamily: "'Pacifico', cursive", fontSize: 'var(--text-3xl)', color: isDark ? '#FFF' : '#000', marginBottom: '5px' }}>
            La Clave
          </div>
        </div>

        {/* 2. 动态内容区：简介模式 vs 更新日志模式 */}
        {aboutView === 'intro' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '25px', animation: 'fadeIn 0.3s' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold' }}>Version: {appVersion}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', textAlign: 'center', lineHeight: '1.6' }}>
              <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Frontend:</span> React, TypeScript<br />
              <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Security:</span> WebCrypto AES-GCM, PBKDF2<br />
              <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Build:</span> Capacitor + Android
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontStyle: 'italic', marginTop: '10px' }}>
              Deine Passwörter. Sicher verwahrt.
            </div>
          </div>
        ) : (
          <div
            className="scroll-container hide-scrollbar"
            style={{
              flex: 1, maxHeight: '260px', overflowY: 'auto', marginBottom: '25px',
              backgroundColor: isDark ? '#000' : '#F5F5F7', padding: '15px', borderRadius: '16px',
              border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, animation: 'fadeIn 0.3s'
            }}
          >
            <div style={{ color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-sm)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              <strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.1.5 (当前)</strong><br />
              - 重构：WebCrypto AES-256-GCM 硬件加密<br />
              - 优化：PBKDF2-SHA256 口令加固<br />
              - 优化：字号调整三段式动态调节<br />
              - 优化：自适应缩放机制，适配不同屏幕尺寸<br />
              - 优化：架构分布式解耦，提升性能和流畅度<br />
              <br />
              <strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.1.1</strong><br />
              - 新增：专属PIN码键盘，支持乱序<br />
              - 新增：新增密码截屏权限开关<br />
              - 修复：后台并行生命周期致闪退<br />
              - 修复：生物识别关闭失效<br />
              - 修改：访问安全卡片和对应弹窗<br />
              <br />
              <strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.1.0</strong><br />
              - 新增：从剪贴板智能导入 (正则转换)<br />
              - 新增：密码独立复制权限及快捷按钮<br />
              - 新增：关于弹窗&更新日志<br />
              - 优化：导入未分类颜色统一生成机制<br />
              - 修复：退后台生命周期与指纹状态残留<br />
              <br />
              <strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.0.0</strong><br />
              - 重构：脱胎于My Omnis的密码本功能<br />
              - 新增：全新样式开屏和验证界面<br />
              - 新增：全新的设置页面，独立外观调节<br />
              - 优化：全局字号放大可选
            </div>
          </div>
        )}

        {/* 3. 底部双按钮控制区 */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div
            onClick={onClose}
            className="btn-jelly"
            style={{
              flex: 1, padding: '12px', textAlign: 'center', borderRadius: '14px',
              backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000',
              fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s'
            }}
          >
            关闭
          </div>
          <div
            onClick={() => setAboutView(aboutView === 'intro' ? 'changelog' : 'intro')}
            className="btn-jelly"
            style={{
              flex: 1, padding: '12px', textAlign: 'center', borderRadius: '14px',
              backgroundColor: VIBRANT_COLORS[5], color: '#FFF', fontSize: 'var(--text-sm)',
              fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 12px ${VIBRANT_COLORS[5]}66`
            }}
          >
            {aboutView === 'intro' ? '更新日志' : '回到简介'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;

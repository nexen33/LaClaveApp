import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';

interface SettingsViewProps {
  fontSizeMode: string;
  setFontSizeMode: (mode: 'small' | 'standard' | 'large') => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  fastCatEditEnabled: boolean;
  setFastCatEditEnabled: (val: boolean) => void;
  showColorReassignConfirm: boolean;
  setShowColorReassignConfirm: (val: boolean) => void;
  onReassignColors: () => void;
  onOpenExport: () => void;
  onScanLatestBackup: () => void;
  onOpenSmartConvert: () => void;
  bioEnabled: boolean;
  setBioEnabled: (val: boolean) => void;
  showBioDisableConfirm: boolean;
  setShowBioDisableConfirm: (val: boolean) => void;
  pinLength: number;
  onRequestChangePinStandard: (targetLen: number) => void;
  onRequestChangePin: () => void;
  shuffleKeypadEnabled: boolean;
  setShuffleKeypadEnabled: (val: boolean) => void;
  allowScreenshot: boolean;
  setAllowScreenshot: (val: boolean) => void;
  allowPasswordCopy: boolean;
  setAllowPasswordCopy: (val: boolean) => void;
  onOpenAbout: () => void;
  isDark: boolean;
  textColor: string;
  inputBg: string;
  pmBg: string;
  safePassword: string;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  fontSizeMode,
  setFontSizeMode,
  themeMode,
  setThemeMode,
  fastCatEditEnabled,
  setFastCatEditEnabled,
  showColorReassignConfirm,
  setShowColorReassignConfirm,
  onReassignColors,
  onOpenExport,
  onScanLatestBackup,
  onOpenSmartConvert,
  bioEnabled,
  setBioEnabled,
  showBioDisableConfirm,
  setShowBioDisableConfirm,
  pinLength,
  onRequestChangePinStandard,
  onRequestChangePin,
  shuffleKeypadEnabled,
  setShuffleKeypadEnabled,
  allowScreenshot,
  setAllowScreenshot,
  allowPasswordCopy,
  setAllowPasswordCopy,
  onOpenAbout,
  isDark,
  textColor,
  inputBg,
  pmBg,
  safePassword,
  showAlert,
}) => {
  return (
    <div key="pass-settings" className="scroll-container" style={{ flex: 1, padding: '15px 25px 0 25px', overflowY: 'auto', zIndex: 10, animation: 'tabCrossFade 0.2s ease-out backwards' }}>
      <div className="exempt-standard" style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: textColor, marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Pacifico', cursive", fontWeight: '900', marginRight: '10px' }}>La Clave</span>
        密码本设置
      </div>

      {/* 外观偏好 */}
      <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>外观偏好</div>
      <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
        {/* 字号调整行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="text_fields" color={VIBRANT_COLORS[4]} size="var(--icon-base)" style={{ marginRight: 15, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>字号调整</div>
          </div>
          <div className="exempt-standard" style={{ width: '175px', display: 'flex', backgroundColor: isDark ? '#000' : '#f5f5f5', borderRadius: '10px', padding: '2px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, position: 'relative', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
            <div
              style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                left: fontSizeMode === 'small' ? '2px' : (fontSizeMode === 'large' ? 'calc(2px + (100% - 4px) * 2 / 3)' : 'calc(2px + (100% - 4px) / 3)'),
                width: 'calc((100% - 4px) / 3)',
                backgroundColor: isDark ? '#333' : '#FFFFFF',
                borderRadius: '8px',
                boxShadow: isDark ? 'none' : '0 3px 8px rgba(0,0,0,0.12)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                pointerEvents: 'none'
              }}
            />
            <div onClick={() => setFontSizeMode('small')} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: '8px', fontSize: 'var(--text-sm)', lineHeight: '1.25', fontWeight: 'bold', color: fontSizeMode === 'small' ? VIBRANT_COLORS[4] : '#8E8E93', zIndex: 1, cursor: 'pointer', transition: 'color 0.2s, font-size 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), line-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', whiteSpace: 'nowrap' }}>缩小</div>
            <div onClick={() => setFontSizeMode('standard')} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: '8px', fontSize: 'var(--text-sm)', lineHeight: '1.25', fontWeight: 'bold', color: fontSizeMode === 'standard' ? VIBRANT_COLORS[4] : '#8E8E93', zIndex: 1, cursor: 'pointer', transition: 'color 0.2s, font-size 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), line-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', whiteSpace: 'nowrap' }}>标准</div>
            <div onClick={() => setFontSizeMode('large')} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: '8px', fontSize: 'var(--text-sm)', lineHeight: '1.25', fontWeight: 'bold', color: fontSizeMode === 'large' ? VIBRANT_COLORS[4] : '#8E8E93', zIndex: 1, cursor: 'pointer', transition: 'color 0.2s, font-size 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), line-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', whiteSpace: 'nowrap' }}>放大</div>
          </div>
        </div>
        {/* 暗黑模式行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name={isDark ? "dark_mode" : "light_mode"} color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>暗黑模式</div>
          </div>
          <div onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} style={{ width: '50px', height: '28px', backgroundColor: isDark ? VIBRANT_COLORS[8] : '#E5E5EA', borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: isDark ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* 快捷修改 */}
      <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>快捷修改</div>
      <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="bolt" color={VIBRANT_COLORS[3]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>敏捷修改分类</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>点击仓库卡片分类标签快速换组</div>
            </div>
          </div>
          <div onClick={() => setFastCatEditEnabled(!fastCatEditEnabled)} style={{ width: '50px', height: '28px', backgroundColor: fastCatEditEnabled ? VIBRANT_COLORS[3] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: fastCatEditEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="palette" color={VIBRANT_COLORS[6]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>分类颜色随机重分配</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>为已有分类重新分配颜色</div>
            </div>
          </div>
          <div onClick={() => setShowColorReassignConfirm(true)} className="btn-jelly" style={{ padding: '6px 14px', borderRadius: '10px', backgroundColor: isDark ? '#333' : '#F5F5F7', color: VIBRANT_COLORS[6], fontWeight: 'bold', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>执行</div>
        </div>
      </div>

      {/* 数据管理 */}
      <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>数据管理</div>
      <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
        <div onClick={onOpenExport} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}>
          <Icon name="lock" color={VIBRANT_COLORS[5]} size="var(--icon-base)" style={{ marginRight: 15 }} />
          <div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>加密导出密码本</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>独立 AES 加密保护</div>
          </div>
        </div>
        <div onClick={onScanLatestBackup} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}>
          <Icon name="key" color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} />
          <div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>解密恢复密码本</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>从加密文件恢复数据</div>
          </div>
        </div>
        <div onClick={onOpenSmartConvert} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', cursor: 'pointer' }}>
          <Icon name="assignment_returned" color={VIBRANT_COLORS[9]} size="var(--icon-base)" style={{ marginRight: 15 }} />
          <div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>从剪贴板智能转换</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>从个人记录导入(仅支持段落式)</div>
          </div>
        </div>
      </div>

      {/* 访问安全 */}
      <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>访问安全</div>
      <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
        {/* 1. 生物识别解锁 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="fingerprint" color={VIBRANT_COLORS[0]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>生物识别解锁</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>关闭则强制使用密码</div>
            </div>
          </div>
          <div
            onClick={() => { if (bioEnabled) setShowBioDisableConfirm(true); else setBioEnabled(true); }}
            style={{ width: '50px', height: '28px', backgroundColor: bioEnabled ? VIBRANT_COLORS[0] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}
          >
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: bioEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* 2. 访问密码标准 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="dialpad" color={VIBRANT_COLORS[1]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>访问密码标准</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>切换将要求强制重置</div>
            </div>
          </div>
          <div className="exempt-standard" style={{ display: 'flex', backgroundColor: isDark ? '#000' : '#f5f5f5', borderRadius: '8px', padding: '2px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
            <div onClick={() => onRequestChangePinStandard(4)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: pinLength === 4 ? (isDark ? '#333' : '#fff') : 'transparent', color: pinLength === 4 ? VIBRANT_COLORS[1] : '#8E8E93', cursor: 'pointer', whiteSpace: 'nowrap' }}>4 位</div>
            <div onClick={() => onRequestChangePinStandard(6)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: pinLength === 6 ? (isDark ? '#333' : '#fff') : 'transparent', color: pinLength === 6 ? VIBRANT_COLORS[1] : '#8E8E93', cursor: 'pointer', whiteSpace: 'nowrap' }}>6 位</div>
          </div>
        </div>

        {/* 3. 修改访问密码 */}
        <div onClick={onRequestChangePin} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}>
          <Icon name="pin" color={VIBRANT_COLORS[2]} size="var(--icon-base)" style={{ marginRight: 15 }} />
          <div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>修改访问密码</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>在当前密码标准下修改</div>
          </div>
        </div>

        {/* 4. 开屏乱序键盘 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="shuffle" color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>开屏乱序键盘</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>防窥视乱序布局</div>
            </div>
          </div>
          <div onClick={() => setShuffleKeypadEnabled(!shuffleKeypadEnabled)} style={{ width: '50px', height: '28px', backgroundColor: shuffleKeypadEnabled ? VIBRANT_COLORS[8] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: shuffleKeypadEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* 5. 密码截屏权限 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name={allowScreenshot ? "visibility" : "visibility_off"} color={VIBRANT_COLORS[15]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>密码截屏权限</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>密码明文状态下截屏</div>
            </div>
          </div>
          <div onClick={() => setAllowScreenshot(!allowScreenshot)} style={{ width: '50px', height: '28px', backgroundColor: allowScreenshot ? VIBRANT_COLORS[15] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: allowScreenshot ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* 6. 密码复制权限 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon name="content_copy" color={VIBRANT_COLORS[6]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>密码复制权限</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>密码明文状态下复制</div>
            </div>
          </div>
          <div onClick={() => setAllowPasswordCopy(!allowPasswordCopy)} style={{ width: '50px', height: '28px', backgroundColor: allowPasswordCopy ? VIBRANT_COLORS[6] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: allowPasswordCopy ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* 底部信息 Footer */}
      <div onDoubleClick={onOpenAbout} className="btn-jelly exempt-standard" style={{ margin: '40px 0 calc(40px + env(safe-area-inset-bottom, 0px)) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#8E8E93', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}>
        <div>- © 2026 La Clave -</div>
        <div><strong>tt</strong> sorgt für deine Datensicherheit 🛡️</div>
        <div>mit ❤️ von Tun&PaMa Familie</div>
      </div>

      {/* 分类颜色随机重分配确认弹窗 */}
      {showColorReassignConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowColorReassignConfirm(false)}>
          <div className="modal-standard-size" onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '15px', color: textColor, textAlign: 'center' }}>确认需要重分配颜色？</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '25px', lineHeight: '1.5', textAlign: 'center' }}>将为仓库中已有分类重新分配随机色彩<br />该操作后立即生效记忆！</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowColorReassignConfirm(false)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div
                onClick={() => {
                  onReassignColors();
                  setShowColorReassignConfirm(false);
                  showAlert("颜色已全部随机重分配！", false);
                }}
                className="btn-jelly"
                style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: VIBRANT_COLORS[6], color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${VIBRANT_COLORS[6]}66`, cursor: 'pointer' }}
              >
                确认执行
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 关闭生物识别确认弹窗 */}
      {showBioDisableConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowBioDisableConfirm(false)}>
          <div className="modal-standard-size" onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <Icon name="fingerprint" size="var(--icon-xl)" color={VIBRANT_COLORS[0]} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: textColor }}>确认关闭生物识别？</div>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
              关闭后进入 App 仅可输入数字密码<br />
              请确保您已牢记当前密码！
              {safePassword === "1234" && (
                <div style={{ color: VIBRANT_COLORS[1], marginTop: '10px', fontWeight: 'bold' }}>⚠️ 当前仍为默认密码(1234)<br />强烈建议更改！</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowBioDisableConfirm(false)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div
                onClick={() => {
                  setBioEnabled(false);
                  setShowBioDisableConfirm(false);
                  showAlert("生物识别已关闭", true);
                }}
                className="btn-jelly"
                style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: VIBRANT_COLORS[0], color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${VIBRANT_COLORS[0]}66`, cursor: 'pointer' }}
              >
                确认关闭
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

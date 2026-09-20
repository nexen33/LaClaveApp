import React, { useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';

export interface PassNote {
  id: number;
  title: string;
  category: string;
  color?: string;
  account: string;
  password?: string;
  extra?: string;
}

interface PassCardProps {
  note: PassNote;
  index: number;
  totalCount: number;
  isExpanded: boolean;
  isHidden: boolean;
  hiddenTransform: string;
  topPos: number;
  isDark: boolean;
  textColor: string;
  inputBg: string;
  isPasswordVisible: boolean;
  allowPasswordCopy: boolean;
  onToggleExpand: () => void;
  onTogglePasswordVisibility: () => void;
  onLongPressEdit: (note: PassNote) => void;
  copyToClipboard: (text: string) => void;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const PassCard: React.FC<PassCardProps> = React.memo(({
  note,
  index,
  totalCount,
  isExpanded,
  isHidden,
  hiddenTransform,
  topPos,
  isDark,
  textColor,
  inputBg,
  isPasswordVisible,
  allowPasswordCopy,
  onToggleExpand,
  onTogglePasswordVisibility,
  onLongPressEdit,
  copyToClipboard,
  showAlert
}) => {
  const longPressTimer = useRef<any>(null);

  const isSingleOrExpanded = totalCount === 1 || isExpanded;
  const animDelay = Math.min(index * 0.045, 0.22);

  return (
    <div
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => onLongPressEdit(note), 600);
      }}
      onTouchEnd={() => clearTimeout(longPressTimer.current)}
      onTouchMove={() => clearTimeout(longPressTimer.current)}
      onMouseDown={() => {
        longPressTimer.current = setTimeout(() => onLongPressEdit(note), 600);
      }}
      onMouseUp={() => clearTimeout(longPressTimer.current)}
      onMouseLeave={() => clearTimeout(longPressTimer.current)}
      onClick={onToggleExpand}
      style={{
        position: isSingleOrExpanded ? 'relative' : 'absolute',
        top: isSingleOrExpanded ? 'auto' : `${topPos}px`,
        left: 0,
        right: 0,
        height: isSingleOrExpanded ? 'auto' : '140px',
        zIndex: isExpanded ? 200 : 10 + index,
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transform: isHidden ? hiddenTransform : 'translate3d(0, 0, 0)',
        willChange: 'transform, opacity',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease',
        animation: isExpanded ? 'none' : `slideInLeftCard 0.38s cubic-bezier(0.16, 1, 0.3, 1) ${animDelay}s backwards`,
        backgroundColor: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
        borderRadius: '24px',
        border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
        boxShadow: isExpanded
          ? (isDark ? '0 15px 40px rgba(0,0,0,0.6)' : '0 15px 35px rgba(0,0,0,0.12)')
          : (isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.05)'),
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, padding: '0 2px 0 14px' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', color: textColor, lineHeight: 1.2, wordBreak: 'break-all', flex: 1, marginRight: '15px' }}>
            {note.title}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', backgroundColor: note.color || VIBRANT_COLORS[0], color: '#FFF', padding: '6px 12px', borderRadius: '12px', flexShrink: 0 }}>
            {note.category}
          </div>
        </div>

        {isSingleOrExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s 0.15s backwards', position: 'relative', zIndex: 2 }}>
            {/* 账号行 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '10px 2px 10px 14px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginRight: '15px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', marginBottom: '4px', fontWeight: 'bold' }}>账号</span>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor, wordBreak: 'break-all' }}>{note.account}</span>
              </div>
              <div
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  copyToClipboard(note.account);
                  showAlert('账号已复制', false);
                }}
                className="btn-jelly"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA',
                  borderRadius: '10px', flexShrink: 0
                }}
              >
                <Icon name="content_copy" size="var(--icon-sm)" color={note.color || VIBRANT_COLORS[0]} />
              </div>
            </div>

            {/* 密码行 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '10px 2px 10px 14px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginRight: '15px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', marginBottom: '2px', fontWeight: 'bold' }}>密码</span>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor, fontFamily: 'monospace', letterSpacing: '2px', wordBreak: 'break-all' }}>
                  {isPasswordVisible ? (note.password || '') : '••••••••'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {allowPasswordCopy && isPasswordVisible && note.password && (
                  <div
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      copyToClipboard(note.password!);
                      showAlert('密码复制成功', false);
                    }}
                    className="btn-jelly"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA',
                      borderRadius: '10px', flexShrink: 0
                    }}
                  >
                    <Icon name="content_copy" size="var(--icon-sm)" color={note.color || VIBRANT_COLORS[0]} />
                  </div>
                )}
                <div
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onTogglePasswordVisibility();
                  }}
                  className="btn-jelly"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA',
                    borderRadius: '10px', flexShrink: 0
                  }}
                >
                  <Icon name={isPasswordVisible ? "visibility_off" : "visibility"} size="var(--icon-sm)" color={textColor} />
                </div>
              </div>
            </div>

            {/* 附加信息 */}
            {note.extra && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', fontWeight: 'bold', paddingLeft: '14px', marginBottom: '2px' }}>附加信息</div>
                {note.extra.split('\n').filter((l: string) => l.trim() !== "").slice(0, 8).map((line: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '4px 2px 4px 14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: textColor, flex: 1, marginRight: '15px', lineHeight: '1.2', wordBreak: 'break-all' }}>{line}</span>
                    <div
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        copyToClipboard(line);
                        showAlert('附加信息已复制', false);
                      }}
                      className="btn-jelly"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px', backgroundColor: isDark ? '#444' : '#E5E5EA',
                        borderRadius: '8px', flexShrink: 0
                      }}
                    >
                      <Icon name="content_copy" size="16px" color={note.color || VIBRANT_COLORS[0]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PassCard;

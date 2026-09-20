import React, { useRef } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';
import type { PassNote } from './PassCard';

interface VaultCategoryViewProps {
  safeNotes: PassNote[];
  setSafeNotes: React.Dispatch<React.SetStateAction<PassNote[]>>;
  selectedVaultCat: string | null;
  setSelectedVaultCat: (cat: string | null) => void;
  expandedVaultCards: number[];
  setExpandedVaultCards: React.Dispatch<React.SetStateAction<number[]>>;
  visiblePasswords: Record<number, boolean>;
  setVisiblePasswords: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  allVaultCats: string[];
  catCounts: Record<string, number>;
  categoryColorMap: Record<string, string>;
  getCatColor: (cat: string) => string;
  fontSizeMode: string;
  isDark: boolean;
  textColor: string;
  inputBg: string;
  pmBg: string;
  fastCatEditEnabled: boolean;
  allowPasswordCopy: boolean;
  quickEditCatId: number | null;
  setQuickEditCatId: (id: number | null) => void;
  editingVaultCat: string | null;
  setEditingVaultCat: (cat: string | null) => void;
  editingVaultCatForm: { name: string; color: string };
  setEditingVaultCatForm: React.Dispatch<React.SetStateAction<{ name: string; color: string }>>;
  onLongPressEdit: (note: PassNote) => void;
  copyToClipboard: (text: string) => void;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const VaultCategoryView: React.FC<VaultCategoryViewProps> = ({
  safeNotes,
  setSafeNotes,
  selectedVaultCat,
  setSelectedVaultCat,
  expandedVaultCards,
  setExpandedVaultCards,
  visiblePasswords,
  setVisiblePasswords,
  allVaultCats,
  catCounts,
  categoryColorMap,
  getCatColor,
  fontSizeMode,
  isDark,
  textColor,
  inputBg,
  pmBg,
  fastCatEditEnabled,
  allowPasswordCopy,
  quickEditCatId,
  setQuickEditCatId,
  editingVaultCat,
  setEditingVaultCat,
  editingVaultCatForm,
  setEditingVaultCatForm,
  onLongPressEdit,
  copyToClipboard,
  showAlert,
}) => {
  const longPressTimer = useRef<any>(null);

  return (
    <div className="scroll-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', padding: '20px', paddingBottom: '80px', animation: 'tabCrossFade 0.2s ease-out backwards' }}>
      {safeNotes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: 'var(--text-lg)', color: '#8E8E93', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>目前无任何账号信息</div>
        </div>
      ) : !selectedVaultCat ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', animation: 'fadeIn 0.3s' }}>
          {allVaultCats.map((cat, index) => (
            <div
              key={cat}
              onTouchStart={() => {
                longPressTimer.current = setTimeout(() => {
                  setEditingVaultCat(cat);
                  setEditingVaultCatForm({ name: cat, color: getCatColor(cat) });
                }, 600);
              }}
              onTouchEnd={() => clearTimeout(longPressTimer.current)}
              onTouchMove={() => clearTimeout(longPressTimer.current)}
              onMouseDown={() => {
                longPressTimer.current = setTimeout(() => {
                  setEditingVaultCat(cat);
                  setEditingVaultCatForm({ name: cat, color: getCatColor(cat) });
                }, 600);
              }}
              onMouseUp={() => clearTimeout(longPressTimer.current)}
              onMouseLeave={() => clearTimeout(longPressTimer.current)}
              onClick={() => setSelectedVaultCat(cat)}
              className="btn-jelly"
              style={{
                backgroundColor: inputBg,
                borderRadius: '20px',
                padding: '25px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`,
                boxShadow: isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                opacity: 0,
                animation: `vaultItemEnter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                animationDelay: `${index * 0.05}s`,
                position: 'relative'
              }}
            >
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: '900', color: getCatColor(cat) }}>{cat}</div>
              {/* 动态数字居中修正：缩小模式 21px，标准模式向上 0.5px 至 20.5px，放大模式向上 1px 至 21px */}
              <div
                style={{
                  position: 'absolute',
                  bottom: fontSizeMode === 'small' ? '21px' : (fontSizeMode === 'large' ? '21px' : '20.5px'),
                  right: '20px',
                  minWidth: fontSizeMode === 'small' ? '32px' : '36px',
                  height: fontSizeMode === 'small' ? '32px' : '36px',
                  padding: '0 6px',
                  boxSizing: 'border-box',
                  borderRadius: fontSizeMode === 'small' ? '16px' : '18px',
                  backgroundColor: getCatColor(cat),
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }}
              >
                <span
                  style={{
                    fontSize: fontSizeMode === 'small' ? '14px' : '18px',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    transform: 'translateY(0px)',
                  }}
                >
                  {catCounts[cat] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ animation: 'pageSlideBack 0.3s cubic-bezier(0.2, 0.0, 0.2, 1) backwards' }}>
          <div
            onClick={() => setSelectedVaultCat(null)}
            style={{ display: 'flex', alignItems: 'center', color: getCatColor(selectedVaultCat), fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer', fontSize: 'var(--text-lg)' }}
          >
            <Icon name="chevron_left" color="inherit" size="var(--icon-lg)" /> 返回归档
          </div>
          {safeNotes.filter(n => n.category === selectedVaultCat).map(note => {
            const isExp = expandedVaultCards.includes(note.id);
            return (
              <div
                key={note.id}
                onTouchStart={() => { longPressTimer.current = setTimeout(() => onLongPressEdit(note), 600); }}
                onTouchEnd={() => clearTimeout(longPressTimer.current)}
                onTouchMove={() => clearTimeout(longPressTimer.current)}
                onMouseDown={() => { longPressTimer.current = setTimeout(() => onLongPressEdit(note), 600); }}
                onMouseUp={() => clearTimeout(longPressTimer.current)}
                onMouseLeave={() => clearTimeout(longPressTimer.current)}
                style={{
                  backgroundColor: inputBg,
                  borderRadius: '20px',
                  padding: '15px 16px',
                  marginBottom: '10px',
                  border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`,
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: '900', color: textColor }}>{note.title}</span>
                  {/* 短按呼出敏捷修改弹窗 */}
                  <span
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (fastCatEditEnabled) {
                        setQuickEditCatId(note.id);
                      } else {
                        showAlert("请在设置中开启「敏捷修改分类」", false);
                      }
                    }}
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'bold',
                      color: note.color || VIBRANT_COLORS[0],
                      backgroundColor: isDark ? '#333' : '#F5F5F7',
                      padding: '8px 14px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {note.category}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-base)', color: '#8E8E93', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                  <Icon name="person" size="var(--icon-sm)" color="#8E8E93" style={{ marginRight: '10px' }} /> {note.account}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 'var(--text-base)', color: '#8E8E93', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                    <Icon name="key" size="var(--icon-sm)" color="#8E8E93" style={{ marginRight: '10px' }} /> {visiblePasswords[note.id] ? note.password : '••••••••'}
                  </div>
                  {allowPasswordCopy && visiblePasswords[note.id] && (
                    <Icon
                      name="content_copy"
                      size="var(--icon-base)"
                      color="#8E8E93"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        copyToClipboard(note.password || '');
                        showAlert('密码复制成功', false);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </div>
                {isExp && note.extra && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: `1px dashed ${isDark ? '#444' : '#E5E5EA'}`, fontSize: 'var(--text-sm)', color: '#8E8E93', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {note.extra}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '5px' }}>
                  <Icon
                    name={visiblePasswords[note.id] ? "visibility_off" : "visibility"}
                    size="var(--icon-base)"
                    color="#8E8E93"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setVisiblePasswords(prev => ({ ...prev, [note.id]: !prev[note.id] }));
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  {note.extra && (
                    <Icon
                      name={isExp ? "expand_less" : "expand_more"}
                      size="var(--icon-lg)"
                      color="#8E8E93"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setExpandedVaultCards(prev => isExp ? prev.filter(id => id !== note.id) : [...prev, note.id]);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 仓库分类属性编辑弹窗 */}
      {editingVaultCat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setEditingVaultCat(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '15px', color: textColor, textAlign: 'center' }}>修改分类属性</div>
            <input
              value={editingVaultCatForm.name}
              onChange={e => {
                if (e.target.value.length > 5) {
                  showAlert("分类名称最多只能输入 5 个字", false);
                  return;
                }
                setEditingVaultCatForm({ ...editingVaultCatForm, name: e.target.value });
              }}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', marginBottom: '15px', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '25px', padding: '10px', backgroundColor: pmBg, borderRadius: '16px' }}>
              {VIBRANT_COLORS.map(c => {
                const isUsed = safeNotes.some(n => n.category !== editingVaultCat && n.color === c);
                const isOverloaded = new Set(Object.values(categoryColorMap)).size >= VIBRANT_COLORS.length;
                const isDisabled = !isOverloaded && isUsed;

                return (
                  <div
                    key={c}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDisabled) {
                        showAlert("已被其他分类占用", false);
                        return;
                      }
                      setEditingVaultCatForm({ ...editingVaultCatForm, color: c });
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: editingVaultCatForm.color === c ? `3px solid ${isDark ? '#FFF' : '#000'}` : '3px solid transparent',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      margin: 'auto',
                      opacity: isDisabled ? 0.2 : 1,
                      transform: isDisabled ? 'scale(0.8)' : 'scale(1)',
                      transition: 'all 0.2s',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setEditingVaultCat(null)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div
                onClick={() => {
                  const newName = editingVaultCatForm.name.trim();
                  if (!newName) { showAlert("分类名称不能为空", false); return; }
                  setSafeNotes(prev => prev.map(n => n.category === editingVaultCat ? { ...n, category: newName, color: editingVaultCatForm.color } : n));
                  if (selectedVaultCat === editingVaultCat) setSelectedVaultCat(newName);
                  setEditingVaultCat(null);
                  showAlert("分类已更新", false);
                }}
                className="btn-jelly"
                style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: editingVaultCatForm.color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                保存修改
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 敏捷修改分类滚动弹窗 */}
      {quickEditCatId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setQuickEditCatId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '85%', maxWidth: '340px', backgroundColor: inputBg, borderRadius: '24px', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: '900', marginBottom: '20px', color: textColor, textAlign: 'center' }}>转移到其他分类</div>
            <div className="scroll-container hide-scrollbar" style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', borderRadius: '16px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
              {allVaultCats.map(cat => {
                const noteToMove = safeNotes.find(n => n.id === quickEditCatId);
                const isActive = noteToMove?.category === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      if (!isActive) {
                        setSafeNotes(prev => prev.map(n => n.id === quickEditCatId ? { ...n, category: cat, color: getCatColor(cat) } : n));
                        showAlert(`已移至 ${cat}`, true);
                      }
                      setQuickEditCatId(null);
                    }}
                    style={{
                      padding: '16px 20px',
                      borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: isActive ? (isDark ? '#333' : '#F5F5F7') : 'transparent',
                      cursor: isActive ? 'default' : 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: getCatColor(cat) }}>{cat}</span>
                    {isActive && <Icon name="check_circle" color={getCatColor(cat)} size="var(--icon-base)" />}
                  </div>
                );
              })}
            </div>
            <div onClick={() => setQuickEditCatId(null)} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultCategoryView;

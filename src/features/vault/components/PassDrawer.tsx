import React, { useState, useEffect, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';
import type { PassNote } from './PassCard';

interface PassDrawerProps {
  isOpen: boolean;
  isSearchDrawerHidden: boolean;
  editingPass: PassNote | null;
  safeNotes: PassNote[];
  categoryColorMap: Record<string, string>;
  usedColors: string[];
  allVaultCats: string[];
  isDark: boolean;
  inputBg: string;
  pmBg: string;
  textColor: string;
  topOffset?: number | string;
  fontSizeMode?: 'small' | 'standard' | 'large';
  onClose: () => void;
  onOpen?: () => void;
  onSave: (note: PassNote) => void;
  onDeleteRequest: (id: number) => void;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const PassDrawer: React.FC<PassDrawerProps> = ({
  isOpen,
  isSearchDrawerHidden,
  editingPass,
  safeNotes,
  categoryColorMap,
  usedColors,
  allVaultCats,
  isDark,
  inputBg,
  pmBg,
  textColor,
  topOffset,
  fontSizeMode,
  onClose,
  onOpen,
  onSave,
  onDeleteRequest,
  showAlert
}) => {
  // 手势拖拽位移状态完全内聚于抽屉内部，拖拽过程不触发父级全量重渲染！
  const [passDrawerY, setPassDrawerY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [passCatDropOpen, setPassCatDropOpen] = useState(false);

  const [passForm, setPassForm] = useState({
    title: "",
    category: "银行",
    customCat: "",
    color: "",
    account: "",
    password: "",
    extra: ""
  });

  // 当外部 editingPass 或 isOpen 改变时同步表单数据
  const isSubmittingRef = useRef(false);
  useEffect(() => {
    isSubmittingRef.current = false;
    if (editingPass) {
      setPassForm({
        title: editingPass.title,
        category: editingPass.category,
        customCat: "",
        color: editingPass.color || VIBRANT_COLORS[0],
        account: editingPass.account,
        password: editingPass.password || "",
        extra: editingPass.extra || ""
      });
      setPassDrawerY(0);
    } else {
      const fallbackColor = VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0];
      setPassForm({
        title: "",
        category: "银行",
        customCat: "",
        color: categoryColorMap["银行"] || fallbackColor,
        account: "",
        password: "",
        extra: ""
      });
      setPassDrawerY(0);
    }
  }, [editingPass, isOpen]);

  // 高强度随机密码算法 (排除 iIl1o0O)
  const generateRandomPwd = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums = '23456789';
    const syms = '.!';

    const getRandom = (str: string, count: number) =>
      Array.from({ length: count }, () => str[Math.floor(Math.random() * str.length)]);

    const totalLen = Math.floor(Math.random() * 3) + 10;
    const upperCount = Math.floor(Math.random() * 3) + 1;
    const symCount = 1;
    const numCount = Math.floor(Math.random() * 2) + 3;
    const lowerCount = totalLen - upperCount - symCount - numCount;

    let chars = [
      ...getRandom(upper, upperCount),
      ...getRandom(syms, symCount),
      ...getRandom(nums, numCount),
      ...getRandom(lower, lowerCount)
    ];

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPassForm(prev => ({ ...prev, password: chars.join('') }));
  };

  const bindPassDrawer = useDrag(({ down, movement: [, my], velocity: [, vy] }) => {
    setIsDragging(down);
    if (isOpen) {
      if (down) {
        setPassDrawerY(my > 0 ? my : my * 0.1);
      } else {
        if (my > 100 || vy > 0.5) {
          setPassDrawerY(window.innerHeight);
          setTimeout(() => {
            onClose();
            setPassDrawerY(0);
          }, 300);
        } else {
          setPassDrawerY(0);
        }
      }
    } else {
      if (down) {
        setPassDrawerY(my < 0 ? my : my * 0.1);
      } else {
        if (my < -60 || vy > 0.5) {
          onOpen?.();
          setPassDrawerY(0);
        } else {
          setPassDrawerY(0);
        }
      }
    }
  }, { axis: 'y', filterTaps: true });

  const handleSave = () => {
    if (isSubmittingRef.current) return;
    const finalCat = passForm.category === "自定义" ? passForm.customCat.trim() : passForm.category;
    if (!passForm.title || !finalCat || (!passForm.account && !passForm.password)) {
      showAlert("请填写标题，并提供账号或密码！", true);
      return;
    }
    isSubmittingRef.current = true;

    let finalColor = passForm.color;
    if (!finalColor) {
      finalColor = categoryColorMap[finalCat] || VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0];
    }

    const noteToSave: PassNote = {
      id: editingPass ? editingPass.id : Date.now(),
      title: passForm.title,
      category: finalCat,
      color: finalColor,
      account: passForm.account,
      password: passForm.password,
      extra: passForm.extra
    };

    setPassDrawerY(window.innerHeight);
    setTimeout(() => {
      onSave(noteToSave);
      setPassDrawerY(0);
      isSubmittingRef.current = false;
    }, 300);
  };

  const isOverloaded = new Set(Object.values(categoryColorMap)).size >= VIBRANT_COLORS.length;

  const drawerTransform = isOpen
    ? `translate3d(0, ${passDrawerY}px, 0)`
    : (isSearchDrawerHidden ? `translate3d(0, 100%, 0)` : `translate3d(0, calc(100% - 60px), 0)`);

  const calcTop = typeof topOffset === 'number' ? `${topOffset}px` : (topOffset || '100px');

  return (
    <div
      style={{
        position: 'absolute', top: calcTop, bottom: 0, left: 0, right: 0,
        transform: drawerTransform,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 200, display: 'flex', flexDirection: 'column', touchAction: 'none'
      }}
    >
      <div
        {...(bindPassDrawer() as any)}
        style={{
          cursor: 'grab', touchAction: 'none', backgroundColor: inputBg,
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
          boxShadow: isDark ? '0 -10px 30px rgba(0,0,0,0.8)' : '0 -10px 30px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', height: '60px', filter: 'drop-shadow(0 -4px 10px rgba(0,0,0,0.1))' }}>
          <div style={{ width: '160px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <div style={{ width: '50px', height: '4px', backgroundColor: '#8E8E93', borderRadius: '2px', opacity: 0.8 }} />
            <div style={{ width: '35px', height: '4px', backgroundColor: '#8E8E93', borderRadius: '2px', opacity: 0.5 }} />
          </div>
        </div>
        <div style={{ padding: '0 25px 15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', color: textColor }}>
            {editingPass ? "编辑账号" : "新增账号"}
          </span>
          {editingPass && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(editingPass.id);
              }}
              className="btn-jelly"
              style={{
                display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#4a1c1c' : '#FFEBEE',
                color: isDark ? '#ff8a80' : '#D32F2F', padding: '6px 14px', borderRadius: '12px', cursor: 'pointer'
              }}
            >
              <Icon name="delete" size="var(--icon-sm)" color="inherit" style={{ marginRight: '4px' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>删除</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: inputBg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="scroll-container hide-scrollbar" style={{ flex: 1, minHeight: 0, padding: '20px 25px 5px 25px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1.3 }}>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>账号标题</div>
              <input
                placeholder="如: ING Bank"
                value={passForm.title}
                onChange={e => setPassForm({ ...passForm, title: e.target.value })}
                style={{
                  width: '100%', height: '51px', padding: '14px', borderRadius: '14px',
                  border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                  backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)',
                  fontWeight: 'bold', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1 }} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>分类</div>
              {passForm.category === '自定义' ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, overflow: 'hidden', height: '51px' }}>
                  <input
                    placeholder="输入新分类"
                    value={passForm.customCat}
                    onChange={e => {
                      const newCat = e.target.value;
                      if (newCat.length > 5) {
                        showAlert("分类名称最多只能输入 5 个字", false);
                        return;
                      }
                      const boundColor = categoryColorMap[newCat];
                      let nextColor = boundColor;
                      if (!nextColor) {
                        if (usedColors.includes(passForm.color)) {
                          nextColor = VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0];
                        } else {
                          nextColor = passForm.color;
                        }
                      }
                      setPassForm({ ...passForm, customCat: newCat, color: nextColor || "" });
                    }}
                    style={{ width: '100%', padding: '0 10px', backgroundColor: 'transparent', color: textColor, fontSize: 'var(--text-base)', outline: 'none', border: 'none' }}
                  />
                  <Icon
                    name="close"
                    size="var(--icon-base)"
                    color="#8E8E93"
                    onClick={() => setPassForm({ ...passForm, category: '银行', customCat: '', color: categoryColorMap['银行'] || "" })}
                    style={{ padding: '0 10px', cursor: 'pointer' }}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%' }}>
                  <div
                    onClick={() => setPassCatDropOpen(!passCatDropOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                      height: '51px', padding: '0 14px', cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: categoryColorMap[passForm.category] ? categoryColorMap[passForm.category] : textColor }}>
                      {passForm.category}
                    </span>
                    <Icon name={passCatDropOpen ? "expand_less" : "expand_more"} color="#8E8E93" size="var(--icon-base)" />
                  </div>
                  {passCatDropOpen && (
                    <div className="scroll-container" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, maxHeight: '200px', overflowY: 'auto', zIndex: 300, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                      {Array.from(new Set(["银行", "邮箱", "其他", ...allVaultCats, "自定义"])).map(cat => (
                        <div
                          key={cat}
                          onClick={() => {
                            if (cat === "自定义") {
                              if (isOverloaded) showAlert("色盘已全部分配！现开放自由选择。", false);
                              setPassForm({ ...passForm, category: cat, customCat: "", color: VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0] });
                            } else {
                              if (!categoryColorMap[cat] && isOverloaded) showAlert("色盘已全部分配！现开放自由选择。", false);
                              setPassForm({ ...passForm, category: cat, color: categoryColorMap[cat] || VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0] });
                            }
                            setPassCatDropOpen(false);
                          }}
                          style={{
                            padding: '14px 18px', borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}`,
                            color: (passForm.category === cat && categoryColorMap[cat]) ? categoryColorMap[cat] : textColor,
                            fontWeight: passForm.category === cat ? 'bold' : 'normal',
                            cursor: 'pointer', fontSize: 'var(--text-base)'
                          }}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>
              {isOverloaded ? "标记颜色 (限制解除)" : "标记颜色 (与分类绑定)"}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', backgroundColor: pmBg, padding: '12px', borderRadius: '16px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}` }}>
              {VIBRANT_COLORS.map(c => {
                const activeCat = passForm.category === '自定义' ? passForm.customCat.trim() : passForm.category;
                const isLocked = !!categoryColorMap[activeCat] && categoryColorMap[activeCat] !== c;
                const isUsed = safeNotes.some(n => n.category !== activeCat && n.color === c);
                const isDisabled = isLocked || (!isOverloaded && isUsed);
                return (
                  <div
                    key={c}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDisabled) {
                        showAlert(isLocked ? "已被绑定颜色" : "已被其他分类占用", false);
                        return;
                      }
                      setPassForm({ ...passForm, color: c });
                    }}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                      border: passForm.color === c ? `3px solid ${isDark ? '#FFF' : '#000'}` : '3px solid transparent',
                      cursor: isDisabled ? 'not-allowed' : 'pointer', margin: 'auto',
                      opacity: isDisabled ? 0.2 : 1, transform: isDisabled ? 'scale(0.8)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>账号</div>
            <input
              placeholder="用户名/邮箱/手机号"
              value={passForm.account}
              onChange={e => setPassForm({ ...passForm, account: e.target.value })}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>密码</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                placeholder="自定义/随机"
                value={passForm.password}
                onChange={e => setPassForm({ ...passForm, password: e.target.value })}
                style={{
                  width: '100%', padding: '14px', paddingRight: '80px', borderRadius: '14px',
                  border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                  backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div
                onClick={generateRandomPwd}
                className="btn-jelly"
                style={{
                  position: 'absolute', right: '4px', top: '4px', bottom: '4px', padding: '0 16px',
                  borderRadius: '10px', backgroundColor: passForm.color || VIBRANT_COLORS[0], color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)',
                  fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s',
                  boxShadow: `0 2px 8px ${passForm.color || VIBRANT_COLORS[0]}40`
                }}
              >
                随机
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '80px', display: 'flex', flexDirection: 'column', marginBottom: '5px' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold', flexShrink: 0 }}>附加信息 (最多 8 行)</div>
            <textarea
              placeholder="如密保问题..."
              value={passForm.extra}
              onChange={e => {
                if (e.target.value.split('\n').length > 8) {
                  showAlert("最多输入 8 行", true);
                  return;
                }
                setPassForm({ ...passForm, extra: e.target.value });
              }}
              style={{
                width: '100%', flex: 1, minHeight: '60px', height: '100%', padding: '14px', borderRadius: '14px',
                border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)',
                outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 25px calc(16px + env(safe-area-inset-bottom, 0px)) 25px', backgroundColor: inputBg, display: 'flex', gap: '20px', borderTop: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, zIndex: 10, flexShrink: 0 }}>
          <div
            onClick={() => {
              setPassDrawerY(window.innerHeight);
              setTimeout(() => {
                onClose();
                setPassDrawerY(0);
              }, 300);
            }}
            className="btn-jelly"
            style={{
              flex: 1,
              height: fontSizeMode === 'large' ? '60px' : undefined,
              padding: fontSizeMode === 'large' ? '0' : '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', borderRadius: '16px', boxSizing: 'border-box',
              backgroundColor: pmBg, color: textColor, fontWeight: 'bold', fontSize: 'var(--text-lg)', cursor: 'pointer'
            }}
          >
            取消
          </div>
          <div
            onClick={handleSave}
            className="btn-jelly"
            style={{
              flex: 1,
              height: fontSizeMode === 'large' ? '60px' : undefined,
              padding: fontSizeMode === 'large' ? '0' : '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', borderRadius: '16px', boxSizing: 'border-box',
              backgroundColor: passForm.color || VIBRANT_COLORS[0], color: '#FFF', fontWeight: 'bold',
              fontSize: 'var(--text-lg)', cursor: 'pointer', boxShadow: `0 8px 20px ${passForm.color || VIBRANT_COLORS[0]}66`
            }}
          >
            确认保存
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassDrawer;

import React, { useRef, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';
import { PassCard, type PassNote } from './PassCard';

interface HomeViewProps {
  safeNotes: PassNote[];
  searchNoteText: string;
  setSearchNoteText: (text: string) => void;
  debouncedSearchText: string;
  setDebouncedSearchText: (text: string) => void;
  expandedPassCard: number | null;
  setExpandedPassCard: React.Dispatch<React.SetStateAction<number | null>>;
  lastActiveId: number | null;
  visiblePasswords: Record<number, boolean>;
  setVisiblePasswords: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  allowPasswordCopy: boolean;
  isDark: boolean;
  textColor: string;
  inputBg: string;
  onLongPressEdit: (note: PassNote) => void;
  copyToClipboard: (text: string) => void;
  showAlert: (msg: string, isBottom?: boolean) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  safeNotes,
  searchNoteText,
  setSearchNoteText,
  debouncedSearchText,
  setDebouncedSearchText,
  expandedPassCard,
  setExpandedPassCard,
  lastActiveId,
  visiblePasswords,
  setVisiblePasswords,
  allowPasswordCopy,
  isDark,
  textColor,
  inputBg,
  onLongPressEdit,
  copyToClipboard,
  showAlert,
}) => {
  const [isClearingSearch, setIsClearingSearch] = useState(false);
  const searchTouchStartY = useRef<number>(0);

  const rawSearchResults = debouncedSearchText.trim()
    ? safeNotes.filter(n => {
        const lowerSearch = debouncedSearchText.toLowerCase();
        return n.title?.toLowerCase().includes(lowerSearch) || n.account?.toLowerCase().includes(lowerSearch);
      })
    : [];
  const searchResults = rawSearchResults.slice(0, 6);
  const hasMoreResults = rawSearchResults.length > 6;
  const isSingleOrExpanded = searchResults.length === 1 || expandedPassCard !== null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', animation: 'tabCrossFade 0.2s ease-out backwards' }}>
      {/* 核心找回：原版的流光钥匙和 Blob 旋转特效 */}
      <style>{`
        @keyframes cyberFlow {
          0% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(175, 82, 222, 0.4)); }
          50% { background-position: 100% 50%; filter: drop-shadow(0 0 30px rgba(90, 200, 250, 0.8)); }
          100% { background-position: 0% 50%; filter: drop-shadow(0 0 15px rgba(175, 82, 222, 0.4)); }
        }
        @keyframes blobSpin1 {
          0% { transform: translate(-50%, -50%) rotate(0deg); border-radius: 40% 60% 60% 40% / 50% 40% 60% 50%; }
          50% { border-radius: 60% 40% 40% 60% / 40% 60% 50% 60%; }
          100% { transform: translate(-50%, -50%) rotate(360deg); border-radius: 40% 60% 60% 40% / 50% 40% 60% 50%; }
        }
        @keyframes blobSpin2 {
          0% { transform: translate(-50%, -50%) rotate(360deg); border-radius: 50% 50% 40% 60% / 60% 40% 50% 50%; }
          50% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 40%; }
          100% { transform: translate(-50%, -50%) rotate(0deg); border-radius: 50% 50% 40% 60% / 60% 40% 50% 50%; }
        }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div
          className="material-icons"
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '140px',
            background: isDark
              ? 'linear-gradient(270deg, #e48706, #9C7EBA, #5be2d4, #D96666)'
              : 'linear-gradient(270deg, rgba(255,59,48,0.5), rgba(175,82,222,0.5), rgba(90,200,250,0.5), rgba(255,59,48,0.5))',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            animation: 'cyberFlow 3s ease infinite',
          }}
        >
          vpn_key
        </div>
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '210px', height: '210px', border: `3px dashed ${isDark ? '#40E0D0' : VIBRANT_COLORS[2]}`, animation: 'blobSpin1 15s linear infinite', opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '280px', height: '280px', border: `2px solid ${isDark ? '#FF9500' : VIBRANT_COLORS[5]}`, animation: 'blobSpin2 20s linear infinite', opacity: 0.4 }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '350px', height: '350px', border: `3px dotted ${isDark ? '#59a5f0' : VIBRANT_COLORS[8]}`, animation: 'blobSpin1 25s linear infinite', opacity: 0.4 }} />
      </div>

      {/* 动态背景模糊遮罩 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 5,
          backdropFilter: searchResults.length > 0 ? 'blur(12px)' : 'blur(0px)',
          backgroundColor: searchResults.length > 0 ? (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(245,245,247,0.5)') : 'transparent',
          transition: 'all 0.5s',
        }}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', zIndex: 10 }}>
        {debouncedSearchText.trim() && (
          <div style={{ color: '#8E8E93', fontSize: 'var(--text-sm)', marginBottom: '20px', animation: 'fadeIn 0.5s', fontWeight: 'bold' }}>
            {hasMoreResults ? "为您检索到以下账号 (仅显示前6个)：" : "为您检索到以下账号："}
          </div>
        )}
        <div
          onTouchStart={(e) => { searchTouchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            if (searchTouchStartY.current - e.changedTouches[0].clientY > 60) {
              setIsClearingSearch(true);
              setTimeout(() => {
                setSearchNoteText("");
                setDebouncedSearchText("");
                setExpandedPassCard(null);
                setIsClearingSearch(false);
              }, 500);
            }
          }}
          className="hide-scrollbar"
          style={{
            width: '88%',
            maxWidth: '380px',
            flex: 1,
            position: 'relative',
            touchAction: 'pan-y',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: isSingleOrExpanded ? '20px' : '0',
            paddingBottom: '160px',
            opacity: isClearingSearch ? 0 : 1,
            transform: isClearingSearch ? 'translateY(-30px)' : 'translateY(0)',
            transition: 'all 0.5s',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: isSingleOrExpanded ? 'auto' : `${Math.max(0, searchResults.length - 1) * 85 + 140}px` }}>
            {searchResults.map((note, index) => {
              const isExpanded = expandedPassCard === note.id;
              const isHidden = expandedPassCard !== null && !isExpanded;
              const activeId = expandedPassCard !== null ? expandedPassCard : lastActiveId;
              const activeIndex = searchResults.findIndex(n => n.id === activeId);
              let hiddenTransform = 'translateY(0) scale(1)';
              if (isHidden) hiddenTransform = index < activeIndex ? 'translateY(-50vh) scale(0.8)' : 'translateY(60vh) scale(0.8)';
              const topPos = (searchResults.length === 1 || isExpanded) ? 0 : index * 85;

              return (
                <PassCard
                  key={note.id}
                  note={note}
                  index={index}
                  totalCount={searchResults.length}
                  isExpanded={isExpanded}
                  isHidden={isHidden}
                  hiddenTransform={hiddenTransform}
                  topPos={topPos}
                  isDark={isDark}
                  textColor={textColor}
                  inputBg={inputBg}
                  isPasswordVisible={!!visiblePasswords[note.id]}
                  allowPasswordCopy={allowPasswordCopy}
                  onToggleExpand={() => setExpandedPassCard(isExpanded ? null : note.id)}
                  onTogglePasswordVisibility={() => setVisiblePasswords(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                  onLongPressEdit={onLongPressEdit}
                  copyToClipboard={copyToClipboard}
                  showAlert={showAlert}
                />
              );
            })}
          </div>
          {/* 动态显示：上划以取消搜索 */}
          {searchResults.length > 0 && (
            <div style={{ textAlign: 'center', paddingTop: '10px', paddingBottom: '0', color: '#8E8E93', fontSize: 'var(--text-sm)', fontWeight: 'bold', opacity: isClearingSearch ? 0 : 0.6, transition: 'opacity 0.3s', pointerEvents: 'none' }}>
              上划以取消搜索
            </div>
          )}
        </div>
      </div>

      {/* 底部悬浮搜索输入框 */}
      <div style={{ position: 'absolute', bottom: 'calc(85px + env(safe-area-inset-bottom, 0px))', left: '25px', right: '25px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '15px 20px', border: `1px solid ${isDark ? '#444' : '#CCC'}`, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
          <Icon name="search" color="#8E8E93" size="var(--icon-base)" />
          <input
            type="text"
            enterKeyHint="search"
            placeholder="可搜标题或账号..."
            value={searchNoteText}
            onChange={e => setSearchNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, marginLeft: '12px', color: textColor, fontSize: 'var(--text-lg)', fontWeight: '500' }}
          />
          {searchNoteText && (
            <Icon
              name="close"
              color="#8E8E93"
              onClick={() => { setSearchNoteText(""); setDebouncedSearchText(""); setExpandedPassCard(null); }}
              style={{ cursor: 'pointer' }}
              size="var(--icon-base)"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;

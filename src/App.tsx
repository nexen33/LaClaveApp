import { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';

import { copySensitiveClipboard } from './core/plugins/clipboardPlugin';
import { initializeVaultAndMigrate } from './core/storage/migrationEngine';
import { saveEncryptedVault } from './core/storage/vaultStorage';
import type { KeyWrapInfo } from './core/storage/schema';
import { type PinAuthRecord } from './core/crypto/pbkdf2';
import { usePinAuth } from './features/auth/hooks/usePinAuth';

import { Icon } from './components/ui/Icon';
import { VIBRANT_COLORS } from './constants/colors';
import { AuthSplashView } from './features/auth/components/AuthSplashView';
import { PinKeypadModal, type PinModalConfig } from './features/auth/components/PinKeypadModal';
import { CryptoModal, type CryptoModalConfig } from './features/backup/components/CryptoModal';
import { AboutModal } from './features/settings/components/AboutModal';
import { type PassNote } from './features/vault/components/PassCard';
import { PassDrawer } from './features/vault/components/PassDrawer';
import { HomeView } from './features/vault/components/HomeView';
import { VaultCategoryView } from './features/vault/components/VaultCategoryView';
import { SettingsView } from './features/settings/components/SettingsView';

// =========================================
// 1. 全局样式与动态字号引擎
// =========================================
const globalStyles = `
  /* 基准与默认项：标准 standard (对应原放大尺寸) */
  :root {
    --text-xs: 14px;
    --text-sm: 16px;
    --text-base: 18px;
    --text-lg: 20px;
    --text-xl: 22px;
    --text-2xl: 26px;
    --text-3xl: 30px;

    --icon-sm: 22px;
    --icon-base: 28px;
    --icon-lg: 32px;
    --icon-xl: 52px;
  }

  /* 缩小 small (对应原默认尺寸) */
  .font-small {
    --text-xs: 12px;
    --text-sm: 14px;
    --text-base: 16px;
    --text-lg: 18px;
    --text-xl: 20px;
    --text-2xl: 24px;
    --text-3xl: 28px;

    --icon-sm: 18px;
    --icon-base: 24px;
    --icon-lg: 28px;
    --icon-xl: 48px;
  }

  /* 放大 large (新放大：文字在 standard 基础上 +2px，非豁免图标克制 +2px) */
  .font-large {
    --text-xs: 16px;
    --text-sm: 18px;
    --text-base: 20px;
    --text-lg: 22px;
    --text-xl: 24px;
    --text-2xl: 28px;
    --text-3xl: 32px;

    --icon-sm: 24px;
    --icon-base: 30px;
    --icon-lg: 34px;
    --icon-xl: 54px;
  }

  /* 仅在 font-large 放大模式下，豁免组件、固定控件与弹窗锁定为标准基准 standard 尺寸，不进一步放大 */
  .font-large .exempt-standard,
  .font-large .modal-standard-size {
    --text-xs: 14px;
    --text-sm: 16px;
    --text-base: 18px;
    --text-lg: 20px;
    --text-xl: 22px;
    --text-2xl: 26px;
    --text-3xl: 30px;

    --icon-sm: 22px;
    --icon-base: 28px;
    --icon-lg: 32px;
    --icon-xl: 52px;
  }

  * { box-sizing: border-box !important; }

  html, body, #root {
    width: 100%; height: 100%; overflow: hidden !important; overscroll-behavior: none !important;
    margin: 0; padding: 0;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation; 
    -webkit-user-select: none; user-select: none;
    background-color: #000;
    -webkit-text-size-adjust: 100% !important;
    -moz-text-size-adjust: 100% !important;
    -ms-text-size-adjust: 100% !important;
    text-size-adjust: 100% !important;
  }

  *::-webkit-scrollbar { display: none !important; }
  * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

  /* 动画库 */
  @keyframes fadeOutStatic { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes fadeInBg { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes lightSweep {
    0% { transform: translate(-100%, 100%) rotate(45deg); opacity: 0; }
    20% { opacity: 0.5; }
    80% { opacity: 0.5; }
    100% { transform: translate(100%, -100%) rotate(45deg); opacity: 0; }
  }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideInLeftCard { from { opacity: 0; transform: translateX(-100vw); } to { opacity: 1; transform: translateX(0); } }
  @keyframes popInModal { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes tabCrossFade { 0% { opacity: 0; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes flyInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes flyInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes vaultItemEnter { 0% { opacity: 0; transform: translateY(-15px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes jelly { 0% { transform: scale(1); } 30% { transform: scale(0.96); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
  
  @keyframes alertPopIn {
    0% { transform: translate(-50%, 20px) scale(0.8); opacity: 0; }
    70% { transform: translate(-50%, -5px) scale(1.05); opacity: 1; }
    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
  }

  .sweep-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; pointer-events: none; }
  .sweep-light {
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
    animation: lightSweep 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; animation-delay: 0.2s;
  }
  .btn-jelly:active { animation: jelly 0.5s; }
  .scroll-container { overflow-y: auto; -webkit-overflow-scrolling: touch; }
`;

const styleTag = document.createElement('style');
styleTag.textContent = globalStyles;
document.head.appendChild(styleTag);

const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover';
document.head.appendChild(meta);

// =========================================
// 2. 主函数入口与状态管理
// =========================================
export default function App() {
  const APP_VERSION = "1.1.5";

  // 认证与外观偏好
  const [isAuthPassed, setIsAuthPassed] = useState(false);
  const [isAutoLocked, setIsAutoLocked] = useState(false);
  const isAutoLockedRef = useRef(false);
  const isAuthPassedRef = useRef(false);
  useEffect(() => { isAuthPassedRef.current = isAuthPassed; }, [isAuthPassed]);

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [fontSizeMode, setFontSizeMode] = useState<"small" | "standard" | "large">("standard");
  const topBarRef = useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = useState<number>(Capacitor.getPlatform() === 'android' ? 95 : 100);

  // 核心数据与 UI 状态
  const [passTab, setPassTab] = useState<'home' | 'vault' | 'settings'>('home');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const activeDekRef = useRef<CryptoKey | null>(null);
  const keyWrapRef = useRef<KeyWrapInfo | null>(null);
  const [pinAuthRecord, setPinAuthRecord] = useState<PinAuthRecord | null>(null);
  const { isLocked, remainingSeconds, verifyPin } = usePinAuth();

  const [safeNotes, setSafeNotes] = useState<PassNote[]>([]);
  const [safePassword, setSafePassword] = useState("1234");
  const [bioEnabled, setBioEnabled] = useState<boolean>(true);
  const [pinLength, setPinLength] = useState<number>(4);
  const [allowPasswordCopy, setAllowPasswordCopy] = useState<boolean>(false);
  const [shuffleKeypadEnabled, setShuffleKeypadEnabled] = useState<boolean>(true);
  const [allowScreenshot, setAllowScreenshot] = useState<boolean>(false);

  const [searchNoteText, setSearchNoteText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [selectedVaultCat, setSelectedVaultCat] = useState<string | null>(null);
  const [expandedVaultCards, setExpandedVaultCards] = useState<number[]>([]);
  const [expandedPassCard, setExpandedPassCard] = useState<number | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [lastActiveId, setLastActiveId] = useState<number | null>(null);

  // 表单抽屉
  const [editingPassId, setEditingPassId] = useState<number | null>(null);
  const [isPassDrawerOpen, setIsPassDrawerOpen] = useState(false);
  const [showPassDeleteConfirm, setShowPassDeleteConfirm] = useState<number | null>(null);

  // 分类属性修改与敏捷切换
  const [fastCatEditEnabled, setFastCatEditEnabled] = useState<boolean>(true);
  const [quickEditCatId, setQuickEditCatId] = useState<number | null>(null);
  const [editingVaultCat, setEditingVaultCat] = useState<string | null>(null);
  const [editingVaultCatForm, setEditingVaultCatForm] = useState({ name: '', color: '' });
  const [showColorReassignConfirm, setShowColorReassignConfirm] = useState(false);
  const [showBioDisableConfirm, setShowBioDisableConfirm] = useState(false);

  // 弹窗状态
  const [pinModalConfig, setPinModalConfig] = useState<PinModalConfig>({ isOpen: false, mode: '' });
  const [cryptoModalConfig, setCryptoModalConfig] = useState<CryptoModalConfig>({ isOpen: false, mode: 'export' });
  const [showAboutModal, setShowAboutModal] = useState(false);

  // 提醒弹窗
  const [alertMsg, setAlertMsg] = useState<{ text: string, isBottom: boolean } | null>(null);
  const alertTimerRef = useRef<any>(null);

  const backgroundTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<any>(null);
  const exitTimerRef = useRef<any>(null);
  const isSystemIntentActiveRef = useRef(false);

  // 专门控制搜索时抽屉隐藏的延迟状态引擎
  const [isSearchDrawerHidden, setIsSearchDrawerHidden] = useState(false);
  useEffect(() => {
    if (passTab === 'home' && searchNoteText.trim() !== '') {
      setIsSearchDrawerHidden(true);
    } else {
      const timer = setTimeout(() => {
        setIsSearchDrawerHidden(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [passTab, searchNoteText]);

  const showAlert = (msg: string, isBottom: boolean = false, duration: number = 2000) => {
    setAlertMsg({ text: msg, isBottom });
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setAlertMsg(null), duration);
  };

  // 如果处于锁定状态且尚未通过认证，自动打开开屏密码弹窗展示倒计时
  useEffect(() => {
    if (isLocked && !isAuthPassed) {
      setPinModalConfig(prev => (prev.isOpen ? prev : { isOpen: true, mode: 'verify_app_launch' }));
    }
  }, [isLocked, isAuthPassed]);

  // =========================================
  // 3. 数据持久化与底层引擎
  // =========================================
  useEffect(() => {
    const loadPreferences = async () => {
      const { value: tMode } = await Preferences.get({ key: 'laclave_theme' });
      if (tMode) setThemeMode(tMode as 'light' | 'dark');

      const { value: fSize } = await Preferences.get({ key: 'laclave_font_size' });
      if (fSize) {
        if (fSize === 'large') setFontSizeMode('large');
        else if (fSize === 'small' || fSize === 'default') setFontSizeMode('small');
        else setFontSizeMode('standard');
      }

      const { value: bEnabled } = await Preferences.get({ key: 'laclave_bio_enabled' });
      if (bEnabled !== null) setBioEnabled(bEnabled === 'true');

      const { value: pLen } = await Preferences.get({ key: 'laclave_pin_length' });
      if (pLen) setPinLength(parseInt(pLen));

      const { value: fCat } = await Preferences.get({ key: 'laclave_fast_cat_edit' });
      if (fCat !== null) setFastCatEditEnabled(fCat === 'true');

      const { value: aCopy } = await Preferences.get({ key: 'laclave_allow_pwd_copy' });
      if (aCopy !== null) setAllowPasswordCopy(aCopy === 'true');

      const { value: sKeypad } = await Preferences.get({ key: 'laclave_shuffle_keypad' });
      if (sKeypad !== null) setShuffleKeypadEnabled(sKeypad === 'true');

      const { value: aScreen } = await Preferences.get({ key: 'laclave_allow_screenshot' });
      if (aScreen !== null) setAllowScreenshot(aScreen === 'true');

      setIsPrefsLoaded(true);
    };
    loadPreferences();
  }, []);

  // 测量并监听顶部导航栏高度，保持 PassDrawer 与顶栏 5px 恒定呼吸留白
  useEffect(() => {
    if (topBarRef.current) {
      const rect = topBarRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        setTopBarHeight(rect.height);
      }
    }
  }, [passTab, fontSizeMode]);

  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_theme', value: themeMode }); }, [themeMode, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_font_size', value: fontSizeMode }); }, [fontSizeMode, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_bio_enabled', value: String(bioEnabled) }); }, [bioEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_pin_length', value: String(pinLength) }); }, [pinLength, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_fast_cat_edit', value: String(fastCatEditEnabled) }); }, [fastCatEditEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_allow_pwd_copy', value: String(allowPasswordCopy) }); }, [allowPasswordCopy, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_shuffle_keypad', value: String(shuffleKeypadEnabled) }); }, [shuffleKeypadEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_allow_screenshot', value: String(allowScreenshot) }); }, [allowScreenshot, isPrefsLoaded]);

  // 初始化密码库与数据迁移
  useEffect(() => {
    const initData = async () => {
      try {
        const result = await initializeVaultAndMigrate();
        activeDekRef.current = result.dek;
        keyWrapRef.current = result.keyWrap;
        setPinAuthRecord(result.pinAuth);
        if (result.notes && result.notes.length > 0) {
          setSafeNotes(result.notes);
        }
      } catch (err) {
        console.error('[LaClave] 初始化/迁移密码库失败:', err);
        showAlert("安全密码库加载失败，请使用离线备份恢复", true);
      } finally {
        setIsDataLoaded(true);
      }
    };
    initData();
  }, []);

  // 账本数据变更加密保存 (FIFO 单轨串行化队列，彻底消除 Last-Write-Wins 竞态)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!isDataLoaded || !activeDekRef.current || !keyWrapRef.current) return;

    // 首发跳过冷启动无意义重复刷盘
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    const currentNotes = safeNotes;
    const currentDek = activeDekRef.current;
    const currentWrap = keyWrapRef.current;

    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        await saveEncryptedVault(currentDek, currentNotes, currentWrap);
      } catch (err) {
        console.error('[LaClave] 加密持久化失败:', err);
      }
    });
  }, [safeNotes, isDataLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchNoteText), 500);
    return () => clearTimeout(timer);
  }, [searchNoteText]);

  useEffect(() => {
    if (expandedPassCard !== null) setLastActiveId(expandedPassCard);
  }, [expandedPassCard]);

  useEffect(() => {
    setExpandedPassCard(null);
    setLastActiveId(null);
  }, [searchNoteText]);

  // 动态防截屏与防窥探
  useEffect(() => {
    const updatePrivacyScreen = async () => {
      if (!Capacitor.isNativePlatform()) return;

      if (allowScreenshot) {
        try { await PrivacyScreen.disable(); } catch { }
        return;
      }

      const isAnyPasswordVisible = Object.values(visiblePasswords).some(isVisible => isVisible);

      try {
        if (isAnyPasswordVisible) {
          await PrivacyScreen.enable();
        } else {
          await PrivacyScreen.disable();
        }
      } catch (error) {
        console.error("Privacy Screen API failed", error);
      }
    };

    updatePrivacyScreen();
  }, [visiblePasswords, allowScreenshot]);

  // 一旦 App 被锁定，立刻清洗敏感数据视图
  useEffect(() => {
    if (!isAuthPassed) {
      setVisiblePasswords({});
      setExpandedVaultCards([]);
      setExpandedPassCard(null);

      setShowAboutModal(false);
      setShowPassDeleteConfirm(null);
      setQuickEditCatId(null);
      setEditingVaultCat(null);
      setShowColorReassignConfirm(false);
      setShowBioDisableConfirm(false);
    }
  }, [isAuthPassed]);

  // 状态栏沉浸式处理
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        if (!isAuthPassed) {
          await StatusBar.setStyle({ style: Style.Dark });
        } else {
          const statusStyle = themeMode === 'dark' ? Style.Dark : Style.Light;
          await StatusBar.setStyle({ style: statusStyle });
        }
      } catch { }
    };
    updateStatusBar();
  }, [themeMode, isAuthPassed]);

  // App 后台自动锁定引擎 (8秒超时)
  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundTimeRef.current = Date.now();
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      } else {
        if (backgroundTimeRef.current > 0 && Date.now() - backgroundTimeRef.current > 8000) {
          if (!isSystemIntentActiveRef.current) {
            setIsAutoLocked(false);
            isAutoLockedRef.current = false;
            setIsAuthPassed(false);
            setPinModalConfig({ isOpen: false, mode: '' });
            setCryptoModalConfig({ isOpen: false, mode: 'export' });
          }
        }
        backgroundTimeRef.current = 0;
        isSystemIntentActiveRef.current = false;
      }
    });
    return () => { listenerPromise.then(l => l.remove()); };
  }, []);

  // App 内分场景无操作自动锁定与自动退出引擎 (新建记录 60s, 其余场景 40s, 锁屏后 10s 退出)
  const isPassDrawerOpenRef = useRef(isPassDrawerOpen);
  const editingPassIdRef = useRef(editingPassId);
  useEffect(() => { isPassDrawerOpenRef.current = isPassDrawerOpen; }, [isPassDrawerOpen]);
  useEffect(() => { editingPassIdRef.current = editingPassId; }, [editingPassId]);

  useEffect(() => {
    let lastActivity = 0;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 500) return;
      lastActivity = now;

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      if (isAuthPassedRef.current) {
        // 场景分流：仅当新建密码抽屉展开时（isPassDrawerOpen 且 editingPassId 为 null）延长为 60s，其余所有页面/场景均为 40s
        const timeoutMs = (isPassDrawerOpenRef.current && editingPassIdRef.current === null) ? 60000 : 40000;
        inactivityTimerRef.current = setTimeout(() => {
          isAutoLockedRef.current = true;
          setIsAutoLocked(true);
          setIsAuthPassed(false);
          setPinModalConfig({ isOpen: false, mode: '' });
          setCryptoModalConfig({ isOpen: false, mode: 'export' });

          exitTimerRef.current = setTimeout(() => {
            CapacitorApp.exitApp();
          }, 10000);
        }, timeoutMs);
      } else {
        if (isAutoLockedRef.current) {
          isAutoLockedRef.current = false;
          setIsAutoLocked(false);
        }
      }
    };

    // 全量捕获触屏、手势、点击、键盘按键、软键盘输入与滚动事件，确保在抽屉内任何输入或点击均即时重置计时
    const events = ['touchstart', 'touchmove', 'mousedown', 'pointerdown', 'keydown', 'input', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { capture: true }));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleUserActivity, { capture: true }));
    };
  }, []);

  // 当登录状态、抽屉开关或编辑状态切换时，即时重算并切换当前场景的超时阈值
  useEffect(() => {
    if (isAuthPassed) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      const timeoutMs = (isPassDrawerOpen && editingPassId === null) ? 60000 : 40000;
      inactivityTimerRef.current = setTimeout(() => {
        isAutoLockedRef.current = true;
        setIsAutoLocked(true);
        setIsAuthPassed(false);
        setPinModalConfig({ isOpen: false, mode: '' });
        setCryptoModalConfig({ isOpen: false, mode: 'export' });

        exitTimerRef.current = setTimeout(() => {
          CapacitorApp.exitApp();
        }, 10000);
      }, timeoutMs);
    }
  }, [isAuthPassed, isPassDrawerOpen, editingPassId]);

  // 返回键逐级拦截引擎
  const [backPressCount, setBackPressCount] = useState(0);
  const backPressCountRef = useRef(0);
  useEffect(() => { backPressCountRef.current = backPressCount; }, [backPressCount]);

  const appStateRef = useRef({
    isPassDrawerOpen, cryptoModalConfig, pinModalConfig,
    quickEditCatId, editingVaultCat, showColorReassignConfirm,
    selectedVaultCat, searchNoteText, expandedPassCard,
    showAboutModal, showPassDeleteConfirm, showBioDisableConfirm
  });

  useEffect(() => {
    appStateRef.current = {
      isPassDrawerOpen, cryptoModalConfig, pinModalConfig,
      quickEditCatId, editingVaultCat, showColorReassignConfirm,
      selectedVaultCat, searchNoteText, expandedPassCard,
      showAboutModal, showPassDeleteConfirm, showBioDisableConfirm
    };
  }, [
    isPassDrawerOpen, cryptoModalConfig, pinModalConfig,
    quickEditCatId, editingVaultCat, showColorReassignConfirm,
    selectedVaultCat, searchNoteText, expandedPassCard,
    showAboutModal, showPassDeleteConfirm, showBioDisableConfirm
  ]);

  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      const state = appStateRef.current;

      // 1. 最高层级弹窗拦截
      if (state.pinModalConfig.isOpen) { setPinModalConfig({ isOpen: false, mode: '' }); return; }
      if (state.cryptoModalConfig.isOpen) { setCryptoModalConfig({ isOpen: false, mode: 'export' }); return; }
      if (state.showAboutModal) { setShowAboutModal(false); return; }
      if (state.showPassDeleteConfirm) { setShowPassDeleteConfirm(null); return; }
      if (state.showBioDisableConfirm) { setShowBioDisableConfirm(false); return; }

      // 2. 次级弹窗拦截
      if (state.quickEditCatId) { setQuickEditCatId(null); return; }
      if (state.editingVaultCat) { setEditingVaultCat(null); return; }
      if (state.showColorReassignConfirm) { setShowColorReassignConfirm(false); return; }

      // 3. 抽屉与卡片展开拦截
      if (state.isPassDrawerOpen) {
        setIsPassDrawerOpen(false);
        setEditingPassId(null);
        return;
      }
      if (state.expandedPassCard) { setExpandedPassCard(null); return; }

      // 4. 页面内部层级路由拦截
      if (state.searchNoteText) { setSearchNoteText(""); return; }
      if (state.selectedVaultCat) { setSelectedVaultCat(null); return; }

      // 5. 最终退出确认逻辑
      if (backPressCountRef.current === 0) {
        setBackPressCount(1);
        backPressCountRef.current = 1;
        showAlert("再划一次退出 App", true);
        setTimeout(() => {
          setBackPressCount(0);
          backPressCountRef.current = 0;
        }, 2000);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => { listenerPromise.then(l => l.remove()); };
  }, []);

  // =========================================
  // 4. 业务计算与事件处理
  // =========================================
  const categoryColorMap = safeNotes.reduce((acc, note) => {
    if (note.category && note.color && !acc[note.category]) acc[note.category] = note.color;
    return acc;
  }, {} as Record<string, string>);

  const usedColors = Object.values(categoryColorMap);
  const getCatColor = (cat: string) => categoryColorMap[cat] || VIBRANT_COLORS[0];
  const catCounts = safeNotes.reduce((acc, note) => { acc[note.category] = (acc[note.category] || 0) + 1; return acc; }, {} as Record<string, number>);
  const allVaultCats = Array.from(new Set(Object.keys(catCounts)));

  const isDark = themeMode === 'dark';
  const pmBg = isDark ? '#000000' : '#F5F5F7';
  const inputBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  const copyToClipboard = async (text: string) => {
    await copySensitiveClipboard(text);
  };

  const handleLongPressEdit = (note: PassNote) => {
    setEditingPassId(note.id);
    setIsPassDrawerOpen(true);
  };

  const handleSavePass = (newNote: PassNote) => {
    setSafeNotes(prev => editingPassId ? prev.map(n => n.id === editingPassId ? newNote : n) : [...prev, newNote]);
    setIsPassDrawerOpen(false);
    setEditingPassId(null);
    showAlert("已保存", true);
  };

  const triggerFilePicker = () => {
    isSystemIntentActiveRef.current = true;
    document.getElementById('safe-notes-upload')?.click();
  };

  const handleSafeNotesFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const encryptedData = event.target?.result as string;
      const trimmed = encryptedData.trim();
      const isPlaintextJson = trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.includes('"laclave_vault_backup"'));
      if (isPlaintextJson) {
        try {
          const directParsed = JSON.parse(trimmed);
          if (Array.isArray(directParsed)) {
            showAlert("❌ 拒绝导入：该文件未加密！", true);
            return;
          }
        } catch { }
      }
      setCryptoModalConfig({ isOpen: true, mode: 'import', payload: encryptedData });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const scanLatestBackup = async () => {
    try {
      const result = await Filesystem.readdir({ path: 'LaClave', directory: Directory.Documents });
      const files = result.files.filter((f: any) => f.name.endsWith('.txt')).sort((a: any, b: any) => b.name.localeCompare(a.name));
      if (files.length > 0) {
        setCryptoModalConfig({ isOpen: true, mode: 'smart_import', payload: files[0].name });
      } else {
        triggerFilePicker();
      }
    } catch {
      triggerFilePicker();
    }
  };

  const handleReassignColors = () => {
    const currentCats = Array.from(new Set(safeNotes.map(n => n.category)));
    const shuffledColors = [...VIBRANT_COLORS].sort(() => Math.random() - 0.5);
    const newColorMap: Record<string, string> = {};
    currentCats.forEach((cat, index) => newColorMap[cat] = shuffledColors[index % shuffledColors.length]);
    setSafeNotes(prev => prev.map(note => ({ ...note, color: newColorMap[note.category] || note.color })));
  };

  const editingPass = editingPassId ? safeNotes.find(n => n.id === editingPassId) || null : null;

  // =========================================
  // 5. 渲染流程
  // =========================================

  // 拦截认证：开屏与安全解锁阶段
  if (!isAuthPassed) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <AuthSplashView
          isDark={themeMode === 'dark'}
          autoTrigger={!isAutoLocked && bioEnabled && !isLocked}
          skipAnimation={isAutoLocked}
          bioEnabled={bioEnabled && !isLocked}
          disableTrigger={pinModalConfig.isOpen || isLocked}
          onAuthSuccess={() => {
            if (isLocked) {
              showAlert(`系统安全锁定中，请等待 ${remainingSeconds} 秒！`, true);
              setPinModalConfig({ isOpen: true, mode: 'verify_app_launch' });
              return;
            }
            setIsAuthPassed(true);
            setIsAutoLocked(false);
            isAutoLockedRef.current = false;
          }}
          onRequirePin={() => {
            setPinModalConfig({ isOpen: true, mode: 'verify_app_launch' });
          }}
        />

        {pinModalConfig.isOpen && pinModalConfig.mode === 'verify_app_launch' && (
          <PinKeypadModal
            config={pinModalConfig}
            onClose={() => setPinModalConfig({ isOpen: false, mode: '' })}
            isDark={isDark}
            pinLength={pinLength}
            shuffleKeypadEnabled={shuffleKeypadEnabled}
            isLocked={isLocked}
            remainingSeconds={remainingSeconds}
            pinAuthRecord={pinAuthRecord}
            safePassword={safePassword}
            verifyPin={verifyPin}
            onAuthSuccess={() => {
              setIsAuthPassed(true);
              setIsAutoLocked(false);
              setPinModalConfig({ isOpen: false, mode: '' });
            }}
            onPinChanged={(newAuth, newPlain) => {
              setPinAuthRecord(newAuth);
              setSafePassword(newPlain);
            }}
            showAlert={showAlert}
          />
        )}

        {alertMsg && (
          <div style={{
            position: 'fixed',
            bottom: alertMsg.isBottom ? 'calc(140px + env(safe-area-inset-bottom, 0px))' : 'auto',
            top: alertMsg.isBottom ? 'auto' : 'calc(70px + env(safe-area-inset-top, 0px))',
            left: '50%', transform: 'translateX(-50%)',
            backgroundColor: themeMode === 'dark' ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.95)',
            color: themeMode === 'dark' ? '#FFF' : '#000',
            padding: '18px 36px', borderRadius: '26px', fontSize: 'var(--text-base)', fontWeight: '900',
            zIndex: 200000, boxShadow: themeMode === 'dark' ? '0 10px 30px rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap', pointerEvents: 'none',
            animation: alertMsg.isBottom ? 'flyInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'flyInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <Icon
              name={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? 'error' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? 'check_circle' : 'info')}
              color={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? '#FF3B30' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? '#34C759' : '#FF9500')}
              size="var(--icon-lg)"
            />
            <span>{alertMsg.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`app-container ${fontSizeMode === 'small' ? 'font-small' : (fontSizeMode === 'large' ? 'font-large' : '')}`} style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      backgroundColor: pmBg,
      color: textColor,
      transition: 'background-color 0.3s',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 顶部胶囊导航栏 */}
      <div ref={topBarRef} className="exempt-standard" style={{ paddingTop: Capacitor.getPlatform() === 'android' ? '45px' : 'calc(20px + env(safe-area-inset-top, 0px))', paddingBottom: '10px', display: 'flex', alignItems: 'center', paddingLeft: '25px', paddingRight: '25px', zIndex: 10 }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <div onClick={() => CapacitorApp.exitApp()} className="btn-jelly" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon name="logout" size="var(--icon-lg)" color="#FFB74D" style={{ transform: 'rotate(180deg)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA', borderRadius: '12px', padding: '3px', width: '240px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '3px', bottom: '3px', left: passTab === 'home' ? '3px' : 'calc(50% + 1px)', width: 'calc(50% - 4px)', backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF', borderRadius: '10px', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: isDark ? 'none' : '0 3px 8px rgba(0,0,0,0.12)', opacity: passTab === 'settings' ? 0 : 1 }} />
          <div onClick={() => { setPassTab("home"); setExpandedPassCard(null); setIsPassDrawerOpen(false); }} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 'var(--text-base)', fontWeight: 'bold', color: passTab === 'home' ? textColor : '#8E8E93', zIndex: 1, cursor: 'pointer' }}>搜索</div>
          <div onClick={() => { setPassTab("vault"); setExpandedPassCard(null); setIsPassDrawerOpen(false); }} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 'var(--text-base)', fontWeight: 'bold', color: passTab === 'vault' ? textColor : '#8E8E93', zIndex: 1, cursor: 'pointer' }}>仓库</div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => { setPassTab("settings"); setIsPassDrawerOpen(false); }} className="btn-jelly" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon name="settings" size="var(--icon-lg)" color={passTab === 'settings' ? textColor : '#8E8E93'} />
          </div>
        </div>
      </div>

      {/* 主体内容区 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {passTab === 'home' && (
          <HomeView
            safeNotes={safeNotes}
            searchNoteText={searchNoteText}
            setSearchNoteText={setSearchNoteText}
            debouncedSearchText={debouncedSearchText}
            setDebouncedSearchText={setDebouncedSearchText}
            expandedPassCard={expandedPassCard}
            setExpandedPassCard={setExpandedPassCard}
            lastActiveId={lastActiveId}
            visiblePasswords={visiblePasswords}
            setVisiblePasswords={setVisiblePasswords}
            allowPasswordCopy={allowPasswordCopy}
            isDark={isDark}
            textColor={textColor}
            inputBg={inputBg}
            onLongPressEdit={handleLongPressEdit}
            copyToClipboard={copyToClipboard}
            showAlert={showAlert}
          />
        )}

        {passTab === 'vault' && (
          <VaultCategoryView
            safeNotes={safeNotes}
            setSafeNotes={setSafeNotes}
            selectedVaultCat={selectedVaultCat}
            setSelectedVaultCat={setSelectedVaultCat}
            expandedVaultCards={expandedVaultCards}
            setExpandedVaultCards={setExpandedVaultCards}
            visiblePasswords={visiblePasswords}
            setVisiblePasswords={setVisiblePasswords}
            allVaultCats={allVaultCats}
            catCounts={catCounts}
            categoryColorMap={categoryColorMap}
            getCatColor={getCatColor}
            fontSizeMode={fontSizeMode}
            isDark={isDark}
            textColor={textColor}
            inputBg={inputBg}
            pmBg={pmBg}
            fastCatEditEnabled={fastCatEditEnabled}
            allowPasswordCopy={allowPasswordCopy}
            quickEditCatId={quickEditCatId}
            setQuickEditCatId={setQuickEditCatId}
            editingVaultCat={editingVaultCat}
            setEditingVaultCat={setEditingVaultCat}
            editingVaultCatForm={editingVaultCatForm}
            setEditingVaultCatForm={setEditingVaultCatForm}
            onLongPressEdit={handleLongPressEdit}
            copyToClipboard={copyToClipboard}
            showAlert={showAlert}
          />
        )}

        {passTab === 'settings' && (
          <SettingsView
            fontSizeMode={fontSizeMode}
            setFontSizeMode={setFontSizeMode}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            fastCatEditEnabled={fastCatEditEnabled}
            setFastCatEditEnabled={setFastCatEditEnabled}
            showColorReassignConfirm={showColorReassignConfirm}
            setShowColorReassignConfirm={setShowColorReassignConfirm}
            onReassignColors={handleReassignColors}
            onOpenExport={() => setCryptoModalConfig({ isOpen: true, mode: 'export' })}
            onScanLatestBackup={scanLatestBackup}
            onOpenSmartConvert={() => setCryptoModalConfig({ isOpen: true, mode: 'smart_convert' })}
            bioEnabled={bioEnabled}
            setBioEnabled={setBioEnabled}
            showBioDisableConfirm={showBioDisableConfirm}
            setShowBioDisableConfirm={setShowBioDisableConfirm}
            pinLength={pinLength}
            onRequestChangePinStandard={(targetLen) => {
              if (pinLength !== targetLen) {
                setPinModalConfig({ isOpen: true, mode: 'force_change_old', payload: targetLen });
              }
            }}
            onRequestChangePin={() => {
              setPinModalConfig({ isOpen: true, mode: 'change_old' });
            }}
            shuffleKeypadEnabled={shuffleKeypadEnabled}
            setShuffleKeypadEnabled={setShuffleKeypadEnabled}
            allowScreenshot={allowScreenshot}
            setAllowScreenshot={setAllowScreenshot}
            allowPasswordCopy={allowPasswordCopy}
            setAllowPasswordCopy={setAllowPasswordCopy}
            onOpenAbout={() => setShowAboutModal(true)}
            isDark={isDark}
            textColor={textColor}
            inputBg={inputBg}
            pmBg={pmBg}
            safePassword={safePassword}
            showAlert={showAlert}
          />
        )}
      </div>

      {/* 底部表单抽屉 */}
      {passTab !== 'settings' && (
        <PassDrawer
          isOpen={isPassDrawerOpen}
          isSearchDrawerHidden={isSearchDrawerHidden}
          editingPass={editingPass}
          safeNotes={safeNotes}
          categoryColorMap={categoryColorMap}
          usedColors={usedColors}
          allVaultCats={allVaultCats}
          isDark={isDark}
          inputBg={inputBg}
          pmBg={pmBg}
          textColor={textColor}
          topOffset={topBarHeight + 5}
          fontSizeMode={fontSizeMode}
          onClose={() => {
            setIsPassDrawerOpen(false);
            setEditingPassId(null);
          }}
          onOpen={() => {
            setEditingPassId(null);
            setIsPassDrawerOpen(true);
          }}
          onSave={handleSavePass}
          onDeleteRequest={(id) => setShowPassDeleteConfirm(id)}
          showAlert={showAlert}
        />
      )}

      {/* PIN 码管理弹窗 (修改密码/强制切换标准) */}
      {pinModalConfig.isOpen && pinModalConfig.mode !== 'verify_app_launch' && (
        <PinKeypadModal
          config={pinModalConfig}
          onClose={() => setPinModalConfig({ isOpen: false, mode: '' })}
          isDark={isDark}
          pinLength={pinLength}
          shuffleKeypadEnabled={shuffleKeypadEnabled}
          isLocked={isLocked}
          remainingSeconds={remainingSeconds}
          pinAuthRecord={pinAuthRecord}
          safePassword={safePassword}
          verifyPin={verifyPin}
          onAuthSuccess={() => {
            setIsAuthPassed(true);
            setIsAutoLocked(false);
            setPinModalConfig({ isOpen: false, mode: '' });
          }}
          onPinChanged={(newAuth, newPlain, newLen) => {
            setPinAuthRecord(newAuth);
            setSafePassword(newPlain);
            if (newLen) setPinLength(newLen);
          }}
          showAlert={showAlert}
        />
      )}

      {/* 数据加密备份/恢复弹窗 */}
      <CryptoModal
        config={cryptoModalConfig}
        setConfig={setCryptoModalConfig}
        onClose={() => setCryptoModalConfig({ isOpen: false, mode: 'export' })}
        isDark={isDark}
        safeNotes={safeNotes}
        setSafeNotes={setSafeNotes}
        categoryColorMap={categoryColorMap}
        triggerFilePicker={triggerFilePicker}
        showAlert={showAlert}
      />

      {/* 关于与更新日志弹窗 */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        isDark={isDark}
        appVersion={APP_VERSION}
      />

      {/* 删除账号确认弹窗 */}
      {showPassDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowPassDeleteConfirm(null)}>
          <div className="modal-standard-size" onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '15px', color: textColor, textAlign: 'center' }}>确认删除此账号？</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '25px', lineHeight: '1.5', textAlign: 'center' }}>此操作不可逆，删除后数据将无法找回。</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowPassDeleteConfirm(null)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div
                onClick={() => {
                  setSafeNotes(prev => prev.filter(n => n.id !== showPassDeleteConfirm));
                  setShowPassDeleteConfirm(null);
                  setIsPassDrawerOpen(false);
                  setEditingPassId(null);
                  showAlert("账号已删除", true);
                }}
                className="btn-jelly"
                style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: isDark ? '#640D36' : '#A10022', color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(161,0,34,0.3)'}`, cursor: 'pointer' }}
              >
                确认删除
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 消息提示框 */}
      {alertMsg && (
        <div style={{
          position: 'fixed',
          bottom: alertMsg.isBottom ? 'calc(120px + env(safe-area-inset-bottom, 0px))' : 'auto',
          top: alertMsg.isBottom ? 'auto' : 'calc(70px + env(safe-area-inset-top, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.95)',
          color: isDark ? '#FFF' : '#000',
          padding: '18px 36px',
          borderRadius: '26px',
          fontSize: 'var(--text-base)',
          fontWeight: '900',
          zIndex: 200000,
          boxShadow: isDark ? '0 10px 30px rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: alertMsg.isBottom ? 'flyInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'flyInDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <Icon
            name={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? 'error' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? 'check_circle' : 'info')}
            color={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? '#FF3B30' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? '#34C759' : '#FF9500')}
            size="var(--icon-lg)"
          />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* 隐藏的文件输入组件 */}
      <input type="file" id="safe-notes-upload" style={{ display: 'none' }} onChange={handleSafeNotesFile} accept=".txt" />
    </div>
  );
}

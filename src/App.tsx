import { useState, useEffect, useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Clipboard } from '@capacitor/clipboard';
import { useDrag } from '@use-gesture/react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';
import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import CryptoJS from 'crypto-js';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

  :root {
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

  .font-large {
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
  }

  *::-webkit-scrollbar { display: none !important; }
  * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

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
  @keyframes flyInDown { from { opacity: 0; transform: translateY(-100vh); } to { opacity: 1; transform: translateY(0); } }
  @keyframes flyInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes vaultItemEnter { 0% { opacity: 0; transform: translateY(-15px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes jelly { 0% { transform: scale(1); } 30% { transform: scale(0.96); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
  
  @keyframes alertPopIn {
  0% { transform: translate(-50%, 20px) scale(0.8); opacity: 0; }
  70% { transform: translate(-50%, -5px) scale(1.05); opacity: 1; }
  100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
  }

  @keyframes diagonalSweep {
    0% { transform: translate(-100%, 100%) rotate(45deg); opacity: 0; }
    20% { opacity: 0.8; }
    80% { opacity: 0.8; }
    100% { transform: translate(100%, -100%) rotate(45deg); opacity: 0; }
  }

  @keyframes flyInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @keyframes flyInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
  
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

const VIBRANT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
  '#AF52DE', '#FF8A65', '#4DD0E1', '#AED581', '#F06292', '#BA68C8', '#4DB6AC', '#7986CB'
];

const Icon = ({ name, color, size, onClick, style }: any) => (
  <span className="material-icons" onClick={onClick} style={{ fontSize: size || 'var(--icon-base)', color: color, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', ...style }}>
    {name}
  </span>
);

const AuthSplashView = ({ onAuthSuccess, onRequirePin, isDark, autoTrigger = true, skipAnimation = false, disableTrigger = false, bioEnabled = true }: any) => {
  const [phase, setPhase] = useState<'animating' | 'waiting'>(skipAnimation ? 'waiting' : 'animating');
  const isTriggeringRef = useRef(false);

  const bioEnabledRef = useRef(bioEnabled);
  useEffect(() => { bioEnabledRef.current = bioEnabled; }, [bioEnabled]);

  useEffect(() => {
    if (skipAnimation) return;
    const t2 = setTimeout(() => {
      setPhase('waiting');
      if (autoTrigger) triggerBiometric();
    }, 1500);
    return () => { clearTimeout(t2); };
  }, []);

  const triggerBiometric = async () => {
    if (isTriggeringRef.current) return;
    isTriggeringRef.current = true;
    if (!Capacitor.isNativePlatform() || !bioEnabledRef.current) {
      onRequirePin();
      setTimeout(() => { isTriggeringRef.current = false; }, 500);
      return;
    }
    try {
      await NativeBiometric.verifyIdentity({ reason: "验证指纹/面容以进入 La Clave", title: "安全验证" });
      onAuthSuccess();
    } catch (error) {
      onRequirePin();
    } finally {
      setTimeout(() => { isTriggeringRef.current = false; }, 500);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: '#000000' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'url(/laclave_bgr2.png)', backgroundSize: 'cover', backgroundPosition: 'center',
          filter: isDark ? 'invert(1) hue-rotate(180deg) contrast(1.1)' : 'none',
          animation: 'fadeInBg 0.6s ease-out forwards',
          zIndex: 1
        }} />
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

export default function App() {
  const APP_VERSION = "1.1.1";
  useEffect(() => {
    if (!document.getElementById('google-font-icons')) {
      const link = document.createElement('link');
      link.id = 'google-font-icons';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const [isAuthPassed, setIsAuthPassed] = useState(false);
  const [isAutoLocked, setIsAutoLocked] = useState(false);
  const isAutoLockedRef = useRef(false);
  const isAuthPassedRef = useRef(false);
  useEffect(() => { isAuthPassedRef.current = isAuthPassed; }, [isAuthPassed]);

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [fontSizeMode, setFontSizeMode] = useState<"default" | "large">("default");

  const [passTab, setPassTab] = useState<'home' | 'vault' | 'settings'>('home');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const [safeNotes, setSafeNotes] = useState<any[]>([]);
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
  const [isClearingSearch, setIsClearingSearch] = useState(false);

  const [editingPassId, setEditingPassId] = useState<number | null>(null);
  const [passForm, setPassForm] = useState({ title: "", category: "银行", customCat: "", color: "", account: "", password: "", extra: "" });
  const [isPassDrawerOpen, setIsPassDrawerOpen] = useState(false);
  const [passDrawerY, setPassDrawerY] = useState(0);
  const [isDraggingPassDrawer, setIsDraggingPassDrawer] = useState(false);
  const [passCatDropOpen, setPassCatDropOpen] = useState(false);
  const [showPassDeleteConfirm, setShowPassDeleteConfirm] = useState<number | null>(null);

  const [fastCatEditEnabled, setFastCatEditEnabled] = useState<boolean>(true);
  const [quickEditCatId, setQuickEditCatId] = useState<number | null>(null);
  const [editingVaultCat, setEditingVaultCat] = useState<string | null>(null);
  const [editingVaultCatForm, setEditingVaultCatForm] = useState({ name: '', color: '' });
  const [showColorReassignConfirm, setShowColorReassignConfirm] = useState(false);

  const [pinModalConfig, setPinModalConfig] = useState<{ isOpen: boolean, mode: string, payload?: any, tempPin?: string }>({ isOpen: false, mode: '' });
  const [shuffledKeypad, setShuffledKeypad] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  useEffect(() => {
    if (shuffleKeypadEnabled && pinModalConfig.isOpen && pinModalConfig.mode === 'verify_app_launch') {
      const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      setShuffledKeypad(nums);
    } else {
      setShuffledKeypad([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    }
  }, [pinModalConfig.isOpen, pinModalConfig.mode, shuffleKeypadEnabled]);

  const [showBioDisableConfirm, setShowBioDisableConfirm] = useState(false);
  const [cryptoModalConfig, setCryptoModalConfig] = useState<{ isOpen: boolean, mode: 'export' | 'import' | 'smart_import' | 'smart_convert' | 'smart_convert_confirm', payload?: any }>({ isOpen: false, mode: 'export' });
  const [cryptoInput, setCryptoInput] = useState("");
  const [showCryptoInput, setShowCryptoInput] = useState(false);
  const [passAuthInput, setPassAuthInput] = useState("");

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutView, setAboutView] = useState<'intro' | 'changelog'>('intro');

  const [alertMsg, setAlertMsg] = useState<{ text: string, isBottom: boolean } | null>(null);
  const alertTimerRef = useRef<any>(null);
  const searchTouchStartY = useRef<number>(0);
  const longPressTimer = useRef<any>(null);

  const backgroundTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<any>(null);
  const exitTimerRef = useRef<any>(null);
  const isSystemIntentActiveRef = useRef<number>(0);

  useEffect(() => {
    if (isPassDrawerOpen && !editingPassId && !passForm.color) {
      const fallbackColor = VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0];
      setPassForm(prev => ({ ...prev, color: categoryColorMap["银行"] || fallbackColor }));
    }
  }, [isPassDrawerOpen, editingPassId]);

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

  useEffect(() => {
    const loadPreferences = async () => {
      const { value: tMode } = await Preferences.get({ key: 'laclave_theme' });
      if (tMode) setThemeMode(tMode as 'light' | 'dark');

      const { value: fSize } = await Preferences.get({ key: 'laclave_font_size' });
      if (fSize) setFontSizeMode(fSize as 'default' | 'large');

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

  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_theme', value: themeMode }); }, [themeMode, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_font_size', value: fontSizeMode }); }, [fontSizeMode, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_bio_enabled', value: String(bioEnabled) }); }, [bioEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_pin_length', value: String(pinLength) }); }, [pinLength, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_fast_cat_edit', value: String(fastCatEditEnabled) }); }, [fastCatEditEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_allow_pwd_copy', value: String(allowPasswordCopy) }); }, [allowPasswordCopy, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_shuffle_keypad', value: String(shuffleKeypadEnabled) }); }, [shuffleKeypadEnabled, isPrefsLoaded]);
  useEffect(() => { if (isPrefsLoaded) Preferences.set({ key: 'laclave_allow_screenshot', value: String(allowScreenshot) }); }, [allowScreenshot, isPrefsLoaded]);

  useEffect(() => {
    const initData = async () => {
      const loadKey = async (key: string) => {
        const { value } = await Preferences.get({ key });
        if (value) return JSON.parse(value);
        const legacy = localStorage.getItem(key);
        if (legacy) return JSON.parse(legacy);
        return [];
      };
      const loadedNotes = await loadKey("laclave_safe_notes");
      if (loadedNotes && loadedNotes.length > 0) setSafeNotes(loadedNotes);

      const { value: pwdVal } = await Preferences.get({ key: "laclave_safe_pwd" });
      const legacyPwd = localStorage.getItem("laclave_safe_pwd");
      const finalPwd = pwdVal || legacyPwd;
      if (finalPwd && typeof finalPwd === 'string' && finalPwd !== "[]") setSafePassword(finalPwd);
      setIsDataLoaded(true);
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const val = JSON.stringify(safeNotes);
    localStorage.setItem("laclave_safe_notes", val);
    Preferences.set({ key: "laclave_safe_notes", value: val });
  }, [safeNotes, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem("laclave_safe_pwd", safePassword);
    Preferences.set({ key: "laclave_safe_pwd", value: safePassword });
  }, [safePassword, isDataLoaded]);

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

  useEffect(() => {
    const updatePrivacyScreen = async () => {
      if (!Capacitor.isNativePlatform()) return;

      if (allowScreenshot) {
        try { await PrivacyScreen.disable(); } catch (e) { }
        return;
      }

      const isAnyPasswordVisible = Object.values(visiblePasswords).some(isVisible => isVisible) || showCryptoInput;

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
  }, [visiblePasswords, showCryptoInput, allowScreenshot]);

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

  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });

        if (!isAuthPassed) {
          await StatusBar.setStyle({ style: Style.Dark });
        } else {
          let statusStyle = themeMode === 'dark' ? Style.Dark : Style.Light;
          await StatusBar.setStyle({ style: statusStyle });
        }
      } catch (error) { }
    };
    updateStatusBar();
  }, [themeMode, isAuthPassed]);

  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundTimeRef.current = Date.now();
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      } else {
        if (backgroundTimeRef.current > 0 && Date.now() - backgroundTimeRef.current > 8000) {
          const isIntentActive = isSystemIntentActiveRef.current > 0 && (Date.now() - isSystemIntentActiveRef.current < 60000);

          if (!isIntentActive) {
            setIsAutoLocked(false);
            isAutoLockedRef.current = false;
            setIsAuthPassed(false);
            setPinModalConfig({ isOpen: false, mode: '' });
            setCryptoModalConfig({ isOpen: false, mode: 'export' });
            setPassAuthInput("");
          }
        }
        backgroundTimeRef.current = 0;
        isSystemIntentActiveRef.current = 0;
      }
    });
    return () => { listenerPromise.then(l => l.remove()); };
  }, []);

  useEffect(() => {
    let lastActivity = 0;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 500) return;
      lastActivity = now;

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      if (isAuthPassedRef.current) {
        inactivityTimerRef.current = setTimeout(() => {
          isAutoLockedRef.current = true;
          setIsAutoLocked(true);
          setIsAuthPassed(false);
          setPinModalConfig({ isOpen: false, mode: '' });
          setCryptoModalConfig({ isOpen: false, mode: 'export' });
          setPassAuthInput("");

          exitTimerRef.current = setTimeout(() => {
            CapacitorApp.exitApp();
          }, 10000);
        }, 60000);
      } else {
        if (isAutoLockedRef.current) {
          isAutoLockedRef.current = false;
          setIsAutoLocked(false);
        }
      }
    };

    const events = ['touchstart', 'touchmove', 'mousedown', 'keydown', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { capture: true }));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleUserActivity, { capture: true }));
    };
  }, []);

  useEffect(() => {
    if (isAuthPassed) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      inactivityTimerRef.current = setTimeout(() => {
        isAutoLockedRef.current = true;
        setIsAutoLocked(true);
        setIsAuthPassed(false);
        setPinModalConfig({ isOpen: false, mode: '' });
        setCryptoModalConfig({ isOpen: false, mode: 'export' });
        setPassAuthInput("");

        exitTimerRef.current = setTimeout(() => {
          CapacitorApp.exitApp();
        }, 10000);
      }, 60000);
    }
  }, [isAuthPassed]);

  const [backPressCount, setBackPressCount] = useState(0);

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
  }, [isPassDrawerOpen, cryptoModalConfig, pinModalConfig, quickEditCatId, editingVaultCat, showColorReassignConfirm, selectedVaultCat, searchNoteText, expandedPassCard, showAboutModal, showPassDeleteConfirm, showBioDisableConfirm]);

  useEffect(() => {
    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      const state = appStateRef.current;

      if (state.pinModalConfig.isOpen) { setPinModalConfig({ isOpen: false, mode: '' }); return; }
      if (state.cryptoModalConfig.isOpen) { setCryptoModalConfig({ isOpen: false, mode: 'export' }); return; }
      if (state.showAboutModal) { setShowAboutModal(false); return; }
      if (state.showPassDeleteConfirm) { setShowPassDeleteConfirm(null); return; }
      if (state.showBioDisableConfirm) { setShowBioDisableConfirm(false); return; }

      if (state.quickEditCatId) { setQuickEditCatId(null); return; }
      if (state.editingVaultCat) { setEditingVaultCat(null); return; }
      if (state.showColorReassignConfirm) { setShowColorReassignConfirm(false); return; }

      if (state.isPassDrawerOpen) {
        setIsPassDrawerOpen(false);
        setTimeout(closeAndResetDrawer, 300);
        return;
      }
      if (state.expandedPassCard) { setExpandedPassCard(null); return; }

      if (state.searchNoteText) { setSearchNoteText(""); return; }
      if (state.selectedVaultCat) { setSelectedVaultCat(null); return; }

      if (backPressCount === 0) {
        setBackPressCount(1);
        showAlert("再划一次退出 App", true);
        setTimeout(() => setBackPressCount(0), 2000);
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => { listenerPromise.then(listener => listener.remove()); };
  }, [backPressCount]);

  const copyToClipboard = async (text: string) => {
    try { await Clipboard.write({ string: text }); } catch (err) { }
  };

  const closeAndResetDrawer = () => {
    setIsPassDrawerOpen(false); setPassDrawerY(0); setEditingPassId(null); setPassCatDropOpen(false);
    const existingBankColor = safeNotes.find(n => n.category === "银行")?.color;
    setPassForm({ title: "", category: "银行", customCat: "", color: existingBankColor || "", account: "", password: "", extra: "" });
  };

  const triggerFilePicker = () => {
    isSystemIntentActiveRef.current = Date.now();
    document.getElementById('safe-notes-upload')?.click();
  };

  const scanLatestBackup = async () => {
    try {
      const result = await Filesystem.readdir({ path: 'LaClave', directory: Directory.Documents });
      const files = result.files.filter(f => f.name.endsWith('.txt')).sort((a, b) => b.name.localeCompare(a.name));
      if (files.length > 0) {
        setCryptoInput("");
        setCryptoModalConfig({ isOpen: true, mode: 'smart_import', payload: files[0].name });
      } else {
        triggerFilePicker();
      }
    } catch (e) {
      triggerFilePicker();
    }
  };

  const handleSafeNotesFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const encryptedData = event.target?.result as string;
      if (encryptedData.trim().startsWith('[') || encryptedData.trim().startsWith('{')) {
        showAlert("❌ 拒绝导入：该文件未加密！", true); return;
      }
      setCryptoInput("");
      setCryptoModalConfig({ isOpen: true, mode: 'import', payload: encryptedData });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderCryptoModal = () => {
    if (!cryptoModalConfig.isOpen) return null;
    const isDark = themeMode === 'dark';

    const handleSmartConvert = (text: string) => {
      const blocks = text.split(/\n\s*\n/).filter((b: string) => b.trim() !== '');
      const parsedNotes: any[] = [];

      const existingColor = categoryColorMap['未分类'];
      const unifiedRandomColor = VIBRANT_COLORS[Math.floor(Math.random() * VIBRANT_COLORS.length)];
      const finalUncatColor = existingColor || unifiedRandomColor;

      blocks.forEach((block: string, idx: number) => {
        const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
        if (lines.length >= 3) {
          const title = lines[0];
          let account = lines[1].replace(/^(账号|帐号|账号：|账号:|帐号：|帐号:|Account:|Account：)\s*/i, '');
          let password = lines[2].replace(/^(密码|密码：|密码:|Password:|Password：)\s*/i, '');
          const extra = lines.slice(3).join('\n');
          parsedNotes.push({
            id: Date.now() + idx,
            title, account, password, extra,
            category: '未分类', color: finalUncatColor
          });
        }
      });
      return parsedNotes;
    };

    if (cryptoModalConfig.mode === 'smart_convert') {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '15vh', justifyContent: 'center' }}>
          <div style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Icon name="assignment_returned" size="var(--icon-xl)" color={VIBRANT_COLORS[9]} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>智能转换导入</div>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px' }}>支持段落式导入 (标题/账号/密码/备注)</div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <textarea autoFocus placeholder={"标题1\n(账号:)xxx\n(密码:)xxx\n(附加信息们)\n\n标题2\n...\n(段落间需空行，仅支持追加导入)"} value={cryptoInput} onChange={e => setCryptoInput(e.target.value)} style={{ width: '100%', height: '180px', padding: '16px', borderRadius: '16px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: isDark ? '#000' : '#F5F5F7', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => { setCryptoModalConfig({ isOpen: false, mode: 'export' }); setCryptoInput(""); }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div onClick={() => {
                if (!cryptoInput.trim()) { showAlert("输入不能为空", false); return; }
                const parsed = handleSmartConvert(cryptoInput);
                if (parsed.length === 0) { showAlert("未识别到有效格式", false); return; }
                setCryptoModalConfig({ isOpen: true, mode: 'smart_convert_confirm', payload: parsed });
              }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: VIBRANT_COLORS[9], color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>识别解析</div>
            </div>
          </div>
        </div>
      );
    }

    if (cryptoModalConfig.mode === 'smart_convert_confirm') {
      const parsedList = cryptoModalConfig.payload;
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '20vh', justifyContent: 'center' }}>
          <div style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <Icon name="check_circle" size="var(--icon-xl)" color="#34C759" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>识别完成</div>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '10px', lineHeight: '1.5' }}>
                成功解析出 <span style={{ color: '#34C759', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{parsedList.length}</span> 条账号记录<br />
                即将存入「未分类」组 (随机分配颜色)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setCryptoModalConfig({ isOpen: true, mode: 'smart_convert' })} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>返回修改</div>
              <div onClick={() => {
                setSafeNotes(prev => [...prev, ...parsedList]);
                setCryptoModalConfig({ isOpen: false, mode: 'export' });
                setCryptoInput("");
                showAlert(`成功导入 ${parsedList.length} 条记录！`, false);
              }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: '#34C759', color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>确认导入</div>
            </div>
          </div>
        </div>
      );
    }

    if (cryptoModalConfig.mode === 'smart_import') {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '25vh', justifyContent: 'center' }}>
          <div style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <Icon name="manage_search" size="var(--icon-xl)" color="#AF52DE" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>发现最新备份</div>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px', wordBreak: 'break-all' }}>{cryptoModalConfig.payload}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div onClick={async () => {
                try {
                  const file = await Filesystem.readFile({ path: `LaClave/${cryptoModalConfig.payload}`, directory: Directory.Documents, encoding: Encoding.UTF8 });
                  setCryptoModalConfig({ isOpen: true, mode: 'import', payload: file.data });
                } catch (e) { showAlert("读取文件失败", true); }
              }} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: '#AF52DE', color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>使用此备份恢复</div>
              <div onClick={() => { setCryptoModalConfig({ isOpen: false, mode: 'export' }); triggerFilePicker(); }} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>手动选择文件</div>
              <div onClick={() => setCryptoModalConfig({ isOpen: false, mode: 'export' })} style={{ width: '100%', padding: '10px', textAlign: 'center', color: '#8E8E93', fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>取消</div>
            </div>
          </div>
        </div>
      );
    }

    const isExport = cryptoModalConfig.mode === 'export';
    const iconColor = isExport ? '#007AFF' : '#AF52DE';

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '25vh', justifyContent: 'center' }}>
        <div style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <Icon name={isExport ? "enhanced_encryption" : "key"} size="var(--icon-xl)" color={iconColor} style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>{isExport ? "加密导出" : "解密恢复"}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px' }}>{isExport ? "设置导出专用密钥 (长度不限)" : "请输入此文件的解密密钥"}</div>
          </div>
          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <input autoFocus type={showCryptoInput ? "text" : "password"} placeholder="输入密钥..." value={cryptoInput} onChange={e => setCryptoInput(e.target.value)} style={{ width: '100%', padding: '16px', paddingRight: '50px', borderRadius: '16px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: isDark ? '#000' : '#F5F5F7', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-lg)', outline: 'none', boxSizing: 'border-box' }} />
            <div onClick={() => setShowCryptoInput(!showCryptoInput)} style={{ position: 'absolute', right: '15px', top: '16px', color: '#8E8E93', cursor: 'pointer' }}><Icon name={showCryptoInput ? "visibility_off" : "visibility"} size="var(--icon-base)" /></div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div onClick={() => { setCryptoModalConfig({ isOpen: false, mode: 'export' }); setCryptoInput(""); }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
            <div onClick={async () => {
              if (!cryptoInput.trim()) { showAlert("密钥不能为空", true); return; }
              if (isExport) {
                try {
                  const dataStr = JSON.stringify(safeNotes);
                  const encryptedData = CryptoJS.AES.encrypt(dataStr, cryptoInput).toString();
                  const y = new Date().getFullYear(); const m = String(new Date().getMonth() + 1).padStart(2, '0'); const d = String(new Date().getDate()).padStart(2, '0');
                  const fileName = `LaClave_${y}-${m}-${d}.txt`;
                  await Filesystem.writeFile({ path: `LaClave/${fileName}`, data: encryptedData, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
                  showAlert(`加密备份已保存至: Documents/LaClave`, true, 6000);
                } catch (error) { showAlert("导出失败，请检查存储权限", true); }
              } else {
                try {
                  const bytes = CryptoJS.AES.decrypt(cryptoModalConfig.payload, cryptoInput);
                  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
                  if (!decryptedData) throw new Error("密码错误");
                  const parsed = JSON.parse(decryptedData);
                  if (Array.isArray(parsed)) {
                    setSafeNotes(prev => {
                      const merged = [...prev];
                      parsed.forEach((newItem: any) => { const idx = merged.findIndex(a => a.id === newItem.id); if (idx > -1) merged[idx] = newItem; else merged.push(newItem); });
                      return merged;
                    });
                    showAlert(`成功恢复 ${parsed.length} 条账号 🔓`, true);
                  }
                } catch (err) { showAlert("❌ 解密失败：密钥错误或文件损坏", true); }
              }
              setCryptoModalConfig({ isOpen: false, mode: 'export' }); setCryptoInput(""); setShowCryptoInput(false);
            }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: iconColor, color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>{isExport ? "打包" : "解密"}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderUnifiedPinModal = () => {
    if (!pinModalConfig.isOpen) return null;
    const isDark = themeMode === 'dark';
    let title = "安全验证"; let subtitle = "请输入密码"; let iconColor = VIBRANT_COLORS[5]; let iconName = "lock";
    const activeLen = (pinModalConfig.mode === 'force_change_old') ? pinLength : (pinModalConfig.payload || pinLength);

    if (pinModalConfig.mode === 'verify_app_launch') { title = "安全验证"; subtitle = "请输入访问密码解锁"; iconName = "security"; }
    else if (pinModalConfig.mode === 'change_old' || pinModalConfig.mode === 'force_change_old') { title = "验证原密码"; subtitle = "修改前请先验证"; iconName = "lock_open"; }
    else if (pinModalConfig.mode === 'change_new' || pinModalConfig.mode === 'force_change_new') { title = "设置新密码"; subtitle = `请输入新的 ${activeLen} 位密码`; iconColor = VIBRANT_COLORS[2]; iconName = "fiber_new"; }
    else if (pinModalConfig.mode === 'change_confirm' || pinModalConfig.mode === 'force_change_confirm') { title = "确认新密码"; subtitle = "请再次输入以确认"; iconColor = VIBRANT_COLORS[3]; iconName = "check_circle"; }

    const handlePinInput = (val: string) => {
      setPassAuthInput(val);
      if (val.length === activeLen) {
        const { mode, tempPin, payload } = pinModalConfig;
        setTimeout(() => {
          if (mode === 'verify_app_launch') {
            if (val === safePassword) { setIsAuthPassed(true); setIsAutoLocked(false); setPinModalConfig({ isOpen: false, mode: '' }); setPassAuthInput(""); }
            else { showAlert("密码错误！", false); setPassAuthInput(""); }
          } else if (mode === 'change_old') {
            if (val === safePassword) { setPinModalConfig({ isOpen: true, mode: 'change_new' }); setPassAuthInput(""); } else { showAlert("原密码错误！", false); setPassAuthInput(""); }
          } else if (mode === 'change_new') {
            setPinModalConfig({ isOpen: true, mode: 'change_confirm', tempPin: val }); setPassAuthInput("");
          } else if (mode === 'change_confirm') {
            if (val === tempPin) { setSafePassword(val); showAlert("密码修改成功！", false); setPinModalConfig({ isOpen: false, mode: '' }); } else { showAlert("两次不一致，请重试", false); setPinModalConfig({ isOpen: true, mode: 'change_new' }); setPassAuthInput(""); }
          } else if (mode === 'force_change_old') {
            if (val === safePassword) { setPinModalConfig({ isOpen: true, mode: 'force_change_new', payload: payload }); setPassAuthInput(""); } else { showAlert("原密码错误！", false); setPassAuthInput(""); }
          } else if (mode === 'force_change_new') {
            setPinModalConfig({ isOpen: true, mode: 'force_change_confirm', payload: payload, tempPin: val }); setPassAuthInput("");
          } else if (mode === 'force_change_confirm') {
            if (val === tempPin) { setPinLength(activeLen); setSafePassword(val); showAlert("标准与密码均已更新！", false); setPinModalConfig({ isOpen: false, mode: '' }); } else { showAlert("两次不一致，请重试", false); setPinModalConfig({ isOpen: true, mode: 'force_change_new', payload: payload }); setPassAuthInput(""); }
          }
        }, 100);
      }
    };

    const isLaunchVerify = pinModalConfig.mode === 'verify_app_launch';

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
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: overlayBg, backdropFilter: overlayBlur, zIndex: 100005, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '85%', maxWidth: '340px', backgroundColor: modalBg, border: modalBorder, borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <Icon name={iconName} size="var(--icon-xl)" color={iconColor} style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: textColorLaunch }}>{title}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: subTextColorLaunch, marginTop: '5px' }}>{subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: activeLen === 6 ? '8px' : '15px', justifyContent: 'center', marginBottom: '30px', position: 'relative' }}>
            {Array.from({ length: activeLen }).map((_, i) => (
              <div key={i} style={{ width: activeLen === 6 ? '40px' : '50px', height: activeLen === 6 ? '50px' : '60px', borderRadius: '12px', border: `2px solid ${passAuthInput.length === i ? iconColor : inputSlotBorder}`, backgroundColor: inputSlotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-3xl)', color: textColorLaunch, transition: 'all 0.2s' }}>{passAuthInput[i] ? '•' : ''}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
            {shuffledKeypad.slice(0, 9).map(num => (
              <div key={num} onClick={() => { if (passAuthInput.length < activeLen) handlePinInput(passAuthInput + num); }} className="btn-jelly" style={{ height: '60px', borderRadius: '16px', backgroundColor: isLaunchVerify ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: textColorLaunch, cursor: 'pointer', border: modalBorder, userSelect: 'none' }}>
                {num}
              </div>
            ))}
            <div />
            <div onClick={() => { if (passAuthInput.length < activeLen) handlePinInput(passAuthInput + shuffledKeypad[9]); }} className="btn-jelly" style={{ height: '60px', borderRadius: '16px', backgroundColor: isLaunchVerify ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'), backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: textColorLaunch, cursor: 'pointer', border: modalBorder, userSelect: 'none' }}>
              {shuffledKeypad[9]}
            </div>
            <div onClick={() => setPassAuthInput(prev => prev.slice(0, -1))} className="btn-jelly" style={{ height: '60px', borderRadius: '16px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="backspace" size="var(--icon-lg)" color={textColorLaunch} />
            </div>
          </div>

          <div onClick={() => {
            if (pinModalConfig.mode === 'verify_app_launch') { CapacitorApp.exitApp(); }
            else { setPinModalConfig({ isOpen: false, mode: '' }); setPassAuthInput(''); }
          }} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: btnBg, color: textColorLaunch, fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>{pinModalConfig.mode === 'verify_app_launch' ? '退出 App' : '取消操作'}</div>
        </div>
      </div>
    );
  }

  const categoryColorMap = safeNotes.reduce((acc, note) => {
    if (note.category && note.color && !acc[note.category]) acc[note.category] = note.color;
    return acc;
  }, {} as Record<string, string>);

  const usedColors = Object.values(categoryColorMap);
  const getCatColor = (cat: string) => categoryColorMap[cat] || VIBRANT_COLORS[0];
  const catCounts = safeNotes.reduce((acc, note) => { acc[note.category] = (acc[note.category] || 0) + 1; return acc; }, {} as Record<string, number>);
  const allVaultCats = Array.from(new Set(Object.keys(catCounts)));

  const bindPassDrawer = useDrag(({ down, movement: [, my], velocity: [, vy] }) => {
    setIsDraggingPassDrawer(down);
    if (isPassDrawerOpen) {
      if (down) setPassDrawerY(my > 0 ? my : my * 0.1);
      else {
        if (my > 100 || vy > 0.5) {
          setPassDrawerY(window.innerHeight);
          setTimeout(closeAndResetDrawer, 300);
        } else setPassDrawerY(0);
      }
    } else {
      if (down) setPassDrawerY(my < 0 ? my : my * 0.1);
      else {
        if (my < -60 || vy > 0.5) { setIsPassDrawerOpen(true); setPassDrawerY(0); }
        else setPassDrawerY(0);
      }
    }
  }, { axis: 'y', filterTaps: true });

  const savePassForm = () => {
    const finalCat = passForm.category === "自定义" ? passForm.customCat.trim() : passForm.category;
    if (!passForm.title || !finalCat || (!passForm.account && !passForm.password)) {
      showAlert("请填写标题，并提供账号或密码！", true); return;
    }
    let finalColor = passForm.color;
    if (!finalColor) finalColor = categoryColorMap[finalCat] || VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0];

    const newNote = {
      id: editingPassId || Date.now(),
      title: passForm.title, category: finalCat, color: finalColor,
      account: passForm.account, password: passForm.password, extra: passForm.extra
    };
    setSafeNotes(prev => editingPassId ? prev.map(n => n.id === editingPassId ? newNote : n) : [...prev, newNote]);
    setPassDrawerY(window.innerHeight);
    setTimeout(closeAndResetDrawer, 300);
    showAlert("已保存", true);
  };

  const handleLongPressEdit = (note: any) => {
    setEditingPassId(note.id);
    setPassForm({
      title: note.title, category: note.category, customCat: "", color: note.color || VIBRANT_COLORS[0],
      account: note.account, password: note.password, extra: note.extra || ""
    });
    setIsPassDrawerOpen(true);
    setPassDrawerY(0);
  };

  const isDark = themeMode === 'dark';
  const pmBg = isDark ? '#000000' : '#F5F5F7';
  const inputBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  const renderHomeView = () => {
    const rawSearchResults = debouncedSearchText.trim() ? safeNotes.filter(n => {
      const lowerSearch = debouncedSearchText.toLowerCase();
      return n.title?.toLowerCase().includes(lowerSearch) || n.account?.toLowerCase().includes(lowerSearch);
    }) : [];
    const searchResults = rawSearchResults.slice(0, 6);
    const hasMoreResults = rawSearchResults.length > 6;
    const isSingleOrExpanded = searchResults.length === 1 || expandedPassCard !== null;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', animation: 'tabCrossFade 0.2s ease-out backwards' }}>
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
                50% { border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%; }
                100% { transform: translate(-50%, -50%) rotate(0deg); border-radius: 50% 50% 40% 60% / 60% 40% 50% 50%; }
            }
        `}</style>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div className="material-icons" style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '140px',
            background: isDark
              ? 'linear-gradient(270deg, #e48706, #9C7EBA, #5be2d4, #D96666)'
              : 'linear-gradient(270deg, rgba(255,59,48,0.5), rgba(175,82,222,0.5), rgba(90,200,250,0.5), rgba(255,59,48,0.5))',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            animation: 'cyberFlow 3s ease infinite',
          }}>
            vpn_key
          </div>
          <div style={{ position: 'absolute', top: '40%', left: '50%', width: '210px', height: '210px', border: `3px dashed ${isDark ? '#40E0D0' : VIBRANT_COLORS[2]}`, animation: 'blobSpin1 15s linear infinite', opacity: 0.5 }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', width: '280px', height: '280px', border: `2px solid ${isDark ? '#FF9500' : VIBRANT_COLORS[5]}`, animation: 'blobSpin2 20s linear infinite', opacity: 0.4 }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', width: '350px', height: '350px', border: `3px dotted ${isDark ? '#59a5f0' : VIBRANT_COLORS[8]}`, animation: 'blobSpin1 25s linear infinite', opacity: 0.4 }} />
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 5, backdropFilter: searchResults.length > 0 ? 'blur(12px)' : 'blur(0px)', backgroundColor: searchResults.length > 0 ? (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(245,245,247,0.5)') : 'transparent', transition: 'all 0.5s' }} />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px', zIndex: 10 }}>
          {debouncedSearchText.trim() && (
            <div style={{ color: '#8E8E93', fontSize: 'var(--text-sm)', marginBottom: '20px', animation: 'fadeIn 0.5s', fontWeight: 'bold' }}>
              {hasMoreResults ? "为您检索到以下账号 (仅显示前6个)：" : "为您检索到以下账号："}
            </div>
          )}
          <div onTouchStart={(e) => { searchTouchStartY.current = e.touches[0].clientY; }} onTouchEnd={(e) => { if (searchTouchStartY.current - e.changedTouches[0].clientY > 60) { setIsClearingSearch(true); setTimeout(() => { setSearchNoteText(""); setDebouncedSearchText(""); setExpandedPassCard(null); setIsClearingSearch(false); }, 500); } }}
            className="hide-scrollbar" style={{ width: '88%', maxWidth: '380px', flex: 1, position: 'relative', touchAction: 'pan-y', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: isSingleOrExpanded ? '20px' : '0', paddingBottom: '160px', opacity: isClearingSearch ? 0 : 1, transform: isClearingSearch ? 'translateY(-30px)' : 'translateY(0)', transition: 'all 0.5s' }}>
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
                  <div key={note.id}
                    onTouchStart={() => { longPressTimer.current = setTimeout(() => handleLongPressEdit(note), 600); }}
                    onTouchEnd={() => clearTimeout(longPressTimer.current)}
                    onTouchMove={() => clearTimeout(longPressTimer.current)}
                    onMouseDown={() => { longPressTimer.current = setTimeout(() => handleLongPressEdit(note), 600); }}
                    onMouseUp={() => clearTimeout(longPressTimer.current)}
                    onMouseLeave={() => clearTimeout(longPressTimer.current)}
                    onClick={() => setExpandedPassCard(isExpanded ? null : note.id)}
                    style={{
                      position: (searchResults.length === 1 || isExpanded) ? 'relative' : 'absolute',
                      top: (searchResults.length === 1 || isExpanded) ? 'auto' : `${topPos}px`,
                      left: 0, right: 0,
                      height: (searchResults.length === 1 || isExpanded) ? 'auto' : '140px',
                      zIndex: isExpanded ? 200 : 10 + index,
                      opacity: isHidden ? 0 : 1,
                      pointerEvents: isHidden ? 'none' : 'auto',
                      transform: isHidden ? hiddenTransform : 'translateY(0) scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                      animation: expandedPassCard !== null ? 'none' : `slideInLeftCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.10}s backwards`,
                      backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(15px)', borderRadius: '24px',
                      border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
                      boxShadow: isExpanded ? (isDark ? '0 15px 40px rgba(0,0,0,0.6)' : '0 15px 35px rgba(0,0,0,0.12)') : (isDark ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.05)'),
                      overflow: 'hidden', cursor: 'pointer'
                    }}>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, padding: '0 2px 0 14px' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', color: textColor, lineHeight: 1.2, wordBreak: 'break-all', flex: 1, marginRight: '15px' }}>{note.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', backgroundColor: note.color || VIBRANT_COLORS[0], color: '#FFF', padding: '6px 12px', borderRadius: '12px', flexShrink: 0 }}>{note.category}</div>
                      </div>

                      {(searchResults.length === 1 || isExpanded) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s 0.2s backwards', position: 'relative', zIndex: 2 }}>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '10px 2px 10px 14px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginRight: '15px' }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', marginBottom: '4px', fontWeight: 'bold' }}>账号</span>
                              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor, wordBreak: 'break-all' }}>{note.account}</span>
                            </div>
                            <div onClick={(e: any) => { e.stopPropagation(); copyToClipboard(note.account); showAlert('账号已复制', false); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA', borderRadius: '10px', flexShrink: 0 }}>
                              <Icon name="content_copy" size="var(--icon-sm)" color={note.color || VIBRANT_COLORS[0]} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '10px 2px 10px 14px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginRight: '15px' }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', marginBottom: '2px', fontWeight: 'bold' }}>密码</span>
                              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor, fontFamily: 'monospace', letterSpacing: '2px', wordBreak: 'break-all' }}>{visiblePasswords[note.id] ? note.password : '••••••••'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {allowPasswordCopy && visiblePasswords[note.id] && (
                                <div onClick={(e: any) => { e.stopPropagation(); copyToClipboard(note.password); showAlert('密码复制成功', false); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA', borderRadius: '10px', flexShrink: 0 }}>
                                  <Icon name="content_copy" size="var(--icon-sm)" color={note.color || VIBRANT_COLORS[0]} />
                                </div>
                              )}
                              <div onClick={(e) => { e.stopPropagation(); setVisiblePasswords(prev => ({ ...prev, [note.id]: !prev[note.id] })); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', backgroundColor: isDark ? '#444' : '#E5E5EA', borderRadius: '10px', flexShrink: 0 }}>
                                <Icon name={visiblePasswords[note.id] ? "visibility_off" : "visibility"} size="var(--icon-sm)" color={textColor} />
                              </div>
                            </div>
                          </div>

                          {note.extra && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', fontWeight: 'bold', paddingLeft: '14px', marginBottom: '2px' }}>附加信息</div>
                              {note.extra.split('\n').filter((l: string) => l.trim() !== "").slice(0, 8).map((line: string, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: inputBg, padding: '4px 2px 4px 14px', borderRadius: '10px' }}>
                                  <span style={{ fontSize: 'var(--text-sm)', color: textColor, flex: 1, marginRight: '15px', lineHeight: '1.2' }}>{line}</span>
                                  <div onClick={(e: any) => { e.stopPropagation(); copyToClipboard(line); showAlert('附加信息已复制', false); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', backgroundColor: isDark ? '#444' : '#E5E5EA', borderRadius: '8px', flexShrink: 0 }}>
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
              })}
            </div>
            {searchResults.length > 0 && (
              <div style={{ textAlign: 'center', paddingTop: '10px', paddingBottom: '0', color: '#8E8E93', fontSize: 'var(--text-sm)', fontWeight: 'bold', opacity: isClearingSearch ? 0 : 0.6, transition: 'opacity 0.3s', pointerEvents: 'none' }}>
                上划以取消搜索
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 'calc(85px + env(safe-area-inset-bottom, 0px))', left: '25px', right: '25px', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '15px 20px', border: `1px solid ${isDark ? '#444' : '#CCC'}`, boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
            <Icon name="search" color="#8E8E93" size="var(--icon-base)" />
            <input type="text" enterKeyHint="search" placeholder="可搜标题或账号..." value={searchNoteText} onChange={e => setSearchNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, marginLeft: '12px', color: textColor, fontSize: 'var(--text-lg)', fontWeight: '500' }} />
            {searchNoteText && <Icon name="close" color="#8E8E93" onClick={() => { setSearchNoteText(""); setDebouncedSearchText(""); setExpandedPassCard(null); }} style={{ cursor: 'pointer' }} size="var(--icon-base)" />}
          </div>
        </div>
      </div>
    );
  };

  const renderVaultView = () => (
    <div className="scroll-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', padding: '20px', paddingBottom: '80px', animation: 'tabCrossFade 0.2s ease-out backwards' }}>
      {safeNotes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ fontSize: 'var(--text-lg)', color: '#8E8E93', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>目前无任何账号信息</div>
        </div>
      ) : !selectedVaultCat ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', animation: 'fadeIn 0.3s' }}>
          {allVaultCats.map((cat, index) => (
            <div key={cat}
              onTouchStart={() => { longPressTimer.current = setTimeout(() => { setEditingVaultCat(cat); setEditingVaultCatForm({ name: cat, color: getCatColor(cat) }); }, 600); }}
              onTouchEnd={() => clearTimeout(longPressTimer.current)} onTouchMove={() => clearTimeout(longPressTimer.current)}
              onMouseDown={() => { longPressTimer.current = setTimeout(() => { setEditingVaultCat(cat); setEditingVaultCatForm({ name: cat, color: getCatColor(cat) }); }, 600); }}
              onMouseUp={() => clearTimeout(longPressTimer.current)} onMouseLeave={() => clearTimeout(longPressTimer.current)}
              onClick={() => setSelectedVaultCat(cat)} className="btn-jelly"
              style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '25px 20px', display: 'flex', flexDirection: 'column', gap: '15px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, boxShadow: isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer', opacity: 0, animation: `vaultItemEnter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`, animationDelay: `${index * 0.05}s` }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: '900', color: getCatColor(cat) }}>{cat}</div>
              <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                minWidth: fontSizeMode === 'large' ? '36px' : '32px',
                height: fontSizeMode === 'large' ? '36px' : '32px',
                padding: '0 6px', boxSizing: 'border-box',
                borderRadius: '18px',
                backgroundColor: getCatColor(cat), color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                <span style={{
                  fontSize: fontSizeMode === 'large' ? 'var(--text-base)' : 'var(--text-sm)',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  transform: fontSizeMode === 'large' ? 'translateY(0px)' : 'translateY(0px)'
                }}>
                  {catCounts[cat] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ animation: 'pageSlideBack 0.3s cubic-bezier(0.2, 0.0, 0.2, 1) backwards' }}>
          <div onClick={() => setSelectedVaultCat(null)} style={{ display: 'flex', alignItems: 'center', color: getCatColor(selectedVaultCat), fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer', fontSize: 'var(--text-lg)' }}><Icon name="chevron_left" color="inherit" size="var(--icon-lg)" /> 返回归档</div>
          {safeNotes.filter(n => n.category === selectedVaultCat).map(note => {
            const isExp = expandedVaultCards.includes(note.id);
            return (
              <div key={note.id}
                onTouchStart={() => { longPressTimer.current = setTimeout(() => handleLongPressEdit(note), 600); }}
                onTouchEnd={() => clearTimeout(longPressTimer.current)} onTouchMove={() => clearTimeout(longPressTimer.current)}
                onMouseDown={() => { longPressTimer.current = setTimeout(() => handleLongPressEdit(note), 600); }}
                onMouseUp={() => clearTimeout(longPressTimer.current)} onMouseLeave={() => clearTimeout(longPressTimer.current)}
                style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '15px 16px', marginBottom: '10px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, userSelect: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: '900', color: textColor }}>{note.title}</span>
                  <span
                    onClick={(e: any) => {
                      e.stopPropagation();
                      if (fastCatEditEnabled) {
                        setQuickEditCatId(note.id);
                      } else {
                        showAlert("请在设置中开启「敏捷修改分类」", false);
                      }
                    }}
                    style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: note.color || VIBRANT_COLORS[0], backgroundColor: isDark ? '#333' : '#F5F5F7', padding: '8px 14px', borderRadius: '14px', cursor: 'pointer' }}>
                    {note.category}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-base)', color: '#8E8E93', marginBottom: '10px', display: 'flex', alignItems: 'center' }}><Icon name="person" size="var(--icon-sm)" color="#8E8E93" style={{ marginRight: '10px' }} /> {note.account}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 'var(--text-base)', color: '#8E8E93', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                    <Icon name="key" size="var(--icon-sm)" color="#8E8E93" style={{ marginRight: '10px' }} /> {visiblePasswords[note.id] ? note.password : '••••••••'}
                  </div>
                  {allowPasswordCopy && visiblePasswords[note.id] && (
                    <Icon name="content_copy" size="var(--icon-base)" color="#8E8E93" onClick={(e: any) => { e.stopPropagation(); copyToClipboard(note.password); showAlert('密码复制成功', false); }} style={{ cursor: 'pointer' }} />
                  )}
                </div>
                {isExp && note.extra && <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: `1px dashed ${isDark ? '#444' : '#E5E5EA'}`, fontSize: 'var(--text-sm)', color: '#8E8E93', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{note.extra}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '5px' }}>
                  <Icon name={visiblePasswords[note.id] ? "visibility_off" : "visibility"} size="var(--icon-base)" color="#8E8E93" onClick={(e: any) => { e.stopPropagation(); setVisiblePasswords(prev => ({ ...prev, [note.id]: !prev[note.id] })); }} style={{ cursor: 'pointer' }} />
                  {note.extra && <Icon name={isExp ? "expand_less" : "expand_more"} size="var(--icon-lg)" color="#8E8E93" onClick={(e: any) => { e.stopPropagation(); setExpandedVaultCards(prev => isExp ? prev.filter(id => id !== note.id) : [...prev, note.id]); }} style={{ cursor: 'pointer' }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettingsView = () => {
    return (
      <div key="pass-settings" className="scroll-container" style={{ flex: 1, padding: '15px 25px 0 25px', overflowY: 'auto', zIndex: 10, animation: 'tabCrossFade 0.2s ease-out backwards' }}>
        <div onDoubleClick={() => window.open('https://yourwebsite.com', '_blank')} style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: textColor, marginBottom: '20px', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
          <span style={{ fontFamily: "'Pacifico', cursive", fontWeight: '900', marginRight: '10px' }}>La Clave</span>
          密码本设置
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>外观偏好</div>
        <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="text_fields" color={VIBRANT_COLORS[4]} size="var(--icon-base)" style={{ marginRight: 15 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>字号调整</div>
            </div>
            <div style={{ display: 'flex', backgroundColor: isDark ? '#000' : '#f5f5f5', borderRadius: '10px', padding: '3px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
              <div onClick={() => setFontSizeMode('default')} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: fontSizeMode === 'default' ? (isDark ? '#333' : '#fff') : 'transparent', color: fontSizeMode === 'default' ? VIBRANT_COLORS[4] : '#8E8E93', cursor: 'pointer', transition: 'all 0.2s' }}>默认</div>
              <div onClick={() => setFontSizeMode('large')} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: fontSizeMode === 'large' ? (isDark ? '#333' : '#fff') : 'transparent', color: fontSizeMode === 'large' ? VIBRANT_COLORS[4] : '#8E8E93', cursor: 'pointer', transition: 'all 0.2s' }}>放大</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name={isDark ? "dark_mode" : "light_mode"} color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>暗黑模式</div>
            </div>
            <div onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{ width: '50px', height: '28px', backgroundColor: isDark ? VIBRANT_COLORS[8] : '#E5E5EA', borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: isDark ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>快捷修改</div>
        <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="bolt" color={VIBRANT_COLORS[3]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>敏捷修改分类</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>点击仓库卡片分类标签快速换组</div></div></div>
            <div onClick={() => setFastCatEditEnabled(!fastCatEditEnabled)} style={{ width: '50px', height: '28px', backgroundColor: fastCatEditEnabled ? VIBRANT_COLORS[3] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: fastCatEditEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="palette" color={VIBRANT_COLORS[6]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>分类颜色随机重分配</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>为已有分类重新分配颜色</div></div></div>
            <div onClick={() => setShowColorReassignConfirm(true)} className="btn-jelly" style={{ padding: '6px 14px', borderRadius: '10px', backgroundColor: isDark ? '#333' : '#F5F5F7', color: VIBRANT_COLORS[6], fontWeight: 'bold', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>执行</div>
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>数据管理</div>
        <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', marginBottom: '20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
          <div onClick={() => { setCryptoInput(""); setCryptoModalConfig({ isOpen: true, mode: 'export' }) }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}><Icon name="lock" color={VIBRANT_COLORS[5]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>加密导出密码本</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>独立 AES 加密保护</div></div></div>
          <div onClick={scanLatestBackup} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}>
            <Icon name="key" color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>解密恢复密码本</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>从加密文件恢复数据</div>
            </div>
          </div>
          <div onClick={() => { setCryptoInput(""); setCryptoModalConfig({ isOpen: true, mode: 'smart_convert' }) }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', cursor: 'pointer' }}>
            <Icon name="assignment_returned" color={VIBRANT_COLORS[9]} size="var(--icon-base)" style={{ marginRight: 15 }} />
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>从剪贴板智能转换</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>从个人记录导入(仅支持段落式)</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold', marginBottom: '10px' }}>访问安全</div>
        <div style={{ backgroundColor: inputBg, borderRadius: '20px', padding: '5px 20px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="fingerprint" color={VIBRANT_COLORS[0]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>生物识别解锁</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>关闭则强制使用密码</div></div></div>
            <div onClick={() => { if (bioEnabled) setShowBioDisableConfirm(true); else setBioEnabled(true); }} style={{ width: '50px', height: '28px', backgroundColor: bioEnabled ? VIBRANT_COLORS[0] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}><div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: bioEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="dialpad" color={VIBRANT_COLORS[1]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>访问密码标准</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>切换将要求强制重置</div></div></div>
            <div style={{ display: 'flex', backgroundColor: isDark ? '#000' : '#f5f5f5', borderRadius: '8px', padding: '2px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
              <div onClick={() => { if (pinLength !== 4) { setPassAuthInput(""); setPinModalConfig({ isOpen: true, mode: 'force_change_old', payload: 4 }); } }} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: pinLength === 4 ? (isDark ? '#333' : '#fff') : 'transparent', color: pinLength === 4 ? VIBRANT_COLORS[1] : '#8E8E93', cursor: 'pointer' }}>4 位</div>
              <div onClick={() => { if (pinLength !== 6) { setPassAuthInput(""); setPinModalConfig({ isOpen: true, mode: 'force_change_old', payload: 6 }); } }} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: 'var(--text-sm)', fontWeight: 'bold', backgroundColor: pinLength === 6 ? (isDark ? '#333' : '#fff') : 'transparent', color: pinLength === 6 ? VIBRANT_COLORS[1] : '#8E8E93', cursor: 'pointer' }}>6 位</div>
            </div>
          </div>

          <div onClick={() => { setPassAuthInput(""); setPinModalConfig({ isOpen: true, mode: 'change_old' }); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, cursor: 'pointer' }}><Icon name="pin" color={VIBRANT_COLORS[2]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>修改访问密码</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>在当前密码标准下修改</div></div></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="shuffle" color={VIBRANT_COLORS[8]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>开屏乱序键盘</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>防窥视乱序布局</div></div></div>
            <div onClick={() => setShuffleKeypadEnabled(!shuffleKeypadEnabled)} style={{ width: '50px', height: '28px', backgroundColor: shuffleKeypadEnabled ? VIBRANT_COLORS[8] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}><div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: shuffleKeypadEnabled ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="visibility" color={VIBRANT_COLORS[11]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>密码截屏权限</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>密码明文状态下截屏</div></div></div>
            <div onClick={() => setAllowScreenshot(!allowScreenshot)} style={{ width: '50px', height: '28px', backgroundColor: allowScreenshot ? VIBRANT_COLORS[11] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}><div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: allowScreenshot ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Icon name="content_copy" color={VIBRANT_COLORS[7]} size="var(--icon-base)" style={{ marginRight: 15 }} /><div><div style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: textColor }}>密码复制权限</div><div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93' }}>密码明文状态下复制</div></div></div>
            <div onClick={() => setAllowPasswordCopy(!allowPasswordCopy)} style={{ width: '50px', height: '28px', backgroundColor: allowPasswordCopy ? VIBRANT_COLORS[7] : (isDark ? '#444' : '#E5E5EA'), borderRadius: '14px', padding: '2px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}><div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: allowPasswordCopy ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} /></div>
          </div>
        </div>

        <div onDoubleClick={() => { setShowAboutModal(true); setAboutView('intro'); }} className="btn-jelly" style={{ margin: '40px 0 calc(40px + env(safe-area-inset-bottom, 0px)) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#8E8E93', fontSize: 'var(--text-xs)', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}>
          <div>- © 2026 La Clave -</div>
          <div><strong>tt</strong> sorgt für deine Datensicherheit 🛡️</div>
          <div>mit ❤️ von Tun&PaMa Familie</div>
        </div>
      </div>
    );
  };

  const renderPassDrawer = () => {
    const generateRandomPwd = () => {
      const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const lower = 'abcdefghjkmnpqrstuvwxyz';
      const nums = '23456789';
      const syms = '.!';

      const getRandom = (str: string, count: number) => Array.from({ length: count }, () => str[Math.floor(Math.random() * str.length)]);

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
      setPassForm({ ...passForm, password: chars.join('') });
    };
    const isOverloaded = new Set(Object.values(categoryColorMap)).size >= VIBRANT_COLORS.length;
    const drawerTransform = isPassDrawerOpen
      ? `translateY(${passDrawerY}px)`
      : (isSearchDrawerHidden ? `translateY(100%)` : `translateY(calc(100% - 60px))`);

    return (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'auto', maxHeight: '95vh', transform: drawerTransform, transition: isDraggingPassDrawer ? 'none' : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)', zIndex: 200, display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
        <div {...bindPassDrawer()} style={{ cursor: 'grab', touchAction: 'none', backgroundColor: inputBg, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: isDark ? '0 -10px 30px rgba(0,0,0,0.8)' : '0 -10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', height: '60px', filter: 'drop-shadow(0 -4px 10px rgba(0,0,0,0.1))' }}>
            <div style={{ width: '160px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <div style={{ width: '50px', height: '4px', backgroundColor: '#8E8E93', borderRadius: '2px', opacity: 0.8 }} />
              <div style={{ width: '35px', height: '4px', backgroundColor: '#8E8E93', borderRadius: '2px', opacity: 0.5 }} />
            </div>
          </div>
          <div style={{ padding: '0 25px 15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${isDark ? '#333' : '#F0F0F0'}` }}>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', color: textColor }}>{editingPassId ? "编辑账号" : "新增账号"}</span>
            {editingPassId && (
              <div onClick={(e: any) => { e.stopPropagation(); setShowPassDeleteConfirm(editingPassId); }} className="btn-jelly" style={{ display: 'flex', alignItems: 'center', backgroundColor: isDark ? '#4a1c1c' : '#FFEBEE', color: isDark ? '#ff8a80' : '#D32F2F', padding: '6px 14px', borderRadius: '12px', cursor: 'pointer' }}>
                <Icon name="delete" size="var(--icon-sm)" color="inherit" style={{ marginRight: '4px' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>删除</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: inputBg, display: 'flex', flexDirection: 'column' }}>
          <div className="scroll-container hide-scrollbar" style={{ flex: 1, minHeight: 0, padding: '20px 25px 5px 25px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1.3 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>账号标题</div>
                <input placeholder="如: ING Bank" value={passForm.title} onChange={e => setPassForm({ ...passForm, title: e.target.value })} style={{ width: '100%', height: '51px', padding: '14px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>分类</div>
                {passForm.category === '自定义' ? (
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, overflow: 'hidden', height: '51px' }}>
                    <input
                      placeholder="输入新分类" value={passForm.customCat}
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
                    <Icon name="close" size="var(--icon-base)" color="#8E8E93" onClick={() => setPassForm({ ...passForm, category: '银行', customCat: '', color: categoryColorMap['银行'] || "" })} style={{ padding: '0 10px', cursor: 'pointer' }} />
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div onClick={() => setPassCatDropOpen(!passCatDropOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, height: '51px', padding: '0 14px', cursor: 'pointer' }}>
                      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', color: categoryColorMap[passForm.category] ? categoryColorMap[passForm.category] : textColor }}>{passForm.category}</span>
                      <Icon name={passCatDropOpen ? "expand_less" : "expand_more"} color="#8E8E93" size="var(--icon-base)" />
                    </div>
                    {passCatDropOpen && (
                      <div className="scroll-container" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', backgroundColor: pmBg, borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, maxHeight: '200px', overflowY: 'auto', zIndex: 300, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                        {Array.from(new Set(["银行", "邮箱", "其他", ...allVaultCats, "自定义"])).map(cat => (
                          <div key={cat} onClick={() => { if (cat === "自定义") { if (isOverloaded) showAlert("色盘已全部分配！现开放自由选择。", false); setPassForm({ ...passForm, category: cat, customCat: "", color: VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0] }); } else { if (!categoryColorMap[cat] && isOverloaded) showAlert("色盘已全部分配！现开放自由选择。", false); setPassForm({ ...passForm, category: cat, color: categoryColorMap[cat] || VIBRANT_COLORS.find(c => !usedColors.includes(c)) || VIBRANT_COLORS[0] }); } setPassCatDropOpen(false); }} style={{ padding: '14px 18px', borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, color: (passForm.category === cat && categoryColorMap[cat]) ? categoryColorMap[cat] : textColor, fontWeight: passForm.category === cat ? 'bold' : 'normal', cursor: 'pointer', fontSize: 'var(--text-base)' }}>{cat}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>{isOverloaded ? "标记颜色 (限制解除)" : "标记颜色 (与分类绑定)"}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', backgroundColor: pmBg, padding: '12px', borderRadius: '16px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}` }}>
                {VIBRANT_COLORS.map(c => {
                  const activeCat = passForm.category === '自定义' ? passForm.customCat.trim() : passForm.category;
                  const isLocked = !!categoryColorMap[activeCat] && categoryColorMap[activeCat] !== c;
                  const isUsed = safeNotes.some(n => n.category !== activeCat && n.color === c);
                  const isDisabled = isLocked || (!isOverloaded && isUsed);
                  return (
                    <div key={c} onClick={(e) => { e.stopPropagation(); if (isDisabled) { showAlert(isLocked ? "已被绑定颜色" : "已被其他分类占用", false); return; } setPassForm({ ...passForm, color: c }); }} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: passForm.color === c ? `3px solid ${isDark ? '#FFF' : '#000'}` : '3px solid transparent', cursor: isDisabled ? 'not-allowed' : 'pointer', margin: 'auto', opacity: isDisabled ? 0.2 : 1, transform: isDisabled ? 'scale(0.8)' : 'scale(1)', transition: 'all 0.2s' }} />
                  )
                })}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}><div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>账号</div><input placeholder="用户名/邮箱/手机号" value={passForm.account} onChange={e => setPassForm({ ...passForm, account: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>密码</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input placeholder="自定义/随机" value={passForm.password} onChange={e => setPassForm({ ...passForm, password: e.target.value })} style={{ width: '100%', padding: '14px', paddingRight: '80px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box' }} />
                <div onClick={generateRandomPwd} className="btn-jelly" style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', padding: '0 16px', borderRadius: '10px', backgroundColor: passForm.color || VIBRANT_COLORS[0], color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: `0 2px 8px ${passForm.color || VIBRANT_COLORS[0]}40` }}>随机</div>
              </div>
            </div>
            <div style={{ marginBottom: '5px' }}><div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '6px', fontWeight: 'bold' }}>附加信息 (最多 8 行)</div><textarea placeholder="如密保问题..." value={passForm.extra} onChange={e => { if (e.target.value.split('\n').length > 8) { showAlert("最多输入 8 行", true); return; } setPassForm({ ...passForm, extra: e.target.value }); }} style={{ width: '100%', height: '120px', padding: '14px', borderRadius: '14px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: pmBg, color: textColor, fontSize: 'var(--text-base)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} /></div>
          </div>
          <div style={{ padding: '15px 25px calc(20px + env(safe-area-inset-bottom, 0px)) 25px', backgroundColor: inputBg, display: 'flex', gap: '20px', borderTop: `1px solid ${isDark ? '#333' : '#F0F0F0'}`, zIndex: 10 }}>
            <div onClick={() => { setPassDrawerY(window.innerHeight); setTimeout(closeAndResetDrawer, 300); }} className="btn-jelly" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '16px', backgroundColor: pmBg, color: textColor, fontWeight: 'bold', fontSize: 'var(--text-lg)', cursor: 'pointer' }}>取消</div>
            <div onClick={savePassForm} className="btn-jelly" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '16px', backgroundColor: passForm.color || VIBRANT_COLORS[0], color: '#FFF', fontWeight: 'bold', fontSize: 'var(--text-lg)', cursor: 'pointer', boxShadow: `0 8px 20px ${passForm.color || VIBRANT_COLORS[0]}66` }}>确认保存</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAboutModal = () => {
    if (!showAboutModal) return null;
    const isDark = themeMode === 'dark';

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100005, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAboutModal(false)}>
        <style>{`@keyframes slideDownCenter { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <div onClick={e => e.stopPropagation()} style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideDownCenter 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <img src="/laclave_logo.png" alt="logo" style={{ width: '64px', height: '64px', borderRadius: '16px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', objectFit: 'cover', filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
            <div style={{ fontFamily: "'Pacifico', cursive", fontSize: 'var(--text-3xl)', color: isDark ? '#FFF' : '#000', marginBottom: '5px' }}>La Clave</div>
          </div>

          {aboutView === 'intro' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '25px', animation: 'fadeIn 0.3s' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontWeight: 'bold' }}>Version: {APP_VERSION}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#8E8E93', textAlign: 'center', lineHeight: '1.6' }}>
                <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Frontend:</span> React, TypeScript<br />
                <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Security:</span> CryptoJS <br />
                <span style={{ fontWeight: 'bold', color: isDark ? '#CCC' : '#666' }}>Build:</span> Capacitor + AS
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', fontStyle: 'italic', marginTop: '10px' }}>Deine Passwörter. Sicher verwahrt.</div>
            </div>
          ) : (
            <div className="scroll-container hide-scrollbar" style={{ flex: 1, maxHeight: '260px', overflowY: 'auto', marginBottom: '25px', backgroundColor: isDark ? '#000' : '#F5F5F7', padding: '15px', borderRadius: '16px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, animation: 'fadeIn 0.3s' }}>
              <div style={{ color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-sm)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                <strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.1.1 (当前) </strong><br />
                - 新增：专属PIN码键盘，支持乱序<br />
                - 新增：新增密码截屏权限开关<br />
                - 修复：后台并行生命周期致闪退<br />
                - 修复：生物识别关闭失效<br />
                - 修改：访问安全卡片和对应弹窗<br />
                <br /><strong style={{ color: VIBRANT_COLORS[5], fontSize: 'var(--text-base)' }}>v1.1.0</strong><br />
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

          <div style={{ display: 'flex', gap: '15px' }}>
            <div onClick={() => setShowAboutModal(false)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '14px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}>
              关闭
            </div>
            <div onClick={() => setAboutView(aboutView === 'intro' ? 'changelog' : 'intro')} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '14px', backgroundColor: VIBRANT_COLORS[5], color: '#FFF', fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 12px ${VIBRANT_COLORS[5]}66` }}>
              {aboutView === 'intro' ? '更新日志' : '回到简介'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthPassed) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <AuthSplashView
          isDark={themeMode === 'dark'}
          autoTrigger={!isAutoLocked && bioEnabled}
          skipAnimation={isAutoLocked}
          bioEnabled={bioEnabled}
          disableTrigger={pinModalConfig.isOpen}
          onAuthSuccess={() => { setIsAuthPassed(true); setIsAutoLocked(false); isAutoLockedRef.current = false; }}
          onRequirePin={() => {
            setPinModalConfig({ isOpen: true, mode: 'verify_app_launch' });
          }}
        />
        {pinModalConfig.isOpen && pinModalConfig.mode === 'verify_app_launch' && renderUnifiedPinModal()}

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
            <Icon name={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? 'error' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? 'check_circle' : 'info')} color={alertMsg.text.includes('失败') || alertMsg.text.includes('错误') || alertMsg.text.includes('占用') || alertMsg.text.includes('绑定') || alertMsg.text.includes('拒绝') || alertMsg.text.includes('不能') || alertMsg.text.includes('最多') || alertMsg.text.includes('为空') ? '#FF3B30' : (alertMsg.text.includes('已') || alertMsg.text.includes('成功') ? '#34C759' : '#FF9500')} size="var(--icon-lg)" />
            <span>{alertMsg.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`app-container ${fontSizeMode === 'large' ? 'font-large' : ''}`} style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      backgroundColor: pmBg,
      color: textColor,
      transition: 'background-color 0.3s',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ paddingTop: Capacitor.getPlatform() === 'android' ? '45px' : 'calc(20px + env(safe-area-inset-top, 0px))', paddingBottom: '10px', display: 'flex', alignItems: 'center', paddingLeft: '25px', paddingRight: '25px', zIndex: 10 }}>
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

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {passTab === 'home' && renderHomeView()}
        {passTab === 'vault' && renderVaultView()}
        {passTab === 'settings' && renderSettingsView()}
      </div>

      {passTab !== 'settings' && renderPassDrawer()}

      {pinModalConfig.isOpen && renderUnifiedPinModal()}
      {cryptoModalConfig.isOpen && renderCryptoModal()}
      {showAboutModal && renderAboutModal()}

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
                  <div key={c}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDisabled) {
                        showAlert("已被其他分类占用", false);
                        return;
                      }
                      setEditingVaultCatForm({ ...editingVaultCatForm, color: c });
                    }}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                      border: editingVaultCatForm.color === c ? `3px solid ${isDark ? '#FFF' : '#000'}` : '3px solid transparent',
                      cursor: isDisabled ? 'not-allowed' : 'pointer', margin: 'auto',
                      opacity: isDisabled ? 0.2 : 1,
                      transform: isDisabled ? 'scale(0.8)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setEditingVaultCat(null)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div onClick={() => {
                const newName = editingVaultCatForm.name.trim();
                if (!newName) { showAlert("分类名称不能为空", false); return; }
                setSafeNotes(prev => prev.map(n => n.category === editingVaultCat ? { ...n, category: newName, color: editingVaultCatForm.color } : n));
                if (selectedVaultCat === editingVaultCat) setSelectedVaultCat(newName);
                setEditingVaultCat(null);
                showAlert("分类已更新", false);
              }} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: editingVaultCatForm.color, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>保存修改</div>
            </div>
          </div>
        </div>
      )}

      {showColorReassignConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowColorReassignConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '15px', color: textColor, textAlign: 'center' }}>确认需要重分配颜色？</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '25px', lineHeight: '1.5', textAlign: 'center' }}>将为仓库中已有分类重新分配随机色彩<br />该操作后立即生效记忆！</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowColorReassignConfirm(false)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div onClick={() => {
                const currentCats = Array.from(new Set(safeNotes.map(n => n.category)));
                const shuffledColors = [...VIBRANT_COLORS].sort(() => Math.random() - 0.5);
                const newColorMap: Record<string, string> = {};
                currentCats.forEach((cat, index) => newColorMap[cat] = shuffledColors[index % shuffledColors.length]);
                setSafeNotes(prev => prev.map(note => ({ ...note, color: newColorMap[note.category] || note.color })));
                setShowColorReassignConfirm(false);
                showAlert("颜色已全部随机重分配！", false);
              }} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: VIBRANT_COLORS[6], color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${VIBRANT_COLORS[6]}66`, cursor: 'pointer' }}>确认执行</div>
            </div>
          </div>
        </div>
      )}

      {quickEditCatId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setQuickEditCatId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '85%', maxWidth: '340px', backgroundColor: inputBg, borderRadius: '24px', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: '900', marginBottom: '20px', color: textColor, textAlign: 'center' }}>转移到其他分类</div>

            <div className="scroll-container hide-scrollbar" style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', borderRadius: '16px', border: `1px solid ${isDark ? '#333' : '#E5E5EA'}` }}>
              {allVaultCats.map(cat => {
                const noteToMove = safeNotes.find(n => n.id === quickEditCatId);
                const isActive = noteToMove?.category === cat;
                return (
                  <div key={cat} onClick={() => {
                    if (!isActive) {
                      setSafeNotes(prev => prev.map(n => n.id === quickEditCatId ? { ...n, category: cat, color: getCatColor(cat) } : n));
                      showAlert(`已移至 ${cat}`, true);
                    }
                    setQuickEditCatId(null);
                  }} style={{ padding: '16px 20px', borderBottom: `1px solid ${isDark ? '#333' : '#E5E5EA'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isActive ? (isDark ? '#333' : '#F5F5F7') : 'transparent', cursor: isActive ? 'default' : 'pointer', transition: 'background-color 0.2s' }}>
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

      {showPassDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowPassDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '15px', color: textColor, textAlign: 'center' }}>确认删除此账号？</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '25px', lineHeight: '1.5', textAlign: 'center' }}>此操作不可逆，删除后数据将无法找回。</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowPassDeleteConfirm(null)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div onClick={() => {
                setSafeNotes(prev => prev.filter(n => n.id !== showPassDeleteConfirm));
                setShowPassDeleteConfirm(null);
                setPassDrawerY(window.innerHeight);
                setTimeout(closeAndResetDrawer, 300);
                showAlert("账号已删除", true);
              }} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: isDark ? '#640D36' : '#A10022', color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(161,0,34,0.3)'}`, cursor: 'pointer' }}>确认删除</div>
            </div>
          </div>
        </div>
      )}
      {showBioDisableConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }} onClick={() => setShowBioDisableConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '320px', backgroundColor: inputBg, borderRadius: '20px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <Icon name="fingerprint" size="var(--icon-xl)" color={VIBRANT_COLORS[0]} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: textColor }}>确认关闭生物识别？</div>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
              关闭后进入 App 尽可输入数字密码<br />
              请确保您已牢记当前密码！
              {safePassword === "1234" && (
                <div style={{ color: VIBRANT_COLORS[1], marginTop: '10px', fontWeight: 'bold' }}>⚠️ 当前仍为默认密码(1234)<br />强烈建议更改！</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setShowBioDisableConfirm(false)} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: pmBg, color: '#8E8E93', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
              <div onClick={() => {
                setBioEnabled(false);
                setShowBioDisableConfirm(false);
                showAlert("生物识别已关闭", true);
              }} className="btn-jelly" style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: VIBRANT_COLORS[0], color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${VIBRANT_COLORS[0]}66`, cursor: 'pointer' }}>确认关闭</div>
            </div>
          </div>
        </div>
      )}
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

      <input type="file" id="safe-notes-upload" style={{ display: 'none' }} onChange={handleSafeNotesFile} accept=".txt" />
    </div>
  );
}

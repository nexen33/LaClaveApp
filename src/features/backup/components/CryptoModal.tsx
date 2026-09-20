import React, { useState, useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Icon } from '../../../components/ui/Icon';
import { VIBRANT_COLORS } from '../../../constants/colors';
import { exportModernBackup, importBackupSmart } from '../services/backupService';

export interface CryptoModalConfig {
  isOpen: boolean;
  mode: 'export' | 'import' | 'smart_import' | 'smart_convert' | 'smart_convert_confirm';
  payload?: any;
}

interface CryptoModalProps {
  config: CryptoModalConfig;
  setConfig?: React.Dispatch<React.SetStateAction<CryptoModalConfig>>;
  onClose: () => void;
  isDark: boolean;
  safeNotes: any[];
  setSafeNotes: React.Dispatch<React.SetStateAction<any[]>>;
  categoryColorMap: Record<string, string>;
  triggerFilePicker: () => void;
  showAlert: (msg: string, isBottom?: boolean, duration?: number) => void;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({
  config,
  setConfig,
  onClose,
  isDark,
  safeNotes,
  setSafeNotes,
  categoryColorMap,
  triggerFilePicker,
  showAlert
}) => {
  const [cryptoInput, setCryptoInput] = useState("");
  const [showCryptoInput, setShowCryptoInput] = useState(false);
  const [cryptoConfirmInput, setCryptoConfirmInput] = useState("");
  const [showCryptoConfirmInput, setShowCryptoConfirmInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  if (!config.isOpen) return null;

  // 内部专属的文本解析引擎
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
        const account = lines[1].replace(/^(账号|帐号|账号：|账号:|帐号：|帐号:|Account:|Account：)\s*/i, '');
        const password = lines[2].replace(/^(密码|密码：|密码:|Password:|Password：)\s*/i, '');
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

  // 智能导入模式 - 输入框界面
  if (config.mode === 'smart_convert') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '15vh', justifyContent: 'center' }}>
        <div className="modal-standard-size" style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Icon name="assignment_returned" size="var(--icon-xl)" color={VIBRANT_COLORS[9]} style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>智能转换导入</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px' }}>支持段落式导入 (标题/账号/密码/备注)</div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <textarea autoFocus placeholder={"标题1\n(账号:)xxx\n(密码:)xxx\n(附加信息们)\n\n标题2\n...\n(段落间需空行，仅支持追加导入)"} value={cryptoInput} onChange={e => setCryptoInput(e.target.value)} style={{ width: '100%', height: '180px', padding: '16px', borderRadius: '16px', border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`, backgroundColor: isDark ? '#000' : '#F5F5F7', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'monospace' }} />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div onClick={() => { onClose(); setCryptoInput(""); }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>取消</div>
            <div onClick={() => {
              if (!cryptoInput.trim()) { showAlert("输入不能为空", false); return; }
              const parsed = handleSmartConvert(cryptoInput);
              if (parsed.length === 0) { showAlert("未识别到有效格式", false); return; }
              if (setConfig) {
                setConfig({ isOpen: true, mode: 'smart_convert_confirm', payload: parsed });
              } else {
                config.mode = 'smart_convert_confirm';
                config.payload = parsed;
              }
            }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: VIBRANT_COLORS[9], color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>识别解析</div>
          </div>
        </div>
      </div>
    );
  }

  // 智能导入模式 - 确认界面
  if (config.mode === 'smart_convert_confirm') {
    const parsedList = config.payload || [];
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '20vh', justifyContent: 'center' }}>
        <div className="modal-standard-size" style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <Icon name="check_circle" size="var(--icon-xl)" color="#34C759" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>识别完成</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '10px', lineHeight: '1.5' }}>
              成功解析出 <span style={{ color: '#34C759', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{parsedList.length}</span> 条账号记录<br />
              即将存入「未分类」组 (随机分配颜色)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div onClick={() => {
              if (setConfig) setConfig({ isOpen: true, mode: 'smart_convert' });
              else config.mode = 'smart_convert';
            }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>返回修改</div>
            <div onClick={() => {
              if (isProcessingRef.current) return;
              isProcessingRef.current = true;
              setSafeNotes(prev => [...prev, ...parsedList]);
              onClose();
              setCryptoInput("");
              showAlert(`成功导入 ${parsedList.length} 条记录！`, false);
              setTimeout(() => { isProcessingRef.current = false; }, 300);
            }} className="btn-jelly" style={{ flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: '#34C759', color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>确认导入</div>
          </div>
        </div>
      </div>
    );
  }

  // 智能恢复专属弹窗 (紫色)
  if (config.mode === 'smart_import') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '25vh', justifyContent: 'center' }}>
        <div className="modal-standard-size" style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <Icon name="manage_search" size="var(--icon-xl)" color="#AF52DE" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>发现最新备份</div>
            <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px', wordBreak: 'break-all' }}>{config.payload}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={async () => {
              try {
                const file = await Filesystem.readFile({ path: `LaClave/${config.payload}`, directory: Directory.Documents, encoding: Encoding.UTF8 });
                if (setConfig) setConfig({ isOpen: true, mode: 'import', payload: file.data });
                else { config.mode = 'import'; config.payload = file.data; }
              } catch { showAlert("读取文件失败", true); }
            }} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: '#AF52DE', color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>使用此备份恢复</div>
            <div onClick={() => { onClose(); triggerFilePicker(); }} className="btn-jelly" style={{ width: '100%', padding: '15px', textAlign: 'center', borderRadius: '16px', backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000', fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer' }}>手动选择文件</div>
            <div onClick={onClose} style={{ width: '100%', padding: '10px', textAlign: 'center', color: '#8E8E93', fontSize: 'var(--text-sm)', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>取消</div>
          </div>
        </div>
      </div>
    );
  }

  const isExport = config.mode === 'export';
  const iconColor = isExport ? '#007AFF' : '#AF52DE'; // 导出蓝，导入紫
  const isPasswordMismatch = isExport && cryptoConfirmInput.length > 0 && cryptoInput !== cryptoConfirmInput;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'flex-start', paddingTop: '22vh', justifyContent: 'center' }}>
      <div className="modal-standard-size" style={{ width: '85%', maxWidth: '340px', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderRadius: '24px', padding: '30px 25px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'popInModal 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Icon name={isExport ? "enhanced_encryption" : "key"} size="var(--icon-xl)" color={iconColor} style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>{isExport ? "安全加密导出" : "解密恢复"}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: '#8E8E93', marginTop: '5px' }}>{isExport ? "设置导出密钥" : "请输入此文件的解密密钥"}</div>
        </div>

        {/* 第一道密钥输入框 */}
        <div style={{ position: 'relative', marginBottom: isExport ? '15px' : '25px' }}>
          <input
            autoFocus
            type={showCryptoInput ? "text" : "password"}
            placeholder={isExport ? "设置导出密钥..." : "输入密钥..."}
            value={cryptoInput}
            onChange={e => setCryptoInput(e.target.value)}
            style={{
              width: '100%', padding: '16px', paddingRight: '50px', borderRadius: '16px',
              border: `1px solid ${isDark ? '#444' : '#E5E5EA'}`,
              backgroundColor: isDark ? '#000' : '#F5F5F7', color: isDark ? '#FFF' : '#000',
              fontSize: 'var(--text-lg)', outline: 'none', boxSizing: 'border-box'
            }}
          />
          <div onClick={() => setShowCryptoInput(!showCryptoInput)} style={{ position: 'absolute', right: '15px', top: '16px', color: '#8E8E93', cursor: 'pointer' }}>
            <Icon name={showCryptoInput ? "visibility_off" : "visibility"} size="var(--icon-base)" />
          </div>
        </div>

        {/* 导出时强制第二道密钥输入框（防手滑死档） */}
        {isExport && (
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showCryptoConfirmInput ? "text" : "password"}
              placeholder="再次确认密钥..."
              value={cryptoConfirmInput}
              onChange={e => setCryptoConfirmInput(e.target.value)}
              style={{
                width: '100%', padding: '16px', paddingRight: '50px', borderRadius: '16px',
                border: `1px solid ${isPasswordMismatch ? '#FF3B30' : (isDark ? '#444' : '#E5E5EA')}`,
                backgroundColor: isDark ? '#000' : '#F5F5F7', color: isDark ? '#FFF' : '#000',
                fontSize: 'var(--text-lg)', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <div onClick={() => setShowCryptoConfirmInput(!showCryptoConfirmInput)} style={{ position: 'absolute', right: '15px', top: '16px', color: '#8E8E93', cursor: 'pointer' }}>
              <Icon name={showCryptoConfirmInput ? "visibility_off" : "visibility"} size="var(--icon-base)" />
            </div>
            {isPasswordMismatch && (
              <div style={{ fontSize: 'var(--text-xs)', color: '#FF3B30', marginTop: '6px', paddingLeft: '4px' }}>两次输入的密钥不一致</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <div
            onClick={() => { onClose(); setCryptoInput(""); setCryptoConfirmInput(""); }}
            className="btn-jelly"
            style={{
              flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px',
              backgroundColor: isDark ? '#333' : '#E5E5EA', color: isDark ? '#FFF' : '#000',
              fontSize: 'var(--text-base)', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            取消
          </div>
          <div
            onClick={async () => {
              if (isProcessingRef.current) return;
              if (!cryptoInput.trim()) { showAlert("密钥不能为空", true); return; }
              if (isExport) {
                if (cryptoInput !== cryptoConfirmInput) { showAlert("两次输入的导出密钥不一致", true); return; }
                isProcessingRef.current = true;
                setIsProcessing(true);
                try {
                  const encryptedData = await exportModernBackup(safeNotes, cryptoInput);
                  const y = new Date().getFullYear();
                  const m = String(new Date().getMonth() + 1).padStart(2, '0');
                  const d = String(new Date().getDate()).padStart(2, '0');
                  const fileName = `LaClave_${y}-${m}-${d}.txt`;
                  await Filesystem.writeFile({ path: `LaClave/${fileName}`, data: encryptedData, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
                  showAlert(`已安全加密导出至 Documents/LaClave 🔒`, true, 6000);
                } catch (error: any) {
                  showAlert(`导出失败: ${error.message || '存储异常'}`, true);
                  return;
                } finally {
                  isProcessingRef.current = false;
                  setIsProcessing(false);
                }
              } else {
                isProcessingRef.current = true;
                setIsProcessing(true);
                try {
                  const { notes: parsed, version } = await importBackupSmart(config.payload, cryptoInput);
                  if (Array.isArray(parsed)) {
                    setSafeNotes(prev => {
                      const merged = [...prev];
                      parsed.forEach((newItem: any) => {
                        const idx = merged.findIndex(a => a.id === newItem.id);
                        if (idx > -1) merged[idx] = newItem; else merged.push(newItem);
                      });
                      return merged;
                    });
                    const versionLabel = version === 1 ? '旧版格式' : 'V2安全格式';
                    showAlert(`成功恢复 ${parsed.length} 条账号 🔓 (${versionLabel})`, true);
                  }
                } catch (err: any) {
                  showAlert(`❌ ${err.message || '解密失败：密钥错误或文件损坏'}`, true);
                  return;
                } finally {
                  isProcessingRef.current = false;
                  setIsProcessing(false);
                }
              }
              onClose();
              setCryptoInput("");
              setCryptoConfirmInput("");
              setShowCryptoInput(false);
              setShowCryptoConfirmInput(false);
            }}
            className="btn-jelly"
            style={{
              flex: 1, padding: '15px', textAlign: 'center', borderRadius: '16px',
              backgroundColor: (isExport && isPasswordMismatch) || isProcessing ? '#8E8E93' : iconColor,
              color: '#FFF', fontSize: 'var(--text-base)', fontWeight: 'bold',
              cursor: (isExport && isPasswordMismatch) || isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1,
              pointerEvents: isProcessing ? 'none' : 'auto'
            }}
          >
            {isProcessing ? "处理中..." : (isExport ? "打包" : "解密")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoModal;

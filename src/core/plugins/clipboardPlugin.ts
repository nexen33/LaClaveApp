import { registerPlugin, Capacitor } from '@capacitor/core';

export interface LaClaveSecurityPluginInterface {
  copySensitive(options: { text: string }): Promise<{ success: boolean; ttlMs: number }>;
  clearClipboard(): Promise<{ success: boolean }>;
}

const LaClaveSecurity = registerPlugin<LaClaveSecurityPluginInterface>('LaClaveSecurity');

/**
 * 复制敏感内容至系统剪贴板 (带 Android 13+ 敏感标记与 60 秒延时清除)
 */
export async function copySensitiveClipboard(text: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LaClaveSecurity.copySensitive({ text });
      return res.success;
    } catch (err) {
      console.warn('Native copySensitive failed, fallback to web clipboard:', err);
    }
  }

  // Web 开发环境兜底
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Web clipboard write failed:', err);
      return false;
    }
  }

  return false;
}

/**
 * 主动清空系统剪贴板
 */
export async function clearClipboard(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LaClaveSecurity.clearClipboard();
      return res.success;
    } catch (err) {
      console.warn('Native clearClipboard failed:', err);
    }
  }

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText('');
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

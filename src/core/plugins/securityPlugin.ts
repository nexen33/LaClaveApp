import { registerPlugin, Capacitor } from '@capacitor/core';
import { uint8ArrayToBase64, base64ToUint8Array } from '../crypto/aes';

export interface WrappedKeyResult {
  dek: string;        // Base64
  wrappedDek: string; // Base64
  wrapIv: string;     // Base64
  type: 'ANDROID_KEYSTORE_AES_GCM' | 'WEB_FALLBACK_AES_GCM';
}

export interface NativeSecurityPluginInterface {
  getOrGenerateWrappedKey(): Promise<WrappedKeyResult>;
  unwrapKey(options: { wrappedDek: string; wrapIv: string }): Promise<{ dek: string }>;
  copySensitive(options: { text: string }): Promise<{ success: boolean; ttlMs: number }>;
  clearClipboard(): Promise<{ success: boolean }>;
}

export const LaClaveSecurity = registerPlugin<NativeSecurityPluginInterface>('LaClaveSecurity');

// Web 浏览器本地开发调试环境下的内存 Fallback KEK (不触碰真机硬件)
let webFallbackKek: CryptoKey | null = null;

async function getOrCreateWebKek(): Promise<CryptoKey> {
  if (webFallbackKek) return webFallbackKek;
  webFallbackKek = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return webFallbackKek;
}

/**
 * 获取或生成由 Keystore 包裹的 DEK
 */
export async function getOrGenerateWrappedKey(): Promise<WrappedKeyResult> {
  if (Capacitor.isNativePlatform()) {
    return await LaClaveSecurity.getOrGenerateWrappedKey();
  }

  // Web 开发调试模拟逻辑
  const kek = await getOrCreateWebKek();
  const dekBytes = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, tagLength: 128 },
    kek,
    dekBytes as BufferSource
  );

  return {
    dek: uint8ArrayToBase64(dekBytes),
    wrappedDek: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
    wrapIv: uint8ArrayToBase64(iv),
    type: 'WEB_FALLBACK_AES_GCM'
  };
}

/**
 * 使用 Keystore 解包恢复 256 位 DEK
 */
export async function unwrapKey(wrappedDek: string, wrapIv: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const res = await LaClaveSecurity.unwrapKey({ wrappedDek, wrapIv });
    return res.dek;
  }

  // Web 开发调试模拟逻辑
  const kek = await getOrCreateWebKek();
  const ciphertextBytes = base64ToUint8Array(wrappedDek);
  const ivBytes = base64ToUint8Array(wrapIv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource, tagLength: 128 },
    kek,
    ciphertextBytes as BufferSource
  );

  return uint8ArrayToBase64(new Uint8Array(decryptedBuffer));
}

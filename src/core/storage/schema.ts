/**
 * La Clave V2 密文存储 Schema 与数据模型定义
 * 落盘于 @capacitor/preferences 键 laclave_vault_v2
 */

export interface KeyWrapInfo {
  type: 'ANDROID_KEYSTORE_AES_GCM' | 'WEB_FALLBACK_AES_GCM';
  wrappedDek: string; // Base64 编码的被包裹数据密钥
  wrapIv: string;     // Base64 编码的 12 字节 IV
}

export interface VaultCipherInfo {
  algorithm: 'AES-256-GCM';
  iv: string;         // Base64 编码的 12 字节数据 IV
  tagLength: number;  // 128 位完整性校验 Tag
  ciphertext: string; // Base64 编码的密文字符串 (包含 AuthTag)
}

export interface VaultMetaInfo {
  updatedAt: number;
  itemCount: number;
  schemaVersion: 2;
}

export interface VaultV2Data {
  magic: 'LACLAVE_SECURE_VAULT';
  version: 2;
  keyWrap: KeyWrapInfo;
  cipher: VaultCipherInfo;
  meta: VaultMetaInfo;
}

export const VAULT_STORAGE_KEY_V2 = 'laclave_vault_v2';
export const PIN_AUTH_STORAGE_KEY = 'laclave_pin_auth';
export const MIGRATION_DONE_KEY = 'laclave_migration_done';

// 历史旧明文键名 (迁移后物理抹除)
export const LEGACY_NOTES_KEY = 'laclave_safe_notes';
export const LEGACY_PWD_KEY = 'laclave_safe_pwd';

import {
  encryptVaultData,
  decryptVaultData,
  computeSha256,
  uint8ArrayToBase64,
  base64ToUint8Array
} from '../../../core/crypto/aes';
import { decryptLegacyBackup } from '../../../core/crypto/legacyCrypto';
import type { BackupV2Package, BackupImportResult } from '../types';

export const BACKUP_PBKDF2_ITERATIONS = 600000;

/**
 * 从密码和随机盐通过 PBKDF2-HMAC-SHA256 派生 AES-256-GCM CryptoKey
 */
export async function deriveBackupKey(
  password: string,
  salt: Uint8Array,
  iterations = BACKUP_PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const pwdBytes = new TextEncoder().encode(password);
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    pwdBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 将账号列表加密打包为 V2 现代安全备份格式
 * 包含强制写出前自解密闭环自测试 (Pre-flight Self-Test)
 *
 * @param notes 待备份的账号列表
 * @param password 用户设置的导出密钥
 * @returns 序列化后的 V2 备份 JSON 字符串
 */
export async function exportModernBackup(
  notes: any[],
  password: string
): Promise<string> {
  if (!password || !password.trim()) {
    throw new Error('导出密钥不能为空');
  }

  // 1. 生成 16 字节密码学安全随机盐
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // 2. 派生 256 位 AES-GCM 加密密钥 (600,000 轮 PBKDF2)
  const key = await deriveBackupKey(password, salt, BACKUP_PBKDF2_ITERATIONS);

  // 3. 序列化原始数据
  const plaintext = JSON.stringify(notes);

  // 4. 执行 WebCrypto AES-GCM 强加密 (包含 128 位完整性 AuthTag)
  const { ciphertext, iv, tagLength } = await encryptVaultData(key, plaintext);

  // 5. 计算密文的外层 SHA-256 校验和
  const checksum = await computeSha256(ciphertext);

  // 6. 构造 V2 备份规范包
  const backupPkg: BackupV2Package = {
    format: 'laclave_vault_backup',
    version: 2,
    createdAt: Date.now(),
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations: BACKUP_PBKDF2_ITERATIONS,
      salt: uint8ArrayToBase64(salt)
    },
    crypto: {
      algorithm: 'AES-256-GCM',
      iv,
      tagLength
    },
    ciphertext,
    checksum
  };

  // 7. 刚性写出前闭环自测试 (Pre-flight Self-Test)
  // 在内存中立即解密并比对 SHA-256 哈希，杜绝任何生成“死档”的可能
  try {
    const verifiedPlaintext = await decryptVaultData(key, ciphertext, iv);
    const originHash = await computeSha256(plaintext);
    const verifiedHash = await computeSha256(verifiedPlaintext);

    if (originHash !== verifiedHash) {
      throw new Error('数据一致性校验失败');
    }
  } catch (err: any) {
    throw new Error(`导出前完整性自检失败，已阻断写出：${err.message || '解密校验不匹配'}`);
  }

  return JSON.stringify(backupPkg, null, 2);
}

/**
 * 智能探测并恢复备份数据：
 * - 自动识别 V2 现代 PBKDF2 + AES-GCM 强加密格式并校验完整性
 * - 自动无缝降级解密以 U2FsdGVk 开头的旧版 CryptoJS 备份
 * - 严格拒绝未加密的明文备份
 *
 * @param rawContent 读取的备份文件原文
 * @param password 用户输入的解密密钥
 * @returns 恢复解析出的账号记录与格式版本标识
 */
export async function importBackupSmart(
  rawContent: string,
  password: string
): Promise<BackupImportResult> {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('备份文件内容为空');
  }
  if (!password || !password.trim()) {
    throw new Error('解密密钥不能为空');
  }

  const trimmed = rawContent.trim();

  // 1. 安全防线：坚决拦截未加密的纯文本或裸 JSON 结构
  if (trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.includes('"laclave_vault_backup"'))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        throw new Error('UNENCRYPTED_BACKUP: 拒绝导入：该文件未加密！');
      }
    } catch (e: any) {
      if (e.message.startsWith('UNENCRYPTED_BACKUP')) {
        throw e;
      }
    }
  }

  // 2. 嗅探是否为 V2 规范包
  let isV2 = false;
  let v2Pkg: BackupV2Package | null = null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.format === 'laclave_vault_backup' && parsed.version === 2) {
      isV2 = true;
      v2Pkg = parsed as BackupV2Package;
    }
  } catch {
    isV2 = false;
  }

  // 3. 走 V2 现代安全解密管线
  if (isV2 && v2Pkg) {
    // 校验和防篡改初检
    const computedChecksum = await computeSha256(v2Pkg.ciphertext);
    if (computedChecksum !== v2Pkg.checksum) {
      throw new Error('备份文件已被损坏或篡改：校验和不匹配');
    }

    try {
      const salt = base64ToUint8Array(v2Pkg.kdf.salt);
      const key = await deriveBackupKey(password, salt, v2Pkg.kdf.iterations || BACKUP_PBKDF2_ITERATIONS);
      const decryptedPlaintext = await decryptVaultData(key, v2Pkg.ciphertext, v2Pkg.crypto.iv);
      const parsedNotes = JSON.parse(decryptedPlaintext);

      if (!Array.isArray(parsedNotes)) {
        throw new Error('备份内容无效，非有效账号列表');
      }
      return { notes: parsedNotes, version: 2 };
    } catch {
      throw new Error('解密失败：密钥错误或备份文件已损坏');
    }
  }

  // 4. 走旧版 CryptoJS 兼容解密管线 (U2FsdGVk 等格式)
  const legacyNotes = decryptLegacyBackup(trimmed, password);
  return { notes: legacyNotes, version: 1 };
}

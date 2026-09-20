/**
 * 现代密码学安全备份包规范定义 (V2)
 */
export interface BackupV2Package {
  format: 'laclave_vault_backup';
  version: 2;
  createdAt: number;
  kdf: {
    algorithm: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number; // 600,000
    salt: string;       // Base64 (16 字节随机盐)
  };
  crypto: {
    algorithm: 'AES-256-GCM';
    iv: string;         // Base64 (12 字节随机 IV)
    tagLength: number;  // 128 位认证标签
  };
  ciphertext: string;   // Base64 编码密文 (包含 16 字节 GCM AuthTag)
  checksum: string;     // 密文 SHA-256 校验和 (HEX)
}

/**
 * 备份导入解析结果
 */
export interface BackupImportResult {
  notes: any[];
  version: 1 | 2;
}

import { Preferences } from '@capacitor/preferences';
import { encryptVaultData, decryptVaultData } from '../crypto/aes';
import { type VaultV2Data, type KeyWrapInfo, VAULT_STORAGE_KEY_V2 } from './schema';

/**
 * 将账本数据使用 DEK 执行 AES-256-GCM 加密，并持久化写入 Preferences 的 laclave_vault_v2
 * 绝对不向任何位置落盘明文账本
 */
export async function saveEncryptedVault(
  dek: CryptoKey,
  notes: any[],
  keyWrap: KeyWrapInfo
): Promise<void> {
  const plaintext = JSON.stringify(notes);
  const { ciphertext, iv, tagLength } = await encryptVaultData(dek, plaintext);

  const vaultPayload: VaultV2Data = {
    magic: 'LACLAVE_SECURE_VAULT',
    version: 2,
    keyWrap,
    cipher: {
      algorithm: 'AES-256-GCM',
      iv,
      tagLength,
      ciphertext
    },
    meta: {
      updatedAt: Date.now(),
      itemCount: notes.length,
      schemaVersion: 2
    }
  };

  await Preferences.set({
    key: VAULT_STORAGE_KEY_V2,
    value: JSON.stringify(vaultPayload)
  });
}

/**
 * 读取并使用 DEK 解密 laclave_vault_v2 中的账本数据
 */
export async function loadEncryptedVault(
  dek: CryptoKey,
  vaultData: VaultV2Data
): Promise<any[]> {
  const plaintext = await decryptVaultData(
    dek,
    vaultData.cipher.ciphertext,
    vaultData.cipher.iv
  );
  return JSON.parse(plaintext);
}

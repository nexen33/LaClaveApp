import CryptoJS from 'crypto-js';

/**
 * 判断给定字符串是否符合旧版 CryptoJS AES (OpenSSL 格式) 密文特征
 * 标准 OpenSSL 密文字符串通常以 "U2FsdGVk" (即 'Salted__' 的 Base64) 开头
 */
export function isLegacyBackupFormat(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('U2FsdGVk')) {
    return true;
  }
  // 如果不是 JSON 格式，尝试作为旧版处理
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return true;
  }
  return false;
}

/**
 * 针对历史老旧备份文件的只读兼容解密解析器
 * 100% 还原旧版 CryptoJS.AES.decrypt 逻辑，确保老用户历史备份永久可读
 *
 * @param ciphertext 旧版 Base64 密文字符串
 * @param password 用户输入的解密密钥
 * @returns 解析还原的账号数据数组
 */
export function decryptLegacyBackup(ciphertext: string, password: string): any[] {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext.trim(), password);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) {
      throw new Error('解密结果为空，密钥错误');
    }
    const parsed = JSON.parse(decryptedData);
    if (!Array.isArray(parsed)) {
      throw new Error('旧版备份数据格式无效，非数组结构');
    }
    return parsed;
  } catch (error: any) {
    throw new Error('旧版格式解密失败：密钥错误或备份文件损坏');
  }
}

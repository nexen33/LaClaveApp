/**
 * WebCrypto AES-256-GCM 封装 (AuthTag、加解密与 SHA-256 内容哈希)
 * 100% 依赖浏览器/WebView 原生原生 window.crypto，零第三方库开销
 */

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * 将 Base64 编码的 32 字节 DEK 导入为 WebCrypto AES-GCM CryptoKey
 */
export async function importDekKey(dekBase64: string): Promise<CryptoKey> {
  const rawBytes = base64ToUint8Array(dekBase64);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBytes as BufferSource,
    { name: 'AES-GCM' },
    false, // 不允许再从内存中随意导出
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 AES-256-GCM 加密账本明文字符串
 * @returns Base64 格式的密文（包含 16 字节 AuthTag）和 12 字节 IV
 */
export async function encryptVaultData(
  dek: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string; tagLength: number }> {
  // 每次加密必须生成全新的密码学安全 12 字节 IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128
    },
    dek,
    encodedPlaintext
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
    iv: uint8ArrayToBase64(iv),
    tagLength: 128
  };
}

/**
 * 使用 AES-256-GCM 解密账本密文
 * 若 AuthTag 损坏或数据被篡改，WebCrypto 将抛出 OperationError 异常
 */
export async function decryptVaultData(
  dek: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string
): Promise<string> {
  const ciphertextBytes = base64ToUint8Array(ciphertextBase64);
  const ivBytes = base64ToUint8Array(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as BufferSource,
      tagLength: 128
    },
    dek,
    ciphertextBytes as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * 计算数据的 SHA-256 十六进制摘要，用于端到端回读真实性校验
 */
export async function computeSha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

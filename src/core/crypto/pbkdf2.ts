/**
 * PBKDF2-SHA256 访问凭据认证引擎 (严格 600,000 轮抗爆破迭代)
 * 符合 OWASP 与 NIST 推荐标准，采用 WebCrypto 硬件加速派生与恒定时间校验
 */

export interface PinAuthRecord {
  algorithm: 'PBKDF2-HMAC-SHA256';
  iterations: number;
  salt: string; // 16 字节十六进制
  hash: string; // 32 字节十六进制
  updatedAt: number;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 对用户输入的 4/6 位 PIN 执行 PBKDF2-SHA256 600,000 轮加盐派生
 */
export async function derivePinAuth(
  pin: string,
  existingSaltHex?: string,
  iterations = 600000
): Promise<PinAuthRecord> {
  const salt = existingSaltHex
    ? hexToUint8Array(existingSaltHex)
    : window.crypto.getRandomValues(new Uint8Array(16));

  const pinBytes = new TextEncoder().encode(pin);

  // 1. 导入原始 PIN 作为 PBKDF2 基础密钥
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    pinBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // 2. 执行 600,000 轮迭代派生 256 位摘要
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  return {
    algorithm: 'PBKDF2-HMAC-SHA256',
    iterations,
    salt: uint8ArrayToHex(salt),
    hash: uint8ArrayToHex(new Uint8Array(derivedBits)),
    updatedAt: Date.now()
  };
}

/**
 * 恒定时间 (Constant-time) 字符串比对，防止时序侧信道攻击
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 校验输入的 PIN 是否与持久化存储的 PinAuthRecord 吻合
 */
export async function verifyPinAuth(
  inputPin: string,
  authRecord: PinAuthRecord
): Promise<boolean> {
  try {
    const computed = await derivePinAuth(
      inputPin,
      authRecord.salt,
      authRecord.iterations
    );
    return constantTimeEqual(computed.hash, authRecord.hash);
  } catch {
    return false;
  }
}

package com.jc.laclave

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PersistableBundle
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

@CapacitorPlugin(name = "LaClaveSecurity")
class LaClaveSecurityPlugin : Plugin() {

    companion object {
        const val SENSITIVE_CLIP_LABEL = "LaClave:Secret"
        const val CLIPBOARD_CLEAR_DELAY_MS = 60000L // 60 秒保护窗口

        const val KEY_ALIAS = "laclave_kek"
        const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        const val GCM_TAG_LENGTH = 128
        const val AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding"

        private var lastCopiedTimestamp: Long = 0
        private val handler = Handler(Looper.getMainLooper())
        private var clearRunnable: Runnable? = null

        /**
         * 供 MainActivity onResume 或应用锁定时调用，针对深度 Doze 导致的定时器冻结执行兜底补救清除
         */
        @JvmStatic
        fun checkAndClearExpiredClipboard(context: Context) {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
            val now = System.currentTimeMillis()
            if (lastCopiedTimestamp > 0 && now - lastCopiedTimestamp >= CLIPBOARD_CLEAR_DELAY_MS) {
                if (clipboard.hasPrimaryClip()) {
                    val desc = clipboard.primaryClipDescription
                    if (desc != null && desc.label == SENSITIVE_CLIP_LABEL) {
                        try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                                clipboard.clearPrimaryClip()
                            } else {
                                clipboard.setPrimaryClip(ClipData.newPlainText("", ""))
                            }
                            lastCopiedTimestamp = 0
                        } catch (e: Exception) {
                            // 忽略安全异常
                        }
                    }
                }
            }
        }
    }

    @PluginMethod
    fun copySensitive(call: PluginCall) {
        val text = call.getString("text")
        if (text == null) {
            call.reject("缺少待复制文本")
            return
        }

        val context = activity ?: context
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard == null) {
            call.reject("无法获取系统剪贴板服务")
            return
        }

        activity.runOnUiThread {
            try {
                // 1. 创建包含专有隐私标签的 ClipData
                val clipData = ClipData.newPlainText(SENSITIVE_CLIP_LABEL, text)

                // 2. Android 13+ (API 33) 标记敏感内容，阻止系统在屏幕左下角弹出明文预览气泡
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    clipData.description.extras = PersistableBundle().apply {
                        putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true)
                    }
                }

                // 3. 写入系统剪贴板
                clipboard.setPrimaryClip(clipData)
                lastCopiedTimestamp = System.currentTimeMillis()

                // 4. 重置并启动 60 秒延时清除任务
                clearRunnable?.let { handler.removeCallbacks(it) }
                clearRunnable = Runnable {
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            clipboard.clearPrimaryClip()
                        } else {
                            clipboard.setPrimaryClip(ClipData.newPlainText("", ""))
                        }
                        lastCopiedTimestamp = 0
                    } catch (e: Exception) {
                        // 忽略后台限制异常
                    }
                }
                handler.postDelayed(clearRunnable!!, CLIPBOARD_CLEAR_DELAY_MS)

                val ret = JSObject()
                ret.put("success", true)
                ret.put("ttlMs", CLIPBOARD_CLEAR_DELAY_MS)
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("复制剪贴板失败: ${e.message}", e)
            }
        }
    }

    @PluginMethod
    fun clearClipboard(call: PluginCall) {
        val context = activity ?: context
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard == null) {
            call.reject("无法获取系统剪贴板服务")
            return
        }

        activity.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    clipboard.clearPrimaryClip()
                } else {
                    clipboard.setPrimaryClip(ClipData.newPlainText("", ""))
                }
                lastCopiedTimestamp = 0
                clearRunnable?.let { handler.removeCallbacks(it) }

                val ret = JSObject()
                ret.put("success", true)
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("清除剪贴板失败: ${e.message}", e)
            }
        }
    }

    /**
     * 获取或生成 AndroidKeyStore 中的不可导出主根密钥 KEK (AES-256-GCM)
     * 优先尝试启用硬件 StrongBox；若硬件不支持则平滑回退至标准硬件 TEE
     */
    @Synchronized
    private fun getOrCreateKek(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
        keyStore.load(null)

        if (keyStore.containsAlias(KEY_ALIAS)) {
            val entry = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry
            if (entry != null) {
                return entry.secretKey
            }
        }

        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)

        // 尝试 StrongBox (Android 9+ / API 28+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                val strongBoxSpec = KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .setIsStrongBoxBacked(true)
                    .build()
                keyGenerator.init(strongBoxSpec)
                return keyGenerator.generateKey()
            } catch (e: Exception) {
                // StrongBox 不可用时自动回退至标准 TEE
            }
        }

        // 标准 TEE Keymaster 回退配置
        val standardSpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        keyGenerator.init(standardSpec)
        return keyGenerator.generateKey()
    }

    /**
     * 生成随机 256 位 DEK，并由 Keystore KEK 包裹后返回给前端
     */
    @PluginMethod
    fun getOrGenerateWrappedKey(call: PluginCall) {
        try {
            val kek = getOrCreateKek()

            // 1. 生成 32 字节 (256-bit) 密码学安全随机 DEK
            val dekBytes = ByteArray(32)
            SecureRandom().nextBytes(dekBytes)

            // 2. 用 KEK 配合 AES-GCM (12 字节随机 IV) 包裹 DEK
            val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, kek)
            val wrapIv = cipher.iv
            val wrappedDekBytes = cipher.doFinal(dekBytes)

            val ret = JSObject()
            ret.put("dek", Base64.encodeToString(dekBytes, Base64.NO_WRAP))
            ret.put("wrappedDek", Base64.encodeToString(wrappedDekBytes, Base64.NO_WRAP))
            ret.put("wrapIv", Base64.encodeToString(wrapIv, Base64.NO_WRAP))
            ret.put("type", "ANDROID_KEYSTORE_AES_GCM")
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("生成或包裹 DEK 失败: ${e.message}", e)
        }
    }

    /**
     * 使用 Keystore KEK 解包恢复 256 位 DEK 明文字节 (仅在解锁验证时单次调用)
     */
    @PluginMethod
    fun unwrapKey(call: PluginCall) {
        val wrappedDekBase64 = call.getString("wrappedDek")
        val wrapIvBase64 = call.getString("wrapIv")

        if (wrappedDekBase64.isNullOrEmpty() || wrapIvBase64.isNullOrEmpty()) {
            call.reject("缺少 wrappedDek 或 wrapIv 参数")
            return
        }

        try {
            val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
            keyStore.load(null)
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                call.reject("KEYSTORE_KEY_NOT_FOUND", "Android Keystore 中未找到根密钥，可能已被重置")
                return
            }

            val kek = getOrCreateKek()
            val wrappedDekBytes = Base64.decode(wrappedDekBase64, Base64.NO_WRAP)
            val wrapIvBytes = Base64.decode(wrapIvBase64, Base64.NO_WRAP)

            val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
            val spec = GCMParameterSpec(GCM_TAG_LENGTH, wrapIvBytes)
            cipher.init(Cipher.DECRYPT_MODE, kek, spec)

            val dekBytes = cipher.doFinal(wrappedDekBytes)

            val ret = JSObject()
            ret.put("dek", Base64.encodeToString(dekBytes, Base64.NO_WRAP))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("解包 DEK 失败: ${e.message}", e)
        }
    }
}

<div align="right">
  <a href="./README.md">简体中文</a> | <strong>English</strong>
</div>

# 🗝️ La Clave | Local Offline Password Manager App

![Platform](https://img.shields.io/badge/Platform-Android-green?logo=android&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-v8-blue)
![React](https://img.shields.io/badge/React-v19-cyan?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-blue?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-red)
![Network](https://img.shields.io/badge/Network-0%20Internet%20Permission-success)
![Version](https://img.shields.io/badge/Version-v1.1.5-blue)

> *"Deine Passwörter. Sicher verwahrt."*

<p align="center">
  <a href="https://github.com/nexen33/LaClaveApp/releases/download/v1.1.5/La.Clave_v1.1.5_release.apk">
    <img src="https://img.shields.io/badge/Download_LaClave_Latest_APK-blue?style=forthebadge" height="60">
  </a>
</p>

---

## What is La Clave?

For those used to keeping accounts and passwords in note-taking apps, seeing even Smartisan Notes getting acquired and bundled with AI features naturally triggered concerns about personal password security.

**La Clave** was born from a straightforward idea: to create a personal password manager that is **strictly offline, fast to search, and robustly encrypted**.

**No cloud sync. No background telemetry. Your data stays strictly visible to you alone.**

---

## Core Features & Security Philosophy

### 🛡️ 1. Local Storage with Hardware-Backed Encryption
* **Zero Internet Permission**: The `android.permission.INTERNET` manifest declaration is completely stripped out. Even vector icons (Material Icons v145) and fonts are packaged 100% locally. The codebase physically lacks the capability to make any network requests.
* **Hardware Keystore Envelope Encryption**: Credentials are encrypted using industry-standard **AES-256-GCM** inside the local sandbox. The encryption key is shielded by Android's hardware security module (Android Keystore / StrongBox).
* **Anti-Brute-Force Hardening**: Master PIN derivation employs 600,000 rounds of PBKDF2-HMAC-SHA256 with discrete salting and constant-time string comparison, mitigating offline rainbow table attacks and timing side-channel leaks.
* **Offline Encrypted Backups**: Allows fully encrypted export of your vault as an offline backup file for seamless restoration across devices, with built-in backward compatibility for legacy backup formats.

### 👁️ 2. Comprehensive Anti-Snooping Protections
* **Intelligent Lifecycle Shielding**: Auto-locks after 40 seconds of inactivity in standard views (thoughtfully extended to 60 seconds when creating a new password). After locking, the app cleanly exits after 10 seconds of further inactivity. Leaving the app to the background for more than 8 seconds instantly re-locks the vault, guarding against unauthorized glances when lending your phone.
* **Optional Scrambled PIN Keypad**: When unlocking the app, keypad digit positions can be completely randomized to prevent bystanders from tracing your finger movements. Enabled by default.
* **Screenshot & Screen Recording Protection (`FLAG_SECURE`)**: Whenever any password toggle eye is active on screen, the system automatically forbids screenshots, screen recordings, and task switcher previews. Enabled by default.
* **Sensitive Clipboard Auto-Purge**: Copying credentials sets the Android 13+ system-level sensitive content flag (preventing rogue third-party IMEs from scraping) and triggers an underlying 60-second hardware delay timer for automatic memory wipe.
* **Granular Password Copy Permissions**: Supports quick one-tap plain-text copying within search results and vault cards, with an optional toggle in Settings to disable this feature at will.

### 🚀 3. Effortless Entry & Import
* **Smart Clipboard Extraction**: Migrating from old notes or text snippets? Simply copy paragraph-structured text (formatted as Title / Account / Password / Extra notes), tap "Smart Convert from Clipboard", and the built-in regex engine will parse the fields for one-tap batch import.
* **Smart Local Backup Discovery**: Tapping "Restore Vault" automatically scans your dedicated backup directory and surfaces the latest file for quick selection, while still offering the standard system file picker to choose from any custom location.

### 🎨 4. Not Just Secure, but Effortlessly Elegant
* **Fluid Physical Motion & Tactile Feel**: Physics-driven spring drawers, seamless dark/light mode following system preferences, modern frosted glass card aesthetics, and edge-to-edge immersive status bars.
* **Vibrant Category Tagging**: Automatically assigns vibrant color accents to every category and vault card, ditching the dull, spreadsheet-like feel of legacy password managers.
* **Gesture-Driven Drawers**: Password creation and editing drawers glide upward to open and respond with natural elastic rebound when swiped down.
* **Independent Font Size Scaling**: Offers a 3-tier dynamic typography toggle ("Shrink / Standard / Enlarge") in Settings to accommodate different visual preferences and screen sizes.
* **Seamless Biometrics**: Supports native fingerprint / facial recognition for lightning-fast, secure app unlock.

---

## Permissions Transparency

The following is a transparent overview of all permissions declared in La Clave's Android manifest:

| Permission | Declaration | Purpose & Technical Clarification |
| :--- | :---: | :--- |
| **Internet Access** (`INTERNET`) | **❌ Physically Stripped** | **Not declared at all**. Hard-blocked at the OS level. Even if malicious code were somehow injected, the operating system directly prohibits any network communication. |
| **Biometric Authentication** (`USE_BIOMETRIC`) | **Declared** | Invokes the system-level fingerprint or face authentication sensor for fast unlock. Biometric credentials remain strictly within the device's secure hardware enclave and are inaccessible to the app. |
| **Read External Storage** (`READ_EXTERNAL_STORAGE`) | **Declared** | Used when the user explicitly triggers "Restore Vault" to select previously exported encrypted backup files from the local filesystem. |
| **Write External Storage** (`WRITE_EXTERNAL_STORAGE`) | **Conditional** (maxSdkVersion 32) | Only used on Android 12 and below to save exported encrypted backups into the `Documents/LaClave` directory; on Android 13 and above, system Scoped Storage automatically manages this and this permission is neither requested nor active. |
| **System Cloud Backup** (`allowBackup="false"`) | **❌ Force Disabled** | Hard-disables Android cloud backup and ADB backup in the manifest, preventing the operating system from silently uploading local sandbox data to third-party cloud services. |

---

## Tech Stack

* **Frontend Core**: React 19 + TypeScript + Vite
* **Container & Native Bridge**: Ionic Capacitor v8 + Android SDK 36 (Kotlin / Java)
* **Cryptography & Local Sandbox**:
  * Vault payload encryption: WebCrypto industry-grade **AES-256-GCM**
  * Key protection layer: Android hardware-backed keystore **Android Keystore / StrongBox**
  * PIN hardening: 600,000 rounds of **PBKDF2-HMAC-SHA256** with constant-time equality check
  * Backward compatibility: Built-in read-only CryptoJS compatibility layer for seamless legacy backup migration
* **Offline Assets & Fonts**: Full offline packaging of Material Icons (v145) vector font and Latin handwriting font

---

## How to Download, Install & Update

### 📥 First-Time Installation
1. Navigate to the **[Releases](https://github.com/nexen33/LaClaveApp/releases)** page on the right side of this repository and download the latest `La.Clave_v1.1.5_release.apk` package.
2. Open and install on your Android device. Since this app is independently signed and published without third-party app stores, your system might display an "Unknown app" warning—simply tap "More details" and select "Install anyway".

### 🔄 Seamless Upgrades
* All versions of this app are built and signed with a **single, persistent digital keystore signature**.
* When upgrading, simply download the new APK and install it directly over the existing app. Android's cryptographic signature verification will ensure a seamless upgrade while **100% preserving all your local passwords, settings, and preferences**!

---

## Frequently Asked Questions (FAQ)

### Q1: If I forget my master PIN, can you help me recover it?
> **There is no cloud reset backdoor, but you can restore via an offline backup.**  
> Because La Clave is built on a zero-knowledge offline architecture, there is no remote server or master backdoor to reset your PIN in-place.  
> **However, as long as you have previously exported an encrypted backup file (`.laclave`)**: you can simply **uninstall and reinstall the app (or clear app storage)**, set up a new master PIN upon launch, and tap "Restore Vault". Select your backup file and enter the export password you chose when backing up to fully recover all your accounts and passwords!  
> *Therefore, we strongly advise exporting an offline encrypted backup after adding important credentials.*

### Q2: How do I transfer my vault to a new phone?
> The process is straightforward:
> 1. On your old phone, open La Clave Settings and tap "Export Vault" to save an encrypted backup file;
> 2. Transfer the file to your new device via Bluetooth, USB cable, or local Wi-Fi share;
> 3. Install La Clave on the new phone, set up your master PIN, tap "Restore Vault", select the file, and enter your backup password to restore everything.

### Q3: Why no WebDAV, OneDrive, or automatic cloud sync?
> "Strictly offline" is the core founding principle of La Clave. Any automated network-connected sync channel not only violates our physical zero-internet safety commitment, but also exposes your credentials to untrusted cloud infrastructure and remote vulnerabilities. When cross-device transfers are needed, manually moving an encrypted backup file through trusted local networks or physical media remains the safest and most transparent approach.

---

## License

This project is released under the **Creative Commons Attribution-NonCommercial 4.0 International Public License (CC BY-NC 4.0)**, Copyright (c) 2026 **Tun&PaMa AG**.
- Official Standard Legal Code: Please refer to [LICENSE](./LICENSE);
- Full Chinese Reference Translation: Please refer to [LICENSE.zh-CN.md](./LICENSE.zh-CN.md).

**Special Notice: This project is strictly for personal technical study and non-commercial purposes. It is strictly prohibited to use this project's source code, build artifacts, or derivatives for any form of commercial profit, paid distribution, or commercial integration.**

## Disclaimer

1. **Research & Non-Commercial Use**: This project is an open-source technical initiative aimed at enhancing personal password security and offline convenience. Commercial use is strictly prohibited.
2. **Zero-Knowledge Architecture & Sole Responsibility**: This software is a 100% strictly offline local password manager with no cloud servers, no external network connections, and no backdoors or master keys. Users bear sole responsibility for safeguarding their master PIN, device physical security, and encrypted backup files.
3. **"AS-IS" & Disclaimer of Warranties**: The software is provided "AS IS", without warranty of any kind, express or implied. The authors and copyright holders shall not be liable for any credential loss, unrecoverable data, or direct/indirect damages resulting from forgotten PINs, lost backup files, hardware failure, user error, or operating system crashes.
4. **Independent Implementation**: This project is an independent open-source implementation and is not affiliated with, endorsed by, or partnered with any commercial password manager or operating system vendor.

---

<p align="center">
  <img src="https://github.com/user-attachments/assets/40dada2c-b037-4bc3-a7b0-f21b8821add1" width="800" />
</p>

<p align="center">
  <em>Viel Spaß damit!</em><br />
  <em>Entwickelt mit ❤️ von Tun&PaMa Familie</em><br />
  <em>Sicher ist sicher.</em>
</p>

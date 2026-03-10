# 🗝️ La Clave | A secure local password tresor

> "Deine Passwörter. Sicher verwahrt." 

<p align="center">
  <a href="https://github.com/nexen33/LaClaveApp/releases/download/v1.1.1/La.Clave_v1.1.1_release.apk">
    <img src="https://img.shields.io/badge/立即下载_LaClave_APK-blue?style=forthebadge" height="50">
  </a>
</p>  

当习惯在笔记里记录账号密码的人，发现连锤子便签被卖后都加了AI，不免得对于数据安全有一些担忧。
**La Clave** 诞生于一个纯粹的想法：做一个**绝对离线、搜索便捷、安全加密**的密码管理器。
前身是个人应用类App MyOmnis的一个隐藏功能，现作为独立App发布。

没有云端同步，没有后台偷跑请求。你的数据，只有你能看见。

_____________________________________________________
## ✨ 功能点

🛡️ **本地存储，算法加密**
* 所有的账号密码数据仅通过 AES算法 加密存储在你手机的本地沙盒中。
* 密码本支持加密导出与无缝恢复，把数据的所有权 100% 交还给你。
* 仅有的联网权限是为了完好渲染Google Icons&fonts，其他功能与网络无关。

👁️ **各种防窥探措施**
* **前后台生命周期管理**：前台60s无操作锁定App，再过15s无操作自动退出App。后台10s无操作退出。
* **可选开屏乱序键盘**：解锁进入 App 时，PIN码键盘布局都完全随机。默认开启。
* **可选密码截屏权限**：只要屏幕上有任何一个密码的小眼睛被点亮，可以禁止一切截屏与录屏。 默认开启。
* **可选密码复制权限**：搜索结果和仓库卡片中密码明文状态下的复制。默认关闭。

🚀 **便捷录入&导入**
* 懒得一个个手动录入？直接把你的数据按段落复制(段落中顺序为标题/账号/密码/附加信息)，点击「从剪贴板智能转换」，内置的正则引擎会自动解析出标题、账号和密码，一键批量入库。
* 已有本地备份？点击「解密回复密码本」支持智能在已设置好的专属文件夹中查找最新的备份供选择。如果没有，则调出系统文件管理器共手动选择。

🎨 **不仅安全，还很优雅**
* 丝滑物理动效/ 自适应系统的全局毛玻璃 UI/ 自动沉浸式状态栏/ 深浅色模式切换。
* 为每一个仓库分类自动分配充满活力的色彩标签，枯燥的账号管理也能赏心悦目。
* 抽屉式新增编辑页面，上划调出，下划收起。
* 隐藏式关于信息:注脚处双击唤出。
* 更多细节和功能等待你的发现！
_____________________________________________________
## 🛠 Tech Stack Info

* **Frontend:** React + TypeScript
* **Security Layer:** CryptoJS
* **Runtime & Native Bridge:** Ionic Capacitor
* **Pack:** Android Studio 

_____________________________________________________
## 📦 如何下载/安装/更新？

下载/安装: 前往本仓库的 **[Releases](#)** 页面，下载最新的 `La Clave_v(appversion)_release.apk` 文件，在 Android 手机上直接安装即可。
*由于没有未上传应用市场，安装时系统可能会提示“未知来源应用”，请放心授权。*  

更新: 本App均使用唯一的、连续的底层数字签名（Keystore）。只要你直接点击安装更新，签名的一致性会被自动验证，完成无缝升级，并 100% 完好地保留你的所有本地数据和偏好设置！  

_____________________________________________________  
<p align="center">
  <img src="https://github.com/user-attachments/assets/40dada2c-b037-4bc3-a7b0-f21b8821add1" width="800" />
</p>


<p align="center">
  <em>Viel Spaß damit!</em><br />
  <em>Entwickelt mit ❤️ von Tun&PaMa Familie</em><br />
  <em>Sicher ist sicher.</em>
</p>

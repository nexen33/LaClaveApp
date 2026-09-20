package com.jc.laclave;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void attachBaseContext(Context newBase) {
        Configuration config = newBase.getResources().getConfiguration();
        if (config.fontScale != 1.0f) {
            Configuration newConfig = new Configuration(config);
            newConfig.fontScale = 1.0f; // 核心：强制重置字体缩放因子为 1.0，完全免疫系统字号修改
            Context context = newBase.createConfigurationContext(newConfig);
            super.attachBaseContext(context);
            return;
        }
        super.attachBaseContext(newBase);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaClaveSecurityPlugin.class);
        super.onCreate(savedInstanceState);

        // 开启系统级防窥屏 (FLAG_SECURE): 拦截多任务卡片预览、系统截屏与录屏
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
    }

    @Override
    public void onResume() {
        super.onResume();
        // 剪贴板 Doze 挂起冻结兜底补偿检测
        LaClaveSecurityPlugin.checkAndClearExpiredClipboard(this);

        // 获取 Capacitor 底层的原生 WebView 实例
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // 锁定物理字号基准为 83（对齐 MyOmnis 与 Fahrmony 基线，防系统无障碍字号膨胀破坏布局）
            settings.setTextZoom(83);
            // 物理斩断边缘拉伸与弹性滚动
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }
}
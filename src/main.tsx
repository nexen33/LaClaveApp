import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/fonts.css'
import App from './App.tsx'

// 392dp 自适应缩放引擎（Fahrmony 四层防御核心：确保不同机型物理分辨率等比例换算为 392dp 标准视口）
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
  const applyZoom = () => {
    const minDimension = Math.min(window.screen.width, window.screen.height);
    const rawRatio = minDimension / 392;
    const ratio = Math.max(0.85, Math.min(1.25, Number(rawRatio.toFixed(3))));
    document.body.style.zoom = String(ratio);
  };
  applyZoom();
  window.addEventListener('resize', applyZoom);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 导入 Tailwind CSS
import App from './App';

// 获取应用挂载的根DOM元素
const rootElement = document.getElementById('root');

// 确保 rootElement 存在，避免在开发环境中出现 null 错误
if (!rootElement) {
  console.error('Error: Root element with ID "root" not found in index.html.');
} else {
  // 使用ReactDOM.createRoot创建根，并渲染App组件
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}


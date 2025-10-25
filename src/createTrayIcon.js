const fs = require('fs');
const path = require('path');

// 创建一个简单的 SVG 图标
const svgIcon = `
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#333333" rx="2"/>
  <text x="8" y="12" font-family="Arial" font-size="10" fill="white" text-anchor="middle">M</text>
</svg>
`;

const iconPath = path.join(__dirname, '../assets/tray-icon.png');

// 检查是否需要创建图标
if (!fs.existsSync(iconPath)) {
  console.log('Creating a simple tray icon placeholder...');
  console.log('For production, replace assets/tray-icon.png with a proper icon file');

  // 创建一个简单的文本文件作为占位符
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  // 创建一个 1x1 的 PNG 占位符
  const placeholderPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(iconPath, placeholderPng);
}
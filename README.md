# MemoBook

一个跨平台的桌面事项管理应用，使用快捷键快速添加和管理待办事项。

## 功能特性

- 🚀 **全局快捷键**：快速打开输入窗口和事项列表
- 📝 **快速输入**：屏幕中央弹窗，支持快速添加事项
- 📋 **事项管理**：左上角下拉列表，支持编辑、标记完成、删除
- 🔊 **声音反馈**：不同操作有独特的声音提示
- 🎯 **托盘应用**：系统托盘集成，支持开机自启动
- 💾 **数据持久化**：本地数据库存储，数据安全可靠

## 快捷键

- **macOS**: `Cmd+Alt+Q` - 打开事项输入窗口
- **Windows/Linux**: `Ctrl+Alt+Q` - 打开事项输入窗口

- **macOS**: `Cmd+Alt+P` - 切换事项列表显示
- **Windows/Linux**: `Ctrl+Alt+P` - 切换事项列表显示

## 技术栈

- **前端**: React + TypeScript + CSS
- **后端**: Electron + Node.js
- **数据库**: SQLite
- **构建工具**: Webpack + TypeScript
- **包管理**: pnpm

## 安装和运行

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

### 构建应用

```bash
pnpm run build
```

### 启动应用

```bash
pnpm start
```

## 项目结构

```
memoBook/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── main-simple.js # 主进程入口
│   │   └── preload.js     # 预加载脚本
│   ├── renderer/          # 渲染进程（React）
│   │   ├── components/    # React 组件
│   │   │   ├── InputWindow.tsx
│   │   │   └── TodoList.tsx
│   │   ├── index.tsx      # 渲染入口
│   │   └── soundManager.ts
│   └── shared/            # 共享类型定义
│       └── types.ts
├── dist/                  # 构建输出
├── assets/                # 资源文件
├── package.json
└── README.md
```

## 开发说明

### 主要组件

1. **InputWindow**: 屏幕中央的输入弹窗
2. **TodoList**: 左上角的事项列表
3. **SoundManager**: 声音反馈管理
4. **WindowManager**: 窗口管理服务
5. **DatabaseService**: 数据库操作服务

### 配置说明

- 使用 pnpm 的 `onlyBuiltDependencies` 配置确保 Electron 正确安装
- TypeScript 配置支持 React JSX
- Webpack 配置优化打包流程

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！
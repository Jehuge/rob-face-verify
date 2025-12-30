# 智能人机面部识别验证系统

**基于 MediaPipe 的实时活体检测安全验证组件**
---

## 项目简介

本项目是一个基于 React 开发的现代化人机验证（CAPTCHA）系统。不同于传统的图片点击或字符输入，它通过识别用户的面部动作（如微笑、眨眼）来执行“活体检测”，在提供极佳用户体验的同时，能有效防御自动化脚本和图像重放攻击。

## 核心特性

- **活体挑战响应**：要求用户完成指定的面部动作（持续微笑、眨眼）以通过验证。
- **实时反馈**：通过激光扫描动画和实时面部关键点追踪，增强验证过程的科技感。
- **多重保护**：结合前端面部特征分析与后端会话校验。
- **高级视觉设计**：采用毛玻璃特效（Glassmorphism）和渐变色设计，适配现代 Web 审美。

## 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **面部追踪**: MediaPipe Face Landmarker
- **样式处理**: Vanilla CSS / Tailwind CSS (UI 原型)
- **开发语言**: TypeScript

## 项目结构

```text
src/
├── components/          # UI 组件 (相机预览、验证状态显示)
├── services/            # 核心逻辑 (MediaPipe 服务、API 请求)
├── utils/               # 工具函数 (几何算法等)
├── types.ts             # 全局 TypeScript 接口定义
└── App.tsx              # 应用主入口及验证状态机逻辑
```

## 快速上手

### 前置条件
- Node.js (推荐最新 LTS 版本)

### 安装与运行

1. **克隆并进入项目**
   ```bash
   git clone <your-repo-url>
   cd rob-face-verify
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   在项目根目录创建或编辑 `.env.local` 文件，并添加你的 API 密钥：
   ```env
   GEMINI_API_KEY=你的_GEMINI_API密钥
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 进阶配置

验证逻辑的相关参数可以在 `App.tsx` 中进行调整：
- `REQUIRED_SMILE_DURATION_MS`: 维持微笑所需的时长。
- `REQUIRED_BLINK_DURATION_MS`: 触发眨眼判定的时长。

---

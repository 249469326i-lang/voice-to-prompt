# 🎙️ VoicePrompt - AI 语音转 Prompt 工具

<p align="center">
  <img src="./public/favicon.svg" width="80" height="80" alt="VoicePrompt Logo">
</p>

<p align="center">
  <strong>语音输入，AI 优化，一键生成专业 Prompt</strong>
</p>

<p align="center">
  <a href="https://github.com/249469326i-lang/voice-to-prompt">
    <img src="https://img.shields.io/github/stars/249469326i-lang/voice-to-prompt?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/249469326i-lang/voice-to-prompt/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/249469326i-lang/voice-to-prompt" alt="License">
  </a>
</p>

---

## ✨ 功能特点

- 🎤 **语音输入** - 支持语音识别，说出你的想法即可
- 🤖 **AI 优化** - 自动将口语化描述转为结构化 Prompt
- 📝 **多种模板** - 内置多种场景模板，快速开始
- 📚 **历史记录** - 自动保存，随时查看和复用
- 🎨 **精美界面** - 赛博朋克风格，流畅动画
- ⌨️ **快捷键支持** - 空格录音，Ctrl+Enter 优化
- 💾 **导出功能** - 支持 Markdown / 文本导出

## 🚀 快速开始

### 在线体验
访问 [https://voice-to-prompt.vercel.app](https://voice-to-prompt.vercel.app)（如果已部署）

### 本地运行

```bash
# 克隆项目
git clone https://github.com/249469326i-lang/voice-to-prompt.git

# 进入目录
cd voice-to-prompt

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的阿里云 DashScope API Key

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可使用

## 🔧 技术栈

- ⚡ **Vite** - 极速构建工具
- ⚛️ **React 19** - 最新 React 版本
- 🎨 **Tailwind CSS v4** - 原子化 CSS
- 🎯 **阿里云 DashScope** - AI 大模型 API
- 🎙️ **Web Speech API** - 浏览器原生语音识别

## 📝 使用说明

### 基础用法

1. **语音输入**：点击「开始录音」按钮或按空格键，说出你的需求
2. **文本输入**：直接在左侧输入框中输入文字
3. **AI 优化**：点击「优化 Prompt」按钮或按 Ctrl+Enter
4. **复制结果**：点击复制按钮，将优化后的 Prompt 复制到剪贴板

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 开始/停止录音 |
| `Ctrl + Enter` | 优化 Prompt |
| `Ctrl + K` | 清空输入 |
| `Ctrl + H` | 打开历史记录 |
| `Ctrl + T` | 打开模板 |
| `Ctrl + ,` | 打开设置 |

### 模板使用

点击顶部「模板」按钮，选择适合的场景模板：

- 🌐 **网页开发** - 前端页面、组件开发
- 📱 **App 开发** - 移动端应用
- 🤖 **AI 工具** - AI 辅助工具
- 🎮 **游戏开发** - 游戏功能实现
- 📊 **数据分析** - 数据处理、可视化

## 🔑 配置 API Key

本项目使用阿里云 DashScope API，需要配置 API Key：

1. 访问 [阿里云 DashScope](https://dashscope.aliyun.com/)
2. 注册并获取 API Key
3. 在项目根目录创建 `.env` 文件
4. 添加以下内容：

```env
VITE_API_KEY=your-api-key-here
```

## 🛠️ 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

构建完成后，`dist` 目录可直接部署到 Vercel、Netlify、GitHub Pages 等平台。

## 📸 界面预览

<p align="center">
  <img src="./src/assets/hero.png" alt="VoicePrompt Screenshot" width="80%">
</p>

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

## 🙏 致谢

- 灵感来源于 [Vibe Coding](https://x.com/karpathy/status/1886150823381573710) 概念
- UI 设计参考 [shadcn/ui](https://ui.shadcn.com/) 和 [Radix UI](https://www.radix-ui.com/)
- 语音识别基于 [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/249469326i-lang">249469326i-lang</a>
</p>

# AI 英语语法分析器 (English Grammar Analyzer)

一个基于 AI 的英语语法分析工具，帮助学习者深入理解英语句子结构。

## ✨ 功能特点

- 🔍 **语法结构分析** - 分析句子的主语、谓语、宾语等成分
- 📚 **时态语态识别** - 识别句子使用的时态和语态
- 🏷️ **词性标注** - 为每个单词标注词性和语法功能
- 📝 **从句分析** - 识别和分析各类从句
- 🌐 **中文翻译** - 提供准确的中文翻译
- ⚠️ **易错点提示** - 指出学习者容易犯的错误

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## ⚙️ 模型配置

本工具支持两种模型类型：

### 1. 本地模型 (Local Model)

支持 LMStudio、Ollama 等本地部署的模型：

- **默认 API 地址**: `http://localhost:1234/v1/chat/completions`
- **LMStudio**: 启动后加载模型，确保本地服务器已开启
- **Ollama**: 使用 `http://localhost:11434/v1/chat/completions`

### 2. API 模型 (API Model)

支持以下云端 API：

| 提供商 | 模型 |
|--------|------|
| OpenAI | gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini |
| DeepSeek | deepseek-chat, deepseek-coder |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku |
| 自定义 | 支持任何 OpenAI 兼容的 API |

### 配置方法

1. 点击页面右上角的 ⚙️ 设置按钮
2. 选择模型类型（本地模型 或 API 模型）
3. 根据选择配置相应参数：
   - **本地模型**: 设置 API 地址和模型名称
   - **API 模型**: 选择提供商、输入 API Key、选择模型
4. 点击"保存设置"

## 📖 使用说明

1. 在输入框中输入要分析的英语句子
2. 点击"开始分析"按钮（或按 Ctrl/Cmd + Enter）
3. 等待 AI 分析完成
4. 查看详细的分析结果

### 示例句子

- 简单句: `The quick brown fox jumps over the lazy dog.`
- 完成进行时: `I have been studying English for three years.`
- 虚拟语气: `If I had known about the meeting, I would have attended it.`
- 定语从句: `The book which was written by a famous author became a bestseller.`
- 宾语从句: `She asked me where I was going after work.`
- 非谓语动词: `Having finished his homework, he went out to play.`

## 🔧 环境变量

可以通过环境变量配置默认值：

```bash
# 设置端口
PORT=3000

# 设置本地模型 API 地址
LMSTUDIO_API_URL=http://localhost:1234/v1/chat/completions
```

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **AI**: 支持 OpenAI 兼容 API

## 📁 项目结构

```
english-grammar-analyzer/
├── server.js           # Express 服务器
├── package.json        # 项目配置
├── public/
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   └── app.js          # 前端逻辑
└── README.md           # 说明文档
```

## 🔒 安全说明

- API Key 仅存储在服务器内存中，重启后需要重新配置
- 建议在生产环境中使用环境变量或安全的配置管理方案
- 不要在代码中硬编码 API Key

## 📝 更新日志

### v1.1.0
- ✨ 新增模型配置功能
- 🔧 支持本地模型和 API 模型切换
- 🎨 新增设置界面
- 🌐 支持 OpenAI、DeepSeek、Anthropic 等多个 API 提供商

### v1.0.0
- 🎉 初始版本
- 🔍 基础语法分析功能

## 📄 许可证

MIT License
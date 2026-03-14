export const PROMPT_TEMPLATES = [
  {
    id: 'frontend-page',
    name: '前端页面开发',
    icon: '🎨',
    description: '开发一个完整的网页或组件',
    template: `请帮我开发一个 [页面类型] 页面/组件。

具体需求：
-

设计要求：
- 使用 [技术栈，如 React + Tailwind]
- 响应式布局
- 美观的 UI 设计

功能要求：
-

其他说明：
- `,
  },
  {
    id: 'api-development',
    name: 'API 接口开发',
    icon: '🔌',
    description: '设计 RESTful API 接口',
    template: `请帮我设计并实现一个 API 接口。

接口功能：
-

请求规范：
- HTTP 方法：
- 路径：
- 请求参数：
- 请求体格式：

响应规范：
- 成功状态码：
- 响应体结构：
- 错误处理：

技术栈：
- 后端框架：
- 数据库：

其他要求：
- `,
  },
  {
    id: 'component',
    name: '组件封装',
    icon: '🧩',
    description: '创建可复用的 UI 组件',
    template: `请帮我封装一个 [组件名称] 组件。

组件功能：
-

Props 接口：
-

使用示例：
\`\`\`
// 示例代码
\`\`\`

样式要求：
- 使用 CSS-in-JS / CSS Modules / Tailwind
- 支持主题定制

其他：
- 需要类型定义（TypeScript）
- 添加必要的注释和文档`,
  },
  {
    id: 'bugfix',
    name: 'Bug 修复',
    icon: '🐛',
    description: '分析和修复代码问题',
    template: `请帮我分析并修复以下问题。

问题描述：
-

错误信息：
\`\`\`
// 如果有报错信息，贴在这里
\`\`\`

相关代码：
\`\`\`
// 贴出相关代码
\`\`\`

预期行为：
-

实际行为：
-

环境信息：
- 语言/框架版本：
- 操作系统：`,
  },
  {
    id: 'refactor',
    name: '代码重构',
    icon: '♻️',
    description: '优化现有代码结构',
    template: `请帮我重构以下代码。

目标：
- 提高代码可读性
- 优化性能
- 减少重复代码

当前代码：
\`\`\`
// 贴出需要重构的代码
\`\`\`

重构要求：
-

约束条件：
- 保持原有功能不变
- `,
  },
  {
    id: 'feature',
    name: '新功能开发',
    icon: '✨',
    description: '添加新功能到现有项目',
    template: `请帮我实现一个新功能。

功能名称：
-

功能描述：
-

业务场景：
-

用户交互流程：
1.
2.
3.

数据需求：
- 输入数据：
- 输出数据：
- 存储需求：

集成要求：
- 如何与现有系统对接：`,
  },
]

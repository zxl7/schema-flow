# Srx-UI 业务组件库

一套基于 **Vue 3 + Ant Design Vue + TypeScript** 构建的轻量级业务组件库，采用**函数式编程**思想，实现业务与视图模型的解耦。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动示例项目
```bash
npm run dev
```

### 3. 组件库构建
```bash
# 构建生产环境库文件
npm run build:lib
```

## 📦 项目结构

- `src/components`: 核心组件库源码
- `src/examples`: 组件使用示例（业务集成参考）
- `src/router`: 示例项目路由配置

## 🛠 使用组件库

在项目中引入：

```ts
import SrxUi from 'srx-ui'
import 'srx-ui/style.css'

const app = createApp(App)
app.use(SrxUi)
app.mount('#app')
```

## ✨ 核心组件

### ASchemaForm (动态业务表单)

基于 JSON Schema 驱动的动态表单引擎，支持多种业务控件及复杂的约束逻辑。

**核心特性：**
- **数据驱动**：直接消费后端原始元数据。
- **解耦设计**：通过 `dictionaries` 和 `optionProvider` 将业务数据源剥离。
- **灵活扩展**：提供 `#header` 和 `#footer` 插槽，支持高度自定义 UI。

详细文档请参考：[ASchemaForm README](file:///Users/zxl/Desktop/private/components-ui/src/components/a-schema-form/README.md)


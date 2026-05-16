# SchemaFlow 业务组件库

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

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import SchemaFlow from 'schema-flow'
import 'schema-flow/style.css' // 引入样式

const app = createApp(App)
app.use(SchemaFlow)
app.mount('#app')
```

## ✨ 核心组件

### SchemaFlow (企业级动态表单引擎)

`SchemaFlow` 是一个基于 **Vue 3** 和 **Ant Design Vue** 构建的企业级 Schema 驱动动态表单引擎及可视化设计器。

#### 核心特性

1. **Schema 驱动 (SSOT)**: 
   - 采用单一数据源原则，底层通过纯函数将原始领域模型转换为视图模型。
   - 前后端协议统一，极大地降低了沟通与开发成本。

2. **高性能渲染**:
   - 分布式字段状态管理，支持组件按需更新。
   - 内置强大的逻辑表达式引擎，支持声明式联动逻辑配置。

3. **可视化设计器 (Low-Code Editor)**:
   - **原生拖拽引擎**: 支持从组件库拖拽入画布，以及画布内组件的平滑排序（带动态腾空视觉反馈）。
   - **历史记录机制**: 内置 Undo/Redo 历史栈，提供类似专业 IDE 的操作体验。
   - **细粒度权限控制**: 提供新增 (Create)、编辑 (Edit)、预览 (View) 三种场景的自动适配与权限分离。
   - **全局配置控制**: 支持可视化配置表单尺寸、水平/垂直布局、组件最大宽度等。

4. **开箱即用的业务组件**:
   - 深度集成并优化了 Input, Select, Radio, CheckboxGroup, DatePicker, Rate, Slider 等十余种高频业务组件。
   - 自动解析远程 API 作为数据源，并实现异步数据绑定。

#### 安装与使用

##### 安装依赖

```bash
npm install schema-flow
```

##### 全局注册

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import SchemaFlow from 'schema-flow'
import 'schema-flow/dist/style.css'

const app = createApp(App)
app.use(SchemaFlow)
app.mount('#app')
```

详细文档请参考：[SchemaFlow README](file:///Users/zxl/Desktop/private/components-ui/src/components/a-schema-form/README.md)


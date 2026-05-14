# LiBusinessForm 动态业务表单

`LiBusinessForm` 是一个高度可配置的动态表单引擎，旨在通过一套标准的元数据（JSON Schema）驱动复杂的业务表单渲染。

## 🌟 核心理念

- **模型驱动 (Model-Driven)**：表单结构完全由后端下发的 `fields` 数据决定。
- **视图与逻辑分离**：组件仅负责渲染，业务逻辑（数据源、操作栏）通过 Props 和 Slots 注入。
- **函数式转换**：内部采用纯函数进行数据归一化，确保渲染层（View Model）与原始数据（Domain Model）解耦。

## 📦 基础用法

```vue
<template>
  <li-business-form
    title="工序信息"
    :fields="rawFields"
    :dictionaries="myDictionaries"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { LiBusinessForm } from 'srx-ui'
import rawFields from './fields.json'

const myDictionaries = {
  status: [{ label: '启用', value: '1' }, { label: '禁用', value: '0' }]
}

const handleSubmit = (values) => {
  console.log('提交数据:', values)
}
</script>
```

## 🛠 API 说明

### Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `fields` | 原始元数据数组 (RawBusinessField) | `Array` | `[]` |
| `mode` | 表单模式：`create` / `edit` / `view` | `string` | `'create'` |
| `title` | 表单标题 | `string` | `''` |
| `initialValues` | 表单初始回显值 | `Object` | `{}` |
| `dictionaries` | 外部字典库，用于匹配 `dict_translate` 约束 | `Record<string, FieldOption[]>` | `{}` |
| `optionProvider` | 远程选项加载器（异步函数） | `Function` | `-` |
| `includeHiddenValues` | 提交时是否包含隐藏字段的值 | `boolean` | `false` |

### Slots

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| `header` | 自定义头部区域 | `{ title: string }` |
| `footer` | 自定义底部操作区域 | `{ submit: () => Promise, reset: () => void }` |

### Events

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| `submit` | 表单校验通过并提交时触发 | `(values: FormModel) => void` |
| `change` | 表单数值发生任何变化时实时触发 | `(values: FormModel) => void` |

### Methods (通过 ref 调用)

- `submitForm()`: 手动触发表单校验与提交，返回 Promise。
- `resetForm()`: 重置表单到初始状态。

## 🧩 支持的元数据约束

组件库解析 `constraintInfo` 字符串，支持以下核心约束：
- `required`: 是否必填。
- `default_value`: 默认值。
- `dict_translate`: 关联外部字典 key。
- `enum`: 枚举值（使用 `||` 分隔）。
- `url`: 远程数据源配置。

## 🎨 支持的控件类型 (controlStyle)

- `textInput`: 基础输入框
- `select`: 下拉选择
- `tree`: 树形选择
- `double`: 数字输入
- `date`: 日期时间选择
- `checkbox`: 切换开关
- `text / editor`: 文本域 / 富文本占位
- `user / searchInput`: 带搜索功能的下拉框

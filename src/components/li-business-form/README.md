# LiBusinessForm

`LiBusinessForm` 是一个面向学习的动态业务表单组件。它把 `new-edit-object` 里的 UME 属性渲染思路先抽成一个简单版本：传入字段元数据，组件按控件类型和约束信息渲染表单。

## 基础用法

```vue
<template>
  <li-business-form
    title="工序基础信息"
    :fields="demoFields"
    mode="create"
    @submit="handleSubmit"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import demoFields from '../../../demo.json'

export default defineComponent({
  setup() {
    function handleSubmit(values: Record<string, unknown>) {
      console.log(values)
    }

    return {
      demoFields,
      handleSubmit,
    }
  },
})
</script>
```

## 已支持的元数据

- `groupTag`：表单分组名称
- `attributeNum`：字段 key
- `displayName`：字段 label
- `controlStyle`：控件类型
- `constraintInfo`：支持 `required`、`default_value`、`dict_translate`、`enum`
- `createState` / `editState` / `viewState`：控制隐藏和只读

## 已支持控件

- `textInput`：输入框
- `select`：下拉框
- `inputAndSelect` / `searchInput` / `user`：可搜索下拉框
- `tree`：树选择
- `double`：数字输入框
- `text` / `editor`：多行文本
- `date`：日期选择
- `checkbox`：开关

## 下一步

第一版故意不接真实 URL 接口，`dict_translate` 和 `tree/user` 先走本地 mock options，便于学习组件边界。后续可以新增 `optionProvider` 属性，把字典、URL 约束、用户、组织树这些数据源交给业务方注入。

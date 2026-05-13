# srx-ui

适用于 **Vue3 + Vite + TypeScript**。

## 本地开发

```ts
npm install
npm run dev
```

## 组件库构建

```ts
npm run build:lib
```

## 使用组件库

```ts
import srxUI from 'srx-ui'
import 'srx-ui/style.css'

createApp(App).use(srxUI).mount('#app')

```

## developedComponents
- li-hello-world
- li-button
- li-business-form

## li-business-form

`li-business-form` 是基于 Ant Design Vue 的动态业务表单组件。当前版本先支持 `demo.json` 这类 UME 属性元数据，适合作为基础业务组件库的学习入口。

```vue
<li-business-form
  title="工序基础信息"
  :fields="demoFields"
  mode="create"
  @submit="handleSubmit"
/>
```

更多说明见 `src/components/li-business-form/README.md`。

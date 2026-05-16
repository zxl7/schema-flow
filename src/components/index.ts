import type { App } from 'vue'
import ASchemaForm from './a-schema-form/index.vue'

// 导出组件
export { ASchemaForm, ASchemaForm as SchemaFlow }
// 导出类型
export * from './a-schema-form/types'
export * from './a-schema-form/utils'

// 提供全局注册支持
export default {
  install(app: App) {
    app.component('SchemaFlow', ASchemaForm) // 推荐的新名称 (不带 A)
    app.component('ASchemaForm', ASchemaForm) // 兼容老代码 (带 A)
  }
}

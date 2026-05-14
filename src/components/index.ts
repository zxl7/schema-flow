import type { App, Plugin } from 'vue'
import ASchemaForm from './a-schema-form/index.vue'

const components = [
  { name: 'a-schema-form', component: ASchemaForm },
]

const SrxUi: Plugin = {
  install(app: App) {
    components.forEach(({ name, component }) => {
      app.component(name, component)
    })
  },
}

export { ASchemaForm }

export default SrxUi

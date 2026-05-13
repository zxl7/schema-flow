import type { App, Plugin } from 'vue'
import LiBusinessForm from './li-business-form/index.vue'

const components = [
  { name: 'li-business-form', component: LiBusinessForm },
]

const SrxUi: Plugin = {
  install(app: App) {
    components.forEach(({ name, component }) => {
      app.component(name, component)
    })
  },
}

export { LiBusinessForm }

export default SrxUi

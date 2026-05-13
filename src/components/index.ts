import type { App, Plugin } from 'vue'
import LiButton from './li-button/index.vue'
import LiHelloWorld from './li-hello-world/index.vue'
import LiBusinessForm from './li-business-form/index.vue'

const components = [
  { name: 'li-button', component: LiButton },
  { name: 'li-hello-world', component: LiHelloWorld },
  { name: 'li-business-form', component: LiBusinessForm },
]

const SrxUi: Plugin = {
  install(app: App) {
    components.forEach(({ name, component }) => {
      app.component(name, component)
    })
  },
}

export { LiButton, LiHelloWorld, LiBusinessForm }

export default SrxUi

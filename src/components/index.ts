import type { App, Plugin } from 'vue'
import LiButton from './li-button/index.vue'
import LiHelloWorld from './li-hello-world/index.vue'
import LiBusinessForm from './li-business-form/index.vue'

const components = [LiButton, LiHelloWorld, LiBusinessForm]

const SrxUi: Plugin = {
  install(app: App) {
    components.forEach((component) => {
      if (component.name) {
        app.component(component.name, component)
      }
    })
  },
}

export { LiButton, LiHelloWorld, LiBusinessForm }

export default SrxUi

import liButton from './li-button/index.vue'
import liHelloWorld from './li-hello-world/index.vue'

const components = {
  liButton,
  liHelloWorld,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function install(Vue) {
  const keys = Object.keys(components)
  keys.forEach((name) => {
    const component = components[name]
    // console.log(component.name || name, '12312312', component)
    Vue.component(component.name || name, component)
  })
}

export default {
  install,
  ...components,
}

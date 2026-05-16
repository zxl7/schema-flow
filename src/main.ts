import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 本地引入测试
import SchemaFlow from './components'

const app = createApp(App)
app.use(router)
app.use(Antd)
app.use(SchemaFlow)

app.mount('#app')

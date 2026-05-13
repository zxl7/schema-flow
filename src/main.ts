import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

import likeUI from './components'

createApp(App).use(Antd).use(likeUI).mount('#app')

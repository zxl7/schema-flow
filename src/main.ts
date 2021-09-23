import { createApp } from 'vue'
import App from './App.vue'

// import likeUI from './components/index.js'
import likeUI from 'srx-ui'
import 'srx-ui/dist/index.css'

createApp(App).use(likeUI).mount('#app')

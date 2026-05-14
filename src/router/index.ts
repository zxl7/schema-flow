import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由配置模块
 * 采用语义化路径设计，方便后期功能迭代与维护
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/form-service'
  },
  {
    path: '/form-service',
    name: 'FormService',
    // 路由懒加载：提升首屏加载性能
    component: () => import('../views/FormService/index.vue'),
    meta: {
      title: '动态表单业务服务'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局后置守卫：动态更新页面标题
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})

export default router

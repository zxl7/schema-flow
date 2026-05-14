<template>
  <!-- 应用根入口：通过路由驱动视图渲染 -->
  <router-view />
</template>

<script setup lang="ts">
/**
 * 根组件：仅保留路由出口，具体的业务逻辑已迁移至 views 目录下的对应页面
 */
</script>

<style>
/* 全局基础样式重置与排版设置 */
html,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* 统一定制滚动条样式（可选） */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>

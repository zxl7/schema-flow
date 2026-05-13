<template>
  <main class="app-shell">
    <li-business-form
      title="工序基础信息"
      :fields="demoFields"
      mode="create"
      @submit="handleSubmit"
      @change="handleChange"
    />

    <aside class="app-preview">
      <h3>表单数据</h3>
      <pre>{{ previewValues }}</pre>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import demoFields from '../demo.json'

// 演示页只负责传入 demo.json，并接收业务表单抛出的数据。
const currentValues = ref<Record<string, unknown>>({})

// 把对象格式化成 JSON 字符串，方便初学者观察表单数据如何变化。
const previewValues = computed(() => JSON.stringify(currentValues.value, null, 2))

function handleChange(values: Record<string, unknown>): void {
  currentValues.value = values
}

function handleSubmit(values: Record<string, unknown>): void {
  currentValues.value = values
  console.log('业务表单提交：', values)
}
</script>

<style>
html,
body {
  margin: 0;
  background: #edf1f5;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
}

.app-preview {
  position: sticky;
  top: 20px;
  align-self: start;
  max-height: calc(100vh - 40px);
  padding: 20px;
  overflow: auto;
  background: #ffffff;
  border: 1px solid #d9e0e8;
  border-radius: 8px;
}

.app-preview h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.app-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1080px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-preview {
    position: static;
    max-height: none;
  }
}
</style>

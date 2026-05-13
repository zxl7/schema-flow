<template>
  <main class="app-shell">
    <div class="app-main">
      <!-- 状态切换器：模拟业务系统中的 详情/编辑/新增 切换 -->
      <div class="app-toolbar">
        <a-radio-group v-model:value="currentMode" button-style="solid">
          <a-radio-button value="create">新增模式 (Create)</a-radio-button>
          <a-radio-button value="edit">编辑模式 (Edit)</a-radio-button>
          <a-radio-button value="view">预览模式 (View)</a-radio-button>
        </a-radio-group>
      </div>

      <li-business-form
        title="工序基础信息"
        :fields="demoFields"
        :mode="currentMode"
        :initial-values="mockInitialValues"
        :option-provider="optionProvider"
        @submit="handleSubmit"
        @change="handleChange"
      />
    </div>

    <aside class="app-preview">
      <h3>当前模式: {{ currentMode }}</h3>
      <div class="preview-section">
        <h3>实时表单数据 (JSON)</h3>
        <pre>{{ previewValues }}</pre>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import demoFields from '../demo.json'
import LiBusinessForm from './components/li-business-form/index.vue'
import type { BusinessField, FieldOption, FormMode, FormModel } from './components/li-business-form/types'

// 当前表单状态
const currentMode = ref<FormMode>('create')

// 模拟回显数据：当处于编辑或预览模式时，通常会有从后端拉取的初始值
const mockInitialValues = computed<FormModel>(() => {
  if (currentMode.value === 'create') return {} as FormModel
  
  return {
    bnum: 'OP-100',
    bname: '粗车端面',
    department: 'workshop-1',
    manHour: 2.5,
    criticalOperation: '1',
    isAuxiliary: '1',
    remark: '这是一个演示回显数据的备注。'
  } as FormModel
})

// 演示页只负责传入 demo.json，并接收业务表单抛出的数据。
const currentValues = ref<Record<string, unknown>>({})

// 把对象格式化成 JSON 字符串，方便观察表单数据如何变化。
const previewValues = computed(() => JSON.stringify(currentValues.value, null, 2))

// 这里模拟复杂业务的数据源入口：真实项目可以在这里调用字典、URL、组织树等接口。
async function optionProvider(field: BusinessField, formModel: FormModel): Promise<FieldOption[]> {
  console.log('加载字段选项：', field.attributeNum, field.logic.optionSource, field.logic.urlConstraint, formModel)
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))

  return field.props.options
}

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
  background: #f0f2f5;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #262626;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 24px;
  min-height: 100vh;
  padding: 24px;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-toolbar {
  padding: 16px 24px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.app-preview {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  padding: 24px;
  overflow: auto;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.preview-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.app-preview h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
}

.app-preview pre {
  margin: 0;
  padding: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #595959;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1200px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-preview {
    position: static;
    max-height: none;
  }
}
</style>

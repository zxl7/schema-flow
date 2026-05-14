<template>
  <div class="form-service-page">
    <div class="form-service-main">
      <!-- 业务状态控制栏：支持不同生命周期的表单模拟 -->
      <section class="action-bar">
        <a-radio-group v-model:value="currentMode" button-style="solid">
          <a-radio-button value="create">新增模式 (Create)</a-radio-button>
          <a-radio-button value="edit">编辑模式 (Edit)</a-radio-button>
          <a-radio-button value="view">预览模式 (View)</a-radio-button>
        </a-radio-group>
      </section>

      <!-- 核心动态表单组件 -->
      <a-schema-form
        ref="formRef"
        :fields="demoFields"
        :mode="currentMode"
        :initial-values="mockInitialValues"
        :option-provider="handleOptionLoad"
        :dictionaries="businessDictionaries"
        @submit="onFormSubmit"
        @change="onFormChange"
      >
        <!-- 使用 header 插槽自定义标题 and 按钮，将业务 UI 逻辑从组件库中剥离 -->
        <template #header>
          <div class="form-header">
            <div class="header-info">
              <p class="eyebrow">业务服务模块</p>
              <h2>工序基础信息管理</h2>
            </div>
            <a-space>
              <a-button @click="handleReset">重置</a-button>
              <a-button type="primary" @click="handleSubmit">提交</a-button>
            </a-space>
          </div>
        </template>
      </a-schema-form>
    </div>

    <!-- 数据实时监控面板 -->
    <aside class="data-inspector">
      <div class="inspector-header">
        <span class="status-tag" :class="`is-${currentMode}`">{{ modeText }}</span>
        <h3>实时数据监控</h3>
      </div>
      
      <div class="inspector-content">
        <div class="data-block">
          <label>当前表单模型 (JSON)</label>
          <pre>{{ formattedValues }}</pre>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import demoFields from '../../../demo.json'
import ASchemaForm from '../../components/a-schema-form/index.vue'
import type { BusinessField, FieldOption, FormMode, FormModel } from '../../components/a-schema-form/types'

/**
 * 业务服务页面：负责调度动态表单组件，处理外部数据交互
 */

const formRef = ref()

// 1. 业务字典数据：从组件库 utils 中剥离到业务侧
const businessDictionaries: Record<string, FieldOption[]> = {
  boolDictionary: [{ label: '是', value: '1' }, { label: '否', value: '0' }],
  isAuxiliary: [{ label: '是', value: '1' }, { label: '否', value: '0' }],
  processCheckType: [
    { label: '自检', value: 'self' },
    { label: '专检', value: 'special' },
    { label: '巡检', value: 'patrol' },
  ],
}

// 当前表单交互模式
const currentMode = ref<FormMode>('create')

// 模式描述文本
const modeText = computed(() => {
  const map: Record<FormMode, string> = {
    create: '正在新增',
    edit: '正在编辑',
    view: '正在预览'
  }
  return map[currentMode.value]
})

/**
 * 模拟业务系统回显数据
 * 实际场景中通常从后端 API 异步获取
 */
const mockInitialValues = computed<FormModel>(() => {
  if (currentMode.value === 'create') return {} as FormModel
  
  return {
    bnum: 'OP-20240513',
    bname: '精密数控加工',
    department: 'workshop-1',
    manHour: 12.5,
    criticalOperation: '1',
    isAuxiliary: '1',
    remark: '该工序需严格遵守安全生产规范，确保加工精度。'
  } as FormModel
})

// 响应式表单实时数据
const currentValues = ref<Record<string, any>>({})

// 格式化后的 JSON 字符串，用于预览展示
const formattedValues = computed(() => JSON.stringify(currentValues.value, null, 2))

/**
 * 外部选项加载器
 * 处理带有 URL 约束或远程数据源的字段
 */
async function handleOptionLoad(field: BusinessField, formModel: FormModel): Promise<FieldOption[]> {
  console.info(`[FormService] 触发远程数据加载: ${field.attributeNum}`, { 
    source: field.logic.optionSource,
    model: formModel 
  })
  
  // 模拟 API 请求延迟
  await new Promise(resolve => setTimeout(resolve, 400))

  return field.props.options
}

/**
 * 处理表单数值变更
 */
function onFormChange(values: Record<string, any>): void {
  currentValues.value = values
}

/**
 * 手动触发表单重置
 */
function handleReset() {
  formRef.value?.resetForm()
}

/**
 * 手动触发表单提交
 */
async function handleSubmit() {
  try {
    const values = await formRef.value?.submitForm()
    if (values) {
      console.info('[FormService] 业务表单提交成功:', values)
    }
  } catch (e) {
    // 校验失败
  }
}

/**
 * 处理表单最终提交（由组件 emit）
 */
function onFormSubmit(values: Record<string, any>): void {
  currentValues.value = values
}
</script>

<style scoped>
.form-service-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 24px;
  min-height: 100vh;
  padding: 24px;
  background-color: #f4f7f9;
}

.form-service-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-bar {
  padding: 16px 24px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.data-inspector {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  padding: 24px;
  overflow: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.inspector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-tag {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.status-tag.is-create { background: #e6f7ff; color: #1890ff; }
.status-tag.is-edit { background: #fff7e6; color: #fa8c16; }
.status-tag.is-view { background: #f6ffed; color: #52c41a; }

.data-block label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
}

.data-block pre {
  margin: 0;
  padding: 16px;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 1200px) {
  .form-service-page {
    grid-template-columns: 1fr;
  }
  .data-inspector {
    position: static;
    max-height: none;
  }
}
</style>

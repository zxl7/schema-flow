<template>
  <div class="schema-editor">
    <!-- 顶部导航 -->
    <header class="editor-header">
      <div class="header-left">
        <a-button @click="$router.push('/form-service')">返回预览</a-button>
        <h2 class="title">ASchemaForm 设计器</h2>
      </div>
      <div class="header-actions">
        <a-space>
          <a-button-group>
            <a-button :disabled="!canUndo" @click="undo" title="撤销 (Ctrl+Z)">↩ 撤销</a-button>
            <a-button :disabled="!canRedo" @click="redo" title="重做 (Ctrl+Y)">↪ 重做</a-button>
          </a-button-group>
          <a-button danger @click="clearCanvas">清空画布</a-button>
          <a-button @click="importJson">导入 JSON</a-button>
          <a-button type="primary" @click="exportJson">导出 JSON</a-button>
        </a-space>
      </div>
    </header>

    <div class="editor-content">
      <!-- 左侧：全局配置与组件库 -->
      <aside class="editor-sidebar left">
        <a-tabs v-model:activeKey="leftTab" size="small" centered>
          <a-tab-pane key="components" tab="组件库">
            <div class="component-list">
              <div 
                v-for="item in availableComponents" 
                :key="item.type" 
                class="component-item"
                draggable="true"
                @dragstart="handleDragStartFromLibrary($event, item.type)"
                @click="addComponent(item.type)"
              >
                <span class="icon">{{ item.icon }}</span>
                {{ item.label }}
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane key="global" tab="表单配置">
            <div class="global-config-panel">
              <a-form layout="vertical" size="small">
                <a-form-item label="表单布局 (Layout)">
                  <a-radio-group v-model:value="globalConfig.layout" button-style="solid">
                    <a-radio-button value="horizontal">水平</a-radio-button>
                    <a-radio-button value="vertical">垂直</a-radio-button>
                    <a-radio-button value="inline">内联</a-radio-button>
                  </a-radio-group>
                </a-form-item>
                
                <a-form-item label="组件尺寸 (Size)">
                  <a-radio-group v-model:value="globalConfig.size" button-style="solid">
                    <a-radio-button value="small">小</a-radio-button>
                    <a-radio-button value="middle">中</a-radio-button>
                    <a-radio-button value="large">大</a-radio-button>
                  </a-radio-group>
                </a-form-item>

                <a-form-item label="标签宽度 (Label Width)" v-if="globalConfig.layout === 'horizontal'">
                  <a-input-number 
                    v-model:value="globalConfig.labelCol.style.width" 
                    :min="50" 
                    :max="300" 
                    addon-after="px" 
                  />
                </a-form-item>

                <a-form-item label="表单宽度 (MaxWidth)">
                  <a-input-number 
                    v-model:value="globalConfig.maxWidth" 
                    :min="400" 
                    :max="1200" 
                    addon-after="px" 
                    style="width: 100%"
                  />
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>
        </a-tabs>
      </aside>

      <!-- 中间：画布/预览 -->
      <main class="editor-main">
        <div class="preview-container">
          <div class="preview-toolbar">
            <a-radio-group v-model:value="previewMode" size="small" button-style="solid">
              <a-radio-button value="create">新增模式</a-radio-button>
              <a-radio-button value="edit">编辑模式</a-radio-button>
              <a-radio-button value="view">预览模式</a-radio-button>
            </a-radio-group>
          </div>
          
          <div 
            class="preview-canvas"
            @dragover.prevent
            @drop="isDesignerMode && handleDropOnCanvas($event)"
          >
            <div 
              v-if="fields.length === 0" 
              class="empty-tip"
            >
              请从左侧拖拽或点击组件添加字段
            </div>
            
            <!-- 这里直接使用我们的组件进行预览 -->
            <a-schema-form
              v-else
              :fields="fields"
              :mode="previewMode"
              :force-show-all="isDesignerMode"
              :global-config="globalConfig"
              title="表单预览"
              @change="handleFormChange"
            >
              <!-- 增加一些交互，让预览中的元素可点击 -->
              <template #header>
                <div class="canvas-header" v-if="isDesignerMode">
                  <span>提示：可拖拽左侧组件入库，或在画布内拖拽排序</span>
                </div>
              </template>

              <!-- 使用 field-item 插槽，将 Label 和组件整体包裹在卡片中 -->
              <template #field-item="{ field }">
                <div 
                  class="field-item-card" 
                  :class="{ 
                    active: isDesignerMode && selectedField && selectedField.bid === field.bid,
                    'is-designer': isDesignerMode,
                    'is-hidden': field.logic.hidden,
                    'is-readonly': field.props.disabled,
                    'is-dragging': isDesignerMode && draggingBid === field.bid,
                    'drop-over-top': isDesignerMode && overBid === field.bid && overPosition === 'top',
                    'drop-over-bottom': isDesignerMode && overBid === field.bid && overPosition === 'bottom'
                  }"
                  :draggable="isDesignerMode"
                  @dragstart="isDesignerMode && handleDragStartFromCanvas($event, field.bid)"
                  @dragover.prevent="isDesignerMode && handleDragOverField($event, field.bid)"
                  @dragleave="isDesignerMode && handleDragLeave()"
                  @drop.stop="isDesignerMode && handleDropOnField($event, field.bid)"
                  @dragend="isDesignerMode && handleDragEnd()"
                  @click="isDesignerMode && handleFieldSelect(field)"
                >
                  <!-- 占位符提示线 -->
                  <div v-if="isDesignerMode" class="drop-placeholder-line top"></div>
                  <div v-if="isDesignerMode" class="drop-placeholder-line bottom"></div>

                  <!-- 顶部操作栏：仅设计模式可见 -->
                  <div v-if="isDesignerMode" class="field-card-actions">
                    <span v-if="field.logic.hidden" class="status-badge hidden">已隐藏</span>
                    <span v-if="field.props.disabled" class="status-badge readonly">只读</span>
                    <a-button-group size="small">
                      <a-button 
                        title="上移"
                        @click.stop="moveField(field.bid, 'up')"
                        :disabled="isFirstField(field.bid)"
                      >
                        ↑
                      </a-button>
                      <a-button 
                        title="下移"
                        @click.stop="moveField(field.bid, 'down')"
                        :disabled="isLastField(field.bid)"
                      >
                        ↓
                      </a-button>
                      <a-button 
                        title="克隆"
                        @click.stop="cloneField(field.bid)"
                      >
                        克隆
                      </a-button>
                      <a-button 
                        danger
                        title="删除"
                        @click.stop="removeFieldByBid(field.bid)"
                      >
                        删除
                      </a-button>
                    </a-button-group>
                  </div>

                  <!-- 模拟 a-form-item 的布局 -->
                  <div class="field-card-content">
                    <div class="field-card-label">
                      <span v-if="field.props.required" class="required-star">*</span>
                      {{ field.displayName }}
                    </div>
                    <div class="field-card-component">
                      <component 
                        :is="componentMap[field.uiType]"
                        v-bind="field.props"
                        v-model:model-value="previewValues[field.attributeNum]"
                        :field="field"
                        :form-model="previewValues"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </a-schema-form>
          </div>
        </div>
      </main>

      <!-- 右侧：属性配置 (在新增和编辑模式下可见) -->
      <PropertyPanel
        v-if="isDesignerMode"
        :selected-field="selectedField"
        :is-id-duplicated="isIdDuplicated"
        :available-components="availableComponents"
        @update:field="handleUpdateField"
      />
    </div>

    <!-- 导出弹窗 -->
    <a-modal
      v-model:visible="showExportModal"
      title="导出 Schema JSON"
      @ok="showExportModal = false"
      width="800px"
    >
      <pre class="json-preview">{{ JSON.stringify(fields, null, 2) }}</pre>
      <template #footer>
        <a-button @click="downloadJson">下载 JSON 文件</a-button>
        <a-button type="primary" @click="copyJson">复制到剪贴板</a-button>
        <a-button @click="showExportModal = false">关闭</a-button>
      </template>
    </a-modal>

    <!-- 导入弹窗 -->
    <a-modal
      v-model:visible="showImportModal"
      title="导入 Schema JSON"
      @ok="handleImport"
      width="800px"
    >
      <a-textarea
        v-model:value="importRawJson"
        placeholder="请粘贴 demo.json 的内容..."
        :rows="15"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ASchemaForm from '../../components/a-schema-form/index.vue'
import type { RawBusinessField, FormMode, RawConstraint } from '../../components/a-schema-form/types'
import { normalizeField } from '../../components/a-schema-form/utils'

// 导入 Hook
import { useDesignerDrag } from './hooks/useDesignerDrag'
import { useDesignerFields } from './hooks/useDesignerFields.ts'
import { useFieldProperties } from './hooks/useFieldProperties'
import { useHistory } from './hooks/useHistory'
import PropertyPanel from './components/PropertyPanel.vue'

// 导入所有基础组件用于预览
import FieldInput from '../../components/a-schema-form/components/FieldInput.vue'
import FieldSelect from '../../components/a-schema-form/components/FieldSelect.vue'
import FieldTree from '../../components/a-schema-form/components/FieldTree.vue'
import FieldView from '../../components/a-schema-form/components/FieldView.vue'
import FieldRadio from '../../components/a-schema-form/components/FieldRadio.vue'
import FieldCheckboxGroup from '../../components/a-schema-form/components/FieldCheckboxGroup.vue'
import FieldRate from '../../components/a-schema-form/components/FieldRate.vue'
import FieldSlider from '../../components/a-schema-form/components/FieldSlider.vue'

// --- 1. 组件库与基础配置 ---
import type { FormGlobalConfig } from '../../components/a-schema-form/types'

// 1. 可用组件列表
const availableComponents = [
  { type: 'textInput', label: '单行文本', icon: '📝', uiType: 'input' },
  { type: 'select', label: '下拉选择', icon: '🔽', uiType: 'select' },
  { type: 'date', label: '日期选择', icon: '📅', uiType: 'input' },
  { type: 'radio', label: '单选框', icon: '🔘', uiType: 'radio' },
  { type: 'checkboxGroup', label: '多选框组', icon: '✅', uiType: 'checkboxGroup' },
  { type: 'double', label: '数字输入', icon: '🔢', uiType: 'input' },
  { type: 'editor', label: '富文本/长文本', icon: '📄', uiType: 'input' },
  { type: 'rate', label: '评分', icon: '⭐', uiType: 'rate' },
  { type: 'slider', label: '滑块', icon: '📏', uiType: 'slider' }
]

const componentMap: Record<string, any> = {
  input: FieldInput,
  select: FieldSelect,
  tree: FieldTree,
  view: FieldView,
  radio: FieldRadio,
  checkboxGroup: FieldCheckboxGroup,
  rate: FieldRate,
  slider: FieldSlider
}

// 2. 状态管理与逻辑抽离

// A. 字段管理 (列表增删改查)
const {
  fields,
  selectedIndex,
  selectedField,
  isIdDuplicated,
  createNewField,
  addComponent,
  removeComponent,
  removeFieldByBid,
  handleFieldSelect,
  cloneField,
  moveField,
  clearCanvas,
  isFirstField,
  isLastField,
  updateField
} = useDesignerFields()

// B. 拖拽交互 (库拖入、画布排序、腾空效果)
const {
  draggingBid,
  draggingType,
  overBid,
  overPosition,
  handleDragStartFromLibrary,
  handleDragStartFromCanvas,
  handleDragOverField,
  handleDragLeave,
  handleDragEnd,
  handleDropOnCanvas,
  handleDropOnField
} = useDesignerDrag(fields, selectedIndex, createNewField)

// C. 处理来自属性面板的更新
const handleUpdateField = (updatedField: RawBusinessField) => {
  updateField(updatedField)
}

// D. 本地预览相关状态
const previewMode = ref<FormMode>('create')
const previewValues = ref<Record<string, any>>({})
const leftTab = ref('components') // 左侧面板的 Tab 切换状态

// 表单全局配置状态
const globalConfig = ref<FormGlobalConfig>({
  layout: 'vertical',
  size: 'middle',
  labelCol: { style: { width: 120 } },
  maxWidth: 800
})

// 只有 create 和 edit 模式才算真正的设计器模式（允许修改 schema）
const isDesignerMode = computed(() => previewMode.value === 'create' || previewMode.value === 'edit')

// 监听表单内部数据变化，同步到外部，用于联动计算
const handleFormChange = (values: Record<string, any>) => {
  previewValues.value = { ...values }
}

// F. 撤销重做历史记录
const { undo, redo, canUndo, canRedo, initHistory } = useHistory(fields, selectedIndex)

// E. 弹窗相关状态
const showExportModal = ref(false)
const showImportModal = ref(false)
const importRawJson = ref('')

// --- 3. 导入导出逻辑 ---

/**
 * 打开导出 JSON 弹窗
 */
const exportJson = () => {
  showExportModal.value = true
}

/**
 * 复制 Schema 到剪贴板
 */
const copyJson = () => {
  navigator.clipboard.writeText(JSON.stringify(fields.value, null, 2))
  alert('已复制到剪贴板')
}

/**
 * 下载 Schema 为 .json 文件
 */
const downloadJson = () => {
  const data = JSON.stringify(fields.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `schema_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 打开导入 JSON 弹窗
 */
const importJson = () => {
  importRawJson.value = ''
  showImportModal.value = true
}

/**
 * 执行 JSON 导入
 */
const handleImport = () => {
  try {
    const data = JSON.parse(importRawJson.value)
    if (Array.isArray(data)) {
      fields.value = data.map((item, index) => ({
        ...item,
        bid: item.bid || Date.now().toString() + Math.random().toString().slice(2, 6),
        attributeNum: item.attributeNum || `field_${index + 1}`,
        sortOrder: index + 1
      }))
      showImportModal.value = false
      selectedIndex.value = -1
      // 导入后重新初始化历史记录
      initHistory(fields.value)
    } else {
      alert('请输入正确的 JSON 数组格式')
    }
  } catch (e) {
    alert('JSON 格式错误，请检查')
  }
}

// --- 4. 预览与业务逻辑 ---

/**
 * 应用字段的默认值到预览表单
 */
const applyDefaultValues = () => {
  fields.value.forEach(f => {
    const normalized = normalizeField(f, previewMode.value)
    if (normalized.logic.defaultValue !== undefined && normalized.logic.defaultValue !== null) {
      if (previewValues.value[f.attributeNum] === undefined) {
        previewValues.value[f.attributeNum] = normalized.logic.defaultValue
      }
    }
  })
}

// 监听选中字段的约束变化，实时更新预览值
watch(() => selectedField.value?.constraintInfo, () => {
  if (selectedField.value) {
    const normalized = normalizeField(selectedField.value, previewMode.value)
    if (normalized.logic.defaultValue !== undefined) {
      previewValues.value[selectedField.value.attributeNum] = normalized.logic.defaultValue
    }
  }
}, { deep: true })

// --- 5. 生命周期与持久化 ---

const STORAGE_KEY = 'SCHEMA_EDITOR_DRAFT'
const GLOBAL_CONFIG_KEY = 'SCHEMA_EDITOR_GLOBAL_CONFIG'

/**
 * 挂载时加载本地草稿
 */
onMounted(() => {
  const draft = localStorage.getItem(STORAGE_KEY)
  if (draft) {
    try {
      fields.value = JSON.parse(draft)
      initHistory(fields.value) // 初始化历史记录
    } catch (e) {
      console.error('加载草稿失败', e)
    }
  } else {
    initHistory([]) // 初始化空历史
  }

  const globalConfigDraft = localStorage.getItem(GLOBAL_CONFIG_KEY)
  if (globalConfigDraft) {
    try {
      globalConfig.value = JSON.parse(globalConfigDraft)
    } catch (e) {
      console.error('加载全局配置失败', e)
    }
  }

  // 监听快捷键
  window.addEventListener('keydown', handleKeydown)
})

import { onUnmounted } from 'vue'

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

/**
 * 监听快捷键 (Ctrl+Z / Cmd+Z)
 */
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      redo()
    } else {
      undo()
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

/**
 * 字段列表变化时自动保存草稿
 */
watch(fields, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
}, { deep: true })

/**
 * 全局配置变化时自动保存
 */
watch(globalConfig, (newVal) => {
  localStorage.setItem(GLOBAL_CONFIG_KEY, JSON.stringify(newVal))
}, { deep: true })

/**
 * 切换预览模式时自动填充默认值
 */
watch(previewMode, (mode) => {
  if (mode === 'view' || mode === 'edit') {
    applyDefaultValues()
  }
})
</script>

<style scoped>
.schema-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 280px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8e8e8;
}

.editor-sidebar.right {
  width: 320px;
  border-right: none;
  border-left: 1px solid #e8e8e8;
}

.sidebar-title {
  padding: 12px 16px;
  font-weight: 600;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.component-list {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  overflow-y: auto;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.component-item .icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.editor-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  position: relative;
}

.preview-container {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  min-height: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.preview-canvas {
  flex: 1;
  padding: 40px;
  position: relative;
  background: #f5f7fa;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
}

.property-panel {
  padding: 16px;
  overflow-y: auto;
}

.url-config-grid,
.state-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.state-config-grid {
  grid-template-columns: 1fr; /* 状态配置垂直排列更清晰 */
}

.tip {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.field-item-card {
  position: relative;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  /* 简化过渡：只保留基础的颜色变化，移除位移动画 */
  transition: all 0.2s ease;
}

/* 仅在设计模式下有交互样式 */
.field-item-card.is-designer {
  cursor: pointer;
}

.field-item-card.is-designer:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

/* 激活状态：简约的实线/虚线边框，移除外发光和缩放 */
.field-item-card.is-designer.active {
  border: 1px solid #1890ff;
  background: #f0f7ff;
  z-index: 10;
}

/* 拖拽腾空效果 */
.field-item-card.drop-over-top {
  margin-top: 48px; /* 腾出空间 */
}

.field-item-card.drop-over-bottom {
  margin-bottom: 48px; /* 腾出空间 */
}

/* 占位符提示线 */
.drop-placeholder-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: #1890ff;
  display: none;
  z-index: 20;
  border-radius: 2px;
}

.drop-placeholder-line::after {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 9px;
  height: 9px;
  background: #1890ff;
  border-radius: 50%;
}

.drop-over-top .drop-placeholder-line.top {
  display: block;
  top: -24px;
}

.drop-over-bottom .drop-placeholder-line.bottom {
  display: block;
  bottom: -24px;
}

.field-item-card.is-dragging {
  opacity: 0.4;
  border: 1px dashed #1890ff;
  background: #e6f7ff;
}

.field-item-card.is-hidden {
  opacity: 0.5;
  background: #f9f9f9;
}

.field-item-card.is-readonly {
  background: #fafafa;
}

.status-badge {
  font-size: 11px;
  padding: 0 6px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: middle;
  color: #fff;
}

.status-badge.hidden {
  background: #bfbfbf;
}

.status-badge.readonly {
  background: #ffa940;
}

.field-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  /* 简化按钮动画：只保留淡入效果 */
  transition: opacity 0.2s ease;
  z-index: 11;
}

.field-item-card.is-designer.active .field-card-actions,
.field-item-card.is-designer:hover .field-card-actions {
  opacity: 1;
}

.field-card-content {
  display: flex;
  flex-direction: column;
}

.field-card-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
  font-weight: 500;
}

.required-star {
  color: #ff4d4f;
  margin-right: 4px;
}

.field-card-component {
  min-height: 32px;
}

.json-preview {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 4px;
  max-height: 500px;
  overflow: auto;
}

.canvas-header {
  padding: 8px;
  background: #e6f7ff;
  border-radius: 4px;
  color: #1890ff;
  font-size: 13px;
  text-align: center;
}
.global-config-panel {
  padding: 16px;
  overflow-y: auto;
}
</style>

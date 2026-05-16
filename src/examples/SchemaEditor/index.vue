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
          <a-button danger @click="clearCanvas">清空画布</a-button>
          <a-button @click="importJson">导入 JSON</a-button>
          <a-button type="primary" @click="exportJson">导出 JSON</a-button>
        </a-space>
      </div>
    </header>

    <div class="editor-content">
      <!-- 左侧：组件库 -->
      <aside class="editor-sidebar left">
        <div class="sidebar-title">组件库</div>
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
            @drop="handleDropOnCanvas"
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
              :force-show-all="previewMode !== 'view'"
              title="表单预览"
            >
              <!-- 增加一些交互，让预览中的元素可点击 -->
              <template #header>
                <div class="canvas-header">
                  <span>提示：可拖拽左侧组件入库，或在画布内拖拽排序</span>
                </div>
              </template>

              <!-- 使用 field-item 插槽，将 Label 和组件整体包裹在卡片中 -->
              <template #field-item="{ field }">
                <div 
                  class="field-item-card" 
                  :class="{ 
                    active: selectedField && selectedField.bid === field.bid,
                    'is-designer': previewMode !== 'view',
                    'is-hidden': field.logic.hidden,
                    'is-readonly': field.props.disabled,
                    'is-dragging': draggingBid === field.bid,
                    'drop-over-top': overBid === field.bid && overPosition === 'top',
                    'drop-over-bottom': overBid === field.bid && overPosition === 'bottom'
                  }"
                  :draggable="previewMode !== 'view'"
                  @dragstart="handleDragStartFromCanvas($event, field.bid)"
                  @dragover.prevent="handleDragOverField($event, field.bid)"
                  @dragleave="handleDragLeave"
                  @drop.stop="handleDropOnField($event, field.bid)"
                  @dragend="handleDragEnd"
                  @click="previewMode !== 'view' && handleFieldSelect(field)"
                >
                  <!-- 占位符提示线 -->
                  <div class="drop-placeholder-line top"></div>
                  <div class="drop-placeholder-line bottom"></div>

                  <!-- 顶部操作栏：预览模式下隐藏 -->
                  <div v-if="previewMode !== 'view'" class="field-card-actions">
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

      <!-- 右侧：属性配置 -->
      <aside class="editor-sidebar right">
        <div class="sidebar-title">属性配置</div>
        <div v-if="selectedField" class="property-panel">
          <!-- ID 重复警告 -->
          <a-alert
            v-if="isIdDuplicated"
            message="字段 ID (attributeNum) 已存在，请修改以防数据覆盖"
            type="error"
            show-icon
            style="margin-bottom: 16px"
          />
          <a-form layout="vertical">
            <a-form-item label="字段 ID (attributeNum)">
              <a-input v-model:value="selectedField.attributeNum" placeholder="唯一标识，如: userName" />
            </a-form-item>
            <a-form-item label="显示名称 (displayName)">
              <a-input v-model:value="selectedField.displayName" />
            </a-form-item>
            <a-form-item label="控件类型 (controlStyle)">
              <a-select v-model:value="selectedField.controlStyle">
                <a-select-option v-for="opt in availableComponents" :key="opt.type" :value="opt.type">
                  {{ opt.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="分组名称 (groupTag)">
              <a-input v-model:value="selectedField.groupTag" />
            </a-form-item>
            <a-form-item label="排序权重 (sortOrder)">
              <a-input-number v-model:value="selectedField.sortOrder" :min="0" />
            </a-form-item>

            <!-- 1. 数据源配置 (调整到约束配置上方) -->
            <template v-if="['select', 'radio', 'checkboxGroup'].includes(selectedField.controlStyle)">
              <a-divider>数据源配置</a-divider>
              <a-form-item label="数据源类型">
                <a-radio-group v-model:value="dataSourceType" size="small">
                  <a-radio-button value="enum">静态枚举</a-radio-button>
                  <a-radio-button value="url">远程 URL</a-radio-button>
                </a-radio-group>
              </a-form-item>

              <!-- 静态枚举编辑 -->
              <template v-if="dataSourceType === 'enum'">
                <a-form-item label="静态选项 (用 || 分隔)">
                  <a-textarea 
                    v-model:value="fieldEnumOptions" 
                    placeholder="例如: 选项1||选项2||选项3" 
                    :rows="3"
                  />
                  <span class="tip">提示：输入 选项1||选项2 即可生成下拉列表</span>
                </a-form-item>
              </template>

              <!-- URL 配置编辑 -->
              <template v-if="dataSourceType === 'url'">
                <a-form-item label="接口地址 (URL)">
                  <a-input v-model:value="urlPath" placeholder="/api/list" />
                </a-form-item>
                <div class="url-config-grid">
                  <a-form-item label="Value 字段">
                    <a-input v-model:value="urlValueKey" placeholder="id" />
                  </a-form-item>
                  <a-form-item label="Label 字段">
                    <a-input v-model:value="urlLabelKey" placeholder="name" />
                  </a-form-item>
                </div>
              </template>
            </template>

            <!-- 2. 约束配置 -->
            <a-divider>约束配置</a-divider>

            <a-form-item label="默认值">
              <a-input v-model:value="fieldDefaultValue" placeholder="请输入默认值" />
            </a-form-item>
            <div class="constraint-item">
              <a-checkbox v-model:checked="isFieldRequired">是否必填</a-checkbox>
            </div>

            <!-- 3. 状态配置 (调整到最下方) -->
            <a-divider>状态配置 (Permissions)</a-divider>
            <div class="state-config-grid">
              <a-form-item label="新增模式 (Create)">
                <a-select v-model:value="selectedField.createState">
                  <a-select-option value="RW">可读写 (RW)</a-select-option>
                  <a-select-option value="R">只读 (R)</a-select-option>
                  <a-select-option value="hidden">隐藏 (Hidden)</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="编辑模式 (Edit)">
                <a-select v-model:value="selectedField.editState">
                  <a-select-option value="RW">可读写 (RW)</a-select-option>
                  <a-select-option value="R">只读 (R)</a-select-option>
                  <a-select-option value="hidden">隐藏 (Hidden)</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="预览模式 (View)">
                <a-select v-model:value="selectedField.viewState">
                  <a-select-option value="RW">可读写 (RW)</a-select-option>
                  <a-select-option value="R">只读 (R)</a-select-option>
                  <a-select-option value="hidden">隐藏 (Hidden)</a-select-option>
                </a-select>
              </a-form-item>
            </div>
          </a-form>
        </div>
        <div v-else class="empty-tip">
          请选择一个字段进行配置
        </div>
      </aside>
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
import { useDesignerFields } from './hooks/useDesignerFields'
import { useFieldProperties } from './hooks/useFieldProperties'

// 导入所有基础组件用于预览
import FieldInput from '../../components/a-schema-form/components/FieldInput.vue'
import FieldSelect from '../../components/a-schema-form/components/FieldSelect.vue'
import FieldTree from '../../components/a-schema-form/components/FieldTree.vue'
import FieldView from '../../components/a-schema-form/components/FieldView.vue'
import FieldRadio from '../../components/a-schema-form/components/FieldRadio.vue'
import FieldCheckboxGroup from '../../components/a-schema-form/components/FieldCheckboxGroup.vue'
import FieldRate from '../../components/a-schema-form/components/FieldRate.vue'
import FieldSlider from '../../components/a-schema-form/components/FieldSlider.vue'

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
  isLastField
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

// C. 属性配置 (约束、权限、数据源)
const {
  dataSourceType,
  urlPath,
  urlValueKey,
  urlLabelKey,
  isFieldRequired,
  fieldDefaultValue,
  fieldEnumOptions
} = useFieldProperties(selectedField)

// D. 本地预览相关状态
const previewMode = ref<FormMode>('create')
const previewValues = ref<Record<string, any>>({})

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
      fields.value = data.map(item => ({
        ...item,
        bid: item.bid || Date.now().toString() + Math.random()
      }))
      showImportModal.value = false
      selectedIndex.value = -1
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
      previewValues.value[f.attributeNum] = normalized.logic.defaultValue
    }
  })
}

// --- 5. 生命周期与持久化 ---

const STORAGE_KEY = 'SCHEMA_EDITOR_DRAFT'

/**
 * 挂载时加载本地草稿
 */
onMounted(() => {
  const draft = localStorage.getItem(STORAGE_KEY)
  if (draft) {
    try {
      fields.value = JSON.parse(draft)
    } catch (e) {
      console.error('加载草稿失败', e)
    }
  }
})

/**
 * 字段列表变化时自动保存草稿
 */
watch(fields, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
}, { deep: true })

/**
 * 切换预览模式时自动填充默认值
 */
watch(previewMode, (mode) => {
  if (mode === 'view' || mode === 'edit') {
    applyDefaultValues()
  }
})

/**
 * 监听选中字段的约束变化，实时更新预览值
 */
watch(() => selectedField.value?.constraintInfo, () => {
  if (selectedField.value) {
    const normalized = normalizeField(selectedField.value, previewMode.value)
    if (normalized.logic.defaultValue !== undefined) {
      previewValues.value[selectedField.value.attributeNum] = normalized.logic.defaultValue
    }
  }
}, { deep: true })
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
</style>

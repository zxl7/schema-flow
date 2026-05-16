<template>
  <div class="schema-editor">
    <!-- 顶部导航 -->
    <header class="editor-header">
      <div class="header-left">
        <a-button @click="$router.push('/form-service')">返回预览</a-button>
        <h2 class="title">ASchemaForm 设计器</h2>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="exportJson">导出 JSON</a-button>
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
          
          <div class="preview-canvas">
            <div 
              v-if="fields.length === 0" 
              class="empty-tip"
            >
              请从左侧点击组件添加字段
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
                  <span>点击下方卡片可配置字段属性</span>
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
                    'is-readonly': field.props.disabled
                  }"
                  @click="previewMode !== 'view' && handleFieldSelect(field)"
                >
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
          <a-form layout="vertical">
            <a-form-item label="字段 ID (attributeNum)">
              <a-input v-model:value="selectedField.attributeNum" />
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
            
            <a-divider>约束配置</a-divider>
            
            
            
            <a-form-item label="默认值">
              <a-input v-model:value="fieldDefaultValue" placeholder="请输入默认值" />
            </a-form-item>

            <!-- 下拉选项配置 -->
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
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ASchemaForm from '../../components/a-schema-form/index.vue'
import type { RawBusinessField, FormMode, RawConstraint, BusinessField } from '../../components/a-schema-form/types'
import { normalizeField } from '../../components/a-schema-form/utils'

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

// 2. 状态管理
const fields = ref<RawBusinessField[]>([])
const selectedIndex = ref<number>(-1)
const previewMode = ref<FormMode>('create')
const showExportModal = ref(false)
const previewValues = ref<Record<string, any>>({})

// 数据源相关状态
const dataSourceType = ref<'enum' | 'url'>('enum')
const urlPath = ref('')
const urlValueKey = ref('')
const urlLabelKey = ref('')

// 3. 计算属性
const selectedField = computed(() => {
  if (selectedIndex.value >= 0 && selectedIndex.value < fields.value.length) {
    return fields.value[selectedIndex.value]
  }
  return null
})

const handleFieldSelect = (field: RawBusinessField) => {
  const index = fields.value.findIndex(f => f.bid === field.bid)
  selectedIndex.value = index
}

const removeFieldByBid = (bid: string) => {
  const index = fields.value.findIndex(f => f.bid === bid)
  if (index >= 0) {
    removeComponent(index)
  }
}

const moveField = (bid: string, direction: 'up' | 'down') => {
  const index = fields.value.findIndex(f => f.bid === bid)
  if (index < 0) return

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= fields.value.length) return

  // 1. 交换数组元素位置（控制视图显示顺序）
  const temp = fields.value[index]
  fields.value[index] = fields.value[targetIndex]
  fields.value[targetIndex] = temp

  // 2. 重要：同步更新 sortOrder 权重，确保导出数据也符合顺序
  fields.value.forEach((f, i) => {
    f.sortOrder = i + 1
  })

  // 3. 同步更新选中索引
  if (selectedIndex.value === index) {
    selectedIndex.value = targetIndex
  } else if (selectedIndex.value === targetIndex) {
    selectedIndex.value = index
  }
}

const isFirstField = (bid: string) => {
  return fields.value.length > 0 && fields.value[0].bid === bid
}

const isLastField = (bid: string) => {
  return fields.value.length > 0 && fields.value[fields.value.length - 1].bid === bid
}

// 4. 辅助：解析和构造 constraintInfo
const isFieldRequired = computed({
  get: () => {
    if (!selectedField.value?.constraintInfo) return false
    try {
      const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
      return constraints.some(c => c.key === 'required' && c.value === 1)
    } catch {
      return false
    }
  },
  set: (val: boolean) => {
    updateConstraint('required', val ? 1 : 0)
  }
})

const fieldDefaultValue = computed({
  get: () => {
    if (!selectedField.value?.constraintInfo) return ''
    try {
      const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
      const found = constraints.find(c => c.key === 'default_value')
      return found ? String(found.value) : ''
    } catch {
      return ''
    }
  },
  set: (val: string) => {
    updateConstraint('default_value', val)
  }
})

const fieldEnumOptions = computed({
  get: () => {
    if (!selectedField.value?.constraintInfo) return ''
    try {
      const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
      const found = constraints.find(c => c.key === 'enum')
      return found ? String(found.value) : ''
    } catch {
      return ''
    }
  },
  set: (val: string) => {
    updateConstraint('enum', val)
    if (val) {
      updateConstraint('url', null)
    }
  }
})

// 监听选中字段切换，同步数据源 UI 状态
watch(selectedField, (newField) => {
  if (!newField) return
  try {
    const constraints = JSON.parse(newField.constraintInfo || '[]') as RawConstraint[]
    const urlConstraint = constraints.find(c => c.key === 'url')
    
    if (urlConstraint) {
      dataSourceType.value = 'url'
      const raw = String(urlConstraint.value)
      const [pathPart, keysPart] = raw.split(' / ')
      urlPath.value = pathPart || ''
      if (keysPart) {
        const [v, l] = keysPart.split('&')
        urlValueKey.value = v || ''
        urlLabelKey.value = l || ''
      }
    } else {
      dataSourceType.value = 'enum'
      urlPath.value = ''
      urlValueKey.value = ''
      urlLabelKey.value = ''
    }
  } catch {
    dataSourceType.value = 'enum'
  }
}, { immediate: true })

// 监听 URL 部件变化，同步到约束
watch([urlPath, urlValueKey, urlLabelKey], () => {
  if (dataSourceType.value === 'url' && urlPath.value) {
    const value = `${urlPath.value} / ${urlValueKey.value}&${urlLabelKey.value}`
    updateConstraint('url', value)
    updateConstraint('enum', null)
  }
})

const updateConstraint = (key: string, value: any) => {
  if (!selectedField.value) return
  
  let constraints: RawConstraint[] = []
  try {
    constraints = JSON.parse(selectedField.value.constraintInfo || '[]')
  } catch (e) {
    constraints = []
  }

  const index = constraints.findIndex(c => c.key === key)
  if (index >= 0) {
    if (value === null || value === '' || (key === 'required' && value === 0)) {
      constraints.splice(index, 1)
    } else {
      constraints[index].value = value
    }
  } else if (value !== null && value !== '') {
    constraints.push({ 
      key, 
      value, 
      lableName: key === 'required' ? '必填' : key === 'enum' ? '枚举' : key === 'url' ? '数据源' : '默认值' 
    })
  }

  selectedField.value.constraintInfo = constraints.length > 0 ? JSON.stringify(constraints) : null
}

// 5. 方法
const addComponent = (type: string) => {
  const newField: RawBusinessField = {
    bid: Date.now().toString(),
    attributeNum: `field_${fields.value.length + 1}`,
    displayName: `新字段_${fields.value.length + 1}`,
    controlStyle: type,
    sortOrder: fields.value.length + 1,
    constraintInfo: null,
    createState: 'RW',
    editState: 'RW',
    viewState: 'R',
    groupTag: '基础信息'
  }
  fields.value.push(newField)
  selectedIndex.value = fields.value.length - 1
}

const removeComponent = (index: number) => {
  fields.value.splice(index, 1)
  if (selectedIndex.value === index) {
    selectedIndex.value = -1
  } else if (selectedIndex.value > index) {
    selectedIndex.value--
  }
}

const exportJson = () => {
  showExportModal.value = true
}

/**
 * 核心逻辑：应用默认值到表单
 * 遍历所有字段，提取其约束中的 default_value 并填充到 previewValues
 */
const applyDefaultValues = () => {
  fields.value.forEach(f => {
    // 使用组件库内置的归一化逻辑获取默认值
    const normalized = normalizeField(f, previewMode.value)
    if (normalized.logic.defaultValue !== undefined && normalized.logic.defaultValue !== null) {
      previewValues.value[f.attributeNum] = normalized.logic.defaultValue
    }
  })
}

// 监听预览模式变化，自动填充默认值
watch(previewMode, (mode) => {
  if (mode === 'view' || mode === 'edit') {
    applyDefaultValues()
  }
})

// 监听字段属性中的默认值修改，实时同步到预览
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
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

/* 仅在设计模式下有交互样式 */
.field-item-card.is-designer {
  border: 1px dashed #d9d9d9;
  cursor: pointer;
}

.field-item-card.is-designer:hover {
  border-color: #1890ff;
  background: #fafafa;
}

.field-item-card.is-designer.active {
  border: 2px dashed #1890ff;
  background: #f0f7ff;
  z-index: 10;
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
  display: flex;
  align-items: center;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 11;
}

.field-item-card.active .field-card-actions,
.field-item-card:hover .field-card-actions {
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

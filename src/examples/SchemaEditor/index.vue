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
              title="表单预览"
            >
              <!-- 增加一些交互，让预览中的元素可点击 -->
              <template #header>
                <div class="canvas-header">
                  <span>点击下方字段可进行属性配置</span>
                </div>
              </template>
            </a-schema-form>

            <!-- 简单的字段列表，用于点击选择进行编辑 -->
            <div class="field-list-overlay">
              <div 
                v-for="(field, index) in fields" 
                :key="field.bid" 
                class="field-item-mask"
                :class="{ active: selectedIndex === index }"
                @click="selectedIndex = index"
              >
                <div class="field-actions">
                  <a-button type="text" danger size="small" @click.stop="removeComponent(index)">删除</a-button>
                </div>
              </div>
            </div>
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
            
            <a-divider>约束配置</a-divider>
            
            <div class="constraint-item">
              <a-checkbox v-model:checked="isFieldRequired">是否必填</a-checkbox>
            </div>
            
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
import type { RawBusinessField, FormMode, RawConstraint } from '../../components/a-schema-form/types'

// 1. 可用组件列表
const availableComponents = [
  { type: 'textInput', label: '单行文本', icon: '📝' },
  { type: 'select', label: '下拉选择', icon: '🔽' },
  { type: 'date', label: '日期选择', icon: '📅' },
  { type: 'radio', label: '单选框', icon: '🔘' },
  { type: 'checkboxGroup', label: '多选框组', icon: '✅' },
  { type: 'double', label: '数字输入', icon: '🔢' },
  { type: 'editor', label: '富文本/长文本', icon: '📄' },
  { type: 'rate', label: '评分', icon: '⭐' },
  { type: 'slider', label: '滑块', icon: '📏' }
]

// 2. 状态管理
const fields = ref<RawBusinessField[]>([])
const selectedIndex = ref<number>(-1)
const previewMode = ref<FormMode>('create')
const showExportModal = ref(false)

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
  padding: 24px;
  position: relative;
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

.url-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tip {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.field-list-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* 让点击能穿透到下面的组件，除非我们显式捕获 */
  padding: 24px; /* 匹配预览区域 padding */
  display: flex;
  flex-direction: column;
  gap: 0; /* 匹配表单项间距 */
}

/* 简单的字段蒙层，用于点击选择 */
/* 这里我们根据预览模式下的表单布局来对齐 */
.field-item-mask {
  height: 80px; /* 粗略估计高度，后期可以根据实际动态计算 */
  margin-bottom: 8px;
  border: 2px dashed transparent;
  pointer-events: auto;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.field-item-mask:hover {
  background: rgba(24, 144, 255, 0.05);
  border-color: #91d5ff;
}

.field-item-mask.active {
  background: rgba(24, 144, 255, 0.1);
  border-color: #1890ff;
  border-style: solid;
}

.field-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.field-item-mask:hover .field-actions {
  opacity: 1;
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

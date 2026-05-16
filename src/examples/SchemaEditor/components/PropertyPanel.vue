<template>
  <aside class="editor-sidebar right">
    <div class="sidebar-title">属性配置</div>
    <div v-if="selectedField" class="property-panel">
      <!-- ID 重复警告 (通过外部传入判断结果) -->
      <a-alert
        v-if="isIdDuplicated"
        message="字段 ID (attributeNum) 已存在，请修改以防数据覆盖"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <a-form layout="vertical">
        <!-- 基础配置 -->
        <a-form-item label="字段 ID (attributeNum)">
          <a-input v-model:value="attributeNum" placeholder="唯一标识，如: userName" />
        </a-form-item>
        <a-form-item label="显示名称 (displayName)">
          <a-input v-model:value="displayName" />
        </a-form-item>
        <a-form-item label="控件类型 (controlStyle)">
          <a-select v-model:value="controlStyle">
            <a-select-option v-for="opt in availableComponents" :key="opt.type" :value="opt.type">
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分组名称 (groupTag)">
          <a-input v-model:value="groupTag" />
        </a-form-item>
        <a-form-item label="排序权重 (sortOrder)">
          <a-input-number v-model:value="sortOrder" :min="0" />
        </a-form-item>

        <!-- 1. 数据源配置 (仅在选择类组件显示) -->
        <template v-if="isOptionField">
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

        <!-- 3. 联动配置 (声明式逻辑) -->
        <a-divider>逻辑配置 (联动)</a-divider>
        <a-form-item label="显示条件 (JS 表达式)">
          <a-textarea 
            v-model:value="logicExpression" 
            placeholder="例如: $form.field_1 === '1'" 
            :rows="2"
          />
          <span class="tip">提示：表达式返回 true 时显示该字段。使用 $form 访问表单数据。若为空则默认显示。</span>
        </a-form-item>

        <!-- 4. 状态配置 -->
        <a-divider>状态配置 (Permissions)</a-divider>
        <div class="state-config-grid">
          <a-form-item label="新增模式 (Create)">
            <a-select v-model:value="createState">
              <a-select-option value="RW">可读写 (RW)</a-select-option>
              <a-select-option value="R">只读 (R)</a-select-option>
              <a-select-option value="hidden">隐藏 (Hidden)</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="编辑模式 (Edit)">
            <a-select v-model:value="editState">
              <a-select-option value="RW">可读写 (RW)</a-select-option>
              <a-select-option value="R">只读 (R)</a-select-option>
              <a-select-option value="hidden">隐藏 (Hidden)</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="预览模式 (View)">
            <a-select v-model:value="viewState">
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RawBusinessField } from '../../../../components/a-schema-form/types'
import { useFieldProperties } from '../hooks/useFieldProperties'

const props = defineProps<{
  /**
   * 当前选中的字段数据 (单向数据流入口)
   */
  selectedField: RawBusinessField | null
  /**
   * ID 是否存在重复警告
   */
  isIdDuplicated: boolean
  /**
   * 左侧组件库定义的可用组件列表（用于下拉选择组件类型）
   */
  availableComponents: Array<{ type: string; label: string }>
}>()

const emit = defineEmits<{
  /**
   * 通知外部按 patch 更新字段，保持单一数据源
   */
  (e: 'update:field', patch: Partial<RawBusinessField>): void
}>()

/**
 * 单一数据源更新入口
 * 只在字段内容真实变化时向父层抛出更新，避免形成循环写回。
 */
const updateSelectedField = (patch: Partial<RawBusinessField>) => {
  if (!props.selectedField) return
  emit('update:field', patch)
}

/**
 * 生成字段属性的双向绑定
 * getter 只读父层数据，setter 统一走 emit，确保属性面板不持有副本状态。
 */
const createFieldBinding = <K extends keyof RawBusinessField>(
  key: K,
  fallback: RawBusinessField[K]
) => computed({
  get: () => props.selectedField?.[key] ?? fallback,
  set: (value: RawBusinessField[K]) => {
    if (!props.selectedField || props.selectedField[key] === value) return
    updateSelectedField({ [key]: value } as Partial<RawBusinessField>)
  }
})

const selectedFieldRef = computed(() => props.selectedField)
const attributeNum = createFieldBinding('attributeNum', '')
const displayName = createFieldBinding('displayName', '')
const controlStyle = createFieldBinding('controlStyle', 'text')
const groupTag = createFieldBinding('groupTag', '')
const sortOrder = createFieldBinding('sortOrder', 0)
const logicExpression = createFieldBinding('logicExpression', '')
const createState = createFieldBinding('createState', 'RW')
const editState = createFieldBinding('editState', 'RW')
const viewState = createFieldBinding('viewState', 'R')

const isOptionField = computed(() =>
  ['select', 'radio', 'checkboxGroup'].includes(String(controlStyle.value))
)

// 提取约束配置逻辑，并统一通过 updateSelectedField 回写父层
const {
  dataSourceType,
  urlPath,
  urlValueKey,
  urlLabelKey,
  isFieldRequired,
  fieldDefaultValue,
  fieldEnumOptions
} = useFieldProperties(selectedFieldRef, updateSelectedField)

</script>

<style scoped>
.editor-sidebar.right {
  width: 320px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e8e8e8;
  height: 100%;
}

.sidebar-title {
  padding: 12px 16px;
  font-weight: 600;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.property-panel {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
}

.url-config-grid,
.state-config-grid {
  display: grid;
  gap: 12px;
}

.url-config-grid {
  grid-template-columns: 1fr 1fr;
}

.state-config-grid {
  grid-template-columns: 1fr;
}

.tip {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>

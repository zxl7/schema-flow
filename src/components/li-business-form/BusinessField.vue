<template>
  <!-- 字段分发器：负责根据模式和控件类型选择合适的组件渲染 -->
  <div class="business-field-container">
    <!-- 1. 浏览模式：统一使用 FieldView -->
    <template v-if="mode === 'view'">
      <FieldView
        :field="field"
        :model-value="modelValue"
      />
    </template>

    <!-- 2. 编辑/新增模式：根据 controlStyle 分发 -->
    <template v-else>
      <!-- 下拉、选人、搜索类 -->
      <FieldSelect
        v-if="isSelectType"
        :field="field"
        :model-value="modelValue"
        :form-model="formModel"
        :option-provider="optionProvider"
        @update:model-value="onUpdate"
      />

      <!-- 树形选择 -->
      <FieldTree
        v-else-if="field.controlStyle === 'tree'"
        :field="field"
        :model-value="modelValue"
        :form-model="formModel"
        :option-provider="optionProvider"
        @update:model-value="onUpdate"
      />

      <!-- 基础输入类 (Input, Number, Textarea, Date, Checkbox) -->
      <FieldInput
        v-else
        :field="field"
        :model-value="modelValue"
        @update:model-value="onUpdate"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BusinessField, FieldValue, FormMode, FormModel, OptionProvider } from './types'
import FieldInput from './components/FieldInput.vue'
import FieldSelect from './components/FieldSelect.vue'
import FieldTree from './components/FieldTree.vue'
import FieldView from './components/FieldView.vue'

// 定义 Props
const props = defineProps<{
  field: BusinessField
  mode: FormMode
  modelValue: FieldValue
  formModel: FormModel
  optionProvider?: OptionProvider
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

// 判断是否属于下拉选择类控件
const isSelectType = computed(() => {
  const selectStyles = ['select', 'inputAndSelect', 'searchInput', 'user']
  return selectStyles.includes(props.field.controlStyle)
})

/**
 * 向上抛出值更新事件
 */
function onUpdate(val: FieldValue): void {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.business-field-container {
  width: 100%;
}
</style>

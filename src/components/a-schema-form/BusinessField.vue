<template>
  <div class="business-field-container">
    <!-- 
      【分发器：插座】
      这里体现了声明式渲染。我们不写一堆 v-if，而是定义一个 componentMap。
      根据数据引擎计算出的 field.uiType，动态插入对应的组件。
    -->
    <component
      :is="componentMap[field.uiType]"
      v-bind="field.props"
      :field="field"
      :model-value="modelValue"
      :form-model="formModel"
      :option-provider="optionProvider"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { BusinessField, FieldValue, FormMode, FormModel, OptionProvider } from './types'
import FieldInput from './components/FieldInput.vue'
import FieldSelect from './components/FieldSelect.vue'
import FieldTree from './components/FieldTree.vue'
import FieldView from './components/FieldView.vue'

/**
 * 组件映射表：
 * 如果以后要增加新的 UI 类型（比如上传组件、富文本组件），只需要在这里注册即可。
 */
const componentMap = {
  input: FieldInput,
  select: FieldSelect,
  tree: FieldTree,
  view: FieldView
}

const props = defineProps<{
  field: BusinessField
  modelValue: FieldValue
  formModel: FormModel
  optionProvider?: OptionProvider
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

/**
 * 统一的值更新回调：
 * 子组件修改了值，通过这里向上抛给父组件的 reactive 状态。
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

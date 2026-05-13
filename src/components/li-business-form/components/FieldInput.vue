<template>
  <!-- 基础输入组件，处理 textInput, double, text, editor 等控件样式 -->
  <template v-if="field.controlStyle === 'double'">
    <a-input-number
      :value="modelValue"
      @update:value="onUpdate"
      :disabled="field.disabled"
      :placeholder="field.placeholder"
      class="field-input-number"
    />
  </template>

  <template v-else-if="field.controlStyle === 'text' || field.controlStyle === 'editor'">
    <a-textarea
      :value="modelValue"
      @update:value="onUpdate"
      :disabled="field.disabled"
      :placeholder="field.placeholder"
      :rows="field.controlStyle === 'editor' ? 6 : 3"
    />
  </template>

  <template v-else-if="field.controlStyle === 'date'">
    <a-date-picker
      :value="modelValue"
      @update:value="onUpdate"
      :disabled="field.disabled"
      :placeholder="field.placeholder"
      value-format="YYYY-MM-DD HH:mm:ss"
      class="field-date-picker"
    />
  </template>

  <template v-else-if="field.controlStyle === 'checkbox'">
    <a-switch
      :checked="!!modelValue"
      @update:checked="onUpdate"
      :disabled="field.disabled"
    />
  </template>

  <template v-else>
    <a-input
      :value="modelValue"
      @update:value="onUpdate"
      :disabled="field.disabled"
      :placeholder="field.placeholder"
    />
  </template>
</template>

<script setup lang="ts">
import type { BusinessField, FieldValue } from '../types'

/**
 * 定义组件属性
 * field: 归一化后的字段配置
 * modelValue: 表单值，使用 v-model 绑定
 */
const props = defineProps<{
  field: BusinessField
  modelValue: FieldValue
}>()

// 定义事件，用于实现 v-model 双向绑定
const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

/**
 * 统一处理值更新
 * @param val 更新后的值
 */
function onUpdate(val: any): void {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.field-input-number,
.field-date-picker {
  width: 100%;
}
</style>

<template>
  <div class="field-input">
    <!-- 
      【UI 组件：基础输入类】
      所有的基础属性（disabled, placeholder）都通过 v-bind="$attrs" 自动透传。
      这里不写逻辑判断，只负责根据 controlStyle 决定显示哪种 AntD 标签。
    -->
    <template v-if="field.controlStyle === 'double'">
      <a-input-number
        v-bind="$attrs"
        :value="modelValue"
        @update:value="onUpdate"
        class="w-full"
      />
    </template>

    <template v-else-if="field.controlStyle === 'text' || field.controlStyle === 'editor'">
      <a-textarea
        v-bind="$attrs"
        :value="modelValue"
        @update:value="onUpdate"
        :rows="field.controlStyle === 'editor' ? 6 : 3"
      />
    </template>

    <template v-else-if="field.controlStyle === 'date'">
      <a-date-picker
        v-bind="$attrs"
        :value="modelValue"
        @update:value="onUpdate"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="w-full"
      />
    </template>

    <template v-else-if="field.controlStyle === 'time'">
      <a-time-picker
        v-bind="$attrs"
        :value="modelValue"
        @update:value="onUpdate"
        value-format="HH:mm:ss"
        class="w-full"
      />
    </template>

    <template v-else-if="field.controlStyle === 'checkbox'">
      <a-switch
        v-bind="$attrs"
        :checked="!!modelValue"
        @update:checked="onUpdate"
      />
    </template>

    <template v-else>
      <a-input
        v-bind="$attrs"
        :value="modelValue"
        @update:value="onUpdate"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BusinessField, FieldValue } from '../types'

/**
 * 它不需要知道什么是业务逻辑，也不需要解析 constraintInfo。
 * 它只需要接收父组件传来的“指令”（Props）并执行。
 */
defineProps<{
  field: BusinessField
  modelValue: FieldValue
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

const onUpdate = (val: any): void => {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>

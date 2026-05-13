<template>
  <!-- 
    【UI 组件：浏览态专用】
    它的任务只有一个：把枯燥的数据（如 "1", "zs"）转换成好看的文字（如 "是", "张三"）。
  -->
  <div class="field-view">
    <template v-if="isEmpty">
      <span class="empty-placeholder">-</span>
    </template>
    <template v-else>
      {{ displayValue }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BusinessField, FieldOption, FieldValue } from '../types'

const props = defineProps<{
  field: BusinessField
  modelValue: FieldValue
}>()

const isEmpty = computed(() => {
  return props.modelValue === null || props.modelValue === undefined || props.modelValue === ''
})

/**
 * 核心逻辑：自动翻译
 * 它会遍历数据引擎准备好的 props.options，寻找匹配的 Label。
 */
const displayValue = computed(() => {
  if (isEmpty.value) return '-'

  // 1. 处理特殊的布尔开关
  if (props.field.controlStyle === 'checkbox') {
    return props.modelValue ? '是' : '否'
  }

  // 2. 处理带有字典/枚举的字段
  const options = props.field.props.options
  if (options && options.length > 0) {
    const findInTree = (list: FieldOption[], val: any): string | null => {
      for (const item of list) {
        if (item.value === val) return item.label
        if (item.children) {
          const found = findInTree(item.children, val)
          if (found) return found
        }
      }
      return null
    }
    // 自动寻找对应的 Label
    return findInTree(options, props.modelValue) || String(props.modelValue)
  }

  // 3. 普通文本直接输出
  return String(props.modelValue)
})
</script>

<style scoped>
.field-view {
  min-height: 32px;
  padding: 4px 0;
  font-size: 14px;
  color: #262626;
}
.empty-placeholder {
  color: #bfbfbf;
}
</style>

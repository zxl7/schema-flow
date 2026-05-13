<template>
  <!-- 浏览态展示组件：负责将 ID 或 Code 转换成人类可读的文字 -->
  <div class="field-view-text">
    <template v-if="isEmpty">
      <span class="is-empty">-</span>
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

// 判断值是否为空
const isEmpty = computed(() => {
  return props.modelValue === null || props.modelValue === undefined || props.modelValue === ''
})

/**
 * 计算展示文本
 * 如果是下拉/树形，尝试从 options 中寻找对应的 label
 */
const displayValue = computed(() => {
  if (isEmpty.value) return '-'

  // 处理布尔值
  if (props.field.controlStyle === 'checkbox') {
    return props.modelValue ? '是' : '否'
  }

  // 如果有选项列表，尝试进行“翻译”
  if (props.field.options && props.field.options.length > 0) {
    const findLabel = (opts: FieldOption[], val: any): string | null => {
      for (const opt of opts) {
        if (opt.value === val) return opt.label
        if (opt.children) {
          const childLabel = findLabel(opt.children, val)
          if (childLabel) return childLabel
        }
      }
      return null
    }

    const label = findLabel(props.field.options, props.modelValue)
    if (label) return label
  }

  // 默认原样输出
  return String(props.modelValue)
})
</script>

<style scoped>
.field-view-text {
  min-height: 32px;
  padding: 4px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.is-empty {
  color: #bfbfbf;
}
</style>

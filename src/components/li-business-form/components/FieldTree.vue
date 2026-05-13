<template>
  <!-- 树形选择组件 -->
  <a-tree-select
    :value="modelValue"
    @update:value="onUpdate"
    :disabled="field.disabled"
    :placeholder="field.placeholder"
    :tree-data="options"
    :loading="loading"
    :field-names="{ label: 'label', value: 'value', children: 'children' }"
    allow-clear
    tree-default-expand-all
    class="field-tree-select"
    @focus="handleFocus"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { BusinessField, FieldOption, FieldValue, FormModel, OptionProvider } from '../types'

const props = defineProps<{
  field: BusinessField
  modelValue: FieldValue
  formModel: FormModel
  optionProvider?: OptionProvider
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

const localOptions = ref<FieldOption[]>([])
const loading = ref(false)
const hasLoaded = ref(false)

const options = computed(() => {
  return localOptions.value.length > 0 ? localOptions.value : props.field.options
})

/**
 * 异步加载树形数据
 */
async function loadOptions(): Promise<void> {
  if (!props.optionProvider || props.field.optionSource === 'none') return
  
  loading.value = true
  try {
    localOptions.value = await props.optionProvider(props.field, props.formModel)
    hasLoaded.value = true
  } finally {
    loading.value = false
  }
}

function handleFocus(): void {
  if (!hasLoaded.value) {
    loadOptions()
  }
}

function onUpdate(val: any): void {
  emit('update:modelValue', val)
}

onMounted(() => {
  if (props.field.optionSource === 'mock') {
    loadOptions()
  }
})
</script>

<style scoped>
.field-tree-select {
  width: 100%;
}
</style>

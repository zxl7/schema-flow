<template>
  <!-- 
    【UI 组件：下拉/选人类】
    支持动态加载数据。
  -->
  <a-select
    v-bind="$attrs"
    :value="modelValue"
    @update:value="onUpdate"
    :options="currentOptions"
    :loading="loading"
    @focus="handleFocus"
    class="w-full"
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

// 本地维护一个选项列表，用于存储异步加载回来的数据
const localOptions = ref<FieldOption[]>([])
const loading = ref(false)
const hasLoaded = ref(false)

// 策略：如果异步加载了新选项，则显示新的；否则显示数据引擎预装载的静态选项。
const currentOptions = computed(() => {
  return localOptions.value.length > 0 ? localOptions.value : (props.field.props.options || [])
})

const loadOptions = async (): Promise<void> => {
  if (!props.optionProvider || props.field.logic.optionSource === 'none') return
  
  loading.value = true
  try {
    const res = await props.optionProvider(props.field, props.formModel)
    localOptions.value = res
    hasLoaded.value = true
  } catch (error) {
    console.error(`加载选项失败:`, error)
  } finally {
    loading.value = false
  }
}

/**
 * 聚焦加载
 */
const handleFocus = (): void => {
  if (!hasLoaded.value && props.field.logic.optionSource !== 'none') {
    loadOptions()
  }
}

const onUpdate = (val: any): void => {
  emit('update:modelValue', val)
}

onMounted(() => {
  // 如果存在初始值，且是远程数据源，则立即加载以解析 Label
  if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '' && props.field.logic.optionSource !== 'none') {
    loadOptions()
  }
})
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>

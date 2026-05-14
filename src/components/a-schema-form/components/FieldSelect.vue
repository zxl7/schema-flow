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

/**
 * 触发异步加载逻辑
 */
async function loadOptions(): Promise<void> {
  if (!props.optionProvider || props.field.logic.optionSource === 'none') return
  
  loading.value = true
  try {
    // 调用外部传入的 Provider（比如发起一个 API 请求）
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
 * 聚焦加载：只有在用户点击下拉框时，才去触发接口拉取数据（按需加载）。
 */
function handleFocus(): void {
  if (!hasLoaded.value && props.field.logic.optionSource !== 'none') {
    loadOptions()
  }
}

function onUpdate(val: any): void {
  emit('update:modelValue', val)
}

onMounted(() => {
  // 如果是 Mock 数据源，可以在初始化时就直接加载。
  if (props.field.logic.optionSource === 'mock') {
    loadOptions()
  }
})
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>

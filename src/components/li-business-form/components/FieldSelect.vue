<template>
  <!-- 下拉选择组件，处理 select, inputAndSelect, searchInput, user 等控件样式 -->
  <a-select
    :value="modelValue"
    @update:value="onUpdate"
    :disabled="field.disabled"
    :placeholder="field.placeholder"
    :options="options"
    :loading="loading"
    :show-search="isSearchable"
    :allow-clear="true"
    class="field-select"
    @focus="handleFocus"
  >
    <!-- 如果有特殊展示需求，可以在这里自定义 label -->
  </a-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { BusinessField, FieldOption, FieldValue, FormModel, OptionProvider } from '../types'

// 定义 Props 泛型接口
const props = defineProps<{
  field: BusinessField
  modelValue: FieldValue
  formModel: FormModel
  optionProvider?: OptionProvider
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

// 本地选项状态
const localOptions = ref<FieldOption[]>([])
const loading = ref(false)
const hasLoaded = ref(false)

// 计算最终使用的选项：优先使用异步加载的，其次使用字段配置自带的
const options = computed(() => {
  return localOptions.value.length > 0 ? localOptions.value : props.field.options
})

// 判断是否需要开启搜索功能
const isSearchable = computed(() => {
  const styles = ['inputAndSelect', 'searchInput', 'user']
  return styles.includes(props.field.controlStyle)
})

/**
 * 异步加载选项数据
 * 处理 URL 约束、字典翻译等业务逻辑
 */
async function loadOptions(): Promise<void> {
  if (!props.optionProvider || props.field.optionSource === 'none') return
  
  loading.value = true
  try {
    // 调用外部传入的加载器（例如从接口获取数据）
    localOptions.value = await props.optionProvider(props.field, props.formModel)
    hasLoaded.value = true
  } catch (error) {
    console.error(`加载字段 ${props.field.displayName} 选项失败:`, error)
  } finally {
    loading.value = false
  }
}

/**
 * 聚焦时如果未加载过数据，则触发加载
 */
function handleFocus(): void {
  if (!hasLoaded.value && props.field.optionSource !== 'none') {
    loadOptions()
  }
}

/**
 * 值的更新回调
 */
function onUpdate(val: any): void {
  emit('update:modelValue', val)
}

// 初始化时如果已经是 mock 数据源，可以提前加载
onMounted(() => {
  if (props.field.optionSource === 'mock') {
    loadOptions()
  }
})
</script>

<style scoped>
.field-select {
  width: 100%;
}
</style>

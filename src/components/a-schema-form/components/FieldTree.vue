<template>
  <a-tree-select
    v-bind="$attrs"
    :value="modelValue"
    @update:value="onUpdate"
    :tree-data="currentOptions"
    :loading="loading"
    :field-names="{ label: 'label', value: 'value', children: 'children' }"
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

const localOptions = ref<FieldOption[]>([])
const loading = ref(false)
const hasLoaded = ref(false)

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

const handleFocus = (): void => {
  if (!hasLoaded.value && props.field.logic.optionSource !== 'none') {
    loadOptions()
  }
}

const onUpdate = (val: any): void => {
  emit('update:modelValue', val)
}

onMounted(() => {
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

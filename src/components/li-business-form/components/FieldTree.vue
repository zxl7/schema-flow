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

async function loadOptions(): Promise<void> {
  if (!props.optionProvider || props.field.logic.optionSource === 'none') return
  
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

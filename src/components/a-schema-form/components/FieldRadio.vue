<template>
  <div class="field-radio">
    <a-radio-group
      v-bind="$attrs"
      :value="modelValue"
      @update:value="onUpdate"
      :disabled="loading"
    >
      <a-radio v-for="opt in currentOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </a-radio>
    </a-radio-group>
    <a-spin v-if="loading" size="small" style="margin-left: 8px" />
  </div>
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

const currentOptions = computed(() => {
  return localOptions.value.length > 0 ? localOptions.value : (props.field.props.options || [])
})

const loadOptions = async (): Promise<void> => {
  if (!props.optionProvider || props.field.logic.optionSource === 'none') return
  
  loading.value = true
  try {
    const res = await props.optionProvider(props.field, props.formModel)
    localOptions.value = res
  } catch (error) {
    console.error(`加载选项失败:`, error)
  } finally {
    loading.value = false
  }
}

const onUpdate = (val: any): void => {
  emit('update:modelValue', val)
}

onMounted(() => {
  // Radio/CheckboxGroup 通常在加载时就获取数据，而不是 Focus 时
  if (props.field.logic.optionSource !== 'none') {
    loadOptions()
  }
})
</script>

<style scoped>
.field-radio {
  display: flex;
  align-items: center;
}
</style>

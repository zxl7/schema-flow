<template>
  <a-slider
    v-bind="$attrs"
    :value="modelValue"
    @update:value="onUpdate"
  />
</template>

<script setup lang="ts">
import type { BusinessField, FieldValue } from '../types'

defineProps<{
  field: BusinessField
  modelValue: FieldValue
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FieldValue): void
}>()

function onUpdate(val: any) {
  emit('update:modelValue', val)
}
</script>

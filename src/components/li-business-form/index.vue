<template>
  <div class="li-business-form">
    <!-- 
      1. 头部插槽
      允许父组件自定义标题、操作按钮等。
      如果父组件不传，则默认不显示。
    -->
    <slot name="header" :title="title">
      <div v-if="title" class="li-business-form__header">
        <h2>{{ title }}</h2>
      </div>
    </slot>

    <!-- 
      2. 动态表单容器
    -->
    <a-form ref="formRef" class="li-business-form__form" layout="vertical" :model="formModel" :rules="rules">
      <section v-for="group in visibleGroups" :key="group.name" class="li-business-form__group">
        <h3>{{ group.name }}</h3>
        <div class="li-business-form__grid">
          <a-form-item
            v-for="field in group.fields"
            :key="field.attributeNum"
            :label="field.displayName"
            :name="field.attributeNum"
            :class="{ 'is-full': field.logic.formWidth === '100%' }"
          >
            <BusinessField
              v-model:model-value="formModel[field.attributeNum]"
              :field="field"
              :form-model="formModel"
              :option-provider="optionProvider"
            />
          </a-form-item>
        </div>
      </section>
    </a-form>

    <!-- 3. 底部插槽 -->
    <slot name="footer" :submit="submitForm" :reset="resetForm"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BusinessFieldGroup, FieldOption, FormMode, FormModel, OptionProvider, RawBusinessField } from './types'
import { createInitialModel, createSubmitValues, groupFields } from './utils'
import BusinessField from './BusinessField.vue'

/**
 * 业务表单容器组件 (Business Form Container)
 * 职责：负责表单生命周期管理、布局分发、状态同步及交互逻辑调度。
 */

type FormRule = { required?: boolean; message?: string; trigger?: string }

defineOptions({ name: 'LiBusinessForm' })

const props = withDefaults(
  defineProps<{
    title?: string
    fields: RawBusinessField[] 
    mode?: FormMode           
    initialValues?: FormModel 
    includeHiddenValues?: boolean
    optionProvider?: OptionProvider
    dictionaries?: Record<string, FieldOption[]> // 外部传入的字典数据
  }>(),
  {
    title: '',
    mode: 'create',
    includeHiddenValues: false,
    initialValues: () => ({}),
    dictionaries: () => ({}),
  }
)

const emit = defineEmits<{
  (event: 'submit', values: FormModel): void
  (event: 'change', values: FormModel): void
}>()

// 表单引用
const formRef = ref()

// 核心状态
const formModel = reactive<FormModel>({})

/**
 * 【数据计算流】
 */
const groups = computed(() => groupFields(props.fields, props.mode, props.dictionaries))

// 过滤掉不可见分组
const visibleGroups = computed(() => 
  groups.value.filter(g => g.fields.length > 0)
)

/**
 * 【动态校验规则】
 */
const rules = computed(() => {
  const result: Record<string, FormRule[]> = {}
  visibleGroups.value.forEach(g => {
    g.fields.forEach(f => {
      if (f.props.required) {
        result[f.attributeNum] = [{ required: true, message: `请输入${f.displayName}`, trigger: 'change' }]
      }
    })
  })
  return result
})

/**
 * 初始化表单数据
 */
function fillForm(groupsValue: BusinessFieldGroup[]): void {
  Object.keys(formModel).forEach(key => delete formModel[key])
  const base = createInitialModel(groupsValue)
  const final = { ...base, ...props.initialValues }
  Object.keys(final).forEach(key => (formModel[key] = final[key]))
}

function resetForm(): void {
  fillForm(groups.value)
}

/**
 * 提交逻辑：
 * 暴露给外部调用，也可以在 footer 插槽中使用。
 */
async function submitForm(): Promise<FormModel | undefined> {
  if (formRef.value) {
    try {
      await formRef.value.validate()
      const values = createSubmitValues(groups.value, formModel, props.includeHiddenValues)
      emit('submit', values)
      return values
    } catch (e) {
      console.warn('表单校验失败', e)
      throw e
    }
  }
}

watch(
  [groups, () => props.initialValues],
  ([nextGroups]) => fillForm(nextGroups),
  { immediate: true, deep: true }
)

watch(formModel, () => {
  emit('change', createSubmitValues(groups.value, formModel, props.includeHiddenValues))
}, { deep: true })

// 暴露方法
defineExpose({ resetForm, submitForm })
</script>

<style scoped>
.li-business-form {
  width: 100%;
  padding: 24px;
  background: #f7f9fb;
}
.li-business-form__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}
.li-business-form__header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}
.li-business-form__eyebrow {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}
.li-business-form__group {
  margin-bottom: 32px;
}
.li-business-form__group h3 {
  padding-bottom: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
}
.li-business-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 24px;
}
.is-full {
  grid-column: span 2;
}
@media (max-width: 640px) {
  .li-business-form__grid {
    grid-template-columns: 1fr;
  }
  .is-full {
    grid-column: span 1;
  }
}
</style>

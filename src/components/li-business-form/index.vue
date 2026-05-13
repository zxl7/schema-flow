<template>
  <!-- 主业务表单组件：负责布局、分组、校验和提交逻辑 -->
  <div class="li-business-form">
    <!-- 1. 头部操作区 -->
    <div class="li-business-form__header">
      <div>
        <p class="li-business-form__eyebrow">基础业务组件</p>
        <h2>{{ title }}</h2>
      </div>
      <a-space>
        <a-button @click="resetForm">重置</a-button>
        <a-button type="primary" @click="submitForm">提交</a-button>
      </a-space>
    </div>

    <!-- 2. 动态表单内容 -->
    <a-form ref="formRef" class="li-business-form__form" layout="vertical" :model="formModel" :rules="rules">
      <section v-for="group in visibleGroups" :key="group.name" class="li-business-form__group">
        <h3>{{ group.name }}</h3>
        <div class="li-business-form__grid">
          <a-form-item
            v-for="field in group.fields"
            :key="field.attributeNum"
            :label="field.displayName"
            :name="field.attributeNum"
            :class="{ 'is-full': field.formWidth === '100%' }"
          >
            <!-- 使用分发器组件处理具体的字段渲染 -->
            <BusinessField
              v-model:model-value="formModel[field.attributeNum]"
              :field="field"
              :mode="mode"
              :form-model="formModel"
              :option-provider="optionProvider"
            />
          </a-form-item>
        </div>
      </section>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BusinessFieldGroup, FormMode, FormModel, OptionProvider, RawBusinessField } from './types'
import { createInitialModel, createSubmitValues, groupFields } from './utils'
import BusinessField from './BusinessField.vue'

// 内部使用的校验规则类型
type FormRule = {
  required?: boolean
  message?: string
  trigger?: string
}

defineOptions({
  name: 'LiBusinessForm',
})

/**
 * 组件属性定义
 */
const props = withDefaults(
  defineProps<{
    title?: string
    fields: RawBusinessField[]
    mode?: FormMode
    initialValues?: FormModel
    includeHiddenValues?: boolean
    optionProvider?: OptionProvider
  }>(),
  {
    title: '动态业务表单',
    mode: 'create',
    includeHiddenValues: false,
    initialValues: () => ({}),
  }
)

/**
 * 事件定义
 */
const emit = defineEmits<{
  (event: 'submit', values: FormModel): void
  (event: 'change', values: FormModel): void
}>()

// 表单引用
const formRef = ref()

// 响应式表单数据
const formModel = reactive<FormModel>({})

/**
 * 计算字段分组数据
 */
const groups = computed(() => groupFields(props.fields, props.mode))

/**
 * 过滤掉隐藏的字段和空分组
 */
const visibleGroups = computed(() =>
  groups.value
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => !field.hidden),
    }))
    .filter((group) => group.fields.length > 0)
)

/**
 * 动态生成 Ant Design 表单校验规则
 */
const rules = computed<Record<string, FormRule[]>>(() => {
  const result: Record<string, FormRule[]> = {}

  visibleGroups.value.forEach((group) => {
    group.fields.forEach((field) => {
      if (field.required) {
        result[field.attributeNum] = [
          {
            required: true,
            message: `请输入${field.displayName}`,
            trigger: 'change',
          },
        ]
      }
    })
  })

  return result
})

/**
 * 填充表单初始值
 */
function fillForm(groupsValue: BusinessFieldGroup[]): void {
  // 清空当前 model
  Object.keys(formModel).forEach((key) => {
    delete formModel[key]
  })

  // 1. 先根据字段配置生成基础初始值（兜底）
  const baseModel = createInitialModel(groupsValue)
  
  // 2. 混合外部传入的初始值（如果有）
  const finalModel = {
    ...baseModel,
    ...props.initialValues
  }

  Object.keys(finalModel).forEach((key) => {
    formModel[key] = finalModel[key]
  })
}

/**
 * 获取提交时的数据
 */
function getValues(): FormModel {
  return createSubmitValues(groups.value, formModel, props.includeHiddenValues)
}

/**
 * 重置表单
 */
function resetForm(): void {
  fillForm(groups.value)
}

/**
 * 提交表单
 */
async function submitForm(): Promise<void> {
  if (formRef.value) {
    try {
      await formRef.value.validate()
      emit('submit', getValues())
    } catch (error) {
      console.warn('表单校验未通过:', error)
    }
  }
}

// 监听字段配置或初始值变化，重新初始化表单
watch(
  [groups, () => props.initialValues],
  ([nextGroups]) => {
    fillForm(nextGroups)
  },
  { immediate: true, deep: true }
)

// 监听表单数据变化，向外抛出 change 事件
watch(
  formModel,
  () => {
    emit('change', getValues())
  },
  { deep: true }
)

// 暴露给外部的方法
defineExpose({
  getValues,
  resetForm,
})
</script>

<style scoped>
.li-business-form {
  width: 100%;
  padding: 24px;
  color: #1f2937;
  background: #f7f9fb;
}

.li-business-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.li-business-form__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.li-business-form__header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.li-business-form__group {
  margin-bottom: 32px;
}

.li-business-form__group h3 {
  padding-bottom: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.li-business-form__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 24px;
}

.li-business-form__grid .ant-form-item {
  margin-bottom: 20px;
}

.li-business-form__grid .is-full {
  grid-column: span 2;
}

@media (max-width: 640px) {
  .li-business-form__grid {
    grid-template-columns: 1fr;
  }

  .li-business-form__grid .is-full {
    grid-column: span 1;
  }
}
</style>

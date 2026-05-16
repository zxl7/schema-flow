<template>
  <div class="a-schema-form">
    <div class="a-schema-form__container" :style="{ maxWidth: globalConfig?.maxWidth ? `${globalConfig.maxWidth}px` : '800px' }">
      <!-- 
        1. 头部插槽
      -->
      <slot name="header" :title="title">
        <div v-if="title" class="a-schema-form__header">
          <h2>{{ title }}</h2>
        </div>
      </slot>

      <!-- 
        2. 动态表单容器
      -->
      <a-form 
        ref="formRef" 
        class="a-schema-form__form" 
        :layout="globalConfig?.layout || 'vertical'" 
        :size="globalConfig?.size || 'middle'"
        :label-col="globalConfig?.layout === 'horizontal' ? (globalConfig?.labelCol || { style: { width: '120px' } }) : undefined"
        :model="formModel" 
        :rules="rules"
      >
        <section v-for="group in visibleGroups" :key="group.name" class="a-schema-form__group">
          <h3>{{ group.name }}</h3>
          <div class="a-schema-form__grid">
            <template v-for="field in group.fields" :key="field.attributeNum">
              <!-- 
                【作用域插槽：field-item】
                允许外部（如设计器）接管整个表单项的渲染（包含 Label 和容器）。
              -->
              <slot name="field-item" :field="field" :formModel="formModel">
                <a-form-item
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
              </slot>
            </template>
          </div>
        </section>
      </a-form>

      <!-- 3. 底部插槽 -->
      <slot name="footer" :submit="submitForm" :reset="resetForm"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BusinessFieldGroup, FieldOption, FieldValue, FormMode, FormModel, OptionProvider, RawBusinessField, FormGlobalConfig } from './types'
import { createInitialModel, createSubmitValues, groupFields } from './utils'
import BusinessField from './BusinessField.vue'

/**
 * 业务表单容器组件 (Business Form Container)
 * 职责：负责表单生命周期管理、布局分发、状态同步及交互逻辑调度。
 */

type FormRule = { required?: boolean; message?: string; trigger?: string }

defineOptions({ name: 'ASchemaForm' })

const props = withDefaults(
  defineProps<{
    title?: string
    fields: RawBusinessField[] 
    mode?: FormMode           
    initialValues?: FormModel 
    includeHiddenValues?: boolean
    optionProvider?: OptionProvider
    dictionaries?: Record<string, FieldOption[]> // 外部传入的字典数据
    forceShowAll?: boolean // 是否强制显示所有字段（设计器使用）
    globalConfig?: FormGlobalConfig // 全局表单配置
  }>(),
  {
    title: '',
    mode: 'create',
    includeHiddenValues: false,
    initialValues: () => ({}),
    dictionaries: () => ({}),
    forceShowAll: false,
    globalConfig: () => ({
      layout: 'vertical',
      size: 'middle',
      labelCol: { style: { width: 120 } },
      maxWidth: 800
    })
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
const previousSchemaDefaults = ref<Record<string, FieldValue>>({})

/**
 * 计算字段的动态表达式 (目前支持控制 hidden 属性)
 * @param expression JS 表达式，例如 `$form.status === '1'`
 * @param formModel 当前表单数据
 */
const evaluateExpression = (expression: string | null | undefined, formModel: FormModel): boolean => {
  if (!expression) return false
  try {
    // 构造一个沙箱函数执行表达式，传入 $form 变量
    const fn = new Function('$form', `return !!(${expression})`)
    return fn(formModel)
  } catch (e) {
    console.warn(`[ASchemaForm] 表达式执行失败: ${expression}`, e)
    return false
  }
}

/**
 * 【数据计算流】
 * 依赖于 fields, mode, dictionaries, forceShowAll 以及 formModel 的变化
 */
const groups = computed(() => {
  // 1. 基础归一化和分组
  const baseGroups = groupFields(props.fields, props.mode, props.dictionaries, props.forceShowAll)
  
  // 2. 执行动态联动逻辑，生成全新的字段对象，避免在 computed 中进行 Mutation
  return baseGroups.map(group => ({
    ...group,
    fields: group.fields.map(field => {
      if (field.logic.expression) {
        const isVisible = evaluateExpression(field.logic.expression, formModel)
        return {
          ...field,
          logic: {
            ...field.logic,
            hidden: !isVisible
          }
        }
      }
      return field
    })
  }))
})

// 过滤掉不可见分组
const visibleGroups = computed(() => {
  if (props.forceShowAll) {
    // 设计模式下（forceShowAll=true），展示所有分组，不因为隐藏逻辑而过滤掉分组
    return groups.value.filter(g => g.fields.length > 0)
  }
  return groups.value
    .map(g => ({
      ...g,
      // 在运行模式下，过滤掉 logic.hidden 为 true 的字段
      fields: g.fields.filter(f => !f.logic.hidden)
    }))
    .filter(g => g.fields.length > 0)
})

/**
 * 【动态校验规则】
 */
const rules = computed(() => {
  const result: Record<string, FormRule[]> = {}
  visibleGroups.value.forEach(g => {
    g.fields.forEach(f => {
      // 只有在字段未隐藏的情况下才应用必填校验
      if (f.props.required && !f.logic.hidden) {
        result[f.attributeNum] = [{ required: true, message: `请输入${f.displayName}`, trigger: 'change' }]
      }
    })
  })
  return result
})

/**
 * 初始化表单数据
 */
const fillForm = (groupsValue: BusinessFieldGroup[]): void => {
  const base = createInitialModel(groupsValue)
  const final = { ...base, ...props.initialValues }
  const nextKeys = new Set(Object.keys(final))

  // 清理已经不在 schema 中的旧字段，确保 attributeNum 等配置变更后模型同步更新。
  Object.keys(formModel).forEach(key => {
    if (!nextKeys.has(key)) {
      delete formModel[key]
    }
  })

  Object.entries(final).forEach(([key, nextValue]) => {
    const hasCurrentValue = Object.prototype.hasOwnProperty.call(formModel, key)
    const previousDefaultValue = previousSchemaDefaults.value[key]

    // 如果字段是新增的，直接应用默认值。
    if (!hasCurrentValue) {
      formModel[key] = nextValue
      return
    }

    // 只有当前值仍等于“旧 schema 默认值”时，才跟随 schema 新默认值更新，
    // 避免覆盖用户已经手动输入过的数据。
    if (formModel[key] === previousDefaultValue && nextValue !== previousDefaultValue) {
      formModel[key] = nextValue
    }
  })

  previousSchemaDefaults.value = final
}

const resetForm = (): void => {
  Object.keys(formModel).forEach(key => delete formModel[key])
  fillForm(groups.value)
}

/**
 * 提交逻辑：
 * 暴露给外部调用，也可以在 footer 插槽中使用。
 */
const submitForm = async (): Promise<FormModel | undefined> => {
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
  [() => props.fields, () => props.mode, () => props.initialValues, () => props.forceShowAll],
  () => {
    // 强制触发一次 groups 重新计算所需的重置操作，或者让 fillForm 处理
    fillForm(groups.value)
  },
  { immediate: true, deep: true }
)

watch(formModel, () => {
  emit('change', createSubmitValues(groups.value, formModel, props.includeHiddenValues))
}, { deep: true })

// 暴露方法
defineExpose({ resetForm, submitForm })
</script>

<style scoped>
.a-schema-form {
  width: 100%;
  padding: 24px;
  background: #f7f9fb;
  display: flex;
  justify-content: center; /* 居中显示 */
}
.a-schema-form__container {
  width: 100%;
  /* max-width 由行内样式动态控制 */
  background: #ffffff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: max-width 0.3s ease;
}
.a-schema-form__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
}
.a-schema-form__header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}
.a-schema-form__group {
  margin-bottom: 40px;
}
.a-schema-form__group h3 {
  padding-bottom: 12px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
  color: #1f2937;
}
.a-schema-form__grid {
  display: grid;
  grid-template-columns: 1fr; /* 改为单列显示 */
  gap: 8px 0;
}
.is-full {
  grid-column: span 1;
}
@media (max-width: 640px) {
  .a-schema-form__container {
    padding: 20px;
  }
}
</style>

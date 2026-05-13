<template>
  <div class="li-business-form">
    <!-- 1. 头部标题与全局操作 -->
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

    <!-- 
      2. 动态表单容器
      这里使用了 Ant Design Vue 的 Form 组件。
      model 绑定了我们响应式的 formModel，rules 则是动态计算出来的。
    -->
    <a-form ref="formRef" class="li-business-form__form" layout="vertical" :model="formModel" :rules="rules">
      <!-- 遍历业务分组（如：基本属性、扩展属性） -->
      <section v-for="group in visibleGroups" :key="group.name" class="li-business-form__group">
        <h3>{{ group.name }}</h3>
        <div class="li-business-form__grid">
          <!-- 遍历组内字段 -->
          <a-form-item
            v-for="field in group.fields"
            :key="field.attributeNum"
            :label="field.displayName"
            :name="field.attributeNum"
            :class="{ 'is-full': field.logic.formWidth === '100%' }"
          >
            <!-- 
              【核心分发】
              将归一化后的 field 对象传给分发器，分发器决定渲染哪个具体组件。
            -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BusinessFieldGroup, FormMode, FormModel, OptionProvider, RawBusinessField } from './types'
import { createInitialModel, createSubmitValues, groupFields } from './utils'
import BusinessField from './BusinessField.vue'

/**
 * 【组件架构：外壳】
 * 这个文件负责整体的布局、表单校验、以及与父组件的通信。
 */

type FormRule = { required?: boolean; message?: string; trigger?: string }

defineOptions({ name: 'LiBusinessForm' })

const props = withDefaults(
  defineProps<{
    title?: string
    fields: RawBusinessField[] // 接收 demo.json 的原始数组
    mode?: FormMode           // 模式：create | edit | view
    initialValues?: FormModel // 外部传入的回显数据
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

const emit = defineEmits<{
  (event: 'submit', values: FormModel): void
  (event: 'change', values: FormModel): void
}>()

// 表单引用，用于触发表单校验方法
const formRef = ref()

// 核心状态：存放用户当前在界面上输入的所有值
const formModel = reactive<FormModel>({})

/**
 * 【数据计算流】
 * 通过 computed 监听原始 fields 的变化。
 * 只要 demo.json 或模式改变，数据引擎就会重新运行，生成全新的渲染分组。
 */
const groups = computed(() => groupFields(props.fields, props.mode))

// 过滤掉不可见分组
const visibleGroups = computed(() => 
  groups.value.filter(g => g.fields.length > 0)
)

/**
 * 【动态校验规则】
 * 根据数据引擎计算出的 field.props.required，自动生成 AntD 需要的校验规则。
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
 * 初始化表单数据：
 * 融合了字段默认值和外部传入的回显值。
 */
function fillForm(groupsValue: BusinessFieldGroup[]): void {
  // 1. 先清空旧数据
  Object.keys(formModel).forEach(key => delete formModel[key])
  
  // 2. 获取配置中的默认值
  const base = createInitialModel(groupsValue)
  
  // 3. 混合回显数据
  const final = { ...base, ...props.initialValues }
  
  // 4. 写入响应式对象
  Object.keys(final).forEach(key => (formModel[key] = final[key]))
}

function resetForm(): void {
  fillForm(groups.value)
}

/**
 * 提交逻辑：
 * 先执行表单校验，校验通过后再向外抛出数据。
 */
async function submitForm(): Promise<void> {
  if (formRef.value) {
    try {
      await formRef.value.validate()
      // 调用工具函数，过滤掉不需要提交的字段（如隐藏字段）
      emit('submit', createSubmitValues(groups.value, formModel, props.includeHiddenValues))
    } catch (e) {
      console.warn('表单校验失败，请检查输入', e)
    }
  }
}

// 深度监听配置变化：一旦 demo.json 或初始值变了，就重置表单。
watch(
  [groups, () => props.initialValues],
  ([nextGroups]) => fillForm(nextGroups),
  { immediate: true, deep: true }
)

// 实时向父组件抛出数据变化事件
watch(formModel, () => {
  emit('change', createSubmitValues(groups.value, formModel, props.includeHiddenValues))
}, { deep: true })

// 暴露给父组件调用的方法（通过 ref 访问）
defineExpose({ resetForm })
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

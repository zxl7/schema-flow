<template>
  <div class="li-business-form">
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
            <a-input
              v-if="field.controlStyle === 'textInput'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
            />

            <a-select
              v-else-if="field.controlStyle === 'select'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              allow-clear
            >
              <a-select-option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </a-select-option>
            </a-select>

            <a-select
              v-else-if="field.controlStyle === 'inputAndSelect' || field.controlStyle === 'searchInput' || field.controlStyle === 'user'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              allow-clear
              show-search
            >
              <a-select-option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </a-select-option>
            </a-select>

            <a-tree-select
              v-else-if="field.controlStyle === 'tree'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :tree-data="field.options"
              :replace-fields="{ title: 'label', value: 'value', children: 'children' }"
              allow-clear
              tree-default-expand-all
            />

            <a-input-number
              v-else-if="field.controlStyle === 'double'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              class="li-business-form__number"
            />

            <a-textarea
              v-else-if="field.controlStyle === 'text' || field.controlStyle === 'editor'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :rows="field.controlStyle === 'editor' ? 6 : 3"
            />

            <a-date-picker
              v-else-if="field.controlStyle === 'date'"
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="li-business-form__date"
            />

            <a-switch
              v-else-if="field.controlStyle === 'checkbox'"
              v-model:checked="formModel[field.attributeNum]"
              :disabled="field.disabled"
            />

            <a-input
              v-else
              v-model:value="formModel[field.attributeNum]"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
            />
          </a-form-item>
        </div>
      </section>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BusinessFieldGroup, FormMode, FormModel, RawBusinessField } from './types'
import { createInitialModel, groupFields } from './utils'

type FormRule = {
  required?: boolean
  message?: string
  trigger?: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    fields: RawBusinessField[]
    mode?: FormMode
  }>(),
  {
    title: '动态业务表单',
    mode: 'create',
  }
)

const emit = defineEmits<{
  (event: 'submit', values: FormModel): void
  (event: 'change', values: FormModel): void
}>()

// 保存 Ant Design Vue 表单实例，用于提交前主动触发表单校验。
const formRef = ref()

// formModel 是真正和所有控件 v-model 绑定的响应式表单数据。
const formModel = reactive<FormModel>({})

// 第一步：把原始 demo.json 字段转换成“组件更容易渲染”的分组字段。
const groups = computed(() => groupFields(props.fields, props.mode))

// 第二步：模板只渲染未隐藏字段，隐藏逻辑集中在数据层处理。
const visibleGroups = computed(() =>
  groups.value
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => !field.hidden),
    }))
    .filter((group) => group.fields.length > 0)
)

// 第三步：根据 required 约束生成 Ant Design Vue 表单规则。
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

function fillForm(groupsValue: BusinessFieldGroup[]): void {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key]
  })

  const nextModel = createInitialModel(groupsValue)
  Object.keys(nextModel).forEach((key) => {
    formModel[key] = nextModel[key]
  })
}

function getValues(): FormModel {
  return { ...formModel }
}

function resetForm(): void {
  fillForm(groups.value)
}

async function submitForm(): Promise<void> {
  if (formRef.value) {
    await formRef.value.validate()
  }

  emit('submit', getValues())
}

watch(
  groups,
  (nextGroups) => {
    fillForm(nextGroups)
  },
  { immediate: true }
)

// 每次表单变化都把当前值抛给父组件，方便做右侧 JSON 预览或外部联动。
watch(
  formModel,
  () => {
    emit('change', getValues())
  },
  { deep: true }
)

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
  margin-bottom: 16px;
}

.li-business-form__eyebrow {
  margin: 0 0 4px;
  color: #6b7280;
  font-size: 13px;
}

.li-business-form__header h2,
.li-business-form__group h3 {
  margin: 0;
  color: #111827;
  font-weight: 600;
}

.li-business-form__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.li-business-form__group {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.li-business-form__group h3 {
  margin-bottom: 16px;
  font-size: 16px;
}

.li-business-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  column-gap: 20px;
}

.li-business-form__grid :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.li-business-form__grid .is-full {
  grid-column: 1 / -1;
}

.li-business-form__number,
.li-business-form__date {
  width: 100%;
}

@media (max-width: 720px) {
  .li-business-form {
    padding: 16px;
  }

  .li-business-form__header {
    align-items: stretch;
    flex-direction: column;
  }

  .li-business-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>

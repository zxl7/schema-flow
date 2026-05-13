import type {
  BusinessField,
  BusinessFieldGroup,
  FieldValue,
  FieldOption,
  FormMode,
  RawBusinessField,
  RawConstraint,
} from './types'

const stateKeyMap: Record<FormMode, 'createState' | 'editState' | 'viewState'> = {
  create: 'createState',
  edit: 'editState',
  view: 'viewState',
}

// 第一版先用本地 mock 字典，让组件学习重点放在“动态渲染”本身。
const mockDictionaries: Record<string, FieldOption[]> = {
  boolDictionary: [
    { label: '是', value: '1' },
    { label: '否', value: '0' },
  ],
  isAuxiliary: [
    { label: '是', value: '1' },
    { label: '否', value: '0' },
  ],
  processCheckType: [
    { label: '自检', value: 'self' },
    { label: '专检', value: 'special' },
    { label: '巡检', value: 'patrol' },
  ],
}

export function parseConstraints(constraintInfo?: string | null): Record<string, RawConstraint> {
  if (!constraintInfo) return {}

  try {
    const list = JSON.parse(constraintInfo) as RawConstraint[]
    return list.reduce<Record<string, RawConstraint>>((result, item) => {
      if (item.key) {
        result[item.key] = item
      }
      return result
    }, {})
  } catch (error) {
    console.warn('constraintInfo 解析失败：', constraintInfo, error)
    return {}
  }
}

// 把 enum、dict_translate、tree、user 等不同来源先统一成 options。
function buildOptions(field: RawBusinessField, constraints: Record<string, RawConstraint>): FieldOption[] {
  if (constraints.enum?.value) {
    return String(constraints.enum.value)
      .split('||')
      .filter(Boolean)
      .map((item) => ({ label: item, value: item }))
  }

  if (constraints.dict_translate?.value) {
    return mockDictionaries[String(constraints.dict_translate.value)] || []
  }

  if (field.controlStyle === 'tree') {
    return [
      {
        label: '制造中心',
        value: 'manufacturing',
        children: [
          { label: '一车间', value: 'workshop-1' },
          { label: '二车间', value: 'workshop-2' },
        ],
      },
    ]
  }

  if (field.controlStyle === 'user') {
    return [
      { label: '张三', value: 'zhangsan' },
      { label: '李四', value: 'lisi' },
    ]
  }

  if (field.controlStyle === 'inputAndSelect' || field.controlStyle === 'searchInput') {
    return [
      { label: `${field.displayName}示例一`, value: 'demo-1' },
      { label: `${field.displayName}示例二`, value: 'demo-2' },
    ]
  }

  return []
}

// 根据约束生成初始值，后续可以继续扩展 pass_value、Time/User 等业务规则。
function getDefaultValue(field: RawBusinessField, constraints: Record<string, RawConstraint>): FieldValue {
  if (constraints.default_value) {
    return constraints.default_value.value
  }

  if (field.controlStyle === 'checkbox') {
    return false
  }

  return null
}

// placeholder 属于展示逻辑，统一在字段归一化阶段生成，模板里就不用写复杂判断。
function getPlaceholder(field: RawBusinessField, constraints: Record<string, RawConstraint>): string {
  if (constraints.lengthNum?.value) {
    return `${field.displayName}长度不超过${constraints.lengthNum.value}`
  }

  if (constraints.auto_code?.value === 1) {
    return '自动生成'
  }

  return `请输入${field.displayName}`
}

// 单个字段归一化：把原始配置转换成模板可直接消费的数据。
export function normalizeField(field: RawBusinessField, mode: FormMode): BusinessField {
  const constraints = parseConstraints(field.constraintInfo)
  const stateKey = stateKeyMap[mode]
  const state = field[stateKey]
  const disabled = mode === 'view' || state === 'R' || constraints.auto_code?.value === 1

  return {
    ...field,
    constraints,
    options: buildOptions(field, constraints),
    hidden: state === 'hidden',
    disabled,
    required: constraints.required?.value === 1,
    placeholder: getPlaceholder(field, constraints),
    formWidth: field.widthProportion || (field.controlStyle === 'text' || field.controlStyle === 'editor' ? '100%' : '50%'),
  }
}

// 按 groupTag 分组，形成页面上的业务分区。
export function groupFields(fields: RawBusinessField[], mode: FormMode): BusinessFieldGroup[] {
  const groups = fields
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .reduce<Record<string, BusinessField[]>>((result, field) => {
      const groupName = field.groupTag || '基础信息'
      const normalizedField = normalizeField(field, mode)

      if (!result[groupName]) {
        result[groupName] = []
      }

      result[groupName].push(normalizedField)
      return result
    }, {})

  return Object.keys(groups).map((name) => ({
    name,
    fields: groups[name],
  }))
}

// 生成表单 model 的初始结构，确保每个字段都有一个可响应的 key。
export function createInitialModel(groups: BusinessFieldGroup[]): Record<string, FieldValue> {
  return groups.reduce<Record<string, FieldValue>>((model, group) => {
    group.fields.forEach((field) => {
      model[field.attributeNum] = getDefaultValue(field, field.constraints)
    })
    return model
  }, {})
}

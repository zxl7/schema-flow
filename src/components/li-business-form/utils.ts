// import type 是一种优化写法，告诉编译器这些导入仅用于类型检查，在最终编译出的 JS 中会被完全移除。
import type {
  BusinessField,
  BusinessFieldGroup,
  FieldValue,
  FieldOption,
  FormMode,
  RawBusinessField,
  RawConstraint,
  UrlConstraint,
} from './types'

// 这里的 Record<FormMode, ...> 确保了 stateKeyMap 必须包含 FormMode 中定义的所有 key（create, edit, view）。
const stateKeyMap: Record<FormMode, 'createState' | 'editState' | 'viewState'> = {
  create: 'createState',
  edit: 'editState',
  view: 'viewState',
}

// 定义一个键为 string，值为 FieldOption 数组的对象。
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
  QualificationType: [
    { label: '焊接', value: 'welding' },
    { label: '装配', value: 'assembly' },
  ],
  specialMarking: [
    { label: '普通', value: 'normal' },
    { label: '特殊', value: 'special' },
  ],
  handoverType: [
    { label: '顺序交接', value: 'sequence' },
    { label: '并行交接', value: 'parallel' },
  ],
}

/**
 * 解析约束字符串
 * @param constraintInfo 可选参数，类型为 string 或 null
 * @returns 返回一个对象，key 是字符串，value 是 RawConstraint 接口类型
 */
export function parseConstraints(constraintInfo?: string | null): Record<string, RawConstraint> {
  if (!constraintInfo) return {}

  try {
    // as RawConstraint[] 叫做“类型断言 (Type Assertion)”。
    // 因为 JSON.parse 返回的是 any 类型，我们明确告诉 TS 这里它就是一个 RawConstraint 数组。
    const list = JSON.parse(constraintInfo) as RawConstraint[]

    // reduce 后面跟着 <Record<string, RawConstraint>> 是“泛型 (Generics)”。
    // 它告诉 reduce 函数，最终累加的结果 result 应该是这个指定的 Record 类型。
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

/**
 * 解析 URL 约束
 * @returns 返回 UrlConstraint 结构或 undefined
 */
export function parseUrlConstraint(value?: string | number | boolean): UrlConstraint | undefined {
  // typeof 是 JS 原生操作符，但在 TS 中它也能帮助编译器缩小变量的类型范围。
  if (!value || typeof value !== 'string') return undefined

  // 解构赋值，并带有默认值（如果 split 结果不足两个，则 left 或 right 为空字符串）。
  const [left = '', right = ''] = value.split(' / ')
  const [url = '', paramsText = ''] = left.split('?')
  const [valueKey, labelKey] = right.split('&').map((item) => item.trim()).filter(Boolean)
  const params = paramsText
    .split('&')
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    raw: value,
    url: url.trim(),
    params,
    valueKey,
    labelKey,
  }
}

// BusinessField['optionSource'] 这种语法叫“索引访问类型 (Indexed Access Types)”。
// 它直接获取 BusinessField 接口中 optionSource 属性的类型。
function getOptionSource(field: RawBusinessField, constraints: Record<string, RawConstraint>): BusinessField['optionSource'] {
  if (constraints.enum) return 'enum'
  if (constraints.dict_translate) return 'dict'
  if (constraints.url) return 'url'
  if (field.controlStyle === 'tree' || field.controlStyle === 'user') return 'mock'
  if (field.controlStyle === 'inputAndSelect' || field.controlStyle === 'searchInput') return 'mock'
  return 'none'
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

function getValueType(field: RawBusinessField): BusinessField['valueType'] {
  if (field.controlStyle === 'double' || field.dataType === 'Double') return 'number'
  if (field.controlStyle === 'checkbox') return 'boolean'
  if (field.controlStyle === 'date' || field.dataType === 'Date') return 'date'
  if (field.controlStyle === 'select' || field.controlStyle === 'tree' || field.controlStyle === 'user') return 'string'
  if (field.controlStyle === 'textInput' || field.controlStyle === 'text' || field.controlStyle === 'editor') return 'string'
  return 'unknown'
}

function getFieldWidth(field: RawBusinessField): string {
  if (field.widthProportion) return field.widthProportion
  if (field.controlStyle === 'text' || field.controlStyle === 'editor') return '100%'
  return '50%'
}

// 单个字段归一化：把原始配置转换成模板可直接消费的数据。
export function normalizeField(field: RawBusinessField, mode: FormMode): BusinessField {
  const constraints = parseConstraints(field.constraintInfo)
  const stateKey = stateKeyMap[mode]
  const state = field[stateKey]
  const disabled = mode === 'view' || state === 'R' || constraints.auto_code?.value === 1
  const defaultValue = getDefaultValue(field, constraints)

  return {
    ...field,
    constraints,
    options: buildOptions(field, constraints),
    optionSource: getOptionSource(field, constraints),
    urlConstraint: parseUrlConstraint(constraints.url?.value),
    translateKey: constraints.translate?.value ? String(constraints.translate.value) : undefined,
    defaultValue,
    hidden: state === 'hidden',
    disabled,
    required: constraints.required?.value === 1,
    placeholder: getPlaceholder(field, constraints),
    formWidth: getFieldWidth(field),
    valueType: getValueType(field),
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
      model[field.attributeNum] = field.defaultValue
    })
    return model
  }, {})
}

export function createSubmitValues(groups: BusinessFieldGroup[], formModel: Record<string, FieldValue>, includeHidden = false): Record<string, FieldValue> {
  return groups.reduce<Record<string, FieldValue>>((values, group) => {
    group.fields.forEach((field) => {
      if (!includeHidden && field.hidden) return

      values[field.attributeNum] = formModel[field.attributeNum] ?? null
    })
    return values
  }, {})
}

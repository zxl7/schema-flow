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

/**
 * 数据引擎层 (Data Engine Layer)
 * 核心原则：领域模型与视图模型解耦 (Domain-View Decoupling)
 * 职责：将后端原始领域数据 (RawBusinessField) 转换为 UI 驱动的视图模型 (BusinessField)。
 */

// 状态映射表：将当前的表单模式（新增/编辑/预览）映射到 JSON 中对应的状态字段名。
const stateKeyMap: Record<FormMode, 'createState' | 'editState' | 'viewState'> = {
  create: 'createState',
  edit: 'editState',
  view: 'viewState',
}

/**
 * 【处理阶段 1：约束解析】
 * 将字符串格式的 JSON 约束（如 "[{"key":"required","value":1}]"）转换成对象格式。
 */
const parseConstraints = (raw: string | null | undefined): Record<string, RawConstraint> => {
  if (!raw) return {}
  try {
    const list = JSON.parse(raw) as RawConstraint[]
    return list.reduce((acc, item) => ({ ...acc, [item.key]: item }), {})
  } catch {
    return {}
  }
}

/**
 * 【处理阶段 2：URL 约束解析】
 * 专门解析特殊的 URL 字符串，拆解出请求地址、参数名、Label 字段名等。
 */
const parseUrlConstraint = (value: any): UrlConstraint | undefined => {
  if (typeof value !== 'string' || !value.includes('/')) return undefined
  const [urlPart, keyPart] = value.split(' / ')
  const [url, params] = urlPart.split('?')
  const [valueKey, labelKey] = (keyPart || '').split('&').map(s => s.trim())
  return {
    raw: value,
    url: url.trim(),
    params: params ? params.split('&') : [],
    valueKey,
    labelKey,
  }
}

/**
 * 【核心处理：数据归一化 (Normalization)】
 * 这是一个“纯函数”，它把 RawBusinessField 变成 BusinessField。
 * 
 * @param raw - 后端原始领域数据
 * @param mode - 当前表单模式
 * @param dictionaries - 外部传入的字典库
 * @returns 归一化后的视图模型
 */
export const normalizeField = (
  raw: RawBusinessField, 
  mode: FormMode, 
  dictionaries: Record<string, FieldOption[]> = {}
): BusinessField => {
  // 1. 获取该模式下的基础数据
  const constraints = parseConstraints(raw.constraintInfo)
  const state = raw[stateKeyMap[mode]]
  
  /**
   * 2. 计算【逻辑包 logic】
   */
  const logic: BusinessField['logic'] = {
    hidden: state === 'hidden',
    formWidth: raw.widthProportion || (['text', 'editor'].includes(raw.controlStyle) ? '100%' : '50%'),
    defaultValue: constraints.default_value?.value ?? (raw.controlStyle === 'checkbox' ? false : null),
    optionSource: constraints.url ? 'url' : constraints.dict_translate ? 'dict' : constraints.enum ? 'enum' : (['tree', 'user'].includes(raw.controlStyle) ? 'mock' : 'none'),
    urlConstraint: parseUrlConstraint(constraints.url?.value),
    translateKey: constraints.translate?.value as string,
    valueType: (['double'].includes(raw.controlStyle) || raw.dataType === 'Double') ? 'number' : 'string',
  }

  /**
   * 3. 计算【UI 属性包 props】
   */
  const props: BusinessField['props'] = {
    disabled: mode === 'view' || state === 'R' || constraints.auto_code?.value === 1,
    required: constraints.required?.value === 1,
    placeholder: constraints.auto_code?.value === 1 ? '自动生成' : `请输入${raw.displayName}`,
    options: buildDefaultOptions(raw, constraints, dictionaries), // 注入字典库
    allowClear: true,
    showSearch: ['inputAndSelect', 'searchInput', 'user'].includes(raw.controlStyle),
  }

  /**
   * 4. 决定【UI 组件类型 uiType】
   */
  let uiType: BusinessField['uiType'] = 'input'
  if (mode === 'view') {
    uiType = 'view'
  } else if (['select', 'inputAndSelect', 'searchInput', 'user'].includes(raw.controlStyle)) {
    uiType = 'select'
  } else if (raw.controlStyle === 'tree') {
    uiType = 'tree'
  } else if (raw.controlStyle === 'radio') {
    uiType = 'radio'
  } else if (raw.controlStyle === 'checkboxGroup') {
    uiType = 'checkboxGroup'
  } else if (raw.controlStyle === 'rate') {
    uiType = 'rate'
  } else if (raw.controlStyle === 'slider') {
    uiType = 'slider'
  }

  return { ...raw, uiType, props, logic }
}

/**
 * 辅助逻辑：根据约束构建初始的选项列表（针对枚举和字典）。
 * 
 * @param raw - 原始字段
 * @param constraints - 已解析的约束 Map
 * @param dictionaries - 外部字典数据源
 */
const buildDefaultOptions = (
  raw: RawBusinessField, 
  constraints: Record<string, RawConstraint>,
  dictionaries: Record<string, FieldOption[]>
): FieldOption[] => {
  if (constraints.enum?.value) {
    return String(constraints.enum.value).split('||').map(v => ({ label: v, value: v }))
  }
  if (constraints.dict_translate?.value) {
    return dictionaries[String(constraints.dict_translate.value)] || []
  }
  
  // 模拟组模拟数据
  if (raw.controlStyle === 'radio' || raw.controlStyle === 'checkboxGroup') {
    return [
      { label: '选项一', value: 'opt1' },
      { label: '选项二', value: 'opt2' },
      { label: '选项三', value: 'opt3' }
    ]
  }
  
  return []
}

/**
 * 【分组加工】
 * 
 * @param fields - 原始字段数组
 * @param mode - 模式
 * @param dictionaries - 字典库
 */
export const groupFields = (
  fields: RawBusinessField[], 
  mode: FormMode,
  dictionaries: Record<string, FieldOption[]> = {}
): BusinessFieldGroup[] => {
  const groups: Record<string, BusinessField[]> = {}
  
  fields.forEach(f => {
    const field = normalizeField(f, mode, dictionaries)
    if (field.logic.hidden) return 
    
    const tag = field.groupTag || '基础信息'
    if (!groups[tag]) groups[tag] = []
    groups[tag].push(field)
  })

  return Object.entries(groups).map(([name, fields]) => ({
    name,
    fields: fields.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  }))
}

/**
 * 【表单 Model 初始化】
 * 根据字段配置，快速生成一个符合响应式的表单数据对象。
 */
export const createInitialModel = (groups: BusinessFieldGroup[]): Record<string, any> => {
  const model: Record<string, any> = {}
  groups.forEach(g => g.fields.forEach(f => {
    model[f.attributeNum] = f.logic.defaultValue
  }))
  return model
}

/**
 * 【结果提取】
 * 提交时调用，根据是否包含隐藏字段的需求，从响应式 Model 中提取出最终要发给后端的键值对。
 */
export const createSubmitValues = (groups: BusinessFieldGroup[], model: Record<string, any>, includeHidden = false): Record<string, any> => {
  const result: Record<string, any> = {}
  groups.forEach(g => g.fields.forEach(f => {
    if (!includeHidden && f.logic.hidden) return
    result[f.attributeNum] = model[f.attributeNum]
  }))
  return result
}

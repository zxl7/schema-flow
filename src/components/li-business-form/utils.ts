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
 * 【数据层：大脑】
 * 这个文件是整个组件的核心，体现了“逻辑与 UI 分离”的原则。
 * 它像一个数据引擎（Data Engine），把后端给的原始、杂乱的 JSON 转换成前端 UI 能够直接识别的标准对象。
 */

// 状态映射表：将当前的表单模式（新增/编辑/预览）映射到 JSON 中对应的状态字段名。
const stateKeyMap: Record<FormMode, 'createState' | 'editState' | 'viewState'> = {
  create: 'createState',
  edit: 'editState',
  view: 'viewState',
}

// 本地 Mock 字典库：实际开发中这些数据可能来自全局 Store 或接口。
const mockDictionaries: Record<string, FieldOption[]> = {
  boolDictionary: [{ label: '是', value: '1' }, { label: '否', value: '0' }],
  isAuxiliary: [{ label: '是', value: '1' }, { label: '否', value: '0' }],
  processCheckType: [
    { label: '自检', value: 'self' },
    { label: '专检', value: 'special' },
    { label: '巡检', value: 'patrol' },
  ],
}

/**
 * 【处理阶段 1：约束解析】
 * 将字符串格式的 JSON 约束（如 "[{"key":"required","value":1}]"）转换成对象格式，方便后续读取。
 */
function parseConstraints(raw: string | null | undefined): Record<string, RawConstraint> {
  if (!raw) return {}
  try {
    const list = JSON.parse(raw) as RawConstraint[]
    // 转换成 { required: { key: 'required', value: 1 } } 这种 key-value 结构，方便直接判断。
    return list.reduce((acc, item) => ({ ...acc, [item.key]: item }), {})
  } catch {
    return {}
  }
}

/**
 * 【处理阶段 2：URL 约束解析】
 * 专门解析特殊的 URL 字符串，拆解出请求地址、参数名、Label 字段名等。
 */
function parseUrlConstraint(value: any): UrlConstraint | undefined {
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
 * 它的目标是：让 UI 组件拿到结果后，直接通过 v-bind="field.props" 就能渲染，不需要再写任何 if/else。
 */
export function normalizeField(raw: RawBusinessField, mode: FormMode): BusinessField {
  // 1. 获取该模式下的基础数据
  const constraints = parseConstraints(raw.constraintInfo)
  const state = raw[stateKeyMap[mode]]
  
  /**
   * 2. 计算【逻辑包 logic】
   * 这里存放的是业务逻辑，比如：这个值是什么类型？默认值是多少？是否隐藏？
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
   * 这里存放的是直接传给 Ant Design 控件的属性（如 disabled, placeholder 等）。
   */
  const props: BusinessField['props'] = {
    disabled: mode === 'view' || state === 'R' || constraints.auto_code?.value === 1,
    required: constraints.required?.value === 1,
    placeholder: constraints.auto_code?.value === 1 ? '自动生成' : `请输入${raw.displayName}`,
    options: buildDefaultOptions(raw, constraints), // 预装载静态选项
    allowClear: true,
    showSearch: ['inputAndSelect', 'searchInput', 'user'].includes(raw.controlStyle),
  }

  /**
   * 4. 决定【UI 组件类型 uiType】
   * 根据 controlStyle 和当前模式，告诉分发器应该画哪种组件。
   */
  let uiType: BusinessField['uiType'] = 'input'
  if (mode === 'view') {
    uiType = 'view' // 预览模式下统一使用文字展示组件
  } else if (['select', 'inputAndSelect', 'searchInput', 'user'].includes(raw.controlStyle)) {
    uiType = 'select'
  } else if (raw.controlStyle === 'tree') {
    uiType = 'tree'
  }

  // 返回一个功能完备、UI 友好的新对象
  return { ...raw, uiType, props, logic }
}

/**
 * 辅助逻辑：根据约束构建初始的选项列表（针对枚举和字典）。
 */
function buildDefaultOptions(raw: RawBusinessField, constraints: Record<string, RawConstraint>): FieldOption[] {
  if (constraints.enum?.value) {
    return String(constraints.enum.value).split('||').map(v => ({ label: v, value: v }))
  }
  if (constraints.dict_translate?.value) {
    return mockDictionaries[String(constraints.dict_translate.value)] || []
  }
  // 模拟一些树形或用户数据，实际开发中可以为空，由组件在 mounted 时动态加载。
  if (raw.controlStyle === 'tree') return [{ label: '制造中心', value: 'm-1', children: [{ label: '一车间', value: 'w-1' }] }]
  if (raw.controlStyle === 'user') return [{ label: '张三', value: 'zs' }, { label: '李四', value: 'ls' }]
  return []
}

/**
 * 【分组加工】
 * 将扁平的字段数组按照 groupTag 分组，并进行排序，生成页面渲染所需的树形结构。
 */
export function groupFields(fields: RawBusinessField[], mode: FormMode): BusinessFieldGroup[] {
  const groups: Record<string, BusinessField[]> = {}
  
  fields.forEach(f => {
    const field = normalizeField(f, mode)
    if (field.logic.hidden) return // 隐藏字段不参与渲染分组
    
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
export function createInitialModel(groups: BusinessFieldGroup[]): Record<string, any> {
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
export function createSubmitValues(groups: BusinessFieldGroup[], model: Record<string, any>, includeHidden = false): Record<string, any> {
  const result: Record<string, any> = {}
  groups.forEach(g => g.fields.forEach(f => {
    if (!includeHidden && f.logic.hidden) return
    result[f.attributeNum] = model[f.attributeNum]
  }))
  return result
}

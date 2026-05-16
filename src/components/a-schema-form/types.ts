/**
 * 业务模式定义
 * create: 新增模式 | edit: 编辑模式 | view: 预览模式
 */
export type FormMode = 'create' | 'edit' | 'view'

/**
 * 控件样式枚举：映射 Ant Design Vue 的特定输入组件
 */
export type ControlStyle =
  | 'textInput'
  | 'inputAndSelect'
  | 'select'
  | 'tree'
  | 'double'
  | 'text'
  | 'date'
  | 'user'
  | 'searchInput'
  | 'editor'
  | 'checkbox'
  | 'radio'
  | 'checkboxGroup'
  | 'rate'
  | 'slider'
  | 'time'

/**
 * 原始约束协议
 */
export interface RawConstraint {
  key: string
  value: string | number | boolean
  lableName?: string
}

/**
 * 字段选项结构
 */
export interface FieldOption {
  label: string
  value: string | number
  children?: FieldOption[]
}

/**
 * 远程数据源约束
 */
export interface UrlConstraint {
  raw: string
  url: string
  params: string[]
  valueKey?: string
  labelKey?: string
}

/**
 * 后端原始领域模型 (Domain Model)
 */
export interface RawBusinessField {
  bid: string
  attributeNum: string
  attributeType?: string
  dataType?: string
  displayName: string
  controlStyle: ControlStyle | string
  sortOrder?: number
  constraintInfo?: string | null
  createState?: string
  editState?: string
  viewState?: string
  groupTag?: string | null
  widthProportion?: string | null
}

/**
 * 视图模型 (View Model)
 */
export interface BusinessField extends RawBusinessField {
  // 抽象出的 UI 类型，驱动动态组件分发
  uiType: 'input' | 'select' | 'tree' | 'view' | 'radio' | 'checkboxGroup' | 'rate' | 'slider'
  
  // 组件属性包
  props: {
    placeholder?: string
    disabled: boolean
    options: FieldOption[]
    loading?: boolean
    required: boolean
    allowClear?: boolean
    showSearch?: boolean
    min?: number
    max?: number
    step?: number
    [key: string]: any
  }

  // 业务逻辑包：存储非展示类的业务规则
  logic: {
    optionSource: 'none' | 'enum' | 'dict' | 'url' | 'mock'
    urlConstraint?: UrlConstraint
    translateKey?: string
    defaultValue: FieldValue
    hidden: boolean
    formWidth: string
    valueType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'unknown'
  }
}

/**
 * 业务分组结构
 */
export interface BusinessFieldGroup {
  name: string
  fields: BusinessField[]
}

/**
 * 字段值类型定义
 */
export type FieldValue = string | number | boolean | null | Array<string | number>

/**
 * 表单模型定义
 */
export type FormModel = Record<string, FieldValue>

/**
 * 外部选项提供者函数定义
 */
export type OptionProvider = (field: BusinessField, formModel: FormModel) => FieldOption[] | Promise<FieldOption[]>

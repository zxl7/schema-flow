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

/**
 * 原始约束协议
 * 定义字段的业务限制，如必填、长度、数据源等
 */
export interface RawConstraint {
  key: string
  value: string | number | boolean
  lableName?: string
}

/**
 * 字段选项结构
 * 统一 Select、TreeSelect 等组件的数据格式
 */
export interface FieldOption {
  label: string
  value: string | number
  children?: FieldOption[]
}

/**
 * 远程数据源约束
 * 描述如何通过 URL 动态加载选项数据
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
 * 直接映射 demo.json 或接口下发的原始字段结构
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
 * 经过数据引擎归一化后的标准字段协议，UI 组件直接消费此结构
 */
export interface BusinessField extends RawBusinessField {
  // 抽象出的 UI 类型，驱动动态组件分发
  uiType: 'input' | 'select' | 'tree' | 'view'
  
  // 组件属性包：直接解构传递给底层 UI 控件
  props: {
    placeholder?: string
    disabled: boolean
    options: FieldOption[]
    loading?: boolean
    required: boolean
    allowClear?: boolean
    showSearch?: boolean
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

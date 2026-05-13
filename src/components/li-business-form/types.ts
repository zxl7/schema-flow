// FormMode 是一个“类型别名 (Type Alias)”，使用 type 关键字定义。
// 它使用了“联合类型 (Union Type)”，用 | 符号连接，表示变量只能是这三个字符串之一。
export type FormMode = 'create' | 'edit' | 'view'

// 同上，定义了控件样式的可选范围。
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

// interface 定义了一个“接口”，描述了对象的形状（有哪些属性，分别是什么类型）。
export interface RawConstraint {
  key: string
  // | 表示 value 可以是字符串、数字或布尔值中的任意一种。
  value: string | number | boolean
  // ? 表示这个属性是“可选的 (Optional)”，对象中可以没有这个字段。
  lableName?: string
}

// 定义选项的结构。
export interface FieldOption {
  label: string
  value: string | number
  // 递归引用：children 也是 FieldOption 类型的数组。
  children?: FieldOption[]
}

export interface UrlConstraint {
  raw: string
  url: string
  // string[] 表示字符串类型的数组。
  params: string[]
  valueKey?: string
  labelKey?: string
}

// 后端下发的原始字段结构（保持不变，兼容 demo.json）。
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

// 归一化后的 UI 字段协议：组件只关注这里定义的属性。
export interface BusinessField extends RawBusinessField {
  // 核心 UI 属性
  uiType: 'input' | 'select' | 'tree' | 'view' // 该渲染哪种类型的组件
  
  // 统一的属性包，直接传给 AntD 或自定义控件
  props: {
    placeholder?: string
    disabled: boolean
    options: FieldOption[]
    loading?: boolean
    required: boolean
    allowClear?: boolean
    showSearch?: boolean
    [key: string]: any // 允许扩展其他属性
  }

  // 业务逻辑包
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

export interface BusinessFieldGroup {
  name: string
  fields: BusinessField[]
}

// 复杂联合类型，表示字段的值可以是多种基础类型或它们的数组。
export type FieldValue = string | number | boolean | null | Array<string | number>

// 表示一个键值对对象，key 是字段名（string），value 是对应的值。
export type FormModel = Record<string, FieldValue>

// 定义一个“函数类型”。
// 它接收 field 和 formModel 两个参数，返回 FieldOption 数组或一个返回该数组的 Promise（异步结果）。
export type OptionProvider = (field: BusinessField, formModel: FormModel) => FieldOption[] | Promise<FieldOption[]>

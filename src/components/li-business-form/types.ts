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

export interface RawBusinessField {
  bid: string
  attributeNum: string
  attributeType?: string
  dataType?: string
  displayName: string
  // 也可以是 ControlStyle 类型，或者是任意字符串。
  controlStyle: ControlStyle | string
  sortOrder?: number
  constraintInfo?: string | null
  createState?: string
  editState?: string
  viewState?: string
  groupTag?: string | null
  widthProportion?: string | null
}

// extends 表示“继承”，BusinessField 包含了 RawBusinessField 的所有属性，并增加了下面这些。
export interface BusinessField extends RawBusinessField {
  // Record<K, T> 是一个“工具类型”，表示一个对象。
  // 这里的 key 是 string 类型，value 是 RawConstraint 类型。
  constraints: Record<string, RawConstraint>
  options: FieldOption[]
  optionSource: 'none' | 'enum' | 'dict' | 'url' | 'mock'
  urlConstraint?: UrlConstraint
  translateKey?: string
  defaultValue: FieldValue
  hidden: boolean
  disabled: boolean
  required: boolean
  placeholder: string
  formWidth: string
  // 限制 valueType 只能是这几个特定的字符串。
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'unknown'
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

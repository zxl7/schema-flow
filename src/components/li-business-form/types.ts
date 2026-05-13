// 表单模式会影响字段读写状态：新增、编辑、查看。
export type FormMode = 'create' | 'edit' | 'view'

// demo.json 中的 controlStyle 字段，用它决定渲染哪一种 Ant Design Vue 控件。
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

// constraintInfo 字符串 JSON 解析后的单条约束。
export interface RawConstraint {
  key: string
  value: string | number | boolean
  lableName?: string
}

// 统一后的选项格式，select/tree/user 都尽量转成这一种结构。
export interface FieldOption {
  label: string
  value: string | number
  children?: FieldOption[]
}

// 后端或配置平台直接下发的原始字段结构。
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

// 组件内部使用的字段结构，比原始字段多了约束、选项、隐藏、禁用等渲染信息。
export interface BusinessField extends RawBusinessField {
  constraints: Record<string, RawConstraint>
  options: FieldOption[]
  hidden: boolean
  disabled: boolean
  required: boolean
  placeholder: string
  formWidth: string
}

export interface BusinessFieldGroup {
  name: string
  fields: BusinessField[]
}

export type FieldValue = string | number | boolean | null | Array<string | number>

export type FormModel = Record<string, FieldValue>

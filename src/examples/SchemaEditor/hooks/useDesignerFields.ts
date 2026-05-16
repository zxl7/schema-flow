import { ref, computed } from 'vue'
import type { RawBusinessField } from '../../../components/a-schema-form/types'

export type DesignerState = {
  fields: RawBusinessField[]
  selectedIndex: number
}

/**
 * 基于最新顺序统一重算排序权重。
 * 纯函数化后，任何字段列表变换都会先经过这里标准化。
 */
const withSortOrder = (list: RawBusinessField[]) =>
  list.map((field, index) => ({
    ...field,
    sortOrder: index + 1
  }))

/**
 * 约束选中索引，避免越界状态污染后续计算。
 */
const normalizeSelectedIndex = (fields: RawBusinessField[], selectedIndex: number) =>
  selectedIndex >= 0 && selectedIndex < fields.length ? selectedIndex : -1

/**
 * 生成新的设计器状态。
 * 默认会顺带规范排序权重，只有纯字段 patch 场景才跳过。
 */
const createDesignerState = (
  fields: RawBusinessField[],
  selectedIndex: number,
  shouldNormalizeSortOrder: boolean = true
): DesignerState => {
  const nextFields = shouldNormalizeSortOrder ? withSortOrder(fields) : fields
  return {
    fields: nextFields,
    selectedIndex: normalizeSelectedIndex(nextFields, selectedIndex)
  }
}

/**
 * 字段管理逻辑 Hook
 * 负责字段列表的增、删、改、查、移、克隆及清空
 */
export const useDesignerFields = () => {
  // --- 基础状态 ---
  
  // 核心字段列表
  const fields = ref<RawBusinessField[]>([])
  // 当前选中的字段索引
  const selectedIndex = ref<number>(-1)

  // --- 计算属性 ---

  /**
   * 当前选中的字段对象
   */
  const selectedField = computed(() => {
    if (selectedIndex.value >= 0 && selectedIndex.value < fields.value.length) {
      return fields.value[selectedIndex.value]
    }
    return null
  })

  /**
   * 检查当前选中字段的 ID 是否与其他字段重复
   */
  const isIdDuplicated = computed(() => {
    if (!selectedField.value) return false
    const id = selectedField.value.attributeNum
    return fields.value.some((f, i) => f.attributeNum === id && i !== selectedIndex.value)
  })

  // --- 核心操作方法 ---

  /**
   * 统一提交字段列表与选中态。
   * 保证 `fields` 仍然是唯一数据源，外部只传入“下一份状态”。
   */
  const commitState = (nextState: DesignerState) => {
    fields.value = nextState.fields
    selectedIndex.value = nextState.selectedIndex
  }

  /**
   * 使用变换函数生成下一份状态。
   * UI 层只描述“做什么”，真正的数据变换集中在纯函数中。
   */
  const updateState = (
    transformer: (state: DesignerState) => DesignerState
  ) => {
    const currentState = createDesignerState(fields.value, selectedIndex.value, false)
    const nextState = transformer(currentState)
    commitState(nextState)
  }

  /**
   * 以当前状态为输入，直接替换字段列表。
   */
  const replaceFields = (
    nextFields: RawBusinessField[],
    nextSelectedIndex: number = selectedIndex.value,
    shouldNormalizeSortOrder: boolean = true
  ) => {
    commitState(createDesignerState(nextFields, nextSelectedIndex, shouldNormalizeSortOrder))
  }

  /**
   * 根据 bid 查找字段索引。
   * 支持传入快照状态，避免纯函数内部再次读取响应式源。
   */
  const findFieldIndex = (bid: string, sourceFields: RawBusinessField[] = fields.value) =>
    sourceFields.findIndex(field => field.bid === bid)

  /**
   * 生成全局唯一的 attributeNum
   */
  const generateUniqueAttributeNum = (basePrefix = 'field') => {
    let index = fields.value.length + 1
    let newNum = `${basePrefix}_${index}`
    while (fields.value.some(f => f.attributeNum === newNum)) {
      index++
      newNum = `${basePrefix}_${index}`
    }
    return newNum
  }

  /**
   * 创建新字段的基础模板
   * @param type 控件类型 (controlStyle)
   */
  const createNewField = (type: string): RawBusinessField => {
    const attributeNum = generateUniqueAttributeNum()
    return {
      bid: Date.now().toString() + Math.random().toString().slice(2, 6),
      attributeNum,
      displayName: `新字段_${attributeNum.split('_')[1]}`,
      controlStyle: type,
      sortOrder: fields.value.length + 1,
      constraintInfo: null,
      createState: 'RW',
      editState: 'RW',
      viewState: 'R',
      groupTag: '基础信息'
    }
  }

  /**
   * 直接点击组件库添加组件
   */
  const addComponent = (type: string) => {
    const newField = createNewField(type)
    updateState((state) =>
      createDesignerState([...state.fields, newField], state.fields.length)
    )
  }

  /**
   * 根据索引删除字段
   */
  const removeComponent = (index: number) => {
    updateState((state) => {
      const nextFields = state.fields.filter((_, currentIndex) => currentIndex !== index)
      const nextSelectedIndex =
        state.selectedIndex === index
          ? -1
          : state.selectedIndex > index
            ? state.selectedIndex - 1
            : state.selectedIndex

      return createDesignerState(nextFields, nextSelectedIndex)
    })
  }

  /**
   * 根据 BID 删除字段
   */
  const removeFieldByBid = (bid: string) => {
    const index = findFieldIndex(bid)
    if (index >= 0) {
      removeComponent(index)
    }
  }

  /**
   * 选中某个字段
   */
  const handleFieldSelect = (bid: string) => {
    selectedIndex.value = findFieldIndex(bid)
  }

  /**
   * 克隆一个现有字段
   */
  const cloneField = (bid: string) => {
    updateState((state) => {
      const index = findFieldIndex(bid, state.fields)
      if (index < 0) return state

      const source = state.fields[index]
      const newAttributeNum = generateUniqueAttributeNum(source.attributeNum.split('_')[0])

      const newField: RawBusinessField = {
        ...JSON.parse(JSON.stringify(source)), // 深拷贝，防止修改影响原字段的 constraintInfo
        bid: Date.now().toString() + Math.random().toString().slice(2, 6),
        attributeNum: newAttributeNum,
        displayName: `${source.displayName} (副本)`
      }

      const nextFields = [...state.fields]
      nextFields.splice(index + 1, 0, newField)
      return createDesignerState(nextFields, index + 1)
    })
  }

  /**
   * 移动字段位置 (上移/下移)
   */
  const moveField = (bid: string, direction: 'up' | 'down') => {
    updateState((state) => {
      const index = findFieldIndex(bid, state.fields)
      if (index < 0) return state

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= state.fields.length) return state

      const nextFields = [...state.fields]
      const [movedField] = nextFields.splice(index, 1)
      nextFields.splice(targetIndex, 0, movedField)

      const nextSelectedIndex =
        state.selectedIndex === index
          ? targetIndex
          : state.selectedIndex === targetIndex
            ? index
            : state.selectedIndex

      return createDesignerState(nextFields, nextSelectedIndex)
    })
  }

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    if (fields.value.length === 0) return
    if (confirm('确定要清空所有字段吗？')) {
      commitState(createDesignerState([], -1))
    }
  }

  /**
   * 是否为第一个字段
   */
  const isFirstField = (bid: string) => fields.value.length > 0 && fields.value[0].bid === bid
  
  /**
   * 是否为最后一个字段
   */
  const isLastField = (bid: string) => fields.value.length > 0 && fields.value[fields.value.length - 1].bid === bid

  /**
   * 按 BID 局部更新字段
   * 只接收 patch，确保 `fields` 是唯一数据源。
   */
  const patchFieldByBid = (bid: string, patch: Partial<RawBusinessField>) => {
    updateState((state) => {
      const index = findFieldIndex(bid, state.fields)
      if (index < 0) return state

      const currentField = state.fields[index]
      const changedEntries = Object.entries(patch).filter(([key, value]) => currentField[key as keyof RawBusinessField] !== value)

      if (changedEntries.length === 0) return state

      const nextFields = [...state.fields]
      nextFields[index] = {
        ...currentField,
        ...Object.fromEntries(changedEntries)
      }

      // 属性面板 patch 不改变顺序，只更新当前项，避免每次输入都重算整表。
      return createDesignerState(nextFields, state.selectedIndex, false)
    })
  }

  /**
   * 更新当前选中的字段
   * 属性面板统一通过这个函数回写数据，避免维护字段副本。
   */
  const updateSelectedField = (patch: Partial<RawBusinessField>) => {
    if (!selectedField.value) return
    patchFieldByBid(selectedField.value.bid, patch)
  }

  return {
    fields,
    selectedIndex,
    selectedField,
    isIdDuplicated,
    createNewField,
    addComponent,
    removeComponent,
    removeFieldByBid,
    handleFieldSelect,
    cloneField,
    moveField,
    clearCanvas,
    isFirstField,
    isLastField,
    commitState,
    updateState,
    replaceFields,
    patchFieldByBid,
    updateSelectedField
  }
}

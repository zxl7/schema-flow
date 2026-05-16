import { ref, type Ref } from 'vue'
import type { RawBusinessField } from '../../../components/a-schema-form/types'

/**
 * 设计器拖拽逻辑 Hook
 * 负责处理组件库拖入、画布内排序以及腾空视觉反馈
 */
export const useDesignerDrag = (
  fields: Ref<RawBusinessField[]>,
  selectedIndex: Ref<number>,
  createNewField: (type: string) => RawBusinessField
) => {
  // --- 状态定义 ---
  
  // 当前正在拖拽的字段 BID (画布内拖拽)
  const draggingBid = ref<string | null>(null)
  // 当前正在拖拽的组件类型 (从组件库拖拽)
  const draggingType = ref<string | null>(null)
  // 当前鼠标悬停的目标字段 BID
  const overBid = ref<string | null>(null)
  // 当前鼠标悬停的位置 (目标字段的上方或下方)
  const overPosition = ref<'top' | 'bottom' | null>(null)

  /**
   * 统一重算排序权重
   * 返回全新的字段数组，避免对响应式数组做多次原地修改。
   */
  const withSortOrder = (list: RawBusinessField[]) =>
    list.map((field, index) => ({
      ...field,
      sortOrder: index + 1
    }))

  // --- 核心方法 ---

  /**
   * 重置所有拖拽状态
   */
  const handleDragEnd = () => {
    draggingBid.value = null
    draggingType.value = null
    overBid.value = null
    overPosition.value = null
  }

  /**
   * 从组件库开始拖拽
   */
  const handleDragStartFromLibrary = (e: DragEvent, type: string) => {
    draggingType.value = type
    draggingBid.value = null
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
    }
  }

  /**
   * 从画布内部开始拖拽
   */
  const handleDragStartFromCanvas = (e: DragEvent, bid: string) => {
    draggingBid.value = bid
    draggingType.value = null
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  /**
   * 鼠标在字段上方移动，计算腾空位置
   */
  const handleDragOverField = (e: DragEvent, bid: string) => {
    // 如果拖拽的是自己，则不触发腾空
    if (draggingBid.value === bid) {
      overBid.value = null
      overPosition.value = null
      return
    }
    
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offset = e.clientY - rect.top
    
    overBid.value = bid
    // 以中心线为界，判断是上半部分还是下半部分
    overPosition.value = offset < rect.height / 2 ? 'top' : 'bottom'
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = draggingType.value ? 'copy' : 'move'
    }

    // 阻止冒泡，避免触发画布的 dragover
    e.stopPropagation()
  }

  /**
   * 鼠标在画布空白区域移动
   */
  const handleDragOverCanvas = (e: DragEvent) => {
    // 进入画布空白区域时，清空当前命中的字段
    overBid.value = null
    overPosition.value = null
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = draggingType.value ? 'copy' : 'move'
    }
  }

  /**
   * 鼠标离开字段
   */
  const handleDragLeave = () => {
    // 离开元素时不立即清空，由父级或其它元素的 dragover 处理
  }

  /**
   * 在画布空白区域释放 (通常是追加到末尾)
   */
  const handleDropOnCanvas = () => {
    // 只有在没有命中具体字段时，才执行追加逻辑
    if (overBid.value) return

    if (draggingType.value) {
      // 从库拖拽新增到末尾
      const newField = createNewField(draggingType.value)
      const nextFields = withSortOrder([...fields.value, newField])
      fields.value = nextFields
      selectedIndex.value = nextFields.length - 1
    } else if (draggingBid.value) {
      // 画布内移动到末尾
      const sourceIndex = fields.value.findIndex(f => f.bid === draggingBid.value)
      if (sourceIndex >= 0) {
        const nextFields = [...fields.value]
        const [removed] = nextFields.splice(sourceIndex, 1)
        nextFields.push(removed)
        fields.value = withSortOrder(nextFields)
        selectedIndex.value = fields.value.length - 1
      }
    }

    handleDragEnd()
  }

  /**
   * 在具体字段上释放
   */
  const handleDropOnField = (_e: DragEvent, targetBid: string) => {
    // 如果是拖拽到自己身上，且没有明确的腾空位置（即不是拖拽到自己的边缘，但逻辑上拖拽到自己应该不触发移动）
    if (draggingBid.value === targetBid) {
      handleDragEnd()
      return
    }

    const targetIndex = fields.value.findIndex(f => f.bid === targetBid)
    if (targetIndex < 0) return

    if (draggingType.value) {
      // 场景 A: 从库拖拽新增
      const newField = createNewField(draggingType.value)
      const insertIndex = overPosition.value === 'bottom' ? targetIndex + 1 : targetIndex
      const nextFields = [...fields.value]
      nextFields.splice(insertIndex, 0, newField)
      fields.value = withSortOrder(nextFields)
      selectedIndex.value = insertIndex
    } else if (draggingBid.value) {
      // 场景 B: 画布内移动
      const sourceIndex = fields.value.findIndex(f => f.bid === draggingBid.value)
      if (sourceIndex < 0) return

      const insertIndex = overPosition.value === 'bottom' ? targetIndex + 1 : targetIndex
      const nextFields = [...fields.value]
      const [removed] = nextFields.splice(sourceIndex, 1)
      const finalTargetIndex = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex

      if (finalTargetIndex === sourceIndex) {
        handleDragEnd()
        return
      }

      nextFields.splice(finalTargetIndex, 0, removed)
      fields.value = withSortOrder(nextFields)
      selectedIndex.value = finalTargetIndex
    }
    
    handleDragEnd()
  }

  return {
    draggingBid,
    draggingType,
    overBid,
    overPosition,
    handleDragStartFromLibrary,
    handleDragStartFromCanvas,
    handleDragOverField,
    handleDragOverCanvas,
    handleDragLeave,
    handleDragEnd,
    handleDropOnCanvas,
    handleDropOnField
  }
}

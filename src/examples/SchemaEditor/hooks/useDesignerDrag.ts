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
    if (draggingBid.value === bid) return
    
    const target = e.currentTarget as HTMLElement
    // 计算鼠标与目标元素的垂直偏移量
    // getBoundingClientRect() 返回元素的 DOM 中的矩形位置，包含元素的宽度、高度、顶部和左侧位置
    const rect = target.getBoundingClientRect()
    const offset = e.clientY - rect.top
    
    overBid.value = bid
    // 以中心线为界，判断是上半部分还是下半部分
    overPosition.value = offset < rect.height / 2 ? 'top' : 'bottom'
  }

  /**
   * 鼠标离开字段
   */
  const handleDragLeave = () => {
    // 这里通常不需要立即清空 overBid，因为进入下一个元素时 handleDragOverField 会更新它
  }

  /**
   * 在画布空白区域释放 (通常是追加到末尾)
   */
  const handleDropOnCanvas = (e: DragEvent) => {
    // 只有在没有命中具体字段且是从库拖拽时，才执行追加逻辑
    if (draggingType.value && !overBid.value) {
      const newField = createNewField(draggingType.value)
      fields.value.push(newField)
      selectedIndex.value = fields.value.length - 1
      handleDragEnd()
    }
  }

  /**
   * 在具体字段上释放
   */
  const handleDropOnField = (e: DragEvent, targetBid: string) => {
    const targetIndex = fields.value.findIndex(f => f.bid === targetBid)
    if (targetIndex < 0) return

    // 计算最终插入位置
    const insertIndex = overPosition.value === 'bottom' ? targetIndex + 1 : targetIndex

    if (draggingType.value) {
      // 场景 A: 从库拖拽新增
      const newField = createNewField(draggingType.value)
      fields.value.splice(insertIndex, 0, newField)
      selectedIndex.value = insertIndex
    } else if (draggingBid.value) {
      // 场景 B: 画布内移动
      const sourceIndex = fields.value.findIndex(f => f.bid === draggingBid.value)
      if (sourceIndex < 0) return
      
      const [removed] = fields.value.splice(sourceIndex, 1)
      
      // 重新计算插入位置（因为 splice 删除了一个元素，索引可能发生了偏移）
      let finalTargetIndex = fields.value.findIndex(f => f.bid === targetBid)
      if (overPosition.value === 'bottom') {
        finalTargetIndex += 1
      }
      
      fields.value.splice(finalTargetIndex, 0, removed)
      selectedIndex.value = finalTargetIndex
    }

    // 更新所有字段的排序权重
    fields.value.forEach((f, i) => {
      f.sortOrder = i + 1
    })
    
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
    handleDragLeave,
    handleDragEnd,
    handleDropOnCanvas,
    handleDropOnField
  }
}

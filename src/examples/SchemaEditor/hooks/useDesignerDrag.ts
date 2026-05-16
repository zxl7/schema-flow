import { ref, type Ref } from 'vue'
import type { RawBusinessField } from '../../../components/a-schema-form/types'
import type { DesignerState } from './useDesignerFields'

/**
 * 设计器拖拽逻辑 Hook
 * 负责处理组件库拖入、画布内排序以及腾空视觉反馈
 */
export const useDesignerDrag = (
  fields: Ref<RawBusinessField[]>,
  createNewField: (type: string) => RawBusinessField,
  updateState: (transformer: (state: DesignerState) => DesignerState) => void
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
  let hoverFrameId = 0
  let pendingHoverState: { bid: string | null; position: 'top' | 'bottom' | null } | null = null

  /**
   * 仅在 hover 状态真实变化时提交，减少 dragover 高频触发造成的重复渲染。
   */
  const syncHoverState = (bid: string | null, position: 'top' | 'bottom' | null) => {
    if (overBid.value === bid && overPosition.value === position) return
    overBid.value = bid
    overPosition.value = position
  }

  /**
   * hover 状态按帧更新，避免每次 dragover 都触发响应式写入。
   */
  const scheduleHoverState = (bid: string | null, position: 'top' | 'bottom' | null) => {
    pendingHoverState = { bid, position }

    if (hoverFrameId) return

    hoverFrameId = window.requestAnimationFrame(() => {
      hoverFrameId = 0
      if (!pendingHoverState) return
      syncHoverState(pendingHoverState.bid, pendingHoverState.position)
      pendingHoverState = null
    })
  }

  // --- 核心方法 ---

  /**
   * 重置所有拖拽状态
   */
  const handleDragEnd = () => {
    if (hoverFrameId) {
      window.cancelAnimationFrame(hoverFrameId)
      hoverFrameId = 0
    }
    pendingHoverState = null
    draggingBid.value = null
    draggingType.value = null
    syncHoverState(null, null)
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
      scheduleHoverState(null, null)
      return
    }
    
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offset = e.clientY - rect.top
    
    // 以中心线为界，判断是上半部分还是下半部分
    const nextPosition = offset < rect.height / 2 ? 'top' : 'bottom'
    scheduleHoverState(bid, nextPosition)
    
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
    scheduleHoverState(null, null)
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
      updateState((state) => ({
        fields: [...state.fields, newField].map((field, index) => ({
          ...field,
          sortOrder: index + 1
        })),
        selectedIndex: state.fields.length
      }))
    } else if (draggingBid.value) {
      // 画布内移动到末尾
      updateState((state) => {
        const sourceIndex = state.fields.findIndex(f => f.bid === draggingBid.value)
        if (sourceIndex < 0) return state

        const nextFields = [...state.fields]
        const [removed] = nextFields.splice(sourceIndex, 1)
        nextFields.push(removed)
        return {
          fields: nextFields.map((field, index) => ({
            ...field,
            sortOrder: index + 1
          })),
          selectedIndex: nextFields.length - 1
        }
      })
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
      updateState((state) => {
        const currentTargetIndex = state.fields.findIndex(f => f.bid === targetBid)
        if (currentTargetIndex < 0) return state

        const insertIndex = overPosition.value === 'bottom' ? currentTargetIndex + 1 : currentTargetIndex
        const nextFields = [...state.fields]
        nextFields.splice(insertIndex, 0, newField)

        return {
          fields: nextFields.map((field, index) => ({
            ...field,
            sortOrder: index + 1
          })),
          selectedIndex: insertIndex
        }
      })
    } else if (draggingBid.value) {
      // 场景 B: 画布内移动
      let shouldSkipDrop = false

      updateState((state) => {
        const sourceIndex = state.fields.findIndex(f => f.bid === draggingBid.value)
        const currentTargetIndex = state.fields.findIndex(f => f.bid === targetBid)
        if (sourceIndex < 0 || currentTargetIndex < 0) return state

        const insertIndex = overPosition.value === 'bottom' ? currentTargetIndex + 1 : currentTargetIndex
        const nextFields = [...state.fields]
        const [removed] = nextFields.splice(sourceIndex, 1)
        const finalTargetIndex = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex

        if (finalTargetIndex === sourceIndex) {
          shouldSkipDrop = true
          return state
        }

        nextFields.splice(finalTargetIndex, 0, removed)
        return {
          fields: nextFields.map((field, index) => ({
            ...field,
            sortOrder: index + 1
          })),
          selectedIndex: finalTargetIndex
        }
      })

      if (shouldSkipDrop) {
        handleDragEnd()
        return
      }
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

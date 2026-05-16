import { ref, type Ref } from 'vue'
import type { RawBusinessField } from '../../../components/a-schema-form/types'
import { createDesignerState, type DesignerState } from './useDesignerFields'

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
   * 判定位置：简单归一化，确保一个间隙只有一根线。
   * 逻辑：下半部自动归类到下一个组件的“上方”，除非是最后一个组件。
   */
  const resolveHoverPosition = (bid: string, offsetY: number, height: number) => {
    const isTop = offsetY < height / 2
    if (isTop) return { bid, position: 'top' as const }

    // 下半部判定：找下一个组件
    const index = fields.value.findIndex(f => f.bid === bid)
    if (index >= 0 && index < fields.value.length - 1) {
      return { bid: fields.value[index + 1].bid, position: 'top' as const }
    }

    // 最后一个组件的下半部
    return { bid, position: 'bottom' as const }
  }

  /**
   * 仅在 hover 状态真实变化时提交，减少 dragover 高频触发造成的重复渲染。
   */
  const syncHoverState = (bid: string | null, position: 'top' | 'bottom' | null) => {
    if (overBid.value === bid && overPosition.value === position) return
    overBid.value = bid
    overPosition.value = position
  }

  /**
   * hover 状态按帧更新
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

  const handleDragStartFromLibrary = (_e: DragEvent, type: string) => {
    draggingType.value = type
    draggingBid.value = null
  }

  const handleDragStartFromCanvas = (_e: DragEvent, bid: string) => {
    draggingBid.value = bid
    draggingType.value = null
  }

  const handleDragOverField = (e: DragEvent, bid: string) => {
    // 如果拖拽的是自己，则不触发腾空
    if (draggingBid.value === bid) return
    
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offset = e.clientY - rect.top
    
    const { bid: finalBid, position } = resolveHoverPosition(bid, offset, rect.height)
    scheduleHoverState(finalBid, position)

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
   * 在画布空白区域释放
   * 用户要求：如果没有命中具体字段，则“回到原位”，即不进行任何操作。
   */
  const handleDropOnCanvas = () => {
    handleDragEnd()
  }

  /**
   * 在具体字段上释放
   * 用户要求：不要根据鼠标位置重算，要根据当前“激活的提示线”位置插入。
   */
  const handleDropOnField = (_e: DragEvent, _targetBid: string) => {
    // 核心逻辑：直接使用 dragover 过程中实时更新并显示的 overBid 和 overPosition
    const targetBid = overBid.value
    const position = overPosition.value

    if (!targetBid || !position) {
      handleDragEnd()
      return
    }

    // 如果是拖拽到自己身上，则不触发
    if (draggingBid.value === targetBid) {
      handleDragEnd()
      return
    }

    if (draggingType.value) {
      // 场景 A: 从库拖拽新增
      const newField = createNewField(draggingType.value)
      updateState((state) => {
        const currentTargetIndex = state.fields.findIndex(f => f.bid === targetBid)
        if (currentTargetIndex < 0) return state

        const insertIndex = position === 'bottom' ? currentTargetIndex + 1 : currentTargetIndex
        const nextFields = [...state.fields]
        nextFields.splice(insertIndex, 0, newField)

        return createDesignerState(nextFields, insertIndex)
      })
    } else if (draggingBid.value) {
      // 场景 B: 画布内移动
      updateState((state) => {
        const sourceIndex = state.fields.findIndex(f => f.bid === draggingBid.value)
        const currentTargetIndex = state.fields.findIndex(f => f.bid === targetBid)
        if (sourceIndex < 0 || currentTargetIndex < 0) return state

        const insertIndex = position === 'bottom' ? currentTargetIndex + 1 : currentTargetIndex
        const nextFields = [...state.fields]
        const [removed] = nextFields.splice(sourceIndex, 1)
        
        // 计算最终插入位置，需要考虑删除自己后索引的变化
        const finalTargetIndex = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex
        nextFields.splice(finalTargetIndex, 0, removed)
        
        return createDesignerState(nextFields, finalTargetIndex)
      })
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

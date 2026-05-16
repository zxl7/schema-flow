import { ref, watch, computed, type Ref } from 'vue'

/**
 * 历史记录快照结构
 */
interface HistorySnapshot<T> {
  data: T
  selectedIndex: number
}

/**
 * 撤销/重做 (Undo/Redo) 逻辑 Hook
 * 负责记录状态的历史快照，并提供前进、后退的方法
 * 
 * @param targetRef 需要被监听和记录的响应式对象 (通常是 fields 数组)
 * @param selectedIndexRef 需要同步记录的选中索引
 * @param maxHistory 最大历史记录数，默认 50
 */
export const useHistory = <T>(
  targetRef: Ref<T>, 
  selectedIndexRef: Ref<number>,
  maxHistory: number = 50
) => {
  // 历史栈：存储状态快照
  const historyStack = ref<string[]>([])
  // 当前在历史栈中的指针位置
  const currentIndex = ref<number>(-1)
  // 标记是否正在执行撤销/重做操作，防止操作自身触发 watch 陷入死循环
  let isUndoing = false

  /**
   * 初始化历史栈
   * @param initialValue 初始状态
   */
  const initHistory = (initialValue: T) => {
    const snapshotObj: HistorySnapshot<T> = {
      data: initialValue,
      selectedIndex: selectedIndexRef.value
    }
    const snapshot = JSON.stringify(snapshotObj)
    historyStack.value = [snapshot]
    currentIndex.value = 0
  }

  /**
   * 记录新的历史快照
   * @param value 当前状态
   */
  const recordHistory = (value: T) => {
    // 如果正在执行撤销/重做，则不记录
    if (isUndoing) return

    const snapshotObj: HistorySnapshot<T> = {
      data: value,
      selectedIndex: selectedIndexRef.value
    }
    const snapshot = JSON.stringify(snapshotObj)
    
    // 如果与当前栈顶状态相同，则不重复记录
    if (
      currentIndex.value >= 0 && 
      historyStack.value[currentIndex.value] === snapshot
    ) {
      return
    }

    // 如果当前指针不在栈顶（说明之前撤销过），现在又有了新操作，则丢弃指针之后的未来历史
    if (currentIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, currentIndex.value + 1)
    }

    // 入栈新状态
    historyStack.value.push(snapshot)

    // 超过最大限制，移除最老的记录
    if (historyStack.value.length > maxHistory) {
      historyStack.value.shift()
    } else {
      currentIndex.value++
    }
  }

  /**
   * 撤销 (Undo)
   */
  const undo = () => {
    if (canUndo.value) {
      isUndoing = true
      currentIndex.value--
      const snapshotStr = historyStack.value[currentIndex.value]
      const snapshotObj = JSON.parse(snapshotStr) as HistorySnapshot<T>
      
      targetRef.value = snapshotObj.data
      selectedIndexRef.value = snapshotObj.selectedIndex
      
      // 延迟重置标记，确保 watch 不会捕捉到这次变更
      setTimeout(() => {
        isUndoing = false
      }, 0)
    }
  }

  /**
   * 重做 (Redo)
   */
  const redo = () => {
    if (canRedo.value) {
      isUndoing = true
      currentIndex.value++
      const snapshotStr = historyStack.value[currentIndex.value]
      const snapshotObj = JSON.parse(snapshotStr) as HistorySnapshot<T>
      
      targetRef.value = snapshotObj.data
      selectedIndexRef.value = snapshotObj.selectedIndex
      
      setTimeout(() => {
        isUndoing = false
      }, 0)
    }
  }

  // --- 计算属性 ---

  // 是否可以撤销（指针在栈底之上）
  const canUndo = computed(() => currentIndex.value > 0)
  // 是否可以重做（指针在栈顶之下）
  const canRedo = computed(() => currentIndex.value < historyStack.value.length - 1)

  // 监听目标对象的变化，自动记录历史
  watch(targetRef, (newVal) => {
    recordHistory(newVal)
  }, { deep: true })

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    initHistory
  }
}

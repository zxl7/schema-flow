import { ref, computed, type Ref } from 'vue'
import type { RawBusinessField } from '../../../components/a-schema-form/types'

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
    fields.value.push(newField)
    selectedIndex.value = fields.value.length - 1
  }

  /**
   * 根据索引删除字段
   */
  const removeComponent = (index: number) => {
    fields.value.splice(index, 1)
    // 处理选中索引的偏移
    if (selectedIndex.value === index) {
      selectedIndex.value = -1
    } else if (selectedIndex.value > index) {
      selectedIndex.value--
    }
    // 重新排序权重
    fields.value.forEach((f, i) => (f.sortOrder = i + 1))
  }

  /**
   * 根据 BID 删除字段
   */
  const removeFieldByBid = (bid: string) => {
    const index = fields.value.findIndex(f => f.bid === bid)
    if (index >= 0) {
      removeComponent(index)
    }
  }

  /**
   * 选中某个字段
   */
  const handleFieldSelect = (field: RawBusinessField) => {
    const index = fields.value.findIndex(f => f.bid === field.bid)
    selectedIndex.value = index
  }

  /**
   * 克隆一个现有字段
   */
  const cloneField = (bid: string) => {
    const index = fields.value.findIndex(f => f.bid === bid)
    if (index < 0) return
    
    const source = fields.value[index]
    const newAttributeNum = generateUniqueAttributeNum(source.attributeNum.split('_')[0])
    
    const newField: RawBusinessField = {
      ...JSON.parse(JSON.stringify(source)), // 深拷贝，防止修改影响原字段的 constraintInfo
      bid: Date.now().toString() + Math.random().toString().slice(2, 6),
      attributeNum: newAttributeNum,
      displayName: `${source.displayName} (副本)`
    }
    
    fields.value.splice(index + 1, 0, newField)
    // 统一更新权重
    fields.value.forEach((f, i) => (f.sortOrder = i + 1))
    selectedIndex.value = index + 1
  }

  /**
   * 移动字段位置 (上移/下移)
   */
  const moveField = (bid: string, direction: 'up' | 'down') => {
    const index = fields.value.findIndex(f => f.bid === bid)
    if (index < 0) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.value.length) return

    // 交换位置
    const temp = fields.value[index]
    fields.value[index] = fields.value[targetIndex]
    fields.value[targetIndex] = temp

    // 同步权重
    fields.value.forEach((f, i) => (f.sortOrder = i + 1))

    // 同步选中状态
    if (selectedIndex.value === index) {
      selectedIndex.value = targetIndex
    } else if (selectedIndex.value === targetIndex) {
      selectedIndex.value = index
    }
  }

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    if (fields.value.length === 0) return
    if (confirm('确定要清空所有字段吗？')) {
      fields.value = []
      selectedIndex.value = -1
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
   * 更新字段内容 (用于独立组件的 v-model 同步)
   */
  const updateField = (updatedField: RawBusinessField) => {
    const index = fields.value.findIndex(f => f.bid === updatedField.bid)
    if (index >= 0) {
      fields.value[index] = { ...updatedField }
    }
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
    updateField
  }
}

import { ref, computed, watch, type Ref } from 'vue'
import type { RawBusinessField, RawConstraint } from '../../../components/a-schema-form/types'

/**
 * 字段属性配置逻辑 Hook
 * 负责解析和更新选中字段的约束 (Constraint)、权限 (State) 和数据源 (DataSource)
 */
export const useFieldProperties = (selectedField: Ref<RawBusinessField | null>) => {
  // --- 状态定义 ---

  // 数据源类型: 静态枚举 或 远程 URL
  const dataSourceType = ref<'enum' | 'url'>('enum')
  // URL 路径
  const urlPath = ref('')
  // URL 返回对象中的 Value 字段名
  const urlValueKey = ref('')
  // URL 返回对象中的 Label 字段名
  const urlLabelKey = ref('')

  // --- 内部辅助方法 ---

  /**
   * 更新字段的约束 JSON 字符串
   * @param key 约束键名 (如 required, default_value, enum, url)
   * @param value 约束值
   */
  const updateConstraint = (key: string, value: any) => {
    if (!selectedField.value) return
    
    let constraints: RawConstraint[] = []
    try {
      constraints = JSON.parse(selectedField.value.constraintInfo || '[]')
    } catch (e) {
      constraints = []
    }

    const index = constraints.findIndex(c => c.key === key)
    if (index >= 0) {
      // 如果值为空，则移除该约束
      if (value === null || value === '' || (key === 'required' && value === 0)) {
        constraints.splice(index, 1)
      } else {
        constraints[index].value = value
      }
    } else if (value !== null && value !== '') {
      // 新增约束
      constraints.push({ 
        key, 
        value, 
        lableName: key === 'required' ? '必填' : key === 'enum' ? '枚举' : key === 'url' ? '数据源' : '默认值' 
      })
    }

    selectedField.value.constraintInfo = constraints.length > 0 ? JSON.stringify(constraints) : null
  }

  // --- 计算属性 (映射到 UI) ---

  /**
   * 是否必填
   */
  const isFieldRequired = computed({
    get: () => {
      if (!selectedField.value?.constraintInfo) return false
      try {
        const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
        return constraints.some(c => c.key === 'required' && c.value === 1)
      } catch {
        return false
      }
    },
    set: (val: boolean) => updateConstraint('required', val ? 1 : 0)
  })

  /**
   * 默认值
   */
  const fieldDefaultValue = computed({
    get: () => {
      if (!selectedField.value?.constraintInfo) return ''
      try {
        const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
        const found = constraints.find(c => c.key === 'default_value')
        return found ? String(found.value) : ''
      } catch {
        return ''
      }
    },
    set: (val: string) => updateConstraint('default_value', val)
  })

  /**
   * 静态枚举选项 (字符串形式，用 || 分隔)
   */
  const fieldEnumOptions = computed({
    get: () => {
      if (!selectedField.value?.constraintInfo) return ''
      try {
        const constraints = JSON.parse(selectedField.value.constraintInfo) as RawConstraint[]
        const found = constraints.find(c => c.key === 'enum')
        return found ? String(found.value) : ''
      } catch {
        return ''
      }
    },
    set: (val: string) => {
      updateConstraint('enum', val)
      if (val) updateConstraint('url', null) // 互斥处理
    }
  })

  // --- 监听器 ---

  /**
   * 监听选中字段切换，同步数据源 UI 状态
   */
  watch(selectedField, (newField) => {
    if (!newField) return
    try {
      const constraints = JSON.parse(newField.constraintInfo || '[]') as RawConstraint[]
      const urlConstraint = constraints.find(c => c.key === 'url')
      
      if (urlConstraint) {
        dataSourceType.value = 'url'
        const raw = String(urlConstraint.value)
        const [pathPart, keysPart] = raw.split(' / ')
        urlPath.value = pathPart || ''
        if (keysPart) {
          const [v, l] = keysPart.split('&')
          urlValueKey.value = v || ''
          urlLabelKey.value = l || ''
        }
      } else {
        dataSourceType.value = 'enum'
        urlPath.value = ''
        urlValueKey.value = ''
        urlLabelKey.value = ''
      }
    } catch {
      dataSourceType.value = 'enum'
    }
  }, { immediate: true })

  /**
   * 监听 URL 相关部件变化，实时合并回约束 JSON
   */
  watch([urlPath, urlValueKey, urlLabelKey], () => {
    if (dataSourceType.value === 'url' && urlPath.value) {
      const value = `${urlPath.value} / ${urlValueKey.value}&${urlLabelKey.value}`
      updateConstraint('url', value)
      updateConstraint('enum', null) // 互斥处理
    }
  })

  return {
    dataSourceType,
    urlPath,
    urlValueKey,
    urlLabelKey,
    isFieldRequired,
    fieldDefaultValue,
    fieldEnumOptions,
    updateConstraint
  }
}

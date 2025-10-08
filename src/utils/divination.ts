// 易经六爻占卜逻辑

/**
 * 摇铜钱结果类型
 * 三个铜钱的组合：
 * - 3个正面（阳）：老阳（9）变爻
 * - 2个正面1个反面：少阳（7）不变
 * - 1个正面2个反面：少阴（8）不变
 * - 3个反面（阴）：老阴（6）变爻
 */
export type CoinResult = 0 | 1 // 0=反面（阴），1=正面（阳）

export interface YaoResult {
  value: number // 6,7,8,9
  isYang: boolean // 是否为阳爻
  isChanging: boolean // 是否为变爻
  coins: CoinResult[] // 三个铜钱的结果
}

/**
 * 摇三个铜钱，返回一爻的结果
 */
export function shakeCoin(): YaoResult {
  // 随机生成三个铜钱的结果
  const coins: CoinResult[] = [
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0
  ]
  
  // 计算正面（阳）的数量
  const yangCount = coins.filter(c => c === 1).length
  
  let value: number
  let isYang: boolean
  let isChanging: boolean
  
  switch (yangCount) {
    case 3:
      // 三个正面：老阳（9）变爻，阳→阴
      value = 9
      isYang = true
      isChanging = true
      break
    case 2:
      // 两个正面：少阳（7）不变
      value = 7
      isYang = true
      isChanging = false
      break
    case 1:
      // 一个正面：少阴（8）不变
      value = 8
      isYang = false
      isChanging = false
      break
    case 0:
      // 零个正面：老阴（6）变爻，阴→阳
      value = 6
      isYang = false
      isChanging = true
      break
    default:
      value = 7
      isYang = true
      isChanging = false
  }
  
  return {
    value,
    isYang,
    isChanging,
    coins
  }
}

/**
 * 完整的六爻占卜结果
 */
export interface DivinationResult {
  yaos: YaoResult[] // 六爻结果（从下到上）
  mainHexagram: number[] // 本卦的爻象（1=阳，0=阴）
  changeHexagram?: number[] // 变卦的爻象（如果有变爻）
  hasChange: boolean // 是否有变爻
}

/**
 * 执行完整的六爻占卜（摇6次）
 */
export function performDivination(yaos: YaoResult[]): DivinationResult {
  // 计算本卦的爻象（从下到上）
  const mainHexagram = yaos.map(yao => yao.isYang ? 1 : 0)
  
  // 检查是否有变爻
  const hasChange = yaos.some(yao => yao.isChanging)
  
  // 如果有变爻，计算变卦
  let changeHexagram: number[] | undefined
  if (hasChange) {
    changeHexagram = yaos.map(yao => {
      if (yao.isChanging) {
        // 变爻：阳变阴，阴变阳
        return yao.isYang ? 0 : 1
      }
      return yao.isYang ? 1 : 0
    })
  }
  
  return {
    yaos,
    mainHexagram,
    changeHexagram,
    hasChange
  }
}

/**
 * 获取爻的中文名称
 */
export function getYaoName(yao: YaoResult): string {
  switch (yao.value) {
    case 9:
      return '老阳（变）'
    case 7:
      return '少阳'
    case 8:
      return '少阴'
    case 6:
      return '老阴（变）'
    default:
      return '未知'
  }
}

/**
 * 获取爻的符号
 */
export function getYaoSymbol(isYang: boolean): string {
  return isYang ? '━━━' : '━ ━'
}


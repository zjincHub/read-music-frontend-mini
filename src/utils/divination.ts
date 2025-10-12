// 易经六爻占卜逻辑

/**
 * 摇铜钱结果类型
 * 三个铜钱的组合：
 * - 3个正面（阳）：老阳（9）变爻
 * - 2个正面1个反面：少阳（7）不变
 * - 1个正面2个反面：少阴（8）不变
 * - 3个反面（阴）：老阴（6）变爻
 */
export type CoinResult = 0 | 1; // 0=反面（阴），1=正面（阳）

export interface YaoResult {
  value: number; // 6,7,8,9
  isYang: boolean; // 是否为阳爻
  isChanging: boolean; // 是否为变爻
  coins: CoinResult[]; // 三个铜钱的结果
}

/**
 * 摇三个铜钱，返回一爻的结果
 */
export function shakeCoin(): YaoResult {
  // 随机生成三个铜钱的结果
  const coins: CoinResult[] = [
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
  ];

  // 计算正面（阳）的数量
  const yangCount = coins.filter((c) => c === 1).length;

  let value: number;
  let isYang: boolean;
  let isChanging: boolean;

  switch (yangCount) {
    case 3:
      // 三个正面：老阴（6）变爻，阴→阳
      value = 6;
      isYang = false;
      isChanging = true;
      break;
    case 2:
      // 两个正面：少阳（7）不变
      value = 7;
      isYang = true;
      isChanging = false;
      break;
    case 1:
      // 一个正面：少阴（8）不变
      value = 8;
      isYang = false;
      isChanging = false;
      break;
    case 0:
      // 零个正面：老阳（9）变爻，阳→阴
      value = 6;
      isYang = true;
      isChanging = true;
      break;
    default:
      value = 7;
      isYang = true;
      isChanging = false;
  }

  return {
    value,
    isYang,
    isChanging,
    coins,
  };
}

/**
 * 完整的六爻占卜结果
 */
export interface DivinationResult {
  yaos: YaoResult[]; // 六爻结果（从下到上）
  mainHexagram: number[]; // 本卦的爻象（1=阳，0=阴）
  changeHexagram?: number[]; // 变卦的爻象（如果有变爻）
  hasChange: boolean; // 是否有变爻
}

/**
 * 执行完整的六爻占卜（摇6次）
 */
export function performDivination(yaos: YaoResult[]): DivinationResult {
  // 计算本卦的爻象（从下到上）
  const mainHexagram = yaos.map((yao) => (yao.isYang ? 1 : 0));

  // 检查是否有变爻
  const hasChange = yaos.some((yao) => yao.isChanging);

  // 如果有变爻，计算变卦
  let changeHexagram: number[] | undefined;
  if (hasChange) {
    changeHexagram = yaos.map((yao) => {
      if (yao.isChanging) {
        // 变爻：阳变阴，阴变阳
        return yao.isYang ? 0 : 1;
      }
      return yao.isYang ? 1 : 0;
    });
  }

  return {
    yaos,
    mainHexagram,
    changeHexagram,
    hasChange,
  };
}

/**
 * 获取爻的中文名称
 */
export function getYaoName(yao: YaoResult): string {
  switch (yao.value) {
    case 9:
      return "老阳（变）";
    case 7:
      return "少阳";
    case 8:
      return "少阴";
    case 6:
      return "老阴（变）";
    default:
      return "未知";
  }
}

/**
 * 计算卦辞的函数
 */
export function calculateHexagramText(
  yaos: YaoResult[],
  mainHexagram: { judgment: string; yaoTexts: string[]; name: string },
  changeHexagram?: { judgment: string; yaoTexts: string[] },
): string[] {
  // 计算变爻数量
  const changingCount = yaos.filter((yao) => yao.isChanging).length;

  if (changingCount === 0) {
    // 6爻不变，取本卦的卦辞
    return [mainHexagram.judgment];
  } else if (changingCount === 1) {
    // 1爻变，取本卦中这个变爻的爻辞
    const changingYaoIndex = yaos.findIndex((yao) => yao.isChanging);
    return [mainHexagram.yaoTexts[changingYaoIndex]];
  } else if (changingCount === 2) {
    // 2爻变，取本卦中这两个变爻的爻辞，以靠上爻的爻辞为主
    const changingYaoIndices = yaos
      .map((yao, index) => ({ yao, index }))
      .filter(({ yao }) => yao.isChanging)
      .map(({ index }) => index);
    const upperYaoIndex = Math.max(...changingYaoIndices);
    const lowerYaoIndex = Math.min(...changingYaoIndices);
    return [
      mainHexagram.yaoTexts[upperYaoIndex],
      mainHexagram.yaoTexts[lowerYaoIndex],
    ];
  } else if (changingCount === 3) {
    // 3爻变，取本卦和变卦的卦辞
    return [mainHexagram.judgment, changeHexagram?.judgment as string];
  } else if (changingCount === 4) {
    // 4爻变，取变卦中两个不变爻的爻辞，以靠下爻的爻辞为主
    const unchangedYaoIndices = yaos
      .map((yao, index) => ({ yao, index }))
      .filter(({ yao }) => !yao.isChanging)
      .map(({ index }) => index);
    const upperYaoIndex = Math.max(...unchangedYaoIndices);
    const lowerYaoIndex = Math.min(...unchangedYaoIndices);
    return [
      changeHexagram?.yaoTexts[lowerYaoIndex] as string,
      changeHexagram?.yaoTexts[upperYaoIndex] as string,
    ];
  } else if (changingCount === 5) {
    // 5爻变，取变卦中不变爻的爻辞
    const unchangedYaoIndex = yaos.findIndex((yao) => !yao.isChanging);
    return [changeHexagram?.yaoTexts[unchangedYaoIndex] as string];
  } else if (changingCount === 6) {
    // 6爻变，如果是"乾"、"坤"就用它们的第7个爻辞，其他卦则取变卦的卦辞
    if (mainHexagram.name === "乾为天") {
      return [mainHexagram.yaoTexts[6]];
    } else if (mainHexagram.name === "坤为地") {
      return [mainHexagram.yaoTexts[6]];
    } else {
      return [changeHexagram?.judgment as string];
    }
  }

  return [mainHexagram.judgment as string];
}

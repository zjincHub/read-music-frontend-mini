import Taro from "@tarojs/taro";
import { useState } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import CoinFront from "../../assets/images/coin-front.png";
import CoinBack from "../../assets/images/coin-back.png";
import { getHexagramByLines, Hexagram } from "../../data/hexagrams";
import {
  shakeCoin,
  performDivination,
  YaoResult,
  calculateHexagramText,
} from "../../utils/divination";
import "./index.scss";

function Index() {
  const [yaos, setYaos] = useState<YaoResult[]>([]); // 已经摇出的爻
  const [currentShake, setCurrentShake] = useState(0); // 当前摇的次数（0-5）
  const [isShaking, setIsShaking] = useState(false); // 是否正在摇
  const [showResult, setShowResult] = useState(false); // 是否显示结果
  const [hexagram, setHexagram] = useState<Hexagram | null>(null); // 卦象
  const [changeHexagram, setChangeHexagram] = useState<Hexagram | null>(null); // 变卦
  const [calculatedTextList, setCalculatedTextList] = useState<string[]>([]); // 计算出的卦辞

  // 摇铜钱
  const handleShake = () => {
    if (isShaking || currentShake >= 6) return;

    setIsShaking(true);

    // 震动反馈
    Taro.vibrateShort();

    // 模拟摇铜钱的动画延迟
    setTimeout(() => {
      const yaoResult = shakeCoin();
      const newYaos = [...yaos, yaoResult];
      setYaos(newYaos);
      setCurrentShake(currentShake + 1);
      setIsShaking(false);
    }, 600);
  };

  // 解卦
  const handleResolveHexagram = () => {
    setIsShaking(true);
    // 计算并设置卦象
    const divination = performDivination(yaos);
    const foundHexagram = getHexagramByLines(divination.mainHexagram);
    setHexagram(foundHexagram);

    let foundChangeHexagram: Hexagram | null = null;
    // 如果有变卦，则设置变卦
    if (divination.hasChange) {
      foundChangeHexagram = getHexagramByLines(
        divination.changeHexagram as number[],
      );
      setChangeHexagram(foundChangeHexagram);
    }

    // 计算卦辞
    if (foundHexagram) {
      const textList = calculateHexagramText(
        yaos,
        foundHexagram,
        foundChangeHexagram || undefined,
      );
      setCalculatedTextList(textList);
    }

    // 延迟显示结果页面
    setTimeout(() => {
      setShowResult(true);
      setIsShaking(false);
    }, 500);
  };

  // 计算按钮文本
  const getButtonText = () => {
    if (isShaking && currentShake < 6) {
      return " 摇铜钱中...";
    } else if (isShaking && currentShake === 6) {
      return " 正在解卦...";
    } else if (currentShake === 0) {
      return "开始占卜";
    } else if (currentShake === 6) {
      return "解卦";
    } else {
      return `摇第 ${currentShake + 1} 次`;
    }
  };

  // 重新开始
  const handleReset = () => {
    setYaos([]);
    setCurrentShake(0);
    setIsShaking(false);
    setShowResult(false);
    setHexagram(null);
    setChangeHexagram(null);
    setCalculatedTextList([]);
  };

  // 渲染铜钱
  const renderCoins = (coins: (0 | 1)[]) => {
    return (
      <View className="coins-container">
        {coins.map((coin, index) => (
          <View
            key={index}
            className={`coin ${isShaking && currentShake < 6 ? "shaking" : ""}`}
          >
            <Image
              src={coin === 1 ? CoinFront : CoinBack}
              className="coin-image"
              mode="aspectFit"
            />
          </View>
        ))}
      </View>
    );
  };

  // 结果页面
  if (showResult && hexagram) {
    return (
      <View className="result-page">
        {/* 本卦 */}
        <View className="hexagram-container">
          <View className="hexagram-label">本卦</View>
          <View className="hexagram-name">{hexagram.name}</View>
          <View className="hexagram-number">第{hexagram.number}卦</View>

          <View className="hexagram-lines">
            {yaos
              .slice()
              .reverse()
              .map((yao, index) => (
                <View key={index} className="yao-line">
                  {getYaoSymbolResult(yao.isYang, yao.isChanging)}
                </View>
              ))}
          </View>

          <View className="hexagram-info">
            <View className="info-item">
              <Text className="info-label">上卦：</Text>
              <Text className="info-value">{hexagram.upperTrigram}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">下卦：</Text>
              <Text className="info-value">{hexagram.lowerTrigram}</Text>
            </View>
          </View>
        </View>

        {/* 变卦 */}
        {changeHexagram && (
          <View className="hexagram-container">
            <View className="hexagram-label">变卦</View>
            <View className="hexagram-name">{changeHexagram.name}</View>
            <View className="hexagram-number">第{changeHexagram.number}卦</View>

            <View className="hexagram-lines">
              {yaos
                .slice()
                .reverse()
                .map((yao, index) => (
                  <View key={index} className="yao-line">
                    {getChangeYaoSymbolResult(yao.isYang, yao.isChanging)}
                  </View>
                ))}
            </View>

            <View className="hexagram-info">
              <View className="info-item">
                <Text className="info-label">上卦：</Text>
                <Text className="info-value">
                  {changeHexagram.upperTrigram}
                </Text>
              </View>
              <View className="info-item">
                <Text className="info-label">下卦：</Text>
                <Text className="info-value">
                  {changeHexagram.lowerTrigram}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="hexagram-detail">
          <View className="detail-section">
            {calculatedTextList.length === 2 && (
              <View>
                <Text className="section-title">卦辞（主）</Text>
                <Text className="section-content">{calculatedTextList[0]}</Text>
                <Text className="section-title" style={{ marginTop: "20px" }}>
                  卦辞（副）
                </Text>
                <Text className="section-content">{calculatedTextList[1]}</Text>
              </View>
            )}
            {calculatedTextList.length === 1 && (
              <View>
                <Text className="section-title">卦辞</Text>
                <Text className="section-content">{calculatedTextList[0]}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="result-actions">
          <Button
            className="result-button"
            type="primary"
            onClick={handleReset}
          >
            再占一卦
          </Button>
        </View>
      </View>
    );
  }

  // 摇卦页面
  return (
    <View className="index-page">
      <View className="progress-container">
        <View className="progress-text">
          {currentShake === 0 ? "准备开始" : `第 ${currentShake} 爻`}
          <Text className="progress-tip"> / 共6爻</Text>
        </View>
        <View className="progress-bar">
          <View
            className="progress-fill"
            style={{ width: `${(currentShake / 6) * 100}%` }}
          />
        </View>
      </View>

      <View className="shake-container">
        <View className="instruction">
          <Text className="instruction-text">
            {currentShake === 0
              ? "点击下方按钮，摇三枚铜钱"
              : currentShake === 6
                ? "点击下方按钮，解卦"
                : "继续摇铜钱"}
          </Text>
        </View>

        <Button
          type="primary"
          className="shake-button"
          onClick={() => {
            if (currentShake < 6) {
              handleShake();
            } else {
              handleResolveHexagram();
            }
          }}
          disabled={isShaking}
          loading={isShaking}
        >
          {getButtonText()}
        </Button>

        {currentShake > 0 && (
          <Button
            className="reset-button"
            onClick={handleReset}
            disabled={isShaking}
          >
            重新开始
          </Button>
        )}
      </View>

      {currentShake > 0 && (
        <View className="yaos-display">
          <View className="yaos-title">已得爻象（从下往上）</View>
          <View className="yaos-list">
            {yaos
              .slice()
              .reverse()
              .map((yao, index) => (
                <View key={index} className="yao-item">
                  <View className="yao-index">第 {yaos.length - index} 爻</View>
                  {getYaoSymbol(yao.isYang, yao.isChanging)}
                  {renderCoins(yao.coins)}
                </View>
              ))}
          </View>
        </View>
      )}

      <View className="tips">
        <View className="tips-title">占卜说明</View>
        <View className="tips-content">
          <Text>• 共需摇铜钱6次，每次摇3枚铜钱</Text>
          <Text>• 三个正面为老阴，三个反面为老阳</Text>
          <Text>• 两个正面为少阳，一个正面为少阴</Text>
          <Text>• 从下往上依次形成六爻，最终得出卦象</Text>
        </View>
      </View>
    </View>
  );
}

// 获取爻的符号组件
const getYaoSymbol = (isYang: boolean, isChanging: boolean = false) => {
  if (isYang && !isChanging) {
    // 少阳
    return (
      <div className="yao-symbol-container">
        <div className="yao-symbol-yang"></div>
      </div>
    );
  } else if (isYang && isChanging) {
    // 老阳
    return (
      <div className="yao-symbol-container">
        <div className="yao-symbol-yang"></div>
        <div className="yao-symbol-changing"></div>
      </div>
    );
  } else if (!isYang && !isChanging) {
    // 少阴
    return (
      <div className="yao-symbol-container">
        <div className="yao-symbol-yin-1"></div>
        <div className="yao-symbol-yin-2"></div>
      </div>
    );
  } else {
    // 老阴
    return (
      <div className="yao-symbol-container">
        <div className="yao-symbol-yin-1"></div>
        <div className="yao-symbol-yin-2"></div>
        <div className="yao-symbol-changing"></div>
      </div>
    );
  }
};

// 获取爻的符号组件
const getYaoSymbolResult = (isYang: boolean, isChanging: boolean = false) => {
  if (isYang && !isChanging) {
    // 少阳
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yang"></div>
      </div>
    );
  } else if (isYang && isChanging) {
    // 老阳
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yang"></div>
        <div className="yao-symbol-changing"></div>
      </div>
    );
  } else if (!isYang && !isChanging) {
    // 少阴
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yin-1"></div>
        <div className="yao-symbol-yin-2"></div>
      </div>
    );
  } else {
    // 老阴
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yin-1"></div>
        <div className="yao-symbol-yin-2"></div>
        <div className="yao-symbol-changing"></div>
      </div>
    );
  }
};

// 获取变卦的爻的符号组件
const getChangeYaoSymbolResult = (
  isYang: boolean,
  isChanging: boolean = false,
) => {
  if ((isYang && !isChanging) || (!isYang && isChanging)) {
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yang"></div>
      </div>
    );
  } else {
    return (
      <div className="yao-symbol-result-container">
        <div className="yao-symbol-yin-1"></div>
        <div className="yao-symbol-yin-2"></div>
      </div>
    );
  }
};

export default Index;

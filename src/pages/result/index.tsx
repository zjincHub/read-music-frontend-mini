import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import { ResultData } from "../../data/hexagrams";
import "./index.scss";

function Result() {
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    // 从路由参数中获取数据
    const router = Taro.getCurrentInstance().router;
    if (router?.params?.data) {
      try {
        const data = JSON.parse(decodeURIComponent(router.params.data));
        setResultData(data);
      } catch (error) {
        console.error("解析结果数据失败:", error);
        Taro.showToast({
          title: "数据解析失败",
          icon: "error",
        });
      }
    }
  }, []);

  // 重新开始
  const handleReset = () => {
    Taro.navigateBack();
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

  if (!resultData) {
    return (
      <View className="result-page">
        <View className="loading-container">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const { yaos, hexagram, changeHexagram, aiResult, userInput } = resultData;

  return (
    <View className="result-page">
      {/* 显示所求何事 */}
      {userInput && (
        <View className="user-question-display">
          <Text className="user-question-label">所求何事：</Text>
          <Text className="user-question-text">{userInput}</Text>
        </View>
      )}

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
              <Text className="info-value">{changeHexagram.upperTrigram}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">下卦：</Text>
              <Text className="info-value">{changeHexagram.lowerTrigram}</Text>
            </View>
          </View>
        </View>
      )}

      <View className="hexagram-detail">
        {/* AI 解卦结果 */}
        {aiResult && (
          <View className="detail-section">
            <Text className="section-title">卦辞/爻辞</Text>
            <Text className="section-content">
              {aiResult?.hexagramAnalysis}
            </Text>
            <Text className="section-title" style={{ marginTop: "20px" }}>
              卦辞/爻辞（解释）
            </Text>
            <Text className="section-content">
              {aiResult?.hexagramDescription}
            </Text>
            <Text className="section-title" style={{ marginTop: "20px" }}>
              解卦结果
            </Text>
            <Text className="section-content">{aiResult?.result}</Text>
          </View>
        )}
      </View>

      <View className="result-actions">
        <Button className="result-button" type="primary" onClick={handleReset}>
          再占一卦
        </Button>
      </View>
    </View>
  );
}

export default Result;

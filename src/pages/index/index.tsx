import Taro from "@tarojs/taro";
import { useState } from "react";
import { View, Text, Button, Image, Textarea } from "@tarojs/components";
import CoinFront from "../../assets/images/coin-front.png";
import CoinBack from "../../assets/images/coin-back.png";
import { getHexagramByLines, Hexagram } from "../../data/hexagrams";
import { callCozeAPI, buildCozeInput } from "../../utils/coze";
import {
  shakeCoin,
  performDivination,
  YaoResult,
} from "../../utils/divination";
import "./index.scss";

function Index() {
  const [yaos, setYaos] = useState<YaoResult[]>([]); // 已经摇出的爻
  const [currentShake, setCurrentShake] = useState(0); // 当前摇的次数
  const [isShaking, setIsShaking] = useState(false); // 是否正在摇或者解卦
  const [showInputModal, setShowInputModal] = useState(false); // 显示输入弹窗
  const [userInput, setUserInput] = useState(""); // 用户输入
  const [tempInput, setTempInput] = useState(""); // 临时输入

  // 开始占卜前的检查
  const handleStartDivination = () => {
    if (!userInput.trim()) {
      // 显示自定义输入弹窗
      setTempInput("");
      setShowInputModal(true);
      return;
    }
    handleShake();
  };

  // 确认输入
  const handleConfirmInput = () => {
    if (tempInput.trim()) {
      setUserInput(tempInput.trim());
      setShowInputModal(false);
      handleShake();
    } else {
      Taro.showToast({
        title: "请输入所求之事",
        icon: "none",
      });
    }
  };

  // 取消输入
  const handleCancelInput = () => {
    setShowInputModal(false);
    setTempInput("");
  };

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
  const handleResolveHexagram = async () => {
    setIsShaking(true);

    try {
      // 计算并设置卦象
      const divination = performDivination(yaos);
      const foundHexagram = getHexagramByLines(divination.mainHexagram);

      let foundChangeHexagram: Hexagram | null = null;
      // 如果有变卦，则设置变卦
      if (divination.hasChange) {
        foundChangeHexagram = getHexagramByLines(
          divination.changeHexagram as number[],
        );
      }

      // 构建 Coze API 的输入参数
      const changeYaoNumbers = yaos
        .map((yao, index) => (yao.isChanging ? index + 1 : null))
        .filter((num) => num !== null) as number[];

      const inputText = buildCozeInput(
        userInput,
        foundHexagram?.number || 0,
        foundHexagram?.name || "",
        changeYaoNumbers,
      );

      // 调用 Coze API 进行 AI 解卦
      const aiResultObject = await callCozeAPI(inputText);

      // 准备结果数据
      const resultData = {
        yaos,
        hexagram: foundHexagram,
        changeHexagram: foundChangeHexagram,
        aiResult: aiResultObject,
        userInput: userInput, // 添加用户输入
      };

      // 跳转到结果页面
      Taro.navigateTo({
        url: `/pages/result/index?data=${encodeURIComponent(JSON.stringify(resultData))}`,
      });

      // 重置状态
      handleReset();
    } catch (error) {
      console.error("解卦失败:", error);
      Taro.showToast({
        title: "解卦失败",
        icon: "error",
      });
    } finally {
      setIsShaking(false);
    }
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
    setUserInput(""); // 清空用户输入
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

      {/* 显示所求之事 */}
      {userInput && (
        <View className="user-input-display">
          <Text className="user-input-label">所之何事：</Text>
          <Text className="user-input-text">{userInput}</Text>
        </View>
      )}

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
            if (currentShake === 0) {
              handleStartDivination();
            } else if (currentShake < 6) {
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

      {/* 自定义输入弹窗 */}
      {showInputModal && (
        <View className="modal-overlay" onClick={handleCancelInput}>
          <View
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="modal-header">
              <Text className="modal-title">所求之事</Text>
            </View>
            <View className="modal-body">
              <Text className="modal-description">请输入您想要占卜的问题</Text>
              <Textarea
                className="modal-textarea"
                placeholder="请输入所求之事"
                value={tempInput}
                onInput={(e) => setTempInput(e.detail.value)}
                focus={showInputModal}
                maxlength={200}
                showConfirmBar={false}
                autoHeight={false}
                fixed={false}
              />
            </View>
            <View className="modal-footer">
              <Text className="modal-button cancel" onClick={handleCancelInput}>
                取消
              </Text>
              <Text
                className="modal-button confirm"
                onClick={handleConfirmInput}
              >
                确认
              </Text>
            </View>
          </View>
        </View>
      )}
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

export default Index;

import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { Hexagram } from "../../data/hexagrams";
import "./index.scss";

function Detail() {
  // 从页面参数获取卦象数据
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;

    if (options.hexagramData) {
      try {
        const hexagramData = JSON.parse(
          decodeURIComponent(options.hexagramData),
        );
        setHexagram(hexagramData);
      } catch (error) {
        console.error("解析卦象数据失败:", error);
        Taro.showToast({
          title: "数据错误",
          icon: "error",
        });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    }
  }, []);

  // 渲染卦象符号
  const renderHexagramSymbol = (binary: string) => {
    const lines = binary.split("").reverse(); // 从下往上显示
    return (
      <View className="hexagram-symbol">
        {lines.map((line, index) => (
          <View
            key={index}
            className={`hexagram-line ${line === "1" ? "yang" : "yin"}`}
          >
            {line === "1" ? (
              <View className="yang-line" />
            ) : (
              <View className="yin-line">
                <View className="yin-part" />
                <View className="yin-part" />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  // 渲染爻辞
  const renderYaoTexts = (yaoTexts: string[]) => {
    return yaoTexts.map((text, index) => (
      <View key={index} className="yao-text-item">
        <Text className="yao-text">{text}</Text>
      </View>
    ));
  };

  if (!hexagram) {
    return (
      <View className="detail-page loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className="detail-page">
      {/* 头部信息 */}
      <View className="header">
        <View className="hexagram-info">
          <View className="hexagram-symbol-large">
            {renderHexagramSymbol(hexagram.binary)}
          </View>
          <View className="hexagram-details">
            <Text className="hexagram-name">{hexagram.name}</Text>
            <Text className="hexagram-number">第{hexagram.number}卦</Text>
            <Text className="hexagram-description">{hexagram.description}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="content" scrollY>
        {/* 卦辞 */}
        <View className="section">
          <View className="section-title">
            <Text>卦辞</Text>
          </View>
          <View className="section-content">
            <Text className="judgment-text">{hexagram.judgment}</Text>
          </View>
        </View>

        {/* 六爻爻辞 */}
        <View className="section">
          <View className="section-title">
            <Text>六爻爻辞</Text>
          </View>
          <View className="section-content">
            <View className="yao-texts">
              {renderYaoTexts(hexagram.yaoTexts)}
            </View>
          </View>
        </View>

        {/* 卦象组成 */}
        <View className="section">
          <View className="section-title">
            <Text>卦象组成</Text>
          </View>
          <View className="section-content">
            <View className="trigram-info">
              <View className="trigram-item">
                <Text className="trigram-label">上卦：</Text>
                <Text className="trigram-name">{hexagram.upperTrigram}</Text>
              </View>
              <View className="trigram-item">
                <Text className="trigram-label">下卦：</Text>
                <Text className="trigram-name">{hexagram.lowerTrigram}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Detail;

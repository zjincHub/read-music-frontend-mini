import Taro from "@tarojs/taro";
import { useState, useMemo } from "react";
import { View, Text, Input, Image } from "@tarojs/components";
import { hexagrams, Hexagram } from "../../data/hexagrams";
import SearchIcon from "../../assets/icons/search.png";
import "./index.scss";

function Query() {
  const [searchText, setSearchText] = useState("");

  // 过滤卦象数据
  const filteredHexagrams = useMemo(() => {
    if (!searchText.trim()) {
      return hexagrams;
    }
    return hexagrams.filter(
      (hexagram) =>
        hexagram.name.includes(searchText) ||
        hexagram.description.includes(searchText) ||
        hexagram.judgment.includes(searchText),
    );
  }, [searchText]);

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

  // 点击卦象
  const handleHexagramClick = (hexagram: Hexagram) => {
    Taro.navigateTo({
      url: `/pages/detail/index?hexagramData=${encodeURIComponent(JSON.stringify(hexagram))}`,
    });
  };

  return (
    <View className="query-page">
      {/* 搜索栏 */}
      <View className="search-container">
        <View className="search-bar">
          <View className="search-icon">
            <Image src={SearchIcon} mode="widthFix" />
          </View>
          <Input
            className="search-input"
            placeholder="查卦"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      {/* 卦象网格 */}
      <View className="hexagram-grid">
        <View className="grid-container">
          {filteredHexagrams.map((hexagram) => (
            <View
              key={hexagram.number}
              className="hexagram-item"
              onClick={() => handleHexagramClick(hexagram)}
            >
              {renderHexagramSymbol(hexagram.binary)}
              <Text className="hexagram-name">{hexagram.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default Query;

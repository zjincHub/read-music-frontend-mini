import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { ResultData } from "../../data/hexagrams";
import "./index.scss";

function Mine() {
  const [records, setRecords] = useState<ResultData[]>([]);

  // 加载占卜记录
  const loadRecords = () => {
    try {
      const storedRecords = Taro.getStorageSync("divinationRecords") || [];
      setRecords(storedRecords);
    } catch (error) {
      console.error("加载占卜记录失败:", error);
    }
  };

  // 每次页面显示时重新加载记录
  useDidShow(loadRecords);

  // 查看占卜详情
  const viewRecord = (record: ResultData) => {
    Taro.navigateTo({
      url: `/pages/result/index?data=${encodeURIComponent(JSON.stringify(record))}`,
    });
  };

  // 删除占卜记录
  const deleteRecord = (id: string) => {
    Taro.showModal({
      title: "确认删除",
      content: "确定要删除这条占卜记录吗？",
      success: (res) => {
        if (res.confirm) {
          try {
            const updatedRecords = records.filter((record) => record.id !== id);
            Taro.setStorageSync("divinationRecords", updatedRecords);
            setRecords(updatedRecords);
            Taro.showToast({
              title: "删除成功",
              icon: "success",
            });
          } catch (error) {
            console.error("删除记录失败:", error);
            Taro.showToast({
              title: "删除失败",
              icon: "error",
            });
          }
        }
      },
    });
  };

  return (
    <View className="mine-page">
      {records.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-text">暂无占卜记录</Text>
          <Text className="empty-tip">去首页开始您的第一次占卜吧</Text>
        </View>
      ) : (
        <View className="records-list">
          {records.map((record) => (
            <View key={record.id} className="record-card">
              <View className="record-header">
                <Text className="record-time">{record.dateTime}</Text>
                <Text
                  className="delete-btn"
                  onClick={() => deleteRecord(record.id)}
                >
                  删除
                </Text>
              </View>
              <View className="record-content">
                <Text className="record-question">{record.userInput}</Text>
                <Text className="record-hexagram">
                  {record.hexagram?.name}{" "}
                  {record.changeHexagram
                    ? `→ ${record.changeHexagram.name}`
                    : ""}
                </Text>
              </View>
              <View className="record-actions">
                <Text className="view-btn" onClick={() => viewRecord(record)}>
                  查看详情
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default Mine;

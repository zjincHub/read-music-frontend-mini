import { useEffect, useRef, useState } from "react";
import { View, Text, Button, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { API_BASE_URL } from "../../config";
import type { TaskItem } from "./types";
import "./index.scss";

export default function ChordRecognition() {
  const [status, setStatus] = useState("请录制音频进行识别...");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<TaskItem[]>([]);
  const [audioUrl, setAudioUrl] = useState("");

  const recorderManager = useRef<any>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useDidShow(() => {
    fetchHistory();
    startPolling();
  });

  useEffect(() => {
    recorderManager.current = Taro.getRecorderManager();
    recorderManager.current.onStart(() => {
      setIsRecording(true);
      setStatus("正在录制...");
    });
    recorderManager.current.onStop((res) => {
      setIsRecording(false);
      setStatus("录音已完成。");
      setAudioUrl(res.tempFilePath);
    });

    return () => stopPolling();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/tasks`,
        method: "GET",
      });
      if (res.statusCode === 200) {
        setHistory(res.data);
        // Check if polling is needed
        const hasProcessing = (res.data as TaskItem[]).some(
          (t) => t.status === "pending" || t.status === "processing",
        );
        if (!hasProcessing) stopPolling();
      }
    } catch (err) {
      console.error("Fetch history failed", err);
    }
  };

  const startPolling = () => {
    if (pollingTimerRef.current) return;
    pollingTimerRef.current = setInterval(fetchHistory, 5000);
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const startRecord = () => {
    if (isRecording) {
      recorderManager.current.stop();
    } else {
      recorderManager.current.start({
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: "wav",
      });
    }
  };

  const submitTask = () => {
    if (!audioUrl) return;
    setIsSubmitting(true);
    Taro.uploadFile({
      url: `${API_BASE_URL}/api/analyze-chords`,
      filePath: audioUrl,
      name: "file",
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.status === "success") {
          Taro.showToast({ title: "任务已提交", icon: "success" });
          setAudioUrl("");
          fetchHistory();
          startPolling();
        } else {
          Taro.showToast({ title: data.message || "提交失败", icon: "none" });
        }
      },
      fail: (err) => {
        Taro.showToast({ title: "网络请求失败", icon: "none" });
      },
      complete: () => setIsSubmitting(false),
    });
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const getStatusText = (_status: string) => {
    switch (_status) {
      case "pending":
        return "⏳ 排队中";
      case "processing":
        return "⚙️ 处理中";
      case "success":
        return "✅ 已完成";
      case "failed":
        return "❌ 失败";
      default:
        return _status;
    }
  };

  return (
    <View className="chord-page">
      <View className="container">
        <Text className="title">🎵 AI 和弦识别项目</Text>

        <View className="recorder-section">
          <Button
            className={`btn ${isRecording ? "recording" : ""}`}
            onClick={startRecord}
          >
            {isRecording ? "停止录制" : "开始录音"}
          </Button>

          {audioUrl && !isRecording && (
            <Button
              className="btn analyze"
              loading={isSubmitting}
              onClick={submitTask}
            >
              提交分析任务
            </Button>
          )}
          <Text className="status-text">{status}</Text>
        </View>

        <View className="history-section">
          <Text className="section-title">分简历史记录</Text>
          <ScrollView scrollY className="history-list">
            {history.map((item) => (
              <View
                key={item.id}
                className="history-item"
                onClick={() => item.status === "success" && goToDetail(item.id)}
              >
                <View className="item-info">
                  <Text className="item-name">{item.filename}</Text>
                  <Text className="item-date">
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
                <Text className={`item-status ${item.status}`}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            ))}
            {history.length === 0 && (
              <Text className="empty-text">计划暂无记录</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

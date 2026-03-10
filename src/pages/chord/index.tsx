import { useEffect, useRef, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import TimelineEditor from "./TimelineEditor";
import { PX_PER_SEC } from "./constants";
import type { AnalyzeChordResponse, ChordSegment } from "./types";
import { getEditorHeight, getTimelineWidth } from "./utils";
import "./index.scss";

export default function ChordRecognition() {
  const [status, setStatus] = useState("请录制音频进行识别...");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chords, setChords] = useState<ChordSegment[]>([]);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [accompUrl, setAccompUrl] = useState("");
  const [isPlayingAccomp, setIsPlayingAccomp] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(375);

  // 用 ref 保存实时状态，避免高频更新触发依赖循环
  const isScrubbingRef = useRef(false);
  const scrollLeftRef = useRef(0);
  const playbackSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const wasPlayingOriginalRef = useRef(false);
  const wasPlayingAccompRef = useRef(false);

  // 音频上下文
  const innerAudioContext = useRef<any>(null); // 纯伴奏
  const originalAudioContext = useRef<any>(null); // 原始录音
  const recorderManager = useRef<any>(null);

  useEffect(() => {
    if (audioUrl && originalAudioContext.current) {
      originalAudioContext.current.src = audioUrl;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (accompUrl && innerAudioContext.current) {
      innerAudioContext.current.src = accompUrl;
    }
  }, [accompUrl]);

  useEffect(() => {
    const sysInfo = Taro.getSystemInfoSync();
    setScreenWidth(sysInfo.windowWidth);

    innerAudioContext.current = Taro.createInnerAudioContext();
    innerAudioContext.current.onEnded(() => {
      setIsPlayingAccomp(false);
    });

    originalAudioContext.current = Taro.createInnerAudioContext();
    originalAudioContext.current.onEnded(() => {
      setIsPlayingOriginal(false);
    });

    recorderManager.current = Taro.getRecorderManager();
    recorderManager.current.onStart(() => {
      setIsRecording(true);
      if (isPlayingOriginal) {
        originalAudioContext.current.pause();
        setIsPlayingOriginal(false);
      }
      if (isPlayingAccomp) {
        innerAudioContext.current.pause();
        setIsPlayingAccomp(false);
      }
      setStatus("正在录制... (由于包含人声，分析时将会自动剔除)");
    });

    recorderManager.current.onStop((res) => {
      setIsRecording(false);
      setStatus("录音已完成。");
      setAudioUrl(res.tempFilePath);
    });

    recorderManager.current.onError((err) => {
      setIsRecording(false);
      setStatus("录音失败: " + err.errMsg);
    });

    return () => {
      innerAudioContext.current?.destroy();
      originalAudioContext.current?.destroy();
      if (playbackSyncTimerRef.current) {
        clearInterval(playbackSyncTimerRef.current);
        playbackSyncTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const activeAudioContext = isPlayingOriginal
      ? originalAudioContext.current
      : isPlayingAccomp
        ? innerAudioContext.current
        : null;

    if (playbackSyncTimerRef.current) {
      clearInterval(playbackSyncTimerRef.current);
      playbackSyncTimerRef.current = null;
    }

    if (!activeAudioContext) return;

    playbackSyncTimerRef.current = setInterval(() => {
      if (isScrubbingRef.current) return;
      const nextScrollLeft = activeAudioContext.currentTime * PX_PER_SEC;
      scrollLeftRef.current = nextScrollLeft;
      setScrollLeft(nextScrollLeft);
    }, 33);

    return () => {
      if (playbackSyncTimerRef.current) {
        clearInterval(playbackSyncTimerRef.current);
        playbackSyncTimerRef.current = null;
      }
    };
  }, [isPlayingOriginal, isPlayingAccomp]);

  const stopAllPlayback = () => {
    if (isPlayingAccomp) {
      innerAudioContext.current.stop();
      setIsPlayingAccomp(false);
    }
    if (isPlayingOriginal) {
      originalAudioContext.current.stop();
      setIsPlayingOriginal(false);
    }
  };

  const startRecord = () => {
    if (isRecording) {
      recorderManager.current.stop();
      return;
    }

    // 调用 start 时会触发录音权限申请
    recorderManager.current.start({
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: "wav",
    });
  };

  const analyzeAudio = () => {
    if (!audioUrl) {
      Taro.showToast({ title: "请先录制音频", icon: "none" });
      return;
    }

    setIsLoading(true);
    setStatus("正在使用 Demucs 剥离人声并分析色谱图 (约需数十秒)...");
    setChords([]);
    setWaveform([]);
    setAccompUrl("");
    stopAllPlayback();

    // 生产环境需要替换为真实后端地址
    const backendUrl = "http://127.0.0.1:8000/api/analyze-chords";

    Taro.uploadFile({
      url: backendUrl,
      filePath: audioUrl,
      name: "file",
      success: (res) => {
        try {
          const data = JSON.parse(res.data) as AnalyzeChordResponse;
          if (data.status === "success") {
            setChords(data.data);
            setWaveform(data.waveform_data ?? []);
            setStatus("人声分离及和弦分析完成！");

            if (data.accompaniment_url) {
              // 开发环境把 localhost 替换成 127.0.0.1，减少调试兼容问题
              setAccompUrl(
                data.accompaniment_url.replace("localhost", "127.0.0.1"),
              );
            }
            return;
          }

          setStatus("分析失败: " + data.message);
        } catch {
          setStatus("解析响应失败");
        }
      },
      fail: (err) => {
        setStatus(
          "请求失败: " +
            err.errMsg +
            "。确保手机与电脑在同一局域网并正确配置 API IP。",
        );
      },
      complete: () => {
        setIsLoading(false);
      },
    });
  };

  const togglePlayOriginal = () => {
    if (!audioUrl) return;

    if (isPlayingOriginal) {
      originalAudioContext.current.pause();
      setIsPlayingOriginal(false);
      return;
    }

    if (isPlayingAccomp) {
      innerAudioContext.current.pause();
      setIsPlayingAccomp(false);
    }
    originalAudioContext.current.play();
    setIsPlayingOriginal(true);
  };

  const togglePlayAccomp = () => {
    if (!accompUrl) return;

    if (isPlayingAccomp) {
      innerAudioContext.current.pause();
      setIsPlayingAccomp(false);
      return;
    }

    if (isPlayingOriginal) {
      originalAudioContext.current.pause();
      setIsPlayingOriginal(false);
    }
    innerAudioContext.current.play();
    setIsPlayingAccomp(true);
  };

  const handleTimelineScroll = (event: any) => {
    scrollLeftRef.current = event.detail.scrollLeft;
    if (isScrubbing) {
      setScrollLeft(event.detail.scrollLeft);
    }
  };

  const handleTimelineTouchStart = () => {
    wasPlayingOriginalRef.current = isPlayingOriginal;
    wasPlayingAccompRef.current = isPlayingAccomp;
    setIsScrubbing(true);
    isScrubbingRef.current = true;

    if (isPlayingOriginal) {
      originalAudioContext.current.pause();
    }
    if (isPlayingAccomp) {
      innerAudioContext.current.pause();
    }
  };

  const handleTimelineTouchEnd = () => {
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    const targetTime = scrollLeftRef.current / PX_PER_SEC;

    if (targetTime < 0) return;

    if (audioUrl) {
      originalAudioContext.current.seek(targetTime);
    }
    if (accompUrl) {
      innerAudioContext.current.seek(targetTime);
    }

    if (wasPlayingOriginalRef.current) {
      setTimeout(() => originalAudioContext.current.play(), 16);
    } else if (wasPlayingAccompRef.current) {
      setTimeout(() => innerAudioContext.current.play(), 16);
    }
  };

  const timelineWidth = getTimelineWidth(chords, waveform);
  const editorHeight = getEditorHeight(screenWidth);

  return (
    <View className="chord-page">
      <View className="container">
        <Text className="title">🎵 吉他伴奏和弦识别</Text>

        <View className="controls">
          <Button
            className={`btn ${isRecording ? "recording" : ""}`}
            onClick={startRecord}
          >
            {isRecording ? "停止录制 🛑" : "录制音频 (麦克风)"}
          </Button>

          <Button
            className="btn analyze"
            disabled={!audioUrl || isLoading || isRecording}
            onClick={analyzeAudio}
          >
            分析此音频和弦 (自动去人声)
          </Button>

          {audioUrl && !isRecording && (
            <Button className="btn original" onClick={togglePlayOriginal}>
              {isPlayingOriginal ? "⏸️ 暂停原版录音" : "▶️ 播放原版录音"}
            </Button>
          )}

          {accompUrl && (
            <Button className="btn accomp" onClick={togglePlayAccomp}>
              {isPlayingAccomp ? "⏸️ 暂停纯伴奏" : "🎵 试听纯伴奏"}
            </Button>
          )}
        </View>

        <View className="status-section">
          {isLoading && <View className="loader"></View>}
          <Text className="status-text">{status}</Text>
        </View>

        {chords.length > 0 && (
          <TimelineEditor
            chords={chords}
            waveform={waveform}
            screenWidth={screenWidth}
            scrollLeft={scrollLeft}
            timelineWidth={timelineWidth}
            editorHeight={editorHeight}
            isScrubbing={isScrubbing}
            onScroll={handleTimelineScroll}
            onTouchStart={handleTimelineTouchStart}
            onTouchEnd={handleTimelineTouchEnd}
          />
        )}

        <View className="chord-list">
          {chords.map((chord, idx) => (
            <View key={idx} className="chord-list-item">
              <Text className="chord-list-name">{chord.chord}</Text>
              <Text className="chord-list-time">
                [{chord.start}s - {chord.end}s]
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

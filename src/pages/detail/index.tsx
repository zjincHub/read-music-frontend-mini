import { useEffect, useRef, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { API_BASE_URL } from "../../config";
import TimelineEditor from "../chord/components/TimelineEditor";
import { PX_PER_SEC } from "../chord/constants";
import type { TaskDetail } from "../chord/types";
import { getEditorHeight, getTimelineWidth } from "../chord/utils";
import "../chord/index.scss";

export default function ChordDetail() {
  const router = useRouter();
  const { id } = router.params;

  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [isPlayingAccomp, setIsPlayingAccomp] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(375);

  const scrollLeftRef = useRef(0);
  const isScrubbingRef = useRef(false);
  const playbackSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const innerAudioContext = useRef<any>(null); // Accompaniment
  const originalAudioContext = useRef<any>(null); // Original

  useEffect(() => {
    const sysInfo = Taro.getSystemInfoSync();
    setScreenWidth(sysInfo.windowWidth);

    innerAudioContext.current = Taro.createInnerAudioContext();
    originalAudioContext.current = Taro.createInnerAudioContext();

    fetchDetail();

    return () => {
      innerAudioContext.current?.destroy();
      originalAudioContext.current?.destroy();
      if (playbackSyncTimerRef.current)
        clearInterval(playbackSyncTimerRef.current);
    };
  }, []);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/tasks/${id}`,
        method: "GET",
      });
      if (res.statusCode === 200) {
        const data = res.data as TaskDetail;
        setDetail(data);
        if (data.audio_url) originalAudioContext.current.src = data.audio_url;
        if (data.accompaniment_url)
          innerAudioContext.current.src = data.accompaniment_url;
      }
    } catch (err) {
      Taro.showToast({ title: "加载详情失败", icon: "none" });
    }
  };

  useEffect(() => {
    const activeAudioContext = isPlayingOriginal
      ? originalAudioContext.current
      : isPlayingAccomp
        ? innerAudioContext.current
        : null;

    if (playbackSyncTimerRef.current)
      clearInterval(playbackSyncTimerRef.current);
    if (!activeAudioContext) return;

    playbackSyncTimerRef.current = setInterval(() => {
      if (isScrubbingRef.current) return;
      const nextScrollLeft = activeAudioContext.currentTime * PX_PER_SEC;
      scrollLeftRef.current = nextScrollLeft;
      setScrollLeft(nextScrollLeft);
    }, 33);
  }, [isPlayingOriginal, isPlayingAccomp]);

  const togglePlayOriginal = () => {
    if (isPlayingOriginal) {
      originalAudioContext.current.pause();
      setIsPlayingOriginal(false);
    } else {
      if (isPlayingAccomp) {
        innerAudioContext.current.pause();
        setIsPlayingAccomp(false);
      }
      originalAudioContext.current.play();
      setIsPlayingOriginal(true);
    }
  };

  const togglePlayAccomp = () => {
    if (isPlayingAccomp) {
      innerAudioContext.current.pause();
      setIsPlayingAccomp(false);
    } else {
      if (isPlayingOriginal) {
        originalAudioContext.current.pause();
        setIsPlayingOriginal(false);
      }
      innerAudioContext.current.play();
      setIsPlayingAccomp(true);
    }
  };

  const handleTimelineScroll = (event: any) => {
    scrollLeftRef.current = event.detail.scrollLeft;
    if (isScrubbing) setScrollLeft(event.detail.scrollLeft);
  };

  const handleTimelineTouchStart = () => {
    setIsScrubbing(true);
    isScrubbingRef.current = true;
    originalAudioContext.current.pause();
    innerAudioContext.current.pause();
  };

  const handleTimelineTouchEnd = () => {
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    const targetTime = scrollLeftRef.current / PX_PER_SEC;
    originalAudioContext.current.seek(targetTime);
    innerAudioContext.current.seek(targetTime);

    if (isPlayingOriginal)
      setTimeout(() => originalAudioContext.current.play(), 50);
    if (isPlayingAccomp) setTimeout(() => innerAudioContext.current.play(), 50);
  };

  if (!detail)
    return (
      <View className="chord-page">
        <Text>详情加载中...</Text>
      </View>
    );

  const timelineWidth = getTimelineWidth(
    detail.chords || [],
    detail.waveform || [],
  );
  const editorHeight = getEditorHeight(screenWidth);

  return (
    <View className="chord-page">
      <View className="container">
        <Text className="title">🎵 和弦分析详情</Text>
        <Text className="subtitle">{detail.filename}</Text>

        <View className="controls">
          <Button className="btn original" onClick={togglePlayOriginal}>
            {isPlayingOriginal ? "⏸️ 暂停原音" : "▶️ 播放原音"}
          </Button>
          {detail.status === "success" && (
            <Button className="btn accomp" onClick={togglePlayAccomp}>
              {isPlayingAccomp ? "⏸️ 暂停伴奏" : "🎵 试听纯伴奏"}
            </Button>
          )}
        </View>

        {detail.status === "success" && detail.chords && (
          <TimelineEditor
            chords={detail.chords}
            waveform={detail.waveform || []}
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
      </View>
    </View>
  );
}

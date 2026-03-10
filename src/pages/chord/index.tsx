import { useState, useEffect, useRef } from "react";
import { View, Text, Button, ScrollView, Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

export default function ChordRecognition() {
  const CHORD_TRACK_RPX = 160;
  const EDITOR_HEIGHT_RPX = 500;
  const WAVE_BASELINE_COLOR = "#2b2b2b";
  const WAVE_BAR_COLOR = "#b3b3b3";

  const [status, setStatus] = useState("请录制音频进行识别...");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chords, setChords] = useState<any[]>([]);
  const [waveform, setWaveform] = useState<number[]>([]);

  const [audioUrl, setAudioUrl] = useState("");
  const [accompUrl, setAccompUrl] = useState("");
  const [isPlayingAccomp, setIsPlayingAccomp] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);

  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(375);
  // Using refs for real-time tracking avoiding dependency loops
  const isScrubbingRef = useRef(false);
  const scrollLeftRef = useRef(0);
  const pxPerSec = 50;
  const timelineCanvasRef = useRef<any>(null);
  const timelineCanvasSizeRef = useRef({ width: 0, height: 0 });
  const playbackSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const wasPlayingOriginalRef = useRef(false);
  const wasPlayingAccompRef = useRef(false);

  // Audio Contexts
  const innerAudioContext = useRef<any>(null); // For accompaniment
  const originalAudioContext = useRef<any>(null); // For original recording
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
      const { tempFilePath } = res;
      setStatus("录音已完成。");
      setAudioUrl(tempFilePath);
    });

    recorderManager.current.onError((err) => {
      setIsRecording(false);
      setStatus("录音失败: " + err.errMsg);
    });

    return () => {
      if (innerAudioContext.current) {
        innerAudioContext.current.destroy();
      }
      if (originalAudioContext.current) {
        originalAudioContext.current.destroy();
      }
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
      const nextScrollLeft = activeAudioContext.currentTime * pxPerSec;
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

  const startRecord = () => {
    if (isRecording) {
      recorderManager.current.stop();
    } else {
      // Must request auth implicitly by calling start or explicitly
      recorderManager.current.start({
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: "wav",
      });
    }
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

    if (isPlayingAccomp) {
      innerAudioContext.current.stop();
      setIsPlayingAccomp(false);
    }
    if (isPlayingOriginal) {
      originalAudioContext.current.stop();
      setIsPlayingOriginal(false);
    }

    // Notice: Replace URL with the actual backend domain if releasing to prod!
    const backendUrl = "http://127.0.0.1:8000/api/analyze-chords";

    Taro.uploadFile({
      url: backendUrl,
      filePath: audioUrl,
      name: "file",
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.status === "success") {
            setChords(data.data);
            if (data.waveform_data) {
              setWaveform(data.waveform_data);
            }
            setStatus("人声分离及和弦分析完成！");
            if (data.accompaniment_url) {
              // Convert localhost to 127.0.0.1 for better compat in DevTools if needed, or mapped IP
              // In real device testing, this needs to be an external accessible IP/domain.
              const validUrl = data.accompaniment_url.replace(
                "localhost",
                "127.0.0.1",
              );
              setAccompUrl(validUrl);
            }
          } else {
            setStatus("分析失败: " + data.message);
          }
        } catch (e) {
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
    if (!accompUrl) return;

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

  const handleScroll = (e) => {
    scrollLeftRef.current = e.detail.scrollLeft;
    if (isScrubbing) {
      setScrollLeft(e.detail.scrollLeft);
    }
  };

  const handleTouchStart = () => {
    wasPlayingOriginalRef.current = isPlayingOriginal;
    wasPlayingAccompRef.current = isPlayingAccomp;
    setIsScrubbing(true);
    isScrubbingRef.current = true;
    if (isPlayingOriginal) originalAudioContext.current.pause();
    if (isPlayingAccomp) innerAudioContext.current.pause();
  };

  const handleTouchEnd = () => {
    setIsScrubbing(false);
    isScrubbingRef.current = false;
    const targetTime = scrollLeftRef.current / pxPerSec;

    if (targetTime >= 0) {
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
    }
  };

  // Define a color generator based on chord name
  const getChordColor = (chordName) => {
    let hash = 0;
    for (let i = 0; i < chordName.length; i++)
      hash = chordName.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    const isMinor = chordName.includes("m");
    return `hsla(${hue > 0 ? hue : hue + 360}, ${isMinor ? 50 : 80}%, 60%, 0.4)`;
  };

  useEffect(() => {
    if (!chords.length) return;

    const timer = setTimeout(() => {
      const drawTimeline = () => {
        const canvas = timelineCanvasRef.current;
        const { width: cssWidth, height: cssHeight } =
          timelineCanvasSizeRef.current;

        if (!canvas || !cssWidth || !cssHeight) return;

        const ctx = canvas.getContext("2d");
        const chordTrackHeight = (CHORD_TRACK_RPX * screenWidth) / 750;
        const waveTrackHeight = cssHeight - chordTrackHeight;
        const waveTop = chordTrackHeight;
        const waveMid = waveTop + waveTrackHeight / 2;

        ctx.clearRect(0, 0, cssWidth, cssHeight);

        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, cssWidth, chordTrackHeight);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, waveTop, cssWidth, waveTrackHeight);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, chordTrackHeight + 0.5);
        ctx.lineTo(cssWidth, chordTrackHeight + 0.5);
        ctx.stroke();

        ctx.strokeStyle = WAVE_BASELINE_COLOR;
        ctx.beginPath();
        ctx.moveTo(0, waveMid + 0.5);
        ctx.lineTo(cssWidth, waveMid + 0.5);
        ctx.stroke();

        chords.forEach((chord) => {
          const left = chord.start * pxPerSec;
          const width = Math.max((chord.end - chord.start) * pxPerSec, 1);

          ctx.fillStyle = getChordColor(chord.chord);
          ctx.fillRect(left, 0, width, chordTrackHeight);

          ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            left + 0.5,
            0.5,
            Math.max(width - 1, 0),
            chordTrackHeight - 1,
          );

          if (width >= 28) {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(chord.chord, left + 6, 8);
          }

          if (width >= 44) {
            ctx.fillStyle = "#ccc";
            ctx.font = "11px sans-serif";
            ctx.fillText(`${chord.start}s`, left + 6, 28);
          }
        });

        if (waveform.length > 0) {
          ctx.strokeStyle = WAVE_BAR_COLOR;
          ctx.lineWidth = 1;
          waveform.forEach((val, idx) => {
            const amplitude = Math.max(
              Math.min((val * waveTrackHeight) / 2, waveTrackHeight / 2),
              1,
            );
            ctx.beginPath();
            ctx.moveTo(idx + 0.5, waveMid - amplitude);
            ctx.lineTo(idx + 0.5, waveMid + amplitude);
            ctx.stroke();
          });
        }

        const playheadX = scrollLeft;
        const playheadRadius = 8;
        ctx.strokeStyle = "#ff3b30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX + 0.5, 0);
        ctx.lineTo(playheadX + 0.5, cssHeight);
        ctx.stroke();

        if (playheadX >= -playheadRadius && playheadX <= cssWidth + playheadRadius) {
          ctx.fillStyle = "#ff3b30";
          ctx.beginPath();
          ctx.arc(playheadX, playheadRadius, playheadRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            playheadX,
            cssHeight - playheadRadius,
            playheadRadius,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      };

      if (timelineCanvasRef.current) {
        drawTimeline();
        return;
      }

      const query = Taro.createSelectorQuery();
      query
        .select("#timeline-canvas")
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvasInfo = res?.[0];
          const canvas = canvasInfo?.node;
          const cssWidth = canvasInfo?.width;
          const cssHeight = canvasInfo?.height;

          if (!canvas || !cssWidth || !cssHeight) return;

          const ctx = canvas.getContext("2d");
          const dpr = Taro.getSystemInfoSync().pixelRatio || 1;

          canvas.width = cssWidth * dpr;
          canvas.height = cssHeight * dpr;
          ctx.scale(dpr, dpr);

          timelineCanvasRef.current = canvas;
          timelineCanvasSizeRef.current = { width: cssWidth, height: cssHeight };

          drawTimeline();
        });
    }, 0);

    return () => clearTimeout(timer);
  }, [chords, waveform, screenWidth, scrollLeft]);

  // Calculate the total duration from the last chord's end time
  const totalDuration = chords.length > 0 ? chords[chords.length - 1].end : 1;
  const timelineWidth = Math.max(totalDuration * 50, waveform.length, 300);
  const editorHeight = (EDITOR_HEIGHT_RPX * screenWidth) / 750;

  useEffect(() => {
    timelineCanvasRef.current = null;
    timelineCanvasSizeRef.current = { width: 0, height: 0 };
  }, [timelineWidth, editorHeight]);

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
          <View className="editor-container">
            <ScrollView
              className="tracks-scroll-view"
              scrollX
              scrollLeft={scrollLeft}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <View
                className="tracks-content"
                style={{
                  width: `${timelineWidth}px`,
                  paddingLeft: `${screenWidth / 2}px`,
                  paddingRight: `${screenWidth / 2}px`,
                }}
              >
                <Canvas
                  id="timeline-canvas"
                  type="2d"
                  className="timeline-canvas"
                  style={{
                    width: `${timelineWidth}px`,
                    height: `${editorHeight}px`,
                  }}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

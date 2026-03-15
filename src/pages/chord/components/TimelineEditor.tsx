import { useEffect, useRef } from "react";
import { Canvas, ScrollView, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import {
  PLAYHEAD_CANVAS_RPX,
  PLAYHEAD_COLOR,
  PLAYHEAD_RADIUS_PX,
  PX_PER_SEC,
  WAVE_BAR_COLOR,
  WAVE_BASELINE_COLOR,
} from "../constants";
import type { ChordSegment } from "../types";
import { getChordColor, getChordTrackHeight } from "../utils";

interface TimelineEditorProps {
  chords: ChordSegment[];
  waveform: number[];
  screenWidth: number;
  scrollLeft: number;
  timelineWidth: number;
  editorHeight: number;
  isScrubbing: boolean;
  onScroll: (event: any) => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

export default function TimelineEditor({
  chords,
  waveform,
  screenWidth,
  scrollLeft,
  timelineWidth,
  editorHeight,
  isScrubbing,
  onScroll,
  onTouchStart,
  onTouchEnd,
}: TimelineEditorProps) {
  const staticCanvasRef = useRef<any>(null);
  const staticCanvasSizeRef = useRef({ width: 0, height: 0 });
  const playheadCanvasRef = useRef<any>(null);
  const playheadCanvasSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    staticCanvasRef.current = null;
    staticCanvasSizeRef.current = { width: 0, height: 0 };
  }, [timelineWidth, editorHeight]);

  useEffect(() => {
    playheadCanvasRef.current = null;
    playheadCanvasSizeRef.current = { width: 0, height: 0 };
  }, [editorHeight]);

  useEffect(() => {
    if (!chords.length) return;

    const timer = setTimeout(() => {
      const drawStaticTimeline = () => {
        const canvas = staticCanvasRef.current;
        const { width: cssWidth, height: cssHeight } =
          staticCanvasSizeRef.current;

        if (!canvas || !cssWidth || !cssHeight) return;

        const ctx = canvas.getContext("2d");
        const chordTrackHeight = getChordTrackHeight(screenWidth);
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
          const left = chord.start * PX_PER_SEC;
          const width = Math.max((chord.end - chord.start) * PX_PER_SEC, 1);

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

        waveform.forEach((val, idx) => {
          const amplitude = Math.max(
            Math.min((val * waveTrackHeight) / 2, waveTrackHeight / 2),
            1,
          );
          ctx.strokeStyle = WAVE_BAR_COLOR;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(idx + 0.5, waveMid - amplitude);
          ctx.lineTo(idx + 0.5, waveMid + amplitude);
          ctx.stroke();
        });
      };

      if (staticCanvasRef.current) {
        drawStaticTimeline();
        return;
      }

      Taro.createSelectorQuery()
        .select("#timeline-static-canvas")
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

          staticCanvasRef.current = canvas;
          staticCanvasSizeRef.current = { width: cssWidth, height: cssHeight };
          drawStaticTimeline();
        });
    }, 0);

    return () => clearTimeout(timer);
  }, [chords, waveform, screenWidth]);

  useEffect(() => {
    if (!chords.length) return;

    const timer = setTimeout(() => {
      const drawPlayhead = () => {
        const canvas = playheadCanvasRef.current;
        const { width: cssWidth, height: cssHeight } =
          playheadCanvasSizeRef.current;

        if (!canvas || !cssWidth || !cssHeight) return;

        const ctx = canvas.getContext("2d");
        const centerX = cssWidth / 2;

        ctx.clearRect(0, 0, cssWidth, cssHeight);
        ctx.strokeStyle = PLAYHEAD_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX + 0.5, 0);
        ctx.lineTo(centerX + 0.5, cssHeight);
        ctx.stroke();

        ctx.fillStyle = PLAYHEAD_COLOR;
        ctx.beginPath();
        ctx.arc(
          centerX,
          PLAYHEAD_RADIUS_PX,
          PLAYHEAD_RADIUS_PX,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          centerX,
          cssHeight - PLAYHEAD_RADIUS_PX,
          PLAYHEAD_RADIUS_PX,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      };

      if (playheadCanvasRef.current) {
        drawPlayhead();
        return;
      }

      Taro.createSelectorQuery()
        .select("#timeline-playhead-canvas")
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

          playheadCanvasRef.current = canvas;
          playheadCanvasSizeRef.current = {
            width: cssWidth,
            height: cssHeight,
          };
          drawPlayhead();
        });
    }, 0);

    return () => clearTimeout(timer);
  }, [chords, screenWidth]);

  return (
    <View className="editor-container">
      <ScrollView
        className="tracks-scroll-view"
        scrollX
        scrollLeft={scrollLeft}
        enhanced={!isScrubbing}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
            id="timeline-static-canvas"
            type="2d"
            className="timeline-canvas"
            style={{
              width: `${timelineWidth}px`,
              height: `${editorHeight}px`,
            }}
          />
        </View>
      </ScrollView>
      <View className="playhead-overlay">
        <Canvas
          id="timeline-playhead-canvas"
          type="2d"
          className="playhead-canvas"
          style={{
            width: `${(PLAYHEAD_CANVAS_RPX * screenWidth) / 750}px`,
            height: `${editorHeight}px`,
          }}
        />
      </View>
    </View>
  );
}

import {
  CHORD_TRACK_RPX,
  EDITOR_HEIGHT_RPX,
  PX_PER_SEC,
} from "./constants";
import type { ChordSegment } from "./types";

export function getChordColor(chordName: string) {
  let hash = 0;
  for (let i = 0; i < chordName.length; i += 1) {
    hash = chordName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  const isMinor = chordName.includes("m");
  return `hsla(${hue > 0 ? hue : hue + 360}, ${isMinor ? 50 : 80}%, 60%, 0.4)`;
}

export function getTimelineWidth(
  chords: ChordSegment[],
  waveform: number[],
  pxPerSec = PX_PER_SEC,
) {
  const totalDuration = chords.length > 0 ? chords[chords.length - 1].end : 1;
  return Math.max(totalDuration * pxPerSec, waveform.length, 300);
}

export function getEditorHeight(screenWidth: number) {
  return (EDITOR_HEIGHT_RPX * screenWidth) / 750;
}

export function getChordTrackHeight(screenWidth: number) {
  return (CHORD_TRACK_RPX * screenWidth) / 750;
}

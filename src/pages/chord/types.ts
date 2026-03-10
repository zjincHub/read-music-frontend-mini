export interface ChordSegment {
  chord: string;
  start: number;
  end: number;
}

export interface AnalyzeChordResponse {
  status: string;
  data: ChordSegment[];
  waveform_data?: number[];
  accompaniment_url?: string;
  message?: string;
}

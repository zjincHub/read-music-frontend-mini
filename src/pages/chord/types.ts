export interface ChordSegment {
  chord: string;
  start: number;
  end: number;
}

export interface TaskItem {
  id: string;
  status: "pending" | "processing" | "success" | "failed";
  filename: string;
  created_at: string;
}

export interface TaskDetail extends TaskItem {
  audio_url?: string;
  chords?: ChordSegment[];
  waveform?: number[];
  accompaniment_url?: string;
  error_message?: string;
}

export interface AnalyzeChordResponse {
  status: string;
  task_id?: string;
  message?: string;
}

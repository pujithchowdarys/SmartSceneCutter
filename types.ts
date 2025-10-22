
export enum ClipType {
  Manual = 'Manual',
  AI = 'AI-detected',
}

export interface Clip {
  startTime: string; // HH:MM:SS
  endTime: string;   // HH:MM:SS
  type: ClipType;
  description: string;
}

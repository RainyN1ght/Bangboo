
export enum RobotMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  MUSIC = 'MUSIC',
  SLEEP = 'SLEEP',
  OFF = 'OFF'
}

export enum ScreenMode {
  HOME = 'HOME', // The default face/eyes
  MENU = 'MENU', // App grid
  MUSIC = 'MUSIC',
  CLOCK = 'CLOCK',
  STATUS = 'STATUS',
  CHAT = 'CHAT'
}

export enum EyeExpression {
  NORMAL = 'NORMAL',
  HAPPY = 'HAPPY',
  SURPRISED = 'SURPRISED',
  DEAD = 'DEAD', // x_x
  SLEEPING = 'SLEEPING', // -_-
  LOADING = 'LOADING',
  MUSIC = 'MUSIC',
  HEART = 'HEART',
  LISTENING = 'LISTENING',
  WINKING = 'WINKING',
  THINKING = 'THINKING',
  WIDE = 'WIDE'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string; // Display string
  url?: string; // URL for local playback (Blob URL)
}
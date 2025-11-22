export interface Message {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  isMe: boolean;
}

export interface User {
  name: string;
  roomCode: string;
  isHost: boolean;
}

export type Theme = 'light' | 'dark';

export enum ChatStatus {
  IDLE = 'IDLE',
  JOINING = 'JOINING',
  CHATTING = 'CHATTING',
}